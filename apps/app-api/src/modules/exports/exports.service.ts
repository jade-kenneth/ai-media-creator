import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import { slugify } from 'src/common/utils/slugify';
import { resolveRenderTmpDir } from 'src/config/runtime-config';
import {
  ExportPreset,
  GenerationJobStatus,
  GenerationJobType,
  ProjectStatus,
  SceneTransition,
  VideoEditBlocker,
  type Export,
  type ExportDownload,
  type ProjectExports,
  type RenderVideoInput,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type {
  GenerationJobContext,
  GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { ProjectsService } from '../projects/projects.service';
import { RenderService } from '../render/render.service';
import { renderErrors, type RenderPlan } from '../render/render.types';
import { S3Service } from '../s3/s3.service';
import { studioOf } from '../studios/studios';
import {
  VideoEditsService,
  videoFingerprint,
  type VideoRenderSource,
} from '../video-edits/video-edits.service';
import type {
  ExportRecord,
  ExportsRepository,
} from './repositories/exports.repository';

/** Credit estimate (open decision 11; demo value). */
export const RENDER_VIDEO_COST = 2;
export const RENDER_VIDEO_STEPS = 4;
const EXPORTS_LIMIT = 50;

const BLOCKER_REASON: Record<VideoEditBlocker, string> = {
  [VideoEditBlocker.MEDIA_INCOMPLETE]: 'Choose media for every scene first.',
  [VideoEditBlocker.VOICE_NOT_SETTLED]: 'Add a voiceover first.',
  [VideoEditBlocker.VOICE_OUTDATED]: 'Generate a new voiceover first.',
  [VideoEditBlocker.FLAGGED_LINES]: 'Fix the flagged lines first.',
};

const STEP = { media: 0, audio: 1, captions: 2, encode: 3 } as const;

@Injectable()
export class ExportsService implements OnModuleInit {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    @Inject(TOKENS.EXPORTS_REPOSITORY)
    private readonly exports: ExportsRepository,
    private readonly configService: ConfigService,
    private readonly projectsService: ProjectsService,
    private readonly videoEditsService: VideoEditsService,
    private readonly jobsService: GenerationJobsService,
    private readonly handlers: GenerationJobHandlers,
    private readonly renderService: RenderService,
    private readonly s3Service: S3Service,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.RENDER_VIDEO, {
      run: (job, context) => this.runRender(job, context),
      // The request moved the project to Generating before the job ran.
      abandon: (job) =>
        this.restoreStatus(job.projectId, {
          ownerId: job.ownerId,
          organizationId: job.organizationId,
        }),
    });
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  async overview(
    projectId: string,
    owner: OwnerContext,
  ): Promise<ProjectExports> {
    await this.projectsService.getRecord(projectId, owner);

    const [records, video] = await Promise.all([
      this.records(projectId, owner),
      this.videoEditsService.get(projectId, owner),
    ]);
    const latest = records[0];

    return {
      exports: await Promise.all(
        records.map((record) => this.toGraphql(record)),
      ),
      changedSinceLatest: Boolean(
        latest && video && latest.fingerprint !== videoFingerprint(video),
      ),
    };
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /** Starts a render (2 credits) once nothing blocks it. */
  async renderVideo(
    input: RenderVideoInput,
    owner: OwnerContext,
  ): Promise<GenerationJobRecord> {
    const project = await this.projectsService.getRecord(
      input.projectId,
      owner,
    );
    const video = await this.videoEditsService.get(project.id, owner);

    if (!video) {
      throw new ConflictError('Start the video first.', {
        code: 'VIDEO_NOT_STARTED',
      });
    }

    const [blocker] = video.readiness.blocking;

    if (blocker) {
      throw new ConflictError(BLOCKER_REASON[blocker], { code: blocker });
    }

    const job = await this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: GenerationJobType.RENDER_VIDEO,
      label: 'Render video',
      stepCount: RENDER_VIDEO_STEPS,
      creditCost: RENDER_VIDEO_COST,
      input: { versionId: video.scriptVersion.id },
      idempotencyKey: input.idempotencyKey,
    });

    if (
      job.status === GenerationJobStatus.QUEUED ||
      job.status === GenerationJobStatus.RUNNING
    ) {
      await this.projectsService.setStatus(
        project.id,
        owner,
        ProjectStatus.GENERATING,
      );
    }

    return job;
  }

  /** A fresh 5-minute link; the first download marks the project Exported. */
  async createDownload(
    id: string,
    owner: OwnerContext,
  ): Promise<ExportDownload> {
    const record = await this.getRecord(id, owner);
    const project = await this.projectsService.getRecord(
      record.projectId,
      owner,
    );
    const fileName = `${slugify(project.title)}-v${record.snapshot.scriptVersionNumber}-export-${record.number}.mp4`;
    const url = await this.s3Service.createPresignedDownloadUrl(
      record.videoKey,
      fileName,
    );

    if (!record.downloadedAt) {
      await this.exports.updateOne(this.scope(owner, { id: record.id }), {
        downloadedAt: new Date(),
      });
      await this.projectsService.setStatus(
        project.id,
        owner,
        ProjectStatus.EXPORTED,
      );
      await this.syncSummary(project.id, owner);
    }

    return { url, fileName };
  }

  // ── Render job (media worker) ────────────────────────────────────────────

  async runRender(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };

    // A worker that stopped after storing the export doesn't render twice.
    if (await this.findByJob(job.id, owner)) return {};

    const workDir = await mkdtemp(
      join(resolveRenderTmpDir(this.configService), 'render-'),
    );

    try {
      const source = await this.videoEditsService.renderSource(
        job.projectId,
        owner,
      );

      if (!source || source.video.readiness.blocking.length) {
        throw renderErrors.missing();
      }

      const plan = await this.download(source, workDir);
      const result = await this.renderService.render(plan, workDir, (step) =>
        context.setStep(STEP[step]),
      );

      await this.store(job, owner, source, result);
      return {};
    } catch (error) {
      await this.restoreStatus(job.projectId, owner).catch((restoreError) =>
        this.logger.warn(
          `Could not restore status for project ${job.projectId}: ${(restoreError as Error).message}`,
        ),
      );
      throw error;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  /**
   * Copies every file the video uses into the render's working directory,
   * one at a time (a file used by several scenes is fetched once).
   */
  private async download(
    source: VideoRenderSource,
    workDir: string,
  ): Promise<RenderPlan> {
    const local = new Map<string, string>();
    const fetch = async (key: string) => {
      const existing = local.get(key);
      if (existing) return existing;

      const path = join(
        workDir,
        `input-${local.size}.${key.split('.').pop() ?? 'bin'}`,
      );
      if (!(await this.s3Service.downloadObjectToFile(key, path))) {
        throw renderErrors.missing();
      }
      local.set(key, path);
      return path;
    };
    const { video } = source;
    const scenes: RenderPlan['scenes'] = [];
    const voice: RenderPlan['voice'] = [];

    for (const scene of source.scenes) {
      scenes.push({
        durationMs: scene.durationMs,
        kind: scene.kind,
        file: scene.storageKey ? await fetch(scene.storageKey) : null,
        slowZoom: scene.slowZoom,
        clipStartSeconds: scene.clipStartSeconds,
        onScreenText: scene.onScreenText,
        transitionIn: scene.transitionIn,
        sound: scene.sound,
      });
    }
    for (const part of source.voice) {
      voice.push(
        part
          ? {
              file: await fetch(part.audioKey),
              offsetMs: part.offsetMs,
              durationMs: part.durationMs,
            }
          : null,
      );
    }

    return {
      scenes,
      voice,
      captions: {
        enabled: video.captions.enabled,
        style: video.captions.style,
        lines: video.captions.lines.map((line) => ({
          startMs: line.startMs,
          endMs: line.endMs,
          text: line.text,
          words: line.words,
        })),
      },
      music: source.music
        ? {
            file: await fetch(source.music.storageKey),
            levelPercent: source.music.levelPercent,
          }
        : null,
      endCard: video.endCard.enabled ? endCardOf(video.endCard) : null,
    };
  }

  private async store(
    job: GenerationJobRecord,
    owner: OwnerContext,
    source: VideoRenderSource,
    result: Awaited<ReturnType<RenderService['render']>>,
  ): Promise<void> {
    const id = new Types.ObjectId().toHexString();
    const videoKey = `projects/${job.projectId}/exports/${id}.mp4`;
    const posterKey = `projects/${job.projectId}/exports/${id}.jpg`;
    const [latest] = await this.records(job.projectId, owner);

    try {
      await this.s3Service.putObjectFromFile(
        videoKey,
        result.videoPath,
        'video/mp4',
      );
      await this.s3Service.putObjectFromFile(
        posterKey,
        result.posterPath,
        'image/jpeg',
      );
      await this.exports.create({
        id,
        ownerId: owner.ownerId,
        organizationId: owner.organizationId,
        projectId: job.projectId,
        number: (latest?.number ?? 0) + 1,
        jobId: job.id,
        scriptVersionId: source.video.scriptVersion.id,
        preset: ExportPreset.TIKTOK_9_16,
        videoKey,
        posterKey,
        durationMs: result.durationMs,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        snapshot: source.snapshot,
        fingerprint: source.fingerprint,
        createdAt: new Date(),
        downloadedAt: null,
      });
    } catch (error) {
      await Promise.allSettled([
        this.s3Service.deleteObject(videoKey),
        this.s3Service.deleteObject(posterKey),
      ]);
      throw error;
    }

    await this.projectsService.setStatus(
      job.projectId,
      owner,
      ProjectStatus.READY,
    );
    await this.syncSummary(job.projectId, owner);
  }

  /** After a failed render the project returns to where it was. */
  private async restoreStatus(projectId: string, owner: OwnerContext) {
    const records = await this.records(projectId, owner);
    const status = !records.length
      ? ProjectStatus.MEDIA_REVIEW
      : records.some((record) => record.downloadedAt)
        ? ProjectStatus.EXPORTED
        : ProjectStatus.READY;

    await this.projectsService.setStatus(projectId, owner, status);
  }

  private async syncSummary(projectId: string, owner: OwnerContext) {
    const project = await this.projectsService.getRecord(projectId, owner);
    const records = await this.records(projectId, owner);
    const latest = records[0];

    if (!project.videoSummary) return;

    await this.projectsService.syncVideo(projectId, owner, {
      ...project.videoSummary,
      exportCount: records.length,
      latestExportAt: latest?.createdAt ?? null,
      posterKey: latest?.posterKey ?? null,
      latestExportDownloaded: Boolean(latest?.downloadedAt),
    });
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private scope(owner: OwnerContext, filter: Partial<ExportRecord>) {
    return applyTenantFilter<ExportRecord>(
      { ...filter, ownerId: owner.ownerId },
      owner.organizationId,
    );
  }

  private async records(projectId: string, owner: OwnerContext) {
    const page = await this.exports
      .list(this.scope(owner, { projectId }), { sort: { number: 'DESC' } })
      .connection({ first: EXPORTS_LIMIT });

    return page.edges.map(({ node }) => node);
  }

  private async findByJob(jobId: string, owner: OwnerContext) {
    const [record] = await this.exports
      .list(this.scope(owner, { jobId }))
      .collect();
    return record ?? null;
  }

  private async getRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<ExportRecord> {
    if (!/^[a-f0-9]{24}$/.test(id))
      throw new NotFoundError('We can’t find that export.');

    const [record] = await this.exports
      .list(this.scope(owner, { id }))
      .collect();

    if (!record) throw new NotFoundError('We can’t find that export.');

    return record;
  }

  private async toGraphql(record: ExportRecord): Promise<Export> {
    const [posterUrl, videoUrl] = await Promise.all([
      this.s3Service.createPresignedGetUrl(record.posterKey).catch(() => null),
      this.s3Service.createPresignedGetUrl(record.videoKey).catch(() => null),
    ]);

    return {
      id: record.id,
      number: record.number,
      preset: record.preset,
      durationMs: record.durationMs,
      width: record.width,
      height: record.height,
      sizeBytes: record.sizeBytes,
      posterUrl,
      videoUrl,
      // Exports rendered before `adTag` or `studio` joined the snapshot have
      // no value stored; they read no #ad and Affiliate.
      snapshot: {
        ...record.snapshot,
        adTag: record.snapshot.adTag ?? false,
        studio: studioOf(record.snapshot.studio),
        scenes: record.snapshot.scenes.map((scene) => ({
          ...scene,
          transitionIn: scene.transitionIn ?? SceneTransition.CUT,
          clipSound: scene.clipSound ?? { on: false, levelPercent: 100 },
        })),
      },
      createdAt: record.createdAt,
      downloadedAt: record.downloadedAt,
    };
  }
}

/**
 * The end card's two lines, in the same layout for every studio: the
 * product name and call to action, or a story's title and end line.
 */
export function endCardOf(
  endCard: VideoRenderSource['video']['endCard'],
): NonNullable<RenderPlan['endCard']> {
  const story = typeof endCard.storyTitle === 'string';

  return {
    durationMs: endCard.durationSeconds * 1000,
    title: (story ? endCard.storyTitle : endCard.productTitle) ?? '',
    cta: (story ? endCard.endLine : endCard.cta) ?? null,
  };
}
