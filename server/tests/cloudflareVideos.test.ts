import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app, registerUser, type AuthenticatedUser } from './helpers.js'
import { signAccessToken } from '../src/common/utils/jwt.js'
import { env } from '../src/config/env.js'
import { resetCloudflareStreamCacheForTests } from '../src/modules/cloudflare/stream.client.js'

const CLOUDFLARE_UID = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
const CUSTOMER_CODE = 'talma-test'
const ACCOUNT_ID = 'test-account'
const API_TOKEN = 'test-cloudflare-stream-token'
const PLAYBACK_TOKEN = 'signed-playback-token'

type StreamState = 'queued' | 'inprogress' | 'ready' | 'error'

interface ExternalCall {
  url: string
  method: string
  headers: Record<string, string>
  body?: Record<string, unknown>
}

const savedEnv = {
  accountId: env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: env.CLOUDFLARE_STREAM_API_TOKEN,
  customerCode: env.CLOUDFLARE_STREAM_CUSTOMER_CODE,
  allowedOrigins: [...env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS],
  tokenTtl: env.CLOUDFLARE_STREAM_TOKEN_TTL_SECONDS,
  uploadTtl: env.CLOUDFLARE_STREAM_UPLOAD_TTL_SECONDS,
}

beforeEach(() => {
  env.CLOUDFLARE_ACCOUNT_ID = ACCOUNT_ID
  env.CLOUDFLARE_STREAM_API_TOKEN = API_TOKEN
  env.CLOUDFLARE_STREAM_CUSTOMER_CODE = CUSTOMER_CODE
  env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS = ['localhost:5173']
  env.CLOUDFLARE_STREAM_TOKEN_TTL_SECONDS = 7_200
  env.CLOUDFLARE_STREAM_UPLOAD_TTL_SECONDS = 21_600
  resetCloudflareStreamCacheForTests()
})

afterEach(() => {
  env.CLOUDFLARE_ACCOUNT_ID = savedEnv.accountId
  env.CLOUDFLARE_STREAM_API_TOKEN = savedEnv.apiToken
  env.CLOUDFLARE_STREAM_CUSTOMER_CODE = savedEnv.customerCode
  env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS = savedEnv.allowedOrigins
  env.CLOUDFLARE_STREAM_TOKEN_TTL_SECONDS = savedEnv.tokenTtl
  env.CLOUDFLARE_STREAM_UPLOAD_TTL_SECONDS = savedEnv.uploadTtl
  resetCloudflareStreamCacheForTests()
  vi.unstubAllGlobals()
})

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Stubs only Cloudflare Stream. These tests upload as an administrator, so the
 * Paystack and YouTube clients are never called.
 */
