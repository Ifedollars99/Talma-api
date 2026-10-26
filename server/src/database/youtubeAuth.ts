/**
 * One-time helper that mints a YouTube refresh token for the Talma channel.
 *
 *   npm run youtube:auth --workspace server
 *
 * Create an OAuth client of type "Desktop app" in Google Cloud, enable the
 * YouTube Data API v3, then run this script. The printed refresh token goes
 * into `YOUTUBE_REFRESH_TOKEN` in `server/.env`.
 */
import 'dotenv/config'
import http from 'node:http'
import { URL } from 'node:url'

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID?.trim() ?? ''
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET?.trim() ?? ''
const PORT = Number(process.env.YOUTUBE_AUTH_PORT ?? 53682)
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`
const SCOPE = 'https://www.googleapis.com/auth/youtube'

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

console.log('\nOpen this URL in a browser signed in as the Talma YouTube channel:\n')
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
          'Google did not return a refresh token. Revoke the app in your Google Account and try again.',
      )
    }

    console.log('\nSuccess. Add this line to server/.env:\n')
    console.log(`YOUTUBE_REFRESH_TOKEN=${payload.refresh_token}\n`)

    // Print the channel id too, so setup does not require hunting through
    // YouTube Studio. Failure here is cosmetic; the token is already printed.
    try {
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
        {
          headers: { Authorization: `Bearer ${payload.access_token ?? ''}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
      const channelPayload = (await channelResponse.json()) as {
        items?: Array<{ id?: string }>
      }
      const channelId = channelPayload.items?.[0]?.id
      if (channelId) {
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}\n`)
      }
    } catch {
      // Ignore; the administrator can copy the id from YouTube Studio.
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(
      '<h1>Talma YouTube connected</h1><p>You can close this tab and return to the terminal.</p>',
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
