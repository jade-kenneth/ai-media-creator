import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  GenerationFailureCode,
  GenerationJobStatus,
  GenerationJobType,
  SceneClipMode,
  type GenerationJob,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { CreditsService, type CreditOwner } from '../credits/credits.service';
import type { GenerationJobQueue } from './generation-jobs.types';
import type {
  GenerationJobInput,
  GenerationJobRecord,
  GenerationJobsRepository,
} from './repositories/generation-jobs.repository';

export interface CreateGenerationJob {
  owner: CreditOwner;
  projectId: string;
  projectTitle: string;
  type: GenerationJobType;
  label: string;
  stepCount: number;
  creditCost: number;
  input?: Partial<GenerationJobInput>;
  idempotencyKey: string;
}

const PROJECT_JOBS_LIMIT = 20;
const ACTIVE_STATUSES = [
  GenerationJobStatus.QUEUED,
  GenerationJobStatus.RUNNING,
];

/** Clip jobs made before the count existed asked for two clips (R20). */
const LEGACY_CLIP_COUNT = 2;
/** …and made 6-second clips. */
const LEGACY_CLIP_SECONDS = 6;
@Injectable()
export class GenerationJobsService {
  constructor(
    @Inject(TOKENS.GENERATION_JOBS_REPOSITORY)
    private readonly jobs: GenerationJobsRepository,
    private readonly creditsService: CreditsService,
  ) {}

  /**
   * Creates a paid job once per idempotency key: a repeated key (double click,
   * network retry) returns the existing job, and a second concurrent job for
   * the same target is refused. Credits are held before the job exists.
   */
  async create(params: CreateGenerationJob): Promise<GenerationJobRecord> {
    const idempotencyKey = params.idempotencyKey.trim();

    if (idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      throw new ValidationError('idempotencyKey must be 8–100 characters.', {
        field: 'input.idempotencyKey',
      });
    }

    const existing = await this.findByKey(params.owner, idempotencyKey);
    if (existing) return existing;

    const input: GenerationJobInput = {
      versionId: params.input?.versionId ?? null,
      hookId: params.input?.hookId ?? null,
      sceneId: params.input?.sceneId ?? null,
      sourceAssetId: params.input?.sourceAssetId ?? null,
      prompt: params.input?.prompt ?? null,
      clipMode: params.input?.clipMode ?? null,
      clipCount: params.input?.clipCount ?? null,
      clipSeconds: params.input?.clipSeconds ?? null,
      endAssetId: params.input?.endAssetId ?? null,
      referenceAssetIds: params.input?.referenceAssetIds ?? undefined,
      continuitySceneId: params.input?.continuitySceneId ?? null,
      continuityAssetId: params.input?.continuityAssetId ?? null,
      continuitySeconds: params.input?.continuitySeconds ?? null,
    };

    const activeJobs = await this.jobs
      .list(
        applyTenantFilter<GenerationJobRecord>(
          {
            ownerId: params.owner.ownerId,
            projectId: params.projectId,
            type: params.type,
            status: { in: ACTIVE_STATUSES },
          },
          params.owner.organizationId,
        ),
      )
      .collect();
    const active = activeJobs.some(
      (job) =>
        job.input.hookId === input.hookId &&
        job.input.sceneId === input.sceneId,
    );

    if (active) {
      throw new ConflictError('This is already in progress.', {
        code: 'JOB_ALREADY_RUNNING',
      });
    }

    const id = new Types.ObjectId().toHexString();
    const movement = {
      ...params.owner,
      amount: params.creditCost,
      jobId: id,
      projectId: params.projectId,
      projectTitle: params.projectTitle,
      label: params.label,
    };

    await this.creditsService.hold(movement);

    const now = new Date();

    try {
      return await this.jobs.create({
        id,
        ownerId: params.owner.ownerId,
        organizationId: params.owner.organizationId,
        projectId: params.projectId,
        projectTitle: params.projectTitle,
        type: params.type,
        label: params.label,
        status: GenerationJobStatus.QUEUED,
        step: 0,
        stepCount: params.stepCount,
        input,
        idempotencyKey,
        creditCost: params.creditCost,
        attempts: 0,
        leaseUntil: null,
        failureCode: null,
        failureMessage: null,
        resultVersionId: null,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        finishedAt: null,
      });
    } catch (error) {
      await this.creditsService.release(movement);

      const raced = await this.findByKey(params.owner, idempotencyKey);
      if (raced) return raced;

      throw error;
    }
  }

