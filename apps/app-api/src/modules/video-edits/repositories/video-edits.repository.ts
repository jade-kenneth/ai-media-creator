import { Connection } from 'mongoose';
import type {
  CaptionStyle,
  ConsistentItemKind,
  PhotoMotion,
  ScenePurpose,
  SceneTransition,
  SceneMediaKind,
  VoiceSource,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type {
  SceneDirectionRecord,
  SceneLineRecord,
} from 'src/modules/scripts/repositories/scripts.repository';
import type { Repository } from 'src/libs/repository';

export interface SceneMediaRecord {
  kind: SceneMediaKind;
  assetId: string | null;
  motion: PhotoMotion;
  clipStartSeconds: number;
}

/** Whether a clip scene plays the clip's own sound, and how loud (0–100). */
export interface ClipSoundRecord {
  on: boolean;
  levelPercent: number;
}

/** A scene copied from the approved version, plus what viewers see. */
export interface VideoEditSceneRecord {
  sceneId: string;
  order: number;
  purpose: ScenePurpose;
  narration: string;
  /** The approved version's spoken lines (skits); absent on narrated scenes. */
  lines?: SceneLineRecord[];
  /** The approved version's sound cue (skits); absent or null when none. */
  sound?: string | null;
  /** Absent on edits stored before clip sound existed: read as off at 100%. */
  clipSound?: ClipSoundRecord;
  visual: string;
  onScreenText: string;
  /** Absent on video edits started before scene transitions existed. */
  transitionIn?: SceneTransition | null;
  /**
   * The approved version's shot direction; null when that scene has none.
   * Absent (undefined) on edits stored before it was copied.
   */
  direction?: SceneDirectionRecord | null;
  cta: string | null;
  durationSeconds: number;
  media: SceneMediaRecord | null;
}

export interface VideoEditVoiceRecord {
  source: VoiceSource;
  voiceId: string | null;
  speed: number;
  pronunciations: { word: string; sayAs: string }[];
  /** The latest track made for this video (any source or version). */
  trackId: string | null;
}

/** Times are milliseconds from the start of the caption's scene. */
export interface CaptionLineRecord {
  id: string;
  sceneId: string;
  startMs: number;
  endMs: number;
  text: string;
  words: { text: string; startMs: number; endMs: number }[];
  edited: boolean;
}

/**
 * A creator's wording for one caption built from the spoken lines (Sound
 * from your clips), by its place in the scene. Timing is rebuilt on read, so
 * it follows scene length changes; the wording stays.
 */
export interface SceneCaptionEditRecord {
  sceneId: string;
  index: number;
  text: string;
}

export interface VideoEditCaptionsRecord {
  enabled: boolean;
  style: CaptionStyle;
  /** Built from a voice track; rebuilt whenever a new track is applied. */
  lines: CaptionLineRecord[];
  builtFromTrackId: string | null;
  /** Edits to captions built from the spoken lines; absent until one is made. */
  sceneEdits?: SceneCaptionEditRecord[];
}

/**
 * Something that must look the same in every AI clip it appears in
 * (Product Specification §3.21). SCRIPT items come from the approved
 * version's props; STORY items from the story's cast (§3.23); CREATOR items
 * were added or renamed by the creator.
 */
export interface ConsistentItemRecord {
  itemId: string;
  kind: ConsistentItemKind;
  /** The product's title when it was derived; the product reads its current title. */
  name: string;
  sceneIds: string[];
  /** A ready photo the creator uploaded to this project. */
  assetId: string | null;
  origin: 'SCRIPT' | 'STORY' | 'CREATOR';
  /**
   * CHARACTER only: when the creator confirmed the person in the photo agreed
   * to appear, or that they have the rights to the character (§3.23 D3).
   * Absent or null without a confirmed photo.
   */
  likenessConfirmedAt?: Date | null;
}

export interface VideoEditRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  scriptVersionId: string;
  scriptVersionNumber: number;
  scenes: VideoEditSceneRecord[];
  /** Missing on videos started before Voice existed; read as the defaults. */
  voice?: VideoEditVoiceRecord;
  captions?: VideoEditCaptionsRecord;
  /** Missing until changed: 20%. The track is the project's current music. */
  musicLevelPercent?: number;
  /** Missing until changed: the studio's default (Affiliate on, stories off). */
  endCardEnabled?: boolean;
  /** Stories: the end card's closing line (≤ 60); missing or null for none. */
  endLine?: string | null;
  /** Copied from the approved version's caption when the video starts. */
  postCaption?: string | null;
  adTag?: boolean | null;
  /** Absent on videos stored before §3.21; read as derived from the pinned version. */
  consistentItems?: ConsistentItemRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export type VideoEditsRepository = Repository<VideoEditRecord>;

export async function VideoEditsRepositoryFactory(
  connection: Connection,
): Promise<VideoEditsRepository> {
  return new MongooseRepository<VideoEditRecord>(
    connection,
    'VideoEdits',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      scriptVersionId: { type: String, required: true },
      scriptVersionNumber: { type: Number, required: true },
      scenes: [
        {
          _id: false,
          sceneId: String,
          order: Number,
          purpose: String,
          narration: String,
          // Skits only. No defaults: narrated scenes and older edits stay
          // without them, and lines keep their beat directions as copied.
          lines: { type: [Object], default: undefined },
          sound: { type: String },
          clipSound: { type: Object },
          visual: String,
          onScreenText: String,
          transitionIn: { type: String, default: null },
          // No default: an absent value marks an edit stored before directions were copied.
          direction: { type: Object },
          cta: { type: String, default: null },
          durationSeconds: Number,
          media: { type: Object, default: null },
        },
      ],
      voice: { type: Object, default: null },
      captions: { type: Object, default: null },
      musicLevelPercent: { type: Number, default: null },
      endCardEnabled: { type: Boolean, default: null },
      // Declared so Mongoose strict mode keeps it.
      endLine: { type: String, default: null },
      postCaption: { type: String, default: null },
      adTag: { type: Boolean, default: null },
      // No default: an absent list marks a video stored before §3.21.
      consistentItems: { type: [Object], default: undefined },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1 }, { unique: true }],
    ],
  );
}
