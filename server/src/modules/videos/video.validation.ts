import { z } from 'zod'
import { env } from '../../config/env.js'
import { VIDEO_CLASS_LEVELS, VIDEO_MAX_PERIODS, VIDEO_SUBJECTS } from './video.options.js'

/** Every Talma id is a MongoDB ObjectId. */
export const videoIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid video id'),
})

const youtubeUrlField = z
  .string()
  .trim()
  .min(5, 'Paste the YouTube link for this video')
  .max(500)
const titleField = z.string().trim().min(2, 'A title is required').max(160)
const descriptionField = z.string().trim().max(2000)
const durationField = z.coerce.number().int().min(0).max(43_200)
const priceField = z.coerce.number().min(0).max(1_000_000)
const subjectField = z.enum(VIDEO_SUBJECTS, {
  errorMap: () => ({ message: 'Choose a subject from the list' }),
})
const classLevelField = z.enum(VIDEO_CLASS_LEVELS, {
  errorMap: () => ({ message: 'Choose a class level from the list' }),
})
const periodNumberField = z.coerce
  .number()
  .int('The period must be a whole number')
  .min(1, 'The period must be at least 1')
  .max(VIDEO_MAX_PERIODS, `Lesson series are limited to ${VIDEO_MAX_PERIODS} periods`)
const periodTotalField = z.coerce
  .number()
  .int('The total periods must be a whole number')
  .min(1, 'A lesson series must have at least 1 period')
  .max(VIDEO_MAX_PERIODS, `Lesson series are limited to ${VIDEO_MAX_PERIODS} periods`)

/** Legacy admin flow: add an already-uploaded YouTube video by URL. */
export const createVideoSchema = z.object({
  youtubeUrl: youtubeUrlField,
  title: titleField,
  description: descriptionField.default(''),
  subject: subjectField,
  classLevel: classLevelField,
  durationSeconds: durationField.default(0),
  priceNaira: priceField.default(env.VIDEO_DEFAULT_PRICE_KOBO / 100),
  published: z.boolean().default(true),
})

/**
 * Deliberately separate from a `.partial()` of the create schema: optional
 * fields must not fall back to their creation defaults, otherwise editing a
 * title would silently reset the price.
 */
export const updateVideoSchema = z
  .object({
    youtubeUrl: youtubeUrlField.optional(),
    title: titleField.optional(),
    description: descriptionField.optional(),
    subject: subjectField.optional(),
    classLevel: classLevelField.optional(),
    durationSeconds: durationField.optional(),
    priceNaira: priceField.optional(),
    published: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

const uploadTitleField = z
  .string()
  .trim()
  .min(2, 'A title is required')
  .max(160, 'Titles are limited to 160 characters')

/**
 * Creators choose what students pay. `0` means the lesson is free; any paid
 * lesson must clear Paystack's minimum charge so checkout cannot fail later.
 */
const creatorPriceField = z.coerce
  .number()
  .min(0, 'The price cannot be negative')
  .max(1_000_000, 'The price cannot exceed ₦1,000,000')
  .refine((value) => value === 0 || value >= 100, {
    message: 'The minimum paid price is ₦100. Choose Free for a free lesson.',
  })

const mimeTypeField = z
  .string()
  .trim()
  .min(5)
  .max(100)
  .refine((value) => value.toLowerCase().startsWith('video/'), {
    message: 'Only video files can be uploaded',
  })

/** Creator flow: reserve a direct-to-Cloudflare (or legacy YouTube) upload session. */
export const startVideoUploadSchema = z
  .object({
    title: uploadTitleField,
    description: descriptionField.default(''),
    subject: subjectField,
    classLevel: classLevelField,
    /** Position of this lesson in a series; defaults to a standalone 1 of 1. */
    periodNumber: periodNumberField.default(1),
    /** Total lessons in the series; defaults to a standalone 1 of 1. */
    periodTotal: periodTotalField.default(1),
    /** What students pay for lifetime access; `0` publishes a free lesson. */
    priceNaira: creatorPriceField.default(env.VIDEO_DEFAULT_PRICE_KOBO / 100),
    fileName: z.string().trim().min(1).max(255),
    mimeType: mimeTypeField,
    fileSizeBytes: z.coerce
      .number()
      .int()
      .positive('The file is empty')
      .max(
        env.VIDEO_MAX_UPLOAD_BYTES,
        `The file is too large. The limit is ${Math.floor(env.VIDEO_MAX_UPLOAD_BYTES / (1024 * 1024 * 1024))} GB.`,
      ),
    madeForKids: z.boolean().default(false),
  })
  .refine((value) => value.periodNumber <= value.periodTotal, {
    message: 'The period cannot be greater than the total periods',
    path: ['periodNumber'],
  })

/** Called by the browser after Cloudflare or YouTube finishes the upload. */
export const completeVideoUploadSchema = z
  .object({
    youtubeVideoId: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{11}$/, 'That is not a valid YouTube video id')
      .optional(),
    streamUid: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{20,64}$/, 'That is not a valid Cloudflare Stream video id')
      .optional(),
  })
  .refine((value) => Boolean(value.youtubeVideoId || value.streamUid), {
    message: 'Provide the uploaded video id',
  })

/** Admin approval: optionally adjust the price while publishing. */
export const approveVideoSchema = z.object({
  priceNaira: priceField.optional(),
})

export const rejectVideoSchema = z.object({
  reason: z.string().trim().min(2, 'Give the creator a reason').max(500),
})

export const verifyPurchaseSchema = z.object({
  reference: z.string().trim().min(6, 'A payment reference is required').max(120),
})

export type CreateVideoInput = z.infer<typeof createVideoSchema>
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>
export type StartVideoUploadInput = z.infer<typeof startVideoUploadSchema>
export type CompleteVideoUploadInput = z.infer<typeof completeVideoUploadSchema>
export type ApproveVideoInput = z.infer<typeof approveVideoSchema>
export type RejectVideoInput = z.infer<typeof rejectVideoSchema>
export type VerifyPurchaseInput = z.infer<typeof verifyPurchaseSchema>
