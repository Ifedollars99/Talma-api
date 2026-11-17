import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './home.controller.js'
import { createAdvertisementSchema } from './advertisement.validation.js'

export const homeRouter = Router()

homeRouter.use(requireAuth)

homeRouter.get('/', controller.getHome)
homeRouter.post(
  '/advertisements',
  writeLimiter,
  validate({ body: createAdvertisementSchema }),
  controller.createAdvertisement,
)
