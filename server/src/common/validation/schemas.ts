import { z } from 'zod'

/**
 * Reusable field schemas shared across the module validation files so the API
 * contract stays consistent (and errors read the same way everywhere).
 */
export const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier')

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')

/**
 * Roles the public sign-up form may create. `student`/`lecturer` stay valid so
 * older accounts and seeded data continue to work.
 */
export const roleSchema = z.enum(['user', 'creator', 'student', 'lecturer'])

export const mediaTypeSchema = z.enum(['none', 'image', 'video'])
