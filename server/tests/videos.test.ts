import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app, registerUser, type AuthenticatedUser } from './helpers.js'
import { signAccessToken } from '../src/common/utils/jwt.js'
import { VideoModel } from '../src/modules/videos/video.model.js'
import { VideoPurchaseModel } from '../src/modules/videos/videoPurchase.model.js'

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const YOUTUBE_ID = 'dQw4w9WgXcQ'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Registers a normal account, then swaps in an admin-role access token. */
async function registerAdmin(): Promise<AuthenticatedUser> {
  const user = await registerUser({
    username: 'TalmaAdmin',
    email: 'talma.admin@example.com',
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

async function createVideo(
  admin: AuthenticatedUser,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; priceKobo: number }> {
  const response = await request(app)
    .post('/api/videos')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      youtubeUrl: YOUTUBE_URL,
      title: 'Algebra masterclass',
      description: 'A full hour on linear equations.',
      subject: 'Mathematics',
      classLevel: 'University 100 Level',
      durationSeconds: 3600,
      priceNaira: 2000,
      ...overrides,
    })
    .expect(201)

  return {
    id: response.body.video.id as string,
    priceKobo: response.body.video.priceKobo as number,
  }
}

function stubPaystack(overrides: Record<string, unknown> = {}) {
  const calls: Array<{ url: string; body?: unknown }> = []
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url)
    const requestBody =
      typeof init?.body === 'string'
        ? (JSON.parse(init.body) as { reference?: string })
        : undefined
    calls.push({
      url: target,
      ...(requestBody ? { body: requestBody } : {}),
    })

    const payload = target.includes('/transaction/verify/')
      ? {
          status: true,
          message: 'ok',
          data: {
            id: 12345,
            status: 'success',
            reference:
              decodeURIComponent(target.split('/transaction/verify/')[1] ?? '') ||
              overrides.reference ||
              'talma-test-reference',
            amount: 200_000,
            currency: 'NGN',
            paid_at: new Date().toISOString(),
            channel: 'card',
            ...overrides.data,
          },
        }
      : {
          status: true,
          message: 'ok',
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            access_code: 'test_access_code',
            reference:
              requestBody?.reference ?? overrides.reference ?? 'talma-test-reference',
            ...overrides.data,
          },
        }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, calls }
}

function signWebhookBody(body: string): string {
  return crypto.createHmac('sha512', 'sk_test_talma').update(body).digest('hex')
}

