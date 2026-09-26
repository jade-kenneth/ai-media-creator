import type { ConfigService } from '@nestjs/config';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import {
  GenerationFailureCode,
  GenerationJobStatus,
  GenerationJobType,
} from 'src/graphql/generated/graphql';
import type { CreditsService } from '../credits/credits.service';
import type { SchedulerLocksService } from '../scheduler-locks/scheduler-locks.service';
import { GenerationJobHandlers } from './generation-job-handlers';
import { GenerationJobsService } from './generation-jobs.service';
import { GenerationJobsRunner } from './generation-jobs.runner';
import { TEXT_PROVIDER_TIMEOUT_MS } from '../text-generation/text-generation.types';
import {
  GenerationJobError,
  MEDIA_JOB_QUEUE,
  TEXT_JOB_QUEUE,
} from './generation-jobs.types';
import {
  GenerationJobsWorker,
  MediaJobsWorker,
} from './generation-jobs.worker';
import type {
  GenerationJobRecord,
  GenerationJobsRepository,
} from './repositories/generation-jobs.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };

const time = (value: unknown) =>
  value instanceof Date ? value.getTime() : value;

function matches(record: GenerationJobRecord, filter: Record<string, unknown>) {
  return Object.entries(filter).every(([key, value]) => {
    const actual = time(record[key as keyof GenerationJobRecord]);
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const ops = value as Record<string, unknown>;
      if ('in' in ops && !(ops.in as unknown[]).includes(actual)) return false;
      if ('notEqual' in ops && actual === time(ops.notEqual)) return false;
      if (
        'greaterThanOrEqual' in ops &&
        !((actual as number) >= (time(ops.greaterThanOrEqual) as number))
      )
        return false;
      if (
        'lesserThan' in ops &&
        !((actual as number) < (time(ops.lesserThan) as number))
      )
        return false;
      return true;
    }
    return actual === time(value);
  });
}

function setup() {
  const jobs: GenerationJobRecord[] = [];
  const repository = {
    create: jest.fn(async (data: GenerationJobRecord) => {
      if (
        jobs.some(
          (job) =>
            job.ownerId === data.ownerId &&
            job.idempotencyKey === data.idempotencyKey,
        )
      ) {
        throw Object.assign(new Error('duplicate'), { code: 11000 });
      }
      jobs.push({ ...data });
      return data;
    }),
    list: jest.fn((filter: Record<string, unknown>) => {
      const found = () => jobs.filter((job) => matches(job, filter));
      return {
        collect: async () => found().map((job) => ({ ...job })),
        connection: async () => ({
          totalCount: found().length,
          edges: found().map((node) => ({
            cursor: node.id,
            node: { ...node },
          })),
          pageInfo: { endCursor: null, hasNextPage: false },
        }),
      };
    }),
    exists: jest.fn(async (filter: Record<string, unknown>) =>
      jobs.some((job) => matches(job, filter)),
    ),
    updateOne: jest.fn(
      async (
        filter: Record<string, unknown>,
        data: Partial<GenerationJobRecord>,
      ) => {
        const job = jobs.find((candidate) => matches(candidate, filter));
        if (!job) return false;
        Object.assign(job, data);
        return true;
      },
    ),
    claimNext: jest.fn(
      async (
        now: Date,
        leaseUntil: Date,
        types: readonly GenerationJobType[],
      ) => {
        const job = jobs.find(
          (candidate) =>
            candidate.status === GenerationJobStatus.QUEUED &&
            types.includes(candidate.type),
        );
        if (!job) return null;
        Object.assign(job, {
          status: GenerationJobStatus.RUNNING,
          leaseUntil,
          startedAt: now,
          attempts: job.attempts + 1,
        });
        return { ...job };
      },
    ),
  } as unknown as GenerationJobsRepository;

  const credits = {
    hold: jest.fn(async () => undefined),
    capture: jest.fn(async () => undefined),
    release: jest.fn(async () => undefined),
  };
  const service = new GenerationJobsService(
    repository,
    credits as unknown as CreditsService,
  );
  const handlers = new GenerationJobHandlers();
  const runner = new GenerationJobsRunner(
    {
      withLock: async (
        _name: string,
        _ttl: number,
        task: () => Promise<void>,
      ) => {
        await task();
        return true;
      },
    } as unknown as SchedulerLocksService,
    service,
    handlers,
  );
  const config = { get: () => true } as unknown as ConfigService;
  const worker = new GenerationJobsWorker(config, runner);
  const mediaWorker = new MediaJobsWorker(config, runner);

  return {
    jobs,
    repository,
    service,
    credits,
    handlers,
    runner,
    worker,
    mediaWorker,
  };
}

const request = {
  owner,
  projectId: 'project-1',
  projectTitle: 'Portable Blender, Morning Smoothie Hook',
  type: GenerationJobType.WRITE_SCRIPT,
  label: 'Write hooks & script',
  stepCount: 4,
  creditCost: 3,
  idempotencyKey: 'key-00000001',
};

