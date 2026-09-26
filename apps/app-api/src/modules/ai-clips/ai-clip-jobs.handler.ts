import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { resolveRenderTmpDir } from 'src/config/runtime-config';
import {
  AssetKind,
  AssetOrigin,
  GenerationFailureCode,
  GenerationJobType,
  SceneClipMode,
} from 'src/graphql/generated/graphql';
import { AssetsService } from '../assets/assets.service';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import {
  GenerationJobError,
  type GenerationJobContext,
  type GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { RenderService } from '../render/render.service';
import { S3Service } from '../s3/s3.service';
import { MiniMaxVideoProvider } from '../video/providers/minimax-video.provider';
import {
  VIDEO_JOB_TIMEOUT_MS,
  videoProviderErrors,
  type VideoImageRole,
  type VideoProvider,
  type VideoTaskImage,
} from '../video/video.types';
import {
  CLIP_CREDIT_COST,
  clipSecondsFor,
  LEGACY_CLIP_SECONDS,
  MAX_CLIPS_PER_REQUEST,
} from './ai-clips.service';
import {
  buildAiClipFrameStorageKey,
  buildAiClipStorageKey,
} from './ai-clip-storage';

const LABELS = ['A', 'B'];
/** Clip jobs made before the count existed asked for two clips (R20). */
const LEGACY_CLIP_COUNT = 2;
/** A clip shorter than this is not a usable scene. */
const MIN_CLIP_MS = 2000;
/** Consecutive status-check errors before a task counts as failed. */
const MAX_POLL_ERRORS = 3;

type Outcome =
  | { label: string; taskId: string; url: string }
  | { label: string; taskId: string | null; failure: 'failed' | 'timeout' };

/**
 * Makes AI scene clips in the media worker (Product Specification §3.18).
 * The video service is called first; each clip is stored and recorded only
 * after it was downloaded and verified, and the job is charged only for the
 * clips it made.
 */
@Injectable()
export class AiClipJobsHandler implements OnModuleInit {
  private readonly logger = new Logger(AiClipJobsHandler.name);
  /** Overridable in specs. */
  pollMs = 10_000;
  timeoutMs = VIDEO_JOB_TIMEOUT_MS;

  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly assetsService: AssetsService,
    private readonly s3Service: S3Service,
    private readonly renderService: RenderService,
    private readonly configService: ConfigService,
    private readonly provider: MiniMaxVideoProvider,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.GENERATE_SCENE_CLIPS, {
      run: (job, context) => this.run(job, context),
    });
  }

  async run(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const provider: VideoProvider = this.provider;
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };
    const { sceneId, prompt } = job.input;
    const describe = job.input.clipMode === SceneClipMode.DESCRIBE;
    const inputs = inputsOf(job);
    const labels = LABELS.slice(
      0,
      Math.min(MAX_CLIPS_PER_REQUEST, job.input.clipCount ?? LEGACY_CLIP_COUNT),
    );
    // Describe only sends no image; a story's one-click clip may send only
    // the still of the scene before (§3.23).
    const continuityAssetId = describe ? null : job.input.continuityAssetId;
    const { continuitySeconds } = job.input;

    if (!provider.isConfigured()) throw videoProviderErrors.notConfigured();
    if (
      !sceneId ||
      !prompt ||
      !labels.length ||
      (!inputs.length && !continuityAssetId && !describe)
    ) {
      throw new GenerationJobError(
        GenerationFailureCode.INTERNAL,
        'The clip request is incomplete.',
      );
    }

    const media = await this.assetsService.mediaRecords(job.projectId, owner);
    const photos = new Map(
      media
        .filter(
          (asset) =>
            asset.kind === AssetKind.PHOTO &&
            (asset.origin ?? AssetOrigin.UPLOAD) === AssetOrigin.UPLOAD,
        )
        .map((asset) => [asset.id, asset]),
    );
    const sources = inputs.map((input) => ({
      ...input,
      asset: photos.get(input.assetId),
      stillAt: null as number | null,
    }));

    // A one-click clip also follows the scene before it (§3.21): a still of
    // that scene's photo or clip (which may be an AI clip), sent last.
    if (continuityAssetId) {
      const asset = media.find((item) => item.id === continuityAssetId);

      sources.push({
        assetId: continuityAssetId,
        role: 'reference_image',
        asset,
        stillAt:
          asset?.kind === AssetKind.CLIP ? (continuitySeconds ?? 0) : null,
      });
    }

    if (sources.some((source) => !source.asset)) throw missingPhoto();

    const deadline = Date.now() + this.timeoutMs;
    const directory = await mkdtemp(
      join(resolveRenderTmpDir(this.configService), 'clips-'),
    );
    const storedFrames: string[] = [];
    // The clip carries the most recent rights confirmation of its inputs, or
    // the request's own time when it was made from the description alone.
    const rightsConfirmedAt = sources.length
      ? new Date(
          Math.max(
            ...sources.map((source) =>
              source.asset!.rightsConfirmedAt.getTime(),
            ),
          ),
        )
      : new Date(job.createdAt);

    try {
      await context.setStep(0);

      const images: VideoTaskImage[] = [];

      for (const [index, source] of sources.entries()) {
        const photoPath = join(directory, `source-${index}`);
        const framePath = join(directory, `frame-${index}.jpg`);
        const frameKey = buildAiClipFrameStorageKey(
          job.projectId,
          job.id,
          index,
        );

        if (
          !(await this.s3Service.downloadObjectToFile(
            source.asset!.storageKey,
            photoPath,
          ))
        ) {
          throw missingPhoto();
        }

        if (source.stillAt === null) {
          await this.renderService.portraitFrame(photoPath, framePath);
        } else {
          await this.renderService.portraitStill(
            photoPath,
            source.stillAt,
            framePath,
          );
        }
        await this.s3Service.putObjectFromFile(
          frameKey,
          framePath,
          'image/jpeg',
        );
        storedFrames.push(frameKey);
        images.push({
          url: await this.s3Service.createPresignedGetUrl(frameKey, 900),
          role: source.role,
        });
      }

      const created = await Promise.allSettled(
        labels.map(() =>
          provider.createTask({
            images,
            prompt,
            durationSeconds: clipSecondsFor(
              job.input.clipSeconds ?? LEGACY_CLIP_SECONDS,
            ),
            resolution: '480P',
          }),
        ),
      );

      if (created.every((result) => result.status === 'rejected')) {
        const [first] = created as PromiseRejectedResult[];
        throw first.reason instanceof GenerationJobError
          ? first.reason
          : videoProviderErrors.rejected();
      }

      await context.setStep(1);

      const outcomes = await Promise.all(
        created.map((result, index): Promise<Outcome> =>
          result.status === 'fulfilled'
            ? this.waitFor(labels[index], result.value, deadline)
            : Promise.resolve({
                label: labels[index],
                taskId: null,
                failure: 'failed',
              }),
        ),
      );

      await context.setStep(2);

      let made = 0;

      for (const outcome of outcomes) {
        if (!('url' in outcome)) continue;

        const stored = await this.store(
          outcome,
          job,
          directory,
          rightsConfirmedAt,
          provider,
        );
        if (stored) made += 1;
      }

      if (made === 0) {
        throw outcomes.some(
          (outcome) => 'failure' in outcome && outcome.failure === 'timeout',
        )
          ? videoProviderErrors.timeout()
          : outcomes.some((outcome) => 'failure' in outcome)
            ? videoProviderErrors.rejected()
            : videoProviderErrors.unusable();
      }

      return { creditsUsed: made * CLIP_CREDIT_COST };
    } catch (error) {
      if (error instanceof GenerationJobError) throw error;

      this.logger.error(`Clip job ${job.id} failed unexpectedly.`, error);
      throw new GenerationJobError(
        GenerationFailureCode.INTERNAL,
        'Something went wrong on our side.',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
      for (const frameKey of storedFrames) {
        await this.s3Service
          .deleteObject(frameKey)
          .catch((error: Error) =>
            this.logger.warn(
              `Could not delete clip frame ${frameKey}: ${error.message}`,
            ),
          );
      }
    }
  }

  /** Polls one task until it finishes, fails, or the job's deadline passes. */
  private async waitFor(
    label: string,
    taskId: string,
    deadline: number,
  ): Promise<Outcome> {
    let errors = 0;

    for (;;) {
      try {
        const state = await this.provider.getTask(taskId);
        errors = 0;

        if (state.status === 'succeeded')
          return { label, taskId, url: state.url };
        if (state.status === 'failed')
          return { label, taskId, failure: 'failed' };
      } catch (error) {
        errors += 1;
        this.logger.warn(
          `Clip task ${taskId} check failed: ${(error as Error).message}`,
        );
        if (errors >= MAX_POLL_ERRORS)
          return { label, taskId, failure: 'failed' };
      }

      if (Date.now() + this.pollMs > deadline) {
        return { label, taskId, failure: 'timeout' };
      }

      await sleep(this.pollMs);
    }
  }

  /** Downloads, verifies and stores one clip; false when it isn't usable. */
  private async store(
    outcome: { label: string; taskId: string; url: string },
    job: GenerationJobRecord,
    directory: string,
    rightsConfirmedAt: Date,
    provider: VideoProvider,
  ): Promise<boolean> {
    const path = join(directory, `clip-${outcome.label}.mp4`);

    try {
      const sizeBytes = await provider.download(outcome.url, path);
      const probe = await this.renderService.probe(path);

      if (!probe.videoCodec || probe.durationMs < MIN_CLIP_MS) return false;

      const id = new Types.ObjectId().toHexString();
      const storageKey = buildAiClipStorageKey(job.projectId, id);

      await this.s3Service.putObjectFromFile(storageKey, path, 'video/mp4');
      await this.assetsService.createGeneratedClip({
        id,
        owner: { ownerId: job.ownerId, organizationId: job.organizationId },
        projectId: job.projectId,
        storageKey,
        fileName: `ai-clip-${job.id.slice(-4)}-${outcome.label.toLowerCase()}.mp4`,
        sizeBytes,
        durationSeconds: Math.round(probe.durationMs / 100) / 10,
        rightsConfirmedAt,
        aiClip: {
          jobId: job.id,
          sceneId: job.input.sceneId ?? '',
          // Null when no photo was sent (Describe only, or a story's
          // one-click clip from the still alone).
          sourceAssetId: job.input.sourceAssetId ?? null,
          mode: job.input.clipMode ?? SceneClipMode.FIRST_FRAME,
          endAssetId: job.input.endAssetId ?? null,
          referenceAssetIds: job.input.referenceAssetIds ?? [],
          continuitySceneId: job.input.continuitySceneId ?? null,
          continuityAssetId: job.input.continuityAssetId ?? null,
          label: outcome.label,
          prompt: job.input.prompt ?? '',
          model: provider.model(),
          providerTaskId: outcome.taskId,
        },
      });

      return true;
    } catch (error) {
      this.logger.warn(
        `Clip ${outcome.label} of job ${job.id} was not kept: ${(error as Error).message}`,
      );
      return false;
    }
  }
}

/**
 * The request's photos with the role each plays, in request order (R23). A
 * one-click clip's continuity still is added by the handler, after these.
 * Describe only sends none.
 */
function inputsOf(
  job: GenerationJobRecord,
): { assetId: string; role: VideoImageRole }[] {
  const { clipMode, sourceAssetId, endAssetId, referenceAssetIds } = job.input;

  if (clipMode === SceneClipMode.DESCRIBE) return [];
  if (
    clipMode === SceneClipMode.REFERENCES ||
    clipMode === SceneClipMode.CONSISTENT
  ) {
    return (referenceAssetIds ?? []).map((assetId) => ({
      assetId,
      role: 'reference_image',
    }));
  }
  if (!sourceAssetId) return [];
  if (clipMode === SceneClipMode.FIRST_LAST_FRAME) {
    return endAssetId
      ? [
          { assetId: sourceAssetId, role: 'first_frame' },
          { assetId: endAssetId, role: 'last_frame' },
        ]
      : [];
  }
  return [{ assetId: sourceAssetId, role: 'first_frame' }];
}

function missingPhoto() {
  return new GenerationJobError(
    GenerationFailureCode.MEDIA_MISSING,
    'A photo or clip this clip uses is missing.',
  );
}
