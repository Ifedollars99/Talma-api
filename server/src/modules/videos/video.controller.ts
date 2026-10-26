import type { Request, Response } from 'express'
import { asyncHandler } from '../../common/middleware/errorHandler.js'
import { isValidPaystackSignature } from '../payments/paystack.client.js'
import * as videoService from './video.service.js'
import type {
  ApproveVideoInput,
  CompleteVideoUploadInput,
  CreateVideoInput,
  RejectVideoInput,
  StartVideoUploadInput,
  UpdateVideoInput,
  VerifyPurchaseInput,
} from './video.validation.js'

function viewerOf(req: Request): videoService.VideoViewer {
  return {
    ...(req.userId ? { id: req.userId } : {}),
    ...(req.auth?.role ? { role: req.auth.role } : {}),
  }
}

/** GET /api/videos */
export async function list(req: Request, res: Response): Promise<void> {
  const videos = await videoService.listVideos(viewerOf(req))
  res.json({ videos })
}

/** GET /api/videos/mine */
export async function mine(req: Request, res: Response): Promise<void> {
  const videos = await videoService.listMyVideos(viewerOf(req))
  res.json({ videos })
}

/** GET /api/videos/review — admin only. */
export async function reviewQueue(_req: Request, res: Response): Promise<void> {
  const videos = await videoService.listReviewQueue()
  res.json({ videos })
}

/** GET /api/videos/:id */
export async function detail(req: Request, res: Response): Promise<void> {
  const video = await videoService.getVideo(req.params.id as string, viewerOf(req))
  res.json({ video })
}

/** GET /api/videos/:id/watch */
export async function watch(req: Request, res: Response): Promise<void> {
  const result = await videoService.getWatchUrl(req.params.id as string, viewerOf(req))
  res.setHeader('Cache-Control', 'no-store')
  res.json(result)
}

/** GET /api/videos/:id/thumbnail — public, but never exposes the YouTube id. */
export async function thumbnail(req: Request, res: Response): Promise<void> {
  const image = await videoService.getVideoThumbnail(req.params.id as string)
  if (!image) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Thumbnail not found' } })
    return
  }

  res.setHeader('Content-Type', image.contentType)
  res.setHeader('Cache-Control', `public, max-age=${image.cacheSeconds}`)
  res.send(image.buffer)
}

/** POST /api/videos/:id/checkout */
export async function checkout(req: Request, res: Response): Promise<void> {
  const result = await videoService.startCheckout(
    req.params.id as string,
    req.userId as string,
  )
  res.status(201).json(result)
}

/** POST /api/videos/purchases/verify */
export async function verifyPurchase(req: Request, res: Response): Promise<void> {
  const { reference } = req.body as VerifyPurchaseInput
  const result = await videoService.verifyVideoPurchase(reference, req.userId as string)
  res.json(result)
}

/** POST /api/videos/uploads — approved creators only. */
export async function startUpload(req: Request, res: Response): Promise<void> {
  const result = await videoService.startVideoUpload(
    req.body as StartVideoUploadInput,
    viewerOf(req),
  )
  res.status(201).json(result)
}

/** POST /api/videos/:id/upload-complete — the uploader finalizes the YouTube id. */
export async function completeUpload(req: Request, res: Response): Promise<void> {
  const { youtubeVideoId } = req.body as CompleteVideoUploadInput
  const video = await videoService.completeVideoUpload(
    req.params.id as string,
    youtubeVideoId,
    viewerOf(req),
  )
  res.json({ video })
}

/** POST /api/videos/:id/approve — admin only. */
export async function approve(req: Request, res: Response): Promise<void> {
  const { priceNaira } = req.body as ApproveVideoInput
  const video = await videoService.approveVideo(
    req.params.id as string,
    priceNaira,
    req.userId as string,
  )
  res.json({ video })
}

/** POST /api/videos/:id/reject — admin only. */
export async function reject(req: Request, res: Response): Promise<void> {
  const { reason } = req.body as RejectVideoInput
  const video = await videoService.rejectVideo(
    req.params.id as string,
    reason,
    req.userId as string,
  )
  res.json({ video })
}

/** POST /api/videos — admin legacy flow: add an existing YouTube link. */
export async function create(req: Request, res: Response): Promise<void> {
  const video = await videoService.createVideo(
    req.body as CreateVideoInput,
    req.userId as string,
  )
  res.status(201).json({ video })
}

/** PATCH /api/videos/:id — admin only. */
export async function update(req: Request, res: Response): Promise<void> {
  const video = await videoService.updateVideo(
    req.params.id as string,
    req.body as UpdateVideoInput,
    req.userId as string,
  )
  res.json({ video })
}

/** DELETE /api/videos/:id — administrators, or creators removing unsold work. */
export async function remove(req: Request, res: Response): Promise<void> {
  await videoService.deleteVideo(req.params.id as string, viewerOf(req))
  res.status(204).send()
}

/**
 * POST /api/payments/paystack/webhook
 *
 * Mounted in `app.ts` with `express.raw()` **before** the JSON parser, because
 * Paystack signs the exact bytes of the request body.
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature']
  if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid webhook request' } })
    return
  }

  if (!isValidPaystackSignature(req.body, signature)) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } })
    return
  }

  let payload: unknown
  try {
    payload = JSON.parse(req.body.toString('utf8'))
  } catch {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON payload' } })
    return
  }

  await videoService.processPaystackWebhook(payload)
  res.status(200).json({ received: true })
})
