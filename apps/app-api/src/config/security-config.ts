import type { ExecutionContext } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { NextFunction, Request, Response } from 'express';

type SecurityHeaders = Record<string, string>;

interface CorsConfig {
  allowedHeaders: string[];
  allowedOrigins: Set<string>;
  exposedHeaders: string[];
  maxAgeSeconds: number;
  methods: string[];
}

interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  windowSeconds: number;
}

export interface SecurityConfig {
  cors: CorsConfig;
  hstsMaxAgeSeconds: number;
  isProduction: boolean;
  rateLimit: RateLimitConfig;
  securityHeadersEnabled: boolean;
  trustProxy: boolean;
}

const DEFAULT_PRODUCTION_HEADERS = {
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const satisfies SecurityHeaders;

export function createSecurityConfig(
  configService: ConfigService,
): SecurityConfig {
  const allowedOrigins = configService.get<string[]>('CORS_ORIGINS') ?? [];
  const corsMethods = normalizeStringList(
    configService.get<string[]>('CORS_METHODS') ?? [],
    (value) => value.toUpperCase(),
  );

  return {
    isProduction: configService.get<string>('NODE_ENV') === 'production',
    trustProxy: configService.get<boolean>('TRUST_PROXY') ?? false,
    securityHeadersEnabled:
      configService.get<boolean>('SECURITY_HEADERS_ENABLED') ?? true,
    hstsMaxAgeSeconds:
      configService.get<number>('HSTS_MAX_AGE_SECONDS') ?? 31536000,
    cors: {
      allowedOrigins: new Set(allowedOrigins.map(normalizeOrigin)),
      methods: corsMethods,
      allowedHeaders: normalizeStringList(
        configService.get<string[]>('CORS_ALLOWED_HEADERS') ?? [],
      ),
      exposedHeaders: normalizeStringList(
        configService.get<string[]>('CORS_EXPOSED_HEADERS') ?? [],
      ),
      maxAgeSeconds: configService.get<number>('CORS_MAX_AGE_SECONDS') ?? 86400,
    },
    rateLimit: {
      enabled: configService.get<boolean>('RATE_LIMIT_ENABLED') ?? true,
      maxRequests: configService.get<number>('RATE_LIMIT_MAX_REQUESTS') ?? 100,
      windowSeconds:
        configService.get<number>('RATE_LIMIT_WINDOW_SECONDS') ?? 60,
      windowMs:
        (configService.get<number>('RATE_LIMIT_WINDOW_SECONDS') ?? 60) * 1000,
    },
  };
}

export function createCorsOptions(config: SecurityConfig): CorsOptions {
  return {
    credentials: true,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders:
      config.cors.exposedHeaders.length > 0
        ? config.cors.exposedHeaders
        : undefined,
    maxAge: config.cors.maxAgeSeconds,
    methods: config.cors.methods,
    optionsSuccessStatus: 204,
    origin: (origin, callback) => {
      if (!origin || config.cors.allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);

        return;
      }

      callback(new Error(`CORS origin is not allowed: ${origin}`), false);
    },
  };
}

export function createSecurityHeadersMiddleware(config: SecurityConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const headers = buildProductionSecurityHeaders(config, isHttpsRequest(req));

    for (const [headerName, headerValue] of Object.entries(headers)) {
      res.set(headerName, headerValue);
    }

    next();
  };
}

export function createThrottlerOptions(
  config: SecurityConfig,
): ThrottlerModuleOptions {
  return {
    skipIf: (context: ExecutionContext) => shouldSkipRateLimit(context, config),
    throttlers: [
      {
        limit: config.rateLimit.maxRequests,
        ttl: config.rateLimit.windowMs,
      },
    ],
  };
}

export function buildProductionSecurityHeaders(
  config: SecurityConfig,
  isHttps: boolean,
): SecurityHeaders {
  if (!config.isProduction || !config.securityHeadersEnabled) {
    return {};
  }

  const headers: SecurityHeaders = {
    ...DEFAULT_PRODUCTION_HEADERS,
  };

  if (isHttps && config.hstsMaxAgeSeconds > 0) {
    headers['Strict-Transport-Security'] =
      `max-age=${config.hstsMaxAgeSeconds}; includeSubDomains`;
  }

  return headers;
}

export function normalizeOrigin(origin: string): string {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
}

function isHttpsRequest(
  request: Pick<Request, 'headers'> & { secure?: boolean },
): boolean {
  if (request.secure) {
    return true;
  }

  const forwardedProto = request.headers['x-forwarded-proto'];

  if (Array.isArray(forwardedProto)) {
    return forwardedProto.some((value) => value.includes('https'));
  }

  return forwardedProto?.includes('https') ?? false;
}

function normalizeStringList(
  values: string[],
  transform: (value: string) => string = (value) => value,
): string[] {
  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const value of values) {
    const normalizedValue = transform(value.trim());

    if (!normalizedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    normalizedValues.push(normalizedValue);
  }

  return normalizedValues;
}

function shouldSkipRateLimit(
  context: ExecutionContext,
  config: SecurityConfig,
): boolean {
  if (!config.rateLimit.enabled) {
    return true;
  }

  if (context.getType<string>() !== 'http') {
    return false;
  }

  const request = context.switchToHttp().getRequest<{ method?: string }>();

  return request.method === 'OPTIONS';
}
