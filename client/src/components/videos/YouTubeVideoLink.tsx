import { YOUTUBE_CHANNEL_URL, youtubeVideoId } from '../../lib/youtube'

interface YouTubeVideoLinkProps {
  /** The specific YouTube video to play, when the post has one. */
  href?: string
  /**
   * The uploaded file. It is only used to show a still preview frame — the
   * video never plays inside Talma; clicking the card opens YouTube.
   */
  mediaUrl?: string
  /** Post text, used for the accessible link label. */
  title?: string
  className?: string
}

/** A clickable preview that opens the video on YouTube. */
export default function YouTubeVideoLink({
  href,
  mediaUrl,
  title,
  className = '',
}: YouTubeVideoLinkProps) {
  const target = href || YOUTUBE_CHANNEL_URL
  const videoId = youtubeVideoId(href)
  const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null

  return (
    <a
      href={target}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title ? `Watch “${title}” on YouTube` : 'Watch this video on YouTube'}
      className={`group relative block aspect-video overflow-hidden rounded-2xl border border-[#e6e9e6] bg-[#0a0a0a] ${className}`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="pointer-events-none h-full w-full object-cover"
        />
      ) : mediaUrl ? (
        <video
          src={`${mediaUrl}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#1f1f1f] to-[#0a0a0a]" />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0a]/35 transition-colors group-hover:bg-[#0a0a0a]/55">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5c842] text-[#0a0a0a] shadow-lg transition-transform group-hover:scale-105">
          <i className="bi bi-play-fill text-2xl" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a]/80 px-3 py-1 text-xs font-semibold text-white">
          <i className="bi bi-youtube text-[#f5c842]" />
          Watch on YouTube
        </span>
      </div>
    </a>
  )
}
