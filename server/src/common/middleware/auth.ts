import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js'
import { env } from '../../config/env.js'
import { UserModel, type UserRole } from '../../modules/users/user.model.js'
import { CreatorProfileModel } from '../../modules/creators/creator.model.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` for downstream handlers. */
      auth?: AccessTokenPayload
      /** The authenticated user's database id. */
      userId?: string
      /** Populated by `requireCreator` for approved creators. */
      creator?: {
        id: string
        userId: string
        sharePercent: number
        paystackSubaccountCode?: string
      }
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

/**
 * Restricts a route to verified creators. A creator is verified either through
 * the email-code flow (`User.creatorStatus === 'approved'`) or by having an
 * approved payout profile. Administrators pass through as platform owners.
 */
export const requireCreator: RequestHandler = async (req, _res, next) => {
  try {
    if (req.auth?.role === 'admin') {
      next()
      return
    }

    if (!req.userId) {
      throw AppError.unauthorized('Authentication required')
    }

    const user = await UserModel.findById(req.userId)
      .select('_id username creatorStatus')
      .lean()
    if (!user || user.creatorStatus !== 'approved') {
      throw AppError.forbidden(
        'Only approved creators can upload videos. Verify your account to become a creator.',
      )
    }

    const profile = await CreatorProfileModel.findOne({
      user: req.userId,
      status: 'approved',
    }).lean()

    req.creator = {
      id: profile ? String(profile._id) : req.userId,
      userId: req.userId,
      sharePercent: profile ? profile.sharePercent : env.creatorSharePercent,
      ...(profile?.paystackSubaccountCode
        ? { paystackSubaccountCode: profile.paystackSubaccountCode }
        : {}),
    }
    next()
  } catch (error) {
    next(error)
  }
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
