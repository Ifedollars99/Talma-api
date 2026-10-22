import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { aiLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './ai.controller.js'
import { chatSchema } from './ai.validation.js'

export const aiRouter = Router()

aiRouter.use(requireAuth)

aiRouter.get('/status', controller.status)
aiRouter.post('/chat', aiLimiter, validate({ body: chatSchema }), controller.chat)
