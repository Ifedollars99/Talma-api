import { env } from '../../config/env.js'
import { AppError } from '../../common/errors/AppError.js'

/**
 * Minimal Cloudflare Stream client.
 *
 * Creator files are uploaded straight from the browser with the tus protocol.
 * The API only provisions the one-time upload URL, reads processing state and
 * mints short-lived signed playback tokens. Stream videos are created with
 * `requireSignedURLs`, so a plain video id cannot be watched or shared.
 *
 * We use plain `fetch` (rather than the Cloudflare SDK) because the surface is
 * small and easy to stub in tests.
 */

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'
const REQUEST_TIMEOUT_MS = 30_000
const TOKEN_CACHE_SAFETY_MS = 60_000

export type StreamStatus = 'queued' | 'inprogress' | 'ready' | 'error'

export interface StreamVideoInfo {
  uid: string
  status: StreamStatus
  errorReasonCode?: string
  errorReasonText?: string
  durationSeconds: number
  readyToStream: boolean
  requireSignedURLs: boolean
  allowedOrigins: string[]
  thumbnailUrl?: string
  sizeBytes?: number
}

export interface DirectUploadInput {
  fileName: string
  sizeBytes: number
  maxDurationSeconds: number
}

export interface DirectUploadResult {
  uid: string
  uploadUrl: string
  expiresAt: Date
}

interface CloudflareEnvelope<T> {
  success?: boolean
  result?: T
  errors?: Array<{ code?: number; message?: string }>
  messages?: string[]
}

interface CloudflareStreamVideo {
  uid?: string
  status?: {
    state?: string
    errorReasonCode?: string
    errorReasonText?: string
  }
  duration?: number
  readyToStream?: boolean
  requireSignedURLs?: boolean
  allowedOrigins?: string[]
  thumbnail?: string
  size?: number
}

interface TokenCacheEntry {
  token: string
  expiresAt: number
}

const tokenCache = new Map<string, TokenCacheEntry>()

/** Test helper: tokens are cached process-wide. */
export function resetCloudflareStreamCacheForTests(): void {
  tokenCache.clear()
}

function config() {
  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID.trim(),
    apiToken: env.CLOUDFLARE_STREAM_API_TOKEN.trim(),
    customerCode: env.CLOUDFLARE_STREAM_CUSTOMER_CODE.trim(),
  }
}

export function isCloudflareStreamConfigured(): boolean {
  const { accountId, apiToken, customerCode } = config()
  return Boolean(accountId && apiToken && customerCode)
}

function assertConfigured(): ReturnType<typeof config> {
  const values = config()
  if (!values.accountId || !values.apiToken || !values.customerCode) {
    throw AppError.serviceUnavailable(
      'Cloudflare Stream is not configured yet. Add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN and CLOUDFLARE_STREAM_CUSTOMER_CODE to the API environment.',
    )
  }
  return values
}

function apiUrl(path: string): string {
  const { accountId } = assertConfigured()
  return `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}${path}`
}

function authHeaders(): Record<string, string> {
  const { apiToken } = assertConfigured()
  return { Authorization: `Bearer ${apiToken}` }
}

async function cloudflareError(response: Response, action: string): Promise<never> {
  let detail = ''
  try {
    const payload = (await response.json()) as CloudflareEnvelope<unknown>
    detail = payload.errors?.[0]?.message ?? ''
  } catch {
    // Cloudflare did not answer with JSON; keep the generic message.
  }

  if (response.status === 401 || response.status === 403) {
    throw AppError.badGateway(
      'Cloudflare Stream rejected the API token. Check that CLOUDFLARE_STREAM_API_TOKEN has Stream:Edit permission.',
    )
  }
  if (response.status === 429) {
    throw AppError.badGateway(
      'Cloudflare Stream is rate limiting requests. Try again in a moment.',
    )
  }
  throw AppError.badGateway(
    `Cloudflare Stream could not ${action}${detail ? `: ${detail}` : '.'}`,
  )
}

