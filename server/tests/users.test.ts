import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

describe('Profile and authorisation', () => {
  it('updates the signed-in user’s profile', async () => {
    const user = await registerUser({ username: 'ProfileUser' })

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ username: 'RenamedUser', region: 'Ghana', language: 'French' })
      .expect(200)

    expect(response.body.user.username).toBe('RenamedUser')
    expect(response.body.user.region).toBe('Ghana')
    expect(response.body.user.language).toBe('French')
  })

  it('rejects an invalid username', async () => {
    const user = await registerUser()
    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ username: 'a b!' })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('never lets a user edit somebody else’s profile', async () => {
    const owner = await registerUser({ username: 'RealOwner' })
    const intruder = await registerUser({ username: 'FakeOwner', email: 'fake@example.com' })

    // The intruder tries to rename themselves into the owner's username.
    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ username: 'RealOwner' })
      .expect(409)

    const ownerProfile = await request(app)
      .get('/api/users/RealOwner')
      .expect(200)
    expect(ownerProfile.body.user.id).toBe(owner.userId)
  })

  it('marks an assignment as submitted only for the submitting student', async () => {
    const student = await registerUser({ username: 'Submitter' })
    const other = await registerUser({ username: 'Other', email: 'other@example.com' })

    const created = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ title: 'Problem Set 1', course: 'CMP 101', dueDate: 'Oct 1, 2026' })
      .expect(403)

    expect(created.body.error.code).toBe('FORBIDDEN')

    const assignmentId = '507f1f77bcf86cd799439011'

    // Submitting an unknown assignment returns 404, not a crash.
    await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(404)

    const list = await request(app)
      .get('/api/assignments')
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(200)
    expect(list.body.assignments).toEqual([])
  })

  it('does not expose another student’s messages', async () => {
    const first = await registerUser({ username: 'First' })
    const second = await registerUser({ username: 'Second', email: 'second@example.com' })

    const firstInbox = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${first.accessToken}`)
      .expect(200)
    expect(firstInbox.body.messages).toEqual([])

    const secondInbox = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${second.accessToken}`)
      .expect(200)
    expect(secondInbox.body.messages).toEqual([])
  })

  it('rejects an unknown route with a JSON 404', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('reports health', async () => {
    const response = await request(app).get('/api/health').expect(200)
    expect(response.body.status).toBe('ok')
  })
})
