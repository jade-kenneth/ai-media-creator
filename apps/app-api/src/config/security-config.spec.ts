import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateEnv } from './env.schema';
import {
  buildProductionSecurityHeaders,
  createCorsOptions,
  createSecurityConfig,
  createThrottlerOptions,
  normalizeOrigin,
} from './security-config';

const baseEnv = {
  JWT_EXPIRATION: '7d',
  JWT_REFRESH_EXPIRATION: '30d',
  JWT_SECRET: 'super-secret-token-value',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/app-api',
  AWS_REGION: 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_S3_BUCKET: 'test-bucket',
  BREVO_API_KEY: 'test-brevo-key',
  BREVO_SENDER_EMAIL: 'organization@example.com',
};

describe('security config', () => {
  it('parses the new security env defaults', () => {
    const env = validateEnv(baseEnv);

    expect(env.TRUST_PROXY).toBe(false);
    expect(env.CORS_METHODS).toEqual([
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ]);
    expect(env.CORS_ALLOWED_HEADERS).toEqual([
      'Content-Type',
      'Authorization',
      'Role',
      'Environment',
    ]);
    expect(env.RATE_LIMIT_ENABLED).toBe(true);
    expect(env.RATE_LIMIT_WINDOW_SECONDS).toBe(60);
    expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    expect(env.SCHEDULER_ENABLED).toBe(true);
    expect(env.SECURITY_HEADERS_ENABLED).toBe(true);
    expect(env.HSTS_MAX_AGE_SECONDS).toBe(31536000);
  });

  it('applies env-driven CORS rules from validated config', async () => {
    const env = validateEnv({
      ...baseEnv,
      CORS_ALLOWED_HEADERS: 'Content-Type, Authorization, X-Request-ID',
      CORS_METHODS: 'get,post',
      CORS_ORIGINS: 'https://admin.example.com/',
    });
    const config = createSecurityConfig(new ConfigService(env));
    const corsOptions = createCorsOptions(config);

    expect(config.cors.allowedHeaders).toEqual([
      'Content-Type',
      'Authorization',
      'X-Request-ID',
    ]);
    expect(config.cors.methods).toEqual(['GET', 'POST']);
    expect(normalizeOrigin('https://admin.example.com/')).toBe(
      'https://admin.example.com',
    );

    await expect(
      resolveOrigin(corsOptions, 'https://admin.example.com'),
    ).resolves.toEqual({ allowed: true, error: null });
    await expect(
      resolveOrigin(corsOptions, 'https://mobile.example.com'),
    ).resolves.toEqual({
      allowed: false,
      error: new Error(
        'CORS origin is not allowed: https://mobile.example.com',
      ),
    });
    await expect(resolveOrigin(corsOptions, undefined)).resolves.toEqual({
      allowed: true,
      error: null,
    });
  });

  it('builds production headers only when enabled and over https', () => {
    const productionConfig = createSecurityConfig(
      new ConfigService(
        validateEnv({
          ...baseEnv,
          HSTS_MAX_AGE_SECONDS: '63072000',
          NODE_ENV: 'production',
        }),
      ),
    );
    const disabledConfig = createSecurityConfig(
      new ConfigService(
        validateEnv({
          ...baseEnv,
          NODE_ENV: 'production',
          SECURITY_HEADERS_ENABLED: 'false',
        }),
      ),
    );

    expect(buildProductionSecurityHeaders(productionConfig, false)).toEqual({
      'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    expect(buildProductionSecurityHeaders(productionConfig, true)).toEqual({
      'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
      'Referrer-Policy': 'no-referrer',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    expect(buildProductionSecurityHeaders(disabledConfig, true)).toEqual({});
  });

  it('creates Nest throttler options from the validated rate-limit config', () => {
    const enabledConfig = createSecurityConfig(
      new ConfigService(
        validateEnv({
          ...baseEnv,
          RATE_LIMIT_MAX_REQUESTS: '2',
          RATE_LIMIT_WINDOW_SECONDS: '1',
        }),
      ),
    );
    const disabledConfig = createSecurityConfig(
      new ConfigService(
        validateEnv({
          ...baseEnv,
          RATE_LIMIT_ENABLED: 'false',
        }),
      ),
    );

    const enabledOptions = createThrottlerOptions(enabledConfig);
    const disabledOptions = createThrottlerOptions(disabledConfig);

    expect(Array.isArray(enabledOptions)).toBe(false);

    if (Array.isArray(enabledOptions) || Array.isArray(disabledOptions)) {
      throw new Error('Expected object-based throttler options.');
    }

    expect(enabledOptions.throttlers).toEqual([
      {
        limit: 2,
        ttl: 1000,
      },
    ]);
    expect(enabledOptions.skipIf?.(createHttpContext('GET'))).toBe(false);
    expect(enabledOptions.skipIf?.(createHttpContext('OPTIONS'))).toBe(true);
    expect(disabledOptions.skipIf?.(createHttpContext('GET'))).toBe(true);
  });
});

async function resolveOrigin(
  corsOptions: ReturnType<typeof createCorsOptions>,
  origin?: string,
) {
  return new Promise<{ allowed: boolean; error: Error | null }>((resolve) => {
    const originHandler = corsOptions.origin;

    if (typeof originHandler !== 'function') {
      throw new Error('Expected a function-based CORS origin handler.');
    }

    originHandler(origin, (error, allowed) => {
      resolve({
        allowed: allowed === true,
        error: error ?? null,
      });
    });
  });
}

function createHttpContext(method: string) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ method }),
    }),
  } as ExecutionContext;
}
