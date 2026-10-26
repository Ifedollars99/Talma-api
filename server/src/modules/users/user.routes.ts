import { Router } from 'express'
import { z } from 'zod'
import { optionalAuth, requireAuth } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './user.controller.js'
import {
  searchProfilesSchema,
  updateProfileSchema,
  usernameParamSchema,
} from './user.validation.js'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Your current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const usersRouter = Router()

usersRouter.patch('/me', requireAuth, validate({ body: updateProfileSchema }), controller.updateMe)
usersRouter.get('/me', requireAuth, controller.getMe)
usersRouter.post(
  '/me/password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
)
usersRouter.delete('/me', requireAuth, controller.deleteMe)
usersRouter.get(
  '/search',
  optionalAuth,
  validate({ query: searchProfilesSchema }),
  controller.search,
)
usersRouter.get(
  '/:username/followers',
  optionalAuth,
  validate({ params: usernameParamSchema }),
  controller.followers,
)
usersRouter.get(
  '/:username/following',
  optionalAuth,
  validate({ params: usernameParamSchema }),
  controller.following,
)
usersRouter.post(
  '/:username/follow',
  requireAuth,
  validate({ params: usernameParamSchema }),
  controller.follow,
)
usersRouter.delete(
  '/:username/follow',
  requireAuth,
  validate({ params: usernameParamSchema }),
  controller.unfollow,
)
usersRouter.get(
  '/:username',
  optionalAuth,
  validate({ params: usernameParamSchema }),
  controller.getProfile,
)
