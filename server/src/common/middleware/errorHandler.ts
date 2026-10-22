import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError.js'
import { logger } from '../../config/logger.js'
import { env } from '../../config/env.js'

/** Shape of every error response produced by the API. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
    stack?: string
  }
}

/**
 * Terminal error handler. Converts known error types into a consistent JSON
 * envelope and never leaks internals in production.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Something went wrong'
  let details: unknown
  let stack: string | undefined

  if (err instanceof AppError) {
    statusCode = err.statusCode
    code = err.code
    message = err.message
    details = err.details
    stack = err.stack
  } else if (err instanceof ZodError) {
    statusCode = 422
    code = 'VALIDATION_ERROR'
    message = 'Validation failed'
    details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
  } else if (err instanceof Error) {
    message = err.message
    stack = err.stack
    // Surface duplicate-key errors from MongoDB as a 409 rather than a 500.
    if ('code' in err && (err as { code?: unknown }).code === 11000) {
      statusCode = 409
      code = 'CONFLICT'
      message = 'That record already exists'
    }
  }

  if (statusCode >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled error while serving request')
  } else {
    logger.warn({ code, message, reqId: req.id }, 'Request rejected')
  }

  const body: ApiErrorBody = {
    error: {
      code,
      message: statusCode >= 500 && env.isProduction ? 'Something went wrong' : message,
      ...(details !== undefined ? { details } : {}),
      ...(!env.isProduction && stack ? { stack } : {}),
    },
  }

  res.status(statusCode).json(body)
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist`,
    },
  } satisfies ApiErrorBody)
}

/** Wraps an async route handler so rejected promises reach the error handler. */
export function asyncHandler<T extends RequestHandler>(handler: T): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
