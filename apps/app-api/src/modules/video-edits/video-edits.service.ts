import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  AssetKind,
  AssetOrigin,
  AssetPurpose,
  CaptionStyle,
  ConsistentItemKind,
  GenerationJobType,
  PhotoMotion,
  ProjectStatus,
  ProjectStepKey,
  SceneMediaKind,
  SceneTransition,
  VideoEditBlocker,
  VoiceSource,
  type StudioType,
  type CaptionLine,
  type CaptionsInput,
  type ClaimFlag,
  type ClipContext,
  type ProjectAsset,
  type SceneMediaChoiceInput,
  type SwitchVideoEditVersionInput,
  type UpdateVideoEditInput,
  type VideoEdit,
  type VideoEditScene,
  type VoiceJobInput,
  type VoiceSettingsInput,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { AssetsService } from '../assets/assets.service';
import { ClaimCheckService } from '../facts/claim-check.service';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { ProjectsService, readStory } from '../projects/projects.service';
import type {
  ProjectRecord,
  StoryRecord,
} from '../projects/repositories/projects.repository';
import type {
  SceneDirectionRecord,
  ScriptVersionRecord,
} from '../scripts/repositories/scripts.repository';
import { isSkit, readLine } from '../scripts/script-writing';
import { ScriptsService } from '../scripts/scripts.service';
import { studioFor, type StudioDefinition } from '../studios/studios';
import { aiClipsEnabled } from '../video/video.config';
import { VoiceService } from '../voice/voice.service';
import type { VoiceTrackRecord } from '../voice-tracks/repositories/voice-tracks.repository';
import { VoiceTracksService } from '../voice-tracks/voice-tracks.service';
import {
  deriveConsistentItems,
  PRODUCT_FALLBACK_NAME,
  validateConsistentItems,
  type ConsistentSubject,
} from './consistent-items';
import type {
  CaptionLineRecord,
  ClipSoundRecord,
  ConsistentItemRecord,
  SceneMediaRecord,
  VideoEditCaptionsRecord,
  VideoEditRecord,
  VideoEditSceneRecord,
  VideoEditsRepository,
  VideoEditVoiceRecord,
} from './repositories/video-edits.repository';
import {
  buildSceneCaptions,
  CAPTION_LINE_CHARS,
  CAPTION_MAX_LINES,
  spokenCaptions,
  textCaptions,
  type CaptionDraft,
} from './voice-timing';

const CLIP_START_STEP = 0.5;

/** Credit estimates (open decision 11; demo values). */
export const GENERATE_VOICEOVER_COST = 2;
export const GENERATE_VOICEOVER_STEPS = 3;
export const ALIGN_RECORDING_COST = 1;
export const ALIGN_RECORDING_STEPS = 2;

const SPEEDS = [0.9, 1, 1.1];
const MAX_ON_SCREEN_TEXT = 60;
const MIN_SCENE_SECONDS = 2;
const MAX_SCENE_SECONDS = 15;
const DEFAULT_MUSIC_LEVEL = 20;
const END_CARD_SECONDS = 2;
const MAX_END_LINE = 60;
const MAX_POST_CAPTION = 2200;
const MAX_PRONUNCIATIONS = 20;

const DEFAULT_VOICE: VideoEditVoiceRecord = {
  source: VoiceSource.AI,
  voiceId: null,
  speed: 1,
  pronunciations: [],
  trackId: null,
};

const DEFAULT_CAPTIONS: VideoEditCaptionsRecord = {
  enabled: true,
  style: CaptionStyle.BOXED,
  lines: [],
  builtFromTrackId: null,
};

/** Clip sound on edits stored before it existed, and on narrated scenes. */
const DEFAULT_CLIP_SOUND: ClipSoundRecord = { on: false, levelPercent: 100 };

/** Sources that read a voice track; No voiceover and Sound from your clips don't. */
function usesTrack(source: VoiceSource): boolean {
  return source === VoiceSource.AI || source === VoiceSource.RECORDING;
}

/** Voice, speed and pronunciations, compared to tell when a track is stale. */
export function voiceSettingsKey(voice: {
  voiceId: string | null;
  speed: number;
  pronunciations: { word: string; sayAs: string }[];
}): string {
  return JSON.stringify([
    voice.voiceId,
    voice.speed,
    [...voice.pronunciations]
      .map((rule) => [rule.word.toLowerCase(), rule.sayAs])
      .sort(),
  ]);
}

const CAPTION_STYLE_NAME: Record<CaptionStyle, string> = {
  [CaptionStyle.CLEAN]: 'Clean captions',
  [CaptionStyle.BOXED]: 'Boxed captions',
  [CaptionStyle.WORD_HIGHLIGHT]: 'Word highlight captions',
};

export interface ExportSnapshot {
  scriptVersionNumber: number;
  scenes: {
    order: number;
    purpose: VideoEditScene['purpose'];
    media: string;
    durationSeconds: number;
    onScreenText: string;
    transitionIn: SceneTransition;
    /** Absent on exports rendered before clip sound existed (read as off). */
    clipSound?: ClipSoundRecord;
  }[];
  voice: string;
  captions: string;
  music: string;
  endCard: boolean;
  postCaption: string;
  adTag: boolean;
  /** Absent on exports rendered before studios existed (read as Affiliate). */
  studio?: StudioType;
}

export interface VideoRenderSource {
  video: VideoEdit;
  fingerprint: string;
  scenes: {
    durationMs: number;
    kind: 'photo' | 'clip' | 'text';
    storageKey: string | null;
    slowZoom: boolean;
    clipStartSeconds: number;
    onScreenText: string;
    transitionIn: SceneTransition;
    /** A clip that plays its own sound, at this level; null otherwise. */
    sound: { levelPercent: number } | null;
  }[];
  voice: ({ audioKey: string; offsetMs: number; durationMs: number } | null)[];
  music: { storageKey: string; levelPercent: number } | null;
  snapshot: ExportSnapshot;
}

/**
 * What the rendered video depends on (not signed URLs or the caption for
 * posting), so a changed fingerprint means an export is out of date.
 */
export function videoFingerprint(video: VideoEdit): string {
  const sounds = video.scenes.map((scene) =>
    scene.clipSound.on ? [scene.sceneId, scene.clipSound.levelPercent] : null,
  );

  // Clip sound joins only when a scene uses it, so videos without it keep
  // the fingerprint their exports were stored with.
  return JSON.stringify([
    video.scriptVersion.id,
    video.scenes.map((scene) => [
      scene.sceneId,
      scene.durationSeconds,
      scene.onScreenText,
      scene.transitionIn,
      scene.media?.kind ?? null,
      scene.media?.asset?.id ?? null,
      scene.media?.motion ?? null,
      scene.media?.clipStartSeconds ?? null,
    ]),
    video.voice.source,
    video.voice.track?.id ?? null,
    video.captions.enabled,
    video.captions.style,
    video.captions.lines.map((line) => [line.text, line.startMs, line.endMs]),
    video.music.asset?.id ?? null,
    video.music.levelPercent,
    video.endCard.enabled,
    ...(sounds.some(Boolean) ? [sounds] : []),
    // A story's end card shows its title and end line; videos without one
    // keep the fingerprint their exports were stored with.
    ...(video.endCard.enabled && typeof video.endCard.storyTitle === 'string'
      ? [['end-card', video.endCard.storyTitle, video.endCard.endLine ?? null]]
      : []),
  ]);
}

