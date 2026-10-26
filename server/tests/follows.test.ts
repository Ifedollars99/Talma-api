import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

async function verifyCreator(accessToken: string): Promise<void> {
  const verification = await request(app)
    .post('/api/creators/verify/request')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200)

  await request(app)
    .post('/api/creators/verify/confirm')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ code: verification.body.devCode })
    .expect(200)
}

describe('Creator search and follows', () => {
  it('searches public creators and keeps follow counters in sync', async () => {
    const viewer = await registerUser({
      username: 'SearchViewer',
      email: 'search-viewer@example.com',
    })
    const creator = await registerUser({
      username: 'SearchCreator',
      email: 'search-creator@example.com',
      role: 'lecturer',
    })
    await verifyCreator(creator.accessToken)

    const search = await request(app)
      .get('/api/users/search')
      .query({ q: 'SearchCreator' })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)

    expect(search.body.users).toHaveLength(1)
    expect(search.body.users[0]).toMatchObject({
      username: 'SearchCreator',
      creatorStatus: 'approved',
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
    })

    const selfSearch = await request(app)
      .get('/api/users/search')
      .query({ q: 'SearchViewer' })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(selfSearch.body.users).toHaveLength(0)

    const follow = await request(app)
      .post('/api/users/SearchCreator/follow')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(follow.body).toMatchObject({
      following: true,
      followerCount: 1,
      followingCount: 0,
      isFollowing: true,
    })

    const creatorProfile = await request(app)
      .get('/api/users/SearchCreator')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(creatorProfile.body.user).toMatchObject({
      followerCount: 1,
      followingCount: 0,
      isFollowing: true,
    })

    const viewerProfile = await request(app)
      .get('/api/users/SearchViewer')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(viewerProfile.body.user).toMatchObject({
      followerCount: 0,
      followingCount: 1,
      isFollowing: false,
    })

    const followers = await request(app)
      .get('/api/users/SearchCreator/followers')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(followers.body.users).toHaveLength(1)
    expect(followers.body.users[0]).toMatchObject({
      username: 'SearchViewer',
      isFollowing: false,
    })

    const following = await request(app)
      .get('/api/users/SearchViewer/following')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(following.body.users).toHaveLength(1)
    expect(following.body.users[0]).toMatchObject({
      username: 'SearchCreator',
      isFollowing: true,
    })

    const unfollow = await request(app)
      .delete('/api/users/SearchCreator/follow')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(unfollow.body).toMatchObject({
      following: false,
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
    })
  })

  it('rejects self-follows and hides private profiles from search', async () => {
    const viewer = await registerUser({
      username: 'PrivateViewer',
      email: 'private-viewer@example.com',
    })
    const privateUser = await registerUser({
      username: 'HiddenAccount',
      email: 'hidden-account@example.com',
    })

    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${privateUser.accessToken}`)
      .send({ privacyPublic: false })
      .expect(200)

    await request(app)
      .post('/api/users/PrivateViewer/follow')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(400)

    const search = await request(app)
      .get('/api/users/search')
      .query({ q: 'HiddenAccount' })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200)
    expect(search.body.users).toHaveLength(0)
  })
})
