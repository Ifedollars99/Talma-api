import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../common/errors/AppError.js'
import { isWhatsAppGroupUrl } from '../../common/validation/whatsapp.js'
import { UserModel } from '../users/user.model.js'
import {
  initializeTransaction,
  verifyTransaction,
  type VerifiedTransaction,
} from '../payments/paystack.client.js'
import {
  createDirectUpload,
  createStreamToken,
  deleteStreamVideo,
  getStreamVideo,
  isCloudflareStreamConfigured,
  secureStreamVideo,
  streamDashboardUrl,
  streamEmbedUrl,
  streamThumbnailUrl,
  updateStreamVideo,
  type StreamStatus,
} from '../cloudflare/stream.client.js'
import {
  deleteVideo as deleteYouTubeVideo,
  getVideoInfo,
  initiateResumableUpload,
  isYouTubeConfigured,
  updateVideoMetadata,
  updateVideoPrivacy,
} from '../youtube/youtube.client.js'
import { getApprovedCreator } from '../creators/creator.service.js'
import {
  VideoModel,
  type VideoDocument,
  type VideoProvider,
  type VideoStatus,
} from './video.model.js'
import {
  VideoPurchaseModel,
  type PaymentStatus,
  type VideoPurchase,
} from './videoPurchase.model.js'
import type {
  CreateVideoInput,
  StartVideoUploadInput,
  UpdateVideoInput,
} from './video.validation.js'

export interface VideoViewer {
  id?: string
  role?: 'user' | 'creator' | 'student' | 'lecturer' | 'admin'
}

export interface VideoDto {
  id: string
  title: string
  description: string
  subject: string
  classLevel: string
  /** Position of this lesson in a multi-part series, e.g. 2 in "2 of 4". */
  periodNumber?: number
  /** Total lessons in the series, e.g. 4 in "2 of 4". */
  periodTotal?: number
  thumbnailUrl: string
  durationSeconds: number
  priceKobo: number
  currency: string
  purchased: boolean
  locked: boolean
  published: boolean
  status: VideoStatus
  provider: VideoProvider
  /** True when this viewer may start playback right now. */
  canWatch: boolean
  streamStatus?: StreamStatus
  createdAt: string
  canManage: boolean
  canReview: boolean
  creator?: { id: string; name: string }
  rejectionReason?: string
  uploadedAt?: string
  /** Legacy YouTube videos only; Cloudflare playback URLs are minted on demand. */
  watchUrl?: string
  /** Only present for administrators, who need it to review/edit the entry. */
  youtubeUrl?: string
  studioUrl?: string
}

export interface PurchaseDto {
  id: string
  videoId: string
  reference: string
  amountKobo: number
  currency: string
  status: PaymentStatus
  creatorShareKobo?: number
  platformShareKobo?: number
  paidAt?: string
  createdAt: string
}

export interface CheckoutResult {
  alreadyPurchased: boolean
  amountKobo: number
  currency: string
  authorizationUrl?: string
  accessCode?: string
  reference?: string
  watchUrl?: string
}

export interface StartUploadResult {
  video: VideoDto
  provider: VideoProvider
  /** `tus` for Cloudflare direct uploads; `youtube` for the legacy proxy flow. */
  uploadMethod: 'tus' | 'youtube'
  uploadUrl: string
  uploadExpiresAt: string
  /** Present for Cloudflare direct uploads. */
  streamUid?: string
}

export interface WatchResult {
  watchUrl: string
  /** Present for Cloudflare Stream links; YouTube links do not expire. */
  expiresAt?: string
}

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const FAILED_TRANSACTION_STATUSES = new Set(['failed', 'reversed', 'abandoned'])
const MAX_VIDEO_DURATION_SECONDS = 3_600
const UPLOAD_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Extracts the 11-character video id from any common YouTube URL. */
export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim()
  if (YOUTUBE_ID_PATTERN.test(value)) return value

  let url: URL
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null
  }

  const youTubeHosts = new Set([
    'youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'youtube-nocookie.com',
  ])
  if (!youTubeHosts.has(host)) return null

  const fromQuery = url.searchParams.get('v')
  if (fromQuery && YOUTUBE_ID_PATTERN.test(fromQuery)) return fromQuery

  const parts = url.pathname.split('/').filter(Boolean)
  const [kind, id] = parts
  if (
    kind &&
    id &&
    ['shorts', 'embed', 'live', 'v'].includes(kind.toLowerCase()) &&
    YOUTUBE_ID_PATTERN.test(id)
  ) {
    return id
  }

  return null
}

function youtubeWatchUrlFor(youtubeVideoId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeVideoId}`
}

function youtubeStudioUrlFor(youtubeVideoId: string): string {
  return `https://studio.youtube.com/video/${youtubeVideoId}/edit`
}

function thumbnailUrlFor(id: string): string {
  return `${env.PUBLIC_API_URL.replace(/\/$/, '')}/api/videos/${id}/thumbnail`
}

function providerOf(video: VideoDocument): VideoProvider {
  return video.provider === 'cloudflare' ? 'cloudflare' : 'youtube'
}

function hasPlayableSource(video: VideoDocument): boolean {
  if (providerOf(video) === 'cloudflare') {
    return Boolean(video.streamUid) && video.streamStatus === 'ready'
  }
  return Boolean(video.youtubeVideoId)
}

function statusOf(video: VideoDocument): VideoStatus {
  return video.status ?? (video.published ? 'published' : 'draft')
}

function isCreatorOf(video: VideoDocument, viewer: VideoViewer): boolean {
  return Boolean(
    viewer.id && video.creator && String(video.creator) === String(viewer.id),
  )
}

/**
 * Cloudflare processes uploads asynchronously. Refresh entries that are still
 * uploading/processing so the creator sees them move into the review queue
 * without needing a webhook. Failures are logged, never surfaced to the list.
 */
