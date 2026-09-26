import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  FactSource,
  FactStatus,
  FieldSource,
  ProjectStatus,
  type AddProductFactInput,
  type ProductFact,
  type Project,
  type SetProductFactStatusInput,
  type UpdateProductFactTextInput,
  StudioType,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { ProjectsService } from '../projects/projects.service';
import { assertStudio } from '../studios/studios';
import { ClaimCheckService } from './claim-check.service';
import type {
  FactRecord,
  FactsRepository,
} from './repositories/facts.repository';

/** The facts cap per project; the list query is bounded by it. */
export const MAX_FACTS_PER_PROJECT = 50;
const ID_PATTERN = /^[a-f0-9]{24}$/;

const SOURCE_FOR_FEATURE: Record<FieldSource, FactSource> = {
  [FieldSource.IMPORTED]: FactSource.LISTING,
  [FieldSource.EDITED]: FactSource.EDITED,
  [FieldSource.CREATOR]: FactSource.CREATOR,
};

/**
 * Facts are what the creator stands behind. Only approved facts feed writing
 * jobs; after every change the project's summary and approved-fact snapshot
 * are refreshed, which is how an approved script whose facts changed becomes
 * "needs review" without this module touching scripts.
 */
@Injectable()
export class FactsService {
  constructor(
    @Inject(TOKENS.FACTS_REPOSITORY)
    private readonly facts: FactsRepository,
    private readonly projectsService: ProjectsService,
    private readonly claimCheck: ClaimCheckService,
  ) {}

  async list(projectId: string, owner: OwnerContext): Promise<ProductFact[]> {
    await this.projectsService.getRecord(projectId, owner);

    return (await this.records(projectId, owner)).map(toGraphql);
  }

  /** Approved facts, for writing jobs (ids and exact wording). */
  async approvedFacts(projectId: string, owner: OwnerContext) {
    return (await this.records(projectId, owner))
      .filter((fact) => fact.status === FactStatus.APPROVED)
      .map((fact) => ({ id: fact.id, text: fact.text }));
  }

  /**
   * The product step's Continue: requires a title and an affiliate link, and
   * creates one unreviewed fact per key feature not yet represented.
   */
  async continueToFacts(
    projectId: string,
    owner: OwnerContext,
  ): Promise<Project> {
    const project = await this.projectsService.getRecord(projectId, owner);
    assertStudio(project, StudioType.AFFILIATE);
    const { product } = project;

    if (!product.title || !product.affiliateUrl) {
      throw new ConflictError(
        'Add a product title and affiliate link to continue.',
        { code: 'PRODUCT_INCOMPLETE' },
      );
    }

    const existing = await this.records(projectId, owner);
    const represented = new Set(existing.map((fact) => fact.featureId));
    const newFeatures = product.features.filter(
      (feature) => feature.text.trim() && !represented.has(feature.id),
    );

    if (existing.length + newFeatures.length > MAX_FACTS_PER_PROJECT) {
      throw new ConflictError('A project can have up to 50 facts.');
    }

    for (const feature of newFeatures) {
      const source = SOURCE_FOR_FEATURE[feature.source];

      await this.insert(owner, projectId, {
        featureId: feature.id,
        text: feature.text.trim(),
        source,
        sourceUrl: source === FactSource.LISTING ? product.importUrl : null,
        sourceNote: null,
        status: FactStatus.UNREVIEWED,
      });
    }

    if (project.status === ProjectStatus.DRAFT) {
      await this.projectsService.setStatus(
        projectId,
        owner,
        ProjectStatus.FACTS_REVIEW,
      );
    }

    await this.sync(projectId, owner);

    return this.projectsService.get(projectId, owner);
  }

  async add(
    owner: OwnerContext,
    input: AddProductFactInput,
  ): Promise<ProductFact> {
    assertStudio(
      await this.projectsService.getRecord(input.projectId, owner),
      StudioType.AFFILIATE,
    );

    const text = requireText(input.text, 'input.text');
    const sourceNote = input.sourceNote?.trim() || null;

    if (sourceNote && sourceNote.length > 160) {
      throw new ValidationError('Use 160 characters or fewer.', {
        field: 'input.sourceNote',
      });
    }

    const count = await this.facts.count(
      applyTenantFilter<FactRecord>(
        { projectId: input.projectId, ownerId: owner.ownerId },
        owner.organizationId,
      ),
    );

    if (count >= MAX_FACTS_PER_PROJECT) {
      throw new ConflictError('A project can have up to 50 facts.');
    }

    const record = await this.insert(owner, input.projectId, {
      featureId: null,
      text,
      source: FactSource.CREATOR,
      sourceUrl: null,
      sourceNote,
      status: input.approve ? FactStatus.APPROVED : FactStatus.UNREVIEWED,
    });

    await this.sync(input.projectId, owner);

    return toGraphql(record);
  }

