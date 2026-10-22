import crypto from 'node:crypto'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { AppError } from '../errors/AppError.js'

export interface AccessTokenPayload extends JwtPayload {
  sub: string
  username: string
  role: 'student' | 'lecturer' | 'admin'
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string
  sid: string
}
const ACCESS_ISSUER = 'talma'
const REFRESH_ISSUER = 'talma'

/** Signs a short-lived access token for the given user. */
export function signAccessToken(input: {
  userId: string
  username: string
  role: AccessTokenPayload['role']
}): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    issuer: ACCESS_ISSUER,
    subject: input.userId,
  }
  return jwt.sign({ username: input.username, role: input.role }, env.JWT_ACCESS_SECRET, options)
}

/** Signs a refresh token bound to a specific stored session id. */
export function signRefreshToken(input: { userId: string; sessionId: string }): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'],
    issuer: REFRESH_ISSUER,
    subject: input.userId,
  }
  // The random `jti` makes every issued token unique, which is what allows
  // rotation to be detected when an old token is replayed.
  return jwt.sign(
    { sid: input.sessionId, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    options,
  )
}

/** Verifies an access token, throwing a 401 when it is invalid or expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ACCESS_ISSUER })
    if (typeof payload === 'string' || !payload.sub) {
      throw AppError.unauthorized('Invalid access token')
    }
    return payload as AccessTokenPayload
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.unauthorized('Invalid or expired access token')
  }
}

/** Verifies a refresh token, throwing a 401 when it is invalid or expired. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: REFRESH_ISSUER })
    if (typeof payload === 'string' || !payload.sub || !payload.sid) {
      throw AppError.unauthorized('Invalid refresh token')
    }
    return payload as RefreshTokenPayload
  } catch (error) {
    if (error instanceof AppError) throw error
    throw AppError.unauthorized('Invalid or expired refresh token')
  }
}

/** Creates an opaque, high-entropy token (used for email verification / password reset). */
export function createOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/** Constant-time comparison for opaque tokens. */
export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

/** SHA-256 hash — used to store opaque tokens so the raw value never persists. */
export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
