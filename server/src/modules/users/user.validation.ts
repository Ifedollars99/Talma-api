import { z } from 'zod'
import { usernameSchema } from '../../common/validation/schemas.js'

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    region: z.string().trim().min(1).max(80).optional(),
    language: z.string().trim().min(1).max(40).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
