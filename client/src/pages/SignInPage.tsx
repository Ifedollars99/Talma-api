import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/apiClient'
import '../styles/auth.css'

type MessageType = 'success' | 'error'

/**
 * Sign-in screen — a direct port of the original `SignInPage.vue`, now wired
 * to the Talma API.
 */
export default function SignInPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('error')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) && email.length > 0) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const validatePassword = () => {
    if (password.length > 0 && password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
    } else {
      setPasswordError('')
    }
  }

  const isFormValid =
    email.length > 0 &&
    password.length > 0 &&
    !emailError &&
    !passwordError

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    validateEmail()
    validatePassword()
    if (!email || !password || emailError || passwordError) return

    setLoading(true)
    setMessage('')

    try {
      await login(email, password)
      setMessage('Successfully signed in! Redirecting...')
      setMessageType('success')
      setEmail('')
      setPassword('')
      window.setTimeout(() => navigate('/mycamp'), 1200)
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen taichi-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Yin Yang symbols - right side only */}
      <div className="absolute top-20 right-4 sm:top-40 sm:right-32 yin-yang-small floating-2" />
      <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 yin-yang-small floating-4" />

      {/* Signin Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-[#f5c842]/25 rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-white/75">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    validateEmail()
                  }}
                  onBlur={validateEmail}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 ${
                    emailError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {emailError && <p className="text-[#ffd166] text-sm">{emailError}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-white hover:text-white/75 transition-colors font-medium underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    validatePassword()
                  }}
                  onBlur={validatePassword}
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 ${
                    passwordError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/55 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="text-[#ffd166] text-sm">{passwordError}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 text-white/90 bg-black/30 border border-white/25 rounded focus:ring-[#f5c842] focus:ring-2"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/75">
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] hover:from-[#7cb342] hover:to-[#3a8f4d] disabled:from-[#2a2a2a] disabled:to-[#3a3a3a] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing In...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Success/Error Messages */}
          {message && (
            <div
              role="status"
              className={`rounded-lg p-4 text-center transition-all duration-300 ${
                messageType === 'success'
                  ? 'bg-[#7cb342]/15 border border-[#7cb342]/40 text-[#7cb342]'
                  : 'bg-[#f5c842]/15 border border-[#f5c842]/40 text-[#ffd166]'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {messageType === 'success' ? (
                  <svg className="h-5 w-5 text-[#7cb342]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-[#ffd166]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <p className="font-medium">{message}</p>
              </div>
              {messageType === 'error' && message.toLowerCase().includes('incorrect') && (
                <p className="mt-2 text-sm text-white/75">
                  Check the exact email you signed up with, or{' '}
                  <Link to="/forgot-password" className="font-semibold underline">
                    reset your password
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-[#f5c842] text-sm">
              Don't have an account?
              <Link
                to="/signup"
                className="text-[#f5c842] hover:text-white/75 transition-colors font-medium underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
