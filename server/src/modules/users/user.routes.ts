import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './user.controller.js'
import { updateProfileSchema, usernameParamSchema } from './user.validation.js'

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
  '/:username',
  validate({ params: usernameParamSchema }),
  controller.getProfile,
)
