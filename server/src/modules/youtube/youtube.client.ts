import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../common/errors/AppError.js'

/**
 * Minimal YouTube Data API v3 client.
 *
 * We deliberately use REST instead of the `googleapis` SDK: the API surface we
 * need is small (resumable upload initialization, video lookup, privacy
 * updates and deletes), and plain `fetch` is easier to stub in tests.
 *
 * The upload itself does not pass through this server. The API creates a
 * one-time resumable session URL and the browser sends the bytes straight to
 * Google, which keeps large files off the Talma API.
 */

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3'
const REQUEST_TIMEOUT_MS = 30_000

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null
let verifiedChannelId: string | null = null

export interface InitiateUploadInput {
  title: string
  description: string
  mimeType: string
  sizeBytes: number
  privacyStatus?: 'private' | 'unlisted'
  madeForKids?: boolean
}

export interface YouTubeVideoInfo {
  id: string
  title: string
  description: string
  channelId: string
  privacyStatus: string
  uploadStatus: string
  durationSeconds: number
}

export function isYouTubeConfigured(): boolean {
  return env.youtubeConfigured
}

/** Test helper: the token and channel caches are process-wide. */
export function resetYouTubeClientForTests(): void {
  cachedToken = null
  verifiedChannelId = null
}

async function accessToken(): Promise<string> {
  if (!env.youtubeConfigured) {
    throw AppError.serviceUnavailable(
      'YouTube uploads are not configured yet. Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN and YOUTUBE_CHANNEL_ID to the API environment.',
    )
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken
  }

  const body = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    client_secret: env.YOUTUBE_CLIENT_SECRET,
    refresh_token: env.YOUTUBE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  })

  let response: Response
  try {
    response = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw AppError.badGateway('Could not reach Google to authorize the YouTube channel.')
  }

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!response.ok || !payload.access_token) {
    logger.warn(
      {
        status: response.status,
        error: payload.error,
        description: payload.error_description,
      },
      'YouTube OAuth token refresh failed',
    )
    throw AppError.badGateway(
      'YouTube rejected the channel authorization. Re-run the YouTube auth setup and update YOUTUBE_REFRESH_TOKEN.',
    )
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  }
  return cachedToken.accessToken
}

