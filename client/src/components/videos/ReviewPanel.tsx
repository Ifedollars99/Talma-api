import { useState } from 'react'
import { ApiError } from '../../lib/apiClient'
import { useApproveVideo, useRejectVideo, useReviewQueue } from '../../hooks/useVideos'
import Modal from '../ui/Modal'
import type { VideoItem } from '../../types'

interface ReviewPanelProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function formatDuration(seconds: number): string {
  if (!seconds) return 'Duration pending'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  return `${Math.max(minutes, 1)}m`
}

export default function ReviewPanel({ onSuccess, onError }: ReviewPanelProps) {
  const review = useReviewQueue()
  const approve = useApproveVideo()
  const reject = useRejectVideo()

  const [prices, setPrices] = useState<Record<string, string>>({})
  const [rejecting, setRejecting] = useState<VideoItem | null>(null)
  const [reason, setReason] = useState('')

  const videos = review.data?.videos ?? []

  const priceFor = (video: VideoItem): string =>
    prices[video.id] ?? String(Math.round(video.priceKobo / 100))

  const handleApprove = (video: VideoItem) => {
    const price = Number(priceFor(video))
    if (!Number.isFinite(price) || price < 0) {
      onError('Enter a valid price.')
      return
    }

    approve.mutate(
      { id: video.id, priceNaira: price },
      {
        onSuccess: () => onSuccess(`“${video.title}” is now live in the library.`),
        onError: (caught) =>
          onError(
            caught instanceof ApiError ? caught.message : 'Could not approve this video.',
          ),
      },
    )
  }

  const handleReject = () => {
    if (!rejecting) return
    if (reason.trim().length < 2) {
      onError('Give the creator a reason for the rejection.')
      return
    }

    reject.mutate(
      { id: rejecting.id, reason: reason.trim() },
      {
        onSuccess: () => {
          onSuccess(`“${rejecting.title}” was rejected and removed from YouTube.`)
          setRejecting(null)
          setReason('')
        },
        onError: (caught) =>
          onError(caught instanceof ApiError ? caught.message : 'Could not reject this video.'),
      },
    )
  }

  if (review.isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-[#e6e9e6] bg-white"
          />
        ))}
      </div>
    )
  }

  if (review.isError) {
    return (
      <div className="rounded-xl border border-[#e6e9e6] bg-white px-5 py-8 text-center">
        <p className="text-[#4d554d]">
          {review.error instanceof ApiError
            ? review.error.message
            : 'Could not load the review queue.'}
        </p>
        <button
          type="button"
          onClick={() => void review.refetch()}
          className="mt-3 font-semibold text-[#8a6d00] underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cfd6cf] bg-white px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f9e8]">
          <i className="bi bi-check2-circle text-2xl text-[#3a8f4d]" />
        </div>
        <h3 className="font-heading text-xl font-semibold text-[#0a0a0a]">
          Nothing waiting for review
        </h3>
        <p className="mx-auto mt-1 max-w-md text-[#4d554d]">
          Creator uploads appear here after YouTube finishes processing them.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#f5c842]/50 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
        <i className="bi bi-info-circle me-2" />
        Each upload is <strong>unlisted</strong> and hidden from the library until you approve
        it. Watch it in YouTube Studio before publishing.
      </div>

      {videos.map((video) => {
        const approving = approve.isPending && approve.variables?.id === video.id
        return (
          <article
            key={video.id}
            className="overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white shadow-sm"
          >
            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <div className="relative aspect-video bg-[#0a0a0a] md:aspect-auto md:min-h-[150px]">
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-2 top-2 rounded-full bg-[#f5c842] px-2.5 py-1 text-xs font-semibold text-[#0a0a0a]">
                  In review
                </span>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[#0a0a0a]">
                      {video.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#7b857b]">
                      {video.creator?.name ?? 'Talma'} · {formatDuration(video.durationSeconds)}
                      {video.uploadedAt
                        ? ` · uploaded ${new Date(video.uploadedAt).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  {video.studioUrl && (
                    <a
                      href={video.studioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e9e6] px-3 py-1.5 text-xs font-semibold text-[#4d554d] hover:bg-[#f7f9f7]"
                    >
                      <i className="bi bi-youtube text-[#c4302b]" />
                      Open in YouTube Studio
                    </a>
                  )}
                </div>

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
                  <p className="mt-2 line-clamp-2 text-sm text-[#4d554d]">{video.description}</p>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div>
                    <label
                      htmlFor={`review-price-${video.id}`}
                      className="block text-xs font-medium text-[#4d554d]"
                    >
                      Creator&apos;s price (₦)
                    </label>
                    <input
                      id={`review-price-${video.id}`}
                      type="number"
                      min={0}
                      step={100}
                      value={priceFor(video)}
                      onChange={(event) =>
                        setPrices((current) => ({
                          ...current,
                          [video.id]: event.target.value,
                        }))
                      }
                      className="mt-1 w-28 rounded-lg border border-[#e6e9e6] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
                    />
                    <p className="mt-1 max-w-[180px] text-[11px] text-[#7b857b]">
                      The creator chose this amount. You can adjust it before publishing.
                    </p>
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejecting(video)
                        setReason('')
                      }}
                      className="rounded-xl border border-[#e6e9e6] px-4 py-2 text-sm font-semibold text-[#8a6d00] hover:bg-[#fdf5d7]"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(video)}
                      disabled={approving}
                      className="rounded-xl bg-[#3a8f4d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c7a40] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {approving ? 'Publishing…' : 'Approve & publish'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      })}

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        closeOnBackdrop={false}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        labelledBy="reject-video-title"
      >
        <h3
          id="reject-video-title"
          className="font-heading text-xl font-semibold text-[#0a0a0a]"
        >
          Reject “{rejecting?.title}”?
        </h3>
        <p className="mt-1 text-sm text-[#4d554d]">
          The YouTube copy will be deleted. The creator will see your reason in “My videos”.
        </p>
        <label htmlFor="reject-reason" className="mt-4 block text-sm font-medium text-[#4d554d]">
          Reason
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="e.g. The audio contains copyrighted music."
          className="mt-1 w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
        />
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setRejecting(null)}
            className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={reject.isPending}
            className="flex-1 rounded-xl bg-[#8a6d00] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {reject.isPending ? 'Rejecting…' : 'Reject video'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
