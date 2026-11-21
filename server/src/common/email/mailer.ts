import { Resend } from 'resend'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import {
  creatorVerificationEmail,
  creatorWelcomeEmail,
  passwordResetEmail,
  type RenderedEmail,
} from './templates.js'

export interface SendMailInput {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}

export interface MailResult {
  delivered: boolean
  provider: 'resend' | 'brevo' | 'gmail' | 'smtp' | 'ethereal' | 'console'
  id?: string
  /** Ethereal only: a private web page showing the delivered test message. */
  previewUrl?: string
  /** Human-readable reason when the provider refused the message. */
  error?: string
}

type Provider = MailResult['provider']

/**
 * Signals to inbox providers that this is automated transactional mail, not
 * bulk marketing. Gmail, Outlook and others use these headers when scoring.
 */
const TRANSACTIONAL_HEADERS = {
  'Auto-Submitted': 'auto-generated',
  'X-Auto-Response-Suppress': 'All',
} as const

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

let resendClient: Resend | null = null
let smtpTransport: Transporter | null = null
let etherealTransport: Transporter | null = null
let gmailToken: { accessToken: string; expiresAt: number } | null = null

/** Which provider the API will use for the next email. */
export function getEmailProvider(): Provider {
  if (env.EMAIL_PROVIDER === 'resend') {
    if (env.RESEND_API_KEY.trim()) return 'resend'
    logger.warn('EMAIL_PROVIDER is "resend" but RESEND_API_KEY is empty. Falling back to console.')
    return 'console'
  }

  if (env.EMAIL_PROVIDER === 'brevo') {
    if (env.BREVO_API_KEY.trim()) return 'brevo'
    logger.warn('EMAIL_PROVIDER is "brevo" but BREVO_API_KEY is empty. Falling back to console.')
    return 'console'
  }

  if (env.EMAIL_PROVIDER === 'gmail') {
    if (env.gmailConfigured) return 'gmail'
    logger.warn(
      'EMAIL_PROVIDER is "gmail" but YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET or GMAIL_REFRESH_TOKEN is missing. Falling back to console.',
    )
    return 'console'
  }

  if (env.EMAIL_PROVIDER === 'smtp') {
    if (env.SMTP_HOST.trim()) return 'smtp'
    logger.warn('EMAIL_PROVIDER is "smtp" but SMTP_HOST is empty. Falling back to console.')
    return 'console'
  }

  if (env.EMAIL_PROVIDER === 'console') return 'console'
  return env.emailProvider
}

/**
 * Creates a throwaway Ethereal SMTP inbox when no production provider is
 * configured in development. Messages are real emails captured by Ethereal,
 * with a preview URL written to the server log.
 */
async function getEtherealTransport(): Promise<Transporter> {
  if (!etherealTransport) {
    const account = await nodemailer.createTestAccount()
    etherealTransport = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    })
    logger.info(
      { user: account.user, host: account.smtp.host },
      'Created a development Ethereal email inbox',
    )
  }
  return etherealTransport
}

/** Useful for health checks and the local email-test script. */
export function getEmailStatus(): {
  provider: Provider
  configured: boolean
  from: string
  replyTo?: string
  /** Safe next step when no provider is configured. */
  hint?: string
} {
  const provider = getEmailProvider()
  return {
    provider,
    configured: provider !== 'console',
    from: env.MAIL_FROM,
    ...(env.MAIL_REPLY_TO.trim() ? { replyTo: env.MAIL_REPLY_TO } : {}),
    ...(provider === 'console'
      ? {
          hint: 'No email provider is configured. Set GMAIL_REFRESH_TOKEN (works on Render free), BREVO_API_KEY, RESEND_API_KEY or SMTP_HOST.',
        }
      : {}),
  }
}

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY)
  }
  return resendClient
}

function getSmtpTransport(): Transporter {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      // Fail in seconds instead of hanging when a host blocks SMTP ports
      // (Render's free tier, Railway, etc.).
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
      ...(env.SMTP_USER.trim()
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
        : {}),
    })
  }
  return smtpTransport
}

