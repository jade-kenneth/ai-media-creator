import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';

/** A clip job gives up on the video service after this long. */
export const VIDEO_JOB_TIMEOUT_MS = 10 * 60 * 1000;
export const VIDEO_REQUEST_TIMEOUT_MS = 30_000;
export const VIDEO_DOWNLOAD_TIMEOUT_MS = 60_000;
export const VIDEO_DOWNLOAD_MAX_BYTES = 100 * 1024 * 1024;

/** How an input image is used; frame roles and references never mix. */
export type VideoImageRole = 'first_frame' | 'last_frame' | 'reference_image';

export interface VideoTaskImage {
  /** A short-lived https URL of a 9:16 frame. */
  url: string;
  role: VideoImageRole;
}

export interface VideoTaskRequest {
  /**
   * One first frame; a first and a last frame; up to 9 reference images; or
   * none, for text to video (Describe only).
   */
  images: VideoTaskImage[];
  prompt: string;
  durationSeconds: number;
  resolution: '480P' | '768P';
}

export type VideoTaskState =
  | { status: 'pending' }
  | { status: 'succeeded'; url: string }
  | { status: 'failed' };

/** One image-to-video vendor. Keys stay server-side. */
export interface VideoProvider {
  isConfigured(): boolean;
  model(): string;
  /** Starts a generation task and returns its id. */
  createTask(request: VideoTaskRequest): Promise<string>;
  getTask(taskId: string): Promise<VideoTaskState>;
  /** Streams a finished clip to a task-owned file; returns its size in bytes. */
  download(url: string, path: string): Promise<number>;
}

export const videoProviderErrors = {
  notConfigured: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
      'The video service isn’t set up yet.',
    ),
  timeout: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_TIMEOUT,
      'The video service timed out after 10 minutes.',
    ),
  rejected: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_REJECTED,
      'The video service turned the request down.',
    ),
  unusable: () =>
    new GenerationJobError(
      GenerationFailureCode.INVALID_OUTPUT,
      'The clips came back unusable, so we didn’t keep them.',
    ),
};
