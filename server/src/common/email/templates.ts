import { env } from '../../config/env.js'

const BRAND = {
  ink: '#0a0a0a',
  body: '#4d554d',
  muted: '#7b857b',
  line: '#e6e9e6',
  canvas: '#f4f6f4',
  surface: '#ffffff',
  gold: '#f5c842',
  goldDeep: '#8a6d00',
  goldSoft: '#fdf5d7',
  green: '#3a8f4d',
  greenSoft: '#edf4dc',
} as const

type EmailButton = {
  label: string
  href: string
}

interface LayoutOptions {
  /** Hidden preview text shown next to the subject in most inboxes. */
  preheader: string
  eyebrow?: string
  heading: string
  intro: string
  content?: string
  button?: EmailButton
  footnote?: string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function appUrl(path = ''): string {
  const base = env.CLIENT_APP_URL.replace(/\/$/, '')
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base
}

function buttonMarkup(button: EmailButton): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0">
      <tr>
        <td style="border-radius:12px;background:${BRAND.ink}">
          <a href="${escapeHtml(button.href)}" target="_blank"
             style="display:inline-block;padding:14px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px">
            ${escapeHtml(button.label)}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Shared, table-based email shell. It deliberately uses inline styles and no
 * external images so it renders consistently in Gmail, Outlook, Apple Mail and
 * mobile clients.
 */
function renderLayout(options: LayoutOptions): string {
  const year = new Date().getFullYear()
  const preview = escapeHtml(options.preheader)
  const eyebrow = options.eyebrow ? escapeHtml(options.eyebrow) : ''
  const footnote = options.footnote ? escapeHtml(options.footnote) : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>Talma</title>
    <!--[if mso]>
      <style>table,td{font-family:Arial,sans-serif!important}</style>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">
      ${preview}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.canvas}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px">
            <tr>
              <td style="border-radius:20px;overflow:hidden;background:${BRAND.surface};border:1px solid ${BRAND.line};box-shadow:0 12px 32px rgba(10,10,10,0.06)">
                <!-- Brand bar -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.ink}">
                  <tr>
                    <td style="padding:22px 32px">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td width="38" height="38" align="center" valign="middle" style="width:38px;height:38px;border-radius:10px;background:${BRAND.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:20px;font-weight:800;color:${BRAND.ink}">
                            T
                          </td>
                          <td style="padding-left:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
                            <div style="font-size:19px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;line-height:20px">Talma</div>
                            <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.55);line-height:14px;padding-top:3px">Learn. Create. Grow.</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:40px 40px 36px">
                      ${
                        eyebrow
                          ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.goldDeep};padding-bottom:12px">${eyebrow}</div>`
                          : ''
                      }
                      <h1 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:28px;line-height:36px;font-weight:700;letter-spacing:-0.03em;color:${BRAND.ink}">
                        ${escapeHtml(options.heading)}
                      </h1>
                      <p style="margin:14px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:26px;color:${BRAND.body}">
                        ${escapeHtml(options.intro)}
                      </p>
                      ${options.content ?? ''}
                      ${options.button ? buttonMarkup(options.button) : ''}
                      ${
                        footnote
                          ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid ${BRAND.line};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:21px;color:${BRAND.muted}">${footnote}</div>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:22px 18px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:19px;color:${BRAND.muted}">
                <div style="font-weight:600;color:${BRAND.body}">Talma · Social learning for African students</div>
                <div style="padding-top:6px">
                  You received this email because of activity on your Talma account.
                </div>
                <div style="padding-top:10px">
                  <a href="${escapeHtml(appUrl('/'))}" target="_blank" style="color:${BRAND.goldDeep};text-decoration:none;font-weight:600">Visit Talma</a>
                  <span style="color:#c6cec6;padding:0 8px">·</span>
                  <span>&copy; ${year} Talma</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

/** The six-digit creator verification email. */
export function creatorVerificationEmail(input: {
  username: string
  code: string
  expiresMinutes?: number
}): RenderedEmail {
  const username = input.username.trim()
  const expiresMinutes = input.expiresMinutes ?? 10
  const safeCode = escapeHtml(input.code)

  const html = renderLayout({
    preheader: `Your Talma verification code is ${input.code}. It expires in ${expiresMinutes} minutes.`,
    eyebrow: 'Creator verification',
    heading: 'Confirm your creator account',
    intro: `Hi ${username}, enter this code in the Talma app to verify your account and unlock video and media uploads.`,
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 0">
        <tr>
          <td align="center" style="border-radius:16px;background:${BRAND.ink};padding:24px 18px">
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);padding-bottom:10px">
              Your verification code
            </div>
            <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;line-height:44px;font-weight:700;letter-spacing:10px;color:${BRAND.gold};padding-left:10px">
              ${safeCode}
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0">
        <tr>
          <td style="border-left:3px solid ${BRAND.gold};border-radius:0 12px 12px 0;background:${BRAND.goldSoft};padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:22px;color:#6b5400">
            <strong>This code expires in ${expiresMinutes} minutes.</strong>
            For your security, never share it with anyone. Talma will never ask you for this code outside the app.
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
        Open Talma, go to the verification screen and enter the six digits above. If you did not request this, you can safely ignore this email — your account will remain unchanged.
      </p>
    `,
    button: {
      label: 'Open Talma',
      href: appUrl('/mycamp'),
    },
    footnote:
      'You are receiving this because creator verification was requested for your Talma account. If this was not you, no action is needed.',
  })

  const text = [
    `Hi ${username},`,
    '',
    `Your Talma creator verification code is: ${input.code}`,
    '',
    `Enter this code in the Talma app to verify your account. It expires in ${expiresMinutes} minutes.`,
    '',
    'For your security, never share this code with anyone.',
    'If you did not request it, you can safely ignore this email.',
    '',
    `Open Talma: ${appUrl('/mycamp')}`,
    '',
    'Talma · Social learning for African students',
  ].join('\n')

  return {
    subject: 'Verify your Talma creator account',
    text,
    html,
  }
}

/** Sent immediately after a creator verifies their account. */export function creatorWelcomeEmail(input: {
  username: string
  profileUrl: string
}): RenderedEmail {
  const username = input.username.trim()

  const html = renderLayout({
    preheader: 'Your creator account is verified. Welcome to Talma Creators.',
    eyebrow: 'Welcome to Talma Creators',
    heading: `You're a verified creator, ${username}`,
    intro:
      'Your account is now verified. Your profile carries the creator badge, and you can upload videos and attach media to your posts.',
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0">
        <tr>
          <td style="border-radius:16px;background:${BRAND.greenSoft};border:1px solid #dcecc7;padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:#2f6d3d">
            <strong>Your creator badge is live.</strong>
            Students will now see the verified creator mark next to your name and on every post you publish.
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
        Here’s what you can do next:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
            <span style="color:${BRAND.green};font-weight:700">&#10003;</span> Upload your first video lesson
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
            <span style="color:${BRAND.green};font-weight:700">&#10003;</span> Attach images and videos to your posts
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
            <span style="color:${BRAND.green};font-weight:700">&#10003;</span> Share your public creator profile with students
          </td>
        </tr>
      </table>
    `,
    button: {
      label: 'Open your creator studio',
      href: appUrl('/mycamp'),
    },
    footnote: `Your public profile: ${input.profileUrl}`,
  })

  const text = [
    `Welcome to Talma Creators, ${username}!`,
    '',
    'Your account is now verified. Your profile carries the creator badge, and you can upload videos and attach media to your posts.',
    '',
    'What you can do next:',
    '- Upload your first video lesson',
    '- Attach images and videos to your posts',
    '- Share your public creator profile with students',
    '',
    `Open Talma: ${appUrl('/mycamp')}`,
    `Your public profile: ${input.profileUrl}`,
    '',
    'Talma · Social learning for African students',
  ].join('\n')

  return {
    subject: 'Welcome to Talma Creators',
    text,
    html,
  }
}

/** Sent when someone requests a password reset from the sign-in screen. */
export function passwordResetEmail(input: {
  username: string
  resetUrl: string
  expiresMinutes?: number
}): RenderedEmail {
  const username = input.username.trim()
  const expiresMinutes = input.expiresMinutes ?? 60

  const html = renderLayout({
    preheader: `Reset your Talma password. This link expires in ${expiresMinutes} minutes.`,
    eyebrow: 'Account security',
    heading: 'Reset your password',
    intro: `Hi ${username}, we received a request to reset the password for your Talma account.`,
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0">
        <tr>
          <td style="border-left:3px solid ${BRAND.gold};border-radius:0 12px 12px 0;background:${BRAND.goldSoft};padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:22px;color:#6b5400">
            <strong>This link expires in ${expiresMinutes} minutes.</strong>
            If you did not request a password reset, you can ignore this email — your password will not change.
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${BRAND.body}">
        For your security, Talma will never ask you to share this link or your new password with anyone.
      </p>
    `,
    button: {
      label: 'Reset password',
      href: input.resetUrl,
    },
    footnote:
      'You are receiving this because a password reset was requested for your Talma account. If this was not you, no action is needed.',
  })

  const text = [
    `Hi ${username},`,
    '',
    'We received a request to reset the password for your Talma account.',
    `Reset your password: ${input.resetUrl}`,
    '',
    `This link expires in ${expiresMinutes} minutes. If you did not request it, you can ignore this email — your password will not change.`,
    '',
    'For your security, Talma will never ask you to share this link or your new password with anyone.',
    '',
    'Talma · Social learning for African students',
  ].join('\n')

  return {
    subject: 'Reset your Talma password',
    text,
    html,
  }
}
