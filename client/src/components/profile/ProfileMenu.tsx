import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import Modal from '../ui/Modal'

type SettingsTab = 'account' | 'region' | 'privacy'

const REGIONS = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'United Kingdom',
  'United States',
  'Canada',
]

const LANGUAGES = ['English', 'French', 'Yoruba', 'Hausa', 'Igbo']

const TIMEZONES = [
  'Africa/Lagos (WAT)',
  'Africa/Accra (GMT)',
  'Europe/London (GMT)',
  'America/New_York (EST)',
]

/**
 * Profile avatar button with its dropdown and the settings modal — a direct
 * port of the original `MyprofilePage.vue`.
 */
export default function ProfileMenu() {
  const { user, logout, updateProfile, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const rootRef = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<number | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account')
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [regionMsg, setRegionMsg] = useState('')

  const username = user?.username ?? 'Student'
  const email = user?.email ?? ''
  const userRole = user?.role ?? 'student'
  const initial = username ? username.charAt(0).toUpperCase() : 'S'

  const [editableUsername, setEditableUsername] = useState(username)
  const [region, setRegion] = useState(user?.region ?? 'Nigeria')
  const [language, setLanguage] = useState(user?.language ?? 'English')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Africa/Lagos (WAT)')
  const [privacyPublic, setPrivacyPublic] = useState(user?.privacyPublic ?? true)
  const [privacyEmail, setPrivacyEmail] = useState(user?.emailNotifications ?? true)

  useEffect(() => {
    setEditableUsername(user?.username ?? 'Student')
    setRegion(user?.region ?? 'Nigeria')
    setLanguage(user?.language ?? 'English')
    setTimezone(user?.timezone ?? 'Africa/Lagos (WAT)')
    setPrivacyPublic(user?.privacyPublic ?? true)
    setPrivacyEmail(user?.emailNotifications ?? true)
  }, [user])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setSettingsOpen(false)
        setConfirmDeleteAccount(false)
      }
    }

    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    }
  }, [])

  const onHoverOpen = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    setMenuOpen(true)
  }

  const onHoverLeave = () => {
    // A slight delay so moving to the dropdown doesn't make it flicker.
    hoverTimer.current = window.setTimeout(() => {
      if (!settingsOpen) setMenuOpen(false)
    }, 180)
  }

  const openSettings = (tab: SettingsTab) => {
    setSettingsTab(tab)
    setSettingsOpen(true)
    setMenuOpen(false)
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  const saveAccount = async () => {
    setSaveMsg('')
    setSaving(true)
    try {
      const name = editableUsername.trim()
      if (name.length < 3) {
        setSaveMsg('Username must be at least 3 characters.')
        return
      }
      await updateProfile({
        username: name,
        region,
        language,
        timezone,
        privacyPublic,
        emailNotifications: privacyEmail,
      })
      setSaveMsg('Account updated.')
    } catch (error) {
      setSaveMsg(error instanceof ApiError ? error.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const saveRegion = async () => {
    try {
      await updateProfile({ region, language, timezone })
      setRegionMsg('Region saved.')
    } catch (error) {
      setRegionMsg(error instanceof ApiError ? error.message : 'Could not save.')
    }
  }

  const removeAccount = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      setConfirmDeleteAccount(false)
      setSettingsOpen(false)
      navigate('/')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div ref={rootRef} className="relative" onMouseEnter={onHoverOpen} onMouseLeave={onHoverLeave}>
      {/* Profile avatar button */}
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        title="Profile"
        className="w-10 h-10 bg-[#f5c842] rounded-full flex items-center justify-center hover:ring-2 hover:ring-white/40 transition-all"
      >
        <span className="text-[#0a0a0a] text-base font-semibold">{initial}</span>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-[#e6e9e6] overflow-hidden z-[60]">
          {/* Profile summary */}
          <div className="px-4 pt-4 pb-3 border-b border-[#e6e9e6]">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-[#f5c842] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#0a0a0a] font-semibold">{initial}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#0a0a0a] truncate">{username}</p>
                <p className="text-sm text-[#7b857b] truncate">{email}</p>
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 bg-[#f7f9f7] border border-[#e6e9e6] rounded-full text-[#4d554d] font-medium capitalize">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items : lead to Settings */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => openSettings('account')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9f7] text-left transition-colors"
            >
              <i className="bi bi-gear text-lg text-[#4d554d]" />
              <span className="text-[15px] text-[#0a0a0a] font-medium">Settings</span>
              <i className="bi bi-chevron-right ml-auto text-[#7b857b]" />
            </button>
            <button
              type="button"
              onClick={() => openSettings('account')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9f7] text-left transition-colors"
            >
              <i className="bi bi-person-gear text-lg text-[#4d554d]" />
              <span className="text-[15px] text-[#0a0a0a]">Account settings</span>
            </button>
            <button
              type="button"
              onClick={() => openSettings('region')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9f7] text-left transition-colors"
            >
              <i className="bi bi-globe text-lg text-[#4d554d]" />
              <span className="text-[15px] text-[#0a0a0a]">Region &amp; language</span>
            </button>
            <button
              type="button"
              onClick={() => openSettings('privacy')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9f7] text-left transition-colors"
            >
              <i className="bi bi-shield-lock text-lg text-[#4d554d]" />
              <span className="text-[15px] text-[#0a0a0a]">Privacy</span>
            </button>
          </div>

          {/* Sign out UNDER settings, not inside it */}
          <div className="border-t border-[#e6e9e6] p-2">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#fdf5d7] text-left transition-colors"
            >
              <i className="bi bi-box-arrow-right text-lg text-[#8a6d00]" />
              <span className="text-[15px] text-[#8a6d00] font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e9e6]">
          <h3 className="font-semibold text-lg text-[#0a0a0a]">Settings</h3>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
            className="w-9 h-9 rounded-full hover:bg-[#f7f9f7] flex items-center justify-center text-[#4d554d]"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row min-h-0">
          {/* Settings side tabs */}
          <div className="sm:w-52 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[#e6e9e6] p-2 flex sm:flex-col gap-1 overflow-x-auto">
            {(
              [
                { id: 'account', label: 'Account' },
                { id: 'region', label: 'Region & language' },
                { id: 'privacy', label: 'Privacy' },
              ] as { id: SettingsTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsTab(tab.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${
                  settingsTab === tab.id
                    ? 'bg-[#fdf5d7] text-[#0a0a0a]'
                    : 'text-[#4d554d] hover:bg-[#f7f9f7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings content */}
          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {settingsTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="settings-username" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Username
                  </label>
                  <input
                    id="settings-username"
                    value={editableUsername}
                    onChange={(event) => setEditableUsername(event.target.value)}
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5c842] text-[#0a0a0a]"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    value={email}
                    type="email"
                    disabled
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl bg-[#f7f9f7] text-[#7b857b]"
                  />
                </div>
                <div>
                  <label htmlFor="settings-role" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Role
                  </label>
                  <input
                    id="settings-role"
                    value={userRole}
                    type="text"
                    disabled
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl bg-[#f7f9f7] text-[#7b857b] capitalize"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveAccount()}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#0a0a0a] text-white rounded-xl text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                {saveMsg && <p className="text-sm text-[#15803d]">{saveMsg}</p>}

                <div className="border-t border-[#e6e9e6] pt-4">
                  <h4 className="font-semibold text-[#8a6d00] mb-1">Danger zone</h4>
                  <p className="text-sm text-[#7b857b] mb-3">
                    Permanently delete your account and all data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAccount(true)}
                    className="px-4 py-2.5 border border-[#8a6d00] text-[#8a6d00] rounded-xl text-sm font-medium hover:bg-[#fdf5d7]"
                  >
                    Delete my account
                  </button>
                </div>
              </div>
            )}

            {settingsTab === 'region' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="settings-region" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Country / Region
                  </label>
                  <select
                    id="settings-region"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5c842] text-[#0a0a0a]"
                  >
                    {REGIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-language" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Language
                  </label>
                  <select
                    id="settings-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5c842] text-[#0a0a0a]"
                  >
                    {LANGUAGES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-timezone" className="block text-sm font-medium text-[#4d554d] mb-1.5">
                    Timezone
                  </label>
                  <select
                    id="settings-timezone"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e6e9e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5c842] text-[#0a0a0a]"
                  >
                    {TIMEZONES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => void saveRegion()}
                  className="px-5 py-2.5 bg-[#0a0a0a] text-white rounded-xl text-sm font-medium hover:bg-[#1a1a1a]"
                >
                  Save region
                </button>
                {regionMsg && <p className="text-sm text-[#15803d]">{regionMsg}</p>}
              </div>
            )}

            {settingsTab === 'privacy' && (
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <span className="text-[15px] text-[#0a0a0a]">Show my profile to community</span>
                  <input
                    type="checkbox"
                    checked={privacyPublic}
                    onChange={(event) => setPrivacyPublic(event.target.checked)}
                    className="w-5 h-5 accent-[#f5c842]"
                  />
                </label>
                <label className="flex items-center justify-between py-2 border-t border-[#e6e9e6]">
                  <span className="text-[15px] text-[#0a0a0a]">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={privacyEmail}
                    onChange={(event) => setPrivacyEmail(event.target.checked)}
                    className="w-5 h-5 accent-[#f5c842]"
                  />
                </label>
                <p className="text-sm text-[#7b857b]">More privacy controls coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete account confirm */}
      <Modal
        open={confirmDeleteAccount}
        onClose={() => setConfirmDeleteAccount(false)}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
      >
        <div className="w-14 h-14 bg-[#fdf5d7] rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="bi bi-exclamation-triangle text-[#8a6d00] text-2xl" />
        </div>
        <h3 className="font-semibold text-lg text-[#0a0a0a] mb-1">Delete account?</h3>
        <p className="text-sm text-[#4d554d] mb-5">
          This removes your account. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteAccount(false)}
            className="flex-1 px-4 py-2.5 border border-[#e6e9e6] rounded-xl font-medium text-[#0a0a0a] hover:bg-[#f7f9f7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void removeAccount()}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-[#8a6d00] text-white rounded-xl font-medium hover:bg-[#6b5400] disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Yes, delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
