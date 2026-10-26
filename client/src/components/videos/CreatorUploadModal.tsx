import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/apiClient'
import { uploadFileToYouTube, YouTubeUploadError } from '../../lib/youtubeUpload'
import { VIDEO_CLASS_LEVELS, VIDEO_SUBJECTS } from '../../lib/videoOptions'
import {
  useCompleteVideoUpload,
  useStartVideoUpload,
} from '../../hooks/useVideos'
import Modal from '../ui/Modal'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 * 1024

interface CreatorUploadModalProps {
  open: boolean
  onClose: () => void
  onUploaded: () => void
  sharePercent?: number
}

type Phase = 'idle' | 'starting' | 'uploading' | 'finalizing' | 'done'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function CreatorUploadModal({
  open,
  onClose,
  onUploaded,
  sharePercent = 70,
}: CreatorUploadModalProps) {
  const startUpload = useStartVideoUpload()
  const completeUpload = useCompleteVideoUpload()
  const abortRef = useRef<AbortController | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const busy = phase === 'starting' || phase === 'uploading' || phase === 'finalizing'

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      abortRef.current = null
      return
    }

    // Each time the modal is opened, start from a clean form. This also clears
    // the previous "done" state after the parent closes it on success.
    setFile(null)
    setTitle('')
    setDescription('')
    setSubject('')
    setClassLevel('')
    setConfirmed(false)
    setPhase('idle')
    setProgress(0)
    setError(null)
  }, [open])

  const chooseFile = (selected: File | null) => {
    setError(null)
    setFile(selected)
    if (!selected) return
    if (!selected.type.toLowerCase().startsWith('video/')) {
      setFile(null)
      setError('Only video files can be uploaded to the Multimedia section.')
      return
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setFile(null)
      setError('The file is too large. The limit is 4 GB.')
      return
    }
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^.]+$/, '').slice(0, 100))
    }
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setSubject('')
    setClassLevel('')
    setConfirmed(false)
    setPhase('idle')
    setProgress(0)
    setError(null)
  }

  const close = () => {
    if (busy) {
      abortRef.current?.abort()
    }
    reset()
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError('Choose a video file to upload.')
      return
    }
    if (title.trim().length < 2) {
      setError('Give the video a title (at least 2 characters).')
      return
    }
    if (!subject) {
      setError('Choose the subject this video teaches.')
      return
    }
    if (!classLevel) {
      setError('Choose the class level this video is for.')
      return
    }
    if (!confirmed) {
      setError('Confirm that you own the rights to this video and it is not made for kids.')
      return
    }

    // The controller covers both the session request and the browser upload,
    // so closing the modal cannot start a background upload afterwards.
    const controller = new AbortController()
    abortRef.current = controller
    setPhase('starting')
    setProgress(0)

    try {
      const started = await startUpload.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        subject,
        classLevel,
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        fileSizeBytes: file.size,
        madeForKids: false,
      })

      if (controller.signal.aborted) return

      setPhase('uploading')

      const result = await uploadFileToYouTube(started.uploadUrl, file, {
        mimeType: file.type || 'video/mp4',
        signal: controller.signal,
        onProgress: (_uploaded, _total, percent) => setProgress(percent),
      })

      setPhase('finalizing')
      await completeUpload.mutateAsync({
        id: started.video.id,
        youtubeVideoId: result.id,
      })

      setPhase('done')
      onUploaded()
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setError('Upload cancelled. The draft entry is still in “My videos” — you can remove it.')
      } else if (caught instanceof ApiError) {
        setError(caught.message)
      } else if (caught instanceof YouTubeUploadError) {
        setError(caught.message)
      } else if (caught instanceof Error) {
        setError(caught.message)
      } else {
        setError('The upload failed. Please try again.')
      }
      setPhase('idle')
    } finally {
      abortRef.current = null
    }
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  return (
    <Modal
      open={open}
      onClose={close}
      closeOnBackdrop={!busy}
      className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      labelledBy="creator-upload-title"
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <h3
            id="creator-upload-title"
            className="font-heading text-2xl font-semibold text-[#0a0a0a]"
          >
            Upload a video
          </h3>
          <p className="mt-1 text-sm text-[#4d554d]">
            The file goes straight to YouTube as <strong>private</strong>. Talma publishes it
            after an admin reviews it.
          </p>
        </div>

        {phase === 'done' ? (
          <div className="rounded-xl border border-[#d6e8bd] bg-[#f5f9e8] px-4 py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#3a8f4d] text-white">
              <i className="bi bi-check-lg text-xl" />
            </div>
            <p className="font-semibold text-[#2f6b3d]">Upload complete — sent for review.</p>
            <p className="mt-1 text-sm text-[#2c7a40]">
              You will see it in “My videos” while an administrator reviews it.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-5 rounded-xl bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="creator-file" className={labelClass}>
                Video file
              </label>
              <input
                id="creator-file"
                type="file"
                accept="video/*"
                disabled={busy}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-[#cfd6cf] bg-[#f7f9f7] px-4 py-4 text-sm text-[#4d554d] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f5c842] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-1.5 text-xs text-[#7b857b]">
                MP4, WebM or MOV · up to 4 GB · up to one hour. The file is not stored on
                Talma&apos;s servers.
              </p>
              {file && (
                <p className="mt-1 text-xs font-medium text-[#4d554d]">
                  {file.name} · {formatBytes(file.size)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="creator-title" className={labelClass}>
                Title
              </label>
              <input
                id="creator-title"
                type="text"
                value={title}
                disabled={busy}
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Integration by parts — full lesson"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="creator-description" className={labelClass}>
                Description <span className="font-normal text-[#7b857b]">(optional)</span>
              </label>
              <textarea
                id="creator-description"
                value={description}
                disabled={busy}
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What will students learn?"
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="creator-subject" className={labelClass}>
                  Subject
                </label>
                <select
                  id="creator-subject"
                  value={subject}
                  disabled={busy}
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
                <label htmlFor="creator-class-level" className={labelClass}>
                  Class level
                </label>
                <select
                  id="creator-class-level"
                  value={classLevel}
                  disabled={busy}
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

            <div className="rounded-xl border border-[#f5c842]/40 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
              <i className="bi bi-cash-coin me-2" />
              {sharePercent > 0 ? (
                <>
                  Talma sells this lesson for ₦2,000. You keep{' '}
                  <strong>{sharePercent}%</strong> of every sale.
                </>
              ) : (
                <>This is a platform-owned upload, so no creator payout is attached.</>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm text-[#4d554d]">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={busy}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#cfd6cf] text-[#3a8f4d] focus:ring-[#f5c842]"
              />
              <span>
                I own the rights to this video, it is not made for kids, and I agree to Talma
                publishing it as an unlisted YouTube video after review.
              </span>
            </label>

            {busy && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#4d554d]">
                  <span>
                    {phase === 'starting'
                      ? 'Preparing the upload…'
                      : phase === 'finalizing'
                        ? 'Finalizing on YouTube…'
                        : 'Uploading to YouTube…'}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef1ee]">
                  <div
                    className="h-full rounded-full bg-[#f5c842] transition-[width] duration-300"
                    style={{ width: `${Math.max(2, progress)}%` }}
                  />
                </div>
                <p className="text-xs text-[#7b857b]">
                  Keep this tab open. The upload resumes automatically if the connection drops.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
              >
                {busy ? 'Cancel upload' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={busy || !file}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Uploading…' : 'Upload video'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
