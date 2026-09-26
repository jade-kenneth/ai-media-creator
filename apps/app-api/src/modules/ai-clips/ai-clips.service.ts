import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import {
  AssetKind,
  AssetOrigin,
  ConsistentItemKind,
  GenerationJobType,
  SceneClipMode,
  SceneMediaKind,
  type ClaimFlag,
  type GenerateSceneClipsInput,
  type ProjectAsset,
  type VideoEdit,
  type VideoEditScene,
} from 'src/graphql/generated/graphql';
import { AssetsService } from '../assets/assets.service';
import { ClaimCheckService } from '../facts/claim-check.service';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { ProjectsService } from '../projects/projects.service';
import { studioFor, type StudioDefinition } from '../studios/studios';
import { VideoEditsService } from '../video-edits/video-edits.service';
import { aiClipsEnabled } from '../video/video.config';

/** 4 credits for each clip made (R20); 1 or 2 per request, 1 by default (R23). */
export const MAX_CLIPS_PER_REQUEST = 2;
export const DEFAULT_CLIPS_PER_REQUEST = 1;
export const CLIP_CREDIT_COST = 4;
/** R23: Match my photos takes 2 to 4 photos (the provider allows up to 9). */
export const MIN_REFERENCE_PHOTOS = 2;
export const MAX_REFERENCE_PHOTOS = 4;
/** Clips from before the length followed the scene were 6 seconds. */
export const LEGACY_CLIP_SECONDS = 6;
/** What the video model makes: whole seconds from 5 to 15 (MiniMax-H3-Max). */
export const MIN_CLIP_SECONDS = 5;
export const MAX_CLIP_SECONDS = 15;

/**
 * A clip as long as its scene, within what the model makes. A scene shorter
 * than 5 s gets a 5 s clip and plays part of it (Start at picks which).
 */
export function clipSecondsFor(sceneSeconds: number): number {
  return Math.min(
    MAX_CLIP_SECONDS,
    Math.max(MIN_CLIP_SECONDS, Math.ceil(sceneSeconds)),
  );
}
export const CLIP_STEPS = 3;
/**
 * The video service reads prompts of about 7,000 characters (MiniMax H3);
 * 2,000 leaves room for a skit scene's timed beats with every line whole.
 */
export const PROMPT_MAX = 2000;

/** The photos a clip request sends, by role, and the still it follows. */
interface ClipPhotos {
  mode: SceneClipMode;
  /** The first photo; null when the clip is made from the description alone. */
  sourceAssetId: string | null;
  endAssetId: string | null;
  referenceAssetIds: string[] | undefined;
  continuity: {
    sceneId: string;
    assetId: string;
    seconds: number | null;
  } | null;
}

/**
 * Describe only (§3.23 D2): text to video from the description, with no
 * photo. It takes no photo ids, and a one-click clip with nothing to send is
 * made this way too.
 */
function describeOnly(input: GenerateSceneClipsInput): ClipPhotos {
  if (
    input.mode === SceneClipMode.DESCRIBE &&
    (input.sourceAssetId || input.endAssetId || input.referenceAssetIds?.length)
  ) {
    throw new ValidationError('Describe only uses no photos.', {
      field: 'input.mode',
    });
  }

  return {
    mode: SceneClipMode.DESCRIBE,
    sourceAssetId: null,
    endAssetId: null,
    referenceAssetIds: undefined,
    continuity: null,
  };
}

/**
 * AI scene clips (Product Specification §3.18): requests, the accuracy check
 * and discarding. The paid work runs in the media worker
 * (`AiClipJobsHandler`); this service only gates and records it.
 */
