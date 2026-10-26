import type { CookieOptions, Request, Response } from 'express'
import { env } from '../../config/env.js'
import * as authService from './auth.service.js'
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.validation.js'

function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAMESITE,
    path: '/api/auth',
    maxAge: maxAgeMs,
  }
}

function requestMeta(req: Request): { userAgent?: string; ip?: string } {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ip: req.ip,
  }
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterInput
  const result = await authService.register(body, requestMeta(req))

  res.cookie(
    env.REFRESH_COOKIE_NAME,
    result.refreshToken,
    cookieOptions(result.refreshExpiresInDays * 24 * 60 * 60 * 1000),
  )

  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: env.JWT_ACCESS_TTL,
  })
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginInput
  const result = await authService.login(body, requestMeta(req))

  res.cookie(
    env.REFRESH_COOKIE_NAME,
    result.refreshToken,
    cookieOptions(result.refreshExpiresInDays * 24 * 60 * 60 * 1000),
  )

  res.json({
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: env.JWT_ACCESS_TTL,
  })
}

/** POST /api/auth/refresh */
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[env.REFRESH_COOKIE_NAME]
  if (!token) {
    // "No session" is a normal state, not an error — answering with 200 keeps
    // the browser console free of spurious 401s on public pages.
    res.json({ authenticated: false })
    return
  }

  const result = await authService.refresh(token, requestMeta(req))

  res.cookie(
    env.REFRESH_COOKIE_NAME,
    result.refreshToken,
    cookieOptions(result.refreshExpiresInDays * 24 * 60 * 60 * 1000),
  )

  res.json({
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: env.JWT_ACCESS_TTL,
  })
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.cookies?.[env.REFRESH_COOKIE_NAME])
  res.clearCookie(env.REFRESH_COOKIE_NAME, { ...cookieOptions(0), maxAge: undefined })
  res.status(204).send()
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.userId as string)
  res.json({ user })
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const body = req.body as ForgotPasswordInput
  const result = await authService.requestPasswordReset(body.email)

  res.json({
    message: 'If an account exists for that email, a reset link has been sent.',
    // Development/testing only: keep the flow testable without a mail provider.
    ...(!env.isProduction && result.resetToken ? { resetToken: result.resetToken } : {}),
  })
}

/** POST /api/auth/reset-password */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const body = req.body as ResetPasswordInput
  await authService.resetPassword(body.token, body.password)
  res.json({ message: 'Your password has been updated. You can sign in now.' })
}

/** POST /api/auth/verify-email */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const body = req.body as VerifyEmailInput
  const user = await authService.verifyEmail(body.token)
  res.json({ user, message: 'Your email address has been verified.' })
}
