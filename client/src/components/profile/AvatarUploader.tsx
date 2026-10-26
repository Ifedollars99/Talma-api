import { useRef, useState } from 'react'
import { useUploadAvatar } from '../../hooks/useUploads'
import { ApiError } from '../../lib/apiClient'
import Avatar from './Avatar'

interface AvatarUploaderProps {
  avatarUrl?: string
  name: string
  onChange: (url: string) => void
  disabled?: boolean
}

/** Upload control for the profile photo, used by the profile and settings screens. */
export default function AvatarUploader({
  avatarUrl,
  name,
  onChange,
  disabled = false,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Choose a JPEG, PNG, GIF or WebP image.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Profile photos must be smaller than 8MB.')
      return
    }

    setError('')
    try {
      const result = await upload.mutateAsync(file)
      onChange(result.url)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That photo could not be uploaded.')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar
          src={avatarUrl}
          name={name}
          size="xl"
          className="border-4 border-white shadow-sm"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || upload.isPending}
              className="rounded-xl border border-[#e6e9e6] px-4 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f7f9f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="bi bi-camera mr-2" />
              {upload.isPending ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add photo'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled || upload.isPending}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[#7b857b] transition-colors hover:bg-[#fdf5d7] hover:text-[#8a6d00] disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-[#7b857b]">
            JPEG, PNG, GIF or WebP. Up to 8MB. Shown across your Talma profile.
          </p>
          {error && <p className="mt-1 text-xs font-medium text-[#8a6d00]">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
