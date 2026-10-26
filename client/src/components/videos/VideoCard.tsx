import type { VideoItem } from '../../types'

interface VideoCardProps {
  video: VideoItem
  isAdmin: boolean
  paying: boolean
  sharePercent: number
  onUnlock: (video: VideoItem) => void
  onEdit: (video: VideoItem) => void
  onDelete: (video: VideoItem) => void
}

function formatPrice(kobo: number, currency: string): string {
  const amount = kobo / 100
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  return `${Math.max(minutes, 1)}m`
}

function statusBadge(video: VideoItem, isAdmin: boolean): {
  label: string
  className: string
} | null {
  if (video.published) {
    if (video.purchased) {
      return { label: 'Unlocked', className: 'bg-[#3a8f4d] text-white' }
    }
    if (isAdmin) {
      return { label: 'Live', className: 'bg-[#0a0a0a]/85 text-white' }
    }
    return null
  }

  switch (video.status) {
    case 'uploading':
      return { label: 'Uploading', className: 'bg-[#1d4ed8] text-white' }
    case 'pending_review':
      return { label: 'In review', className: 'bg-[#f5c842] text-[#0a0a0a]' }
    case 'rejected':
      return { label: 'Rejected', className: 'bg-[#991b1b] text-white' }
    case 'failed':
      return { label: 'Upload failed', className: 'bg-[#991b1b] text-white' }
    case 'draft':
      return { label: 'Draft', className: 'bg-[#0a0a0a]/85 text-white' }
    default:
      return null
  }
}

export default function VideoCard({
  video,
  isAdmin,
  paying,
  sharePercent,
  onUnlock,
  onEdit,
  onDelete,
}: VideoCardProps) {
  const duration = formatDuration(video.durationSeconds)
  const badge = statusBadge(video, isAdmin)
  const owner = !isAdmin && video.canManage
  const canWatch = Boolean(video.watchUrl)
  const canEdit = isAdmin && (video.status === 'published' || video.status === 'draft')
  const canDelete = video.canManage

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-[#0a0a0a]">
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-[#0a0a0a]/85 px-2 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}

        {badge && (
          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
          >
            {video.published && video.purchased && <i className="bi bi-unlock-fill" />}
            {badge.label}
          </span>
        )}

        {video.locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/60 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5c842] text-[#0a0a0a]">
              <i className="bi bi-lock-fill text-xl" />
            </div>
            <span className="mt-2 text-sm font-semibold">
              {formatPrice(video.priceKobo, video.currency)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold leading-snug text-[#0a0a0a]">
            {video.title}
          </h3>
          {owner && (
            <span className="shrink-0 rounded-full bg-[#fdf5d7] px-2 py-0.5 text-[11px] font-semibold text-[#8a6d00]">
              Your video
            </span>
          )}
        </div>

        {video.creator && !owner && (
          <p className="mt-0.5 text-xs text-[#7b857b]">By {video.creator.name}</p>
        )}

        {(video.subject || video.classLevel) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {video.subject && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f9e8] px-2.5 py-1 text-[11px] font-semibold text-[#2f6b3d]">
                <i className="bi bi-book" />
                {video.subject}
              </span>
            )}
            {video.classLevel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf5d7] px-2.5 py-1 text-[11px] font-semibold text-[#8a6d00]">
                <i className="bi bi-mortarboard" />
                {video.classLevel}
              </span>
            )}
          </div>
        )}

        {video.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[#4d554d]">{video.description}</p>
        )}

        {video.status === 'rejected' && video.rejectionReason && (
          <p className="mt-2 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs text-[#991b1b]">
            <strong>Reviewer:</strong> {video.rejectionReason}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7b857b]">
              {video.purchased
                ? 'Lifetime access'
                : owner
                  ? 'Your listing'
                  : isAdmin
                    ? 'Student price'
                    : 'One-time price'}
            </p>
            <p className="font-heading text-xl font-semibold text-[#0a0a0a]">
              {formatPrice(video.priceKobo, video.currency)}
            </p>
          </div>

          {canWatch ? (
            <a
              href={video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
            >
              <i className="bi bi-youtube text-base text-[#f5c842]" />
              {video.purchased ? 'Watch' : 'Preview'}
            </a>
          ) : video.locked ? (
            <button
              type="button"
              onClick={() => onUnlock(video)}
              disabled={paying}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#e9b92b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a] border-t-transparent" />
                  Opening…
                </>
              ) : (
                <>
                  <i className="bi bi-lock-fill" />
                  Unlock
                </>
              )}
            </button>
          ) : (
            <span className="text-right text-xs font-medium text-[#7b857b]">
              {video.status === 'pending_review' && 'Awaiting admin review'}
              {video.status === 'uploading' && 'Upload in progress'}
              {video.status === 'rejected' && 'Not published'}
              {video.status === 'failed' && 'Upload failed'}
              {video.status === 'draft' && 'Draft'}
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-[#7b857b]">
          {video.purchased
            ? 'Opens on YouTube in a new tab.'
            : owner
              ? `You earn ${sharePercent}% of every sale of this lesson.`
              : isAdmin
                ? 'Students pay this once; you can preview it any time.'
                : 'Secure payment with Paystack. Unlocks instantly.'}
        </p>

        {(canEdit || canDelete) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef1ee] pt-4">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(video)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e9e6] px-3 py-1.5 text-xs font-semibold text-[#4d554d] hover:bg-[#f7f9f7]"
              >
                <i className="bi bi-pencil" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(video)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e9e6] px-3 py-1.5 text-xs font-semibold text-[#8a6d00] hover:bg-[#fdf5d7]"
              >
                <i className="bi bi-trash" />
                Delete
              </button>
            )}
            {isAdmin && video.studioUrl && (
              <a
                href={video.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e9e6] px-3 py-1.5 text-xs font-semibold text-[#4d554d] hover:bg-[#f7f9f7]"
              >
                <i className="bi bi-youtube text-[#c4302b]" />
                Studio
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
