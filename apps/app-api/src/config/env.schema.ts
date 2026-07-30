import { z } from 'zod';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4302',
  'http://127.0.0.1:4302',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];
const DEFAULT_CORS_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
];
const DEFAULT_CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'Role',
  'Environment',
];

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    TRUST_PROXY: z.preprocess(normalizeBooleanEnv, z.boolean().default(false)),
    MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required.'),
    JWT_SECRET: z
      .string()
      .min(16, 'JWT_SECRET must be at least 16 characters long.'),
    JWT_EXPIRATION: z.string().trim().min(1, 'JWT_EXPIRATION is required.'),
    JWT_REFRESH_EXPIRATION: z
      .string()
      .trim()
      .min(1, 'JWT_REFRESH_EXPIRATION is required.'),
    AWS_REGION: z.string().trim().min(1, 'AWS_REGION is required.'),
    AWS_ACCESS_KEY_ID: z
      .string()
      .trim()
      .min(1, 'AWS_ACCESS_KEY_ID is required.'),
    AWS_SECRET_ACCESS_KEY: z
      .string()
      .trim()
      .min(1, 'AWS_SECRET_ACCESS_KEY is required.'),
    AWS_S3_BUCKET: z.string().trim().min(1, 'AWS_S3_BUCKET is required.'),
    AWS_S3_PUBLIC_BASE_URL: z.string().trim().url().optional(),
    EXPO_PUSH_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
    SCHEDULER_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
    EXPO_PUSH_ACCESS_TOKEN: z.string().trim().optional(),
    STORE_IAP_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    APPLE_IAP_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    APPLE_IAP_ENVIRONMENT: z.enum(['SANDBOX', 'PRODUCTION']).optional(),
    APPLE_IAP_BUNDLE_ID: z.string().trim().min(1).optional(),
    APPLE_IAP_APP_ID: z.coerce.number().int().positive().optional(),
    APPLE_IAP_ROOT_CA_BASE64: z.string().trim().min(1).optional(),
    GOOGLE_PLAY_PACKAGE_NAME: z.string().trim().min(1).optional(),
    GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64: z.string().trim().min(1).optional(),
    GOOGLE_PLAY_PUBSUB_AUDIENCE: z.url().trim().optional(),
    GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL: z.email().trim().optional(),
    CORS_ORIGINS: z.preprocess(
      normalizeCorsOriginsEnv,
      z.array(z.url()).default(DEFAULT_CORS_ORIGINS),
    ),
    CORS_METHODS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z.array(z.string().trim().min(1)).default(DEFAULT_CORS_METHODS),
    ),
    CORS_ALLOWED_HEADERS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z.array(z.string().trim().min(1)).default(DEFAULT_CORS_ALLOWED_HEADERS),
    ),
    CORS_EXPOSED_HEADERS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z.array(z.string().trim().min(1)).default([]),
    ),
    CORS_MAX_AGE_SECONDS: z.coerce.number().int().min(0).default(86400),
    RATE_LIMIT_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
    RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(60),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(100),
    REQUEST_LOGGING_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
    REQUEST_LOGGING_INCLUDE_HEALTH: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    SLOW_REQUEST_WARN_THRESHOLD_MS: z.coerce
      .number()
      .int()
      .min(0)
      .default(1000),
    SECURITY_HEADERS_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
    HSTS_MAX_AGE_SECONDS: z.coerce.number().int().min(0).default(31536000),
    BREVO_API_KEY: z.string().trim().min(1, 'BREVO_API_KEY is required.'),
    BREVO_SENDER_EMAIL: z
      .string()
      .trim()
      .email('BREVO_SENDER_EMAIL must be a valid email.')
      .min(1, 'BREVO_SENDER_EMAIL is required.'),
    BREVO_SENDER_NAME: z.string().trim().min(1).default('Application'),
  })
  .superRefine((config, context) => {
    const requireConfig = (
      flag: 'APPLE_IAP_ENABLED' | 'STORE_IAP_ENABLED',
      keys: Array<keyof typeof config>,
    ) => {
      for (const key of keys) {
        if (config[key] === undefined) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required when ${flag} is true.`,
          });
        }
      }
    };

    if (config.APPLE_IAP_ENABLED) {
      const appleRequired: Array<keyof typeof config> = [
        'APPLE_IAP_ENVIRONMENT',
        'APPLE_IAP_BUNDLE_ID',
        'APPLE_IAP_ROOT_CA_BASE64',
      ];
      if (config.APPLE_IAP_ENVIRONMENT === 'PRODUCTION') {
        appleRequired.push('APPLE_IAP_APP_ID');
      }
      requireConfig('APPLE_IAP_ENABLED', appleRequired);
    }

    if (config.STORE_IAP_ENABLED) {
      requireConfig('STORE_IAP_ENABLED', [
        'GOOGLE_PLAY_PACKAGE_NAME',
        'GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64',
        'GOOGLE_PLAY_PUBSUB_AUDIENCE',
        'GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL',
      ]);
    }
  });

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (result.success) return result.data;

  const message = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
    .join('; ');

  throw new Error(`Config validation error: ${message}`);
}

function normalizeCorsOriginsEnv(value: unknown): unknown {
  return normalizeCommaSeparatedEnv(value);
}

function normalizeCommaSeparatedEnv(value: unknown): unknown {
  if (Array.isArray(value)) return value;

  if (typeof value !== 'string') return value;

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : undefined;
}

function normalizeBooleanEnv(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) return undefined;
  if (['true', '1', 'yes', 'on'].includes(normalizedValue)) return true;
  if (['false', '0', 'no', 'off'].includes(normalizedValue)) return false;

  return value;
}
