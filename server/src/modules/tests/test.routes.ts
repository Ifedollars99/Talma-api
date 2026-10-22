import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './test.controller.js'
import { attemptIdParamSchema, startTestSchema, submitTestSchema } from './test.validation.js'

export const testsRouter = Router()

testsRouter.use(requireAuth)

testsRouter.get('/faculties', controller.faculties)
testsRouter.get('/attempts', controller.attempts)
testsRouter.post('/start', validate({ body: startTestSchema }), controller.start)
testsRouter.post(
  '/:id/submit',
  validate({ params: attemptIdParamSchema, body: submitTestSchema }),
  controller.submit,
)
