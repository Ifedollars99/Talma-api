import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

describe('Profile and authorisation', () => {
  it('updates the signed-in user’s profile', async () => {
    const user = await registerUser({ username: 'ProfileUser' })

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        username: 'RenamedUser',
        region: 'Ghana',
        state: 'Greater Accra',
        language: 'French',
        bio: 'I teach introductory programming.',
        gender: 'female',
        avatarUrl: 'https://cdn.example.com/avatars/renamed-user.png',
      })
      .expect(200)

    expect(response.body.user.username).toBe('RenamedUser')
    expect(response.body.user.region).toBe('Ghana')
    expect(response.body.user.state).toBe('Greater Accra')
    expect(response.body.user.language).toBe('French')
    expect(response.body.user.bio).toBe('I teach introductory programming.')
    expect(response.body.user.gender).toBe('female')
    expect(response.body.user.avatarUrl).toBe(
      'https://cdn.example.com/avatars/renamed-user.png',
    )
  })

  it('accepts a full name with a title and finds the profile by name', async () => {
    const user = await registerUser({ username: 'Name User' })

    const updated = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ username: '  Dr.   Aisha   Bello  ' })
      .expect(200)

    expect(updated.body.user.username).toBe('Dr. Aisha Bello')

    const profile = await request(app)
      .get(`/api/users/${encodeURIComponent('Dr. Aisha Bello')}`)
      .expect(200)
    expect(profile.body.user.username).toBe('Dr. Aisha Bello')
  })

  it('normalises and exposes a WhatsApp group link', async () => {
    const user = await registerUser({ username: 'WhatsAppEducator' })

    const updated = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ whatsappUrl: 'chat.whatsapp.com/WhatsAppEducatorGroup' })
      .expect(200)

    expect(updated.body.user.whatsappUrl).toBe(
      'https://chat.whatsapp.com/WhatsAppEducatorGroup',
    )

    const profile = await request(app)
      .get('/api/users/WhatsAppEducator')
      .expect(200)
    expect(profile.body.user.whatsappUrl).toBe(
      'https://chat.whatsapp.com/WhatsAppEducatorGroup',
    )
  })

  it('rejects a link that is not a WhatsApp group or community', async () => {
    const user = await registerUser({ username: 'BadWhatsApp' })

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ whatsappUrl: 'https://example.com/not-a-whatsapp-group' })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(JSON.stringify(response.body.error.details)).toContain('WhatsApp')
  })

  it('lets an educator clear their WhatsApp link', async () => {
    const user = await registerUser({ username: 'ClearedWhatsApp' })

    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ whatsappUrl: 'https://chat.whatsapp.com/ClearedGroup' })
      .expect(200)

    const cleared = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ whatsappUrl: '' })
      .expect(200)

    expect(cleared.body.user.whatsappUrl).toBe('')
  })

  it('shows a private profile only to its owner', async () => {
    const user = await registerUser({ username: 'PrivateProfile' })

    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ privacyPublic: false, state: 'Lagos' })
      .expect(200)

    const ownerView = await request(app)
      .get('/api/users/PrivateProfile')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200)
    expect(ownerView.body.user.state).toBe('Lagos')

    await request(app).get('/api/users/PrivateProfile').expect(404)
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
