import { createServer } from 'node:http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './database/connect.js'
import { ensureUploadDirs } from './modules/uploads/upload.service.js'

async function main(): Promise<void> {
  ensureUploadDirs()

  await connectDatabase()

  const app = createApp()
  const server = createServer(app)

  server.listen(env.PORT, env.HOST, () => {
    logger.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
      'Talma API is listening',
    )
  })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down')
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
    // Do not hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection')
  })
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception')
    process.exit(1)
  })
}

main().catch((error) => {
  logger.error({ err: error }, 'Failed to start the Talma API')
  process.exit(1)
})
