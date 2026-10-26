import path from 'node:path'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../../config/env.js'
import { AppError } from '../../common/errors/AppError.js'
import {
  AVATAR_DIR,
  COURSE_PDF_DIR,
  POST_MEDIA_DIR,
  createUploader,
  safeFileName,
} from './upload.service.js'

const isPhotoOrVideo = (mimeType: string) =>
  mimeType.startsWith('image/') || mimeType.startsWith('video/')

const postMediaUploader = createUploader(POST_MEDIA_DIR, {
  allowedTypes: env.uploadAllowedTypes.filter(isPhotoOrVideo),
  unsupportedMessage:
    'Only photos and videos can be attached to a post — audio files are not supported.',
})
const avatarUploader = createUploader(AVATAR_DIR, {
  allowedTypes: env.uploadAllowedTypes.filter((mimeType) => mimeType.startsWith('image/')),
  unsupportedMessage: 'Profile photos must be a JPEG, PNG, GIF or WebP image.',
  maxFileSizeMb: 8,
})
const coursePdfUploader = createUploader(COURSE_PDF_DIR)

function publicUrl(relativePath: string): string {
  return `${env.PUBLIC_API_URL}/uploads/${relativePath.split(path.sep).join('/')}`
}

/** Runs a multer middleware and forwards any error to the Express error handler. */
function runUploader(
  uploader: ReturnType<typeof createUploader>,
  req: Request,
  res: Response,
  next: NextFunction,
  onUploaded: (file: Express.Multer.File) => void,
): void {
  uploader.single('file')(req, res, (error: unknown) => {
    if (error) {
      next(
        error instanceof AppError
          ? error
          : AppError.badRequest(error instanceof Error ? error.message : 'Upload failed'),
      )
      return
    }

    const file = req.file
    if (!file) {
      next(AppError.badRequest('No file was uploaded'))
      return
    }

    try {
      onUploaded(file)
    } catch (caught) {
      next(caught)
    }
  })
}

/** POST /api/uploads/post-media */
export async function uploadPostMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  runUploader(postMediaUploader, req, res, next, (file) => {
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image'
    const relativePath = path.join(POST_MEDIA_DIR, file.filename)

    res.status(201).json({
      url: publicUrl(relativePath),
      mediaType,
      fileName: file.originalname,
      size: file.size,
    })
  })
}

/** POST /api/uploads/avatar */
export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  runUploader(avatarUploader, req, res, next, (file) => {
    const relativePath = path.join(AVATAR_DIR, file.filename)

    res.status(201).json({
      url: publicUrl(relativePath),
      fileName: file.originalname,
      size: file.size,
    })
  })
}

/** POST /api/uploads/course-pdf */
export async function uploadCoursePdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  runUploader(coursePdfUploader, req, res, next, (file) => {
    if (file.mimetype !== 'application/pdf') {
      throw AppError.badRequest('Course outlines must be PDF files')
    }

    const relativePath = path.join(COURSE_PDF_DIR, file.filename)

    res.status(201).json({
      url: publicUrl(relativePath),
      fileName: safeFileName(file.originalname),
      storedName: file.filename,
      size: file.size,
    })
  })
}
