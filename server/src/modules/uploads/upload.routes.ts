import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import { writeLimiter } from '../../common/middleware/rateLimit.js'
import * as controller from './upload.controller.js'

export const uploadsRouter = Router()

uploadsRouter.use(requireAuth)

uploadsRouter.post('/post-media', writeLimiter, controller.uploadPostMedia)
uploadsRouter.post('/avatar', writeLimiter, controller.uploadAvatar)
uploadsRouter.post('/course-pdf', writeLimiter, controller.uploadCoursePdf)
