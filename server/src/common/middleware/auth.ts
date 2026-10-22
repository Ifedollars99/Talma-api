import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js'
import { UserModel, type UserRole } from '../../modules/users/user.model.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` for downstream handlers. */
      auth?: AccessTokenPayload
      /** The authenticated user's database id. */
      userId?: string
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token.trim()
}

/**
 * Requires a valid access token. The token is verified cryptographically and
 * the matching user must still exist (and not be deleted).
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      throw AppError.unauthorized('Authentication required')
    }

    const payload = verifyAccessToken(token)
    const user = await UserModel.findById(payload.sub).select('_id role emailVerified').lean()

    if (!user) {
      throw AppError.unauthorized('Account no longer exists')
    }

    req.auth = payload
    req.userId = String(user._id)
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Attaches the user when a token is present, but never rejects the request.
 * Used by endpoints that behave differently for signed-in visitors.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req)
  if (!token) {
    next()
    return
  }
  try {
    const payload = verifyAccessToken(token)
    const user = await UserModel.findById(payload.sub).select('_id').lean()
    if (user) {
      req.auth = payload
      req.userId = String(user._id)
    }
  } catch {
    // An invalid token on an optional route is simply ignored.
  }
  next()
}

/** Restricts a route to the listed roles. Must run after `requireAuth`. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.role
    if (!role) {
      next(AppError.unauthorized('Authentication required'))
      return
    }
    if (!roles.includes(role)) {
      next(AppError.forbidden('You do not have permission to perform this action'))
      return
    }
    next()
  }
}
