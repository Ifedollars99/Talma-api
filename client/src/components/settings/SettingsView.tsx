import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'

const REGIONS = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
]

const LANGUAGES = ['English', 'French', 'Yoruba', 'Hausa', 'Igbo']

const TIMEZONES = [
  'Africa/Lagos (WAT)',
  'Africa/Accra (GMT)',
  'Africa/Nairobi (EAT)',
  'Europe/London (GMT)',
  'America/New_York (EST)',
]

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[#15803d]' : 'bg-[#cbd2cb]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsView() {
  const { user, updateProfile, logout, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(user?.username ?? '')
  const [region, setRegion] = useState(user?.region || 'Nigeria')
  const [language, setLanguage] = useState(user?.language || 'English')
  const [timezone, setTimezone] = useState(user?.timezone || 'Africa/Lagos (WAT)')
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true)
  const [privacyPublic, setPrivacyPublic] = useState(user?.privacyPublic ?? false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setUsername(user.username)
    setRegion(user.region || 'Nigeria')
    setLanguage(user.language || 'English')
    setTimezone(user.timezone || 'Africa/Lagos (WAT)')
    setEmailNotifications(user.emailNotifications)
    setPrivacyPublic(user.privacyPublic)
  }, [user])

  const save = async () => {
    if (!username.trim()) {
      setStatus({ tone: 'error', text: 'Username cannot be empty.' })
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      await updateProfile({
        username: username.trim(),
        region,
        language,
        timezone,
        emailNotifications,
        privacyPublic,
      })
      setStatus({ tone: 'ok', text: 'Your settings were saved.' })
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Could not save your settings.',
      })
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    await logout()
    navigate('/signin')
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete your Talma account and all data? This cannot be undone.',
    )
    if (!confirmed) return
    try {
      await deleteAccount()
      navigate('/signup')
    } catch {
      setStatus({ tone: 'error', text: 'Could not delete your account.' })
    }
  }

  const initial = (user?.username ?? 'S').charAt(0).toUpperCase()
  const roleLabel =
    user?.role === 'lecturer' ? 'Lecturer' : user?.role === 'admin' ? 'Admin' : 'Student'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const cardClass = 'rounded-2xl border border-[#e6e9e6] bg-white p-6 shadow-sm'
  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6d00]">
            Your account
          </p>
          <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a] mt-1">Settings</h2>
          <p className="text-[#4d554d] mt-1">
            Manage your profile, language, notifications and privacy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#15803d] to-[#22c55e] px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:from-[#22c55e] hover:to-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {status && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            status.tone === 'ok'
              ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#15803d]'
              : 'border-[#f5c842]/50 bg-[#fdf5d7] text-[#8a6d00]'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0a0a0a] text-xl font-bold text-[#f5c842]">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl text-[#0a0a0a]">Profile</p>
              <p className="text-sm text-[#4d554d]">
                {roleLabel} · member since {memberSince}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settings-username" className={labelClass}>
                Username
              </label>
              <input
                id="settings-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="settings-email" className={labelClass}>
                Email
              </label>
              <input
                id="settings-email"
                value={user?.email ?? ''}
                type="email"
                disabled
                className="w-full rounded-xl border border-[#e6e9e6] bg-[#f7f9f7] px-4 py-2.5 text-[#7b857b]"
              />
            </div>
            <div>
              <label htmlFor="settings-role" className={labelClass}>
                Role
              </label>
              <input
                id="settings-role"
                value={roleLabel}
                type="text"
                disabled
                className="w-full rounded-xl border border-[#e6e9e6] bg-[#f7f9f7] px-4 py-2.5 capitalize text-[#7b857b]"
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className={cardClass}>
          <div className="mb-5">
            <p className="font-heading text-xl text-[#0a0a0a]">Region &amp; language</p>
            <p className="text-sm text-[#4d554d]">Choose how Talma speaks to you.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settings-region" className={labelClass}>
                Country / Region
              </label>
              <select
                id="settings-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className={fieldClass}
              >
                {REGIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="settings-language" className={labelClass}>
                Language
              </label>
              <select
                id="settings-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className={fieldClass}
              >
                {LANGUAGES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="settings-timezone" className={labelClass}>
                Timezone
              </label>
              <select
                id="settings-timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className={fieldClass}
              >
                {TIMEZONES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Notifications & privacy */}
      <section className={cardClass}>
        <div className="mb-4">
          <p className="font-heading text-xl text-[#0a0a0a]">Notifications &amp; privacy</p>
          <p className="text-sm text-[#4d554d]">Control what you receive and who can see you.</p>
        </div>
        <div className="divide-y divide-[#e6e9e6]">
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium text-[#0a0a0a]">Email notifications</p>
              <p className="text-sm text-[#4d554d]">
                Get exam reminders, replies and class updates by email.
              </p>
            </div>
            <Toggle
              checked={emailNotifications}
              onChange={setEmailNotifications}
              label="Email notifications"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium text-[#0a0a0a]">Public profile</p>
              <p className="text-sm text-[#4d554d]">
                Let classmates and communities find your profile.
              </p>
            </div>
            <Toggle checked={privacyPublic} onChange={setPrivacyPublic} label="Public profile" />
          </div>
        </div>
      </section>

      {/* Account */}
      <section className={cardClass}>
        <div className="mb-4">
          <p className="font-heading text-xl text-[#0a0a0a]">Account</p>
          <p className="text-sm text-[#4d554d]">Sign out of this device or close your account.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-[#e6e9e6] px-5 py-2.5 font-medium text-[#0a0a0a] transition-colors hover:bg-[#f7f9f7]"
          >
            <i className="bi bi-box-arrow-right mr-2" />
            Sign out
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-xl border border-[#8a6d00] px-5 py-2.5 font-medium text-[#8a6d00] transition-colors hover:bg-[#fdf5d7]"
          >
            <i className="bi bi-trash3 mr-2" />
            Delete account
          </button>
        </div>
      </section>
    </div>
  )
}