async function request<T>(
  path: string,
  init: RequestInit,
  action: string,
): Promise<CloudflareEnvelope<T>> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw AppError.badGateway('Cloudflare Stream took too long to respond. Try again.')
    }
    throw AppError.badGateway('Could not reach Cloudflare Stream. Try again.')
  }

  if (!response.ok) {
    await cloudflareError(response, action)
  }

  try {
    return (await response.json()) as CloudflareEnvelope<T>
  } catch {
    throw AppError.badGateway('Cloudflare Stream returned an unreadable response.')
  }
}

/** Domains that may embed Stream videos. */
export function streamAllowedOrigins(): string[] {
  const configured = env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS
  if (configured.length > 0) {
    return configured
      .map((entry) => {
        const value = entry.trim()
        if (!value) return ''
        try {
          return value.includes('://') ? new URL(value).host : value.replace(/\/$/, '')
        } catch {
          return value.replace(/\/$/, '')
        }
      })
      .filter(Boolean)
  }

  try {
    return [new URL(env.CLIENT_APP_URL).host]
  } catch {
    return []
  }
}

function base64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function uploadMetadata(input: DirectUploadInput): string {
  const allowedOrigins = streamAllowedOrigins()
  const expiresAt = new Date(
    Date.now() + env.CLOUDFLARE_STREAM_UPLOAD_TTL_SECONDS * 1000,
  ).toISOString()

  const entries = [
    `name ${base64(input.fileName)}`,
    `maxdurationseconds ${base64(String(input.maxDurationSeconds))}`,
    'requiresignedurls',
    `expiry ${base64(expiresAt)}`,
  ]
  if (allowedOrigins.length > 0) {
    entries.push(`allowedorigins ${base64(JSON.stringify(allowedOrigins))}`)
  }
  return entries.join(',')
}

function extractUid(location: string | null, headerUid: string | null): string {
  if (headerUid && /^[A-Za-z0-9_-]{20,64}$/.test(headerUid)) return headerUid

  if (location) {
    const candidate = location.split('?')[0]?.split('/').filter(Boolean).pop() ?? ''
    if (/^[A-Za-z0-9_-]{20,64}$/.test(candidate)) return candidate
  }

  throw AppError.badGateway('Cloudflare Stream did not return an upload id.')
}

/**
 * Provisions a one-time tus upload URL. The browser PATCHes the file bytes
 * directly to Cloudflare, so large lessons never pass through the Talma API.
 */
