import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { GenerationJobsRunner } from './generation-jobs.runner';
import {
  MEDIA_JOB_QUEUE,
  TEXT_JOB_QUEUE,
  type GenerationJobQueue,
} from './generation-jobs.types';

/**
 * Polls one job queue every second and runs at most one job at a time per
 * process. Subclasses pick the queue; each process registers only the worker
 * for the queue it owns (see AppModule and MediaWorkerModule).
 */
abstract class QueueWorker {
  private readonly logger = new Logger(this.constructor.name);
  private busy = false;

  protected constructor(
    private readonly configService: ConfigService,
    private readonly runner: GenerationJobsRunner,
    private readonly queue: GenerationJobQueue,
  ) {}

  protected async runTick(): Promise<void> {
    if (!this.configService.get<boolean>('SCHEDULER_ENABLED')) return;
    if (this.busy) return;

    this.busy = true;

    try {
      await this.runner.runNext(this.queue);
    } catch (error) {
      this.logger.error(
        `The ${this.queue.name} job worker tick failed.`,
        error as Error,
      );
    } finally {
      this.busy = false;
    }
  }
}

/** Runs the short text jobs (angles, scripts, rewrites) inside the API. */
@Injectable()
export class GenerationJobsWorker extends QueueWorker {
  constructor(configService: ConfigService, runner: GenerationJobsRunner) {
    super(configService, runner, TEXT_JOB_QUEUE);
  }

  @Interval('generation-jobs-worker', 1000)
  async tick(): Promise<void> {
    await this.runTick();
  }
}

/**
 * Runs in the API: every 30 seconds, fails the media jobs left waiting while
 * no media worker is running, so the creator sees a failure with Try again
 * (and gets the credits back) instead of a job that never starts.
 */
@Injectable()
export class UnservedJobsWatch {
  private readonly logger = new Logger(UnservedJobsWatch.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly runner: GenerationJobsRunner,
  ) {}

  @Interval('unserved-jobs-watch', 30_000)
  async tick(): Promise<void> {
    if (!this.configService.get<boolean>('SCHEDULER_ENABLED')) return;

    try {
      await this.runner.failUnserved(MEDIA_JOB_QUEUE);
    } catch (error) {
      this.logger.error('The unserved job check failed.', error as Error);
    }
  }
}

/** Runs voice and render jobs in the separate media worker process. */
@Injectable()
export class MediaJobsWorker extends QueueWorker {
  constructor(configService: ConfigService, runner: GenerationJobsRunner) {
    super(configService, runner, MEDIA_JOB_QUEUE);
  }

  @Interval('media-jobs-worker', 1000)
  async tick(): Promise<void> {
    await this.runTick();
  }
}
