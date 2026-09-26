import { Injectable, Logger } from '@nestjs/common';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { SchedulerLocksService } from '../scheduler-locks/scheduler-locks.service';
import { GenerationJobHandlers } from './generation-job-handlers';
import { GenerationJobsService } from './generation-jobs.service';
import {
  GenerationJobError,
  type GenerationJobQueue,
} from './generation-jobs.types';
import type { GenerationJobRecord } from './repositories/generation-jobs.repository';

const CLAIM_LOCK_TTL_MS = 10_000;
/** A job reclaimed after this many crashed attempts fails instead of looping. */
const MAX_ATTEMPTS = 3;

/**
 * Claims and runs one job from a queue. Each tick claims under a per-queue
 * scheduler lock (the claim itself is atomic), then processes the job outside
 * the lock so several instances can each run a job at once. Workers call it
 * on their own interval; the runner holds no schedule of its own, so a process
 * only runs the queues whose worker it registers.
 */
@Injectable()
export class GenerationJobsRunner {
  private readonly logger = new Logger(GenerationJobsRunner.name);

  constructor(
    private readonly locks: SchedulerLocksService,
    private readonly jobsService: GenerationJobsService,
    private readonly handlers: GenerationJobHandlers,
  ) {}

  async runNext(queue: GenerationJobQueue): Promise<void> {
    let claimed: GenerationJobRecord | null = null;

    await this.locks.withLock(
      `generation-jobs:claim:${queue.name}`,
      CLAIM_LOCK_TTL_MS,
      async () => {
        claimed = await this.jobsService.claimNext(queue);
      },
    );

    if (claimed) await this.process(claimed, queue);
  }

  /**
   * Fails the queue's jobs that no worker is serving (its process is down), so
   * they don't wait forever: credits are released and each job's handler
   * undoes what its request changed ahead of it. Runs in the API process.
   */
  async failUnserved(queue: GenerationJobQueue): Promise<void> {
    await this.locks.withLock(
      `generation-jobs:unserved:${queue.name}`,
      CLAIM_LOCK_TTL_MS,
      async () => {
        for (const job of await this.jobsService.unserved(queue)) {
          if (await this.jobsService.failUnserved(job)) {
            await this.abandon(job);
          }
        }
      },
    );
  }

  async process(
    job: GenerationJobRecord,
    queue: GenerationJobQueue,
  ): Promise<void> {
    if (job.attempts > MAX_ATTEMPTS) {
      await this.jobsService.fail(
        job,
        GenerationFailureCode.INTERNAL,
        'The job stopped several times and was not retried again.',
      );
      await this.abandon(job);
      return;
    }

    const handler = this.handlers.get(job.type);

    if (!handler) {
      await this.jobsService.fail(
        job,
        GenerationFailureCode.INTERNAL,
        `No handler is registered for ${job.type}.`,
      );
      return;
    }

    const heartbeat = this.startHeartbeat(job, queue);

    try {
      const result = await handler.run(job, {
        setStep: (step) => this.jobsService.markStep(job, step),
      });

      await this.jobsService.complete(
        job,
        result.resultVersionId ?? null,
        result.creditsUsed,
      );
    } catch (error) {
      const failure =
        error instanceof GenerationJobError
          ? error
          : new GenerationJobError(
              GenerationFailureCode.INTERNAL,
              'Something went wrong on our side.',
            );

      if (!(error instanceof GenerationJobError)) {
        this.logger.error(
          `Job ${job.id} (${job.type}) failed.`,
          error as Error,
        );
      }

      await this.jobsService.fail(job, failure.code, failure.message);
    } finally {
      if (heartbeat) clearInterval(heartbeat);
    }
  }

  /** Runs the handler's undo for a job that failed without finishing `run`. */
  private async abandon(job: GenerationJobRecord): Promise<void> {
    const handler = this.handlers.get(job.type);

    if (!handler?.abandon) return;

    try {
      await handler.abandon(job);
    } catch (error) {
      this.logger.warn(
        `Could not undo the request for job ${job.id}: ${(error as Error).message}`,
      );
    }
  }

  private startHeartbeat(
    job: GenerationJobRecord,
    queue: GenerationJobQueue,
  ): ReturnType<typeof setInterval> | null {
    if (!queue.heartbeatMs) return null;

    return setInterval(() => {
      this.jobsService.renewLease(job, queue.leaseMs).catch((error) => {
        this.logger.warn(
          `Could not renew the lease for job ${job.id}: ${(error as Error).message}`,
        );
      });
    }, queue.heartbeatMs);
  }
}
