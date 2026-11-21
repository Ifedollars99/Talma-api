import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Brevo is the production email path for hosts that block SMTP ports, so its
 * request shape is worth pinning down without making a real network call.
 */
describe('Brevo email provider', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function loadMailer() {
    vi.resetModules()
    return import('../src/common/email/mailer.js')
  }

  it('sends the verification code over the HTTPS API', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'brevo')
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test-key')
    vi.stubEnv('MAIL_FROM', 'Talma <deadlyclassy1@gmail.com>')
    vi.stubEnv('MAIL_REPLY_TO', 'deadlyclassy1@gmail.com')

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ messageId: '<20261119@brevo>' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { sendCreatorVerificationEmail } = await loadMailer()
    const result = await sendCreatorVerificationEmail(
      'student@example.com',
      'Ada',
      '123456',
    )

    expect(result).toEqual({
      delivered: true,
      provider: 'brevo',
      id: '<20261119@brevo>',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect((init.headers as Record<string, string>)['api-key']).toBe(
      'xkeysib-test-key',
    )

    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.sender).toEqual({
      name: 'Talma',
      email: 'deadlyclassy1@gmail.com',
    })
    expect(body.to).toEqual([{ email: 'student@example.com' }])
    expect(body.replyTo).toEqual({ email: 'deadlyclassy1@gmail.com' })
    expect(String(body.subject)).toBe('Your Talma verification code')
    expect(String(body.htmlContent)).toContain('123456')
    expect(String(body.textContent)).toContain('123456')
  })

  it('surfaces a Brevo rejection instead of claiming delivery', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'brevo')
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-bad-key')
    vi.stubEnv('MAIL_FROM', 'Talma <deadlyclassy1@gmail.com>')

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ code: 'unauthorized', message: 'Key not found' }),
          {
            status: 401,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )

    const { sendCreatorVerificationEmail } = await loadMailer()
    const result = await sendCreatorVerificationEmail(
      'student@example.com',
      'Ada',
      '654321',
    )

    expect(result.delivered).toBe(false)
    expect(result.provider).toBe('brevo')
    expect(result.error).toBe('Key not found')
  })

  it('sends over the Gmail API using the existing Google OAuth client', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'gmail')
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'google-client-id')
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'google-client-secret')
    vi.stubEnv('GMAIL_REFRESH_TOKEN', 'gmail-refresh-token')
    vi.stubEnv('MAIL_FROM', 'Talma <sender@gmail.com>')
    vi.stubEnv('MAIL_REPLY_TO', 'sender@gmail.com')

    const calls: Array<{ url: string; init?: RequestInit }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        calls.push({ url, init })
        if (url === 'https://oauth2.googleapis.com/token') {
          return new Response(
            JSON.stringify({ access_token: 'access-token', expires_in: 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        if (url === 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send') {
          return new Response(JSON.stringify({ id: 'gmail-message-id' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        return new Response('unexpected request', { status: 500 })
      }),
    )

    const { sendCreatorVerificationEmail } = await loadMailer()
    const result = await sendCreatorVerificationEmail(
      'student@example.com',
      'Ada',
      '123456',
    )

    expect(result).toEqual({
      delivered: true,
      provider: 'gmail',
      id: 'gmail-message-id',
    })

    const tokenCall = calls.find(
      (call) => call.url === 'https://oauth2.googleapis.com/token',
    )
    expect(String(tokenCall?.init?.body)).toContain(
      'refresh_token=gmail-refresh-token',
    )

    const sendCall = calls.find(
      (call) =>
        call.url === 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    )
    expect(
      (sendCall?.init?.headers as Record<string, string>).Authorization,
    ).toBe('Bearer access-token')

    const body = JSON.parse(String(sendCall?.init?.body)) as { raw: string }
    const rawMessage = Buffer.from(body.raw, 'base64url').toString('utf8')
    expect(rawMessage).toContain('Subject: Your Talma verification code')
    expect(rawMessage).toContain('123456')
    expect(rawMessage).toContain('From: Talma <sender@gmail.com>')
    expect(rawMessage).toContain('Auto-Submitted: auto-generated')
  })

  it('surfaces a Gmail API rejection instead of claiming delivery', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'gmail')
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'google-client-id')
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'google-client-secret')
    vi.stubEnv('GMAIL_REFRESH_TOKEN', 'gmail-refresh-token')
    vi.stubEnv('MAIL_FROM', 'Talma <sender@gmail.com>')

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url === 'https://oauth2.googleapis.com/token') {
          return new Response(
            JSON.stringify({ access_token: 'access-token', expires_in: 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        return new Response(
          JSON.stringify({
            error: { code: 403, message: 'Delegation denied for sender@gmail.com' },
          }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        )
      }),
    )

    const { sendCreatorVerificationEmail } = await loadMailer()
    const result = await sendCreatorVerificationEmail(
      'student@example.com',
      'Ada',
      '654321',
    )

    expect(result.delivered).toBe(false)
    expect(result.provider).toBe('gmail')
    expect(result.error).toBe('Delegation denied for sender@gmail.com')
  })
})