describe('GenerationJobsService', () => {
  it('holds credits and returns the same job for a repeated key', async () => {
    const { service, credits, jobs } = setup();

    const first = await service.create(request);
    const second = await service.create(request);

    expect(second.id).toBe(first.id);
    expect(jobs).toHaveLength(1);
    expect(credits.hold).toHaveBeenCalledTimes(1);
    expect(first.status).toBe(GenerationJobStatus.QUEUED);
  });

  it('refuses a second active job for the same target', async () => {
    const { service } = setup();
    await service.create(request);

    await expect(
      service.create({ ...request, idempotencyKey: 'key-00000002' }),
    ).rejects.toThrow(ConflictError);
  });

  it('completes a job and captures its credits', async () => {
    const { service, credits, handlers, worker, jobs } = setup();
    handlers.register(GenerationJobType.WRITE_SCRIPT, {
      run: async (_job, context) => {
        await context.setStep(2);
        return { resultVersionId: 'version-1' };
      },
    });
    await service.create(request);

    await worker.tick();

    expect(jobs[0]).toMatchObject({
      status: GenerationJobStatus.COMPLETED,
      resultVersionId: 'version-1',
      step: 4,
    });
    expect(credits.capture).toHaveBeenCalledTimes(1);
    expect(credits.release).not.toHaveBeenCalled();
  });

  it('charges only the credits a partly finished job used', async () => {
    const { service, credits, handlers, mediaWorker } = setup();
    handlers.register(GenerationJobType.GENERATE_SCENE_CLIPS, {
      run: async () => ({ creditsUsed: 4 }),
    });
    await service.create({
      ...request,
      type: GenerationJobType.GENERATE_SCENE_CLIPS,
      label: 'Generate 2 clips',
      creditCost: 8,
      input: { sceneId: 's1', sourceAssetId: 'a1', prompt: 'Slow push in.' },
    });

    await mediaWorker.tick();

    expect(credits.capture).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4 }),
    );
    expect(credits.release).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4 }),
      'Refunded: part of the job didn’t finish',
    );
  });

  it('fails a job with the handler code and releases its credits', async () => {
    const { service, credits, handlers, worker, jobs } = setup();
    handlers.register(GenerationJobType.WRITE_SCRIPT, {
      run: async () => {
        throw new GenerationJobError(
          GenerationFailureCode.PROVIDER_TIMEOUT,
          'The writing service timed out after 3 minutes.',
        );
      },
    });
    await service.create(request);

    await worker.tick();

    expect(jobs[0]).toMatchObject({
      status: GenerationJobStatus.FAILED,
      failureCode: GenerationFailureCode.PROVIDER_TIMEOUT,
    });
    expect(credits.release).toHaveBeenCalledTimes(1);
    expect(credits.capture).not.toHaveBeenCalled();
  });

  it('retries a failed job in place with a new hold', async () => {
    const { service, credits, handlers, worker, jobs } = setup();
    handlers.register(GenerationJobType.WRITE_SCRIPT, {
      run: async () => {
        throw new Error('boom');
      },
    });
    const job = await service.create(request);
    await worker.tick();
    expect(jobs[0].failureCode).toBe(GenerationFailureCode.INTERNAL);

    const retried = await service.retry(job.id, owner);

    expect(retried.id).toBe(job.id);
    expect(retried.status).toBe(GenerationJobStatus.QUEUED);
    expect(retried.attempts).toBe(0);
    expect(jobs).toHaveLength(1);
    expect(credits.hold).toHaveBeenCalledTimes(2);
  });

  it('starts a fresh crash-attempt cycle when a failed job is retried', async () => {
    const { service, handlers, worker, jobs } = setup();
    const run = jest.fn(async () => ({}));
    handlers.register(GenerationJobType.WRITE_SCRIPT, { run });
    const job = await service.create(request);
    Object.assign(jobs[0], {
      status: GenerationJobStatus.FAILED,
      attempts: 6,
      failureCode: GenerationFailureCode.INTERNAL,
      failureMessage:
        'The job stopped several times and was not retried again.',
      finishedAt: new Date(),
    });

    const retried = await service.retry(job.id, owner);
    await worker.tick();

    expect(retried.attempts).toBe(0);
    expect(run).toHaveBeenCalledTimes(1);
    expect(jobs[0]).toMatchObject({
      status: GenerationJobStatus.COMPLETED,
      attempts: 1,
      failureCode: null,
      failureMessage: null,
    });
  });

  it('runs text jobs in the API worker and media jobs only in the media worker', async () => {
    const { service, handlers, worker, mediaWorker, jobs } = setup();
    const run = jest.fn(async () => ({}));
    handlers.register(GenerationJobType.GENERATE_VOICEOVER, { run });
    await service.create({
      ...request,
      type: GenerationJobType.GENERATE_VOICEOVER,
      label: 'Generate voiceover',
      stepCount: 3,
      creditCost: 2,
    });

    await worker.tick();

    expect(jobs[0].status).toBe(GenerationJobStatus.QUEUED);
    expect(run).not.toHaveBeenCalled();

    await mediaWorker.tick();

    expect(jobs[0].status).toBe(GenerationJobStatus.COMPLETED);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('renews a media job lease while it runs and stops when it ends', async () => {
    const { service, handlers, runner, repository, jobs } = setup();
    handlers.register(GenerationJobType.RENDER_VIDEO, {
      run: () => new Promise((resolve) => setTimeout(() => resolve({}), 60)),
    });
    await service.create({
      ...request,
      type: GenerationJobType.RENDER_VIDEO,
      label: 'Render video',
      stepCount: 4,
      creditCost: 2,
    });
    const renewals = () =>
      (repository.updateOne as jest.Mock).mock.calls.filter(
        ([, data]) => 'leaseUntil' in data && !('status' in data),
      ).length;

    await runner.runNext({ ...MEDIA_JOB_QUEUE, heartbeatMs: 10 });
    const afterRun = renewals();
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(jobs[0].status).toBe(GenerationJobStatus.COMPLETED);
    expect(afterRun).toBeGreaterThanOrEqual(2);
    expect(renewals()).toBe(afterRun);
  });

  it('renews text job leases when a provider call can outlast them', () => {
    expect(TEXT_PROVIDER_TIMEOUT_MS).toBeGreaterThan(TEXT_JOB_QUEUE.leaseMs);
    expect(TEXT_JOB_QUEUE.heartbeatMs).toBeLessThan(TEXT_JOB_QUEUE.leaseMs);
  });

  describe('jobs no worker serves', () => {
    const clipRequest = {
      ...request,
      type: GenerationJobType.GENERATE_SCENE_CLIPS,
      label: 'Generate 1 clip',
      stepCount: 3,
      creditCost: 4,
    };
    const minutesAgo = (minutes: number) =>
      new Date(Date.now() - minutes * 60_000);

    it('fails a media job left queued with no worker, releases its credits and undoes the request', async () => {
      const { service, runner, handlers, credits, jobs } = setup();
      const abandon = jest.fn(async () => undefined);
      handlers.register(GenerationJobType.GENERATE_SCENE_CLIPS, {
        run: async () => ({}),
        abandon,
      });
      await service.create(clipRequest);
      jobs[0].updatedAt = minutesAgo(4);

      await runner.failUnserved(MEDIA_JOB_QUEUE);

      expect(jobs[0]).toMatchObject({
        status: GenerationJobStatus.FAILED,
        failureCode: GenerationFailureCode.WORKER_UNAVAILABLE,
      });
      expect(credits.release).toHaveBeenCalledTimes(1);
      expect(abandon).toHaveBeenCalledWith(
        expect.objectContaining({ id: jobs[0].id }),
      );
    });

    it('fails a running job whose worker stopped renewing it', async () => {
      const { service, runner, jobs } = setup();
      await service.create(clipRequest);
      Object.assign(jobs[0], {
        status: GenerationJobStatus.RUNNING,
        startedAt: minutesAgo(8),
        leaseUntil: minutesAgo(6),
        updatedAt: minutesAgo(8),
      });

      await runner.failUnserved(MEDIA_JOB_QUEUE);

      expect(jobs[0].status).toBe(GenerationJobStatus.FAILED);
    });

    it('leaves jobs waiting behind one a worker is running', async () => {
      const { service, runner, credits, jobs } = setup();
      await service.create(clipRequest);
      await service.create({
        ...clipRequest,
        idempotencyKey: 'key-00000002',
        input: { sceneId: 'scene-2' },
      });
      Object.assign(jobs[0], {
        status: GenerationJobStatus.RUNNING,
        startedAt: minutesAgo(8),
        updatedAt: new Date(),
      });
      jobs[1].updatedAt = minutesAgo(8);

      await runner.failUnserved(MEDIA_JOB_QUEUE);

      expect(jobs.map((job) => job.status)).toEqual([
        GenerationJobStatus.RUNNING,
        GenerationJobStatus.QUEUED,
      ]);
      expect(credits.release).not.toHaveBeenCalled();
    });

    it('keeps a job a worker claimed after it was listed', async () => {
      const { service, credits, jobs } = setup();
      await service.create(clipRequest);
      jobs[0].updatedAt = minutesAgo(4);
      const [listed] = await service.unserved(MEDIA_JOB_QUEUE);
      Object.assign(jobs[0], {
        status: GenerationJobStatus.RUNNING,
        startedAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.failUnserved(listed)).resolves.toBe(false);
      expect(jobs[0].status).toBe(GenerationJobStatus.RUNNING);
      expect(credits.release).not.toHaveBeenCalled();
    });

    it('never fails text jobs, which the API runs itself', async () => {
      const { service, jobs } = setup();
      await service.create(request);
      jobs[0].updatedAt = minutesAgo(10);

      await expect(service.unserved(TEXT_JOB_QUEUE)).resolves.toEqual([]);
    });

    it('waits longer than a worker restart and the lease heartbeat', () => {
      expect(MEDIA_JOB_QUEUE.unservedAfterMs).toBeGreaterThan(
        MEDIA_JOB_QUEUE.leaseMs,
      );
    });
  });

  it('treats a job from another tenant as not found', async () => {
    const { service } = setup();
    const job = await service.create(request);

    await expect(
      service.get(job.id, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.get(job.id, owner)).resolves.toMatchObject({
      id: job.id,
    });
  });
});
