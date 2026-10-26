import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../lib/apiClient'
import '../styles/auth.css'

/** Completes the password reset using the token from the reset link. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setMessage('Your password has been updated. Redirecting you to sign in…')
      window.setTimeout(() => navigate('/signin'), 1500)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'This reset link is invalid or has expired.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen taichi-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-20 right-4 sm:top-40 sm:right-32 yin-yang-small floating-2" />
      <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 yin-yang-small floating-4" />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-[#f5c842]/25 rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="bi bi-shield-lock-fill text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">Choose a new password</h1>
            <p className="text-white/75">Pick something you have not used before.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                New password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-lock text-white/55" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200"
                  placeholder="Create a new password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white/90">
                Confirm new password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-lock text-white/55" />
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200"
                  placeholder="Repeat the new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] hover:from-[#7cb342] hover:to-[#3a8f4d] disabled:from-[#2a2a2a] disabled:to-[#3a3a3a] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          {!token && (
            <p className="rounded-lg p-4 text-center bg-[#f5c842]/15 border border-[#f5c842]/40 text-[#ffd166] text-sm">
              This link is missing its reset token. Request a new link from the{' '}
              <Link to="/forgot-password" className="font-semibold underline">
                forgot password
              </Link>{' '}
              page.
            </p>
          )}

          {error && (
            <div className="rounded-lg p-4 text-center bg-[#f5c842]/15 border border-[#f5c842]/40 text-[#ffd166]">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-lg p-4 text-center bg-[#7cb342]/15 border border-[#7cb342]/40 text-[#7cb342]">
              <p className="font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
