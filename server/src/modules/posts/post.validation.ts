import { z } from 'zod'
import { mediaTypeSchema } from '../../common/validation/schemas.js'
import { paginationQuery } from '../../common/utils/pagination.js'

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write something before sharing')
    .max(5000, 'That post is too long'),
  subject: z.string().trim().max(120).optional(),
  mediaType: mediaTypeSchema.default('none'),
  mediaUrl: z.string().trim().max(500).optional(),
})

export const feedQuerySchema = paginationQuery.extend({
  feed: z.enum(['foryou', 'following', 'discover']).default('foryou'),
  search: z.string().trim().max(120).optional(),
})

export const postIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid post id'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type FeedQuery = z.infer<typeof feedQuerySchema>
