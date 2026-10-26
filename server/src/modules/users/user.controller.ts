import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/AppError.js'
import * as userService from './user.service.js'
import type { UpdateProfileInput } from './user.validation.js'

/** PATCH /api/users/me */
export async function updateMe(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateProfileInput
  const user = await userService.updateProfile(req.userId as string, body)
  res.json({ user })
}

/** GET /api/users/me */
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await userService.getPublicUser(req.userId as string)
  res.json({ user })
}

/** DELETE /api/users/me */
export async function deleteMe(req: Request, res: Response): Promise<void> {
  await userService.deleteAccount(req.userId as string)
  res.status(204).send()
}

/** POST /api/users/me/password */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string
    newPassword: string
  }
  await userService.changePassword(req.userId as string, currentPassword, newPassword)
  res.json({ message: 'Your password has been updated. Please sign in again.' })
}

/** GET /api/users/:username */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const username = String(req.params.username ?? '')
  if (!username) {
    throw AppError.badRequest('A username is required')
  }
  const profile = await userService.getPublicProfile(username, req.userId)
  res.json(profile)
}

/** GET /api/users/search?q=... */
export async function search(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === 'string' ? req.query.q : ''
  const users = await userService.searchProfiles(query, req.userId)
  res.json({ users })
}

/** GET /api/users/:username/followers */
export async function followers(req: Request, res: Response): Promise<void> {
  const users = await userService.listFollowers(String(req.params.username ?? ''), req.userId)
  res.json({ users })
}

/** GET /api/users/:username/following */
export async function following(req: Request, res: Response): Promise<void> {
  const users = await userService.listFollowing(String(req.params.username ?? ''), req.userId)
  res.json({ users })
}

/** POST /api/users/:username/follow */
export async function follow(req: Request, res: Response): Promise<void> {
  const social = await userService.followProfile(
    String(req.params.username ?? ''),
    req.userId as string,
  )
  res.json({ following: true, ...social })
}

/** DELETE /api/users/:username/follow */
export async function unfollow(req: Request, res: Response): Promise<void> {
  const social = await userService.unfollowProfile(
    String(req.params.username ?? ''),
    req.userId as string,
  )
  res.json({ following: false, ...social })
}
