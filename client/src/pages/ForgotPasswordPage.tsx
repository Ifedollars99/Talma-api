import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/apiClient'
import '../styles/auth.css'

/**
 * Password reset request screen. The API returns a reset token in development
 * (no mail transport is configured), which is surfaced here so the flow can be
 * completed locally.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = await api.post<{ message: string; resetToken?: string }>(
        '/auth/forgot-password',
        { email },
      )
      setMessage(data.message)
      setResetToken(data.resetToken ?? null)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'An unexpected error occurred. Please try again.',
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
              <i className="bi bi-key-fill text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">Reset your password</h1>
            <p className="text-white/75">
              Enter the exact email address you signed up with and we will send a reset link.
            </p>
            <p className="text-xs text-white/55">
              The email contains a link, not a six-digit code. The link expires in 60 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-envelope text-white/55" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] hover:from-[#7cb342] hover:to-[#3a8f4d] disabled:from-[#2a2a2a] disabled:to-[#3a3a3a] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          {message && (
            <div className="rounded-lg p-4 text-center bg-[#7cb342]/15 border border-[#7cb342]/40 text-[#7cb342]">
              <p className="font-medium">{message}</p>
              <p className="mt-2 text-sm text-[#7cb342]/90">
                Check <strong>{email.trim()}</strong> and its spam folder. If it does not arrive,
                confirm that this is the exact email on your Talma account.
              </p>
              {resetToken && (
                <div className="mt-4 rounded-xl border border-[#7cb342]/40 bg-[#7cb342]/10 p-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#7cb342]">
                    Development shortcut
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    This server is still in development, so the email may not reach your real
                    inbox. Use this link to reset your password now.
                  </p>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#7cb342] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a8f4d]"
                  >
                    Continue to reset your password
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg p-4 text-center bg-[#f5c842]/15 border border-[#f5c842]/40 text-[#ffd166]">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-white/75 text-sm">
              Remembered it?{' '}
              <Link
                to="/signin"
                className="text-[#f5c842] hover:text-white transition-colors font-medium underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
