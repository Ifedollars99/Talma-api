/** Turns user-selected pictures into small JPEG data URLs for the AI. */

export const MAX_IMAGE_ATTACHMENTS = 4
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/gif'

const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const MAX_DATA_URL_LENGTH = 1_500_000
const MAX_SIDE = 1600

export interface PreparedImage {
  id: string
  name: string
  dataUrl: string
}

export function isSupportedImage(file: File): boolean {
  return SUPPORTED_TYPES.has(file.type)
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('That picture could not be read. Try another one.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That picture could not be opened. Try a PNG or JPEG.'))
    image.src = source
  })
}

/**
 * Resizes and re-encodes a picture so requests stay small and every supported
 * format (including GIF) becomes a still JPEG the AI can read.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!isSupportedImage(file)) {
    throw new Error('Only PNG, JPEG, WebP or GIF pictures can be attached.')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That picture is larger than 12 MB. Try a smaller one.')
  }

  const source = await readAsDataUrl(file)
  const image = await loadImage(source)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height

  if (!width || !height) {
    throw new Error('That picture could not be opened. Try a different image.')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))

  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser could not prepare that picture.')

  // Flatten transparency onto white so PNG screenshots stay readable.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', quality)

  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.4) {
    quality = Math.round((quality - 0.1) * 100) / 100
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  return {
    id: createId(),
    name: file.name || 'picture',
    dataUrl,
  }
}
