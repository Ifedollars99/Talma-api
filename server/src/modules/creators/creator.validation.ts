import { z } from 'zod'
import { whatsappGroupUrlSchema } from '../../common/validation/whatsapp.js'

const creatorIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid creator id'),
})

export const applyCreatorSchema = z.object({
  displayName: z.string().trim().min(2, 'A display name is required').max(80),
  bio: z.string().trim().max(500).default(''),
  bankCode: z.string().trim().min(2, 'Choose your bank').max(10),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10,20}$/, 'Enter a valid bank account number'),
})

export const rejectCreatorSchema = z.object({
  reason: z.string().trim().min(2, 'Tell the creator why the application was rejected').max(500),
})

export const creatorVerificationSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the six-digit code from your email'),
  /**
   * New verifications must save a WhatsApp group/community link. It is optional
   * in the body because an existing profile link may already be on the account.
   */
  whatsappUrl: whatsappGroupUrlSchema.optional(),
})

export const creatorStatusQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
})

export const creatorIdParams = creatorIdParamSchema

export type ApplyCreatorInput = z.infer<typeof applyCreatorSchema>
export type RejectCreatorInput = z.infer<typeof rejectCreatorSchema>
