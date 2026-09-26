import { Connection } from 'mongoose';
import type {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ScriptOriginKind,
  ShotFraming,
  ShotSubject,
  StudioType,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';
import type { FactSnapshot } from '../../projects/repositories/projects.repository';

export interface ScriptHookRecord {
  id: string;
  type: HookType;
  text: string;
  openingShot: string;
  /** Product claims the draft said this hook makes (untrusted, re-checked). */
  reportedClaims: string[];
}

export interface SceneDirectionRecord {
  inFrame: ShotSubject;
  framing: ShotFraming;
  setting: string;
  /** Comma-separated; may be empty. */
  props: string;
}

export interface ShootPlanRecord {
  scenario: string;
  /** Null when nobody appears on camera. */
  presenter: string | null;
}

/**
 * A line someone says on camera in a skit, acted as a beat. The directions
 * are absent on lines written before beats existed (read as empty, no pause).
 */
export interface SceneLineRecord {
  /** A first name from the cast; may be empty. */
  speaker: string;
  text: string;
  /** Where the camera is for this beat; empty keeps the scene's framing. */
  shot?: string;
  /** What the speaker does silently just before the line; may be empty. */
  reaction?: string;
  /** How long the reaction holds before the first word: 0 to 3 s, steps of 0.5. */
  pauseSeconds?: number;
  /** The speaker's face and voice while saying the line; may be empty. */
  delivery?: string;
}

export interface ScriptSceneRecord {
  id: string;
  order: number;
  purpose: ScenePurpose;
  durationSeconds: number;
  /** Empty in skits, which have no narrator. */
  narration: string;
  /** Skits only; absent on narrated scenes and older versions. */
  lines?: SceneLineRecord[];
  /** The natural sound the action makes (skits); absent or null when none. */
  sound?: string | null;
  onScreenText: string;
  visual: string;
  /** Absent on versions written before shot direction existed. */
  direction?: SceneDirectionRecord | null;
  /** Absent on versions written before scene transitions existed. */
  transitionIn?: SceneTransition | null;
  cta: string | null;
  factIds: string[];
  reportedClaims: string[];
}

/** Stored as DRAFT or APPROVED; NEEDS_REVIEW is derived on read. */
export type StoredScriptStatus = 'DRAFT' | 'APPROVED';

export interface ScriptVersionRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  number: number;
  status: StoredScriptStatus;
  origin: { kind: ScriptOriginKind; fromNumber: number | null };
  angleTitle: string | null;
  language: ScriptLanguage;
  lengthSeconds: number;
  /** The style it was written in; absent on versions from before skits (narrated). */
  contentStyle?: ContentStyle | null;
  /** A `StudioType`; missing on versions from before studios, which read Affiliate. */
  studio?: StudioType | null;
  /**
   * Written as a series' final episode (§3.25): the last scene ends the story
   * instead of a cliffhanger. Missing reads false.
   */
  endsSeries?: boolean | null;
  hooks: ScriptHookRecord[];
  selectedHookId: string | null;
  scenes: ScriptSceneRecord[];
  /** Absent on versions written before shot direction existed. */
  shoot?: ShootPlanRecord | null;
  caption: string;
  approvedAt: Date | null;
  /** The approved facts this version used, as they read at approval. */
  approvedFactSnapshot: FactSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

export type ScriptsRepository = Repository<ScriptVersionRecord>;

export async function ScriptsRepositoryFactory(
  connection: Connection,
): Promise<ScriptsRepository> {
  return new MongooseRepository<ScriptVersionRecord>(
    connection,
    'ScriptVersions',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      number: { type: Number, required: true },
      status: { type: String, required: true },
      origin: { type: Object, required: true },
      angleTitle: { type: String, default: null },
      language: { type: String, required: true },
      lengthSeconds: { type: Number, required: true },
      contentStyle: { type: String, default: null },
      studio: { type: String, default: null },
      endsSeries: { type: Boolean, default: null },
      hooks: { type: [Object], default: [] },
      selectedHookId: { type: String, default: null },
      scenes: { type: [Object], default: [] },
      shoot: { type: Object, default: null },
      caption: { type: String, default: '' },
      approvedAt: { type: Date, default: null },
      approvedFactSnapshot: { type: [Object], default: [] },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, number: -1 }],
      [{ projectId: 1, number: 1 }, { unique: true }],
    ],
  );
}
