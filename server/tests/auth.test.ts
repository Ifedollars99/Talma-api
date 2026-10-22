import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

describe('Authentication', () => {
  it('registers a student and returns an access token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'AishaBello',
        email: 'aisha@example.com',
        password: 'TalmaTest123',
        role: 'student',
      })
      .expect(201)

    expect(response.body.user.username).toBe('AishaBello')
    expect(response.body.user.role).toBe('student')
    expect(response.body.user.email).toBe('aisha@example.com')
    expect(response.body.accessToken).toBeTypeOf('string')
    // The password hash must never be exposed.
    expect(JSON.stringify(response.body)).not.toContain('passwordHash')
  })

  it('sets the refresh token in an HttpOnly cookie', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'CookieUser',
        email: 'cookie@example.com',
        password: 'TalmaTest123',
      })
      .expect(201)

    const cookie = (response.headers['set-cookie'] ?? [])[0] as string
    expect(cookie).toContain('talma_refresh=')
    expect(cookie).toContain('HttpOnly')
  })

  it('rejects a duplicate email', async () => {
    await registerUser({ email: 'duplicate@example.com' })
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'OtherUser',
        email: 'duplicate@example.com',
        password: 'TalmaTest123',
      })
      .expect(409)

    expect(response.body.error.code).toBe('CONFLICT')
  })

  it('rejects a duplicate username regardless of casing', async () => {
    await registerUser({ username: 'CaseUser' })
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'caseuser',
        email: 'different@example.com',
        password: 'TalmaTest123',
      })
      .expect(409)

    expect(response.body.error.code).toBe('CONFLICT')
  })

  it('validates the request body', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'not-an-email', password: '123' })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(response.body.error.details)).toBe(true)
  })

  it('signs in with the right password and rejects the wrong one', async () => {
    await registerUser({ email: 'login@example.com', password: 'TalmaTest123' })

    const success = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'TalmaTest123' })
      .expect(200)
    expect(success.body.accessToken).toBeTypeOf('string')

    const failure = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' })
      .expect(401)
    expect(failure.body.error.code).toBe('UNAUTHORIZED')
  })

  it('does not reveal whether an email exists', async () => {
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' })
      .expect(401)

    expect(unknown.body.error.message).toBe('Incorrect email or password')
  })

  it('returns the current user for a valid token', async () => {
    const user = await registerUser({ username: 'MeUser' })
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200)

    expect(response.body.user.username).toBe('MeUser')
  })

  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/auth/me').expect(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rotates the refresh token and revokes the old one', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'RotateUser',
        email: 'rotate@example.com',
        password: 'TalmaTest123',
      })
      .expect(201)

    const firstCookie = (registration.headers['set-cookie'] ?? [])[0] as string
    const oldToken = firstCookie.split(';')[0]?.split('=')[1] ?? ''

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`talma_refresh=${oldToken}`])
      .expect(200)

    const newCookie = (refreshed.headers['set-cookie'] ?? [])[0] as string
    const newToken = newCookie.split(';')[0]?.split('=')[1] ?? ''
    expect(newToken).not.toBe(oldToken)

    // Replaying the old token must be treated as a replay attack.
    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`talma_refresh=${oldToken}`])
      .expect(401)
    expect(replay.body.error.code).toBe('UNAUTHORIZED')
  })

  it('signs a user out and revokes the session', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'LogoutUser',
        email: 'logout@example.com',
        password: 'TalmaTest123',
      })
      .expect(201)

    const cookie = (registration.headers['set-cookie'] ?? [])[0] as string
    const token = cookie.split(';')[0]?.split('=')[1] ?? ''

    await request(app).post('/api/auth/logout').set('Cookie', [`talma_refresh=${token}`]).expect(204)

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`talma_refresh=${token}`])
      .expect(401)
    expect(refresh.body.error.code).toBe('UNAUTHORIZED')
  })

  it('completes a password reset flow', async () => {
    await registerUser({ email: 'reset@example.com' })

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' })
      .expect(200)

    expect(forgot.body.resetToken).toBeTypeOf('string')

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: forgot.body.resetToken, password: 'BrandNewPass123' })
      .expect(200)
    expect(reset.body.message).toContain('updated')

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'BrandNewPass123' })
      .expect(200)
  })

  it('rejects an invalid reset token', async () => {
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: 'BrandNewPass123' })
      .expect(400)
  })
})