interface VoiceState {
  track: VoiceTrackRecord | null;
  recording: ProjectAsset | null;
  settled: boolean;
  outdated: boolean;
  settingsChanged: boolean;
}

/** Statuses a started video moves forward from; later ones are kept. */
const BEFORE_MEDIA = [
  ProjectStatus.DRAFT,
  ProjectStatus.FACTS_REVIEW,
  ProjectStatus.SCRIPT_REVIEW,
];

@Injectable()
export class VideoEditsService {
  constructor(
    @Inject(TOKENS.VIDEO_EDITS_REPOSITORY)
    private readonly edits: VideoEditsRepository,
    private readonly projectsService: ProjectsService,
    private readonly scriptsService: ScriptsService,
    private readonly assetsService: AssetsService,
    private readonly claimCheck: ClaimCheckService,
    private readonly jobsService: GenerationJobsService,
    private readonly voiceService: VoiceService,
    private readonly voiceTracksService: VoiceTracksService,
    private readonly configService: ConfigService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────────────

  async get(projectId: string, owner: OwnerContext): Promise<VideoEdit | null> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const record = await this.findRecord(project.id, owner);

    return record ? this.present(record, project, owner) : null;
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /** Starts the video from the newest current approval; idempotent. */
  async start(projectId: string, owner: OwnerContext): Promise<VideoEdit> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const existing = await this.findRecord(project.id, owner);

    if (existing) return this.present(existing, project, owner);

    const [latest] = await this.scriptsService.currentApproved(project, owner);

    if (!latest) {
      throw new ConflictError('Approve a script first.', {
        code: 'NO_APPROVED_SCRIPT',
      });
    }

    const now = new Date();
    const studio = studioFor(project);
    const scenes = scenesFrom(latest, []);
    const record: VideoEditRecord = {
      id: new Types.ObjectId().toHexString(),
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId: project.id,
      scriptVersionId: latest.id,
      scriptVersionNumber: latest.number,
      scenes,
      postCaption: latest.caption,
      // A studio without #ad (stories) never starts with it.
      adTag: studio.adTag,
      // A skit has no narration to voice: it starts on its clips' own sound.
      ...(isSkit(latest.contentStyle)
        ? { voice: { ...DEFAULT_VOICE, source: VoiceSource.SCENE } }
        : {}),
      consistentItems: deriveConsistentItems(
        scenes,
        [],
        project.product.title,
        consistentSubject(project, studio),
      ),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.edits.create(record);
    } catch (error) {
      // A second tab started it first; use theirs.
      if ((error as { code?: number }).code !== 11000) throw error;
      const winner = await this.findRecord(project.id, owner);
      if (winner) return this.present(winner, project, owner);
      throw error;
    }

    if (BEFORE_MEDIA.includes(project.status)) {
      await this.projectsService.setStatus(
        project.id,
        owner,
        ProjectStatus.MEDIA_REVIEW,
      );
    }

    return this.present(record, project, owner);
  }

  async update(
    input: UpdateVideoEditInput,
    owner: OwnerContext,
  ): Promise<VideoEdit> {
    const project = await this.projectsService.getRecord(
      input.projectId,
      owner,
    );
    const record = await this.getRecord(project.id, owner);
    const studio = studioFor(project);
    const assets = await this.readyAssets(project.id, owner);
    const scenes = record.scenes.map((scene) => ({ ...scene }));

    for (const [index, change] of (input.sceneMedia ?? []).entries()) {
      const scene = scenes.find((item) => item.sceneId === change.sceneId);

      if (!scene) {
        throw new ValidationError('That scene isn’t part of this video.', {
          field: `input.sceneMedia.${index}.sceneId`,
        });
      }

      scene.media = change.media
        ? validateMedia(
            change.media,
            scene,
            assets,
            `input.sceneMedia.${index}.media`,
          )
        : null;
    }

    const voice = input.voice
      ? this.validateVoice(input.voice, voiceOf(record))
      : undefined;
    const effectiveVoice = voice ?? voiceOf(record);

    // Choosing Sound from your clips turns every scene's clip sound on.
    if (
      voice?.source === VoiceSource.SCENE &&
      voiceOf(record).source !== VoiceSource.SCENE
    ) {
      for (const scene of scenes) {
        scene.clipSound = { ...clipSoundOf(scene), on: true };
      }
    }

    for (const [index, change] of (input.clipSounds ?? []).entries()) {
      const scene = findScene(
        scenes,
        change.sceneId,
        `input.clipSounds.${index}`,
      );

      if (
        !Number.isInteger(change.levelPercent) ||
        change.levelPercent < 0 ||
        change.levelPercent > 100 ||
        change.levelPercent % 5 !== 0
      ) {
        throw new ValidationError('Use 0 to 100% in steps of 5.', {
          field: `input.clipSounds.${index}.levelPercent`,
        });
      }
      scene.clipSound = { on: change.on, levelPercent: change.levelPercent };
    }

    for (const [index, change] of (input.sceneText ?? []).entries()) {
      const scene = findScene(
        scenes,
        change.sceneId,
        `input.sceneText.${index}`,
      );

      if (change.onScreenText.length > MAX_ON_SCREEN_TEXT) {
        throw new ValidationError('Use 60 characters or fewer.', {
          field: `input.sceneText.${index}.onScreenText`,
        });
      }
      scene.onScreenText = change.onScreenText;
    }

    for (const [index, change] of (input.sceneTransitions ?? []).entries()) {
      const scene = findScene(
        scenes,
        change.sceneId,
        `input.sceneTransitions.${index}`,
      );
      scene.transitionIn = change.transitionIn;
    }

    for (const [index, change] of (input.sceneDurations ?? []).entries()) {
      const scene = findScene(
        scenes,
        change.sceneId,
        `input.sceneDurations.${index}`,
      );

      if (usesTrack(effectiveVoice.source)) {
        throw new ConflictError('Scene lengths follow the voiceover.', {
          code: 'DURATION_FOLLOWS_VOICE',
        });
      }
      if (
        !Number.isInteger(change.durationSeconds) ||
        change.durationSeconds < MIN_SCENE_SECONDS ||
        change.durationSeconds > MAX_SCENE_SECONDS
      ) {
        throw new ValidationError('Use 2 to 15 seconds.', {
          field: `input.sceneDurations.${index}.durationSeconds`,
        });
      }
      scene.durationSeconds = change.durationSeconds;
    }

    const ordered = input.sceneOrder
      ? reorderScenes(scenes, input.sceneOrder)
      : scenes;
    const captions = input.captions
      ? this.validateCaptions(
          input.captions,
          captionsOf(record),
          effectiveVoice,
          ordered,
        )
      : undefined;

    if (
      input.musicLevelPercent !== undefined &&
      input.musicLevelPercent !== null &&
      (!Number.isInteger(input.musicLevelPercent) ||
        input.musicLevelPercent < 0 ||
        input.musicLevelPercent > 100 ||
        input.musicLevelPercent % 5 !== 0)
    ) {
      throw new ValidationError('Use 0 to 100% in steps of 5.', {
        field: 'input.musicLevelPercent',
      });
    }

    if (
      typeof input.postCaption === 'string' &&
      input.postCaption.length > MAX_POST_CAPTION
    ) {
      throw new ValidationError('Use 2,200 characters or fewer.', {
        field: 'input.postCaption',
      });
    }

    const consistentItems = input.consistentItems
      ? validateConsistentItems(
          input.consistentItems,
          await this.itemsOf(record, project, owner),
          new Set(record.scenes.map((scene) => scene.sceneId)),
          assets,
          { product: studio.keepConsistent.product },
        )
      : undefined;
    const endLine =
      typeof input.endLine === 'string'
        ? validateEndLine(input.endLine)
        : undefined;

    return this.save(
      record,
      {
        scenes: ordered,
        ...(consistentItems ? { consistentItems } : {}),
        ...(typeof input.postCaption === 'string'
          ? { postCaption: input.postCaption }
          : {}),
        // Ignored where the studio has no #ad option.
        ...(typeof input.adTag === 'boolean' && studio.adTag
          ? { adTag: input.adTag }
          : {}),
        // Only a story's end card has an end line.
        ...(endLine !== undefined && storyOf(project, studio)
          ? { endLine }
          : {}),
        ...(voice ? { voice } : {}),
        ...(captions ? { captions } : {}),
        ...(typeof input.musicLevelPercent === 'number'
          ? { musicLevelPercent: input.musicLevelPercent }
          : {}),
        ...(typeof input.endCardEnabled === 'boolean'
          ? { endCardEnabled: input.endCardEnabled }
          : {}),
      },
      project,
      owner,
    );
  }

