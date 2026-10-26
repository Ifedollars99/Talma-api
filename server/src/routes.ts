import { Router } from 'express'
import { getEmailStatus } from './common/email/mailer.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/user.routes.js'
import { postsRouter } from './modules/posts/post.routes.js'
import { coursesRouter } from './modules/courses/course.routes.js'
import { communitiesRouter } from './modules/communities/community.routes.js'
import { messagesRouter } from './modules/messages/message.routes.js'
import { assignmentsRouter } from './modules/assignments/assignment.routes.js'
import { notificationsRouter } from './modules/notifications/notification.routes.js'
import { testsRouter } from './modules/tests/test.routes.js'
import { uploadsRouter } from './modules/uploads/upload.routes.js'
import { videosRouter } from './modules/videos/video.routes.js'
import { creatorsRouter } from './modules/creators/creator.routes.js'
import { aiRouter } from './modules/ai/ai.routes.js'

/** Every API route lives under `/api`. */
export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  const email = getEmailStatus()
  res.json({
    status: 'ok',
    service: 'talma-api',
    uptime: process.uptime(),
    email: { provider: email.provider, configured: email.configured },
  })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/courses', coursesRouter)
apiRouter.use('/communities', communitiesRouter)
apiRouter.use('/messages', messagesRouter)
apiRouter.use('/assignments', assignmentsRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/tests', testsRouter)
apiRouter.use('/uploads', uploadsRouter)
apiRouter.use('/videos', videosRouter)
apiRouter.use('/creators', creatorsRouter)
apiRouter.use('/ai', aiRouter)
