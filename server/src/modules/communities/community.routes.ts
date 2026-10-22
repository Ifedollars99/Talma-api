import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './community.controller.js'
import {
  communityIdParamSchema,
  createCommunitySchema,
  listCommunitiesQuerySchema,
} from './community.validation.js'

export const communitiesRouter = Router()

communitiesRouter.use(requireAuth)

communitiesRouter.get('/', validate({ query: listCommunitiesQuerySchema }), controller.list)
communitiesRouter.get('/mine', controller.mine)
communitiesRouter.post(
  '/',
  writeLimiter,
  validate({ body: createCommunitySchema }),
  controller.create,
)
communitiesRouter.post(
  '/:id/join',
  validate({ params: communityIdParamSchema }),
  controller.join,
)
communitiesRouter.post(
  '/:id/leave',
  validate({ params: communityIdParamSchema }),
  controller.leave,
)
