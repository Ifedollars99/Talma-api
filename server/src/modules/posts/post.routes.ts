import { Router } from 'express'
import { optionalAuth, requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './post.controller.js'
import { createPostSchema, feedQuerySchema, postIdParamSchema } from './post.validation.js'

export const postsRouter = Router()

postsRouter.get('/', optionalAuth, validate({ query: feedQuerySchema }), controller.list)
postsRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate({ body: createPostSchema }),
  controller.create,
)
postsRouter.post(
  '/:id/like',
  requireAuth,
  writeLimiter,
  validate({ params: postIdParamSchema }),
  controller.like,
)
postsRouter.delete(
  '/:id/like',
  requireAuth,
  writeLimiter,
  validate({ params: postIdParamSchema }),
  controller.unlike,
)
postsRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: postIdParamSchema }),
  controller.remove,
)