  /** Replaces caption edits with the voiceover's words. */
  async resetCaptions(
    projectId: string,
    owner: OwnerContext,
  ): Promise<VideoEdit> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const record = await this.getRecord(project.id, owner);

    // Captions from the spoken lines drop the creator's wording.
    if (voiceOf(record).source === VoiceSource.SCENE) {
      return this.save(
        record,
        { captions: { ...captionsOf(record), sceneEdits: [] } },
        project,
        owner,
      );
    }

    const state = await this.voiceState(record, owner);

    if (!state.settled || !state.track || !usesTrack(voiceOf(record).source)) {
      throw new ConflictError('Add a voiceover first.', {
        code: 'NO_VOICEOVER',
      });
    }

    return this.save(
      record,
      {
        captions: {
          ...captionsOf(record),
          lines: captionLinesFrom(state.track),
          builtFromTrackId: state.track.id,
        },
      },
      project,
      owner,
    );
  }

  // ── Paid voice jobs ──────────────────────────────────────────────────────

  /** Reads the approved script in the chosen voice (2 credits). */
  async generateVoiceover(
    input: VoiceJobInput,
    owner: OwnerContext,
  ): Promise<GenerationJobRecord> {
    const { project, record } = await this.forVoiceJob(input.projectId, owner);
    const voice = voiceOf(record);

    if (voice.source !== VoiceSource.AI) {
      throw new ConflictError('Choose AI voice first.', {
        code: 'NOT_AI_VOICE',
      });
    }
    if (!voice.voiceId) {
      throw new ConflictError('Pick a voice first.', { code: 'NO_VOICE' });
    }
    assertNarration(record);

    return this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: GenerationJobType.GENERATE_VOICEOVER,
      label: 'Generate voiceover',
      stepCount: GENERATE_VOICEOVER_STEPS,
      creditCost: GENERATE_VOICEOVER_COST,
      input: { versionId: record.scriptVersionId },
      idempotencyKey: input.idempotencyKey,
    });
  }

  /** Times the creator's recording to the script (1 credit). */
  async alignRecording(
    input: VoiceJobInput,
    owner: OwnerContext,
  ): Promise<GenerationJobRecord> {
    const { project, record } = await this.forVoiceJob(input.projectId, owner);

    if (voiceOf(record).source !== VoiceSource.RECORDING) {
      throw new ConflictError('Choose My recording first.', {
        code: 'NOT_RECORDING',
      });
    }
    assertNarration(record);

    const recording = await this.assetsService.currentAudioRecord(
      project.id,
      AssetPurpose.RECORDING,
      owner,
    );

    if (!recording) {
      throw new ConflictError('Upload your recording first.', {
        code: 'NO_RECORDING',
      });
    }

    return this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: GenerationJobType.ALIGN_RECORDING,
      label: 'Time your recording',
      stepCount: ALIGN_RECORDING_STEPS,
      creditCost: ALIGN_RECORDING_COST,
      input: { versionId: record.scriptVersionId },
      idempotencyKey: input.idempotencyKey,
    });
  }

  /**
   * Called by the voice job handlers once a track is stored: the video now
   * uses it, and captions are rebuilt from its words.
   */
  async applyTrack(
    track: VoiceTrackRecord,
    owner: OwnerContext,
  ): Promise<void> {
    const project = await this.projectsService.getRecord(
      track.projectId,
      owner,
    );
    const record = await this.getRecord(project.id, owner);
    const lines = captionLinesFrom(track);

    await this.save(
      record,
      {
        voice: { ...voiceOf(record), trackId: track.id },
        captions: {
          ...captionsOf(record),
          lines,
          builtFromTrackId: track.id,
        },
      },
      project,
      owner,
    );
  }

  /**
   * Everything the render job needs, with storage keys instead of signed
   * URLs: the presented video (timings, captions, readiness), each scene's
   * file, voice parts in edit order, music, a settings snapshot for export
   * history and a fingerprint to tell when the video changed since.
   */
  async renderSource(
    projectId: string,
    owner: OwnerContext,
  ): Promise<VideoRenderSource | null> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const record = await this.findRecord(project.id, owner);

    if (!record) return null;

    const [video, media, music, state] = await Promise.all([
      this.present(record, project, owner),
      this.assetsService.mediaRecords(project.id, owner),
      this.assetsService.currentAudioRecord(
        project.id,
        AssetPurpose.MUSIC,
        owner,
      ),
      this.voiceState(record, owner),
    ]);
    const files = new Map(media.map((asset) => [asset.id, asset]));
    const voiced = state.settled && usesTrack(voiceOf(record).source);
    const segments = new Map(
      (voiced ? (state.track?.segments ?? []) : []).map((segment) => [
        segment.sceneId,
        segment,
      ]),
    );

    return {
      video,
      fingerprint: videoFingerprint(video),
      scenes: video.scenes.map((scene) => {
        const file = scene.media?.asset
          ? files.get(scene.media.asset.id)
          : undefined;
        const kind =
          scene.media?.kind === SceneMediaKind.ASSET && file
            ? file.kind === AssetKind.CLIP
              ? 'clip'
              : 'photo'
            : 'text';

        return {
          durationMs: scene.durationSeconds * 1000,
          kind,
          storageKey: file?.storageKey ?? null,
          slowZoom: scene.media?.motion === PhotoMotion.SLOW_ZOOM,
          clipStartSeconds: scene.media?.clipStartSeconds ?? 0,
          onScreenText: scene.onScreenText,
          transitionIn: scene.transitionIn,
          sound: playsClipSound(scene, kind === 'clip')
            ? { levelPercent: scene.clipSound.levelPercent }
            : null,
        };
      }),
      voice: video.scenes.map((scene) => {
        const segment = segments.get(scene.sceneId);

        return segment
          ? {
              audioKey: segment.audioKey,
              offsetMs: segment.offsetMs,
              durationMs: Math.min(
                segment.durationMs,
                scene.durationSeconds * 1000,
              ),
            }
          : null;
      }),
      music: music
        ? {
            storageKey: music.storageKey,
            levelPercent: video.music.levelPercent,
          }
        : null,
      snapshot: {
        scriptVersionNumber: video.scriptVersion.number,
        scenes: video.scenes.map((scene) => ({
          order: scene.order,
          purpose: scene.purpose,
          media: `${
            scene.media?.kind === SceneMediaKind.ASSET && scene.media.asset
              ? `${scene.media.asset.fileName}${
                  scene.media.asset.kind === AssetKind.PHOTO
                    ? scene.media.motion === PhotoMotion.SLOW_ZOOM
                      ? ', slow zoom'
                      : ', still'
                    : `, from ${scene.media.clipStartSeconds} s`
                }`
              : 'Text card'
          }${transitionSuffix(scene.order, scene.transitionIn)}${
            playsClipSound(scene, scene.media?.asset?.kind === AssetKind.CLIP)
              ? ` · sound ${scene.clipSound.levelPercent}%`
              : ''
          }`,
          durationSeconds: scene.durationSeconds,
          onScreenText: scene.onScreenText,
          transitionIn: scene.transitionIn,
          clipSound: scene.clipSound,
        })),
        voice:
          voiceOf(record).source === VoiceSource.NONE
            ? 'None'
            : voiceOf(record).source === VoiceSource.SCENE
              ? 'Sound from your clips'
              : state.track?.source === VoiceSource.RECORDING
                ? 'Your recording'
                : `${state.track?.voiceName ?? 'AI voice'} · ${(state.track?.speed ?? 1).toFixed(1)}×`,
        captions: video.captions.enabled
          ? CAPTION_STYLE_NAME[video.captions.style]
          : 'Captions off',
        music: music
          ? `${music.fileName} at ${video.music.levelPercent}%`
          : 'No music',
        endCard: video.endCard.enabled,
        postCaption: video.postCaption.text,
        adTag: video.postCaption.adTag,
        studio: video.studio,
      },
    };
  }

  /** The stored video, for job handlers (which run as the job's owner). */
  async recordFor(
    projectId: string,
    owner: OwnerContext,
  ): Promise<VideoEditRecord> {
    return this.getRecord(projectId, owner);
  }

  /**
   * Fills empty scenes with ready photos and clips in upload order, skipping
   * files already used. Scenes that already have media keep it.
   */
  async autoFill(projectId: string, owner: OwnerContext): Promise<VideoEdit> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const record = await this.getRecord(project.id, owner);
    const assets = await this.readyAssets(project.id, owner);
    const used = new Set(
      record.scenes
        .map((scene) => scene.media?.assetId)
        .filter((id): id is string => Boolean(id && assets.has(id))),
    );
    // Fill from uploads places the creator's own files only, never AI clips.
    const available = [...assets.values()].filter(
      (asset) => !used.has(asset.id) && asset.origin !== AssetOrigin.AI_CLIP,
    );
    const scenes = record.scenes.map((scene) => {
      if (hasMedia(scene, assets)) return { ...scene };

      const asset = available.shift();

      return asset
        ? { ...scene, media: defaultMediaFor(asset) }
        : { ...scene, media: null };
    });

    return this.save(record, { scenes }, project, owner);
  }

  /**
   * Moves the video to another current approval. Scenes keep their media when
   * the scene in the same position has the same purpose.
   */
  async switchVersion(
    input: SwitchVideoEditVersionInput,
    owner: OwnerContext,
  ): Promise<VideoEdit> {
    const project = await this.projectsService.getRecord(
      input.projectId,
      owner,
    );
    const record = await this.getRecord(project.id, owner);
    const approved = await this.scriptsService.currentApproved(project, owner);
    const target = approved.find(
      (version) => version.id === input.scriptVersionId,
    );

    if (!target) {
      throw new ConflictError('Only an approved version can be used.', {
        code: 'VERSION_NOT_APPROVED',
      });
    }

    const previous = await this.scriptsService
      .getRecord(record.scriptVersionId, owner)
      .catch(() => null);
    const scenes = scenesFrom(
      target,
      record.scenes,
      isSkit(previous?.contentStyle) === isSkit(target.contentStyle),
    );

    return this.save(
      record,
      {
        scriptVersionId: target.id,
        scriptVersionNumber: target.number,
        scenes,
        // Wording edits belong to the old version's lines.
        captions: { ...captionsOf(record), sceneEdits: [] },
        // Items keep their photos by name; the new version's props are added.
        consistentItems: deriveConsistentItems(
          scenes,
          record.consistentItems ?? [],
          project.product.title,
          consistentSubject(project, studioFor(project)),
        ),
      },
      project,
      owner,
    );
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async save(
    record: VideoEditRecord,
    changes: Partial<VideoEditRecord>,
    project: ProjectRecord,
    owner: OwnerContext,
  ): Promise<VideoEdit> {
    const next = { ...record, ...changes, updatedAt: new Date() };

    await this.edits.updateOne(this.scope(record.projectId, owner), {
      ...changes,
      updatedAt: next.updatedAt,
    });

    return this.present(next, project, owner);
  }

  /**
   * The script version the video uses. Approved versions never change, so
   * the video reads its shoot plan from it; one that needs review is no
   * longer a current approval and is read by id.
   */
  private async pinnedVersion(
    record: VideoEditRecord,
    approved: ScriptVersionRecord[],
    owner: OwnerContext,
  ): Promise<ScriptVersionRecord | null> {
    return (
      approved.find((item) => item.id === record.scriptVersionId) ??
      (await this.scriptsService
        .getRecord(record.scriptVersionId, owner)
        .catch(() => null))
    );
  }

  /**
   * Each scene's shot direction. Edits stored before directions were copied
   * read them from the pinned version; nothing is backfilled.
   */
  private directionsFor(
    record: VideoEditRecord,
    version: ScriptVersionRecord | null,
  ): Map<string, SceneDirectionRecord | null> {
    const fromVersion = new Map(
      (version?.scenes ?? []).map((scene) => [
        scene.id,
        scene.direction ?? null,
      ]),
    );

    return new Map(
      record.scenes.map((scene) => [
        scene.sceneId,
        scene.direction !== undefined
          ? scene.direction
          : (fromVersion.get(scene.sceneId) ?? null),
      ]),
    );
  }

  /**
   * The Keep consistent list. A video stored before §3.21 reads the list its
   * pinned version implies, without storing it; the first change stores it.
   */
  private async itemsOf(
    record: VideoEditRecord,
    project: ProjectRecord,
    owner: OwnerContext,
    directions?: Map<string, SceneDirectionRecord | null>,
  ): Promise<ConsistentItemRecord[]> {
    if (record.consistentItems) return record.consistentItems;

    const byScene =
      directions ??
      this.directionsFor(
        record,
        await this.pinnedVersion(
          record,
          await this.scriptsService.currentApproved(project, owner),
          owner,
        ),
      );

    return deriveConsistentItems(
      record.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        direction: byScene.get(scene.sceneId) ?? null,
        lines: scene.lines,
        visual: scene.visual,
      })),
      [],
      project.product.title,
      consistentSubject(project, studioFor(project)),
    );
  }

  /**
   * Maps the record and keeps the project's video summary in step with it, so
   * the rail and resume never trust a stale summary (for example after a file
   * the video used was removed).
   */
  private async present(
    record: VideoEditRecord,
    project: ProjectRecord,
    owner: OwnerContext,
  ): Promise<VideoEdit> {
    const [assets, approved, voiceState] = await Promise.all([
      this.readyAssets(project.id, owner),
      this.scriptsService.currentApproved(project, owner),
      this.voiceState(record, owner),
    ]);
    const pinned = await this.pinnedVersion(record, approved, owner);
    const directions = this.directionsFor(record, pinned);
    const studio = studioFor(project);
    const story = storyOf(project, studio);
    // Null where the studio runs no claim check (stories): nothing is flagged.
    const approvedTexts = studio.claimCheck
      ? project.approvedFacts.map((fact) => fact.text)
      : null;
    const voice = voiceOf(record);
    const voiced = voiceState.settled && usesTrack(voice.source);
    const segmentMs = new Map(
      (voiced ? (voiceState.track?.segments ?? []) : []).map((segment) => [
        segment.sceneId,
        segment.durationMs,
      ]),
    );
    const durationOf = (scene: VideoEditSceneRecord) => {
      const ms = segmentMs.get(scene.sceneId);

      // With a voiceover, each scene lasts as long as its voice segment.
      return ms ? Math.max(1, Math.ceil(ms / 1000)) : scene.durationSeconds;
    };
    let startSeconds = 0;
    const sceneStartMs = new Map<string, number>();
    const scenes: VideoEditScene[] = record.scenes.map((scene) => {
      sceneStartMs.set(scene.sceneId, startSeconds * 1000);
      const mapped: VideoEditScene = {
        sceneId: scene.sceneId,
        order: scene.order,
        purpose: scene.purpose,
        narration: scene.narration,
        lines: (scene.lines ?? []).map(readLine),
        sound: scene.sound ?? null,
        clipSound: clipSoundOf(scene),
        visual: scene.visual,
        onScreenText: scene.onScreenText,
        transitionIn: scene.transitionIn ?? SceneTransition.CUT,
        direction: directions.get(scene.sceneId) ?? null,
        cta: scene.cta,
        durationSeconds: durationOf(scene),
        startSeconds,
        media: presentMedia(scene.media, assets),
        flags: this.flagsFor(scene, approvedTexts),
      };
      startSeconds += durationOf(scene);
      return mapped;
    });
    const missingMediaCount = scenes.filter((scene) => !scene.media).length;
    const mediaComplete = missingMediaCount === 0;
    const voiceSettled = voiceState.settled;
    const voiceOutdated = voiceState.outdated;
    const captions = this.presentCaptions(
      record,
      scenes,
      sceneStartMs,
      voiceState,
      approvedTexts,
    );
    const music = await this.assetsService.currentAudio(
      project.id,
      AssetPurpose.MUSIC,
      owner,
    );
    const postCaptionText = record.postCaption ?? '';
    const postCaptionFlags =
      postCaptionText && approvedTexts
        ? this.claimCheck.checkText(postCaptionText, approvedTexts)
        : [];
    const captionFlagged =
      postCaptionFlags.length > 0 ||
      captions.lines.some((line) => line.flags.length > 0);
    const flagged =
      captionFlagged || scenes.some((scene) => scene.flags.length > 0);
    const newer = approved.find(
      (version) => version.number > record.scriptVersionNumber,
    );
    const scriptVersion = approved.find(
      (version) => version.id === record.scriptVersionId,
    );
    const sceneIndex = new Map(
      scenes.map((scene, index) => [scene.sceneId, index]),
    );
    const items = await this.itemsOf(record, project, owner, directions);

    await this.syncSummary(record, project, owner, {
      mediaComplete,
      voiceSettled,
    });

    return {
      id: record.id,
      projectId: record.projectId,
      scriptVersion: {
        id: record.scriptVersionId,
        number: record.scriptVersionNumber,
        approvedAt: scriptVersion?.approvedAt ?? null,
      },
      newerApprovedVersion: newer
        ? { id: newer.id, number: newer.number }
        : null,
      shoot: pinned?.shoot ?? null,
      clipContext: clipContextOf(pinned, project, story),
      scenes,
      totalSeconds: startSeconds,
      aiClipsEnabled: aiClipsEnabled(this.configService),
      consistentItems: items.map((item) => {
        const photo = item.assetId ? assets.get(item.assetId) : undefined;

        return {
          id: item.itemId,
          kind: item.kind,
          name:
            item.kind === ConsistentItemKind.PRODUCT
              ? project.product.title?.trim() || PRODUCT_FALLBACK_NAME
              : item.name,
          sceneIds: item.sceneIds
            .filter((id) => sceneIndex.has(id))
            .sort(
              (a, b) => (sceneIndex.get(a) ?? 0) - (sceneIndex.get(b) ?? 0),
            ),
          // A removed photo reads as none, so the item asks again.
          photo:
            photo?.kind === AssetKind.PHOTO &&
            photo.origin === AssetOrigin.UPLOAD
              ? photo
              : null,
          likenessConfirmed:
            item.kind === ConsistentItemKind.CHARACTER &&
            Boolean(item.likenessConfirmedAt),
        };
      }),
      voice: {
        source: voice.source,
        voiceId: voice.voiceId,
        speed: voice.speed,
        pronunciations: voice.pronunciations,
        recording: voiceState.recording,
        track: voiceState.track
          ? await this.voiceTracksService.present(voiceState.track)
          : null,
        outdated: voiceOutdated,
        settingsChanged: voiceState.settingsChanged,
      },
      captions,
      music: {
        asset: music,
        levelPercent: record.musicLevelPercent ?? DEFAULT_MUSIC_LEVEL,
      },
      endCard: {
        enabled: record.endCardEnabled ?? studio.endCardDefault,
        durationSeconds: END_CARD_SECONDS,
        productTitle: project.product.title,
        cta: record.scenes.find((scene) => scene.cta)?.cta ?? null,
        // A story's end card reads its title and the creator's end line.
        storyTitle: story ? project.title : null,
        endLine: story ? (record.endLine ?? null) : null,
      },
      postCaption: {
        text: postCaptionText,
        adTag: studio.adTag ? (record.adTag ?? true) : false,
        flags: postCaptionFlags,
      },
      readiness: {
        mediaComplete,
        missingMediaCount,
        voiceSettled,
        voiceOutdated,
        blocking: [
          ...(mediaComplete ? [] : [VideoEditBlocker.MEDIA_INCOMPLETE]),
          ...(voiceOutdated
            ? [VideoEditBlocker.VOICE_OUTDATED]
            : voiceSettled
              ? []
              : [VideoEditBlocker.VOICE_NOT_SETTLED]),
          ...(flagged ? [VideoEditBlocker.FLAGGED_LINES] : []),
        ],
      },
      studio: studio.type,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Whether the voice is settled for the version the video uses: No
   * voiceover always is; an AI voiceover or a timed recording must match the
   * chosen source, the video's version and (for a recording) the current file.
   */
  private async voiceState(
    record: VideoEditRecord,
    owner: OwnerContext,
  ): Promise<VoiceState> {
    const voice = voiceOf(record);
    const [track, recording] = await Promise.all([
      voice.trackId
        ? this.voiceTracksService.findRecord(voice.trackId, owner)
        : Promise.resolve(null),
      this.assetsService.currentAudio(
        record.projectId,
        AssetPurpose.RECORDING,
        owner,
      ),
    ]);

    if (!usesTrack(voice.source)) {
      return {
        track,
        recording,
        settled: true,
        outdated: false,
        settingsChanged: false,
      };
    }

    const current =
      track?.source === voice.source &&
      (voice.source !== VoiceSource.RECORDING ||
        track.recordingAssetId === recording?.id);
    const outdated = Boolean(
      current && track && track.scriptVersionId !== record.scriptVersionId,
    );

    return {
      track,
      recording,
      settled: Boolean(current) && !outdated,
      outdated,
      settingsChanged: Boolean(
        current &&
        voice.source === VoiceSource.AI &&
        track &&
        track.settingsKey !== voiceSettingsKey(voice),
      ),
    };
  }

  /**
   * Captions on the video's timeline. A voiced video uses the lines built
   * from its track; No voiceover shows each scene's on-screen text.
   */
  private presentCaptions(
    record: VideoEditRecord,
    scenes: VideoEditScene[],
    sceneStartMs: Map<string, number>,
    voiceState: VoiceState,
    approvedTexts: string[] | null,
  ): VideoEdit['captions'] {
    const captions = captionsOf(record);
    const voice = voiceOf(record);
    const toLine = (
      line: Omit<CaptionLineRecord, 'id' | 'edited'> & {
        id?: string;
        edited?: boolean;
      },
    ): CaptionLine => {
      const offset = sceneStartMs.get(line.sceneId) ?? 0;

      return {
        id: line.id ?? `${line.sceneId}-${line.startMs}`,
        sceneId: line.sceneId,
        startMs: offset + line.startMs,
        endMs: offset + line.endMs,
        text: line.text,
        edited: line.edited ?? false,
        flags:
          line.edited && approvedTexts
            ? this.claimCheck.checkText(
                line.text.replace(/\n/g, ' '),
                approvedTexts,
              )
            : [],
        words: line.words.map((word) => ({
          text: word.text,
          startMs: offset + word.startMs,
          endMs: offset + word.endMs,
        })),
      };
    };

    let lines: CaptionLine[] = [];
    let editable = false;

    if (voice.source === VoiceSource.NONE) {
      lines = scenes.flatMap((scene) =>
        textCaptions(scene.onScreenText, scene.durationSeconds * 1000).map(
          (line) => toLine({ ...line, sceneId: scene.sceneId }),
        ),
      );
    } else if (voice.source === VoiceSource.SCENE) {
      const edits = new Map(
        (captions.sceneEdits ?? []).map((edit) => [
          sceneCaptionId(edit.sceneId, edit.index),
          edit.text,
        ]),
      );

      lines = scenes.flatMap((scene) =>
        sceneSoundCaptions(scene).map((line, index) => {
          const id = sceneCaptionId(scene.sceneId, index);
          const text = edits.get(id);

          return toLine({
            ...line,
            id,
            sceneId: scene.sceneId,
            text: text ?? line.text,
            edited: text !== undefined,
          });
        }),
      );
      editable = true;
    } else if (
      voiceState.settled &&
      captions.builtFromTrackId === voiceState.track?.id
    ) {
      const order = new Map(
        scenes.map((scene, index) => [scene.sceneId, index]),
      );
      lines = [...captions.lines]
        .sort(
          (a, b) =>
            (order.get(a.sceneId) ?? 0) - (order.get(b.sceneId) ?? 0) ||
            a.startMs - b.startMs,
        )
        .map(toLine);
      editable = true;
    }

    return {
      enabled: captions.enabled,
      style: captions.style,
      lines,
      editable,
    };
  }

  private validateCaptions(
    input: CaptionsInput,
    current: VideoEditCaptionsRecord,
    voice: VideoEditVoiceRecord,
    scenes: VideoEditSceneRecord[],
  ): VideoEditCaptionsRecord {
    const next: VideoEditCaptionsRecord = {
      ...current,
      lines: current.lines.map((line) => ({ ...line })),
      sceneEdits: [...(current.sceneEdits ?? [])],
    };
    const sceneCaptions =
      voice.source === VoiceSource.SCENE
        ? new Map(
            scenes.flatMap((scene) =>
              sceneSoundCaptions(scene).map(
                (_, captionIndex) =>
                  [
                    sceneCaptionId(scene.sceneId, captionIndex),
                    { sceneId: scene.sceneId, index: captionIndex },
                  ] as const,
              ),
            ),
          )
        : null;

    if (typeof input.enabled === 'boolean') next.enabled = input.enabled;
    if (input.style) next.style = input.style;

    for (const [index, change] of (input.lines ?? []).entries()) {
      const line = sceneCaptions
        ? undefined
        : next.lines.find((item) => item.id === change.id);
      const place = sceneCaptions?.get(change.id);

      if (voice.source === VoiceSource.NONE || (!line && !place)) {
        throw new ConflictError('These captions can’t be edited.', {
          code: 'CAPTION_NOT_EDITABLE',
        });
      }

      const rows = change.text
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean);

      if (!rows.length || rows.length > CAPTION_MAX_LINES) {
        throw new ValidationError('Keep each caption to 2 lines.', {
          field: `input.captions.lines.${index}.text`,
        });
      }
      if (rows.some((row) => row.length > CAPTION_LINE_CHARS)) {
        throw new ValidationError('Use 32 characters or fewer per line.', {
          field: `input.captions.lines.${index}.text`,
        });
      }

      if (place) {
        next.sceneEdits = [
          ...(next.sceneEdits ?? []).filter(
            (edit) =>
              edit.sceneId !== place.sceneId || edit.index !== place.index,
          ),
          { ...place, text: rows.join('\n') },
        ];
        continue;
      }
      if (!line) continue;

      line.text = rows.join('\n');
      line.edited = true;
    }

    return next;
  }

  private validateVoice(
    input: VoiceSettingsInput,
    current: VideoEditVoiceRecord,
  ): VideoEditVoiceRecord {
    const next = { ...current };

    if (input.source) next.source = input.source;

    if (input.voiceId !== undefined) {
      if (
        input.voiceId !== null &&
        !this.voiceService.isAllowed(input.voiceId)
      ) {
        throw new ValidationError('That voice isn’t available.', {
          field: 'input.voice.voiceId',
        });
      }
      next.voiceId = input.voiceId;
    }

    if (input.speed !== undefined && input.speed !== null) {
      if (!SPEEDS.includes(input.speed)) {
        throw new ValidationError('Choose 0.9×, 1.0× or 1.1×.', {
          field: 'input.voice.speed',
        });
      }
      next.speed = input.speed;
    }

    if (input.pronunciations) {
      if (input.pronunciations.length > MAX_PRONUNCIATIONS) {
        throw new ValidationError('You can add up to 20 words.', {
          field: 'input.voice.pronunciations',
        });
      }
      next.pronunciations = input.pronunciations.map((rule, index) => {
        const word = rule.word.trim();
        const sayAs = rule.sayAs.trim();

        if (!word || word.length > 40 || !sayAs || sayAs.length > 60) {
          throw new ValidationError(
            'Use a word of up to 40 characters and a spelling of up to 60.',
            { field: `input.voice.pronunciations.${index}` },
          );
        }

        return { word, sayAs };
      });
    }

    return next;
  }

  private async forVoiceJob(projectId: string, owner: OwnerContext) {
    const project = await this.projectsService.getRecord(projectId, owner);
    const record = await this.getRecord(project.id, owner);
    const video = await this.present(record, project, owner);

    if (!video.readiness.mediaComplete) {
      throw new ConflictError('Choose media for every scene first.', {
        code: 'MEDIA_INCOMPLETE',
      });
    }

    return { project, record };
  }

  private async syncSummary(
    record: VideoEditRecord,
    project: ProjectRecord,
    owner: OwnerContext,
    state: { mediaComplete: boolean; voiceSettled: boolean },
  ): Promise<void> {
    const current = project.videoSummary;

    if (
      current?.scriptVersionId === record.scriptVersionId &&
      current.mediaComplete === state.mediaComplete &&
      current.voiceSettled === state.voiceSettled
    ) {
      return;
    }

    await this.projectsService.syncVideo(project.id, owner, {
      exportCount: 0,
      latestExportAt: null,
      ...current,
      scriptVersionId: record.scriptVersionId,
      mediaComplete: state.mediaComplete,
      voiceSettled: state.voiceSettled,
    });
  }

  /**
   * What viewers read on screen is claim-checked like the script, where the
   * studio runs the claim check (`approvedTexts` is null where it doesn't).
   */
  private flagsFor(
    scene: VideoEditSceneRecord,
    approvedTexts: string[] | null,
  ): ClaimFlag[] {
    return scene.onScreenText && approvedTexts
      ? this.claimCheck.checkText(scene.onScreenText, approvedTexts)
      : [];
  }

  private async readyAssets(
    projectId: string,
    owner: OwnerContext,
  ): Promise<Map<string, ProjectAsset>> {
    const assets = await this.assetsService.list(projectId, owner);

    return new Map(assets.map((asset) => [asset.id, asset]));
  }

  private scope(projectId: string, owner: OwnerContext) {
    return applyTenantFilter<VideoEditRecord>(
      { projectId, ownerId: owner.ownerId },
      owner.organizationId,
    );
  }

  private async findRecord(
    projectId: string,
    owner: OwnerContext,
  ): Promise<VideoEditRecord | null> {
    const [record] = await this.edits
      .list(this.scope(projectId, owner))
      .collect();

    return record ? this.withSkitSound(record, owner) : null;
  }

  /**
   * Until 2026-09-26 the scene schema dropped `lines`, `sound` and
   * `clipSound` on every write, so a skit video saved before then reads them
   * from its pinned version: the lines and sound as approved, and clip sound
   * at the skit default (on at 100%), since a creator's setting was never
   * kept. Only scenes with no narration and no lines can be such a skit
   * scene, so narrated videos skip the lookup. The first save of the scenes
   * stores the repair; nothing is backfilled.
   */
  private async withSkitSound(
    record: VideoEditRecord,
    owner: OwnerContext,
  ): Promise<VideoEditRecord> {
    const lost = (scene: VideoEditSceneRecord) =>
      scene.lines === undefined && !scene.narration.trim();

    if (!record.scenes.some(lost)) return record;

    const version = await this.scriptsService
      .getRecord(record.scriptVersionId, owner)
      .catch(() => null);

    if (!version || !isSkit(version.contentStyle)) return record;

    const approved = new Map(version.scenes.map((scene) => [scene.id, scene]));

    return {
      ...record,
      scenes: record.scenes.map((scene) => {
        if (!lost(scene)) return scene;

        const source = approved.get(scene.sceneId);

        return {
          ...scene,
          lines: source?.lines ?? [],
          sound: scene.sound ?? source?.sound ?? null,
          clipSound: scene.clipSound ?? { on: true, levelPercent: 100 },
        };
      }),
    };
  }

  private async getRecord(
    projectId: string,
    owner: OwnerContext,
  ): Promise<VideoEditRecord> {
    const record = await this.findRecord(projectId, owner);

    if (!record) {
      throw new ConflictError('Start the video first.', {
        code: 'VIDEO_NOT_STARTED',
      });
    }

    return record;
  }
}

