import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AvatarUploader from './AvatarUploader'
import Modal from '../ui/Modal'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { COUNTRIES, GENDER_OPTIONS, NIGERIAN_STATES } from '../../lib/profileOptions'
import { profileKeys } from '../../hooks/useProfile'
import { postKeys } from '../../hooks/usePosts'
import type { Gender } from '../../types'

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
}

const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
const fieldClass =
  'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

/** Twitter-style inline profile editor used from the profile screen. */
export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [region, setRegion] = useState('Nigeria')
  const [state, setState] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setUsername(user.username)
    setBio(user.bio ?? '')
    setGender(user.gender ?? '')
    setRegion(user.region || 'Nigeria')
    setState(user.state ?? '')
    setAvatarUrl(user.avatarUrl ?? '')
    setStatus(null)
  }, [open, user])

  const save = async () => {
    const nextUsername = username.trim()
    if (nextUsername.length < 3) {
      setStatus({ tone: 'error', text: 'Username must be at least 3 characters.' })
      return
    }

    setSaving(true)
    setStatus(null)
    try {
      await updateProfile({
        username: nextUsername,
        bio: bio.trim(),
        region,
        state: state.trim(),
        avatarUrl,
        ...(gender ? { gender } : {}),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: postKeys.all }),
      ])
      onClose()
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Could not save your profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-[#e6e9e6] px-5 py-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[#0a0a0a]">Edit profile</h2>
          <p className="text-xs text-[#7b857b]">Your public profile updates instantly.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close edit profile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#4d554d] hover:bg-[#f7f9f7]"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto p-5">
        <AvatarUploader avatarUrl={avatarUrl} name={username || 'Student'} onChange={setAvatarUrl} />

        <div>
          <label htmlFor="edit-profile-username" className={labelClass}>
            Username
          </label>
          <input
            id="edit-profile-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="edit-profile-bio" className={labelClass}>
            Bio
          </label>
          <textarea
            id="edit-profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 500))}
            rows={3}
            placeholder="Tell people what you study, teach or create."
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[#7b857b]">{bio.length}/500 characters</p>
        </div>

        <div>
          <label htmlFor="edit-profile-gender" className={labelClass}>
            Gender
          </label>
          <select
            id="edit-profile-gender"
            value={gender}
            onChange={(event) => setGender(event.target.value as Gender | '')}
            className={fieldClass}
          >
            <option value="" disabled>
              Select gender
            </option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-profile-country" className={labelClass}>
              Country
            </label>
            <select
              id="edit-profile-country"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={fieldClass}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-profile-state" className={labelClass}>
              State / region <span className="font-normal text-[#7b857b]">(optional)</span>
            </label>
            <input
              id="edit-profile-state"
              value={state}
              onChange={(event) => setState(event.target.value.slice(0, 80))}
              type="text"
              list={region === 'Nigeria' ? 'edit-profile-nigerian-states' : undefined}
              placeholder={region === 'Nigeria' ? 'e.g. Lagos' : 'State or region'}
              className={fieldClass}
            />
            {region === 'Nigeria' && (
              <datalist id="edit-profile-nigerian-states">
                {NIGERIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName} />
                ))}
              </datalist>
            )}
          </div>
        </div>

        {status && (
          <p
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              status.tone === 'ok'
                ? 'border-[#7cb342]/40 bg-[#7cb342]/10 text-[#3a8f4d]'
                : 'border-[#f5c842]/50 bg-[#fdf5d7] text-[#8a6d00]'
            }`}
          >
            {status.text}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#e6e9e6] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#4d554d] transition-colors hover:bg-[#f7f9f7] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-[#0a0a0a] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
