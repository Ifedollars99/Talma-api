import 'dotenv/config'
import { z } from 'zod'

/**
 * Runtime configuration for the Talma API.
 *
 * Everything the process needs is validated once, at boot, so a missing or
 * malformed value fails fast instead of surfacing as a runtime error later.
 */
const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean' ? value : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()),
  )

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: csv,
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  REFRESH_COOKIE_NAME: z.string().default('talma_refresh'),
  REFRESH_COOKIE_SECURE: booleanish.default(false),
  REFRESH_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_REQUIRE_EMAIL_VERIFICATION: booleanish.default(false),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_ALLOWED_TYPES: csv,
  UPLOAD_MAX_MB: z.coerce.number().positive().default(25),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  // AI. With no OPENAI_API_KEY the assistant falls back to the free,
  // rate-limited Pollinations endpoint when FREE_AI_ENABLED is true.
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(8000).default(1600),
  // Set to false when the configured server model cannot read pictures.
  AI_VISION_ENABLED: booleanish.default(true),
  FREE_AI_ENABLED: booleanish.default(true),
  FREE_AI_BASE_URL: z.string().url().default('https://text.pollinations.ai/v1'),
  FREE_AI_MODEL: z.string().default('openai-fast'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n')
  console.error(`Invalid environment configuration:\n${details}`)
  process.exit(1)
}

const raw = parsed.data

const isProduction = raw.NODE_ENV === 'production'

/**
 * In test/production the secrets must differ; in development we fall back to a
 * deterministic pair so the API can boot without a hand-written .env file.
 */
if (isProduction && raw.JWT_ACCESS_SECRET === raw.JWT_REFRESH_SECRET) {
  console.error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different in production.')
  process.exit(1)
}

export const env = {
  ...raw,
  isProduction,
  isTest: raw.NODE_ENV === 'test',
  aiConfigured: raw.OPENAI_API_KEY.trim().length > 0,
  aiMode:
    raw.OPENAI_API_KEY.trim().length > 0
      ? ('server' as const)
      : raw.FREE_AI_ENABLED
        ? ('free' as const)
        : ('off' as const),
  corsOrigins:
    raw.CORS_ORIGINS.length > 0
      ? raw.CORS_ORIGINS
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  uploadAllowedTypes:
    raw.UPLOAD_ALLOWED_TYPES.length > 0
      ? raw.UPLOAD_ALLOWED_TYPES
      : [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'application/pdf',
        ],
} as const

export type Env = typeof env
