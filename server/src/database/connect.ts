import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Connects to MongoDB. Safe to call more than once — subsequent calls reuse
 * the existing connection.
 */
export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose
  }

  mongoose.set('strictQuery', true)

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    autoIndex: !env.isProduction,
  })

  logger.info({ db: connection.connection.name }, 'Connected to MongoDB')

  connection.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error')
  })
  connection.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost')
  })

  return mongoose
}

/** Closes the MongoDB connection (used on shutdown and in tests). */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
  logger.info('Disconnected from MongoDB')
}
