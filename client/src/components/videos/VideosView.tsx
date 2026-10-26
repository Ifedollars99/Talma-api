import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { VIDEO_CLASS_LEVELS, VIDEO_SUBJECTS } from '../../lib/videoOptions'
import {
  useCheckoutVideo,
  useCreateVideo,
  useDeleteVideo,
  useMyVideos,
  useReviewQueue,
  useUpdateVideo,
  useVideos,
  useVerifyVideoPayment,
  type CreateVideoInput,
} from '../../hooks/useVideos'
import { useCreatorApplications, useCreatorProfile } from '../../hooks/useCreators'
import { useToast } from '../ui/useToast'
import Modal from '../ui/Modal'
import CreatorUploadModal from './CreatorUploadModal'
import CreatorVerificationModal from './CreatorVerificationModal'
import CreatorApplicationsPanel from './CreatorApplicationsPanel'
import ReviewPanel from './ReviewPanel'
import VideoCard from './VideoCard'
import type { CreatorStatus, VideoItem } from '../../types'

interface VideosViewProps {
  /** `reference`/`trxref` Paystack appends when it redirects the buyer back. */
  paymentReference?: string | null
  onPaymentSettled?: () => void
}

type Tab = 'library' | 'mine' | 'review'

export default function VideosView({
  paymentReference,
  onPaymentSettled,
}: VideosViewProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const profileQuery = useCreatorProfile(Boolean(user) && !isAdmin)
  const creatorProfile = profileQuery.data?.creator ?? null
  const creatorStatus: CreatorStatus = isAdmin
    ? 'approved'
    : (creatorProfile?.status ?? user?.creatorStatus ?? 'none')
  const isCreator = creatorStatus === 'approved'
  const isUploader = isAdmin || isCreator
  // Administrators already see every status in the Library, so a separate
  // "My videos" tab would just duplicate it.
  const showMineTab = isCreator && !isAdmin
  const sharePercent = creatorProfile?.sharePercent ?? 70

  const library = useVideos()
  const mine = useMyVideos(showMineTab)
  const review = useReviewQueue(isAdmin)
  const creatorApplications = useCreatorApplications('pending', isAdmin)
  const checkout = useCheckoutVideo()
  const verifyPayment = useVerifyVideoPayment()
  const deleteVideo = useDeleteVideo()
  const { toast, showSuccess, showError } = useToast()

  const [tab, setTab] = useState<Tab>('library')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<VideoItem | null>(null)
  const [deleting, setDeleting] = useState<VideoItem | null>(null)
  const [verifying, setVerifying] = useState(false)
  const handledReference = useRef<string | null>(null)

  // A role can change while the tab is open (e.g. an admin approves a creator).
  useEffect(() => {
    if (tab === 'mine' && !showMineTab) setTab('library')
    if (tab === 'review' && !isAdmin) setTab('library')
  }, [tab, showMineTab, isAdmin])

  // Reconcile the checkout when Paystack sends the buyer back to Talma.
  useEffect(() => {
    if (!paymentReference || handledReference.current === paymentReference) return
    handledReference.current = paymentReference
    setVerifying(true)

    verifyPayment.mutate(paymentReference, {
      onSuccess: (result) => {
        setVerifying(false)
        if (result.purchase.status === 'paid') {
          showSuccess(`Payment confirmed — “${result.video.title}” is unlocked.`)
        } else {
          showError(
            'Paystack has not confirmed this payment yet. If you were charged, check again in a minute.',
          )
        }
        onPaymentSettled?.()
      },
      onError: (caught) => {
        setVerifying(false)
        showError(
          caught instanceof ApiError
            ? caught.message
            : 'We could not confirm this payment. Please try again.',
        )
        onPaymentSettled?.()
      },
    })
  }, [paymentReference, verifyPayment, onPaymentSettled, showError, showSuccess])

  const handleUnlock = (video: VideoItem) => {
    setPayingId(video.id)
    checkout.mutate(video.id, {
      onSuccess: (result) => {
        if (result.alreadyPurchased) {
          setPayingId(null)
          void library.refetch()
          void mine.refetch()
          showSuccess('You already own this video.')
          return
        }
        if (result.authorizationUrl) {
          // Leave the SPA for Paystack's hosted checkout.
          window.location.assign(result.authorizationUrl)
          return
        }
        setPayingId(null)
        showError('Paystack did not return a checkout link. Please try again.')
      },
      onError: (caught) => {
        setPayingId(null)
        showError(
          caught instanceof ApiError ? caught.message : 'Could not start the payment.',
        )
      },
    })
  }

  const handleDelete = () => {
    if (!deleting) return
    deleteVideo.mutate(deleting.id, {
      onSuccess: () => {
        showSuccess('Video removed.')
        setDeleting(null)
      },
      onError: (caught) => {
        showError(caught instanceof ApiError ? caught.message : 'Could not remove the video.')
      },
    })
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (video: VideoItem) => {
    setEditing(video)
    setFormOpen(true)
  }

  const activeQuery = tab === 'mine' ? mine : library
  const activeVideos = activeQuery.data?.videos ?? []
  const libraryCount = library.data?.videos.length ?? 0
  const mineCount = mine.data?.videos.length ?? 0
  const reviewCount =
    (review.data?.videos.length ?? 0) + (creatorApplications.data?.creators.length ?? 0)
  const profileLoading = !isAdmin && profileQuery.isLoading

  return (
    <div className="space-y-6">
      {toast}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6d00]">
            Creator lessons
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a] mt-1">Multimedia</h2>
          <p className="text-[#4d554d] mt-1">
            Pay once per lesson, then watch it on YouTube whenever you like.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (isUploader ? setUploadOpen(true) : setVerifyOpen(true))}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-5 py-2.5 font-semibold text-[#0a0a0a] shadow-md transition-colors hover:bg-[#e9b92b]"
          >
            <i className="bi bi-cloud-arrow-up" />
            Upload video
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e6e9e6] bg-white px-4 py-2.5 font-semibold text-[#4d554d] transition-colors hover:bg-[#f7f9f7]"
            >
              <i className="bi bi-link-45deg" />
              Add YouTube link
            </button>
          )}
          {!isAdmin && !isCreator && !profileLoading && creatorStatus !== 'pending' && (
            <button
              type="button"
              onClick={() => setVerifyOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#f5c842] bg-[#fdf5d7] px-4 py-2.5 font-semibold text-[#6b5400] transition-colors hover:bg-[#fbeeb8]"
            >
              <i className="bi bi-patch-check" />
              Verify to become a creator
            </button>
          )}
          {!isAdmin && creatorStatus === 'pending' && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#e6e9e6] bg-white px-4 py-2.5 text-sm font-semibold text-[#6b5400]">
              <i className="bi bi-hourglass-split" />
              Creator application pending
            </span>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-[#f5c842]/50 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
          <i className="bi bi-info-circle me-2" />
          Creator uploads stay <strong>private</strong> on YouTube until you approve them in the
          Review tab.
        </div>
      )}

      {!isAdmin && isCreator && (
        <div className="rounded-xl border border-[#d6e8bd] bg-[#f5f9e8] px-4 py-3 text-sm text-[#2c7a40]">
          <i className="bi bi-camera-video me-2" />
          Your uploads are private until an admin reviews them. You keep{' '}
          <strong>{sharePercent}%</strong> of every sale.
        </div>
      )}

      {!isAdmin && creatorStatus === 'pending' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f5c842]/50 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
          <span>
            <i className="bi bi-hourglass-split me-2" />
            Your creator application is under review. You will be able to upload once an admin
            approves it.
          </span>
          <button
            type="button"
            onClick={() => void profileQuery.refetch()}
            disabled={profileQuery.isFetching}
            className="rounded-lg border border-[#f5c842] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b5400] disabled:opacity-60"
          >
            {profileQuery.isFetching ? 'Checking…' : 'Check status'}
          </button>
        </div>
      )}

      {!isAdmin && creatorStatus === 'rejected' && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          <i className="bi bi-x-circle me-2" />
          Your creator application was not approved
          {creatorProfile?.rejectionReason ? `: ${creatorProfile.rejectionReason}` : '.'} You
          can apply again with updated details.
        </div>
      )}

      {!isAdmin && creatorStatus === 'suspended' && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          <i className="bi bi-slash-circle me-2" />
          Your creator account is suspended. Contact Talma support if you think this is a
          mistake.
        </div>
      )}

      {verifying && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-[#e6e9e6] bg-white px-4 py-3 text-sm text-[#4d554d]"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f5c842] border-t-transparent" />
          Confirming your Paystack payment…
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e9e6] pb-2">
        <TabButton active={tab === 'library'} onClick={() => setTab('library')}>
          Library
          <span className="ml-1.5 text-xs text-[#7b857b]">{libraryCount}</span>
        </TabButton>
        {showMineTab && (
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
            My videos
            <span className="ml-1.5 text-xs text-[#7b857b]">{mineCount}</span>
          </TabButton>
        )}
        {isAdmin && (
          <TabButton active={tab === 'review'} onClick={() => setTab('review')}>
            Review
            {reviewCount > 0 && (
              <span className="ml-2 rounded-full bg-[#f5c842] px-2 py-0.5 text-xs font-semibold text-[#0a0a0a]">
                {reviewCount}
              </span>
            )}
          </TabButton>
        )}
      </div>

      {tab === 'review' && isAdmin ? (
        <div className="space-y-8">
          <CreatorApplicationsPanel onSuccess={showSuccess} onError={showError} />
          <ReviewPanel onSuccess={showSuccess} onError={showError} />
        </div>
      ) : (
        <>
          {activeQuery.isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white"
                >
                  <div className="aspect-video bg-[#eef1ee]" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 rounded bg-[#eef1ee]" />
                    <div className="h-3 w-full rounded bg-[#eef1ee]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeQuery.isError && (
            <div className="rounded-xl border border-[#e6e9e6] bg-white px-5 py-8 text-center">
              <p className="text-[#4d554d]">
                {activeQuery.error instanceof ApiError
                  ? activeQuery.error.message
                  : 'Could not load the video library.'}
              </p>
              <button
                type="button"
                onClick={() => void activeQuery.refetch()}
                className="mt-3 font-semibold text-[#8a6d00] underline"
              >
                Try again
              </button>
            </div>
          )}

          {!activeQuery.isLoading && !activeQuery.isError && activeVideos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cfd6cf] bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5d7]">
                <i className="bi bi-camera-video text-2xl text-[#8a6d00]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#0a0a0a]">
                {tab === 'mine' ? 'No uploads yet' : 'No videos yet'}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-[#4d554d]">
                {tab === 'mine'
                  ? 'Upload your first lesson. It stays private until an admin reviews it.'
                  : isAdmin
                    ? 'Creator uploads will appear here after they finish processing on YouTube.'
                    : 'Check back soon — lessons are being added to the library.'}
              </p>
              {tab === 'mine' && (
                <button
                  type="button"
                  onClick={() => (isUploader ? setUploadOpen(true) : setVerifyOpen(true))}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-5 py-2.5 font-semibold text-[#0a0a0a] hover:bg-[#e9b92b]"
                >
                  <i className="bi bi-cloud-arrow-up" />
                  Upload video
                </button>
              )}
            </div>
          )}

          {activeVideos.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {activeVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isAdmin={isAdmin}
                  paying={payingId === video.id && checkout.isPending}
                  sharePercent={sharePercent}
                  onUnlock={handleUnlock}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreatorUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        sharePercent={isAdmin ? 0 : sharePercent}
        onUploaded={() => {
          setUploadOpen(false)
          setTab(showMineTab ? 'mine' : 'library')
          showSuccess('Upload complete — sent to an admin for review.')
        }}
      />

      <CreatorVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={() => {
          void profileQuery.refetch()
          showSuccess('You are now a verified creator. Upload your first video!')
        }}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        labelledBy="video-form-title"
      >
        <VideoForm
          key={editing?.id ?? 'new'}
          video={editing}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => {
            setFormOpen(false)
            setEditing(null)
            showSuccess(message)
          }}
          onError={showError}
        />
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} closeOnBackdrop={false}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdf5d7]">
            <i className="bi bi-exclamation-triangle text-2xl text-[#8a6d00]" />
          </div>
          <h3 className="font-heading text-xl font-semibold text-[#0a0a0a]">Remove this video?</h3>
          <p className="mt-2 text-sm text-[#4d554d]">
            “{deleting?.title}” will be removed from Talma. Talma will also delete its YouTube
            copy when the channel authorization allows it.
            {isAdmin
              ? ' Every purchase record for it will also be deleted, so buyers will lose access.'
              : ' You cannot delete a video that students have already bought or that has a checkout in progress.'}{' '}
            This cannot be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteVideo.isPending}
              className="flex-1 rounded-xl bg-[#8a6d00] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {deleteVideo.isPending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#0a0a0a] text-white'
          : 'text-[#4d554d] hover:bg-[#f7f9f7]'
      }`}
    >
      {children}
    </button>
  )
}

function VideoForm({
  video,
  onClose,
  onSaved,
  onError,
}: {
  video: VideoItem | null
  onClose: () => void
  onSaved: (message: string) => void
  onError: (message: string) => void
}) {
  const createVideo = useCreateVideo()
  const updateVideo = useUpdateVideo()
  const creatorVideo = Boolean(video?.creator)
  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtubeUrl ?? '')
  const [title, setTitle] = useState(video?.title ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [subject, setSubject] = useState(video?.subject ?? '')
  const [classLevel, setClassLevel] = useState(video?.classLevel ?? '')
  const [durationMinutes, setDurationMinutes] = useState(
    video?.durationSeconds ? String(Math.round(video.durationSeconds / 60)) : '',
  )
  const [priceNaira, setPriceNaira] = useState(
    video ? String(video.priceKobo / 100) : '2000',
  )
  const [published, setPublished] = useState(video?.published ?? true)

  const saving = createVideo.isPending || updateVideo.isPending

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!youtubeUrl.trim()) {
      onError('Paste the YouTube link for this video.')
      return
    }
    if (title.trim().length < 2) {
      onError('Give the video a title (at least 2 characters).')
      return
    }
    if (!subject) {
      onError('Choose the subject this video teaches.')
      return
    }
    if (!classLevel) {
      onError('Choose the class level this video is for.')
      return
    }

    const minutes = Number(durationMinutes)
    const price = priceNaira.trim() === '' ? 2000 : Number(priceNaira)
    if (!Number.isFinite(price) || price < 0) {
      onError('Enter a valid price.')
      return
    }
    if (
      !creatorVideo &&
      durationMinutes.trim() !== '' &&
      (!Number.isFinite(minutes) || minutes < 0)
    ) {
      onError('Enter a valid duration in minutes.')
      return
    }

    const input: CreateVideoInput = {
      youtubeUrl: youtubeUrl.trim(),
      title: title.trim(),
      description: description.trim(),
      subject,
      classLevel,
      priceNaira: price,
      published,
      ...(!creatorVideo
        ? {
            durationSeconds:
              Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : 0,
          }
        : {}),
    }

    if (video) {
      updateVideo.mutate(
        { id: video.id, input },
        {
          onSuccess: () => onSaved('Video updated.'),
          onError: (caught) =>
            onError(caught instanceof ApiError ? caught.message : 'Could not update the video.'),
        },
      )
      return
    }

    createVideo.mutate(input, {
      onSuccess: () => onSaved('Video added to the library.'),
      onError: (caught) =>
        onError(caught instanceof ApiError ? caught.message : 'Could not add the video.'),
    })
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 id="video-form-title" className="font-heading text-2xl font-semibold text-[#0a0a0a]">
          {video ? 'Edit video' : 'Add a YouTube video'}
        </h3>
        <p className="mt-1 text-sm text-[#4d554d]">
          {creatorVideo
            ? 'This lesson was uploaded by a creator. Title and description changes also update YouTube.'
            : 'Paste an existing unlisted YouTube link. New creator uploads use the Upload button instead.'}
        </p>
      </div>

      {!creatorVideo && (
        <div>
          <label htmlFor="video-url" className={labelClass}>
            YouTube link
          </label>
          <input
            id="video-url"
            type="text"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className={fieldClass}
            autoComplete="off"
          />
        </div>
      )}

      <div>
        <label htmlFor="video-title" className={labelClass}>
          Title
        </label>
        <input
          id="video-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Calculus I — limits from scratch"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="video-description" className={labelClass}>
          Description <span className="font-normal text-[#7b857b]">(optional)</span>
        </label>
        <textarea
          id="video-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="What will students learn in this lesson?"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="video-subject" className={labelClass}>
            Subject
          </label>
          <select
            id="video-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a subject</option>
            {VIDEO_SUBJECTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="video-class-level" className={labelClass}>
            Class level
          </label>
          <select
            id="video-class-level"
            value={classLevel}
            onChange={(event) => setClassLevel(event.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a class level</option>
            {VIDEO_CLASS_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {!creatorVideo && (
          <div>
            <label htmlFor="video-duration" className={labelClass}>
              Duration (minutes)
            </label>
            <input
              id="video-duration"
              type="number"
              min={0}
              max={720}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              placeholder="60"
              className={fieldClass}
            />
          </div>
        )}
        <div className={creatorVideo ? 'col-span-2' : ''}>
          <label htmlFor="video-price" className={labelClass}>
            Price (₦)
          </label>
          <input
            id="video-price"
            type="number"
            min={0}
            step={100}
            value={priceNaira}
            onChange={(event) => setPriceNaira(event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {!creatorVideo && (
        <label className="flex items-center gap-2 text-sm text-[#4d554d]">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-4 w-4 rounded border-[#cfd6cf] text-[#3a8f4d] focus:ring-[#f5c842]"
          />
          Publish immediately
        </label>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : video ? 'Save changes' : 'Add video'}
        </button>
      </div>
    </form>
  )
}