async function refreshProcessingVideos(
  videos: Array<VideoDocument & { _id: unknown }>,
): Promise<void> {
  if (!isCloudflareStreamConfigured()) return

  const pending = videos.filter(
    (video) =>
      providerOf(video) === 'cloudflare' &&
      Boolean(video.streamUid) &&
      (video.status === 'uploading' || video.status === 'processing'),
  )
  if (pending.length === 0) return

  await Promise.allSettled(
    pending.map(async (video) => {
      const streamUid = video.streamUid as string
      try {
        const info = await getStreamVideo(streamUid)
        if (!info) {
          video.streamStatus = 'error'
          video.status = 'failed'
          await VideoModel.updateOne(
            { _id: video._id },
            { $set: { streamStatus: 'error', status: 'failed' } },
          )
          return
        }

        if (info.status === 'error') {
          video.streamStatus = 'error'
          video.status = 'failed'
          await VideoModel.updateOne(
            { _id: video._id },
            { $set: { streamStatus: 'error', status: 'failed' } },
          )
          return
        }

        if (info.status === 'ready') {
          // Make sure an upload that finished after the browser closed is still
          // signed and domain-locked before it can enter the review queue.
          try {
            await secureStreamVideo(streamUid)
          } catch (error) {
            logger.warn(
              { err: error, videoId: String(video._id), streamUid },
              'Could not secure a finished Cloudflare Stream upload; leaving it in processing',
            )
            if (!info.requireSignedURLs) return
          }

          const uploadedAt = video.uploadedAt ?? new Date()
          video.streamStatus = 'ready'
          video.status = 'pending_review'
          video.durationSeconds = info.durationSeconds
          video.uploadedAt = uploadedAt
          await VideoModel.updateOne(
            { _id: video._id },
            {
              $set: {
                streamStatus: 'ready',
                status: 'pending_review',
                durationSeconds: info.durationSeconds,
                uploadedAt,
              },
            },
          )
          return
        }

        // Still queued or encoding.
        video.streamStatus = info.status
        video.status = 'processing'
        await VideoModel.updateOne(
          { _id: video._id },
          { $set: { streamStatus: info.status, status: 'processing' } },
        )
      } catch (error) {
        // A transient Cloudflare outage must not break the catalogue.
        logger.warn(
          { err: error, videoId: String(video._id), streamUid },
          'Could not refresh a Cloudflare Stream upload status',
        )
      }
    }),
  )
}

/** Builds a playable target. Cloudflare links are signed and short-lived. */
async function watchTargetFor(video: VideoDocument): Promise<WatchResult> {
  if (providerOf(video) === 'cloudflare') {
    if (!video.streamUid) {
      throw AppError.conflict('This video has not finished uploading yet.')
    }
    const { token, expiresAt } = await createStreamToken(video.streamUid)
    return {
      watchUrl: streamEmbedUrl(token),
      expiresAt: expiresAt.toISOString(),
    }
  }

  if (!video.youtubeVideoId) {
    throw AppError.conflict('This video has not finished uploading yet.')
  }
  return { watchUrl: youtubeWatchUrlFor(video.youtubeVideoId) }
}

function toVideoDto(
  video: VideoDocument & { _id: unknown },
  options: { purchased: boolean; viewer: VideoViewer },
): VideoDto {
  const isAdmin = options.viewer.role === 'admin'
  const isCreator = isCreatorOf(video, options.viewer)
  const canManage = isAdmin || isCreator
  const provider = providerOf(video)
  // Free published videos are immediately watchable; managers can preview
  // their own work. Nothing unpublished is watchable through the buyer flow.
  const purchased = options.purchased || (video.priceKobo === 0 && video.published)
  const canWatch = hasPlayableSource(video) && (purchased || isAdmin || isCreator)
  const status = statusOf(video)
  const studioUrl =
    isAdmin && provider === 'cloudflare' && video.streamUid
      ? streamDashboardUrl(video.streamUid)
      : null

  return {
    id: String(video._id),
    title: video.title,
    description: video.description,
    subject: video.subject ?? '',
    classLevel: video.classLevel ?? '',
    ...(video.periodNumber !== undefined ? { periodNumber: video.periodNumber } : {}),
    ...(video.periodTotal !== undefined ? { periodTotal: video.periodTotal } : {}),
    thumbnailUrl: thumbnailUrlFor(String(video._id)),
    durationSeconds: video.durationSeconds,
    priceKobo: video.priceKobo,
    currency: video.currency,
    purchased,
    // Only a live, unpaid video is actually "locked"; pending/rejected work is
    // simply unavailable, not something a buyer can unlock.
    locked: video.published && !purchased && !canWatch,
    published: video.published,
    status,
    provider,
    canWatch,
    ...(video.streamStatus ? { streamStatus: video.streamStatus } : {}),
    createdAt: video.createdAt.toISOString(),
    canManage,
    canReview: isAdmin && status === 'pending_review',
    ...(video.creator
      ? {
          creator: {
            id: String(video.creator),
            name: video.creatorName ?? 'Talma creator',
          },
        }
      : {}),
    ...(video.rejectionReason ? { rejectionReason: video.rejectionReason } : {}),
    ...(video.uploadedAt ? { uploadedAt: video.uploadedAt.toISOString() } : {}),
    // Cloudflare playback links are minted on demand by /:id/watch; putting one
    // in the catalogue would make it easy to copy and share.
    ...(canWatch && provider === 'youtube' && video.youtubeVideoId
      ? { watchUrl: youtubeWatchUrlFor(video.youtubeVideoId) }
      : {}),
    ...(isAdmin && provider === 'youtube' && video.youtubeVideoId
      ? {
          youtubeUrl: youtubeWatchUrlFor(video.youtubeVideoId),
          studioUrl: youtubeStudioUrlFor(video.youtubeVideoId),
        }
      : {}),
    ...(studioUrl ? { studioUrl } : {}),
  }
}

function toPurchaseDto(purchase: VideoPurchase): PurchaseDto {
  return {
    id: String(purchase._id),
    videoId: String(purchase.video),
    reference: purchase.reference,
    amountKobo: purchase.amountKobo,
    currency: purchase.currency,
    status: purchase.status,
    ...(purchase.creatorShareKobo !== undefined
      ? { creatorShareKobo: purchase.creatorShareKobo }
      : {}),
    ...(purchase.platformShareKobo !== undefined
      ? { platformShareKobo: purchase.platformShareKobo }
      : {}),
    ...(purchase.paidAt ? { paidAt: purchase.paidAt.toISOString() } : {}),
    createdAt: purchase.createdAt.toISOString(),
  }
}

async function paidVideoIds(userId: string): Promise<Set<string>> {
  const ids = await VideoPurchaseModel.find({ user: userId, status: 'paid' }).distinct('video')
  return new Set(ids.map((id) => String(id)))
}

async function hasPaidAccess(userId: string, videoId: string): Promise<boolean> {
  const purchase = await VideoPurchaseModel.exists({
    user: userId,
    video: videoId,
    status: 'paid',
  })
  return purchase !== null
}

function assertCanManage(video: VideoDocument, viewer: VideoViewer): void {
  if (viewer.role === 'admin' || isCreatorOf(video, viewer)) return
  throw AppError.forbidden('You do not have permission to manage this video')
}

