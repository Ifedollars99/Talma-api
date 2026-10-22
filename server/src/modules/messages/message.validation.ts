import { z } from 'zod'

export const listMessagesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
})

export const messageIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'),
})

export const sendMessageSchema = z.object({
  subject: z.string().trim().min(1, 'A subject is required').max(160),
  body: z.string().trim().min(1, 'Write a message').max(4000),
  recipient: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid recipient id').optional(),
})

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
