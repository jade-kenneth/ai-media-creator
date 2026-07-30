import { validateEnv } from '../../config/env.schema';
import {
  appleNotificationBodySchema,
  googleNotificationBodySchema,
} from './store-purchases.validation';

const baseEnv = {
  JWT_EXPIRATION: '7d',
  JWT_REFRESH_EXPIRATION: '30d',
  JWT_SECRET: 'super-secret-token-value',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test-product',
  AWS_REGION: 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_S3_BUCKET: 'test-bucket',
  BREVO_API_KEY: 'test-brevo-key',
  BREVO_SENDER_EMAIL: 'sender@example.com',
};

describe('store purchase configuration', () => {
  it('requires Google credentials when Google Play IAP is enabled', () => {
    expect(() =>
      validateEnv({ ...baseEnv, STORE_IAP_ENABLED: 'true' }),
    ).toThrow('GOOGLE_PLAY_PACKAGE_NAME is required');
  });

  it('does not require Apple credentials when only Google Play IAP is enabled', () => {
    const env = validateEnv({
      ...baseEnv,
      STORE_IAP_ENABLED: 'true',
      GOOGLE_PLAY_PACKAGE_NAME: 'com.example.product',
      GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64: 'e30=',
      GOOGLE_PLAY_PUBSUB_AUDIENCE:
        'https://api-example.com/store-webhooks/google',
      GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL: 'push@example.com',
    });

    expect(env.STORE_IAP_ENABLED).toBe(true);
    expect(env.APPLE_IAP_ENABLED).toBe(false);
  });

  it('requires Apple credentials only when Apple IAP is enabled', () => {
    expect(() =>
      validateEnv({ ...baseEnv, APPLE_IAP_ENABLED: 'true' }),
    ).toThrow('APPLE_IAP_ENVIRONMENT is required');
  });

  it('accepts a complete production Apple IAP environment independently', () => {
    const env = validateEnv({
      ...baseEnv,
      APPLE_IAP_ENABLED: 'true',
      APPLE_IAP_ENVIRONMENT: 'PRODUCTION',
      APPLE_IAP_BUNDLE_ID: 'com.example.product',
      APPLE_IAP_APP_ID: '1234567890',
      APPLE_IAP_ROOT_CA_BASE64: 'Y2VydGlmaWNhdGU=',
    });

    expect(env.APPLE_IAP_ENABLED).toBe(true);
    expect(env.STORE_IAP_ENABLED).toBe(false);
    expect(env.APPLE_IAP_APP_ID).toBe(1234567890);
  });

  it('rejects unknown webhook fields at the transport boundary', () => {
    expect(
      appleNotificationBodySchema.safeParse({
        signedPayload: 'payload',
        receipt: 'untrusted',
      }).success,
    ).toBe(false);
    expect(
      googleNotificationBodySchema.safeParse({
        message: { data: 'e30=', messageId: 'message-1' },
        subscription: 'projects/example/subscriptions/store',
      }).success,
    ).toBe(true);
  });
});
