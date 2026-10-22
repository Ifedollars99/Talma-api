import request from 'supertest'
import type { Express } from 'express'
import { createApp } from '../src/app.js'

export const app: Express = createApp()

export interface AuthenticatedUser {
  accessToken: string
  userId: string
  email: string
  username: string
}

/** Registers a user and returns their access token plus cookies. */
export async function registerUser(
  overrides: Partial<{ username: string; email: string; password: string; role: 'student' | 'lecturer' }> = {},
): Promise<AuthenticatedUser & { cookies: string[] }> {
  const payload = {
    username: overrides.username ?? 'TestStudent',
    email: overrides.email ?? 'student@example.com',
    password: overrides.password ?? 'TalmaTest123',
    role: overrides.role ?? 'student',
  }

  const response = await request(app).post('/api/auth/register').send(payload).expect(201)

  return {
    accessToken: response.body.accessToken as string,
    userId: response.body.user.id as string,
    email: payload.email,
    username: payload.username,
    cookies: response.headers['set-cookie'] ?? [],
  }
}
