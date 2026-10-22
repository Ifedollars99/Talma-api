import { z } from 'zod'

const IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/

const imageSchema = z
  .string()
  .max(4_000_000, 'Each picture must be smaller than about 3 MB')
  .regex(IMAGE_DATA_URL, 'Only PNG, JPEG, WebP or GIF pictures are supported')

const chatMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().max(12_000).default(''),
    images: z.array(imageSchema).max(4, 'Attach at most 4 pictures per message').optional(),
  })
  .superRefine((message, ctx) => {
    if (!message.content && !message.images?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A message needs text or at least one picture',
        path: ['content'],
      })
    }

    if (message.role === 'assistant' && message.images?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Assistant messages cannot contain pictures',
        path: ['images'],
      })
    }
  })

/**
 * The browser only ever sends the conversation history. Model, temperature and
 * system prompts are decided by the server so they cannot be overridden.
 */
export const chatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  mode: z.enum(['general', 'study']).default('general'),
  level: z.enum(['primary', 'secondary', 'university']).default('university'),
})

export type ChatInput = z.infer<typeof chatSchema>
