import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'
import { UserModel } from '../src/modules/users/user.model.js'

const PUBLIC_WHATSAPP = 'https://chat.whatsapp.com/HomeMathsCircle'

/** Registers an educator, marks them approved and optionally saves a link. */
async function registerApprovedEducator(options: {
  username: string
  email: string
  whatsappUrl?: string
}) {
  const user = await registerUser({
    username: options.username,
    email: options.email,
    role: 'creator',
  })

  await UserModel.updateOne(
    { _id: user.userId },
    {
      $set: {
        creatorStatus: 'approved',
        creatorVerifiedAt: new Date(),
        whatsappUrl: options.whatsappUrl ?? '',
      },
    },
  )

  return user
}

describe('Home content', () => {
  it('requires a signed-in viewer', async () => {
    await request(app).get('/api/home').expect(401)
  })

  it('returns verified educators with WhatsApp links and the ad placements', async () => {
    const viewer = await registerUser({
      username: 'HomeViewer',
      email: 'home.viewer@example.com',
    })

    await registerApprovedEducator({
      username: 'HomeTeacher',
      email: 'home.teacher@example.com',
      whatsappUrl: PUBLIC_WHATSAPP,
    })

    // Approved but private, so it must not appear in the spotlight.
    const privateEducator = await registerApprovedEducator({
      username: 'PrivateTeacher',
      email: 'private.teacher@example.com',
      whatsappUrl: 'https://chat.whatsapp.com/PrivateCircle',
    })
    await UserModel.updateOne(
      { _id: privateEducator.userId },
      { $set: { privacyPublic: false } },
    )

    // Approved but without a link, so there is nothing to join.
    await registerApprovedEducator({
      username: 'NoLinkTeacher',
      email: 'no.link.teacher@example.com',
    })

    // A Student account never appears in the educator spotlight.
    const student = await registerUser({
      username: 'HomeStudent',
      email: 'home.student@example.com',
    })
    await UserModel.updateOne(
      { _id: student.userId },
      { $set: { creatorStatus: 'approved', whatsappUrl: PUBLIC_WHATSAPP } },
    )

    const response = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)

    expect(response.body.educators).toHaveLength(1)
    expect(response.body.educators[0]).toMatchObject({
      username: 'HomeTeacher',
      role: 'creator',
      creatorStatus: 'approved',
      whatsappUrl: PUBLIC_WHATSAPP,
    })

    expect(response.body.schoolAds.length).toBeGreaterThan(0)
    for (const ad of response.body.schoolAds) {
      expect(ad.kind).toBe('school')
      expect(ad.title).toBeTruthy()
      expect(ad.ctaUrl).toMatch(/^https:\/\//)
    }

    expect(response.body.teachingAds.length).toBeGreaterThan(0)
    for (const ad of response.body.teachingAds) {
      expect(ad.kind).toBe('teaching')
      expect(ad.title).toBeTruthy()
      expect(ad.ctaUrl).toMatch(/^https:\/\//)
    }
  })
})
