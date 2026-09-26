import { z } from 'zod';

const DEFAULT_CORS_ORIGINS = ['http://localhost:4302', 'http://127.0.0.1:4302'];
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
    SCHEDULER_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(true),
    ),
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
    TURNSTILE_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().trim().min(1).optional(),
    GOOGLE_OAUTH_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    GOOGLE_OAUTH_CLIENT_IDS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z.array(z.string().trim().min(1)).default([]),
    ),
    OPENAI_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    OPENAI_TEXT_MODEL: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    ANTHROPIC_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    ANTHROPIC_TEXT_MODEL: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('claude-opus-5'),
    ),
    DEEPSEEK_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    DEEPSEEK_TEXT_MODEL: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('deepseek-v4-pro'),
    ),
    MINIMAX_TEXT_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    MINIMAX_TEXT_MODEL: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('MiniMax-M3'),
    ),
    TEXT_PROVIDER: z.preprocess(
      normalizeBlankEnv,
      z.enum(['openai', 'anthropic', 'deepseek', 'minimax']).optional(),
    ),
    TEXT_FALLBACK_PROVIDER: z.preprocess(
      normalizeBlankEnv,
      z.enum(['openai', 'anthropic', 'deepseek', 'minimax']).optional(),
    ),
    TEXT_FALLBACK_PROVIDERS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z
        .array(z.enum(['openai', 'anthropic', 'deepseek', 'minimax']))
        .default([]),
    ),
    STARTER_CREDITS: z.coerce.number().int().min(0).default(50),
    PRODUCT_IMPORT_ALLOWED_HOSTS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z.array(z.string().trim().toLowerCase().min(1)).default([]),
    ),
    // Video beta (Batch 2). The voice provider is optional until configured;
    // without it voice jobs fail with the designed "isn't set up" copy.
    ELEVENLABS_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    ELEVENLABS_MODEL_ID: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    ELEVENLABS_VOICE_IDS: z.preprocess(
      normalizeCommaSeparatedEnv,
      z
        .array(z.string().trim().min(1))
        .max(6, 'ELEVENLABS_VOICE_IDS allows at most 6 voices.')
        .default([]),
    ),
    FFMPEG_PATH: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('ffmpeg'),
    ),
    FFPROBE_PATH: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('ffprobe'),
    ),
    RENDER_TMP_DIR: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    VIDEO_BETA_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    // AI scene clips (MiniMax image-to-video). Optional until configured;
    // without a key the feature stays hidden and its jobs fail as "not set up".
    AI_CLIPS_ENABLED: z.preprocess(
      normalizeBooleanEnv,
      z.boolean().default(false),
    ),
    MINIMAX_API_KEY: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).optional(),
    ),
    MINIMAX_VIDEO_MODEL: z.preprocess(
      normalizeBlankEnv,
      z.string().trim().min(1).default('MiniMax-H3-Max'),
    ),
  })
  .superRefine((config, context) => {
    const requireConfig = (
      flag: 'TURNSTILE_ENABLED' | 'GOOGLE_OAUTH_ENABLED',
      keys: Array<keyof typeof config>,
    ) => {
      for (const key of keys) {
        const value = config[key];

        if (
          value === undefined ||
          (Array.isArray(value) && value.length === 0)
        ) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required when ${flag} is true.`,
          });
        }
      }
    };

    if (config.TURNSTILE_ENABLED) {
      requireConfig('TURNSTILE_ENABLED', ['CLOUDFLARE_TURNSTILE_SECRET_KEY']);
    }

    if (config.GOOGLE_OAUTH_ENABLED) {
      requireConfig('GOOGLE_OAUTH_ENABLED', ['GOOGLE_OAUTH_CLIENT_IDS']);
    }

    // A voice key without a model or allowlist would offer no usable voice.
    if (config.ELEVENLABS_API_KEY) {
      for (const key of [
        'ELEVENLABS_MODEL_ID',
        'ELEVENLABS_VOICE_IDS',
      ] as const) {
        const value = config[key];

        if (value === undefined || (Array.isArray(value) && !value.length)) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required when ELEVENLABS_API_KEY is set.`,
          });
        }
      }
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

/** Treats `KEY=` (blank) in an env file as unset. */
function normalizeBlankEnv(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
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
