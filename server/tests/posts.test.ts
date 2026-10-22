import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, registerUser } from './helpers.js'

describe('Posts', () => {
  it('creates a post for an authenticated user', async () => {
    const user = await registerUser({ username: 'Poster' })

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: 'Here are the lecture notes for today.', subject: 'Mathematics' })
      .expect(201)

    expect(response.body.post.content).toContain('lecture notes')
    expect(response.body.post.author).toBe('Poster')
    expect(response.body.post.likes).toBe(0)
    expect(response.body.post.canDelete).toBe(true)
  })

  it('refuses to create a post without authentication', async () => {
    await request(app).post('/api/posts').send({ content: 'Anonymous' }).expect(401)
  })

  it('validates the post body', async () => {
    const user = await registerUser()
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: '' })
      .expect(422)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('lists posts newest first and paginates', async () => {
    const user = await registerUser()
    for (const content of ['First post', 'Second post', 'Third post']) {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ content })
        .expect(201)
    }

    const response = await request(app).get('/api/posts?limit=2').expect(200)
    expect(response.body.items).toHaveLength(2)
    expect(response.body.total).toBe(3)
    expect(response.body.hasNextPage).toBe(true)
  })

  it('searches posts', async () => {
    const user = await registerUser()
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: 'Euler method explained', subject: 'Mathematics' })
      .expect(201)
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ content: 'Photosynthesis basics', subject: 'Biology' })
      .expect(201)

    const response = await request(app).get('/api/posts?feed=discover&search=euler').expect(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].content).toContain('Euler')
  })

  it('likes and unlikes a post', async () => {
    const author = await registerUser({ username: 'Author' })
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.accessToken}`)
      .send({ content: 'Likeable content' })
      .expect(201)

    const postId = created.body.post.id as string

    const liked = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${author.accessToken}`)
      .expect(200)
    expect(liked.body.post.likes).toBe(1)
    expect(liked.body.post.likedByMe).toBe(true)

    const unliked = await request(app)
      .delete(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${author.accessToken}`)
      .expect(200)
    expect(unliked.body.post.likes).toBe(0)
  })

  it('prevents one student from deleting another student’s post', async () => {
    const author = await registerUser({ username: 'Owner' })
    const intruder = await registerUser({ username: 'Intruder', email: 'intruder@example.com' })

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.accessToken}`)
      .send({ content: 'My private notes' })
      .expect(201)

    const response = await request(app)
      .delete(`/api/posts/${created.body.post.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('lets the author delete their own post', async () => {
    const author = await registerUser({ username: 'Owner2' })
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.accessToken}`)
      .send({ content: 'Delete me' })
      .expect(201)

    await request(app)
      .delete(`/api/posts/${created.body.post.id}`)
      .set('Authorization', `Bearer ${author.accessToken}`)
      .expect(204)

    const feed = await request(app).get('/api/posts').expect(200)
    expect(feed.body.total).toBe(0)
  })

  it('shows the lecturer feed separately from the general feed', async () => {
    const lecturer = await registerUser({ username: 'DrLecturer', role: 'lecturer' })
    const student = await registerUser({ username: 'Student2', email: 'student2@example.com' })

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${lecturer.accessToken}`)
      .send({ content: 'Lecture slides uploaded' })
      .expect(201)
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ content: 'Study group forming' })
      .expect(201)

    const forYou = await request(app).get('/api/posts?feed=foryou').expect(200)
    expect(forYou.body.total).toBe(2)

    const following = await request(app).get('/api/posts?feed=following').expect(200)
    expect(following.body.total).toBe(1)
    expect(following.body.items[0].authorRole).toBe('lecturer')
  })
})
