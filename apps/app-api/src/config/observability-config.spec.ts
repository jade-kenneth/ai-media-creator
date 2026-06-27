import { ConfigService } from '@nestjs/config';
import { validateEnv } from './env.schema';
import {
  createObservabilityConfig,
  resolveRequestLogLevel,
  shouldLogRequest,
} from './observability-config';

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

describe('observability config', () => {
  it('parses request logging defaults from env validation', () => {
    const config = createObservabilityConfig(
      new ConfigService(validateEnv(baseEnv)),
    );

    expect(config.requestLogging).toEqual({
      enabled: true,
      includeHealthRequests: false,
      slowRequestWarnThresholdMs: 1000,
    });
  });

  it('skips health and preflight requests unless explicitly enabled', () => {
    const defaultConfig = createObservabilityConfig(
      new ConfigService(validateEnv(baseEnv)),
    );
    const includeHealthConfig = createObservabilityConfig(
      new ConfigService(
        validateEnv({
          ...baseEnv,
          REQUEST_LOGGING_INCLUDE_HEALTH: 'true',
        }),
      ),
    );

    expect(shouldLogRequest('GET', '/graphql', defaultConfig)).toBe(true);
    expect(shouldLogRequest('OPTIONS', '/graphql', defaultConfig)).toBe(false);
    expect(shouldLogRequest('GET', '/', defaultConfig)).toBe(false);
    expect(shouldLogRequest('GET', '/health', defaultConfig)).toBe(false);
    expect(shouldLogRequest('GET', '/health', includeHealthConfig)).toBe(true);
  });

  it('promotes slow and failing requests to warning or error levels', () => {
    expect(resolveRequestLogLevel(200, 50, 1000)).toBe('log');
    expect(resolveRequestLogLevel(404, 50, 1000)).toBe('warn');
    expect(resolveRequestLogLevel(200, 1500, 1000)).toBe('warn');
    expect(resolveRequestLogLevel(500, 10, 1000)).toBe('error');
  });
});