/** Splits `Talma <hello@example.com>` into a Brevo sender object. */
function parseMailAddress(value: string): { email: string; name?: string } {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*?)\s*<([^>]+)>\s*$/)
  const email = match?.[2]?.trim()
  if (match && email) {
    const name = (match[1] ?? '').replace(/^["']|["']$/g, '').trim()
    return { email, ...(name ? { name } : {}) }
  }
  return { email: trimmed }
}

/**
 * Brevo transactional email API. Unlike SMTP, this travels over HTTPS on port
 * 443, so it works on hosts that block outbound mail ports.
 */
async function sendWithBrevo(input: SendMailInput): Promise<MailResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const sender = parseMailAddress(env.MAIL_FROM)
    const replyTo = (input.replyTo ?? env.MAIL_REPLY_TO).trim()

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY.trim(),
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html ?? input.text,
        textContent: input.text,
        headers: { ...TRANSACTIONAL_HEADERS },
        ...(replyTo ? { replyTo: parseMailAddress(replyTo) } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const raw = await response.text().catch(() => '')
      let message = `Brevo rejected the email (HTTP ${response.status})`
      try {
        const parsed = JSON.parse(raw) as { message?: string; code?: string }
        if (parsed.message) message = parsed.message
      } catch {
        if (raw.trim()) message = raw.trim().slice(0, 300)
      }
      logger.error(
        { status: response.status, message, to: input.to, subject: input.subject },
        'Brevo rejected the email',
      )
      return { delivered: false, provider: 'brevo', error: message }
    }

    const data = (await response.json().catch(() => null)) as
      | { messageId?: string }
      | null

    return {
      delivered: true,
      provider: 'brevo',
      ...(data?.messageId ? { id: data.messageId } : {}),
    }
  } finally {
    clearTimeout(timeout)
  }
}

/** Caches a short-lived Gmail API access token minted from the refresh token. */
async function getGmailAccessToken(): Promise<string> {
  if (gmailToken && gmailToken.expiresAt > Date.now() + 30_000) {
    return gmailToken.accessToken
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  })

  const payload = (await response.json().catch(() => null)) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  } | null

  if (!response.ok || !payload?.access_token) {
    const message =
      payload?.error_description ??
      payload?.error ??
      `Google rejected the Gmail token (HTTP ${response.status})`
    throw new Error(message)
  }

  gmailToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  }
  return gmailToken.accessToken
}

/**
 * Sends through the Gmail API over HTTPS. This is the best free option on
 * hosts that block SMTP: it uses the same Google OAuth client as YouTube and
 * sends as the real Gmail account, so SPF, DKIM and DMARC all align.
 *
 * Nodemailer's stream transport is used only to build the RFC 2822 message;
 * the request itself goes to `gmail.googleapis.com`.
 */
async function sendWithGmail(input: SendMailInput): Promise<MailResult> {
  const accessToken = await getGmailAccessToken()

  const builder = nodemailer.createTransport({ streamTransport: true, buffer: true })
  const built = (await builder.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    headers: { ...TRANSACTIONAL_HEADERS },
    ...(input.replyTo ?? env.MAIL_REPLY_TO.trim()
      ? { replyTo: input.replyTo ?? env.MAIL_REPLY_TO }
      : {}),
  })) as { message?: Buffer | string }

  const raw = Buffer.isBuffer(built.message)
    ? built.message
    : Buffer.from(String(built.message ?? ''))

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ raw: raw.toString('base64url') }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const rawError = await response.text().catch(() => '')
    let message = `Gmail rejected the email (HTTP ${response.status})`
    try {
      const parsed = JSON.parse(rawError) as { error?: { message?: string } }
      if (parsed.error?.message) message = parsed.error.message
    } catch {
      if (rawError.trim()) message = rawError.trim().slice(0, 300)
    }
    logger.error(
      { status: response.status, message, to: input.to, subject: input.subject },
      'Gmail rejected the email',
    )
    return { delivered: false, provider: 'gmail', error: message }
  }

  const data = (await response.json().catch(() => null)) as { id?: string } | null

  return {
    delivered: true,
    provider: 'gmail',
    ...(data?.id ? { id: data.id } : {}),
  }
}

async function sendWithResend(input: SendMailInput): Promise<MailResult> {
  const { data, error } = await getResendClient().emails.send({
    from: env.MAIL_FROM,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    headers: { ...TRANSACTIONAL_HEADERS },
    ...(input.replyTo ?? env.MAIL_REPLY_TO.trim()
      ? { replyTo: input.replyTo ?? env.MAIL_REPLY_TO }
      : {}),
  })

  if (error) {
    logger.error({ error, to: input.to, subject: input.subject }, 'Resend rejected the email')
    return {
      delivered: false,
      provider: 'resend',
      error: error.message || 'Resend rejected the email',
    }
  }

  return {
    delivered: true,
    provider: 'resend',
    ...(data?.id ? { id: data.id } : {}),
  }
}

