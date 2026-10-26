import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../common/errors/AppError.js'
import { UserModel } from '../users/user.model.js'
import {
  initializeTransaction,
  verifyTransaction,
  type VerifiedTransaction,
} from '../payments/paystack.client.js'
import {
  deleteVideo as deleteYouTubeVideo,
  getVideoInfo,
  initiateResumableUpload,
  isYouTubeConfigured,
  updateVideoMetadata,
  updateVideoPrivacy,
} from '../youtube/youtube.client.js'
import { getApprovedCreator } from '../creators/creator.service.js'
import { VideoModel, type VideoDocument, type VideoStatus } from './video.model.js'
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
  thumbnailUrl: string
  durationSeconds: number
  priceKobo: number
  currency: string
  purchased: boolean
  locked: boolean
  published: boolean
  status: VideoStatus
  createdAt: string
  canManage: boolean
  canReview: boolean
  creator?: { id: string; name: string }
  rejectionReason?: string
  uploadedAt?: string
  /** Only present once the viewer owns the video (or may manage it). */
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
  uploadUrl: string
  uploadExpiresAt: string
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

function watchUrlFor(youtubeVideoId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeVideoId}`
}

function studioUrlFor(youtubeVideoId: string): string {
  return `https://studio.youtube.com/video/${youtubeVideoId}/edit`
}

function thumbnailUrlFor(id: string): string {
  return `${env.PUBLIC_API_URL.replace(/\/$/, '')}/api/videos/${id}/thumbnail`
}

function statusOf(video: VideoDocument): VideoStatus {
  return video.status ?? (video.published ? 'published' : 'draft')
}

function isCreatorOf(video: VideoDocument, viewer: VideoViewer): boolean {
  return Boolean(
    viewer.id && video.creator && String(video.creator) === String(viewer.id),
  )
}

