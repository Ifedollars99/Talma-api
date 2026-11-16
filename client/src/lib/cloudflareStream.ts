import * as tus from 'tus-js-client'

/**
 * Cloudflare Stream recommends tus chunks that are multiples of 256 KiB. 50 MiB
 * is comfortably above the 5 MiB minimum and keeps overhead low for lessons.
 */
const TUS_CHUNK_SIZE_BYTES = 52_428_800

export interface CloudflareUploadOptions {
  file: File
  /** One-time tus URL returned by `POST /api/videos/uploads`. */
  uploadUrl: string
  /** Aborting stops future chunks; tus can still resume from the last offset. */
  signal?: AbortSignal
  onProgress?: (percent: number) => void
  onRetry?: (message: string | null) => void
}

/**
 * Sends the file directly to Cloudflare Stream with the tus protocol.
 *
 * Using the pre-provisioned `uploadUrl` (rather than `endpoint`) means the API
 * token never reaches the browser. Large lessons bypass the Talma API entirely,
 * and interrupted uploads resume from the last acknowledged byte.
 */
export function uploadToCloudflareStream({
  file,
  uploadUrl,
  signal,
  onProgress,
  onRetry,
}: CloudflareUploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    let removeAbortListener: (() => void) | null = null

    const upload = new tus.Upload(file, {
      uploadUrl,
      chunkSize: TUS_CHUNK_SIZE_BYTES,
      retryDelays: [0, 1_000, 3_000, 5_000, 10_000],
      removeFingerprintOnSuccess: true,
      onError(error) {
        if (settled) return
        settled = true
        removeAbortListener?.()
        reject(error)
      },
      onProgress(bytesUploaded, bytesTotal) {
        if (settled || !bytesTotal) return
        onProgress?.(Math.min(100, (bytesUploaded / bytesTotal) * 100))
      },
      onSuccess() {
        if (settled) return
        settled = true
        removeAbortListener?.()
        onProgress?.(100)
        resolve()
      },
      onShouldRetry() {
        onRetry?.('Connection interrupted — resuming the upload…')
        return true
      },
    })

    const abort = () => {
      if (settled) return
      onRetry?.(null)
      void upload.abort().catch(() => undefined)
      settled = true
      removeAbortListener?.()
      reject(new DOMException('Upload cancelled', 'AbortError'))
    }

    if (signal?.aborted) {
      abort()
      return
    }

    if (signal) {
      signal.addEventListener('abort', abort, { once: true })
      removeAbortListener = () => signal.removeEventListener('abort', abort)
    }

    onRetry?.(null)
    upload.start()
  })
}
