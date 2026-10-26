import { z } from 'zod'
import { env } from '../../config/env.js'
import { VIDEO_CLASS_LEVELS, VIDEO_SUBJECTS } from './video.options.js'

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
  .max(100, 'YouTube titles are limited to 100 characters')

const mimeTypeField = z
  .string()
  .trim()
  .min(5)
  .max(100)
  .refine((value) => value.toLowerCase().startsWith('video/'), {
    message: 'Only video files can be uploaded',
  })

/** Creator flow: reserve a YouTube resumable upload session. */
export const startVideoUploadSchema = z.object({
  title: uploadTitleField,
  description: descriptionField.default(''),
  subject: subjectField,
  classLevel: classLevelField,
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

/** Called by the browser after YouTube finishes processing the upload. */
export const completeVideoUploadSchema = z.object({
  youtubeVideoId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{11}$/, 'That is not a valid YouTube video id'),
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