/**
 * Copies a version's scenes into the video. When switching versions, a scene
 * keeps the media of the scene that held the same position and purpose.
 */
function scenesFrom(
  version: ScriptVersionRecord,
  previous: VideoEditSceneRecord[],
  keepClipSound = true,
): VideoEditSceneRecord[] {
  const skit = isSkit(version.contentStyle);

  return [...version.scenes]
    .sort((a, b) => a.order - b.order)
    .map((scene, index) => {
      const before = previous[index];

      return {
        sceneId: scene.id,
        order: index + 1,
        purpose: scene.purpose,
        narration: scene.narration,
        ...(skit
          ? { lines: scene.lines ?? [], sound: scene.sound ?? null }
          : {}),
        // Skits play their clips' sound; a switch keeps each scene's setting
        // unless it moves between a skit and a narrated version.
        clipSound: (keepClipSound ? before?.clipSound : undefined) ?? {
          on: skit,
          levelPercent: 100,
        },
        visual: scene.visual,
        onScreenText: scene.onScreenText,
        transitionIn: scene.transitionIn ?? SceneTransition.CUT,
        direction: scene.direction ?? null,
        cta: scene.cta,
        durationSeconds: scene.durationSeconds,
        media: before?.purpose === scene.purpose ? before.media : null,
      };
    });
}

