import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app, registerUser, type AuthenticatedUser } from './helpers.js'
import { signAccessToken } from '../src/common/utils/jwt.js'
import { resetYouTubeClientForTests } from '../src/modules/youtube/youtube.client.js'
import { VideoModel } from '../src/modules/videos/video.model.js'
import { VideoPurchaseModel } from '../src/modules/videos/videoPurchase.model.js'
import { UserModel } from '../src/modules/users/user.model.js'

const YOUTUBE_ID = 'abc123DEF45'

afterEach(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  resetYouTubeClientForTests()
})

async function registerAdmin(): Promise<AuthenticatedUser> {
  const user = await registerUser({
    username: 'CreatorAdmin',
    email: 'creator.admin@example.com',
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

interface ExternalCall {
  url: string
  method: string
  body?: Record<string, unknown>
}

function json(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Stubs both Paystack and the YouTube REST endpoints used by the flow. */
function stubExternalApis(
  options: { duration?: string; privacy?: string; channelId?: string } = {},
) {
  const calls: ExternalCall[] = []

  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    let body: Record<string, unknown> | undefined
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>
      } catch {
        body = undefined
      }
    }
    calls.push({ url, method, ...(body ? { body } : {}) })

    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return json({ access_token: 'ya29.test-token', expires_in: 3600 })
    }

    // Paystack payout onboarding.
    if (url.includes('/bank/resolve')) {
      return json({
        status: true,
        message: 'ok',
        data: { account_number: '0123456789', account_name: 'Ada Creator' },
      })
    }
    if (url.includes('/bank?')) {
      return json({
        status: true,
        message: 'ok',
        data: [{ name: 'Test Bank', code: '058', currency: 'NGN' }],
      })
    }
    if (url.endsWith('/subaccount')) {
      return json({
        status: true,
        message: 'ok',
        data: {
          subaccount_code: 'ACCT_test_creator',
          account_name: 'Ada Creator',
          settlement_bank: '058',
          account_number: '0123456789',
          percentage_charge: 30,
        },
      })
    }

    // Paystack checkout.
    if (url.endsWith('/transaction/initialize')) {
      return json({
        status: true,
        message: 'ok',
        data: {
          authorization_url: 'https://checkout.paystack.com/creator-test',
          access_code: 'test_access_code',
          reference: body?.reference,
        },
      })
    }
    if (url.includes('/transaction/verify/')) {
      return json({
        status: true,
        message: 'ok',
        data: {
          id: 12345,
          status: 'success',
          reference: decodeURIComponent(url.split('/transaction/verify/')[1] ?? ''),
          amount: 200_000,
          currency: 'NGN',
          paid_at: new Date().toISOString(),
          channel: 'card',
        },
      })
    }

    // The client checks that the token owns the configured channel before it
    // starts an upload session.
    if (url.includes('/youtube/v3/channels') && method === 'GET') {
      return json({ items: [{ id: options.channelId ?? 'UC_talma_test_channel' }] })
    }

    // YouTube resumable upload initialization.
    if (url.includes('upload/youtube/v3/videos') && method === 'POST') {
      return new Response(null, {
        status: 200,
        headers: {
          location:
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=test-session',
        },
      })
    }

    // YouTube video lookup, privacy update, metadata update and delete.
    if (url.includes('/youtube/v3/videos')) {
      if (method === 'GET') {
        return json({
          items: [
            {
              id: YOUTUBE_ID,
              snippet: {
                title: 'Creator lesson',
                description: 'A lesson from a Talma creator.',
                channelId: 'UC_talma_test_channel',
              },
              status: {
                privacyStatus: options.privacy ?? 'private',
                uploadStatus: 'processed',
              },
              contentDetails: { duration: options.duration ?? 'PT45M' },
            },
          ],
        })
      }
      if (method === 'DELETE') {
        return new Response(null, { status: 204 })
      }
      return json({ kind: 'youtube#video' })
    }

    throw new Error(`Unexpected external request: ${method} ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, calls }
}

async function registerCreator() {
  const user = await registerUser({
    username: 'CreatorAda',
    email: 'creator.ada@example.com',
  })

  const application = await request(app)
    .post('/api/creators/apply')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({
      displayName: 'Ada Creates',
      bio: 'Maths and physics lessons.',
      bankCode: '058',
      accountNumber: '0123456789',
    })
    .expect(201)

  const admin = await registerAdmin()
  const approved = await request(app)
    .post(`/api/creators/${application.body.creator.id as string}/approve`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .expect(200)

  return { user, admin, creator: approved.body.creator as Record<string, unknown> }
}

function uploadPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Integration by parts',
    description: 'A one-hour calculus walkthrough.',
    subject: 'Mathematics',
    classLevel: 'University 200 Level',
    fileName: 'integration.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 100 * 1024 * 1024,
    madeForKids: false,
    ...overrides,
  }
}

async function startAndCompleteUpload(creator: AuthenticatedUser) {
  const start = await request(app)
    .post('/api/videos/uploads')
    .set('Authorization', `Bearer ${creator.accessToken}`)
    .send(uploadPayload())
    .expect(201)

  const videoId = start.body.video.id as string
  const complete = await request(app)
    .post(`/api/videos/${videoId}/upload-complete`)
    .set('Authorization', `Bearer ${creator.accessToken}`)
    .send({ youtubeVideoId: YOUTUBE_ID })
    .expect(200)

  return { videoId, start, complete }
}

describe('Creator video uploads', () => {
  it('approves a creator application and creates a Paystack subaccount', async () => {
    const { calls } = stubExternalApis()
    const user = await registerUser({
      username: 'Applicant',
      email: 'applicant@example.com',
    })

    const application = await request(app)
      .post('/api/creators/apply')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        displayName: 'Ada Creates',
        bio: 'Maths and physics lessons.',
        bankCode: '058',
        accountNumber: '0123456789',
      })
      .expect(201)

    expect(application.body.creator.status).toBe('pending')
    expect(application.body.creator.sharePercent).toBe(70)

    const admin = await registerAdmin()
    const approved = await request(app)
      .post(`/api/creators/${application.body.creator.id as string}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(approved.body.creator.status).toBe('approved')
    expect(approved.body.creator.paystackSubaccountCode).toBe('ACCT_test_creator')

    const stored = await UserModel.findById(user.userId).lean()
    expect(stored?.creatorStatus).toBe('approved')

    const subaccountCall = calls.find((call) => call.url.endsWith('/subaccount'))
    expect(subaccountCall?.body).toMatchObject({
      business_name: 'Ada Creates',
      settlement_bank: '058',
      account_number: '0123456789',
      percentage_charge: 30,
    })
  })

  it('rejects uploads from accounts that are not approved creators', async () => {
    const { calls } = stubExternalApis()
    const student = await registerUser()

    const response = await request(app)
      .post('/api/videos/uploads')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send(uploadPayload())
      .expect(403)

    expect(response.body.error.message).toContain('approved creators')
    expect(calls).toHaveLength(0)
  })

  it('refuses to start an upload when the token belongs to another channel', async () => {
    stubExternalApis({ channelId: 'UC_wrong_channel' })
    const { user: creator } = await registerCreator()

    const response = await request(app)
      .post('/api/videos/uploads')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send(uploadPayload())
      .expect(502)

    expect(response.body.error.message).toContain('different channel')
    expect(await VideoModel.countDocuments({ creator: creator.userId })).toBe(0)
  })

  it('uploads, reviews, publishes and splits a creator checkout', async () => {
    const { calls } = stubExternalApis()
    const { user: creator, admin } = await registerCreator()

    const { videoId, start, complete } = await startAndCompleteUpload(creator)

    expect(start.body.video.status).toBe('uploading')
    expect(start.body.video.subject).toBe('Mathematics')
    expect(start.body.video.classLevel).toBe('University 200 Level')
    expect(start.body.uploadUrl).toContain('upload_id=test-session')
    expect(complete.body.video.status).toBe('pending_review')
    expect(complete.body.video.locked).toBe(false)
    expect(complete.body.video.watchUrl).toBeUndefined()

    // A pending upload is not visible to students.
    const publicBefore = await request(app).get('/api/videos').expect(200)
    expect(publicBefore.body.videos).toHaveLength(0)

    // The administrator can see it and approve it.
    const reviewList = await request(app)
      .get('/api/videos')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
    expect(
      reviewList.body.videos.find((video: { id: string }) => video.id === videoId).status,
    ).toBe('pending_review')

    const approved = await request(app)
      .post(`/api/videos/${videoId}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ priceNaira: 2000 })
      .expect(200)

    expect(approved.body.video.status).toBe('published')
    expect(approved.body.video.creator.name).toBe('Ada Creates')

    const publicAfter = await request(app).get('/api/videos').expect(200)
    expect(publicAfter.body.videos).toHaveLength(1)
    expect(publicAfter.body.videos[0].watchUrl).toBeUndefined()

    const buyer = await registerUser({
      username: 'CreatorBuyer',
      email: 'creator.buyer@example.com',
    })

    const checkout = await request(app)
      .post(`/api/videos/${videoId}/checkout`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(201)

    const initializeCall = calls.find((call) =>
      call.url.endsWith('/transaction/initialize'),
    )
    expect(initializeCall?.body).toMatchObject({
      amount: 200_000,
      currency: 'NGN',
      subaccount: 'ACCT_test_creator',
      bearer: 'account',
    })

    const purchase = await VideoPurchaseModel.findOne({
      reference: checkout.body.reference as string,
    })
    expect(purchase?.creatorSharePercent).toBe(70)
    expect(purchase?.creatorShareKobo).toBe(140_000)
    expect(purchase?.platformShareKobo).toBe(60_000)
    expect(purchase?.paystackSubaccountCode).toBe('ACCT_test_creator')
  })

  it('deletes a rejected upload from YouTube and keeps it out of the catalogue', async () => {
    const { calls } = stubExternalApis()
    const { user: creator, admin } = await registerCreator()
    const { videoId } = await startAndCompleteUpload(creator)

    const rejected = await request(app)
      .post(`/api/videos/${videoId}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'The audio is copyrighted.' })
      .expect(200)

    expect(rejected.body.video.status).toBe('rejected')
    expect(rejected.body.video.rejectionReason).toBe('The audio is copyrighted.')

    const deleteCall = calls.find(
      (call) => call.method === 'DELETE' && call.url.includes('/youtube/v3/videos'),
    )
    expect(deleteCall).toBeDefined()

    const publicList = await request(app).get('/api/videos').expect(200)
    expect(publicList.body.videos).toHaveLength(0)

    const stored = await VideoModel.findById(videoId).lean()
    expect(stored?.published).toBe(false)
  })

  it('rejects a video longer than one hour and removes the YouTube copy', async () => {
    const { calls } = stubExternalApis({ duration: 'PT1H2M' })
    const { user: creator } = await registerCreator()

    const start = await request(app)
      .post('/api/videos/uploads')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send(uploadPayload())
      .expect(201)

    const response = await request(app)
      .post(`/api/videos/${start.body.video.id as string}/upload-complete`)
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send({ youtubeVideoId: YOUTUBE_ID })
      .expect(400)

    expect(response.body.error.message).toContain('one hour')

    const stored = await VideoModel.findById(start.body.video.id as string).lean()
    expect(stored?.status).toBe('failed')
    expect(
      calls.some(
        (call) => call.method === 'DELETE' && call.url.includes('/youtube/v3/videos'),
      ),
    ).toBe(true)
  })
})
