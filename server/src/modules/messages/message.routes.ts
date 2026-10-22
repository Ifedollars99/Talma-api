import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './message.controller.js'
import { listMessagesQuerySchema, messageIdParamSchema, sendMessageSchema } from './message.validation.js'

export const messagesRouter = Router()

messagesRouter.use(requireAuth)

messagesRouter.get('/', validate({ query: listMessagesQuerySchema }), controller.list)
messagesRouter.post('/', writeLimiter, validate({ body: sendMessageSchema }), controller.send)
messagesRouter.post(
  '/:id/read',
  validate({ params: messageIdParamSchema }),
  controller.markRead,
)