/**
 * What AI clip descriptions take from the script for the whole video: the
 * pinned version's language (the story's or the project's, when the version
 * can't be read) and chosen hook's opening shot, and the project's tone,
 * which versions don't store. A story adds its genre, which sets the mood,
 * and its cast, so a description can name each character with their look.
 */
function clipContextOf(
  version: ScriptVersionRecord | null,
  project: ProjectRecord,
  story: StoryRecord | null,
): ClipContext {
  const hook = version?.hooks.find(
    (item) => item.id === version.selectedHookId,
  );

  return {
    language: version?.language ?? story?.language ?? project.strategy.language,
    tone: project.strategy.tone,
    openingShot: hook?.openingShot.trim() || null,
    genre: story?.genre ?? null,
    cast: (story?.cast ?? []).map(({ id, name, role, look }) => ({
      id,
      name,
      role,
      look,
    })),
  };
}

/** The project's story where its studio has a Story step; null otherwise. */
function storyOf(
  project: ProjectRecord,
  studio: StudioDefinition,
): StoryRecord | null {
  return studio.intakeSteps.includes(ProjectStepKey.STORY)
    ? readStory(project)
    : null;
}

/** What leads the studio's Keep consistent list: the product, or the cast. */
function consistentSubject(
  project: ProjectRecord,
  studio: StudioDefinition,
): ConsistentSubject {
  return {
    product: studio.keepConsistent.product,
    cast: studio.keepConsistent.characters ? readStory(project).cast : [],
  };
}

