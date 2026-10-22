import rateLimit from 'express-rate-limit'
import { env } from '../../config/env.js'

const jsonMessage = (message: string) => ({ error: { code: 'TOO_MANY_REQUESTS', message } })

/** Baseline limiter applied to every API route. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 600 : 5_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please slow down'),
})

/** Stricter limiter for credential endpoints (login / register / reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 20 : 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: jsonMessage('Too many attempts, please try again in a few minutes'),
})

/** Limiter for AI chat requests. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isProduction ? 20 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('You are sending messages too quickly — take a breath and try again.'),
})

/** Limiter for write operations that create content. */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isProduction ? 60 : 1_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('You are posting too quickly, please wait a moment'),
})