/** The published catalogue. Administrators also see drafts and pending work. */
export async function listVideos(viewer: VideoViewer): Promise<VideoDto[]> {
  const filter = viewer.role === 'admin' ? {} : { published: true }
  const videos = await VideoModel.find(filter).sort({ createdAt: -1 }).lean()
  await refreshProcessingVideos(videos)
  const paid = viewer.id ? await paidVideoIds(viewer.id) : new Set<string>()

  return videos.map((video) =>
    toVideoDto(video, { purchased: paid.has(String(video._id)), viewer }),
  )
}

/** A creator's own uploads, in every state. */
export async function listMyVideos(viewer: VideoViewer): Promise<VideoDto[]> {
  if (!viewer.id) throw AppError.unauthorized('Authentication required')
  const filter = viewer.role === 'admin' ? {} : { creator: viewer.id }
  const videos = await VideoModel.find(filter).sort({ createdAt: -1 }).lean()
  await refreshProcessingVideos(videos)
  const paid = await paidVideoIds(viewer.id)

  return videos.map((video) =>
    toVideoDto(video, { purchased: paid.has(String(video._id)), viewer }),
  )
}

/** Admin review queue: uploads that finished encoding but are not published. */
export async function listReviewQueue(): Promise<VideoDto[]> {
  // Include Cloudflare entries that are still processing so this endpoint can
  // promote them as soon as encoding finishes, even if the admin only opens the
  // Review tab.
  const candidates = await VideoModel.find({
    $or: [{ status: 'pending_review' }, { status: 'processing', provider: 'cloudflare' }],
  })
    .sort({ createdAt: 1 })
    .lean()
  await refreshProcessingVideos(candidates)
  const videos = candidates.filter((video) => video.status === 'pending_review')

  return videos.map((video) =>
    toVideoDto(video, { purchased: false, viewer: { role: 'admin' } }),
  )
}

export async function getVideo(id: string, viewer: VideoViewer): Promise<VideoDto> {
  const video = await VideoModel.findById(id).lean()
  if (!video) throw AppError.notFound('Video not found')

  const canView =
    video.published || viewer.role === 'admin' || isCreatorOf(video, viewer)
  if (!canView) throw AppError.notFound('Video not found')

  await refreshProcessingVideos([video])
  const purchased = viewer.id ? await hasPaidAccess(viewer.id, id) : false
  return toVideoDto(video, { purchased, viewer })
}

/** Returns a playable URL only when the viewer has access. */
export async function getWatchUrl(
  id: string,
  viewer: VideoViewer,
): Promise<WatchResult> {
  const video = await VideoModel.findById(id).lean()
  if (!video) throw AppError.notFound('Video not found')

  const isAdmin = viewer.role === 'admin'
  const isCreator = isCreatorOf(video, viewer)
  if (!video.published && !isAdmin && !isCreator) {
    throw AppError.notFound('Video not found')
  }

  if (!hasPlayableSource(video)) {
    throw AppError.conflict('This video has not finished uploading yet.')
  }

  const purchased =
    video.priceKobo === 0 || (viewer.id ? await hasPaidAccess(viewer.id, id) : false)
  if (!purchased && !isAdmin && !isCreator) {
    throw AppError.paymentRequired('Buy this video before you can watch it.')
  }

  return watchTargetFor(video)
}

/**
 * Reserves a direct upload session. New uploads prefer Cloudflare Stream, where
 * the browser PATCHes bytes straight to Cloudflare and playback uses expiring
 * signed links. Deployments without Cloudflare credentials keep using the
 * legacy YouTube resumable flow.
 */
export async function startVideoUpload(
  input: StartVideoUploadInput,
  viewer: VideoViewer,
): Promise<StartUploadResult> {
  if (!viewer.id) throw AppError.unauthorized('Authentication required')

  const useCloudflare = isCloudflareStreamConfigured()
  if (!useCloudflare && !isYouTubeConfigured()) {
    throw AppError.serviceUnavailable(
      'Video uploads are not configured yet. Add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN and CLOUDFLARE_STREAM_CUSTOMER_CODE to the API environment.',
    )
  }

  const user = await UserModel.findById(viewer.id)
    .select('_id username role creatorStatus whatsappUrl')
    .lean()
  if (!user) throw AppError.notFound('Account not found')

  const creatorProfile =
    viewer.role === 'admin' ? null : await getApprovedCreator(viewer.id)
  if (viewer.role !== 'admin') {
    if (user.role === 'user' || user.role === 'student') {
      throw AppError.forbidden(
        'Student accounts cannot upload lessons. Sign up as an Educator to share videos.',
      )
    }
    if (user.creatorStatus !== 'approved') {
      throw AppError.forbidden(
        'Only approved educators can upload videos. Verify your account first.',
      )
    }
    if (!isWhatsAppGroupUrl(user.whatsappUrl ?? '')) {
      throw AppError.forbidden(
        'Add your WhatsApp group or community link before uploading. You can update it in Settings.',
      )
    }
  }

  const creatorFields = creatorProfile
    ? {
        creator: viewer.id,
        creatorName: creatorProfile.displayName,
        creatorSharePercent: creatorProfile.sharePercent,
      }
    : viewer.role === 'admin'
      ? { creatorSharePercent: 0 }
      : {
          creator: viewer.id,
          creatorName: user.username,
          creatorSharePercent: env.creatorSharePercent,
        }

  if (useCloudflare) {
    const upload = await createDirectUpload({
      fileName: input.fileName,
      sizeBytes: input.fileSizeBytes,
      maxDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
    })

    const video = await VideoModel.create({
      title: input.title,
      description: input.description,
      subject: input.subject,
      classLevel: input.classLevel,
      periodNumber: input.periodNumber,
      periodTotal: input.periodTotal,
      provider: 'cloudflare',
      streamUid: upload.uid,
      streamStatus: 'queued',
      streamUploadUrl: upload.uploadUrl,
      streamUploadExpiresAt: upload.expiresAt,
      youtubeVideoId: '',
      durationSeconds: 0,
      priceKobo: Math.round(input.priceNaira * 100),
      currency: env.PAYSTACK_CURRENCY,
      published: false,
      status: 'uploading',
      createdBy: viewer.id,
      ...creatorFields,
      originalFileName: input.fileName,
      fileMimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    })

    return {
      video: toVideoDto(video.toObject(), { purchased: false, viewer }),
      provider: 'cloudflare',
      uploadMethod: 'tus',
      uploadUrl: upload.uploadUrl,
      uploadExpiresAt: upload.expiresAt.toISOString(),
      streamUid: upload.uid,
    }
  }

  // Legacy fallback: unlisted YouTube uploads. New deployments should configure
  // Cloudflare Stream so paid lessons are not permanently shareable links.
  const { uploadUrl } = await initiateResumableUpload({
    title: input.title,
    description: input.description,
    mimeType: input.mimeType,
    sizeBytes: input.fileSizeBytes,
    privacyStatus: 'unlisted',
    madeForKids: input.madeForKids,
  })

  const uploadExpiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS)
  const video = await VideoModel.create({
    title: input.title,
    description: input.description,
    subject: input.subject,
    classLevel: input.classLevel,
    periodNumber: input.periodNumber,
    periodTotal: input.periodTotal,
    provider: 'youtube',
    youtubeVideoId: '',
    youtubeUploadUrl: uploadUrl,
    uploadExpiresAt,
    durationSeconds: 0,
    priceKobo: Math.round(input.priceNaira * 100),
    currency: env.PAYSTACK_CURRENCY,
    published: false,
    status: 'uploading',
    createdBy: viewer.id,
    ...creatorFields,
    originalFileName: input.fileName,
    fileMimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })

  return {
    video: toVideoDto(video.toObject(), { purchased: false, viewer }),
    provider: 'youtube',
    uploadMethod: 'youtube',
    uploadUrl,
    uploadExpiresAt: uploadExpiresAt.toISOString(),
  }
}

