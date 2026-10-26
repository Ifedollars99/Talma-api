import { z } from 'zod'
import { usernameSchema } from '../../common/validation/schemas.js'

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    region: z.string().trim().min(1).max(80).optional(),
    state: z.string().trim().max(80).optional(),
    language: z.string().trim().min(1).max(40).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    bio: z.string().trim().max(500, 'Your bio must be at most 500 characters').optional(),
    avatarUrl: z.union([z.string().trim().url().max(500), z.literal('')]).optional(),
    gender: z.enum(['male', 'female']).optional(),
    privacyPublic: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export const usernameParamSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid username'),
})

export const searchProfilesSchema = z.object({
  q: z.string().trim().max(80).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
