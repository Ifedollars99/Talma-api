import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../common/errors/AppError.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/jwt.js'
import { hashPassword, verifyPassword } from '../../common/utils/password.js'
import { UserModel, toPublicUser, type PublicUser, type User } from '../users/user.model.js'
import { RefreshSessionModel } from './refreshSession.model.js'
import type { RegisterInput } from './auth.validation.js'

export interface AuthResult {
  user: PublicUser
  accessToken: string
  refreshToken: string
  /** Days the refresh token stays valid — mirrors the configured TTL. */
  refreshExpiresInDays: number
}

const REFRESH_TTL_DAYS = 30

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * A throw-away hash used to keep the "unknown email" branch of `login` as slow
 * as the "wrong password" branch, so the endpoint cannot be used to discover
 * which email addresses have accounts.
 */
let dummyHashPromise: Promise<string> | null = null
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(crypto.randomBytes(24).toString('hex'))
  return dummyHashPromise
}

/** Creates a brand new refresh session (first sign-in or registration). */
async function createSession(
  user: User,
  meta: { userAgent?: string; ip?: string },
): Promise<string> {
  const session = await RefreshSessionModel.create({
    user: user._id,
    tokenHash: 'pending',
    familyId: crypto.randomUUID(),
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: refreshExpiry(),
  })

  const refreshToken = signRefreshToken({ userId: String(user._id), sessionId: String(session._id) })
  session.tokenHash = hashOpaqueToken(refreshToken)
  await session.save()

  return refreshToken
}

/** Issues an access token for the given user document. */
function issueAccessToken(user: User): string {
  return signAccessToken({
    userId: String(user._id),
    username: user.username,
    role: user.role,
  })
}

/**
 * Registers a new student or lecturer.
 *
 * The refresh token is returned in the response body; the HTTP layer moves it
 * into an HttpOnly cookie so it never reaches JavaScript.
 */
export async function register(
  input: RegisterInput,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<AuthResult> {
  const existingEmail = await UserModel.findOne({ email: input.email }).select('_id').lean()
  if (existingEmail) {
    throw AppError.conflict('An account with that email already exists')
  }

  const usernameNormalized = input.username.toLowerCase()
  const existingUsername = await UserModel.findOne({ usernameNormalized }).select('_id').lean()
  if (existingUsername) {
    throw AppError.conflict('That username is already taken')
  }

  const user = await UserModel.create({
    email: input.email,
    username: input.username,
    usernameNormalized,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    emailVerified: !env.AUTH_REQUIRE_EMAIL_VERIFICATION,
  })

  const refreshToken = await createSession(user, meta)

  return {
    user: toPublicUser(user),
    accessToken: issueAccessToken(user),
    refreshToken,
    refreshExpiresInDays: REFRESH_TTL_DAYS,
  }
}

/** Signs a user in with email + password. */
export async function login(
  input: { email: string; password: string },
  meta: { userAgent?: string; ip?: string } = {},
): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash')

  if (!user) {
    await verifyPassword(await getDummyHash(), input.password)
    throw AppError.unauthorized('Incorrect email or password')
  }

  const valid = await verifyPassword(user.passwordHash, input.password)
  if (!valid) {
    throw AppError.unauthorized('Incorrect email or password')
  }

  if (env.AUTH_REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
    throw AppError.forbidden('Please verify your email address before signing in')
  }

  user.lastLoginAt = new Date()
  await user.save()

  const refreshToken = await createSession(user, meta)

  return {
    user: toPublicUser(user),
    accessToken: issueAccessToken(user),
    refreshToken,
    refreshExpiresInDays: REFRESH_TTL_DAYS,
  }
}

/**
 * Rotates a refresh token.
 *
 * The session id stays stable for the lifetime of the session; only the token
 * hash changes. Presenting a token that no longer matches the stored hash means
 * the token was replayed, so the whole session family is revoked.
 */
export async function refresh(
  refreshToken: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken)

  const session = await RefreshSessionModel.findById(payload.sid)
  if (!session) {
    throw AppError.unauthorized('Session not found, please sign in again')
  }

  if (session.revokedAt) {
    await RefreshSessionModel.updateMany(
      { familyId: session.familyId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    )
    logger.warn({ userId: payload.sub }, 'Revoked refresh token used — session family revoked')
    throw AppError.unauthorized('Session expired, please sign in again')
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized('Session expired, please sign in again')
  }

  const presentedHash = hashOpaqueToken(refreshToken)
  if (presentedHash !== session.tokenHash) {
    // The token was already rotated — treat it as a replay attempt.
    await RefreshSessionModel.updateMany(
      { familyId: session.familyId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    )
    logger.warn({ userId: payload.sub }, 'Refresh token reuse detected — session family revoked')
    throw AppError.unauthorized('Session expired, please sign in again')
  }

  const user = await UserModel.findById(payload.sub)
  if (!user) {
    throw AppError.unauthorized('Account no longer exists')
  }

  const nextToken = signRefreshToken({
    userId: String(user._id),
    sessionId: String(session._id),
  })

  session.tokenHash = hashOpaqueToken(nextToken)
  session.expiresAt = refreshExpiry()
  session.userAgent = meta.userAgent ?? session.userAgent
  session.ip = meta.ip ?? session.ip
  await session.save()

  return {
    user: toPublicUser(user),
    accessToken: issueAccessToken(user),
    refreshToken: nextToken,
    refreshExpiresInDays: REFRESH_TTL_DAYS,
  }
}

/** Revokes every active session for a user (sign out). */
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    // Signing out with an invalid token is not an error — the goal is "no session".
    return
  }

  await RefreshSessionModel.updateMany(
    { user: payload.sub, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  )
}

/** Returns the public profile of the authenticated user. */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw AppError.notFound('Account not found')
  }
  return toPublicUser(user)
}

/**
 * Starts the password-reset flow.
 *
 * No mail transport is configured for local development, so the raw token is
 * returned in the response (and logged) instead of being emailed. Configure a
 * mailer before deploying.
 */
export async function requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
  const user = await UserModel.findOne({ email }).select(
    '+passwordResetTokenHash +passwordResetExpires',
  )
  if (!user) {
    // Always report success so the endpoint cannot be used to discover accounts.
    return {}
  }

  const token = createOpaqueToken()
  user.passwordResetTokenHash = hashOpaqueToken(token)
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
  await user.save()

  logger.info({ email }, `Password reset requested. Reset token: ${token}`)

  return { resetToken: token }
}

/** Completes the password-reset flow. */
export async function resetPassword(token: string, password: string): Promise<void> {
  const tokenHash = hashOpaqueToken(token)
  const user = await UserModel.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpires',
  )

  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() <= Date.now()) {
    throw AppError.badRequest('This reset link is invalid or has expired')
  }

  user.passwordHash = await hashPassword(password)
  user.passwordResetTokenHash = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Force every existing session to sign in again with the new password.
  await RefreshSessionModel.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  )
}

/** Confirms an email address from the verification token. */
export async function verifyEmail(token: string): Promise<PublicUser> {
  const tokenHash = hashOpaqueToken(token)
  const user = await UserModel.findOne({ emailVerificationTokenHash: tokenHash }).select(
    '+emailVerificationTokenHash +emailVerificationExpires',
  )

  if (
    !user ||
    !user.emailVerificationExpires ||
    user.emailVerificationExpires.getTime() <= Date.now()
  ) {
    throw AppError.badRequest('This verification link is invalid or has expired')
  }

  user.emailVerified = true
  user.emailVerificationTokenHash = undefined
  user.emailVerificationExpires = undefined
  await user.save()

  return toPublicUser(user)
}
