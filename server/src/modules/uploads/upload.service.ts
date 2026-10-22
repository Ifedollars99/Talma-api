import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { env } from '../../config/env.js'
import { AppError } from '../../common/errors/AppError.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
/** `<server>/uploads` — resolved from the compiled file so it works in dev and prod. */
export const uploadRoot = path.resolve(currentDir, '../../../', env.UPLOAD_DIR)

/** Sub-folder used for course outline PDFs. */
export const COURSE_PDF_DIR = 'courses'
/** Sub-folder used for post media (images and videos). */
export const POST_MEDIA_DIR = 'post-media'

export function ensureUploadDirs(): void {
  for (const dir of [COURSE_PDF_DIR, POST_MEDIA_DIR]) {
    fs.mkdir(path.join(uploadRoot, dir), { recursive: true }).catch(() => undefined)
  }
}

/** Strips any path information from an uploaded file name. */
function safeFileName(original: string): string {
  const extension = path.extname(original).toLowerCase()
  const base = path
    .basename(original, extension)
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${base || 'file'}${extension}`
}

/** Maps a MIME type to the extension we store it under. */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
}

/** Builds the multer middleware used for a specific upload folder. */
export interface UploaderOptions {
  /** MIME types accepted for this folder. Defaults to the global allow-list. */
  allowedTypes?: readonly string[]
  /** Message returned when the file type is rejected. */
  unsupportedMessage?: string
}

export function createUploader(folder: string, options: UploaderOptions = {}) {
  ensureUploadDirs()
  const allowedTypes = options.allowedTypes ?? env.uploadAllowedTypes

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(uploadRoot, folder))
    },
    filename: (_req, file, cb) => {
      const extension = MIME_EXTENSIONS[file.mimetype] ?? path.extname(file.originalname)
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        cb(
          AppError.badRequest(
            options.unsupportedMessage ?? `Unsupported file type: ${file.mimetype}`,
          ),
        )
        return
      }
      cb(null, true)
    },
  })
}

/** Removes a stored file (used when replacing media). */
export async function removeStoredFile(relativePath: string): Promise<void> {
  const target = path.resolve(uploadRoot, relativePath)
  if (!target.startsWith(uploadRoot)) {
    throw AppError.badRequest('Invalid file path')
  }
  await fs.unlink(target).catch(() => undefined)
}

export { safeFileName }
