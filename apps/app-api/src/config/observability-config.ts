import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

interface RequestLoggingConfig {
  enabled: boolean;
  includeHealthRequests: boolean;
  slowRequestWarnThresholdMs: number;
}

export interface ObservabilityConfig {
  requestLogging: RequestLoggingConfig;
}

export function createObservabilityConfig(
  configService: ConfigService,
): ObservabilityConfig {
  return {
    requestLogging: {
      enabled: configService.get<boolean>('REQUEST_LOGGING_ENABLED') ?? true,
      includeHealthRequests:
        configService.get<boolean>('REQUEST_LOGGING_INCLUDE_HEALTH') ?? false,
      slowRequestWarnThresholdMs:
        configService.get<number>('SLOW_REQUEST_WARN_THRESHOLD_MS') ?? 1000,
    },
  };
}

export function shouldLogRequest(
  method: string,
  path: string,
  config: ObservabilityConfig,
): boolean {
  if (!config.requestLogging.enabled) {
    return false;
  }

  if (method === 'OPTIONS') {
    return false;
  }

  if (
    !config.requestLogging.includeHealthRequests &&
    isHealthRequestPath(path)
  ) {
    return false;
  }

  return true;
}

export function createRequestLogMessage(
  request: Request,
  response: Response,
  requestId: string,
  durationMs: number,
  path: string,
): string {
  return JSON.stringify({
    requestId,
    method: request.method,
    path,
    statusCode: response.statusCode,
    durationMs: roundDurationMs(durationMs),
    ip: request.ip,
    operationName: resolveGraphqlOperationName(request),
    userAgent: resolveUserAgent(request.headers['user-agent']),
  });
}

export function resolveRequestLogLevel(
  statusCode: number,
  durationMs: number,
  slowRequestWarnThresholdMs: number,
): 'error' | 'warn' | 'log' {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400 || durationMs >= slowRequestWarnThresholdMs) {
    return 'warn';
  }

  return 'log';
}

function isHealthRequestPath(path: string): boolean {
  return path === '/' || path === '/health';
}

export function normalizeRequestPath(path: string): string {
  const queryIndex = path.indexOf('?');

  if (queryIndex === -1) {
    return path;
  }

  return path.slice(0, queryIndex);
}

export function resolveRequestId(value: string | string[] | undefined): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValue = value.find((entry) => entry.trim().length > 0);

    if (firstValue) {
      return firstValue.trim();
    }
  }

  return randomUUID();
}

function resolveGraphqlOperationName(request: Request): string | null {
  const body = request.body;

  if (
    typeof body === 'object' &&
    body !== null &&
    'operationName' in body &&
    typeof body.operationName === 'string' &&
    body.operationName.trim().length > 0
  ) {
    return body.operationName.trim();
  }

  return null;
}

function resolveUserAgent(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValue = value.find((entry) => entry.trim().length > 0);

    return firstValue ? firstValue.trim() : null;
  }

  return null;
}

function roundDurationMs(value: number): number {
  return Math.round(value * 100) / 100;
}
