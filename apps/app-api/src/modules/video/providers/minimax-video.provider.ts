import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { z } from 'zod';
import {
  VIDEO_DOWNLOAD_MAX_BYTES,
  VIDEO_DOWNLOAD_TIMEOUT_MS,
  VIDEO_REQUEST_TIMEOUT_MS,
  videoProviderErrors,
  type VideoProvider,
  type VideoTaskRequest,
  type VideoTaskState,
} from '../video.types';

const API_BASE = 'https://api.minimax.io';

const createResponse = z.object({
  task_id: z.string().min(1).optional(),
  task: z.object({ id: z.string().min(1) }).optional(),
});

const queryResponse = z.object({
  task: z.object({
    status: z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
    content: z.object({ url: z.string().nullish() }).nullish(),
  }),
});

/**
 * MiniMax video over its v2 REST API (checked against the platform docs on
 * 2026-09-25, and for text-only requests on 2026-09-26): create a task with a
 * text prompt and any frame or reference images, poll it, then download the
 * result. Responses are validated before use; anything unreadable is treated
 * as a refusal.
 */
@Injectable()
export class MiniMaxVideoProvider implements VideoProvider {
  private readonly logger = new Logger(MiniMaxVideoProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  model(): string {
    return (
      this.configService.get<string>('MINIMAX_VIDEO_MODEL') ?? 'MiniMax-H3-Max'
    );
  }

  async createTask(request: VideoTaskRequest): Promise<string> {
    const body = await this.request('/v2/video_generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model(),
        content: [
          { type: 'text', text: request.prompt },
          ...request.images.map((image) => ({
            type: 'image_url',
            image_url: { url: image.url },
            role: image.role,
          })),
        ],
        duration: request.durationSeconds,
        resolution: request.resolution,
        // With a first or last frame the shape follows the image (always
        // adaptive). References and text-only requests set it: text to video
        // requires a concrete ratio (rechecked 2026-09-26). Frames are 9:16.
        ratio: request.images.some((image) => image.role !== 'reference_image')
          ? 'adaptive'
          : '9:16',
      }),
    });
    const parsed = parse(createResponse, body);
    const taskId = parsed.task_id ?? parsed.task?.id;

    if (!taskId) throw videoProviderErrors.rejected();

    return taskId;
  }

  async getTask(taskId: string): Promise<VideoTaskState> {
    const body = await this.request(
      `/v2/query/video_generation/${encodeURIComponent(taskId)}`,
      { method: 'GET' },
    );
    const { task } = parse(queryResponse, body);

    if (task.status === 'succeeded') {
      const url = task.content?.url;

      return url ? { status: 'succeeded', url } : { status: 'failed' };
    }

    if (task.status === 'failed' || task.status === 'cancelled') {
      return { status: 'failed' };
    }

    return { status: 'pending' };
  }

  async download(url: string, path: string): Promise<number> {
    if (!/^https:\/\//i.test(url)) throw videoProviderErrors.unusable();

    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(VIDEO_DOWNLOAD_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`Clip download failed: ${(error as Error).message}`);
      throw videoProviderErrors.unusable();
    }

    const declared = Number(response.headers.get('content-length') ?? 0);

    if (!response.ok || !response.body || declared > VIDEO_DOWNLOAD_MAX_BYTES) {
      throw videoProviderErrors.unusable();
    }

    let bytes = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        callback(
          bytes > VIDEO_DOWNLOAD_MAX_BYTES
            ? new Error('The clip is larger than allowed.')
            : null,
          chunk,
        );
      },
    });

    try {
      await pipeline(
        Readable.fromWeb(response.body as WebReadableStream),
        limit,
        createWriteStream(path, { flags: 'wx', mode: 0o600 }),
      );
    } catch (error) {
      this.logger.warn(`Clip download failed: ${(error as Error).message}`);
      throw videoProviderErrors.unusable();
    }

    return bytes;
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const apiKey = this.apiKey();

    if (!apiKey) throw videoProviderErrors.notConfigured();

    let response: Response;

    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(VIDEO_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw videoProviderErrors.timeout();
      }
      this.logger.warn(`Video request failed: ${(error as Error).message}`);
      throw videoProviderErrors.rejected();
    }

    if (!response.ok) {
      this.logger.warn(
        `Video service answered ${response.status} for ${path}.`,
      );
      throw videoProviderErrors.rejected();
    }

    return response.json();
  }

  private apiKey(): string | undefined {
    return this.configService.get<string>('MINIMAX_API_KEY');
  }
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) throw videoProviderErrors.rejected();

  return result.data;
}