describe('Videos', () => {
  it('lets an admin publish a YouTube video at the default ₦2,000 price', async () => {
    const admin = await registerAdmin()
    const { id, priceKobo } = await createVideo(admin)

    expect(priceKobo).toBe(200_000)

    const response = await request(app)
      .get(`/api/videos/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)

    expect(response.body.video.title).toBe('Algebra masterclass')
    expect(response.body.video.subject).toBe('Mathematics')
    expect(response.body.video.classLevel).toBe('University 100 Level')
    expect(response.body.video.youtubeUrl).toContain(YOUTUBE_ID)
    expect(response.body.video.thumbnailUrl).toContain(`/api/videos/${id}/thumbnail`)
    expect(response.body.video.thumbnailUrl).not.toContain(YOUTUBE_ID)
  })

  it('only lets administrators manage the catalogue', async () => {
    const student = await registerUser()

    await request(app)
      .post('/api/videos')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ youtubeUrl: YOUTUBE_URL, title: 'Not allowed' })
      .expect(403)
  })

  it('requires a subject and class level for every video', async () => {
    const admin = await registerAdmin()

    const response = await request(app)
      .post('/api/videos')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ youtubeUrl: YOUTUBE_URL, title: 'Missing metadata' })
      .expect(422)

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'subject' }),
        expect.objectContaining({ path: 'classLevel' }),
      ]),
    )
  })

  it('rejects links that are not YouTube videos', async () => {
    const admin = await registerAdmin()

    const response = await request(app)
      .post('/api/videos')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        youtubeUrl: 'https://vimeo.com/123456789',
        title: 'Wrong host',
        subject: 'Mathematics',
        classLevel: 'SSS 1',
      })
      .expect(400)

    expect(response.body.error.message).toContain('valid YouTube link')
  })

  it('never exposes the YouTube id or watch URL before purchase', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Buyer', email: 'buyer@example.com' })

    const listed = await request(app)
      .get('/api/videos')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    expect(listed.body.videos).toHaveLength(1)
    expect(listed.body.videos[0].locked).toBe(true)
    expect(listed.body.videos[0].purchased).toBe(false)
    expect(listed.body.videos[0].watchUrl).toBeUndefined()
    expect(JSON.stringify(listed.body)).not.toContain(YOUTUBE_ID)

    const watch = await request(app)
      .get(`/api/videos/${id}/watch`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(402)

    expect(watch.body.error.code).toBe('PAYMENT_REQUIRED')
  })

  it('returns the YouTube URL once a paid purchase exists', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'PaidBuyer', email: 'paid@example.com' })

    await VideoPurchaseModel.create({
      user: student.userId,
      video: id,
      reference: 'talma-paid-reference',
      amountKobo: 200_000,
      currency: 'NGN',
      status: 'paid',
      paidAt: new Date(),
    })

    const watch = await request(app)
      .get(`/api/videos/${id}/watch`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    expect(watch.body.watchUrl).toBe(`https://www.youtube.com/watch?v=${YOUTUBE_ID}`)
  })

  it('starts a Paystack checkout with the server-side price', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Checkout', email: 'checkout@example.com' })
    const { calls } = stubPaystack()

    const response = await request(app)
      .post(`/api/videos/${id}/checkout`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ amountKobo: 1 })
      .expect(201)

    expect(response.body.alreadyPurchased).toBe(false)
    expect(response.body.authorizationUrl).toBe('https://checkout.paystack.com/test')

    const initializeCall = calls.find((call) => call.url.endsWith('/transaction/initialize'))
    expect(initializeCall).toBeDefined()
    expect(initializeCall?.body).toMatchObject({
      email: 'checkout@example.com',
      amount: 200_000,
      currency: 'NGN',
    })

    const purchase = await VideoPurchaseModel.findOne({ reference: response.body.reference })
    expect(purchase?.status).toBe('pending')
    expect(purchase?.amountKobo).toBe(200_000)
  })

  it('reuses a fresh pending checkout instead of creating a second payable one', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'DoubleClick', email: 'double@example.com' })
    const { calls } = stubPaystack()

    const first = await request(app)
      .post(`/api/videos/${id}/checkout`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201)

    const second = await request(app)
      .post(`/api/videos/${id}/checkout`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201)

    expect(second.body.reference).toBe(first.body.reference)
    expect(second.body.authorizationUrl).toBe(first.body.authorizationUrl)
    expect(calls.filter((call) => call.url.endsWith('/transaction/initialize'))).toHaveLength(1)
  })

  it('does not start a second charge for a video the user already owns', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Owner', email: 'owner@example.com' })

    await VideoPurchaseModel.create({
      user: student.userId,
      video: id,
      reference: 'talma-already-owned',
      amountKobo: 200_000,
      currency: 'NGN',
      status: 'paid',
      paidAt: new Date(),
    })

    const response = await request(app)
      .post(`/api/videos/${id}/checkout`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201)

    expect(response.body.alreadyPurchased).toBe(true)
    expect(response.body.authorizationUrl).toBeUndefined()
    expect(response.body.watchUrl).toContain(YOUTUBE_ID)
  })

  it('rejects a Paystack webhook with a bad signature', async () => {
    const body = JSON.stringify({
      event: 'charge.success',
      data: { reference: 'talma-forged' },
    })

    await request(app)
      .post('/api/payments/paystack/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'not-a-valid-signature')
      .send(body)
      .expect(401)
  })

  it('verifies a signed webhook and grants access exactly once', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Webhook', email: 'webhook@example.com' })

    await VideoPurchaseModel.create({
      user: student.userId,
      video: id,
      reference: 'talma-webhook-reference',
      amountKobo: 200_000,
      currency: 'NGN',
      status: 'pending',
    })

    stubPaystack({
      reference: 'talma-webhook-reference',
      data: { id: 98765 },
    })

    const body = JSON.stringify({
      event: 'charge.success',
      data: { reference: 'talma-webhook-reference' },
    })
    const signature = signWebhookBody(body)

    await request(app)
      .post('/api/payments/paystack/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(body)
      .expect(200)

    const paid = await VideoPurchaseModel.findOne({ reference: 'talma-webhook-reference' })
    expect(paid?.status).toBe('paid')
    expect(paid?.providerTransactionId).toBe(98765)

    // A retried webhook must not fail or grant twice.
    await request(app)
      .post('/api/payments/paystack/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(body)
      .expect(200)

    expect(await VideoPurchaseModel.countDocuments({ status: 'paid' })).toBe(1)
  })

  it('reconciles the return-from-Paystack flow for the buyer', async () => {
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Returning', email: 'return@example.com' })

    await VideoPurchaseModel.create({
      user: student.userId,
      video: id,
      reference: 'talma-return-reference',
      amountKobo: 200_000,
      currency: 'NGN',
      status: 'pending',
    })

    stubPaystack({ reference: 'talma-return-reference' })

    const response = await request(app)
      .post('/api/videos/purchases/verify')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ reference: 'talma-return-reference' })
      .expect(200)

    expect(response.body.purchase.status).toBe('paid')
    expect(response.body.video.purchased).toBe(true)
    expect(response.body.video.watchUrl).toContain(YOUTUBE_ID)
  })

  it('hides drafts from students and keeps the admin catalogue complete', async () => {
    const admin = await registerAdmin()
    await createVideo(admin, { title: 'Draft lesson', published: false })
    await createVideo(admin, { title: 'Live lesson', published: true })

    const publicList = await request(app).get('/api/videos').expect(200)
    expect(publicList.body.videos.map((video: { title: string }) => video.title)).toEqual([
      'Live lesson',
    ])

    const adminList = await request(app)
      .get('/api/videos')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
    expect(adminList.body.videos).toHaveLength(2)
  })

  it('deletes the video and its purchase records together', async () => {
    // The admin delete also calls the YouTube API; this stub keeps the test
    // offline (the token exchange fails and the service logs the failure).
    stubPaystack()
    const admin = await registerAdmin()
    const { id } = await createVideo(admin)
    const student = await registerUser({ username: 'Leaver', email: 'leaver@example.com' })

    await VideoPurchaseModel.create({
      user: student.userId,
      video: id,
      reference: 'talma-delete-reference',
      amountKobo: 200_000,
      currency: 'NGN',
      status: 'paid',
    })

    await request(app)
      .delete(`/api/videos/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204)

    expect(await VideoModel.countDocuments({})).toBe(0)
    expect(await VideoPurchaseModel.countDocuments({})).toBe(0)
  })
})