function toVideoDto(
  video: VideoDocument & { _id: unknown },
  options: { purchased: boolean; viewer: VideoViewer },
): VideoDto {
  const isAdmin = options.viewer.role === 'admin'
  const isCreator = isCreatorOf(video, options.viewer)
  const canManage = isAdmin || isCreator
  // Free published videos are immediately watchable; managers can preview
  // their own work. Nothing unpublished is watchable through the buyer flow.
  const purchased = options.purchased || (video.priceKobo === 0 && video.published)
  const canWatch =
    purchased ||
    isAdmin ||
    (isCreator && video.published && Boolean(video.youtubeVideoId))
  const status = statusOf(video)

  return {
    id: String(video._id),
    title: video.title,
    description: video.description,
    subject: video.subject ?? '',
    classLevel: video.classLevel ?? '',
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
    ...(canWatch && video.youtubeVideoId
      ? { watchUrl: watchUrlFor(video.youtubeVideoId) }
      : {}),
    ...(isAdmin && video.youtubeVideoId
      ? {
          youtubeUrl: watchUrlFor(video.youtubeVideoId),
          studioUrl: studioUrlFor(video.youtubeVideoId),
        }
      : {}),
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
  const paid = await paidVideoIds(viewer.id)

  return videos.map((video) =>
    toVideoDto(video, { purchased: paid.has(String(video._id)), viewer }),
  )
}

/** Admin review queue: uploads that finished on YouTube but are still private. */
export async function listReviewQueue(): Promise<VideoDto[]> {
  const videos = await VideoModel.find({ status: 'pending_review' })
    .sort({ createdAt: 1 })
    .lean()
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

  const purchased = viewer.id ? await hasPaidAccess(viewer.id, id) : false
  return toVideoDto(video, { purchased, viewer })
}

/** Returns the YouTube URL only when the viewer has access. */
export async function getWatchUrl(
  id: string,
  viewer: VideoViewer,
): Promise<{ watchUrl: string }> {
  const video = await VideoModel.findById(id).lean()
  if (!video) throw AppError.notFound('Video not found')

  const isAdmin = viewer.role === 'admin'
  const isCreator = isCreatorOf(video, viewer)
  if (!video.published && !isAdmin) {
    if (isCreator) {
      throw AppError.forbidden('This video is still under review.')
    }
    throw AppError.notFound('Video not found')
  }

  if (!video.youtubeVideoId) {
    throw AppError.conflict('This video has not finished uploading yet.')
  }

  const purchased =
    video.priceKobo === 0 || (viewer.id ? await hasPaidAccess(viewer.id, id) : false)
  if (!purchased && !isAdmin && !(isCreator && video.published)) {
    throw AppError.paymentRequired('Buy this video before you can watch it.')
  }

  return { watchUrl: watchUrlFor(video.youtubeVideoId) }
}

/**
 * Starts a resumable YouTube upload session. The browser PUTs the file bytes
 * directly to Google; this endpoint only returns the one-time session URL.
 */
export async function startVideoUpload(
  input: StartVideoUploadInput,
  viewer: VideoViewer,
): Promise<StartUploadResult> {
  if (!viewer.id) throw AppError.unauthorized('Authentication required')
  if (!isYouTubeConfigured()) {
    throw AppError.serviceUnavailable(
      'YouTube uploads are not configured yet. Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN and YOUTUBE_CHANNEL_ID to the API environment.',
    )
  }

  const user = await UserModel.findById(viewer.id)
    .select('_id username role creatorStatus')
    .lean()
  if (!user) throw AppError.notFound('Account not found')

  const creatorProfile =
    viewer.role === 'admin' ? null : await getApprovedCreator(viewer.id)
  if (viewer.role !== 'admin' && user.creatorStatus !== 'approved') {
    throw AppError.forbidden(
      'Only approved creators can upload videos. Verify your account to become a creator.',
    )
  }

  const { uploadUrl } = await initiateResumableUpload({
    title: input.title,
    description: input.description,
    mimeType: input.mimeType,
    sizeBytes: input.fileSizeBytes,
    privacyStatus: 'private',
    madeForKids: input.madeForKids,
  })

  const uploadExpiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS)
  const video = await VideoModel.create({
    title: input.title,
    description: input.description,
    subject: input.subject,
    classLevel: input.classLevel,
    youtubeVideoId: '',
    youtubeUploadUrl: uploadUrl,
    uploadExpiresAt,
    durationSeconds: 0,
    priceKobo: env.VIDEO_DEFAULT_PRICE_KOBO,
    currency: env.PAYSTACK_CURRENCY,
    published: false,
    status: 'uploading',
    createdBy: viewer.id,
    ...(creatorProfile
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
          }),
    originalFileName: input.fileName,
    fileMimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })

  return {
    video: toVideoDto(video.toObject(), { purchased: false, viewer }),
    uploadUrl,
    uploadExpiresAt: uploadExpiresAt.toISOString(),
  }
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

