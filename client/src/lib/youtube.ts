/**
 * The public YouTube channel that hosts creator lessons.
 *
 * Video posts link here instead of playing in the app, so the lesson stays on
 * YouTube. Override with `VITE_YOUTUBE_CHANNEL_URL` when the channel changes.
 */
export const YOUTUBE_CHANNEL_URL =
  import.meta.env.VITE_YOUTUBE_CHANNEL_URL?.replace(/\/$/, '') ||
  'https://www.youtube.com/channel/UC8wguPsbe2qabPZ7ofshk3w/videos'

/** Extracts the video id from the common YouTube URL shapes. */
export function youtubeVideoId(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null
    }
    if (/^(www\.|m\.)?youtube\.com$/i.test(parsed.hostname)) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }
      const match = /^\/(?:embed|shorts|live)\/([\w-]+)/.exec(parsed.pathname)
      return match?.[1] ?? null
    }
  } catch {
    return null
  }
  return null
}