/** Size of a single YouTube resumable-upload chunk, in bytes. */
const YOUTUBE_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024 * 1024

/** First byte index to resume from, derived from a `Range` response header. */
function resumeOffset(range: string | null, fallback: number): number {
  if (!range) return fallback
  const match = /bytes=0-(\d+)/i.exec(range)
  return match ? Number(match[1]) + 1 : fallback
}

/**
 * Sends a creator's video file to the YouTube resumable session the API created
 * when the upload started. The browser hands the bytes to Talma through its own
 * API (same origin via the Vite proxy) instead of sending them straight to
 * Google, so the transfer is no longer subject to the browser CORS preflight
 * that blocked the direct-to-Google chunk PUTs.
 */
export async function uploadVideoFileToYouTube(
  id: string,
  file: Express.Multer.File,
  viewer: VideoViewer,
): Promise<{ youtubeVideoId: string }> {
  const video = await VideoModel.findById(id)
  if (!video) throw AppError.notFound('Video not found')
  assertCanManage(video, viewer)
  if (providerOf(video) !== 'youtube') {
    throw AppError.conflict('This upload is handled directly by Cloudflare Stream.')
  }
  if (video.status !== 'uploading') {
    throw AppError.conflict('This upload is not waiting to be finalized.')
  }
  if (!video.youtubeUploadUrl) {
    throw AppError.conflict('The YouTube upload session is missing. Start the upload again.')
  }
  if (!file.size) throw AppError.badRequest('The selected file is empty.')

  const uploadUrl = video.youtubeUploadUrl
  const mimeType = file.mimetype || video.fileMimeType || 'video/mp4'
  const buffer = file.buffer ?? Buffer.alloc(0)
  const total = file.size
  let offset = 0
  let youtubeVideoId = ''

  while (!youtubeVideoId) {
    const end = Math.min(offset + YOUTUBE_UPLOAD_CHUNK_SIZE_BYTES, total) - 1
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Range': `bytes ${offset}-${end}/${total}`,
        'X-Upload-Content-Type': mimeType,
      },
      body: buffer.subarray(offset, end + 1),
    })

    if (response.status === 200 || response.status === 201) {
      const payload = (await response.json().catch(() => null)) as { id?: unknown } | null
      youtubeVideoId = typeof payload?.id === 'string' ? payload.id : ''
      break
    }
    if (response.status === 308) {
      // Resume from the byte position Google reported as received.
      offset = resumeOffset(response.headers.get('range'), end + 1)
      continue
    }

    let detail = ''
    try {
      const payload = (await response.json()) as {
        error?: { message?: string; errors?: Array<{ reason?: string }> }
      }
      detail = payload.error?.errors?.[0]?.reason ?? payload.error?.message ?? ''
    } catch {
      // Google did not answer with JSON; keep the generic failure message.
    }
    if (response.status === 404 || response.status === 410) {
      throw AppError.badGateway('The YouTube upload session expired. Start the upload again.')
    }
    throw AppError.badGateway(`YouTube could not receive the upload${detail ? `: ${detail}` : '.'}`)
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeVideoId)) {
    throw AppError.badGateway('YouTube finished the upload but returned no video id.')
  }

  return { youtubeVideoId }
}

async function forcePrivate(youtubeVideoId: string, privacyStatus: string): Promise<void> {
  if (!privacyStatus || privacyStatus === 'private') return
  try {
    await updateVideoPrivacy(youtubeVideoId, 'private')
  } catch (error) {
    logger.warn(
      { err: error, youtubeVideoId, privacyStatus },
      'Could not force a failed/rejected YouTube upload back to private',
    )
  }
}

/** Finalizes a browser upload once the provider reports the new video. */
export interface CompleteVideoUploadInput {
  youtubeVideoId?: string
  streamUid?: string
}

async function completeCloudflareUpload(
  video: mongoose.HydratedDocument<VideoDocument>,
  viewer: VideoViewer,
): Promise<VideoDto> {
  const streamUid = video.streamUid as string
  const info = await getStreamVideo(streamUid)
  if (!info) {
    video.streamStatus = 'error'
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest(
      'Cloudflare could not find that upload. Please try uploading the file again.',
    )
  }

  if (info.status === 'error') {
    video.streamStatus = 'error'
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest(
      `Cloudflare could not process this video${
        info.errorReasonText ? `: ${info.errorReasonText}` : '.'
      } Please try again.`,
    )
  }

  if (info.status !== 'ready') {
    // Encoding is asynchronous; the creator list / review queue refreshes this
    // entry. Return the current state so the browser can poll.
    video.streamStatus = info.status
    video.status = 'processing'
    await video.save()
    return toVideoDto(video.toObject(), { purchased: false, viewer })
  }

  if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    await deleteStreamVideo(streamUid).catch((error) => {
      logger.warn({ err: error, streamUid }, 'Could not delete an over-long Stream upload')
    })
    video.streamStatus = 'error'
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest('Videos must be one hour or shorter.')
  }

  // Direct-upload metadata already asks for signed URLs, but re-assert it at
  // finalization so a misconfigured token cannot leave the lesson public.
  try {
    await secureStreamVideo(streamUid)
  } catch (error) {
    if (!info.requireSignedURLs) {
      await deleteStreamVideo(streamUid).catch((deleteError) => {
        logger.warn(
          { err: deleteError, streamUid },
          'Could not remove an unsecured Stream upload; check Cloudflare',
        )
      })
      video.streamStatus = 'error'
      video.status = 'failed'
      await video.save()
      throw AppError.badGateway(
        'Talma could not secure the Cloudflare copy, so the upload was removed. Please try again.',
      )
    }
    logger.warn(
      { err: error, streamUid },
      'Could not refresh Cloudflare Stream allowed origins; signed playback is still enforced',
    )
  }

  video.streamStatus = 'ready'
  video.durationSeconds = info.durationSeconds
  video.status = 'pending_review'
  video.published = false
  video.streamUploadUrl = undefined
  video.streamUploadExpiresAt = undefined
  video.uploadedAt = new Date()
  await video.save()

  logger.info(
    { videoId: String(video._id), streamUid, creatorId: String(video.creator ?? '') },
    'Video uploaded to Cloudflare Stream and queued for review',
  )

  return toVideoDto(video.toObject(), { purchased: false, viewer })
}

