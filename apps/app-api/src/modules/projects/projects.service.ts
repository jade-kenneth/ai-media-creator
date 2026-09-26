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
  AngleKind,
  ContentStyle,
  FailureNoticeKind,
  FieldSource,
  GenerationJobStatus,
  GenerationJobType,
  ImportOutcome,
  Platform,
  PremiseKind,
  ProductField,
  ProjectListFilter,
  ProjectSortField,
  ProjectStage,
  ProjectStatus,
  ProjectStepKey,
  ProjectStepStatus,
  ScriptLanguage,
  Storytelling,
  StudioType,
  Tone,
  type CreateProjectInput,
  type ImportProductInput,
  type Project,
  type ProjectConnection,
  type ProjectCounts,
  type ProjectFilterInput,
  type ProjectSortInput,
  type ProjectStep,
  type RenameProjectInput,
  type StorySeries,
  type UpdateProductInput,
  type StoryCharacterInput,
  type UpdateStoryInput,
  type UpdateStrategyInput,
} from 'src/graphql/generated/graphql';
import type {
  CursorPaginationInput,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { S3Service } from '../s3/s3.service';
import { STORY_LIMITS } from '../studios/story';
import { assertStudio, STUDIOS, studioFor, studioOf } from '../studios/studios';
import {
  IMPORTABLE_FIELDS,
  ProductImportService,
} from './product-import.service';
import type {
  AudienceSuggestionSetRecord,
  EpisodeRecord,
  FactSnapshot,
  FactsSummaryRecord,
  ProductFeatureRecord,
  ProductRecord,
  ProjectRecord,
  ProjectsRepository,
  PremiseSuggestionSetRecord,
  ScriptSummaryRecord,
  StoryCharacterRecord,
  StoryRecord,
  StrategyRecord,
  VideoSummaryRecord,
} from './repositories/projects.repository';
import { storedFieldSources } from './repositories/projects.repository';

export const SUGGEST_ANGLES_COST = 1;
export const SUGGEST_ANGLES_STEPS = 3;
export const SUGGEST_AUDIENCES_COST = 1;
export const SUGGEST_AUDIENCES_STEPS = 3;
export const SUGGEST_PREMISES_COST = 1;
export const SUGGEST_PREMISES_STEPS = 3;

const MAX_FEATURES = 12;
/** A series holds at most this many episodes (§3.25, E10). */
export const MAX_EPISODES = 50;
/** An episode's recap, written by the next episode's script job. */
export const MAX_RECAP = 300;

export const DEFAULT_EPISODE: EpisodeRecord = {
  isFinal: false,
  writtenFromVersion: null,
  recap: null,
  recapFromVersion: null,
  carriedItems: [],
};
const ID_PATTERN = /^[a-f0-9]{24}$/;
/** A client-made id, so an overlapping autosave can't add a character twice. */
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const IN_PROGRESS_STATUSES = [
  ProjectStatus.DRAFT,
  ProjectStatus.FACTS_REVIEW,
  ProjectStatus.SCRIPT_REVIEW,
  ProjectStatus.MEDIA_REVIEW,
  ProjectStatus.GENERATING,
];

const DEFAULT_STRATEGY: StrategyRecord = {
  buyer: null,
  problem: null,
  benefit: null,
  platform: Platform.TIKTOK_SHOP,
  language: ScriptLanguage.TAGLISH,
  lengthSeconds: 30,
  tone: Tone.FRIENDLY,
  contentStyle: ContentStyle.VOICEOVER_PRODUCT_SHOTS,
  selectedAngle: null,
};

export const DEFAULT_STORY: StoryRecord & { detail: string } = {
  genre: null,
  detail: '',
  premise: null,
  cast: [],
  storytelling: Storytelling.ACTED,
  language: ScriptLanguage.TAGLISH,
  lengthSeconds: 45,
};

const EMPTY_PRODUCT: ProductRecord = {
  title: null,
  category: null,
  pricePhp: null,
  description: null,
  affiliateUrl: null,
  features: [],
  fieldSources: {},
  importUrl: null,
  lastImport: null,
};

const LOCKED_REASONS: Record<ProjectStepKey, string> = {
  [ProjectStepKey.STORY]: '',
  [ProjectStepKey.PRODUCT]: '',
  [ProjectStepKey.FACTS]: 'Add the product title and link first.',
  [ProjectStepKey.STRATEGY]: 'Review every fact first.',
  [ProjectStepKey.SCRIPT]: 'Choose an angle first.',
  [ProjectStepKey.MEDIA]: 'Approve a script first.',
  [ProjectStepKey.VOICE]: 'Choose media for every scene first.',
  [ProjectStepKey.EDIT]: 'Add a voiceover first.',
  [ProjectStepKey.BRIEF]: 'Approve a script first.',
  [ProjectStepKey.EXPORT]: 'Add a voiceover first.',
};

export interface ProgressOptions {
  /** Shows the video beta steps (Media, Voice, Edit & preview, Export). */
  videoBeta?: boolean;
}

type ScalarProductField =
  | ProductField.TITLE
  | ProductField.CATEGORY
  | ProductField.PRICE
  | ProductField.DESCRIPTION
  | ProductField.AFFILIATE_URL;

/** Progress derived from the project's own fields and its synced summaries. */
export interface ProjectProgress {
  hasApprovedScript: boolean;
  hasScript: boolean;
  steps: ProjectStep[];
  currentStep: ProjectStepKey;
  stage: ProjectStage;
}

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(TOKENS.PROJECTS_REPOSITORY)
    private readonly projects: ProjectsRepository,
    private readonly jobsService: GenerationJobsService,
    private readonly importService: ProductImportService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────────────

  /** The owner's project; another tenant's or owner's id is not found. */
  async getRecord(id: string, owner: OwnerContext): Promise<ProjectRecord> {
    if (!ID_PATTERN.test(id)) {
      throw new NotFoundError('We can’t find that project.');
    }

    const [project] = await this.projects
      .list(
        applyTenantFilter<ProjectRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    if (!project) throw new NotFoundError('We can’t find that project.');

    return project;
  }

  async get(id: string, owner: OwnerContext): Promise<Project> {
    const record = await this.getRecord(id, owner);
    const latestJobs = await this.latestFailureJobs([record.id], owner);

    return this.toGraphql(record, latestJobs.get(record.id));
  }

  async list(
    owner: OwnerContext,
    filter: ProjectFilterInput | null | undefined,
    sort: ProjectSortInput | null | undefined,
    pagination: CursorPaginationInput | null | undefined,
  ): Promise<ProjectConnection> {
    const statusFilter = statusesFor(filter?.stage ?? ProjectListFilter.ALL);
    const repositorySort: RepositorySort<ProjectRecord> =
      sort?.field === ProjectSortField.NAME
        ? { titleSort: 'ASC' }
        : { updatedAt: 'DESC' };

    const page = await this.projects
      .list(
        applyTenantFilter<ProjectRecord>(
          {
            ownerId: owner.ownerId,
            ...(statusFilter ? { status: { in: statusFilter } } : {}),
          },
          owner.organizationId,
        ),
        { sort: repositorySort },
      )
      .connection({
        first: pagination?.first ?? 24,
        after: pagination?.after ?? undefined,
      });

    const latestJobs = await this.latestFailureJobs(
      page.edges.map(({ node }) => node.id),
      owner,
    );
    const series = await this.seriesByIds(
      page.edges.map(({ node }) => node.seriesId),
      owner,
    );

    return {
      totalCount: page.totalCount,
      pageInfo: page.pageInfo,
      edges: await Promise.all(
        page.edges.map(async ({ cursor, node }) => ({
          cursor,
          node: await this.toGraphql(
            node,
            latestJobs.get(node.id),
            node.seriesId ? (series.get(node.seriesId) ?? [node]) : [node],
          ),
        })),
      ),
    };
  }

  async counts(owner: OwnerContext): Promise<ProjectCounts> {
    const scope = (statuses?: ProjectStatus[]) =>
      applyTenantFilter<ProjectRecord>(
        {
          ownerId: owner.ownerId,
          ...(statuses ? { status: { in: statuses } } : {}),
        },
        owner.organizationId,
      );

    const [all, inProgress, ready, exported] = await Promise.all([
      this.projects.count(scope()),
      this.projects.count(scope(IN_PROGRESS_STATUSES)),
      this.projects.count(scope([ProjectStatus.READY])),
      this.projects.count(scope([ProjectStatus.EXPORTED])),
    ]);

    return { all, inProgress, ready, exported };
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  async create(
    owner: OwnerContext,
    input?: CreateProjectInput | null,
  ): Promise<Project> {
    const studio = STUDIOS[input?.studio ?? StudioType.AFFILIATE];
    const record = await this.insert(owner, {
      title: studio.untitled,
      studioType: studio.type,
      ...(studio.intakeSteps.includes(ProjectStepKey.STORY)
        ? { story: DEFAULT_STORY }
        : {}),
    });

    return this.toGraphql(record, undefined);
  }

  /** Inserts a project; used by create and by duplication. */
  async insert(
    owner: OwnerContext,
    values: Partial<ProjectRecord> & { title: string },
  ): Promise<ProjectRecord> {
    const now = new Date();

    return this.projects.create({
      id: new Types.ObjectId().toHexString(),
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      studioType: StudioType.AFFILIATE,
      status: ProjectStatus.DRAFT,
      product: EMPTY_PRODUCT,
      strategy: DEFAULT_STRATEGY,
      angleSuggestionSet: null,
      factsSummary: {
        total: 0,
        unreviewed: 0,
        approved: 0,
        rejected: 0,
        unknown: 0,
      },
      approvedFacts: [],
      scriptSummary: {
        versionCount: 0,
        latestNumber: 0,
        latestIsDraft: false,
        approved: [],
      },
      thumbnailKey: null,
      assetCount: 0,
      createdAt: now,
      updatedAt: now,
      ...values,
      titleSort: values.title.toLowerCase(),
    });
  }

  async rename(
    owner: OwnerContext,
    input: RenameProjectInput,
  ): Promise<Project> {
    const title = input.title.trim();

    if (!title) {
      throw new ValidationError('Add a project name.', {
        field: 'input.title',
      });
    }

    if (title.length > 80) {
      throw new ValidationError('Use 80 characters or fewer.', {
        field: 'input.title',
      });
    }

    const record = await this.getRecord(input.id, owner);

    return this.save(record, { title, titleSort: title.toLowerCase() }, owner);
  }

  /**
   * Autosaves product fields. A value typed into an empty field is the
   * creator's; changing an imported value marks it edited; clearing a field
   * drops its source.
   */
  async updateProduct(
    owner: OwnerContext,
    input: UpdateProductInput,
  ): Promise<Project> {
    const record = await this.getRecord(input.projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);
    const product: ProductRecord = {
      ...record.product,
      fieldSources: { ...storedFieldSources(record.product) },
    };

    const scalars: Array<[ScalarProductField, keyof ProductRecord, unknown]> = [
      [ProductField.TITLE, 'title', input.title],
      [ProductField.CATEGORY, 'category', input.category],
      [ProductField.PRICE, 'pricePhp', input.pricePhp],
      [ProductField.DESCRIPTION, 'description', input.description],
      [ProductField.AFFILIATE_URL, 'affiliateUrl', input.affiliateUrl],
    ];

    for (const [field, key, raw] of scalars) {
      if (raw === undefined) continue;

      const next = normalizeProductValue(field, raw);
      const previous = record.product[key];

      if (next === previous) continue;

      Object.assign(product, { [key]: next });
      product.fieldSources[field] = nextSource(
        storedFieldSources(record.product)[field],
        next,
      );

      if (next === null) delete product.fieldSources[field];
    }

    if (input.features) {
      product.features = this.mergeFeatures(
        record.product.features,
        input.features,
      );
    }

    return this.save(record, { product }, owner);
  }

  async importProduct(owner: OwnerContext, input: ImportProductInput) {
    const record = await this.getRecord(input.projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);
    const attempt = await this.importService.fetchProduct(input.url);
    const product: ProductRecord = {
      ...record.product,
      fieldSources: { ...storedFieldSources(record.product) },
      importUrl: input.url.trim().slice(0, 500),
    };

    const found: Record<ProductField, boolean> = {
      [ProductField.TITLE]: attempt.data.title !== null,
      [ProductField.CATEGORY]: attempt.data.category !== null,
      [ProductField.PRICE]: attempt.data.pricePhp !== null,
      [ProductField.DESCRIPTION]: attempt.data.description !== null,
      [ProductField.FEATURES]: false,
      [ProductField.AFFILIATE_URL]: false,
    };
    const filled: ProductField[] = [];

    const fill = <K extends 'title' | 'category' | 'pricePhp' | 'description'>(
      field: ProductField,
      key: K,
      value: ProductRecord[K],
    ) => {
      if (value === null || record.product[key] !== null) return;

      product[key] = value;
      product.fieldSources[field] = FieldSource.IMPORTED;
      filled.push(field);
    };

    fill(ProductField.TITLE, 'title', attempt.data.title);
    fill(ProductField.CATEGORY, 'category', attempt.data.category);
    fill(ProductField.PRICE, 'pricePhp', attempt.data.pricePhp);
    fill(ProductField.DESCRIPTION, 'description', attempt.data.description);

    const missing = IMPORTABLE_FIELDS.filter((field) => !found[field]);
    const outcome =
      attempt.outcome === ImportOutcome.PARTIAL && missing.length === 0
        ? ImportOutcome.FILLED
        : attempt.outcome;

    product.lastImport = {
      outcome,
      host: attempt.host,
      filled,
      missing,
      at: new Date(),
    };

    const project = await this.save(record, { product }, owner);

    return { outcome, host: attempt.host, filled, missing, project };
  }

  /** Removes values that are still imported; creator and edited values stay. */
  async clearImported(
    owner: OwnerContext,
    projectId: string,
  ): Promise<Project> {
    const record = await this.getRecord(projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);
    const product: ProductRecord = {
      ...record.product,
      fieldSources: { ...storedFieldSources(record.product) },
      features: record.product.features.filter(
        (feature) => feature.source !== FieldSource.IMPORTED,
      ),
      lastImport: null,
    };
    const keys: Array<
      [ProductField, 'title' | 'category' | 'pricePhp' | 'description']
    > = [
      [ProductField.TITLE, 'title'],
      [ProductField.CATEGORY, 'category'],
      [ProductField.PRICE, 'pricePhp'],
      [ProductField.DESCRIPTION, 'description'],
    ];

    for (const [field, key] of keys) {
      if (product.fieldSources[field] === FieldSource.IMPORTED) {
        product[key] = null;
        delete product.fieldSources[field];
      }
    }

    return this.save(record, { product }, owner);
  }

  async updateStrategy(
    owner: OwnerContext,
    input: UpdateStrategyInput,
  ): Promise<Project> {
    const record = await this.getRecord(input.projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);
    const strategy: StrategyRecord = { ...record.strategy };

    const text = (
      value: string | null | undefined,
      max: number,
      field: string,
    ): string | null | undefined => {
      if (value === undefined) return undefined;
      const trimmed = value?.trim() ?? '';
      if (trimmed.length > max) {
        throw new ValidationError(`Use ${max} characters or fewer.`, {
          field: `input.${field}`,
        });
      }
      return trimmed || null;
    };

    const buyer = text(input.buyer, 120, 'buyer');
    const problem = text(input.problem, 160, 'problem');
    const benefit = text(input.benefit, 160, 'benefit');

    if (buyer !== undefined) strategy.buyer = buyer;
    if (problem !== undefined) strategy.problem = problem;
    if (benefit !== undefined) strategy.benefit = benefit;
    if (input.platform) strategy.platform = input.platform;
    if (input.language) strategy.language = input.language;
    if (input.tone) strategy.tone = input.tone;
    if (input.contentStyle) {
      if (!studioFor(record).contentStyles.includes(input.contentStyle)) {
        throw new ValidationError('Choose one of the content styles.', {
          field: 'input.contentStyle',
        });
      }
      strategy.contentStyle = input.contentStyle;
    }

    if (input.lengthSeconds !== undefined && input.lengthSeconds !== null) {
      if (![20, 30, 40].includes(input.lengthSeconds)) {
        throw new ValidationError('Choose 20, 30 or 40 seconds.', {
          field: 'input.lengthSeconds',
        });
      }
      strategy.lengthSeconds = input.lengthSeconds;
    }

    if (input.selectedAngle === null) {
      strategy.selectedAngle = null;
    } else if (input.selectedAngle) {
      const { kind, suggestionId } = input.selectedAngle;

      if (kind === AngleKind.SUGGESTED) {
        const suggestion = record.angleSuggestionSet?.suggestions.find(
          (candidate) => candidate.id === suggestionId,
        );

        if (!suggestion) {
          throw new ValidationError('Choose one of the suggested angles.', {
            field: 'input.selectedAngle.suggestionId',
          });
        }

        strategy.selectedAngle = {
          kind,
          suggestionId: suggestion.id,
          text: suggestion.title,
        };
      } else {
        const own = text(input.selectedAngle.text, 280, 'selectedAngle.text');
        strategy.selectedAngle = {
          kind: AngleKind.OWN,
          suggestionId: null,
          text: own ?? '',
        };
      }
    }

    return this.save(record, { strategy }, owner);
  }

  async suggestAngles(
    owner: OwnerContext,
    projectId: string,
    idempotencyKey: string,
  ): Promise<GenerationJobRecord> {
    const record = await this.getRecord(projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);

    if (record.approvedFacts.length === 0) {
      throw new ConflictError('Approve at least one fact first.', {
        code: 'NO_APPROVED_FACTS',
      });
    }

    return this.jobsService.create({
      owner,
      projectId: record.id,
      projectTitle: record.title,
      type: GenerationJobType.SUGGEST_ANGLES,
      label: 'Suggest angles',
      stepCount: SUGGEST_ANGLES_STEPS,
      creditCost: SUGGEST_ANGLES_COST,
      idempotencyKey,
    });
  }

  async suggestAudiences(
    owner: OwnerContext,
    projectId: string,
    idempotencyKey: string,
  ): Promise<GenerationJobRecord> {
    const record = await this.getRecord(projectId, owner);
    assertStudio(record, StudioType.AFFILIATE);

    if (record.approvedFacts.length === 0) {
      throw new ConflictError('Approve at least one fact first.', {
        code: 'NO_APPROVED_FACTS',
      });
    }

    return this.jobsService.create({
      owner,
      projectId: record.id,
      projectTitle: record.title,
      type: GenerationJobType.SUGGEST_AUDIENCES,
      label: 'Suggest audiences',
      stepCount: SUGGEST_AUDIENCES_STEPS,
      creditCost: SUGGEST_AUDIENCES_COST,
      idempotencyKey,
    });
  }

  /**
   * Autosaves the story (Entertainment Studio). Choosing a suggested premise
   * copies its title and logline, and its cast only while the stored cast is
   * empty, so typed characters are never replaced.
   */
  async updateStory(
    owner: OwnerContext,
    input: UpdateStoryInput,
  ): Promise<Project> {
    const record = await this.getRecord(input.projectId, owner);
    assertStudio(record, StudioType.ENTERTAINMENT);
    const story: StoryRecord = { ...readStory(record) };
    const episodeNumber = record.episodeNumber ?? 1;

    // §3.25: every episode keeps the series' genre and format.
    if (episodeNumber > 1) {
      for (const field of [
        'genre',
        'storytelling',
        'language',
        'lengthSeconds',
      ] as const) {
        const value = input[field];
        if (value !== undefined && value !== null && value !== story[field]) {
          throw new ValidationError('Set by Episode 1.', {
            field: `input.${field}`,
          });
        }
      }
    }

    let episode: EpisodeRecord | undefined;

    if (input.isFinal !== undefined && input.isFinal !== null) {
      if (episodeNumber === 1) {
        throw new ValidationError(
          'Episode 1 always ends on a cliffhanger.',
          { field: 'input.isFinal' },
        );
      }

      const later = (await this.seriesRecords(record, owner)).find(
        (item) => (item.episodeNumber ?? 1) > episodeNumber,
      );

      if (later) {
        throw new ValidationError(
          `Episode ${later.episodeNumber} already follows this one.`,
          { field: 'input.isFinal' },
        );
      }

      episode = { ...readEpisode(record), isFinal: input.isFinal };
    }

    if (input.genre) story.genre = input.genre;
    if (input.detail !== undefined && input.detail !== null) {
      const detail = collapse(input.detail);

      if (detail.length > STORY_LIMITS.detail) {
        throw new ValidationError(
          `Use ${STORY_LIMITS.detail} characters or fewer.`,
          { field: 'input.detail' },
        );
      }

      story.detail = detail;
    }
    if (input.storytelling) story.storytelling = input.storytelling;
    if (input.language) story.language = input.language;

    if (input.lengthSeconds !== undefined && input.lengthSeconds !== null) {
      if (!STORY_LIMITS.lengths.includes(input.lengthSeconds)) {
        throw new ValidationError('Choose 30, 45 or 60 seconds.', {
          field: 'input.lengthSeconds',
        });
      }
      story.lengthSeconds = input.lengthSeconds;
    }

    if (input.cast) story.cast = validateCast(input.cast, story.cast);

    if (input.premise === null) {
      story.premise = null;
    } else if (input.premise) {
      const { kind, suggestionId } = input.premise;

      if (kind === PremiseKind.SUGGESTED) {
        const suggestion = record.premiseSuggestionSet?.suggestions.find(
          (candidate) => candidate.id === suggestionId,
        );

        if (!suggestion) {
          throw new ValidationError('Choose one of the suggested premises.', {
            field: 'input.premise.suggestionId',
          });
        }

        story.premise = {
          kind,
          suggestionId: suggestion.id,
          title: suggestion.title,
          logline: suggestion.logline,
        };

        if (!input.cast && story.cast.length === 0) {
          story.cast = suggestion.cast.map((character) => ({ ...character }));
        }
      } else {
        const own = collapse(input.premise.text ?? '');

        if (own.length > STORY_LIMITS.ownPremise) {
          throw new ValidationError(
            `Use ${STORY_LIMITS.ownPremise} characters or fewer.`,
            { field: 'input.premise.text' },
          );
        }

        story.premise = {
          kind: PremiseKind.OWN,
          suggestionId: null,
          title: '',
          logline: own,
        };
      }
    }

    return this.save(record, { story, ...(episode ? { episode } : {}) }, owner);
  }

  async suggestPremises(
    owner: OwnerContext,
    projectId: string,
    idempotencyKey: string,
  ): Promise<GenerationJobRecord> {
    const record = await this.getRecord(projectId, owner);
    assertStudio(record, StudioType.ENTERTAINMENT);

    if (!readStory(record).genre) {
      throw new ConflictError('Pick a genre first.', { code: 'NO_GENRE' });
    }

    return this.jobsService.create({
      owner,
      projectId: record.id,
      projectTitle: record.title,
      type: GenerationJobType.SUGGEST_PREMISES,
      label:
        (record.episodeNumber ?? 1) > 1
          ? 'Suggest what happens next'
          : 'Suggest premises',
      stepCount: SUGGEST_PREMISES_STEPS,
      creditCost: SUGGEST_PREMISES_COST,
      idempotencyKey,
    });
  }

  // ── Series (§3.25) ────────────────────────────────────────────────────────

  /**
   * Every episode of the record's series, in order; the record alone when it
   * isn't in one. Bounded by the 50-episode cap.
   */
  async seriesRecords(
    record: ProjectRecord,
    owner: OwnerContext,
  ): Promise<ProjectRecord[]> {
    if (!record.seriesId) return [record];

    return (await this.seriesByIds([record.seriesId], owner)).get(
      record.seriesId,
    ) ?? [record];
  }

  /** Makes a lone story Episode 1 of its own series (its id is the series id). */
  async startSeries(
    record: ProjectRecord,
    owner: OwnerContext,
  ): Promise<ProjectRecord> {
    if (record.seriesId) return record;

    await this.update(record.id, owner, {
      seriesId: record.id,
      episodeNumber: 1,
    });

    return { ...record, seriesId: record.id, episodeNumber: 1 };
  }

  /** Merges series state into an episode (recap, the version its script followed). */
  async updateEpisode(
    projectId: string,
    owner: OwnerContext,
    changes: Partial<EpisodeRecord>,
  ): Promise<void> {
    const record = await this.getRecord(projectId, owner);

    await this.update(projectId, owner, {
      episode: { ...readEpisode(record), ...changes },
    });
  }

  private async seriesByIds(
    ids: Array<string | null | undefined>,
    owner: OwnerContext,
  ): Promise<Map<string, ProjectRecord[]>> {
    const seriesIds = [...new Set(ids.filter((id): id is string => !!id))];
    const bySeries = new Map<string, ProjectRecord[]>();

    if (seriesIds.length === 0) return bySeries;

    const records = await this.projects
      .list(
        applyTenantFilter<ProjectRecord>(
          { ownerId: owner.ownerId, seriesId: { in: seriesIds } },
          owner.organizationId,
        ),
      )
      .collect();

    for (const record of records.sort(
      (a, b) => (a.episodeNumber ?? 1) - (b.episodeNumber ?? 1),
    )) {
      const list = bySeries.get(record.seriesId as string) ?? [];
      list.push(record);
      bySeries.set(record.seriesId as string, list);
    }

    return bySeries;
  }

  // ── Updates from other studio modules ─────────────────────────────────────

  /** Called by the facts module after any fact change. */
  async syncFacts(
    projectId: string,
    owner: OwnerContext,
    summary: FactsSummaryRecord,
    approvedFacts: FactSnapshot[],
  ): Promise<void> {
    await this.update(projectId, owner, {
      factsSummary: summary,
      approvedFacts,
      updatedAt: new Date(),
    });
  }

  /** Called by the scripts module after any version change. */
  async syncScripts(
    projectId: string,
    owner: OwnerContext,
    summary: ScriptSummaryRecord,
  ): Promise<void> {
    await this.update(projectId, owner, {
      scriptSummary: summary,
      updatedAt: new Date(),
    });
  }

  /** Called by the video-edits module after any change to the video. */
  async syncVideo(
    projectId: string,
    owner: OwnerContext,
    summary: VideoSummaryRecord,
  ): Promise<void> {
    await this.update(projectId, owner, {
      videoSummary: summary,
      updatedAt: new Date(),
    });
  }

  /** Called by the assets module after an upload or removal. */
  async syncMedia(
    projectId: string,
    owner: OwnerContext,
    thumbnailKey: string | null,
    assetCount: number,
  ): Promise<void> {
    await this.update(projectId, owner, {
      thumbnailKey,
      assetCount,
      updatedAt: new Date(),
    });
  }

  async setStatus(
    projectId: string,
    owner: OwnerContext,
    status: ProjectStatus,
  ): Promise<void> {
    await this.update(projectId, owner, { status, updatedAt: new Date() });
  }

  async setAngleSuggestions(
    projectId: string,
    owner: OwnerContext,
    angleSuggestionSet: ProjectRecord['angleSuggestionSet'],
    strategy: StrategyRecord,
  ): Promise<void> {
    await this.update(projectId, owner, {
      angleSuggestionSet,
      strategy,
      updatedAt: new Date(),
    });
  }

  async setPremiseSuggestions(
    projectId: string,
    owner: OwnerContext,
    premiseSuggestionSet: PremiseSuggestionSetRecord,
  ): Promise<void> {
    await this.update(projectId, owner, {
      premiseSuggestionSet,
      updatedAt: new Date(),
    });
  }

  async setAudienceSuggestions(
    projectId: string,
    owner: OwnerContext,
    audienceSuggestionSet: AudienceSuggestionSetRecord,
  ): Promise<void> {
    await this.update(projectId, owner, {
      audienceSuggestionSet,
      updatedAt: new Date(),
    });
  }

  // ── Mapping ──────────────────────────────────────────────────────────────

  /**
   * `series` is the record's series in order (loaded when omitted); only a
   * story reads it.
   */
  async toGraphql(
    record: ProjectRecord,
    latestJob: GenerationJobRecord | undefined,
    series?: ProjectRecord[],
  ): Promise<Project> {
    const options: ProgressOptions = {
      videoBeta: this.configService.get<boolean>('VIDEO_BETA_ENABLED') === true,
    };
    const progress = computeProgress(record, options);
    const hasStory = studioFor(record).intakeSteps.includes(
      ProjectStepKey.STORY,
    );

    const story = record.story ? readStory(record) : null;
    const episodes = hasStory
      ? (series ??
        (record.seriesId
          ? await this.seriesRecords(record, {
              ownerId: record.ownerId,
              organizationId: record.organizationId,
            })
          : [record]))
      : null;

    return {
      id: record.id,
      title: record.title,
      studio: studioOf(record.studioType),
      status: record.status,
      stage: progress.stage,
      hasApprovedScript: progress.hasApprovedScript,
      hasScript: progress.hasScript,
      productTitle: record.product.title,
      thumbnailUrl:
        (record.videoSummary?.posterKey ?? record.thumbnailKey)
          ? await this.s3Service
              .createPresignedGetUrl(
                (record.videoSummary?.posterKey ??
                  record.thumbnailKey) as string,
              )
              .catch(() => null)
          : null,
      assetCount: record.assetCount,
      lastEditedAt: record.updatedAt,
      exportCount: record.videoSummary?.exportCount ?? 0,
      latestExportAt: record.videoSummary?.latestExportAt ?? null,
      latestExportDownloaded:
        record.videoSummary?.latestExportDownloaded ?? false,
      failureNotice:
        latestJob?.status === GenerationJobStatus.FAILED
          ? {
              kind:
                latestJob.type === GenerationJobType.SUGGEST_ANGLES
                  ? FailureNoticeKind.ANGLE_SUGGESTIONS
                  : latestJob.type === GenerationJobType.SUGGEST_AUDIENCES
                    ? FailureNoticeKind.AUDIENCE_SUGGESTIONS
                    : latestJob.type === GenerationJobType.SUGGEST_PREMISES
                      ? FailureNoticeKind.PREMISE_SUGGESTIONS
                      : FailureNoticeKind.SCRIPT_WRITING,
            }
          : null,
      product: {
        ...record.product,
        fieldSources: Object.entries(storedFieldSources(record.product)).map(
          ([field, source]) => ({
            field: field as ProductField,
            source,
          }),
        ),
      },
      strategy: record.strategy,
      angleSuggestionSet: record.angleSuggestionSet
        ? {
            suggestions: record.angleSuggestionSet.suggestions,
            createdAt: record.angleSuggestionSet.createdAt,
            isStale:
              record.angleSuggestionSet.factsFingerprint !==
              factsFingerprint(record.approvedFacts),
          }
        : null,
      audienceSuggestionSet: record.audienceSuggestionSet
        ? {
            suggestions: record.audienceSuggestionSet.suggestions,
            createdAt: record.audienceSuggestionSet.createdAt,
            isStale:
              record.audienceSuggestionSet.factsFingerprint !==
              factsFingerprint(record.approvedFacts),
          }
        : null,
      story,
      premiseSuggestionSet: record.premiseSuggestionSet
        ? {
            suggestions: record.premiseSuggestionSet.suggestions,
            genre: record.premiseSuggestionSet.genre,
            detail: collapse(record.premiseSuggestionSet.detail ?? ''),
            createdAt: record.premiseSuggestionSet.createdAt,
            isStale:
              record.premiseSuggestionSet.genre !== story?.genre ||
              collapse(record.premiseSuggestionSet.detail ?? '') !==
                story?.detail,
          }
        : null,
      series: episodes ? seriesOf(record, episodes, options) : null,
      factsSummary: record.factsSummary,
      approvedFacts: record.approvedFacts,
      steps: progress.steps,
      currentStep: progress.currentStep,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async save(
    record: ProjectRecord,
    changes: Partial<ProjectRecord>,
    owner: OwnerContext,
  ): Promise<Project> {
    await this.update(record.id, owner, { ...changes, updatedAt: new Date() });

    return this.get(record.id, owner);
  }

  private async update(
    projectId: string,
    owner: OwnerContext,
    changes: Partial<ProjectRecord>,
  ): Promise<void> {
    const updated = await this.projects.updateOne(
      applyTenantFilter<ProjectRecord>(
        { id: projectId, ownerId: owner.ownerId },
        owner.organizationId,
      ),
      changes,
    );

    if (!updated) throw new NotFoundError('We can’t find that project.');
  }

  private async latestFailureJobs(projectIds: string[], owner: OwnerContext) {
    return this.jobsService.latestByProject(projectIds, owner, [
      GenerationJobType.SUGGEST_ANGLES,
      GenerationJobType.SUGGEST_AUDIENCES,
      GenerationJobType.SUGGEST_PREMISES,
      GenerationJobType.WRITE_SCRIPT,
    ]);
  }

  private mergeFeatures(
    existing: ProductFeatureRecord[],
    input: UpdateProductInput['features'] & object,
  ): ProductFeatureRecord[] {
    if (input.length > MAX_FEATURES) {
      throw new ValidationError('You can add up to 12 features.', {
        field: 'input.features',
      });
    }

    const byId = new Map(existing.map((feature) => [feature.id, feature]));
    const seen = new Set<string>();

    return input.flatMap((feature, index) => {
      const text = feature.text.trim();

      if (text.length > 160) {
        throw new ValidationError('Use 160 characters or fewer.', {
          field: `input.features.${index}.text`,
        });
      }

      if (!text) return [];

      const id =
        feature.id && ID_PATTERN.test(feature.id) && !seen.has(feature.id)
          ? feature.id
          : new Types.ObjectId().toHexString();
      seen.add(id);

      const previous = byId.get(id);
      const source = !previous
        ? FieldSource.CREATOR
        : previous.text === text
          ? previous.source
          : previous.source === FieldSource.CREATOR
            ? FieldSource.CREATOR
            : FieldSource.EDITED;

      return [{ id, text, source }];
    });
  }
}

// ── Pure helpers (exported for tests and the scripts module) ─────────────────

export function factsFingerprint(facts: FactSnapshot[]): string {
  return [...facts]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((fact) => `${fact.id}:${fact.text}`)
    .join('|');
}

/**
 * An approved script version counts only while every fact it used is still
 * approved with the same wording; otherwise it needs review (Design
 * Reference §8: upstream edits never silently change approved work).
 */
export function isApprovalCurrent(
  usedFacts: FactSnapshot[],
  approvedFacts: FactSnapshot[],
): boolean {
  const approved = new Map(approvedFacts.map((fact) => [fact.id, fact.text]));

  return usedFacts.every((fact) => approved.get(fact.id) === fact.text);
}

/** A studio's steps before Script: their rows, whether they're done, and where to resume. */
interface IntakeProgress {
  steps: ProjectStep[];
  done: boolean;
  /** Where to resume while the intake isn't finished; null to go on to Script. */
  current: ProjectStepKey | null;
}

type StepStatus = (
  key: ProjectStepKey,
  locked: boolean,
  done: boolean,
  reason?: string,
) => ProjectStep;

/** Each studio's intake progress; keyed by studio so a new one is a type error until added. */
const INTAKE_PROGRESS: Record<
  StudioType,
  (
    record: ProjectRecord,
    hasScript: boolean,
    status: StepStatus,
  ) => IntakeProgress
> = {
  [StudioType.AFFILIATE]: (record, hasScript, status) => {
    const productDone = record.status !== ProjectStatus.DRAFT;
    const factsDone =
      productDone &&
      record.factsSummary.unreviewed === 0 &&
      record.factsSummary.approved >= 1;
    const strategyDone = Boolean(
      record.strategy.buyer && record.strategy.selectedAngle?.text,
    );

    return {
      steps: [
        status(ProjectStepKey.PRODUCT, false, productDone),
        status(ProjectStepKey.FACTS, !productDone, factsDone),
        status(ProjectStepKey.STRATEGY, !factsDone, strategyDone),
      ],
      done: strategyDone,
      current: !productDone
        ? ProjectStepKey.PRODUCT
        : hasScript
          ? null
          : !factsDone
            ? ProjectStepKey.FACTS
            : ProjectStepKey.STRATEGY,
    };
  },
  [StudioType.ENTERTAINMENT]: (record, hasScript, status) => {
    const done = isStoryDone(readStory(record));

    return {
      steps: [status(ProjectStepKey.STORY, false, done)],
      done,
      current: hasScript ? null : ProjectStepKey.STORY,
    };
  },
};

/** A project's story, filled with defaults; for studios without one, the defaults. */
export function readStory(
  record: Pick<ProjectRecord, 'story'>,
): StoryRecord & { detail: string } {
  const story = record.story;

  if (!story) return DEFAULT_STORY;

  return {
    genre: story.genre ?? null,
    detail: collapse(story.detail ?? ''),
    premise: story.premise ?? null,
    cast: story.cast ?? [],
    storytelling: story.storytelling ?? DEFAULT_STORY.storytelling,
    language: story.language ?? DEFAULT_STORY.language,
    lengthSeconds: story.lengthSeconds ?? DEFAULT_STORY.lengthSeconds,
  };
}

/** A project's episode state, filled with defaults. */
export function readEpisode(
  record: Pick<ProjectRecord, 'episode'>,
): EpisodeRecord {
  const episode = record.episode;

  if (!episode) return DEFAULT_EPISODE;

  return {
    isFinal: episode.isFinal ?? false,
    writtenFromVersion: episode.writtenFromVersion ?? null,
    recap: episode.recap ?? null,
    recapFromVersion: episode.recapFromVersion ?? null,
    carriedItems: episode.carriedItems ?? [],
  };
}

/** The newest current approval, which the next episode continues from. */
export function latestApproval(record: ProjectRecord) {
  return record.scriptSummary.approved
    .filter((approval) =>
      isApprovalCurrent(approval.usedFacts, record.approvedFacts),
    )
    .reduce<ProjectRecord['scriptSummary']['approved'][number] | null>(
      (latest, approval) =>
        !latest || approval.number > latest.number ? approval : latest,
      null,
    );
}

/** The story's series as the Story step reads it (§3.25). */
export function seriesOf(
  record: ProjectRecord,
  episodes: ProjectRecord[],
  options: ProgressOptions = {},
): StorySeries {
  const episodeNumber = record.episodeNumber ?? 1;
  const previous = episodes.find(
    (item) => (item.episodeNumber ?? 1) === episodeNumber - 1,
  );
  const first = episodes.find((item) => (item.episodeNumber ?? 1) === 1);
  const writtenFrom = readEpisode(record).writtenFromVersion;
  const previousApproval = previous ? latestApproval(previous) : null;

  return {
    id: record.seriesId ?? null,
    episodeNumber,
    episodeCount: Math.max(
      episodeNumber,
      ...episodes.map((item) => item.episodeNumber ?? 1),
    ),
    isFinal: readEpisode(record).isFinal,
    episodes: episodes.map((item) => ({
      projectId: item.id,
      episodeNumber: item.episodeNumber ?? 1,
      title: item.title,
      stage: computeProgress(item, options).stage,
    })),
    previous: previous
      ? {
          projectId: previous.id,
          episodeNumber: previous.episodeNumber ?? 1,
          title: previous.title,
          seriesPremise: first ? (readStory(first).premise?.logline ?? '') : '',
          lastScene: previousApproval?.lastScene ?? '',
        }
      : null,
    continuityStale: Boolean(
      previous &&
      writtenFrom !== null &&
      previousApproval?.number !== writtenFrom,
    ),
  };
}

/** The Story step is done: a genre, a premise and, for Acted, a character. */
export function isStoryDone(story: StoryRecord): boolean {
  return Boolean(
    story.genre &&
    story.premise?.logline.trim() &&
    (story.storytelling === Storytelling.NARRATED || story.cast.length > 0),
  );
}

export function computeProgress(
  record: ProjectRecord,
  options: ProgressOptions = {},
): ProjectProgress {
  const studio = studioFor(record);
  const summary = record.scriptSummary;
  const hasScript = summary.versionCount > 0;
  const hasApprovedScript = summary.approved.some((approval) =>
    isApprovalCurrent(approval.usedFacts, record.approvedFacts),
  );

  const status: StepStatus = (key, locked, done, reason) => ({
    key,
    status: locked
      ? ProjectStepStatus.LOCKED
      : done
        ? ProjectStepStatus.DONE
        : ProjectStepStatus.OPEN,
    lockedReason: locked ? (reason ?? LOCKED_REASONS[key]) : null,
  });

  const intake = INTAKE_PROGRESS[studio.type](record, hasScript, status);

  // The video steps build on the approved script; an edit started from a
  // version that is no longer approved waits for a new approval.
  const video = hasApprovedScript ? record.videoSummary : null;
  const mediaDone = Boolean(video?.mediaComplete);
  const voiceDone = mediaDone && Boolean(video?.voiceSettled);
  const exported = (video?.exportCount ?? 0) > 0;

  const steps = [
    ...intake.steps,
    status(
      ProjectStepKey.SCRIPT,
      !(intake.done || hasScript),
      hasApprovedScript,
      studio.scriptLockedReason,
    ),
    ...(options.videoBeta
      ? [
          status(ProjectStepKey.MEDIA, !hasApprovedScript, mediaDone),
          status(ProjectStepKey.VOICE, !mediaDone, voiceDone),
          status(ProjectStepKey.EDIT, !voiceDone, exported),
        ]
      : []),
    status(ProjectStepKey.BRIEF, !hasApprovedScript, false),
    ...(options.videoBeta
      ? [status(ProjectStepKey.EXPORT, !voiceDone, exported)]
      : []),
  ];

  const videoStep = !mediaDone
    ? ProjectStepKey.MEDIA
    : !voiceDone
      ? ProjectStepKey.VOICE
      : !exported
        ? ProjectStepKey.EDIT
        : ProjectStepKey.EXPORT;

  const currentStep =
    intake.current ??
    (hasApprovedScript && !summary.latestIsDraft
      ? options.videoBeta
        ? videoStep
        : ProjectStepKey.BRIEF
      : ProjectStepKey.SCRIPT);

  const stage: Record<ProjectStatus, ProjectStage> = {
    [ProjectStatus.DRAFT]: ProjectStage.DRAFT,
    [ProjectStatus.FACTS_REVIEW]: ProjectStage.REVIEWING_FACTS,
    [ProjectStatus.SCRIPT_REVIEW]: hasApprovedScript
      ? ProjectStage.SCRIPT_APPROVED
      : ProjectStage.WRITING_SCRIPT,
    [ProjectStatus.MEDIA_REVIEW]: ProjectStage.CHOOSING_MEDIA,
    [ProjectStatus.GENERATING]: ProjectStage.GENERATING,
    [ProjectStatus.READY]: ProjectStage.READY_TO_EXPORT,
    [ProjectStatus.EXPORTED]: ProjectStage.EXPORTED,
  };

  return {
    hasApprovedScript,
    hasScript,
    steps,
    currentStep,
    stage: stage[record.status],
  };
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Validates a replacement cast; ids are kept when known or client-made. */
function validateCast(
  input: StoryCharacterInput[],
  existing: StoryCharacterRecord[],
): StoryCharacterRecord[] {
  if (input.length > STORY_LIMITS.cast) {
    throw new ValidationError('Add at most 4 characters.', {
      field: 'input.cast',
    });
  }

  const known = new Set(existing.map((character) => character.id));
  const ids = new Set<string>();
  const names = new Set<string>();

  return input.map((character, index) => {
    const name = collapse(character.name);
    const role = collapse(character.role ?? '');
    const look = collapse(character.look ?? '');
    const field = `input.cast.${index}`;

    if (!name) {
      throw new ValidationError('Add a name.', { field: `${field}.name` });
    }
    if (name.length > STORY_LIMITS.name) {
      throw new ValidationError(
        `Use ${STORY_LIMITS.name} characters or fewer.`,
        { field: `${field}.name` },
      );
    }
    if (names.has(name.toLowerCase())) {
      throw new ValidationError(`You already have ${name}.`, {
        field: `${field}.name`,
      });
    }
    for (const [key, value] of [
      ['role', role],
      ['look', look],
    ] as const) {
      if (value.length > STORY_LIMITS[key]) {
        throw new ValidationError(
          `Use ${STORY_LIMITS[key]} characters or fewer.`,
          { field: `${field}.${key}` },
        );
      }
    }
    names.add(name.toLowerCase());

    const id =
      character.id &&
      !ids.has(character.id) &&
      (known.has(character.id) || CLIENT_ID_PATTERN.test(character.id))
        ? character.id
        : new Types.ObjectId().toHexString();
    ids.add(id);

    return { id, name, role, look };
  });
}

function statusesFor(filter: ProjectListFilter): ProjectStatus[] | null {
  switch (filter) {
    case ProjectListFilter.IN_PROGRESS:
      return IN_PROGRESS_STATUSES;
    case ProjectListFilter.READY:
      return [ProjectStatus.READY];
    case ProjectListFilter.EXPORTED:
      return [ProjectStatus.EXPORTED];
    default:
      return null;
  }
}

function nextSource(
  previous: FieldSource | undefined,
  value: unknown,
): FieldSource {
  if (value === null) return previous ?? FieldSource.CREATOR;
  if (previous === FieldSource.IMPORTED || previous === FieldSource.EDITED) {
    return FieldSource.EDITED;
  }
  return FieldSource.CREATOR;
}

function normalizeProductValue(
  field: ScalarProductField,
  raw: unknown,
): string | number | null {
  if (raw === null) return null;

  if (field === ProductField.PRICE) {
    const price = Number(raw);

    if (!Number.isFinite(price) || price < 0 || price > 10_000_000) {
      throw new ValidationError('Enter a price in pesos, like 899.', {
        field: 'input.pricePhp',
      });
    }

    return Math.round(price * 100) / 100;
  }

  const text = String(raw).trim();
  const limits: Record<string, number> = {
    [ProductField.TITLE]: 120,
    [ProductField.CATEGORY]: 80,
    [ProductField.DESCRIPTION]: 2000,
    [ProductField.AFFILIATE_URL]: 500,
  };
  const inputField: Record<string, string> = {
    [ProductField.TITLE]: 'title',
    [ProductField.CATEGORY]: 'category',
    [ProductField.DESCRIPTION]: 'description',
    [ProductField.AFFILIATE_URL]: 'affiliateUrl',
  };

  if (text.length > limits[field]) {
    throw new ValidationError(`Use ${limits[field]} characters or fewer.`, {
      field: `input.${inputField[field]}`,
    });
  }

  if (field === ProductField.AFFILIATE_URL && text && !isHttpsUrl(text)) {
    throw new ValidationError('Enter a full link that starts with https://', {
      field: 'input.affiliateUrl',
    });
  }

  return text || null;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
