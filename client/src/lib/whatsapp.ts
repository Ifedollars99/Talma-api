/**
 * WhatsApp group/community links, shared by Settings, educator verification
 * and the upload gate. Keep this in sync with the API validator.
 */
export const WHATSAPP_LINK_ERROR =
  'Enter a valid WhatsApp group or community link, for example https://chat.whatsapp.com/…'

/** Adds the protocol when someone pastes a link without `https://`. */
export function normalizeWhatsAppUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^(chat\.whatsapp\.com|www\.whatsapp\.com|whatsapp\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

export function isWhatsAppGroupUrl(value: string): boolean {
  const normalized = normalizeWhatsAppUrl(value)
  if (!normalized) return false

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    return false
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()
  if (host === 'chat.whatsapp.com') {
    return url.pathname.replace(/\/+$/, '').length > 1
  }
  if (host === 'whatsapp.com') {
    return /^\/channel\/[^/]+/i.test(url.pathname)
  }
  return false
}