export async function completeVideoUpload(
  id: string,
  input: CompleteVideoUploadInput,
  viewer: VideoViewer,
): Promise<VideoDto> {
  const video = await VideoModel.findById(id)
  if (!video) throw AppError.notFound('Video not found')
  assertCanManage(video, viewer)

  if (providerOf(video) === 'cloudflare') {
    const streamUid = input.streamUid
    if (!streamUid) {
      throw AppError.badRequest('Provide the Cloudflare Stream video id.')
    }
    if (video.streamUid && video.streamUid !== streamUid) {
      throw AppError.badRequest('That upload does not belong to this video.')
    }
    if (video.status === 'pending_review' && video.streamUid === streamUid) {
      return toVideoDto(video.toObject(), { purchased: false, viewer })
    }
    if (video.status !== 'uploading' && video.status !== 'processing') {
      throw AppError.conflict('This upload is not waiting to be finalized.')
    }

    video.streamUid = streamUid
    return completeCloudflareUpload(video, viewer)
  }

  const youtubeVideoId = input.youtubeVideoId
  if (!youtubeVideoId) {
    throw AppError.badRequest('Provide the YouTube video id.')
  }

  if (video.status === 'pending_review' && video.youtubeVideoId === youtubeVideoId) {
    return toVideoDto(video.toObject(), { purchased: false, viewer })
  }
  if (video.status !== 'uploading') {
    throw AppError.conflict('This upload is not waiting to be finalized.')
  }

  const info = await getVideoInfo(youtubeVideoId)
  if (!info) {
    throw AppError.badRequest(
      'YouTube could not find that upload. Please try uploading the file again.',
    )
  }
  if (
    info.uploadStatus === 'failed' ||
    info.uploadStatus === 'rejected' ||
    info.uploadStatus === 'deleted'
  ) {
    if (info.uploadStatus !== 'deleted') {
      await forcePrivate(youtubeVideoId, info.privacyStatus)
    }
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest('YouTube rejected or removed this upload. Please try again.')
  }
  if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    await deleteYouTubeVideo(youtubeVideoId).catch(() => undefined)
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest('Videos must be one hour or shorter.')
  }

  // Uploads must stay unlisted until an administrator publishes them: never
  // public. If the browser somehow changed the privacy setting, force it back.
  // If that fails, remove the YouTube copy rather than leave it exposed.
  if (info.privacyStatus !== 'unlisted') {
    try {
      await updateVideoPrivacy(youtubeVideoId, 'unlisted')
    } catch (error) {
      logger.warn(
        { err: error, youtubeVideoId },
        'Could not force an uploaded YouTube video back to unlisted',
      )
      await deleteYouTubeVideo(youtubeVideoId).catch((deleteError) => {
        logger.warn(
          { err: deleteError, youtubeVideoId },
          'Could not remove an unsecured YouTube upload; check YouTube Studio',
        )
      })
      video.status = 'failed'
      await video.save()
      throw AppError.badGateway(
        'Talma could not secure the YouTube copy, so the upload was removed. Please try again.',
      )
    }
  }

  video.youtubeVideoId = youtubeVideoId
  video.durationSeconds = info.durationSeconds
  video.status = 'pending_review'
  video.published = false
  video.youtubeUploadUrl = undefined
  video.uploadExpiresAt = undefined
  video.uploadedAt = new Date()
  await video.save()

  logger.info(
    { videoId: String(video._id), youtubeVideoId, creatorId: String(video.creator ?? '') },
    'Video uploaded to YouTube and queued for review',
  )

  return toVideoDto(video.toObject(), { purchased: false, viewer })
}

/** Admin-only: publish an approved upload at the creator's price. */
export async function approveVideo(
  id: string,
  priceNaira: number | undefined,
  adminId: string,
): Promise<VideoDto> {
  const video = await VideoModel.findById(id)
  if (!video) throw AppError.notFound('Video not found')

  if (video.status === 'published' && video.published) {
    return toVideoDto(video.toObject(), { purchased: false, viewer: { id: adminId, role: 'admin' } })
  }
  if (video.status !== 'pending_review' || !hasPlayableSource(video)) {
    throw AppError.conflict('Only videos that finished uploading can be approved.')
  }

  let creatorSharePercent = video.creatorSharePercent
  if (video.creator) {
    const profile = await getApprovedCreator(String(video.creator))
    if (!profile?.paystackSubaccountCode) {
      throw AppError.badRequest(
        "The creator's Paystack payout account is not ready. Approve the creator first.",
      )
    }
    creatorSharePercent = profile.sharePercent
  }

  let approvedDuration = video.durationSeconds

  if (providerOf(video) === 'cloudflare') {
    const streamUid = video.streamUid as string
    const info = await getStreamVideo(streamUid)
    if (!info) {
      throw AppError.badRequest(
        'Cloudflare could not find this video. It may have been removed; reject it and ask the creator to upload again.',
      )
    }
    if (info.status === 'error') {
      video.streamStatus = 'error'
      video.status = 'failed'
      await video.save()
      throw AppError.badRequest(
        'Cloudflare rejected or removed this video. It cannot be published.',
      )
    }
    if (info.status !== 'ready' || !info.readyToStream) {
      throw AppError.conflict(
        'Cloudflare is still processing this video. Try approving it again in a few minutes.',
      )
    }
    if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      await deleteStreamVideo(streamUid).catch(() => undefined)
      video.streamStatus = 'error'
      video.status = 'failed'
      await video.save()
      throw AppError.badRequest('Videos must be one hour or shorter.')
    }

    // Re-assert signed playback and the Talma domain allow-list at publish time.
    await secureStreamVideo(streamUid)
    approvedDuration = info.durationSeconds
  } else {
    const youtubeVideoId = video.youtubeVideoId

    // Re-check the YouTube copy at approval time. The upload may still have been
    // processing when the browser finalized it, and the creator could have
    // changed or removed it in Studio in the meantime.
    const info = await getVideoInfo(youtubeVideoId)
    if (!info) {
      throw AppError.badRequest(
        'YouTube could not find this video. It may have been removed; reject it and ask the creator to upload again.',
      )
    }
    if (
      info.uploadStatus === 'failed' ||
      info.uploadStatus === 'rejected' ||
      info.uploadStatus === 'deleted'
    ) {
      if (info.uploadStatus !== 'deleted') {
        await forcePrivate(youtubeVideoId, info.privacyStatus)
      }
      video.status = 'failed'
      await video.save()
      throw AppError.badRequest('YouTube rejected or removed this video. It cannot be published.')
    }
    if (!info.durationSeconds) {
      throw AppError.conflict(
        'YouTube is still processing this video. Try approving it again in a few minutes.',
      )
    }
    if (info.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      await deleteYouTubeVideo(youtubeVideoId).catch(() => undefined)
      video.status = 'failed'
      await video.save()
      throw AppError.badRequest('Videos must be one hour or shorter.')
    }

    await updateVideoPrivacy(youtubeVideoId, 'unlisted')
    approvedDuration = info.durationSeconds
  }

  video.status = 'published'
  video.published = true
  video.durationSeconds = approvedDuration
  video.reviewedBy = new mongoose.Types.ObjectId(adminId)
  video.reviewedAt = new Date()
  video.rejectionReason = undefined
  video.creatorSharePercent = creatorSharePercent
  if (priceNaira !== undefined) video.priceKobo = Math.round(priceNaira * 100)
  await video.save()

  return toVideoDto(video.toObject(), { purchased: false, viewer: { id: adminId, role: 'admin' } })
}