  async get(id: string, owner: CreditOwner): Promise<GenerationJobRecord> {
    const [job] = await this.jobs
      .list(
        applyTenantFilter<GenerationJobRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    if (!job) throw new NotFoundError('We can’t find that job.');

    return job;
  }

  async listForProject(
    projectId: string,
    owner: CreditOwner,
    activeOnly = false,
  ): Promise<GenerationJobRecord[]> {
    const page = await this.jobs
      .list(
        applyTenantFilter<GenerationJobRecord>(
          {
            projectId,
            ownerId: owner.ownerId,
            ...(activeOnly ? { status: { in: ACTIVE_STATUSES } } : {}),
          },
          owner.organizationId,
        ),
        { sort: { createdAt: 'DESC' } },
      )
      .connection({ first: PROJECT_JOBS_LIMIT });

    return page.edges.map(({ node }) => node);
  }

  /** The newest job per project among `types`, for dashboard failure lines. */
  async latestByProject(
    projectIds: string[],
    owner: CreditOwner,
    types: GenerationJobType[],
  ): Promise<Map<string, GenerationJobRecord>> {
    const latest = new Map<string, GenerationJobRecord>();

    if (projectIds.length === 0) return latest;

    const jobs = await this.jobs
      .list(
        applyTenantFilter<GenerationJobRecord>(
          {
            ownerId: owner.ownerId,
            projectId: { in: projectIds },
            type: { in: types },
          },
          owner.organizationId,
        ),
        { sort: { createdAt: 'DESC' } },
      )
      .connection({ first: 100 });

    for (const { node } of jobs.edges) {
      if (!latest.has(node.projectId)) latest.set(node.projectId, node);
    }

    return latest;
  }

  /** Retries a failed job in place with a fresh credit hold. */
  async retry(id: string, owner: CreditOwner): Promise<GenerationJobRecord> {
    const job = await this.get(id, owner);

    if (job.status !== GenerationJobStatus.FAILED) return job;

    const movement = this.movementFor(job);

    await this.creditsService.hold(movement);

    const requeued = await this.jobs.updateOne(
      { id: job.id, status: GenerationJobStatus.FAILED },
      {
        status: GenerationJobStatus.QUEUED,
        step: 0,
        attempts: 0,
        failureCode: null,
        failureMessage: null,
        leaseUntil: null,
        startedAt: null,
        finishedAt: null,
        updatedAt: new Date(),
      },
    );

    if (!requeued) {
      // Another tab retried first; give this hold back.
      await this.creditsService.release(movement);
    }

    return this.get(id, owner);
  }

  async claimNext(
    queue: GenerationJobQueue,
    now = new Date(),
  ): Promise<GenerationJobRecord | null> {
    return this.jobs.claimNext(
      now,
      new Date(now.getTime() + queue.leaseMs),
      queue.types,
    );
  }

  /**
   * Extends a running job's lease so a long job isn't reclaimed as crashed.
   * False means the job is no longer this worker's (finished or reclaimed).
   */
  async renewLease(
    job: GenerationJobRecord,
    leaseMs: number,
    now = new Date(),
  ): Promise<boolean> {
    return this.jobs.updateOne(
      { id: job.id, status: GenerationJobStatus.RUNNING },
      { leaseUntil: new Date(now.getTime() + leaseMs), updatedAt: now },
    );
  }

  async markStep(job: GenerationJobRecord, step: number): Promise<void> {
    await this.jobs.updateOne(
      { id: job.id, status: GenerationJobStatus.RUNNING },
      { step: Math.min(step, job.stepCount), updatedAt: new Date() },
    );
  }

  /**
   * Completes a running job and charges it. A job that delivered only part of
   * its work reports `creditsUsed`: that much is captured and the rest of the
   * hold is released.
   */
  async complete(
    job: GenerationJobRecord,
    resultVersionId: string | null,
    creditsUsed: number = job.creditCost,
  ): Promise<void> {
    const now = new Date();
    const completed = await this.jobs.updateOne(
      { id: job.id, status: GenerationJobStatus.RUNNING },
      {
        status: GenerationJobStatus.COMPLETED,
        step: job.stepCount,
        leaseUntil: null,
        resultVersionId,
        finishedAt: now,
        updatedAt: now,
      },
    );

    if (!completed) return;

    const used = Math.min(job.creditCost, Math.max(0, creditsUsed));
    const movement = this.movementFor(job);

    if (used > 0)
      await this.creditsService.capture({ ...movement, amount: used });
    if (used < job.creditCost) {
      await this.creditsService.release(
        { ...movement, amount: job.creditCost - used },
        'Refunded: part of the job didn’t finish',
      );
    }
  }

  async fail(
    job: GenerationJobRecord,
    code: GenerationFailureCode,
    message: string,
  ): Promise<void> {
    const now = new Date();
    const failed = await this.jobs.updateOne(
      { id: job.id, status: GenerationJobStatus.RUNNING },
      {
        status: GenerationJobStatus.FAILED,
        leaseUntil: null,
        failureCode: code,
        failureMessage: message.slice(0, 500),
        finishedAt: now,
        updatedAt: now,
      },
    );

    if (failed) await this.creditsService.release(this.movementFor(job));
  }

  /**
   * The queue's active jobs no worker is serving: queued, or running with the
   * heartbeat stopped, for longer than the queue's limit while no worker
   * claimed, renewed or finished any of its jobs in that time. A busy worker
   * renews its running job, so jobs waiting behind it are never listed.
   */
  async unserved(
    queue: GenerationJobQueue,
    now = new Date(),
  ): Promise<GenerationJobRecord[]> {
    if (!queue.unservedAfterMs) return [];

    const since = new Date(now.getTime() - queue.unservedAfterMs);
    const type = { in: [...queue.types] };
    // Only a worker sets startedAt, so jobs failed as unserved never count.
    const served = await this.jobs.exists({
      type,
      startedAt: { notEqual: null },
      updatedAt: { greaterThanOrEqual: since },
    });

    if (served) return [];

    return this.jobs
      .list({
        type,
        status: { in: ACTIVE_STATUSES },
        updatedAt: { lesserThan: since },
      })
      .collect();
  }

  /**
   * Fails a job listed by `unserved` and releases its credits. It matches the
   * status and last update it was listed with, so a worker that claims or
   * renews it first wins; false when that happened.
   */
  async failUnserved(job: GenerationJobRecord): Promise<boolean> {
    const now = new Date();
    const failed = await this.jobs.updateOne(
      { id: job.id, status: job.status, updatedAt: job.updatedAt },
      {
        status: GenerationJobStatus.FAILED,
        leaseUntil: null,
        failureCode: GenerationFailureCode.WORKER_UNAVAILABLE,
        failureMessage: 'No worker picked the job up in time.',
        finishedAt: now,
        updatedAt: now,
      },
    );

    if (failed) await this.creditsService.release(this.movementFor(job));

    return failed;
  }

  toGraphql(job: GenerationJobRecord): GenerationJob {
    return {
      id: job.id,
      projectId: job.projectId,
      type: job.type,
      status: job.status,
      step: job.step,
      stepCount: job.stepCount,
      creditCost: job.creditCost,
      versionId: job.input.versionId,
      hookId: job.input.hookId,
      sceneId: job.input.sceneId,
      sourceAssetId: job.input.sourceAssetId ?? null,
      prompt: job.input.prompt ?? null,
      clipMode:
        job.type === GenerationJobType.GENERATE_SCENE_CLIPS
          ? (job.input.clipMode ?? SceneClipMode.FIRST_FRAME)
          : null,
      clipCount:
        job.type === GenerationJobType.GENERATE_SCENE_CLIPS
          ? (job.input.clipCount ?? LEGACY_CLIP_COUNT)
          : null,
      clipSeconds:
        job.type === GenerationJobType.GENERATE_SCENE_CLIPS
          ? (job.input.clipSeconds ?? LEGACY_CLIP_SECONDS)
          : null,
      endAssetId: job.input.endAssetId ?? null,
      referenceAssetIds: job.input.referenceAssetIds ?? null,
      continuitySceneId: job.input.continuitySceneId ?? null,
      continuityAssetId: job.input.continuityAssetId ?? null,
      resultVersionId: job.resultVersionId,
      failureCode: job.failureCode,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    };
  }

  private movementFor(job: GenerationJobRecord) {
    return {
      ownerId: job.ownerId,
      organizationId: job.organizationId,
      amount: job.creditCost,
      jobId: job.id,
      projectId: job.projectId,
      projectTitle: job.projectTitle,
      label: job.label,
    };
  }

  private async findByKey(
    owner: CreditOwner,
    idempotencyKey: string,
  ): Promise<GenerationJobRecord | null> {
    const [job] = await this.jobs
      .list(
        applyTenantFilter<GenerationJobRecord>(
          { ownerId: owner.ownerId, idempotencyKey },
          owner.organizationId,
        ),
      )
      .collect();

    return job ?? null;
  }
}

export { GenerationFailureCode };
