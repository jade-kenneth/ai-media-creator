import {
  GenerationFailureCode,
  GenerationJobType,
} from 'src/graphql/generated/graphql';
import type { GenerationJobRecord } from './repositories/generation-jobs.repository';

/**
 * Thrown by a job handler to fail the job with a code the client maps to its
 * failure copy (Design Reference §7). Any other error fails as INTERNAL.
 */
export class GenerationJobError extends Error {
  constructor(
    public readonly code: GenerationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'GenerationJobError';
  }
}

export interface GenerationJobContext {
  /** Moves the job's visible step forward (0-based). */
  setStep(step: number): Promise<void>;
}

export interface GenerationJobResult {
  resultVersionId?: string | null;
  /** Credits earned when only part of the work finished; defaults to the full cost. */
  creditsUsed?: number;
}

export interface GenerationJobHandler {
  /**
   * Performs the job's side effects and persists its result. Runs the provider
   * call first and writes the result only after it succeeds, so a failure
   * leaves the creator's approved work untouched.
   */
  run(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult>;
  /**
   * Undoes what the request changed ahead of the job (a render's project
   * status) when the job fails without `run` finishing: no worker picked it
   * up, or it stopped too many times. Optional; most requests change nothing
   * before their job runs.
   */
  abandon?(job: GenerationJobRecord): Promise<void>;
}

/**
 * A set of job types claimed and run by one kind of worker. Text jobs run in
 * the API process; voice and render jobs run in the separate media worker
 * (`src/worker.ts`) so their CPU, memory and run time never slow requests.
 */
export interface GenerationJobQueue {
  /** Names the claim lock, so the two workers never wait on each other. */
  name: 'text' | 'media';
  types: readonly GenerationJobType[];
  /** A crashed worker's job is reclaimed once this lease runs out. */
  leaseMs: number;
  /** Renews the lease while a job runs; null for jobs shorter than the lease. */
  heartbeatMs: number | null;
  /**
   * A job fails after waiting this long while no worker shows any activity on
   * the queue (the worker process is down); null for a queue the API serves
   * itself.
   */
  unservedAfterMs: number | null;
}

export const TEXT_JOB_QUEUE: GenerationJobQueue = {
  name: 'text',
  types: [
    GenerationJobType.SUGGEST_ANGLES,
    GenerationJobType.SUGGEST_AUDIENCES,
    GenerationJobType.SUGGEST_PREMISES,
    GenerationJobType.WRITE_SCRIPT,
    GenerationJobType.REWRITE_HOOK,
    GenerationJobType.REWRITE_SCENE,
  ],
  leaseMs: 90_000,
  // A provider call can outlast the lease (TEXT_PROVIDER_TIMEOUT_MS).
  heartbeatMs: 30_000,
  // Claimed by the API process that also receives the request.
  unservedAfterMs: null,
};

export const MEDIA_JOB_QUEUE: GenerationJobQueue = {
  name: 'media',
  types: [
    GenerationJobType.GENERATE_VOICEOVER,
    GenerationJobType.ALIGN_RECORDING,
    GenerationJobType.RENDER_VIDEO,
    GenerationJobType.GENERATE_SCENE_CLIPS,
  ],
  leaseMs: 120_000,
  heartbeatMs: 30_000,
  // Longer than a worker restart, and than the heartbeat, so a running job's
  // renewals always count as activity.
  unservedAfterMs: 3 * 60_000,
};

export { GenerationFailureCode };
