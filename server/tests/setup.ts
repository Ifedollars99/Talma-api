import { afterAll, afterEach, beforeAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// The API reads its configuration from the environment at import time, so the
// test values must be in place before any application module is loaded.
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/talma-test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-different'
process.env.JWT_ACCESS_TTL = '15m'
process.env.JWT_REFRESH_TTL = '30d'
process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = 'false'
process.env.LOG_LEVEL = 'silent'
// Keep the suite offline: never send real email through Resend or SMTP.
process.env.EMAIL_PROVIDER = 'console'
process.env.RESEND_API_KEY = ''
process.env.MAIL_FROM = 'Talma <test@talma.local>'
process.env.MAIL_REPLY_TO = ''
process.env.SMTP_HOST = ''
process.env.SMTP_PORT = '587'
process.env.SMTP_SECURE = 'false'
process.env.SMTP_USER = ''
process.env.SMTP_PASS = ''
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.PUBLIC_API_URL = 'http://localhost:4000'
process.env.CLIENT_APP_URL = 'http://localhost:5173'
process.env.UPLOAD_DIR = 'uploads-test'
// Deterministic Paystack configuration for the video purchase tests. The
// network calls themselves are stubbed inside the tests.
process.env.PAYSTACK_SECRET_KEY = 'sk_test_talma'
process.env.PAYSTACK_CURRENCY = 'NGN'
process.env.VIDEO_DEFAULT_PRICE_KOBO = '200000'
process.env.VIDEO_MAX_UPLOAD_BYTES = '4294967296'
process.env.PLATFORM_VIDEO_SHARE_PERCENT = '30'
// Deterministic YouTube configuration. Tests that touch uploads stub the
// Google endpoints; other tests never call them.
process.env.YOUTUBE_CLIENT_ID = 'test-youtube-client-id'
process.env.YOUTUBE_CLIENT_SECRET = 'test-youtube-client-secret'
process.env.YOUTUBE_REFRESH_TOKEN = 'test-youtube-refresh-token'
process.env.YOUTUBE_CHANNEL_ID = 'UC_talma_test_channel'
process.env.YOUTUBE_CATEGORY_ID = '27'
// Keep the AI tests deterministic: no server key, free fallback on.
process.env.OPENAI_API_KEY = ''
process.env.FREE_AI_ENABLED = 'true'
process.env.FREE_AI_BASE_URL = 'https://text.pollinations.ai/v1'
process.env.FREE_AI_MODEL = 'openai-fast'

let mongo: MongoMemoryServer | null = null

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    // The first run has to download the mongod binary, which can take a while.
    instance: { launchTimeout: 180_000 },
  })
  process.env.MONGODB_URI = mongo.getUri('talma-test')
  await mongoose.connect(process.env.MONGODB_URI)
}, 600_000)

afterEach(async () => {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})
