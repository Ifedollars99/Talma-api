/**
 * One-time helper that mints a Gmail API refresh token for Talma.
 *
 *   npm run gmail:auth --workspace server
 *
 * It reuses the Google OAuth client already configured for YouTube
 * (`YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`). Before running it:
 *
 *   1. Enable the Gmail API in the same Google Cloud project.
 *   2. Add the `https://www.googleapis.com/auth/gmail.send` scope on the
 *      OAuth consent screen (Data access).
 *   3. If the app is in Testing, add the sending Gmail address as a test user.
 *
 * The printed `GMAIL_REFRESH_TOKEN` goes into the API environment. The email
 * address printed at the end must match the address in `MAIL_FROM`.
 */
import 'dotenv/config'
import http from 'node:http'
import { URL } from 'node:url'

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID?.trim() ?? ''
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET?.trim() ?? ''
const PORT = Number(process.env.GMAIL_AUTH_PORT ?? 53683)
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`
const SCOPE = 'https://www.googleapis.com/auth/gmail.send'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in server/.env before running this script.',
  )
  process.exit(1)
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPE)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')

console.log('\nOpen this URL in a browser signed in as the sending Gmail account:\n')
console.log(authUrl.toString())
console.log(`\nWaiting for the Google callback on ${REDIRECT_URI} ...\n`)

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
  if (requestUrl.pathname !== '/oauth2callback') {
    res.writeHead(404).end('Not found')
    return
  }

  const error = requestUrl.searchParams.get('error')
  const code = requestUrl.searchParams.get('code')

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html' })
    res.end(`<h1>Authorization failed</h1><p>${error ?? 'No code returned.'}</p>`)
    console.error(`Authorization failed: ${error ?? 'no code returned'}`)
    server.close()
    process.exitCode = 1
    return
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const payload = (await tokenResponse.json()) as {
      refresh_token?: string
      access_token?: string
      error?: string
      error_description?: string
    }

    if (!tokenResponse.ok || !payload.refresh_token) {
      throw new Error(
        payload.error_description ??
          payload.error ??
          'Google did not return a refresh token. Revoke Talma in your Google Account and try again.',
      )
    }

    // Look up the authenticated address so MAIL_FROM can be set correctly.
    let sender = ''
    try {
      const profileResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: { Authorization: `Bearer ${payload.access_token ?? ''}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
      const profile = (await profileResponse.json()) as { emailAddress?: string }
      sender = profile.emailAddress ?? ''
    } catch {
      // Cosmetic only; the token has already been minted.
    }

    console.log('\nSuccess. Add this line to server/.env and to your host:\n')
    console.log(`GMAIL_REFRESH_TOKEN=${payload.refresh_token}\n`)
    if (sender) {
      console.log(`The authorized Gmail account is: ${sender}`)
      console.log(`Set MAIL_FROM="Talma <${sender}>" and EMAIL_PROVIDER=gmail.\n`)
    } else {
      console.log('Set MAIL_FROM to the Gmail address you just authorized.\n')
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(
      '<h1>Talma Gmail connected</h1><p>You can close this tab and return to the terminal.</p>',
    )
  } catch (caught) {
    console.error(`\nToken exchange failed: ${caught instanceof Error ? caught.message : caught}\n`)
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end('<h1>Token exchange failed</h1><p>Check the terminal for details.</p>')
    process.exitCode = 1
  } finally {
    server.close()
  }
})

server.listen(PORT, '127.0.0.1')