@Injectable()
export class AiClipsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly projectsService: ProjectsService,
    private readonly videoEditsService: VideoEditsService,
    private readonly assetsService: AssetsService,
    private readonly jobsService: GenerationJobsService,
    private readonly claimCheck: ClaimCheckService,
  ) {}

  async generate(
    input: GenerateSceneClipsInput,
    owner: OwnerContext,
  ): Promise<GenerationJobRecord> {
    if (!aiClipsEnabled(this.configService)) {
      throw new ConflictError('AI clips aren’t available yet.', {
        code: 'AI_CLIPS_DISABLED',
      });
    }

    const prompt = input.prompt.replace(/\s+/g, ' ').trim();

    if (!prompt || prompt.length > PROMPT_MAX) {
      throw new ValidationError(
        prompt
          ? `Use ${PROMPT_MAX} characters or fewer.`
          : 'Describe the motion first.',
        { field: 'input.prompt' },
      );
    }

    const project = await this.projectsService.getRecord(
      input.projectId,
      owner,
    );
    // The presented edit: with a voiceover, a scene lasts as long as its voice.
    const edit = await this.videoEditsService.get(project.id, owner);
    const scene = edit?.scenes.find((item) => item.sceneId === input.sceneId);

    if (!edit || !scene) {
      throw new ValidationError('That scene isn’t part of this video.', {
        field: 'input.sceneId',
      });
    }

    const studio = studioFor(project);
    const mode = input.mode ?? SceneClipMode.FIRST_FRAME;

    if (!studio.clipModes.includes(mode)) {
      throw new ValidationError(
        mode === SceneClipMode.DESCRIBE
          ? 'Describe only is for stories.'
          : 'That clip mode isn’t available for this video.',
        { field: 'input.mode' },
      );
    }

    const photos =
      mode === SceneClipMode.DESCRIBE
        ? describeOnly(input)
        : mode === SceneClipMode.CONSISTENT
          ? this.consistentPhotos(input, edit, scene, studio)
          : {
              ...(await this.photosFor(input, project.id, owner)),
              continuity: null,
            };
    const clipCount = input.clipCount ?? DEFAULT_CLIPS_PER_REQUEST;

    if (
      !Number.isInteger(clipCount) ||
      clipCount < 1 ||
      clipCount > MAX_CLIPS_PER_REQUEST
    ) {
      throw new ValidationError('Ask for 1 or 2 clips.', {
        field: 'input.clipCount',
      });
    }

    // A second request for a scene whose clips are still being made is
    // refused by the job service (JOB_ALREADY_RUNNING).
    return this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: GenerationJobType.GENERATE_SCENE_CLIPS,
      label:
        clipCount === 1 ? 'Generate 1 clip' : `Generate ${clipCount} clips`,
      stepCount: CLIP_STEPS,
      creditCost: clipCount * CLIP_CREDIT_COST,
      input: {
        sceneId: input.sceneId,
        prompt,
        clipCount,
        clipSeconds: clipSecondsFor(scene.durationSeconds),
        clipMode: photos.mode,
        sourceAssetId: photos.sourceAssetId,
        endAssetId: photos.endAssetId,
        referenceAssetIds: photos.referenceAssetIds,
        continuitySceneId: photos.continuity?.sceneId ?? null,
        continuityAssetId: photos.continuity?.assetId ?? null,
        continuitySeconds: photos.continuity?.seconds ?? null,
      },
      idempotencyKey: input.idempotencyKey,
    });
  }

  /**
   * A one-click clip's photos (§3.21), chosen here and never by the caller:
   * the Keep consistent photos of the items in the scene (the product's when
   * no item is), product first, and past the first scene a still of the
   * nearest earlier scene with a photo or clip. Scenes after the first wait
   * for the first scene's AI clip, which sets the look. Where the studio
   * needs a photo for every item, one-click waits for them; elsewhere
   * (stories, §3.23) items without a photo are described in words, and a
   * scene with no photo and no still before it is made from the description.
   */
  private consistentPhotos(
    input: GenerateSceneClipsInput,
    edit: VideoEdit,
    scene: VideoEditScene,
    studio: StudioDefinition,
  ): ClipPhotos {
    if (
      input.sourceAssetId ||
      input.endAssetId ||
      input.referenceAssetIds?.length
    ) {
      throw new ValidationError('One-click clips choose their own photos.', {
        field: 'input.mode',
      });
    }

    const items = edit.consistentItems;
    const incomplete = () =>
      new ConflictError('Add a photo for every item first.', {
        code: 'CONSISTENT_ITEMS_INCOMPLETE',
      });

    if (
      studio.keepConsistent.photosRequired &&
      items.some((item) => !item.photo)
    ) {
      throw incomplete();
    }

    const scenes = [...edit.scenes].sort((a, b) => a.order - b.order);
    const position = scenes.findIndex((item) => item.sceneId === scene.sceneId);

    if (
      position > 0 &&
      scenes[0].media?.asset?.origin !== AssetOrigin.AI_CLIP
    ) {
      throw new ConflictError('Make scene 1’s clip first.', {
        code: 'FIRST_SCENE_CLIP_NEEDED',
      });
    }

    const inScene = items.filter((item) =>
      item.sceneIds.includes(scene.sceneId),
    );
    const photos = [
      ...new Set(
        (inScene.length
          ? inScene
          : items.filter((item) => item.kind === ConsistentItemKind.PRODUCT)
        ).flatMap((item) => (item.photo ? [item.photo.id] : [])),
      ),
    ];
    const before = scenes
      .slice(0, Math.max(0, position))
      .reverse()
      .find(
        (item) => item.media?.kind === SceneMediaKind.ASSET && item.media.asset,
      );
    const source = before?.media?.asset;

    if (!photos.length && !(before && source)) {
      if (!studio.clipModes.includes(SceneClipMode.DESCRIBE)) {
        throw incomplete();
      }
      return describeOnly(input);
    }

    return {
      mode: SceneClipMode.CONSISTENT,
      sourceAssetId: photos[0] ?? null,
      endAssetId: null,
      referenceAssetIds: photos,
      continuity:
        before && source
          ? {
              sceneId: before.sceneId,
              assetId: source.id,
              // The frame viewers see last before the cut.
              seconds:
                source.kind === AssetKind.CLIP
                  ? (before.media?.clipStartSeconds ?? 0) +
                    before.durationSeconds
                  : null,
            }
          : null,
    };
  }

  /**
   * The request's photos for its mode (R23). Every photo is a ready photo the
   * creator uploaded to this project; AI clips are never inputs.
   */
  private async photosFor(
    input: GenerateSceneClipsInput,
    projectId: string,
    owner: OwnerContext,
  ): Promise<{
    mode: SceneClipMode;
    sourceAssetId: string;
    endAssetId: string | null;
    referenceAssetIds: string[] | undefined;
  }> {
    const mode = input.mode ?? SceneClipMode.FIRST_FRAME;
    const ids =
      mode === SceneClipMode.REFERENCES
        ? (input.referenceAssetIds ?? [])
        : [input.sourceAssetId, input.endAssetId].filter((id): id is string =>
            Boolean(id),
          );

    if (mode === SceneClipMode.REFERENCES) {
      if (input.sourceAssetId || input.endAssetId) {
        throw new ValidationError(
          'Match my photos uses reference photos only.',
          { field: 'input.referenceAssetIds' },
        );
      }
      if (
        ids.length < MIN_REFERENCE_PHOTOS ||
        ids.length > MAX_REFERENCE_PHOTOS
      ) {
        throw new ValidationError(
          `Pick ${MIN_REFERENCE_PHOTOS} to ${MAX_REFERENCE_PHOTOS} photos.`,
          { field: 'input.referenceAssetIds' },
        );
      }
    } else {
      if (!input.sourceAssetId) {
        throw new ValidationError('Pick a photo first.', {
          field: 'input.sourceAssetId',
        });
      }
      if (input.referenceAssetIds?.length) {
        throw new ValidationError('Reference photos need Match my photos.', {
          field: 'input.referenceAssetIds',
        });
      }
      if (mode === SceneClipMode.FIRST_FRAME && input.endAssetId) {
        throw new ValidationError('An end photo needs Move between two.', {
          field: 'input.endAssetId',
        });
      }
      if (mode === SceneClipMode.FIRST_LAST_FRAME && !input.endAssetId) {
        throw new ValidationError('Pick the end photo.', {
          field: 'input.endAssetId',
        });
      }
    }

    if (new Set(ids).size !== ids.length) {
      throw new ValidationError('Pick different photos.', {
        field:
          mode === SceneClipMode.REFERENCES
            ? 'input.referenceAssetIds'
            : 'input.endAssetId',
      });
    }

    const photos = new Set(
      (await this.assetsService.mediaRecords(projectId, owner))
        .filter(
          (asset) =>
            asset.kind === AssetKind.PHOTO &&
            (asset.origin ?? AssetOrigin.UPLOAD) === AssetOrigin.UPLOAD,
        )
        .map((asset) => asset.id),
    );

    if (!ids.every((id) => photos.has(id))) {
      throw new NotFoundError('Pick one of this project’s photos.');
    }

    return mode === SceneClipMode.REFERENCES
      ? {
          mode,
          sourceAssetId: ids[0],
          endAssetId: null,
          referenceAssetIds: ids,
        }
      : {
          mode,
          sourceAssetId: ids[0],
          endAssetId: mode === SceneClipMode.FIRST_LAST_FRAME ? ids[1] : null,
          referenceAssetIds: undefined,
        };
  }

  check(id: string, owner: OwnerContext): Promise<ProjectAsset> {
    return this.assetsService.checkGeneratedClip(id, owner);
  }

  /** Deletes a clip job's clips that no scene uses; used clips are kept. */
  async discard(jobId: string, owner: OwnerContext): Promise<boolean> {
    const job = await this.jobsService.get(jobId, owner);

    if (job.type !== GenerationJobType.GENERATE_SCENE_CLIPS) {
      throw new NotFoundError('We can’t find those clips.');
    }

    const edit = await this.videoEditsService.recordFor(job.projectId, owner);
    const used = new Set(
      edit.scenes.flatMap((scene) =>
        scene.media?.assetId ? [scene.media.assetId] : [],
      ),
    );
    const clips = await this.assetsService.generatedClipsFor(
      job.projectId,
      job.id,
      owner,
    );

    for (const clip of clips) {
      if (!used.has(clip.id)) await this.assetsService.remove(clip.id, owner);
    }

    return true;
  }

  /**
   * The claim check on a description (warns; never blocks generating). A
   * studio without the claim check (stories) never flags one.
   */
  async promptFlags(
    projectId: string,
    prompt: string,
    owner: OwnerContext,
  ): Promise<ClaimFlag[]> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const text = prompt.slice(0, PROMPT_MAX).trim();

    return text && studioFor(project).claimCheck
      ? this.claimCheck.checkText(
          text,
          project.approvedFacts.map((fact) => fact.text),
        )
      : [];
  }
}
