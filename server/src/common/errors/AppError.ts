/**
 * Application error with an HTTP status code and a stable machine-readable code.
 * Everything thrown deliberately inside the API should extend this class so the
 * centralised error handler can render it consistently.
 */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown
  readonly isOperational = true

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace?.(this, AppError)
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details)
  }

  static unauthorized(message = 'Authentication required', details?: unknown): AppError {
    return new AppError(401, 'UNAUTHORIZED', message, details)
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message)
  }

  static conflict(message = 'Resource already exists', details?: unknown): AppError {
    return new AppError(409, 'CONFLICT', message, details)
  }

  static unprocessable(message = 'Validation failed', details?: unknown): AppError {
    return new AppError(422, 'VALIDATION_ERROR', message, details)
  }

  static tooManyRequests(message = 'Too many requests, please try again later'): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message)
  }

  /** The request is valid, but the caller has not paid for the resource yet. */
  static paymentRequired(message = 'Payment required'): AppError {
    return new AppError(402, 'PAYMENT_REQUIRED', message)
  }

  /** An upstream provider (for example Paystack) is not available. */
  static badGateway(message = 'An upstream service is unavailable'): AppError {
    return new AppError(502, 'BAD_GATEWAY', message)
  }

  /** A required integration has not been configured on this deployment. */
  static serviceUnavailable(message = 'This service is not available right now'): AppError {
    return new AppError(503, 'SERVICE_UNAVAILABLE', message)
  }

  static internal(message = 'Something went wrong'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message)
  }
}
