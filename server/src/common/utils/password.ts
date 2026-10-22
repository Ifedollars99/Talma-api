import argon2 from 'argon2'

/**
 * Argon2id parameters. Chosen to be memory-hard while still fast enough for an
 * interactive login on a small instance.
 */
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

/** Hashes a plaintext password with Argon2id. */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON_OPTIONS)
}

/** Verifies a plaintext password against an Argon2id hash. */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}
