import pino from 'pino'
import { env } from './env.js'

/**
 * Structured application logger. `pino-http` reuses the same shape so request
 * logs and application logs can be correlated by `reqId`.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'talma-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
    ],
    censor: '[redacted]',
  },
  })

export type Logger = typeof logger
