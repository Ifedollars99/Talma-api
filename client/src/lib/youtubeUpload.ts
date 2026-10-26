/**
 * Browser-side YouTube resumable upload.
 *
 * The Talma API creates a one-time Google resumable session URL; this helper
 * sends the file to that URL in 8 MiB chunks. Google's resumable protocol
 * answers `308 Resume Incomplete` for chunks that were accepted but are not
 * the end of the file, and returns the finished video resource on the last
 * chunk. Large files never pass through the Talma API.
 */

const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024
const MAX_RETRIES = 3

export class YouTubeUploadError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'YouTubeUploadError'
    this.status = status
  }
}

export interface YouTubeUploadResult {
  /** The new 11-character YouTube video id. */
  id: string
  raw: unknown
}

export interface YouTubeUploadOptions {
  /** 8 MiB by default; must be a multiple of 256 KiB except the final chunk. */
  chunkSize?: number
  /** Must match the MIME type declared when the session was created. */
  mimeType?: string
  signal?: AbortSignal
  onProgress?: (uploadedBytes: number, totalBytes: number, percent: number) => void
}

interface ChunkResult {
  done: boolean
  status: number
  range: string | null
  body?: unknown
}

interface StatusResult {
  offset: number
  completed?: unknown
}

function parseJson(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function googleErrorMessage(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) return fallback
  const error = (body as { error?: unknown }).error
  if (typeof error !== 'object' || error === null) return fallback
  const record = error as { message?: unknown; errors?: unknown }
  if (Array.isArray(record.errors)) {
    const first = record.errors[0]
    if (typeof first === 'object' && first !== null) {
      const reason = (first as { reason?: unknown }).reason
      if (typeof reason === 'string' && reason) return reason
    }
  }
  return typeof record.message === 'string' && record.message ? record.message : fallback
}

function resumeOffset(range: string | null, fallback: number): number {
  if (!range) return fallback
  const match = /bytes=0-(\d+)/i.exec(range)
  return match ? Number(match[1]) + 1 : fallback
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function sendChunk(
  uploadUrl: string,
  blob: Blob,
  contentRange: string,
  mimeType: string,
  offset: number,
  total: number,
  options: YouTubeUploadOptions,
): Promise<ChunkResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', mimeType || 'application/octet-stream')
    xhr.setRequestHeader('Content-Range', contentRange)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const uploaded = Math.min(offset + event.loaded, total)
      options.onProgress?.(uploaded, total, total > 0 ? (uploaded / total) * 100 : 0)
    }

    xhr.onload = () => {
      const body = parseJson(xhr.responseText)
      if (xhr.status === 200 || xhr.status === 201) {
        options.onProgress?.(total, total, 100)
        resolve({ done: true, status: xhr.status, range: null, body })
        return
      }
      if (xhr.status === 308) {
        resolve({
          done: false,
          status: xhr.status,
          range: xhr.getResponseHeader('Range'),
        })
        return
      }

      reject(
        new YouTubeUploadError(
          googleErrorMessage(body, `YouTube rejected the upload (HTTP ${xhr.status}).`),
          xhr.status,
        ),
      )
    }

    xhr.onerror = () =>
      reject(new YouTubeUploadError('The network dropped during the upload. Retrying…'))
    xhr.ontimeout = () =>
      reject(new YouTubeUploadError('The upload timed out. Retrying…'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException('Upload cancelled', 'AbortError'))
        return
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(blob)
  })
}

/** Asks Google how many bytes it has received for this session. */
function queryUploadStatus(
  uploadUrl: string,
  total: number,
  signal?: AbortSignal,
): Promise<StatusResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Range', `bytes */${total}`)

    xhr.onload = () => {
      const body = parseJson(xhr.responseText)
      if (xhr.status === 200 || xhr.status === 201) {
        resolve({ offset: total, completed: body })
        return
      }
      if (xhr.status === 308) {
        resolve({
          offset: resumeOffset(xhr.getResponseHeader('Range'), 0),
        })
        return
      }
      reject(
        new YouTubeUploadError(
          googleErrorMessage(body, `YouTube could not report the upload status (HTTP ${xhr.status}).`),
          xhr.status,
        ),
      )
    }

    xhr.onerror = () =>
      reject(new YouTubeUploadError('Could not reach YouTube to resume the upload.'))
    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('Upload cancelled', 'AbortError'))
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send()
  })
}

function parseResult(body: unknown): YouTubeUploadResult {
  if (typeof body !== 'object' || body === null) {
    throw new YouTubeUploadError('YouTube finished the upload but returned no video id.')
  }
  const id = (body as { id?: unknown }).id
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new YouTubeUploadError('YouTube finished the upload but returned no video id.')
  }
  return { id, raw: body }
}

/**
 * Uploads `file` to a Google resumable session. Throws `YouTubeUploadError` on
 * a permanent failure and `DOMException('AbortError')` when cancelled.
 */
export async function uploadFileToYouTube(
  uploadUrl: string,
  file: File,
  options: YouTubeUploadOptions = {},
): Promise<YouTubeUploadResult> {
  if (!file.size) {
    throw new YouTubeUploadError('The selected file is empty.')
  }

  const chunkSize = Math.max(256 * 1024, options.chunkSize ?? DEFAULT_CHUNK_SIZE)
  const mimeType = options.mimeType || file.type || 'video/mp4'
  const total = file.size
  let offset = 0
  let failures = 0

  while (offset < total) {
    if (options.signal?.aborted) {
      throw new DOMException('Upload cancelled', 'AbortError')
    }

    const end = Math.min(offset + chunkSize, total) - 1
    const contentRange = `bytes ${offset}-${end}/${total}`

    try {
      const chunk = await sendChunk(
        uploadUrl,
        file.slice(offset, end + 1),
        contentRange,
        mimeType,
        offset,
        total,
        options,
      )

      if (chunk.done) {
        return parseResult(chunk.body)
      }

      failures = 0
      // If Google does not expose the Range header through CORS, assume the
      // chunk was accepted. The next chunk will reveal any discrepancy.
      offset = resumeOffset(chunk.range, end + 1)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error

      failures += 1
      if (failures > MAX_RETRIES) {
        throw error instanceof Error
          ? error
          : new YouTubeUploadError('The upload failed. Please try again.')
      }

      // Wait briefly, then ask Google where to resume. This also recovers from
      // a dropped connection halfway through a chunk.
      await delay(750 * failures)
      try {
        const status = await queryUploadStatus(uploadUrl, total, options.signal)
        if (status.completed) return parseResult(status.completed)
        offset = status.offset
      } catch (statusError) {
        if (statusError instanceof DOMException && statusError.name === 'AbortError') {
          throw statusError
        }
        if (failures > MAX_RETRIES) {
          throw statusError instanceof Error
            ? statusError
            : new YouTubeUploadError('The upload failed. Please try again.')
        }
      }
    }
  }

  // The loop can only exit after the final chunk, which should have returned
  // `done`. Ask once more in case the last response was lost.
  const status = await queryUploadStatus(uploadUrl, total, options.signal)
  if (status.completed) return parseResult(status.completed)
  throw new YouTubeUploadError('YouTube did not confirm the upload. Please try again.')
}
