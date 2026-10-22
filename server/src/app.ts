import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { apiRouter } from './routes.js'
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler.js'
import { globalLimiter } from './common/middleware/rateLimit.js'
import { uploadRoot } from './modules/uploads/upload.service.js'

export function createApp() {
  const app = express()

  // Behind a reverse proxy (nginx, Render, Railway…) we need the real client IP.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    helmet({
      // The API only serves JSON and static files, so a strict CSP is safe here.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / server-to-server requests have no Origin header.
        if (!origin) {
          callback(null, true)
          return
        }
        if (env.corsOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin ${origin} is not allowed by the CORS policy`))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // AI chat carries compressed image attachments as data URLs, so it needs a
  // larger JSON limit. It must be registered before the global 1 MB parser.
  app.use('/api/ai/chat', express.json({ limit: '16mb' }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/api/health',
      },
    }),
  )

  app.use(globalLimiter)

  // Uploaded media (post images/videos and course outlines).
  app.use(
    '/uploads',
    express.static(uploadRoot, {
      maxAge: '7d',
      fallthrough: true,
      index: false,
    }),
  )

  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