/** A story's end line: trimmed, at most 60 characters; empty clears it. */
function validateEndLine(value: string): string | null {
  const line = value.replace(/\s+/g, ' ').trim();

  if (line.length > MAX_END_LINE) {
    throw new ValidationError('Use 60 characters or fewer.', {
      field: 'input.endLine',
    });
  }

  return line || null;
}

function clipSoundOf(scene: VideoEditSceneRecord): ClipSoundRecord {
  return scene.clipSound ?? DEFAULT_CLIP_SOUND;
}

/** A clip with its sound on above 0% plays that sound in the video. */
function playsClipSound(scene: VideoEditScene, isClip: boolean): boolean {
  return isClip && scene.clipSound.on && scene.clipSound.levelPercent > 0;
}

/** The scene's spoken words, nothing voiced for a scene without them. */
function assertNarration(record: VideoEditRecord): void {
  if (record.scenes.every((scene) => !scene.narration.trim())) {
    throw new ConflictError('This script has no narration to read.', {
      code: 'NO_NARRATION',
    });
  }
}

function sceneCaptionId(sceneId: string, index: number): string {
  return `${sceneId}~${index}`;
}

/**
 * Captions for Sound from your clips: a skit scene's lines, or a narrated
 * scene's narration (Talking to camera). A scene with nothing spoken shows
 * its on-screen text, as with No voiceover.
 */