/** Admin-only: delete a rejected upload at the provider and mark it rejected. */
export async function rejectVideo(
  id: string,
  reason: string,
  adminId: string,
): Promise<VideoDto> {
  const video = await VideoModel.findById(id)
  if (!video) throw AppError.notFound('Video not found')
  if (video.status !== 'pending_review') {
    throw AppError.conflict('Only videos in the review queue can be rejected.')
  }

  if (providerOf(video) === 'cloudflare' && video.streamUid) {
    try {
      await deleteStreamVideo(video.streamUid)
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), streamUid: video.streamUid },
        'Could not delete the rejected Cloudflare Stream video',
      )
    }
  } else if (video.youtubeVideoId) {
    try {
      await deleteYouTubeVideo(video.youtubeVideoId)
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), youtubeVideoId: video.youtubeVideoId },
        'Could not delete the rejected YouTube video; it remains on the channel',
      )
    }
  }

  video.status = 'rejected'
  video.published = false
  video.reviewedBy = new mongoose.Types.ObjectId(adminId)
  video.reviewedAt = new Date()
  video.rejectionReason = reason
  video.youtubeUploadUrl = undefined
  video.streamUploadUrl = undefined
  video.streamUploadExpiresAt = undefined
  await video.save()

  return toVideoDto(video.toObject(), { purchased: false, viewer: { id: adminId, role: 'admin' } })
}

