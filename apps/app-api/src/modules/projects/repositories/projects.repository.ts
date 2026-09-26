import { Connection } from 'mongoose';
import type {
  AngleKind,
  ConsistentItemKind,
  AngleType,
  ContentStyle,
  FieldSource,
  ImportOutcome,
  Platform,
  PremiseKind,
  ProductField,
  ProjectStatus,
  ScriptLanguage,
  StoryGenre,
  Storytelling,
  StudioType,
  Tone,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export interface ProductFeatureRecord {
  id: string;
  text: string;
  source: FieldSource;
}

export interface ProductImportRecord {
  outcome: ImportOutcome;
  host: string;
  filled: ProductField[];
  missing: ProductField[];
  at: Date;
}

/** Affiliate Studio's product; optional so other studios can omit it. */
export interface ProductRecord {
  title: string | null;
  category: string | null;
  pricePhp: number | null;
  description: string | null;
  affiliateUrl: string | null;
  features: ProductFeatureRecord[];
  /**
   * Where each filled scalar field's value came from. Mongo drops an empty
   * object on save, so a stored record may lack it: read through
   * `storedFieldSources()`.
   */
  fieldSources: Partial<Record<ProductField, FieldSource>>;
  importUrl: string | null;
  lastImport: ProductImportRecord | null;
}

export interface SelectedAngleRecord {
  kind: AngleKind;
  suggestionId: string | null;
  text: string;
}

export interface StrategyRecord {
  buyer: string | null;
  problem: string | null;
  benefit: string | null;
  platform: Platform;
  language: ScriptLanguage;
  lengthSeconds: number;
  tone: Tone;
  contentStyle: ContentStyle;
  selectedAngle: SelectedAngleRecord | null;
}

export interface AngleSuggestionRecord {
  id: string;
  type: AngleType;
  title: string;
  pitch: string;
  factIds: string[];
}

export interface AudienceSuggestionRecord {
  id: string;
  buyer: string;
  problem: string;
  benefit: string;
  factIds: string[];
}

export interface AudienceSuggestionSetRecord {
  suggestions: AudienceSuggestionRecord[];
  /** Approved facts (ids + wording) the suggestions were grounded in. */
  factsFingerprint: string;
  createdAt: Date;
}

export interface AngleSuggestionSetRecord {
  suggestions: AngleSuggestionRecord[];
  /** Approved facts (ids + wording) the suggestions were grounded in. */
  factsFingerprint: string;
  createdAt: Date;
}

export interface StoryCharacterRecord {
  id: string;
  name: string;
  role: string;
  look: string;
}

export interface StoryPremiseRecord {
  kind: PremiseKind;
  suggestionId: string | null;
  title: string;
  logline: string;
}

/** Entertainment Studio's intake (Product Specification §3.23). */
export interface StoryRecord {
  genre: StoryGenre | null;
  /** Missing on records created before Phase 32; read through `readStory()`. */
  detail?: string;
  premise: StoryPremiseRecord | null;
  cast: StoryCharacterRecord[];
  storytelling: Storytelling;
  language: ScriptLanguage;
  lengthSeconds: number;
}

export interface PremiseSuggestionRecord {
  id: string;
  title: string;
  logline: string;
  cast: StoryCharacterRecord[];
}

export interface PremiseSuggestionSetRecord {
  suggestions: PremiseSuggestionRecord[];
  /** The genre they were suggested for; a different story genre makes them stale. */
  genre: StoryGenre;
  /** Missing on sets created before Phase 32; presented as an empty string. */
  detail?: string;
  createdAt: Date;
}

export interface FactSnapshot {
  id: string;
  text: string;
}

/** Kept in sync by the facts module after every fact change. */
export interface FactsSummaryRecord {
  total: number;
  unreviewed: number;
  approved: number;
  rejected: number;
  unknown: number;
}

export interface ApprovedScriptSnapshot {
  versionId: string;
  number: number;
  /** The approved facts this version used, as they read at approval. */
  usedFacts: FactSnapshot[];
  /**
   * The version's last scene as the next episode reads it (§3.25): acted
   * lines as `Name: line`, or the narration. Missing on summaries synced
   * before episodes; the next episode resyncs its source first.
   */
  lastScene?: string;
}

/** Kept in sync by the scripts module after every version change. */
export interface ScriptSummaryRecord {
  versionCount: number;
  latestNumber: number;
  latestIsDraft: boolean;
  approved: ApprovedScriptSnapshot[];
}

/**
 * Kept in sync by the video-edits module (and later voice and exports) so
 * project progress stays a pure function of the project record.
 */
export interface VideoSummaryRecord {
  /** The approved version the video edit uses. */
  scriptVersionId: string;
  mediaComplete: boolean;
  /** A voiceover (or No voiceover) is settled for the edit's version. */
  voiceSettled: boolean;
  exportCount: number;
  latestExportAt: Date | null;
  /** The latest export's poster, shown as the project thumbnail. */
  posterKey?: string | null;
  latestExportDownloaded?: boolean;
}

/**
 * A Keep consistent item carried into the next episode (§3.25): a character
 * or prop with its photo (copied into the new project) and, for a character,
 * its likeness confirmation. Seeds the video's list when Media starts.
 */
export interface CarriedItemRecord {
  itemId: string;
  kind: ConsistentItemKind;
  name: string;
  assetId: string | null;
  likenessConfirmedAt?: Date | null;
}

/** A story episode's own series state (§3.25); missing reads as defaults. */
export interface EpisodeRecord {
  isFinal: boolean;
  /** The previous episode's approved version number this episode's script was written from. */
  writtenFromVersion: number | null;
  /** What happened in this episode (≤ 300), written by the next episode's script job. */
  recap: string | null;
  /** The approved version number the recap was written from. */
  recapFromVersion: number | null;
  /** Items copied from the previous episode; empty for Episode 1. */
  carriedItems: CarriedItemRecord[];
}

export interface ProjectRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  /** A `StudioType`; read through `studioFor()` (missing reads Affiliate). */
  studioType: StudioType;
  title: string;
  /** Lower-cased title for case-insensitive Name A–Z sorting. */
  titleSort: string;
  status: ProjectStatus;
  product: ProductRecord;
  strategy: StrategyRecord;
  angleSuggestionSet: AngleSuggestionSetRecord | null;
  /** Missing on projects from before audience suggestions; read as null. */
  audienceSuggestionSet?: AudienceSuggestionSetRecord | null;
  /** Entertainment Studio only; missing or null for other studios. */
  story?: StoryRecord | null;
  premiseSuggestionSet?: PremiseSuggestionSetRecord | null;
  /**
   * Stories in a series (§3.25): Episode 1's project id, shared by every
   * episode. Missing or null for a story that never used Next episode (a
   * series of one) and for other studios.
   */
  seriesId?: string | null;
  /** 1-based; missing reads as 1. */
  episodeNumber?: number | null;
  episode?: EpisodeRecord | null;
  factsSummary: FactsSummaryRecord;
  approvedFacts: FactSnapshot[];
  scriptSummary: ScriptSummaryRecord;
  /** Null or missing until a video edit starts. */
  videoSummary?: VideoSummaryRecord | null;
  thumbnailKey: string | null;
  assetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectsRepository = Repository<ProjectRecord>;

/** A stored product's field sources; `{}` when Mongo dropped the empty object. */
export function storedFieldSources(
  product: ProductRecord,
): Partial<Record<ProductField, FieldSource>> {
  return (
    (product.fieldSources as ProductRecord['fieldSources'] | undefined) ?? {}
  );
}

const factSnapshotDefinition = [{ _id: false, id: String, text: String }];

export async function ProjectsRepositoryFactory(
  connection: Connection,
): Promise<ProjectsRepository> {
  return new MongooseRepository<ProjectRecord>(
    connection,
    'Projects',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      studioType: { type: String, required: true },
      title: { type: String, required: true },
      titleSort: { type: String, required: true },
      status: { type: String, required: true },
      product: {
        title: { type: String, default: null },
        category: { type: String, default: null },
        pricePhp: { type: Number, default: null },
        description: { type: String, default: null },
        affiliateUrl: { type: String, default: null },
        features: [{ _id: false, id: String, text: String, source: String }],
        fieldSources: { type: Object, default: {} },
        importUrl: { type: String, default: null },
        lastImport: { type: Object, default: null },
      },
      strategy: {
        buyer: { type: String, default: null },
        problem: { type: String, default: null },
        benefit: { type: String, default: null },
        platform: String,
        language: String,
        lengthSeconds: Number,
        tone: String,
        contentStyle: String,
        selectedAngle: { type: Object, default: null },
      },
      angleSuggestionSet: { type: Object, default: null },
      audienceSuggestionSet: { type: Object, default: null },
      // Declared so Mongoose strict mode keeps them (the 2026-09-26 lesson).
      story: { type: Object, default: null },
      premiseSuggestionSet: { type: Object, default: null },
      seriesId: { type: String, default: null },
      episodeNumber: { type: Number, default: null },
      episode: { type: Object, default: null },
      factsSummary: {
        total: { type: Number, default: 0 },
        unreviewed: { type: Number, default: 0 },
        approved: { type: Number, default: 0 },
        rejected: { type: Number, default: 0 },
        unknown: { type: Number, default: 0 },
      },
      approvedFacts: factSnapshotDefinition,
      scriptSummary: {
        versionCount: { type: Number, default: 0 },
        latestNumber: { type: Number, default: 0 },
        latestIsDraft: { type: Boolean, default: false },
        approved: [
          {
            _id: false,
            versionId: String,
            number: Number,
            usedFacts: factSnapshotDefinition,
            lastScene: String,
          },
        ],
      },
      videoSummary: { type: Object, default: null },
      thumbnailKey: { type: String, default: null },
      assetCount: { type: Number, default: 0 },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, ownerId: 1, updatedAt: -1 }],
      [{ organizationId: 1, ownerId: 1, titleSort: 1 }],
      [{ organizationId: 1, ownerId: 1, status: 1 }],
      // One project per episode number in a series, so Next episode is idempotent.
      [
        { seriesId: 1, episodeNumber: 1 },
        {
          unique: true,
          partialFilterExpression: { seriesId: { $type: 'string' } },
        },
      ],
    ],
  );
}