async function sendWithSmtp(input: SendMailInput): Promise<MailResult> {
  const info = await getSmtpTransport().sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    headers: { ...TRANSACTIONAL_HEADERS },
    ...(input.replyTo ?? env.MAIL_REPLY_TO.trim()
      ? { replyTo: input.replyTo ?? env.MAIL_REPLY_TO }
      : {}),
  })

  return {
    delivered: true,
    provider: 'smtp',
    ...(info.messageId ? { id: info.messageId } : {}),
  }
}

async function sendWithEthereal(input: SendMailInput): Promise<MailResult> {
  const transport = await getEtherealTransport()
  const info = await transport.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
    headers: { ...TRANSACTIONAL_HEADERS },
    ...(input.replyTo ?? env.MAIL_REPLY_TO.trim()
      ? { replyTo: input.replyTo ?? env.MAIL_REPLY_TO }
      : {}),
  })

  const preview = nodemailer.getTestMessageUrl(info)
  const previewUrl = typeof preview === 'string' && preview ? preview : undefined

  if (previewUrl) {
    logger.info({ to: input.to, subject: input.subject, previewUrl }, 'Ethereal email preview ready')
  }

  return {
    delivered: true,
    provider: 'ethereal',
    ...(info.messageId ? { id: info.messageId } : {}),
    ...(previewUrl ? { previewUrl } : {}),
  }
}

/**
 * Sends a transactional email through Resend, Brevo, the Gmail API, SMTP, or
 * the local console.
 *
 * The console provider is intentionally useful in development: verification
 * codes are logged and still returned to the app so the flow can be tested
 * without a mail account. In production, configure a real provider.
 */
export async function sendMail(input: SendMailInput): Promise<MailResult> {
  const provider = getEmailProvider()

  if (provider === 'console') {
    if (env.isProduction) {
      logger.error(
        { to: input.to, subject: input.subject },
        'No email provider is configured. Set GMAIL_REFRESH_TOKEN, BREVO_API_KEY, RESEND_API_KEY or SMTP_HOST before going live.',
      )
      return { delivered: false, provider }
    }

    logger.info(
      { to: input.to, subject: input.subject, provider },
      `No email provider configured — email body:\n${input.text}`,
    )
    return { delivered: false, provider }
  }

  try {
    if (provider === 'resend') return await sendWithResend(input)
    if (provider === 'brevo') return await sendWithBrevo(input)
    if (provider === 'gmail') return await sendWithGmail(input)
    if (provider === 'smtp') return await sendWithSmtp(input)
    return await sendWithEthereal(input)
  } catch (caught) {
    let error = caught

    // The Ethereal test SMTP service occasionally misses its greeting on the
    // first connection. One retry keeps the local flow reliable.
    if (provider === 'ethereal') {
      logger.warn({ err: caught }, 'Ethereal send failed; retrying once')
      try {
        return await sendWithEthereal(input)
      } catch (retryError) {
        error = retryError
      }
    }

    logger.error(
      { err: error, provider, to: input.to, subject: input.subject },
      'Could not send email',
    )

    const message =
      error instanceof Error && error.name === 'AbortError'
        ? `${provider} did not respond within 15 seconds`
        : error instanceof Error
          ? error.message
          : undefined

    return {
      delivered: false,
      provider,
      ...(message ? { error: message } : {}),
    }
  }
}

async function sendRendered(to: string, email: RenderedEmail): Promise<MailResult> {
  return sendMail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })
}

/** Sends the six-digit creator verification code. */
export async function sendCreatorVerificationEmail(
  email: string,
  username: string,
  code: string,
): Promise<MailResult> {
  return sendRendered(email, creatorVerificationEmail({ username, code, expiresMinutes: 10 }))
}

/** Confirms the upgrade and points the creator at their new tools. */
export async function sendCreatorWelcomeEmail(
  email: string,
  username: string,
  profileUrl: string,
): Promise<MailResult> {
  return sendRendered(email, creatorWelcomeEmail({ username, profileUrl }))
}

/** Sends the account-recovery link. */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetUrl: string,
): Promise<MailResult> {
  return sendRendered(email, passwordResetEmail({ username, resetUrl, expiresMinutes: 60 }))
}