export async function createDirectUpload(
  input: DirectUploadInput,
): Promise<DirectUploadResult> {
  let response: Response
  try {
    response = await fetch(apiUrl('/stream?direct_user=true'), {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(input.sizeBytes),
        'Upload-Metadata': uploadMetadata(input),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw AppError.badGateway('Cloudflare Stream took too long to prepare the upload.')
    }
    throw AppError.badGateway('Could not reach Cloudflare Stream to prepare the upload.')
  }

  if (response.status !== 201 && !response.ok) {
    await cloudflareError(response, 'prepare the upload')
  }

  const uploadUrl = response.headers.get('location')
  if (!uploadUrl) {
    throw AppError.badGateway('Cloudflare Stream did not return an upload URL.')
  }

  const uid = extractUid(uploadUrl, response.headers.get('stream-media-id'))
  return {
    uid,
    uploadUrl,
    expiresAt: new Date(Date.now() + env.CLOUDFLARE_STREAM_UPLOAD_TTL_SECONDS * 1000),
  }
}

function mapStatus(video: CloudflareStreamVideo): StreamStatus {
  const state = video.status?.state?.toLowerCase()
  if (state === 'ready' || video.readyToStream) return 'ready'
  if (state === 'error') return 'error'
  if (state === 'inprogress') return 'inprogress'
  return 'queued'
}

export async function getStreamVideo(uid: string): Promise<StreamVideoInfo | null> {
  let response: Response
  try {
    response = await fetch(apiUrl(`/stream/${encodeURIComponent(uid)}`), {
      headers: authHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw AppError.badGateway('Could not reach Cloudflare Stream to check the upload.')
  }

  if (response.status === 404) return null
  if (!response.ok) await cloudflareError(response, 'look up the video')

  const payload = (await response.json().catch(() => ({}))) as CloudflareEnvelope<
    CloudflareStreamVideo
  >
  const video = payload.result
  if (!video?.uid) return null

  return {
    uid: video.uid,
    status: mapStatus(video),
    ...(video.status?.errorReasonCode
      ? { errorReasonCode: video.status.errorReasonCode }
      : {}),
    ...(video.status?.errorReasonText
      ? { errorReasonText: video.status.errorReasonText }
      : {}),
    durationSeconds: Math.max(0, Math.round(video.duration ?? 0)),
    readyToStream: Boolean(video.readyToStream),
    requireSignedURLs: Boolean(video.requireSignedURLs),
    allowedOrigins: video.allowedOrigins ?? [],
    ...(video.thumbnail ? { thumbnailUrl: video.thumbnail } : {}),
    ...(video.size !== undefined ? { sizeBytes: video.size } : {}),
  }
}

/** Ensures a video requires signed playback and is locked to Talma's domains. */
export async function secureStreamVideo(uid: string): Promise<void> {
  await request(
    `/stream/${encodeURIComponent(uid)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        requireSignedURLs: true,
        allowedOrigins: streamAllowedOrigins(),
      }),
    },
    'secure the video',
  )
}

export async function updateStreamVideo(
  uid: string,
  input: { title?: string; description?: string },
): Promise<void> {
  const meta: Record<string, string> = {}
  if (input.title !== undefined) meta.name = input.title.slice(0, 160)
  if (input.description !== undefined) meta.description = input.description.slice(0, 2000)

  await request(
    `/stream/${encodeURIComponent(uid)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, meta }),
    },
    'update the video details',
  )
}

export async function deleteStreamVideo(uid: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(apiUrl(`/stream/${encodeURIComponent(uid)}`), {
      method: 'DELETE',
      headers: authHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw AppError.badGateway('Could not reach Cloudflare Stream to delete the video.')
  }

  // A video that is already gone is not an error for our purposes.
  if (!response.ok && response.status !== 404) {
    await cloudflareError(response, 'delete the video')
  }
}

/**
 * Creates (or reuses) a signed playback token. Cloudflare tokens are valid for
 * at most 24 hours; we keep them short so a copied URL stops working quickly.
 */
export async function createStreamToken(
  uid: string,
  ttlSeconds = env.CLOUDFLARE_STREAM_TOKEN_TTL_SECONDS,
): Promise<{ token: string; expiresAt: Date }> {
  const now = Date.now()
  const cached = tokenCache.get(uid)
  if (cached && cached.expiresAt - TOKEN_CACHE_SAFETY_MS > now) {
    return { token: cached.token, expiresAt: new Date(cached.expiresAt) }
  }

  const ttl = Math.min(Math.max(Math.round(ttlSeconds), 60), 86_400)
  const exp = Math.floor(now / 1000) + ttl
  const payload = await request<{ token?: string }>(
    `/stream/${encodeURIComponent(uid)}/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exp, downloadable: false }),
    },
    'create a playback token',
  )

  const token = payload.result?.token
  if (!token) {
    throw AppError.badGateway('Cloudflare Stream returned no playback token.')
  }

  tokenCache.set(uid, { token, expiresAt: exp * 1000 })
  return { token, expiresAt: new Date(exp * 1000) }
}

export function streamEmbedUrl(token: string): string {
  const { customerCode } = assertConfigured()
  return `https://customer-${customerCode}.cloudflarestream.com/${encodeURIComponent(token)}/iframe`
}

export function streamThumbnailUrl(token: string): string {
  const { customerCode } = assertConfigured()
  return `https://customer-${customerCode}.cloudflarestream.com/${encodeURIComponent(token)}/thumbnails/thumbnail.jpg`
}

/** Admin-only link to the Stream dashboard entry. */
export function streamDashboardUrl(uid: string): string | null {
  const { accountId } = config()
  if (!accountId) return null
  return `https://dash.cloudflare.com/${accountId}/stream/videos/${uid}`
}