async function authorizedFetch(
  url: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<Response> {
  const token = await accessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (response.status === 401 && retryOnUnauthorized) {
    cachedToken = null
    return authorizedFetch(url, init, false)
  }

  return response
}

async function throwYouTubeError(response: Response, action: string): Promise<never> {
  let detail = ''
  try {
    const payload = (await response.json()) as {
      error?: { message?: string; errors?: Array<{ reason?: string; message?: string }> }
    }
    detail =
      payload.error?.errors?.[0]?.reason ??
      payload.error?.message ??
      ''
  } catch {
    // Keep the generic message when Google does not return JSON.
  }

  if (response.status === 401) {
    throw AppError.badGateway(
      'YouTube authorization has expired. Re-run the YouTube auth setup and update YOUTUBE_REFRESH_TOKEN.',
    )
  }
  if (response.status === 403 && /quota/i.test(detail)) {
    throw AppError.badGateway(
      'The YouTube upload quota for today is exhausted. Try again after the quota resets.',
    )
  }
  throw AppError.badGateway(
    `YouTube could not ${action}${detail ? `: ${detail}` : '.'}`,
  )
}

/**
 * Confirms that the refresh token belongs to the configured Talma channel.
 * This runs before a resumable session is created so a misconfigured token can
 * never send an upload to the wrong channel.
 */
async function ensureTalmaChannel(): Promise<void> {
  if (verifiedChannelId === env.YOUTUBE_CHANNEL_ID) return

  const response = await authorizedFetch(
    `${YOUTUBE_API_BASE}/channels?part=id&mine=true`,
  )
  if (!response.ok) {
    await throwYouTubeError(response, 'verify the YouTube channel')
  }

  const payload = (await response.json()) as {
    items?: Array<{ id?: string }>
  }
  const channelId = payload.items?.[0]?.id
  if (!channelId) {
    throw AppError.badGateway('YouTube did not return a channel for this authorization.')
  }
  if (channelId !== env.YOUTUBE_CHANNEL_ID) {
    throw AppError.badGateway(
      'The YouTube authorization belongs to a different channel than YOUTUBE_CHANNEL_ID. Re-run the YouTube auth setup with the Talma channel.',
    )
  }

  verifiedChannelId = channelId
}

/**
 * Starts a resumable upload session and returns the one-time URL the browser
 * uses to PUT the file bytes. The session URL expires after about a week.
 */
export async function initiateResumableUpload(
  input: InitiateUploadInput,
): Promise<{ uploadUrl: string }> {
  await ensureTalmaChannel()

  const response = await authorizedFetch(
    `${YOUTUBE_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': input.mimeType,
        'X-Upload-Content-Length': String(input.sizeBytes),
      },
      body: JSON.stringify({
        snippet: {
          title: input.title.slice(0, 100),
          description: input.description.slice(0, 5000),
          categoryId: env.YOUTUBE_CATEGORY_ID,
        },
        status: {
          privacyStatus: input.privacyStatus ?? 'private',
          selfDeclaredMadeForKids: input.madeForKids ?? false,
        },
      }),
    },
  )

  if (response.status !== 200) {
    await throwYouTubeError(response, 'start the upload')
  }

  const uploadUrl = response.headers.get('location')
  if (!uploadUrl) {
    throw AppError.badGateway('YouTube did not return a resumable upload URL.')
  }

  return { uploadUrl }
}

export async function getVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  const params = new URLSearchParams({
    part: 'snippet,status,contentDetails',
    id: videoId,
  })
  const response = await authorizedFetch(`${YOUTUBE_API_BASE}/videos?${params.toString()}`)

  if (!response.ok) {
    await throwYouTubeError(response, 'look up the uploaded video')
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id: string
      snippet?: { title?: string; description?: string; channelId?: string }
      status?: { privacyStatus?: string; uploadStatus?: string }
      contentDetails?: { duration?: string }
    }>
  }

  const item = payload.items?.[0]
  if (!item) return null

  const channelId = item.snippet?.channelId ?? ''
  if (env.YOUTUBE_CHANNEL_ID && channelId !== env.YOUTUBE_CHANNEL_ID) {
    throw AppError.badRequest(
      'That video belongs to a different YouTube channel. Upload it through Talma instead.',
    )
  }

  return {
    id: item.id,
    title: item.snippet?.title ?? '',
    description: item.snippet?.description ?? '',
    channelId,
    privacyStatus: item.status?.privacyStatus ?? '',
    uploadStatus: item.status?.uploadStatus ?? '',
    durationSeconds: parseIsoDuration(item.contentDetails?.duration ?? ''),
  }
}

export async function updateVideoPrivacy(
  videoId: string,
  privacyStatus: 'private' | 'unlisted' | 'public',
): Promise<void> {
  const response = await authorizedFetch(`${YOUTUBE_API_BASE}/videos?part=status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: videoId,
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    }),
  })

  if (!response.ok) {
    await throwYouTubeError(response, 'update the video privacy')
  }
}

export async function updateVideoMetadata(
  videoId: string,
  input: { title: string; description: string },
): Promise<void> {
  const response = await authorizedFetch(`${YOUTUBE_API_BASE}/videos?part=snippet`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: videoId,
      snippet: {
        title: input.title.slice(0, 100),
        description: input.description.slice(0, 5000),
        categoryId: env.YOUTUBE_CATEGORY_ID,
      },
    }),
  })

  if (!response.ok) {
    await throwYouTubeError(response, 'update the video details')
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  const response = await authorizedFetch(
    `${YOUTUBE_API_BASE}/videos?id=${encodeURIComponent(videoId)}`,
    { method: 'DELETE' },
  )

  // A video that is already gone is not an error for our purposes.
  if (!response.ok && response.status !== 404) {
    await throwYouTubeError(response, 'delete the video')
  }
}

/** Converts an ISO-8601 duration such as `PT1H2M3S` to seconds. */
export function parseIsoDuration(value: string): number {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(value)
  if (!match) return 0
  const [, days, hours, minutes, seconds] = match
  return (
    Number(days ?? 0) * 86_400 +
    Number(hours ?? 0) * 3_600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  )
}
