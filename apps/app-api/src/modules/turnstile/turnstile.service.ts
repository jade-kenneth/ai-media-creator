import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExternalServiceError,
  TurnstileVerificationError,
  ValidationError,
} from 'src/common/errors/app.error';
import { z } from 'zod';
import {
  TURNSTILE_FALLBACK_HEADER,
  TURNSTILE_TOKEN_HEADER,
} from './turnstile.constants';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SITEVERIFY_TIMEOUT_MS = 5000;

const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  cdata: z.string().optional(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  'error-codes': z.array(z.string()).default([]),
});

export interface TurnstileRequest {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

export interface TurnstileVerificationOptions {
  action: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly configService: ConfigService) {}

  get isEnabled(): boolean {
    return this.configService.get<boolean>('TURNSTILE_ENABLED') === true;
  }

  /**
   * Resolves when the request carries a Turnstile token that Cloudflare
   * accepts for `action`. Throws otherwise. When Turnstile is disabled the
   * check is skipped so the stack boots without a Cloudflare account; the env
   * schema requires the secret as soon as the flag is on.
   */
  async assertVerified(
    request: TurnstileRequest,
    options: TurnstileVerificationOptions,
  ): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const secretKey = this.configService
      .get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY')
      ?.trim();

    if (!secretKey) {
      throw new ExternalServiceError('Turnstile is not configured.');
    }

    const token = readToken(request);

    if (!token) {
      throw new ValidationError('Turnstile verification is required.', {
        reason: 'TOKEN_REQUIRED',
      });
    }

    const verification = await this.siteverify(
      secretKey,
      token,
      readRemoteIp(request),
    );

    if (!verification.success) {
      throw new TurnstileVerificationError('Turnstile verification failed.', {
        reason: 'CHALLENGE_REJECTED',
        codes: verification['error-codes'],
      });
    }

    if (verification.action !== options.action) {
      throw new TurnstileVerificationError('Turnstile verification failed.', {
        reason: 'ACTION_MISMATCH',
        expectedAction: options.action,
      });
    }
  }

  private async siteverify(
    secretKey: string,
    token: string,
    remoteIp?: string,
  ): Promise<z.infer<typeof siteverifyResponseSchema>> {
    const body = new URLSearchParams({ secret: secretKey, response: token });

    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    let response: Response;

    try {
      response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error('Turnstile siteverify request failed.', error);
      throw new ExternalServiceError('Unable to verify Turnstile.');
    }

    if (!response.ok) {
      this.logger.error(
        `Turnstile siteverify responded with ${response.status}.`,
      );
      throw new ExternalServiceError('Unable to verify Turnstile.');
    }

    const parsed = siteverifyResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      this.logger.error('Turnstile siteverify returned an unexpected payload.');
      throw new ExternalServiceError('Unable to verify Turnstile.');
    }

    return parsed.data;
  }
}

function readToken(request: TurnstileRequest): string | null {
  const body = isRecord(request.body) ? request.body : undefined;

  const candidates = [
    request.headers[TURNSTILE_TOKEN_HEADER],
    request.headers[TURNSTILE_FALLBACK_HEADER],
    body?.turnstileToken,
  ];

  for (const candidate of candidates) {
    const token = firstNonEmptyString(candidate);

    if (token) {
      return token;
    }
  }

  return null;
}

function readRemoteIp(request: TurnstileRequest): string | undefined {
  const forwardedFor = firstNonEmptyString(request.headers['x-forwarded-for']);

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }

  return request.ip ?? request.socket?.remoteAddress ?? undefined;
}

function firstNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = firstNonEmptyString(entry);

      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
