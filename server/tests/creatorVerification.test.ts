import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

describe('Creator verification and public profiles', () => {
  it('verifies a creator with the emailed code and updates their posts', async () => {
    const user = await registerUser({
      username: 'FutureCreator',
      email: 'future.creator@example.com',
      role: 'student',
    })

    // Create a post before verification so we can check the badge backfill.
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: 'A lesson before I became a creator.' })
      .expect(201)

    const requested = await request(app)
      .post('/api/creators/verify/request')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200)

    expect(requested.body.devCode).toMatch(/^\d{6}$/)

    await request(app)
      .post('/api/creators/verify/confirm')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ code: '000000' })
      .expect(400)

    const confirmed = await request(app)
      .post('/api/creators/verify/confirm')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ code: requested.body.devCode })
      .expect(200)

    expect(confirmed.body.user.creatorStatus).toBe('approved')
    expect(confirmed.body.user.role).toBe('creator')
    expect(confirmed.body.message).toContain('Welcome to being a creator')

    const profile = await request(app).get('/api/users/FutureCreator').expect(200)
    expect(profile.body.user.creatorStatus).toBe('approved')
    expect(profile.body.posts).toHaveLength(1)
    expect(profile.body.posts[0].authorRole).toBe('creator')
    expect(profile.body.posts[0].authorUsername).toBe('FutureCreator')
  })

  it('lets a user save a bio and gender and exposes them publicly', async () => {
    const user = await registerUser({
      username: 'BioUser',
      email: 'bio.user@example.com',
    })

    const updated = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        bio: 'Biology tutor from Accra.',
        gender: 'female',
        region: 'Ghana',
      })
      .expect(200)

    expect(updated.body.user.bio).toBe('Biology tutor from Accra.')
    expect(updated.body.user.gender).toBe('female')

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: 'Cells are the building blocks of life.' })
      .expect(201)

    const profile = await request(app).get('/api/users/BioUser').expect(200)
    expect(profile.body.user.bio).toBe('Biology tutor from Accra.')
    expect(profile.body.user.gender).toBe('female')
    expect(profile.body.user.region).toBe('Ghana')
    expect(profile.body.posts).toHaveLength(1)
    // The public profile must not leak the account email.
    expect(profile.body.user.email).toBeUndefined()
  })
})
