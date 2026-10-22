import type { NextFunction, Request, Response } from 'express'
import { type ZodTypeAny, z } from 'zod'
import { AppError } from '../errors/AppError.js'

/** Parsed, validated request payload attached to `req.body` / `req.query`. */
export interface ValidationSchemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Validates the incoming request against the given Zod schemas and replaces
 * the raw values with the parsed (coerced, stripped) ones.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
      }
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          AppError.unprocessable(
            'Validation failed',
            error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        )
        return
      }
      next(error)
    }
  }
}