  /** Edited facts need approval again; a listing fact's source becomes Edited. */
  async updateText(
    owner: OwnerContext,
    input: UpdateProductFactTextInput,
  ): Promise<ProductFact> {
    const record = await this.getRecord(input.id, owner);
    const text = requireText(input.text, 'input.text');

    if (text === record.text && record.status !== FactStatus.UNKNOWN) {
      return toGraphql(record);
    }

    const source =
      record.source === FactSource.LISTING
        ? FactSource.EDITED
        : record.source === FactSource.NOT_STATED
          ? FactSource.CREATOR
          : record.source;

    const updated = await this.patch(record, owner, {
      text,
      source,
      status: FactStatus.UNREVIEWED,
      flag: this.claimCheck.checkFact(text),
    });

    await this.sync(record.projectId, owner);

    return toGraphql(updated);
  }

  async setStatus(
    owner: OwnerContext,
    input: SetProductFactStatusInput,
  ): Promise<ProductFact> {
    const record = await this.getRecord(input.id, owner);

    if (input.status === FactStatus.UNREVIEWED) {
      throw new ValidationError('Choose approve, reject or unknown.', {
        field: 'input.status',
      });
    }

    if (record.status === input.status) return toGraphql(record);

    const updated = await this.patch(record, owner, { status: input.status });

    await this.sync(record.projectId, owner);

    return toGraphql(updated);
  }

  async remove(id: string, owner: OwnerContext): Promise<boolean> {
    const record = await this.getRecord(id, owner);

    if (record.source !== FactSource.CREATOR) {
      throw new ConflictError(
        'Facts from the listing can be rejected, not removed.',
      );
    }

    await this.facts.delete(
      applyTenantFilter<FactRecord>(
        { id: record.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
    );
    await this.sync(record.projectId, owner);

    return true;
  }

  /** Copies facts into a duplicated project, keeping wording and status. */
  async copyToProject(
    sourceProjectId: string,
    targetProjectId: string,
    owner: OwnerContext,
  ): Promise<Map<string, string>> {
    const idMap = new Map<string, string>();

    for (const record of await this.records(sourceProjectId, owner)) {
      const id = new Types.ObjectId().toHexString();
      idMap.set(record.id, id);
      await this.facts.create({ ...record, id, projectId: targetProjectId });
    }

    await this.sync(targetProjectId, owner);

    return idMap;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async records(projectId: string, owner: OwnerContext) {
    return this.facts
      .list(
        applyTenantFilter<FactRecord>(
          { projectId, ownerId: owner.ownerId },
          owner.organizationId,
        ),
        { sort: { createdAt: 'ASC' } },
      )
      .collect();
  }

  private async getRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<FactRecord> {
    if (!ID_PATTERN.test(id))
      throw new NotFoundError('We can’t find that fact.');

    const [record] = await this.facts
      .list(
        applyTenantFilter<FactRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    if (!record) throw new NotFoundError('We can’t find that fact.');

    return record;
  }

  private async insert(
    owner: OwnerContext,
    projectId: string,
    values: Pick<
      FactRecord,
      'featureId' | 'text' | 'source' | 'sourceUrl' | 'sourceNote' | 'status'
    >,
  ): Promise<FactRecord> {
    const now = new Date();

    return this.facts.create({
      id: new Types.ObjectId().toHexString(),
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId,
      note: null,
      flag: this.claimCheck.checkFact(values.text),
      createdAt: now,
      updatedAt: now,
      ...values,
    });
  }

  private async patch(
    record: FactRecord,
    owner: OwnerContext,
    changes: Partial<FactRecord>,
  ): Promise<FactRecord> {
    const next = { ...changes, updatedAt: new Date() };

    await this.facts.updateOne(
      applyTenantFilter<FactRecord>(
        { id: record.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
      next,
    );

    return { ...record, ...next };
  }

  private async sync(projectId: string, owner: OwnerContext): Promise<void> {
    const records = await this.records(projectId, owner);
    const count = (status: FactStatus) =>
      records.filter((fact) => fact.status === status).length;

    await this.projectsService.syncFacts(
      projectId,
      owner,
      {
        total: records.length,
        unreviewed: count(FactStatus.UNREVIEWED),
        approved: count(FactStatus.APPROVED),
        rejected: count(FactStatus.REJECTED),
        unknown: count(FactStatus.UNKNOWN),
      },
      records
        .filter((fact) => fact.status === FactStatus.APPROVED)
        .map((fact) => ({ id: fact.id, text: fact.text })),
    );
  }
}

function requireText(value: string, field: string): string {
  const text = value.trim();

  if (!text) throw new ValidationError('Write the fact.', { field });

  if (text.length > 200) {
    throw new ValidationError('Use 200 characters or fewer.', { field });
  }

  return text;
}

function toGraphql(record: FactRecord): ProductFact {
  return {
    id: record.id,
    projectId: record.projectId,
    text: record.text,
    source: record.source,
    sourceUrl: record.sourceUrl,
    sourceNote: record.sourceNote,
    status: record.status,
    note: record.note,
    flag: record.flag,
    removable: record.source === FactSource.CREATOR,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
