import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

// Multer only inspects the declared MIME type, so the bytes do not matter here.
const SAMPLE = Buffer.from('talma-media')

describe('Post media uploads', () => {
  it('requires authentication', async () => {
    await request(app)
      .post('/api/uploads/post-media')
      .attach('file', SAMPLE, { filename: 'photo.png', contentType: 'image/png' })
      .expect(401)
  })

  it('accepts a photo', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .post('/api/uploads/post-media')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', SAMPLE, { filename: 'photo.png', contentType: 'image/png' })
      .expect(201)

    expect(response.body.mediaType).toBe('image')
    expect(response.body.url).toContain('/uploads/post-media/')
  })

  it('accepts a video', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .post('/api/uploads/post-media')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', SAMPLE, { filename: 'lecture.mp4', contentType: 'video/mp4' })
      .expect(201)

    expect(response.body.mediaType).toBe('video')
  })

  it('rejects an audio file', async () => {
    const { accessToken } = await registerUser()

    const response = await request(app)
      .post('/api/uploads/post-media')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', SAMPLE, { filename: 'voice.mp3', contentType: 'audio/mpeg' })
      .expect(400)

    expect(response.body.error.code).toBe('BAD_REQUEST')
    expect(response.body.error.message).toMatch(/audio files are not supported/i)
  })

  it('rejects a PDF as post media', async () => {
    const { accessToken } = await registerUser()

    await request(app)
      .post('/api/uploads/post-media')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', SAMPLE, { filename: 'outline.pdf', contentType: 'application/pdf' })
      .expect(400)
  })
})
