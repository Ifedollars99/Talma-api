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

describe('Community home advertisements', () => {
  it('requires a signed-in account before posting', async () => {
    await request(app)
      .post('/api/home/advertisements')
      .send({
        kind: 'school',
        title: 'Unauthorised Academy',
        subtitle: 'Admissions open',
        description: 'This request should never reach the database.',
        location: 'Lagos',
        ctaUrl: 'https://example.com/unauthorised',
      })
      .expect(401)
  })

  it('lets a Student advertise a school', async () => {
    const student = await registerUser({
      username: 'SchoolAdvertiser',
      email: 'school.advertiser@example.com',
    })

    const payload = {
      kind: 'school',
      title: 'Sunrise Model College',
      subtitle: 'Admissions open for JSS 1',
      description: 'A community secondary school with science labs and after-school tutoring.',
      location: 'Ikeja, Lagos',
      ctaUrl: 'https://example.com/sunrise-model-college',
    }

    const created = await request(app)
      .post('/api/home/advertisements')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send(payload)
      .expect(201)

    expect(created.body.advertisement).toMatchObject({
      kind: 'school',
      title: payload.title,
      authorUsername: 'SchoolAdvertiser',
      badge: 'Admissions',
      ctaLabel: 'Learn more',
    })

    const home = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    expect(home.body.schoolAds[0]).toMatchObject({
      kind: 'school',
      title: payload.title,
      authorUsername: 'SchoolAdvertiser',
    })
    expect(home.body.teachingAds.every((ad: { kind: string }) => ad.kind === 'teaching')).toBe(
      true,
    )
  })

  it('lets a Student post a teaching job', async () => {
    const student = await registerUser({
      username: 'JobPoster',
      email: 'job.poster@example.com',
    })

    const payload = {
      kind: 'teaching',
      title: 'Government Teacher (Physics)',
      subtitle: 'Crown Heights College',
      description: 'Full-time physics teacher needed for senior secondary classes. Apply online.',
      location: 'Abuja, FCT · Full-time',
      ctaUrl: 'https://example.com/jobs/physics-teacher',
    }

    const created = await request(app)
      .post('/api/home/advertisements')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send(payload)
      .expect(201)

    expect(created.body.advertisement).toMatchObject({
      kind: 'teaching',
      title: payload.title,
      authorUsername: 'JobPoster',
      badge: 'Job opportunity',
      ctaLabel: 'Apply now',
    })

    const home = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200)

    expect(home.body.teachingAds[0]).toMatchObject({
      kind: 'teaching',
      title: payload.title,
      authorUsername: 'JobPoster',
    })
  })

  it('rejects an advert with an invalid link', async () => {
    const student = await registerUser({
      username: 'InvalidAdvertiser',
      email: 'invalid.advertiser@example.com',
    })

    await request(app)
      .post('/api/home/advertisements')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        kind: 'school',
        title: 'Linkless Academy',
        subtitle: 'Admissions open',
        description: 'This advert has an invalid contact link.',
        location: 'Lagos',
        ctaUrl: 'not-a-link',
      })
      .expect(422)
  })
})
