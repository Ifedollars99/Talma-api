import { Router } from 'express'
import { requireAuth, requireRole } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './assignment.controller.js'
import { assignmentIdParamSchema, createAssignmentSchema } from './assignment.validation.js'

export const assignmentsRouter = Router()

assignmentsRouter.use(requireAuth)

assignmentsRouter.get('/', controller.list)
assignmentsRouter.post(
  '/',
  requireRole('lecturer', 'admin'),
  writeLimiter,
  validate({ body: createAssignmentSchema }),
  controller.create,
)
assignmentsRouter.post(
  '/:id/submit',
  validate({ params: assignmentIdParamSchema }),
  controller.submit,
)