/** Starts a Paystack checkout for a video. The amount always comes from the API. */
export async function startCheckout(videoId: string, userId: string): Promise<CheckoutResult> {
  const video = await VideoModel.findOne({ _id: videoId, published: true })
  if (!video) {
    throw AppError.notFound('Video not found')
  }
  if (!hasPlayableSource(video)) {
    throw AppError.conflict('This video is not ready to watch yet.')
  }

  if (video.priceKobo === 0) {
    const target = await watchTargetFor(video)
    return {
      alreadyPurchased: true,
      amountKobo: 0,
      currency: video.currency,
      watchUrl: target.watchUrl,
    }
  }

  if (await hasPaidAccess(userId, videoId)) {
    const target = await watchTargetFor(video)
    return {
      alreadyPurchased: true,
      amountKobo: video.priceKobo,
      currency: video.currency,
      watchUrl: target.watchUrl,
    }
  }

  // Reuse a fresh pending checkout instead of creating a second payable
  // reference, so a double-click cannot produce two charges.
  const pending = await VideoPurchaseModel.findOne({
    user: userId,
    video: video._id,
    status: 'pending',
    authorizationUrl: { $exists: true, $ne: '' },
    checkoutExpiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (pending?.authorizationUrl) {
    return {
      alreadyPurchased: false,
      amountKobo: pending.amountKobo,
      currency: pending.currency,
      authorizationUrl: pending.authorizationUrl,
      reference: pending.reference,
    }
  }

  const user = await UserModel.findById(userId).select('email').lean()
  if (!user) {
    throw AppError.notFound('Account not found')
  }

  let creatorProfile: Awaited<ReturnType<typeof getApprovedCreator>> = null
  if (video.creator) {
    creatorProfile = await getApprovedCreator(String(video.creator))
    // A verified creator may not have added payout details yet. Their video can
    // still be sold; the platform simply keeps the full amount until a
    // Paystack subaccount is connected.
  }

  const creatorSharePercent = creatorProfile?.sharePercent ?? 0
  const creatorShareKobo = Math.round((video.priceKobo * creatorSharePercent) / 100)
  const platformShareKobo = video.priceKobo - creatorShareKobo

  const reference = `talma-video-${Date.now().toString(36)}-${crypto
    .randomBytes(8)
    .toString('hex')}`

  const purchase = await VideoPurchaseModel.create({
    user: userId,
    video: video._id,
    ...(video.creator && creatorProfile
      ? {
          creator: video.creator,
          creatorSharePercent,
          creatorShareKobo,
          platformShareKobo,
          paystackSubaccountCode: creatorProfile.paystackSubaccountCode,
        }
      : {}),
    reference,
    amountKobo: video.priceKobo,
    currency: video.currency,
    status: 'pending',
    provider: 'paystack',
  })

  try {
    const initialized = await initializeTransaction({
      email: user.email,
      amountKobo: video.priceKobo,
      reference,
      currency: video.currency,
      callbackUrl: env.paystackCallbackUrl,
      metadata: {
        kind: 'video',
        videoId: String(video._id),
        userId,
        title: video.title,
        ...(video.creator ? { creatorId: String(video.creator) } : {}),
      },
      ...(creatorProfile?.paystackSubaccountCode
        ? { subaccount: creatorProfile.paystackSubaccountCode, bearer: 'account' as const }
        : {}),
    })

    await VideoPurchaseModel.updateOne(
      { _id: purchase._id },
      {
        $set: {
          authorizationUrl: initialized.authorizationUrl,
          checkoutExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      },
    )

    return {
      alreadyPurchased: false,
      amountKobo: video.priceKobo,
      currency: video.currency,
      authorizationUrl: initialized.authorizationUrl,
      accessCode: initialized.accessCode,
      // Return the reference stored on the purchase, not whatever Paystack
      // echoes back, so the browser can always reconcile its own payment.
      reference,
    }
  } catch (error) {
    await VideoPurchaseModel.updateOne(
      { _id: purchase._id },
      { $set: { status: 'failed' satisfies PaymentStatus } },
    )
    throw error
  }
}

/**
 * Reconciles a checkout when Paystack sends the buyer back to the app.
 * This is deliberately redundant with the webhook: whichever arrives first
 * grants access, and the other becomes a no-op.
 */
export async function verifyVideoPurchase(
  reference: string,
  userId: string,
): Promise<{ purchase: PurchaseDto; video: VideoDto }> {
  const purchase = await VideoPurchaseModel.findOne({ reference, user: userId })
  if (!purchase) {
    throw AppError.notFound('Payment not found')
  }

  if (purchase.status !== 'paid') {
    const transaction = await verifyTransaction(reference)
    if (transaction.status === 'success') {
      await grantAccess(purchase, transaction)
    } else if (FAILED_TRANSACTION_STATUSES.has(transaction.status)) {
      purchase.status = 'failed'
      await purchase.save()
    }
  }

  const refreshed =
    (await VideoPurchaseModel.findById(purchase._id)) ?? purchase
  const video = await VideoModel.findById(purchase.video).lean()
  if (!video) {
    throw AppError.notFound('The video linked to this payment no longer exists')
  }

  return {
    purchase: toPurchaseDto(refreshed),
    video: toVideoDto(video, {
      purchased: refreshed.status === 'paid',
      viewer: { id: userId },
    }),
  }
}

/** Marks a purchase as paid, but only once — the operation is idempotent. */
async function grantAccess(
  purchase: VideoPurchase,
  transaction: VerifiedTransaction,
): Promise<void> {
  const amountMatches = Math.round(transaction.amount) >= purchase.amountKobo
  const currencyMatches =
    transaction.currency.trim().toUpperCase() === purchase.currency.trim().toUpperCase()

  if (!amountMatches || !currencyMatches) {
    logger.warn(
      {
        reference: purchase.reference,
        expectedAmount: purchase.amountKobo,
        receivedAmount: transaction.amount,
        expectedCurrency: purchase.currency,
        receivedCurrency: transaction.currency,
      },
      'Refusing to grant video access: Paystack amount or currency mismatch',
    )
    await VideoPurchaseModel.updateOne(
      { _id: purchase._id, status: { $ne: 'paid' } },
      { $set: { status: 'failed' } },
    )
    return
  }

  const updated = await VideoPurchaseModel.findOneAndUpdate(
    { _id: purchase._id, status: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        paidAt: transaction.paidAt ?? new Date(),
        providerTransactionId: transaction.id,
        providerReference: transaction.reference,
        ...(transaction.channel ? { channel: transaction.channel } : {}),
      },
    },
    { new: true },
  )

  if (!updated) return

  // Any other checkout the user opened for the same video is now redundant.
  await VideoPurchaseModel.updateMany(
    {
      user: purchase.user,
      video: purchase.video,
      _id: { $ne: purchase._id },
      status: 'pending',
    },
    { $set: { status: 'abandoned' } },
  )

  logger.info(
    {
      userId: String(purchase.user),
      videoId: String(purchase.video),
      ...(purchase.creator ? { creatorId: String(purchase.creator) } : {}),
    },
    'Video access granted',
  )
}

/** Processes a verified Paystack `charge.success` event. */
export async function processPaystackWebhook(payload: unknown): Promise<void> {
  const reference = extractPaidReference(payload)
  if (!reference) return

  const purchase = await VideoPurchaseModel.findOne({ reference })
  if (!purchase || purchase.status === 'paid') return

  // The webhook body is a hint; Paystack's verify endpoint is the source of truth.
  const transaction = await verifyTransaction(reference)
  if (transaction.status === 'success') {
    await grantAccess(purchase, transaction)
    return
  }

  if (FAILED_TRANSACTION_STATUSES.has(transaction.status)) {
    await VideoPurchaseModel.updateOne(
      { _id: purchase._id, status: { $ne: 'paid' } },
      { $set: { status: 'failed' } },
    )
  }
}

function extractPaidReference(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const event = payload as Record<string, unknown>
  if (event.event !== 'charge.success') return null

  const data = event.data
  if (typeof data !== 'object' || data === null) return null

  const reference = (data as Record<string, unknown>).reference
  return typeof reference === 'string' && reference.trim().length > 0 ? reference.trim() : null
}

/** Admin-only: add an already-uploaded YouTube video to the library. */
export async function createVideo(
  input: CreateVideoInput,
  adminId: string,
): Promise<VideoDto> {
  const youtubeVideoId = parseYouTubeVideoId(input.youtubeUrl)
  if (!youtubeVideoId) {
    throw AppError.badRequest(
      'That is not a valid YouTube link. Paste a youtube.com/watch, youtu.be or Shorts URL.',
    )
  }

  const video = await VideoModel.create({
    title: input.title,
    description: input.description,
    subject: input.subject,
    classLevel: input.classLevel,
    provider: 'youtube',
    youtubeVideoId,
    durationSeconds: input.durationSeconds,
    priceKobo: Math.round(input.priceNaira * 100),
    currency: env.PAYSTACK_CURRENCY,
    published: input.published,
    status: input.published ? 'published' : 'draft',
    createdBy: adminId,
    creatorSharePercent: 0,
  })

  const viewer: VideoViewer = { id: adminId, role: 'admin' }
  return toVideoDto(video.toObject(), { purchased: false, viewer })
}

/** Admin-only: change metadata, price or visibility. */
export async function updateVideo(
  id: string,
  input: UpdateVideoInput,
  adminId: string,
): Promise<VideoDto> {
  const video = await VideoModel.findById(id)
  if (!video) {
    throw AppError.notFound('Video not found')
  }

  if (video.status === 'pending_review' && input.published !== undefined) {
    throw AppError.conflict('Use the review actions to publish or reject this video.')
  }

  const provider = providerOf(video)
  let syncYouTube = false
  let syncCloudflare = false
  if (input.youtubeUrl !== undefined) {
    if (provider === 'cloudflare') {
      throw AppError.badRequest(
        'Cloudflare Stream videos cannot be replaced with a YouTube link. Delete this entry and add a new YouTube video instead.',
      )
    }
    const youtubeVideoId = parseYouTubeVideoId(input.youtubeUrl)
    if (!youtubeVideoId) {
      throw AppError.badRequest(
        'That is not a valid YouTube link. Paste a youtube.com/watch, youtu.be or Shorts URL.',
      )
    }
    video.youtubeVideoId = youtubeVideoId
  }
  if (input.title !== undefined && input.title !== video.title) {
    video.title = input.title
    syncYouTube = true
    syncCloudflare = true
  }
  if (input.description !== undefined && input.description !== video.description) {
    video.description = input.description
    syncYouTube = true
    syncCloudflare = true
  }
  if (input.subject !== undefined) video.subject = input.subject
  if (input.classLevel !== undefined) video.classLevel = input.classLevel
  if (input.durationSeconds !== undefined) video.durationSeconds = input.durationSeconds
  if (input.priceNaira !== undefined) video.priceKobo = Math.round(input.priceNaira * 100)
  if (input.published !== undefined) {
    video.published = input.published
    video.status = input.published ? 'published' : 'draft'
  }

  if (
    syncYouTube &&
    provider === 'youtube' &&
    video.youtubeVideoId &&
    video.status === 'published'
  ) {
    try {
      await updateVideoMetadata(video.youtubeVideoId, {
        title: video.title,
        description: video.description,
      })
    } catch (error) {
      // Legacy links may point at a channel this token cannot edit. Keep the
      // Talma listing editable and leave a trail for the administrator.
      logger.warn(
        { err: error, videoId: String(video._id), youtubeVideoId: video.youtubeVideoId },
        'Could not sync the video metadata to YouTube; keeping the Talma changes',
      )
    }
  }

  if (syncCloudflare && provider === 'cloudflare' && video.streamUid) {
    try {
      await updateStreamVideo(video.streamUid, {
        title: video.title,
        description: video.description,
      })
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), streamUid: video.streamUid },
        'Could not sync the video metadata to Cloudflare Stream; keeping the Talma changes',
      )
    }
  }

  await video.save()

  const viewer: VideoViewer = { id: adminId, role: 'admin' }
  return toVideoDto(video.toObject(), { purchased: false, viewer })
}

