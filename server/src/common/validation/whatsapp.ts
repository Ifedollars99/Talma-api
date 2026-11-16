import { z } from 'zod'

/**
 * WhatsApp group and community invites all use `chat.whatsapp.com/<code>`.
 * Channel links use `whatsapp.com/channel/<code>` instead.
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

/** Validates and normalises a required WhatsApp group/community link. */
export const whatsappGroupUrlSchema = z
  .string()
  .trim()
  .max(500, 'The WhatsApp link is too long')
  .transform((value, ctx) => {
    const normalized = normalizeWhatsAppUrl(value)
    if (!isWhatsAppGroupUrl(normalized)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: WHATSAPP_LINK_ERROR })
      return z.NEVER
    }
    return normalized
  })