function sceneSoundCaptions(scene: {
  narration: string;
  lines?: { text: string; pauseSeconds?: number | null }[] | null;
  onScreenText: string;
  durationSeconds: number;
}): CaptionDraft[] {
  const sceneMs = scene.durationSeconds * 1000;
  const spoken = scene.lines?.length
    ? scene.lines.map((line) => line.text)
    : [scene.narration];
  const drafts = spokenCaptions(
    spoken,
    sceneMs,
    (scene.lines ?? []).map((line) => line.pauseSeconds ?? 0),
  );

  return drafts.length ? drafts : textCaptions(scene.onScreenText, sceneMs);
}

function transitionSuffix(order: number, transition: SceneTransition): string {
  if (order === 1 || transition === SceneTransition.CUT) return '';

  const label: Record<Exclude<SceneTransition, SceneTransition.CUT>, string> = {
    [SceneTransition.PUNCH_IN]: 'Punch-in',
    [SceneTransition.WHIP]: 'Whip in',
    [SceneTransition.DISSOLVE]: 'Dissolve in',
  };

  return ` · ${label[transition]}`;
}

function validateMedia(
  choice: SceneMediaChoiceInput,
  scene: VideoEditSceneRecord,
  assets: Map<string, ProjectAsset>,
  field: string,
): SceneMediaRecord {
  if (choice.kind === SceneMediaKind.TEXT_CARD) {
    return {
      kind: SceneMediaKind.TEXT_CARD,
      assetId: null,
      motion: PhotoMotion.STILL,
      clipStartSeconds: 0,
    };
  }

  const asset = choice.assetId ? assets.get(choice.assetId) : undefined;

  if (!asset) {
    throw new NotFoundError('We can’t find that file.');
  }

  // An AI clip fills a scene only after the creator's accuracy check (R20).
  if (asset.origin === AssetOrigin.AI_CLIP && !asset.aiClip?.checkedAt) {
    throw new ConflictError('Check this clip before you use it.', {
      code: 'CLIP_NOT_CHECKED',
    });
  }

  if (asset.kind === AssetKind.PHOTO) {
    return {
      kind: SceneMediaKind.ASSET,
      assetId: asset.id,
      motion: choice.motion ?? PhotoMotion.SLOW_ZOOM,
      clipStartSeconds: 0,
    };
  }

  const start = choice.clipStartSeconds ?? 0;
  const clipSeconds = asset.durationSeconds ?? 0;

  if (
    !Number.isFinite(start) ||
    start < 0 ||
    Math.round(start / CLIP_START_STEP) * CLIP_START_STEP !== start
  ) {
    throw new ValidationError('Use a start time in half seconds.', {
      field: `${field}.clipStartSeconds`,
    });
  }

  // A clip shorter than its scene plays from the start, slowed to fill it
  // (the render and preview do that); a longer one must leave room for the
  // whole scene.
  const latestStart = Math.max(0, clipSeconds - scene.durationSeconds);

  if (start > latestStart) {
    throw new ValidationError(
      clipSeconds > scene.durationSeconds
        ? `Start earlier. This clip is ${formatSeconds(clipSeconds)} s and the scene needs ${scene.durationSeconds} s.`
        : 'This clip is shorter than the scene, so it starts at 0 s.',
      { field: `${field}.clipStartSeconds` },
    );
  }

  return {
    kind: SceneMediaKind.ASSET,
    assetId: asset.id,
    motion: PhotoMotion.STILL,
    clipStartSeconds: start,
  };
}

