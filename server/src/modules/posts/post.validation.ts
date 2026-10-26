import { z } from 'zod'
import { mediaTypeSchema } from '../../common/validation/schemas.js'
import { VIDEO_CLASS_LEVELS, VIDEO_SUBJECTS } from '../videos/video.options.js'
import { paginationQuery } from '../../common/utils/pagination.js'

const subjectField = z.enum(VIDEO_SUBJECTS, {
  errorMap: () => ({ message: 'Choose a valid subject' }),
})

const classLevelField = z.enum(VIDEO_CLASS_LEVELS, {
  errorMap: () => ({ message: 'Choose a valid class level' }),
})

export const createPostSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Write something before sharing')
      .max(5000, 'That post is too long'),
    subject: subjectField.optional(),
    classLevel: classLevelField.optional(),
    mediaType: mediaTypeSchema.default('none'),
    mediaUrl: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    // Video posts are teaching material, so the catalogue metadata is required.
    if (value.mediaType !== 'video') return

    if (!value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Choose the subject this video teaches',
      })
    }
    if (!value.classLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['classLevel'],
        message: 'Choose the class level this video is for',
      })
    }
  })

export const feedQuerySchema = paginationQuery.extend({
  feed: z.enum(['foryou', 'following']).default('foryou'),
  search: z.string().trim().max(120).optional(),
})

export const postIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid post id'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type FeedQuery = z.infer<typeof feedQuerySchema>
