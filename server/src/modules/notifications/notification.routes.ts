import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './notification.controller.js'
import { notificationIdParamSchema } from './notification.validation.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get('/', controller.list)
notificationsRouter.post('/read-all', controller.markAllRead)
notificationsRouter.post(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  controller.markRead,
)