/** Administrators can remove any video; creators only their own unsold work. */
export async function deleteVideo(id: string, viewer: VideoViewer): Promise<void> {
  const video = await VideoModel.findById(id)
  if (!video) {
    throw AppError.notFound('Video not found')
  }

  if (viewer.role !== 'admin') {
    if (!isCreatorOf(video, viewer)) {
      throw AppError.forbidden('You do not have permission to delete this video')
    }
    const sold = await VideoPurchaseModel.exists({ video: video._id, status: 'paid' })
    if (sold) {
      throw AppError.conflict('You cannot delete a video that students have already bought.')
    }
    const checkoutOpen = await VideoPurchaseModel.exists({
      video: video._id,
      status: 'pending',
    })
    if (checkoutOpen) {
      throw AppError.conflict(
        'A buyer has an open checkout for this video. Ask an administrator to remove it after that checkout is resolved.',
      )
    }
  }

  if (providerOf(video) === 'cloudflare' && video.streamUid) {
    try {
      await deleteStreamVideo(video.streamUid)
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), streamUid: video.streamUid },
        'Could not delete the Cloudflare Stream copy; removing the Talma entry anyway',
      )
    }
  } else if (video.youtubeVideoId) {
    try {
      await deleteYouTubeVideo(video.youtubeVideoId)
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), youtubeVideoId: video.youtubeVideoId },
        'Could not delete the YouTube copy; removing the Talma entry anyway',
      )
    }
  }

  await Promise.all([
    VideoModel.deleteOne({ _id: video._id }),
    VideoPurchaseModel.deleteMany({ video: video._id }),
  ])
}

export interface VideoThumbnail {
  buffer: Buffer
  contentType: string
  /** How long a browser/CDN may cache this image. */
  cacheSeconds: number
}

/**
 * Proxies the provider thumbnail through the API so the YouTube id (and watch
 * URL) or Cloudflare playback token never reaches the browser for a locked
 * video. Unpublished uploads get a placeholder.
 */
export async function getVideoThumbnail(id: string): Promise<VideoThumbnail | null> {
  const video = await VideoModel.findById(id)
    .select('provider youtubeVideoId streamUid title status published')
    .lean()
  if (!video) return null

  const status = video.status ?? (video.published ? 'published' : 'draft')

  if (status === 'published' && providerOf(video) === 'cloudflare' && video.streamUid) {
    if (isCloudflareStreamConfigured()) {
      try {
        const { token } = await createStreamToken(video.streamUid)
        const response = await fetch(streamThumbnailUrl(token), {
          signal: AbortSignal.timeout(8_000),
        })
        if (response.ok) {
          return {
            buffer: Buffer.from(await response.arrayBuffer()),
            contentType: response.headers.get('content-type') ?? 'image/jpeg',
            // The signed token is cached server-side, so this stays cheap.
            cacheSeconds: 3_600,
          }
        }
      } catch (error) {
        logger.warn(
          { err: error, videoId: String(video._id), streamUid: video.streamUid },
          'Could not fetch the Cloudflare Stream thumbnail; using the placeholder',
        )
      }
    }
  } else if (status === 'published' && video.youtubeVideoId) {
    try {
      const response = await fetch(
        `https://i.ytimg.com/vi/${encodeURIComponent(video.youtubeVideoId)}/hqdefault.jpg`,
        { signal: AbortSignal.timeout(8_000) },
      )
      if (response.ok) {
        return {
          buffer: Buffer.from(await response.arrayBuffer()),
          contentType: response.headers.get('content-type') ?? 'image/jpeg',
          cacheSeconds: 86_400,
        }
      }
    } catch {
      // Fall through to the placeholder below.
    }
  }

  return {
    // Do not leak the title of an upload that has not been approved yet.
    buffer: placeholderThumbnail(status === 'published' ? video.title : 'Talma Video'),
    contentType: 'image/svg+xml',
    // Short cache so the real thumbnail appears soon after approval.
    cacheSeconds: 60,
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function placeholderThumbnail(title: string): Buffer {
  const label = escapeXml(title.slice(0, 48))
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#0a0a0a"/>
  <circle cx="320" cy="150" r="44" fill="#f5c842"/>
  <path d="M308 128l34 22-34 22z" fill="#0a0a0a"/>
  <text x="320" y="245" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">${label}</text>
  <text x="320" y="282" fill="#f5c842" font-family="Arial, sans-serif" font-size="15" text-anchor="middle">Talma Video</text>
</svg>`,
    'utf8',
  )
}