/** Finalizes the browser upload after YouTube returns the new video id. */
export async function completeVideoUpload(
  id: string,
  youtubeVideoId: string,
  viewer: VideoViewer,
): Promise<VideoDto> {
  const video = await VideoModel.findById(id)
  if (!video) throw AppError.notFound('Video not found')
  assertCanManage(video, viewer)

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

  // A session started as private should stay private until an admin approves
  // it, even if the browser somehow changed the setting. If we cannot secure
  // it, remove the YouTube copy rather than leave it public.
  if (info.privacyStatus !== 'private') {
    try {
      await updateVideoPrivacy(youtubeVideoId, 'private')
    } catch (error) {
      logger.warn(
        { err: error, youtubeVideoId },
        'Could not force an uploaded YouTube video back to private',
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
        'Talma could not make the YouTube copy private, so the upload was removed. Please try again.',
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

/** Admin-only: switch an approved private upload to unlisted and publish it. */
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
  if (video.status !== 'pending_review' || !video.youtubeVideoId) {
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

  // Re-check the YouTube copy at approval time. The upload may still have been
  // processing when the browser finalized it, and the creator could have
  // changed or removed it in Studio in the meantime.
  const info = await getVideoInfo(video.youtubeVideoId)
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
      await forcePrivate(video.youtubeVideoId, info.privacyStatus)
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
    await deleteYouTubeVideo(video.youtubeVideoId).catch(() => undefined)
    video.status = 'failed'
    await video.save()
    throw AppError.badRequest('Videos must be one hour or shorter.')
  }

  await updateVideoPrivacy(video.youtubeVideoId, 'unlisted')

  video.status = 'published'
  video.published = true
  video.durationSeconds = info.durationSeconds
  video.reviewedBy = new mongoose.Types.ObjectId(adminId)
  video.reviewedAt = new Date()
  video.rejectionReason = undefined
  video.creatorSharePercent = creatorSharePercent
  if (priceNaira !== undefined) video.priceKobo = Math.round(priceNaira * 100)
  await video.save()

  return toVideoDto(video.toObject(), { purchased: false, viewer: { id: adminId, role: 'admin' } })
}

/** Admin-only: delete a rejected upload from YouTube and mark it rejected. */
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

  if (video.youtubeVideoId) {
    try {
      await deleteYouTubeVideo(video.youtubeVideoId)
    } catch (error) {
      logger.warn(
        { err: error, videoId: String(video._id), youtubeVideoId: video.youtubeVideoId },
        'Could not delete the rejected YouTube video; it remains private on the channel',
      )
    }
  }

  video.status = 'rejected'
  video.published = false
  video.reviewedBy = new mongoose.Types.ObjectId(adminId)
  video.reviewedAt = new Date()
  video.rejectionReason = reason
  video.youtubeUploadUrl = undefined
  await video.save()

  return toVideoDto(video.toObject(), { purchased: false, viewer: { id: adminId, role: 'admin' } })
}

/** Starts a Paystack checkout for a video. The amount always comes from the API. */
export async function startCheckout(videoId: string, userId: string): Promise<CheckoutResult> {
  const video = await VideoModel.findOne({ _id: videoId, published: true })
  if (!video) {
    throw AppError.notFound('Video not found')
  }
  if (!video.youtubeVideoId) {
    throw AppError.conflict('This video is not ready to watch yet.')
  }

  if (video.priceKobo === 0) {
    return {
      alreadyPurchased: true,
      amountKobo: 0,
      currency: video.currency,
      watchUrl: watchUrlFor(video.youtubeVideoId),
    }
  }

  if (await hasPaidAccess(userId, videoId)) {
    return {
      alreadyPurchased: true,
      amountKobo: video.priceKobo,
      currency: video.currency,
      watchUrl: watchUrlFor(video.youtubeVideoId),
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

  let syncYouTube = false
  if (input.youtubeUrl !== undefined) {
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
  }
  if (input.description !== undefined && input.description !== video.description) {
    video.description = input.description
    syncYouTube = true
  }
  if (input.subject !== undefined) video.subject = input.subject
  if (input.classLevel !== undefined) video.classLevel = input.classLevel
  if (input.durationSeconds !== undefined) video.durationSeconds = input.durationSeconds
  if (input.priceNaira !== undefined) video.priceKobo = Math.round(input.priceNaira * 100)
  if (input.published !== undefined) {
    video.published = input.published
    video.status = input.published ? 'published' : 'draft'
  }

  if (syncYouTube && video.youtubeVideoId && video.status === 'published') {
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

  if (video.youtubeVideoId) {
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
 * Proxies the YouTube thumbnail through the API so the YouTube id (and
 * therefore the watch URL) never appears in the browser for a locked video.
 * Private, unreviewed uploads get a placeholder because YouTube does not serve
 * their thumbnails publicly.
 */
export async function getVideoThumbnail(id: string): Promise<VideoThumbnail | null> {
  const video = await VideoModel.findById(id)
    .select('youtubeVideoId title status published')
    .lean()
  if (!video) return null

  const status = video.status ?? (video.published ? 'published' : 'draft')

  if (status === 'published' && video.youtubeVideoId) {
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