function stubCloudflareStream(options: { state?: () => StreamState } = {}) {
  const calls: ExternalCall[] = []
  const state = options.state ?? (() => 'ready' as StreamState)

  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const headers = Object.fromEntries(
      Object.entries((init?.headers as Record<string, string> | undefined) ?? {}).map(
        ([key, value]) => [key.toLowerCase(), value],
      ),
    )
    let body: Record<string, unknown> | undefined
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>
      } catch {
        body = undefined
      }
    }
    calls.push({ url, method, headers, ...(body ? { body } : {}) })

    if (!url.startsWith('https://api.cloudflare.com/client/v4/')) {
      throw new Error(`Unexpected external request: ${method} ${url}`)
    }

    const path = new URL(url).pathname

    // Direct creator upload provisioning.
    if (path.endsWith('/stream') && method === 'POST') {
      return new Response(null, {
        status: 201,
        headers: {
          location: `https://upload.cloudflarestream.com/${CLOUDFLARE_UID}`,
          'stream-media-id': CLOUDFLARE_UID,
        },
      })
    }

    // Signed playback token.
    if (path.endsWith(`/${CLOUDFLARE_UID}/token`) && method === 'POST') {
      return json({ success: true, result: { token: PLAYBACK_TOKEN } })
    }

    // Secure / metadata updates.
    if (path.endsWith(`/${CLOUDFLARE_UID}`) && method === 'POST') {
      return json({ success: true, result: {} })
    }

    // Video lookup.
    if (path.endsWith(`/${CLOUDFLARE_UID}`) && method === 'GET') {
      const current = state()
      return json({
        success: true,
        result: {
          uid: CLOUDFLARE_UID,
          status: { state: current },
          duration: current === 'ready' ? 600 : 0,
          readyToStream: current === 'ready',
          requireSignedURLs: true,
          allowedOrigins: ['localhost:5173'],
          thumbnail: `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${PLAYBACK_TOKEN}/thumbnails/thumbnail.jpg`,
        },
      })
    }

    if (path.endsWith(`/${CLOUDFLARE_UID}`) && method === 'DELETE') {
      return json({ success: true, result: {} })
    }

    throw new Error(`Unexpected Cloudflare request: ${method} ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, calls }
}

async function registerAdmin(): Promise<AuthenticatedUser> {
  const user = await registerUser({
    username: 'CloudAdmin',
    email: 'cloud.admin@example.com',
  })

  return {
    ...user,
    accessToken: signAccessToken({
      userId: user.userId,
      username: user.username,
      role: 'admin',
    }),
  }
}

function uploadPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Quadratic equations',
    description: 'A complete walkthrough for SSS 2.',
    subject: 'Mathematics',
    classLevel: 'SSS 2',
    periodNumber: 1,
    periodTotal: 3,
    priceNaira: 0,
    fileName: 'quadratics.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 80 * 1024 * 1024,
    madeForKids: false,
    ...overrides,
  }
}

async function startUpload(admin: AuthenticatedUser, overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post('/api/videos/uploads')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send(uploadPayload(overrides))
    .expect(201)

  return response
}

async function completeUpload(
  admin: AuthenticatedUser,
  videoId: string,
  body: Record<string, unknown> = { streamUid: CLOUDFLARE_UID },
) {
  const response = await request(app)
    .post(`/api/videos/${videoId}/upload-complete`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send(body)
    .expect(200)

  return response
}

function decodeMetadata(metadata: string): Map<string, string> {
  const entries = new Map<string, string>()
  for (const part of metadata.split(',')) {
    const [key, value = ''] = part.trim().split(' ')
    entries.set(key, value ? Buffer.from(value, 'base64').toString('utf8') : '')
  }
  return entries
}

describe('Cloudflare Stream video uploads', () => {
  it('provisions a signed direct upload and mints short-lived playback links', async () => {
    const { calls } = stubCloudflareStream()
    const admin = await registerAdmin()

    const start = await startUpload(admin)

    expect(start.body.provider).toBe('cloudflare')
    expect(start.body.uploadMethod).toBe('tus')
    expect(start.body.streamUid).toBe(CLOUDFLARE_UID)
    expect(start.body.uploadUrl).toContain(`upload.cloudflarestream.com/${CLOUDFLARE_UID}`)
    expect(start.body.video.status).toBe('uploading')
    expect(start.body.video.provider).toBe('cloudflare')
    expect(start.body.video.periodNumber).toBe(1)
    expect(start.body.video.periodTotal).toBe(3)

    const provision = calls.find((call) => call.url.includes('/stream?direct_user=true'))
    expect(provision?.method).toBe('POST')
    expect(provision?.headers.authorization).toBe(`Bearer ${API_TOKEN}`)
    expect(provision?.headers['tus-resumable']).toBe('1.0.0')
    expect(provision?.headers['upload-length']).toBe(String(80 * 1024 * 1024))

    const metadata = decodeMetadata(provision?.headers['upload-metadata'] ?? '')
    expect(metadata.get('name')).toBe('quadratics.mp4')
    expect(metadata.has('requiresignedurls')).toBe(true)
    expect(JSON.parse(metadata.get('allowedorigins') ?? '[]')).toEqual(['localhost:5173'])

    const videoId = start.body.video.id as string
    const complete = await completeUpload(admin, videoId)

    expect(complete.body.video.status).toBe('pending_review')
    expect(complete.body.video.provider).toBe('cloudflare')
    expect(complete.body.video.streamStatus).toBe('ready')
    expect(complete.body.video.durationSeconds).toBe(600)
    // Catalogue-shaped responses never include a Cloudflare playback URL.
    expect(complete.body.video.watchUrl).toBeUndefined()

    const approve = await request(app)
      .post(`/api/videos/${videoId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ priceNaira: 0 })
      .expect(200)

    expect(approve.body.video.status).toBe('published')
    expect(approve.body.video.published).toBe(true)
    expect(approve.body.video.watchUrl).toBeUndefined()
    expect(approve.body.video.studioUrl).toContain(`dash.cloudflare.com/${ACCOUNT_ID}`)

    const catalogue = await request(app).get('/api/videos').expect(200)
    expect(catalogue.body.videos[0].watchUrl).toBeUndefined()
    expect(catalogue.body.videos[0].provider).toBe('cloudflare')

    // A free, published lesson is watchable without a purchase.
    const student = await registerUser({
      username: 'CloudStudent',
      email: 'cloud.student@example.com',
    })
    const watch = await request(app)
      .get(`/api/videos/${videoId}/watch`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    expect(watch.body.watchUrl).toBe(
      `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${PLAYBACK_TOKEN}/iframe`,
    )
    expect(watch.body.expiresAt).toBeTruthy()

    // The token is cached server-side, so a second watch does not spend another
    // rate-limited Cloudflare token request.
    await request(app)
      .get(`/api/videos/${videoId}/watch`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    const tokenCalls = calls.filter(
      (call) => call.method === 'POST' && call.url.endsWith(`/${CLOUDFLARE_UID}/token`),
    )
    expect(tokenCalls).toHaveLength(1)
  })

  it('keeps an encoding video in processing and promotes it from the creator list', async () => {
    let state: StreamState = 'inprogress'
    stubCloudflareStream({ state: () => state })
    const admin = await registerAdmin()

    const start = await startUpload(admin)
    const videoId = start.body.video.id as string

    const complete = await completeUpload(admin, videoId)
    expect(complete.body.video.status).toBe('processing')
    expect(complete.body.video.streamStatus).toBe('inprogress')

    const publicList = await request(app).get('/api/videos').expect(200)
    expect(publicList.body.videos).toHaveLength(0)

    state = 'ready'
    const mine = await request(app)
      .get('/api/videos/mine')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(mine.body.videos).toHaveLength(1)
    expect(mine.body.videos[0].status).toBe('pending_review')
    expect(mine.body.videos[0].streamStatus).toBe('ready')
    expect(mine.body.videos[0].durationSeconds).toBe(600)
  })

  it('deletes the Cloudflare copy when an administrator rejects an upload', async () => {
    const { calls } = stubCloudflareStream()
    const admin = await registerAdmin()

    const start = await startUpload(admin)
    const videoId = start.body.video.id as string
    await completeUpload(admin, videoId)

    const reject = await request(app)
      .post(`/api/videos/${videoId}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'The audio is distorted.' })
      .expect(200)

    expect(reject.body.video.status).toBe('rejected')
    expect(reject.body.video.published).toBe(false)
    expect(reject.body.video.rejectionReason).toBe('The audio is distorted.')

    const deletion = calls.find(
      (call) => call.method === 'DELETE' && call.url.endsWith(`/${CLOUDFLARE_UID}`),
    )
    expect(deletion).toBeTruthy()

    const review = await request(app)
      .get('/api/videos/review')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
    expect(review.body.videos).toHaveLength(0)
  })
})
