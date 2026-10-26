import { Router } from 'express'
import { requireAuth, requireRole } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './creator.controller.js'
import {
  applyCreatorSchema,
  creatorIdParams,
  creatorStatusQuerySchema,
  creatorVerificationSchema,
  rejectCreatorSchema,
} from './creator.validation.js'

export const creatorsRouter = Router()

creatorsRouter.use(requireAuth)

creatorsRouter.get('/me', controller.me)
creatorsRouter.get('/banks', controller.banks)
creatorsRouter.post('/verify/request', writeLimiter, controller.requestVerification)
creatorsRouter.post(
  '/verify/confirm',
  writeLimiter,
  validate({ body: creatorVerificationSchema }),
  controller.confirmVerification,
)
creatorsRouter.post(
  '/apply',
  writeLimiter,
  validate({ body: applyCreatorSchema }),
  controller.apply,
)

// Admin review queue.
creatorsRouter.get(
  '/',
  requireRole('admin'),
  validate({ query: creatorStatusQuerySchema }),
  controller.list,
)
creatorsRouter.post(
  '/:id/approve',
  requireRole('admin'),
  validate({ params: creatorIdParams }),
  controller.approve,
)
creatorsRouter.post(
  '/:id/reject',
  requireRole('admin'),
  writeLimiter,
  validate({ params: creatorIdParams, body: rejectCreatorSchema }),
  controller.reject,
)