function defaultMediaFor(asset: ProjectAsset): SceneMediaRecord {
  return {
    kind: SceneMediaKind.ASSET,
    assetId: asset.id,
    motion:
      asset.kind === AssetKind.PHOTO
        ? PhotoMotion.SLOW_ZOOM
        : PhotoMotion.STILL,
    clipStartSeconds: 0,
  };
}

function hasMedia(
  scene: VideoEditSceneRecord,
  assets: Map<string, ProjectAsset>,
): boolean {
  return presentMedia(scene.media, assets) !== null;
}

/** Media whose file was removed reads as empty, so the scene asks again. */
function presentMedia(
  media: SceneMediaRecord | null,
  assets: Map<string, ProjectAsset>,
): VideoEditScene['media'] {
  if (!media) return null;
  if (media.kind === SceneMediaKind.TEXT_CARD) {
    return { ...media, asset: null };
  }

  const asset = media.assetId ? assets.get(media.assetId) : undefined;

  return asset
    ? {
        kind: media.kind,
        asset,
        motion: media.motion,
        clipStartSeconds: media.clipStartSeconds,
      }
    : null;
}

function formatSeconds(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function voiceOf(record: VideoEditRecord): VideoEditVoiceRecord {
  return { ...DEFAULT_VOICE, ...(record.voice ?? {}) };
}

function captionsOf(record: VideoEditRecord): VideoEditCaptionsRecord {
  return { ...DEFAULT_CAPTIONS, ...(record.captions ?? {}) };
}

function findScene(
  scenes: VideoEditSceneRecord[],
  sceneId: string,
  field: string,
): VideoEditSceneRecord {
  const scene = scenes.find((item) => item.sceneId === sceneId);

  if (!scene) {
    throw new ValidationError('That scene isn’t part of this video.', {
      field: `${field}.sceneId`,
    });
  }

  return scene;
}

/** A new order must list every scene exactly once. */
function reorderScenes(
  scenes: VideoEditSceneRecord[],
  order: string[],
): VideoEditSceneRecord[] {
  const byId = new Map(scenes.map((scene) => [scene.sceneId, scene]));

  if (
    order.length !== scenes.length ||
    new Set(order).size !== order.length ||
    order.some((id) => !byId.has(id))
  ) {
    throw new ValidationError('List every scene once to reorder them.', {
      field: 'input.sceneOrder',
    });
  }

  return order.map((id, index) => {
    const scene = byId.get(id);
    if (!scene) {
      throw new ValidationError('List every scene once to reorder them.', {
        field: 'input.sceneOrder',
      });
    }
    return { ...scene, order: index + 1 };
  });
}

/** Captions built from a track's words, one set per scene. */
function captionLinesFrom(track: VoiceTrackRecord): CaptionLineRecord[] {
  return track.segments.flatMap((segment) =>
    buildSceneCaptions(segment.words, segment.durationMs).map((line) => ({
      id: new Types.ObjectId().toHexString(),
      sceneId: segment.sceneId,
      ...line,
      edited: false,
    })),
  );
}
