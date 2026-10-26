import { Router } from 'express'
import {
  optionalAuth,
  requireAuth,
  requireCreator,
  requireRole,
} from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import { validate } from '../../common/middleware/validate.js'
import * as controller from './video.controller.js'
import {
  approveVideoSchema,
  completeVideoUploadSchema,
  createVideoSchema,
  rejectVideoSchema,
  startVideoUploadSchema,
  updateVideoSchema,
  verifyPurchaseSchema,
  videoIdParamSchema,
} from './video.validation.js'

export const videosRouter = Router()

// Public catalogue. Signed-in viewers get their purchase state merged in.
videosRouter.get('/', optionalAuth, controller.list)
videosRouter.get('/:id/thumbnail', validate({ params: videoIdParamSchema }), controller.thumbnail)

// Buyer endpoints.
videosRouter.post(
  '/purchases/verify',
  requireAuth,
  writeLimiter,
  validate({ body: verifyPurchaseSchema }),
  controller.verifyPurchase,
)
videosRouter.post(
  '/:id/checkout',
  requireAuth,
  writeLimiter,
  validate({ params: videoIdParamSchema }),
  controller.checkout,
)
videosRouter.get(
  '/:id/watch',
  requireAuth,
  validate({ params: videoIdParamSchema }),
  controller.watch,
)

// Creator endpoints.
videosRouter.get('/mine', requireAuth, controller.mine)
videosRouter.get('/review', requireAuth, requireRole('admin'), controller.reviewQueue)
videosRouter.post(
  '/uploads',
  requireAuth,
  requireCreator,
  writeLimiter,
  validate({ body: startVideoUploadSchema }),
  controller.startUpload,
)
videosRouter.post(
  '/:id/upload-complete',
  requireAuth,
  requireCreator,
  writeLimiter,
  validate({ params: videoIdParamSchema, body: completeVideoUploadSchema }),
  controller.completeUpload,
)

// Admin review actions.
videosRouter.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  writeLimiter,
  validate({ params: videoIdParamSchema, body: approveVideoSchema }),
  controller.approve,
)
videosRouter.post(
  '/:id/reject',
  requireAuth,
  requireRole('admin'),
  writeLimiter,
  validate({ params: videoIdParamSchema, body: rejectVideoSchema }),
  controller.reject,
)

// Legacy admin catalogue management (paste an existing YouTube link).
videosRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  writeLimiter,
  validate({ body: createVideoSchema }),
  controller.create,
)

videosRouter.get('/:id', optionalAuth, validate({ params: videoIdParamSchema }), controller.detail)
videosRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  writeLimiter,
  validate({ params: videoIdParamSchema, body: updateVideoSchema }),
  controller.update,
)
videosRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: videoIdParamSchema }),
  controller.remove,
)
