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
  provider: 'resend' | 'smtp' | 'ethereal' | 'console'
  id?: string
  /** Ethereal only: a private web page showing the delivered test message. */
  previewUrl?: string
  /** Human-readable reason when the provider refused the message. */
  error?: string
}

type Provider = MailResult['provider']

let resendClient: Resend | null = null
let smtpTransport: Transporter | null = null
let etherealTransport: Transporter | null = null

/** Which provider the API will use for the next email. */
export function getEmailProvider(): Provider {
  if (env.EMAIL_PROVIDER === 'resend') {
    if (env.RESEND_API_KEY.trim()) return 'resend'
    logger.warn('EMAIL_PROVIDER is "resend" but RESEND_API_KEY is empty. Falling back to console.')
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
} {
  const provider = getEmailProvider()
  return {
    provider,
    configured: provider !== 'console',
    from: env.MAIL_FROM,
    ...(env.MAIL_REPLY_TO.trim() ? { replyTo: env.MAIL_REPLY_TO } : {}),
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
      ...(env.SMTP_USER.trim()
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
        : {}),
    })
  }
  return smtpTransport
}

async function sendWithResend(input: SendMailInput): Promise<MailResult> {
  const { data, error } = await getResendClient().emails.send({
    from: env.MAIL_FROM,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
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
 * Sends a transactional email through Resend, SMTP, or the local console.
 *
 * The console provider is intentionally useful in development: verification
 * codes are logged and still returned to the app so the flow can be tested
 * without a mail account. In production, configure Resend or SMTP.
 */
export async function sendMail(input: SendMailInput): Promise<MailResult> {
  const provider = getEmailProvider()

  if (provider === 'console') {
    if (env.isProduction) {
      logger.error(
        { to: input.to, subject: input.subject },
        'No email provider is configured. Set RESEND_API_KEY or SMTP_HOST before going live.',
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
    return {
      delivered: false,
      provider,
      ...(error instanceof Error ? { error: error.message } : {}),
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
