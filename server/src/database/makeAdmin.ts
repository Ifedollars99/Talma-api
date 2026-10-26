/**
 * Promotes an existing account to the `admin` role.
 *
 *   npm run make:admin --workspace server -- you@example.com
 *
 * Administrators can publish and price videos from the Videos tab.
 */
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from './connect.js'
import { logger } from '../config/logger.js'
import { UserModel } from '../modules/users/user.model.js'

const email = process.argv[2]?.trim().toLowerCase()

async function makeAdmin(): Promise<void> {
  if (!email) {
    console.error('Usage: npm run make:admin --workspace server -- <email>')
    process.exitCode = 1
    return
  }

  await connectDatabase()

  const user = await UserModel.findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { new: true },
  )

  if (!user) {
    console.error(`No account found for ${email}`)
    process.exitCode = 1
  } else {
    logger.info({ email: user.email, username: user.username }, 'Account promoted to admin')
  }

  await disconnectDatabase()
}

makeAdmin().catch(async (error) => {
  logger.error({ err: error }, 'Could not promote the account')
  await mongoose.disconnect().catch(() => undefined)
  process.exitCode = 1
})
