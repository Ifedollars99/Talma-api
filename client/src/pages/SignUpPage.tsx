import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/apiClient'
import '../styles/auth.css'

type MessageType = 'success' | 'error'
type Category = '' | 'user' | 'creator'

const MAX_NAME_LENGTH = 50
const MAX_TITLE_LENGTH = 20
const NAME_PATTERN = /^[\p{L}\p{M}0-9_][\p{L}\p{M}0-9 .'’_-]*$/u
const TITLE_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’_-]*$/u
const EDUCATOR_TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Doctor', 'Prof', 'Professor']

/**
 * Sign-up screen — a direct port of the original `SignUpPage.vue`, now wired
 * to the Talma API. Accounts are created as either a student or an educator.
 */
export default function SignUpPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [category, setCategory] = useState<Category>('')
  const [educatorTitle, setEducatorTitle] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('error')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [categoryError, setCategoryError] = useState('')
  const [titleError, setTitleError] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [termsError, setTermsError] = useState('')

  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return Math.min(strength, 4)
  }, [password])

  const passwordStrengthText = useMemo(() => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'Weak'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Strong'
      default:
        return 'Weak'
    }
  }, [passwordStrength])

  const validateCategory = () => {
    setCategoryError(category ? '' : 'Please select your category')
  }

  const validateName = () => {
    const value = name.trim()
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters')
    } else if (value.length > MAX_NAME_LENGTH) {
      setNameError(`Name must be at most ${MAX_NAME_LENGTH} characters`)
    } else if (!NAME_PATTERN.test(value)) {
      setNameError(
        'Name can only contain letters, spaces, apostrophes, hyphens and periods',
      )
    } else {
      setNameError('')
    }
  }

  const validateTitle = () => {
    if (category !== 'creator') {
      setTitleError('')
      return
    }
    const value = educatorTitle.trim()
    if (!value) {
      setTitleError('')
    } else if (value.length > MAX_TITLE_LENGTH) {
      setTitleError(`Title must be at most ${MAX_TITLE_LENGTH} characters`)
    } else if (!TITLE_PATTERN.test(value)) {
      setTitleError('Title can only contain letters, spaces, apostrophes, hyphens and periods')
    } else {
      setTitleError('')
    }
  }

  const fullName = () => {
    const value = name.trim().replace(/\s+/g, ' ')
    if (category !== 'creator') return value
    const title = educatorTitle.trim().replace(/\s+/g, ' ')
    return title ? `${title} ${value}` : value
  }

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
    } else {
      setPasswordError('')
    }
  }

  const validateTerms = () => {
    setTermsError(agreeTerms ? '' : 'You must agree to the terms and conditions')
  }

  const isFormValid =
    category.length > 0 &&
    name.trim().length >= 2 &&
    name.trim().length <= MAX_NAME_LENGTH &&
    NAME_PATTERN.test(name.trim()) &&
    (category !== 'creator' ||
      !educatorTitle.trim() ||
      (educatorTitle.trim().length <= MAX_TITLE_LENGTH &&
        TITLE_PATTERN.test(educatorTitle.trim()))) &&
    email.length > 0 &&
    password.length >= 6 &&
    agreeTerms &&
    !categoryError &&
    !titleError &&
    !nameError &&
    !emailError &&
    !passwordError &&
    !termsError

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    validateCategory()
    validateTitle()
    validateName()
    validateEmail()
    validatePassword()
    validateTerms()

    if (
      !category ||
      name.trim().length < 2 ||
      name.trim().length > MAX_NAME_LENGTH ||
      !NAME_PATTERN.test(name.trim()) ||
      (category === 'creator' &&
        educatorTitle.trim() &&
        (educatorTitle.trim().length > MAX_TITLE_LENGTH ||
          !TITLE_PATTERN.test(educatorTitle.trim()))) ||
      !email ||
      password.length < 6 ||
      !agreeTerms ||
      categoryError ||
      titleError ||
      nameError ||
      emailError ||
      passwordError ||
      termsError
    ) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const user = await register({
        username: fullName(),
        email,
        password,
        role: category,
      })

      setCategory('')
      setEducatorTitle('')
      setName('')
      setEmail('')
      setPassword('')
      setAgreeTerms(false)

      if (user.emailVerified) {
        setMessage('Success! Your Talma account is ready.')
        setMessageType('success')
        window.history.replaceState(null, '', '/mycamp')
        window.setTimeout(() => navigate('/mycamp', { replace: true }), 1500)
      } else {
        setMessage('Success! Check your email for a confirmation link.')
        setMessageType('success')
        window.history.replaceState(null, '', '/signin')
        window.setTimeout(() => navigate('/signin', { replace: true }), 2000)
      }
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

  const strengthBarClass = (index: number) => {
    if (passwordStrength < index) return 'bg-[#2a2a2a]'
    if (passwordStrength < 2) return 'bg-[#ffd166]'
    if (passwordStrength < 3) return 'bg-[#f5c842]'
    return 'bg-[#7cb342]'
  }

  return (
    <div className="min-h-screen taichi-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Yin Yang symbols - right side only */}
      <div className="absolute top-20 right-4 sm:top-40 sm:right-32 yin-yang-small floating-2" />
      <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 yin-yang-small floating-4" />

      {/* Signup Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-[#f5c842]/25 rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="bi bi-mortarboard-fill text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-white/75">Join Talma and get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-white/90">
                Category *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-person-badge text-white/55" />
                </div>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(event) => {
                    const nextCategory = event.target.value as Category
                    setCategory(nextCategory)
                    setCategoryError('')
                    if (nextCategory !== 'creator') {
                      setEducatorTitle('')
                      setTitleError('')
                    }
                  }}
                  onBlur={validateCategory}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 appearance-none ${
                    categoryError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                  }`}
                >
                  <option value="" disabled className="bg-[#0a0a0a] text-white/75">
                    Select your category
                  </option>
                  <option value="user" className="bg-[#0a0a0a] text-white">
                    Student
                  </option>
                  <option value="creator" className="bg-[#0a0a0a] text-white">
                    Educator
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i className="bi bi-chevron-down text-white/55" />
                </div>
              </div>
              {categoryError && <p className="text-[#ffd166] text-sm">{categoryError}</p>}
              {category === 'creator' && (
                <p className="text-xs text-white/60">
                  Educator accounts apply for approval from Multimedia before uploading lessons.
                </p>
              )}
            </div>

            {/* Educator title — shown before the name */}
            {category === 'creator' && (
              <div className="space-y-2">
                <label htmlFor="educator-title" className="block text-sm font-medium text-white/90">
                  Title <span className="font-normal text-white/50">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="bi bi-award text-white/55" />
                  </div>
                  <input
                    id="educator-title"
                    type="text"
                    value={educatorTitle}
                    list="educator-title-options"
                    maxLength={MAX_TITLE_LENGTH}
                    onChange={(event) => {
                      setEducatorTitle(event.target.value)
                      setTitleError('')
                    }}
                    onBlur={validateTitle}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 ${
                      titleError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                    }`}
                    placeholder="e.g. Mr, Mrs, Doctor, Professor"
                  />
                  <datalist id="educator-title-options">
                    {EDUCATOR_TITLES.map((title) => (
                      <option key={title} value={title} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-white/60">
                  Choose a suggestion or type your title manually. It appears before your name
                  on Talma.
                </p>
                {titleError && <p className="text-[#ffd166] text-sm">{titleError}</p>}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-person text-white/55" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError('')
                  }}
                  onBlur={validateName}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 ${
                    nameError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {nameError && <p className="text-[#ffd166] text-sm">{nameError}</p>}
              {category === 'creator' && educatorTitle.trim() && name.trim() && (
                <p className="text-xs text-white/60">
                  Your name will appear as{' '}
                  <span className="font-medium text-white/90">{fullName()}</span>.
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address *
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
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailError('')
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
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-lock text-white/55" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setPasswordError('')
                  }}
                  onBlur={validatePassword}
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent transition-all duration-200 ${
                    passwordError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/20'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/55 hover:text-white transition-colors"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {passwordError && <p className="text-[#ffd166] text-sm">{passwordError}</p>}

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${strengthBarClass(index)}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/55">Password strength: {passwordStrengthText}</p>
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                id="agreeTerms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(event) => {
                  setAgreeTerms(event.target.checked)
                  setTermsError('')
                }}
                onBlur={validateTerms}
                className={`mt-1 w-4 h-4 text-white/90 bg-black/30 border rounded focus:ring-[#f5c842] focus:ring-2 ${
                  termsError ? 'border-[#ffd166] ring-1 ring-[#ffd166]' : 'border-white/25'
                }`}
              />
              <label htmlFor="agreeTerms" className="text-sm text-white/75">
                I agree to the
                <a
                  href="/terms.html"
                  className="text-white hover:text-white/75 transition-colors font-medium underline"
                >
                  Terms of Service
                </a>
                and
                <a
                  href="/privacy.html"
                  className="text-white hover:text-white/75 transition-colors font-medium underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {termsError && <p className="text-[#ffd166] text-sm">{termsError}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#3a8f4d] to-[#7cb342] hover:from-[#7cb342] hover:to-[#3a8f4d] disabled:from-[#2a2a2a] disabled:to-[#3a3a3a] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="bi bi-arrow-clockwise animate-spin mr-3" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <i className="bi bi-person-plus mr-2" />
                  Create Account
                </span>
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
                <i
                  className={`bi ${
                    messageType === 'success' ? 'bi-check-circle text-[#7cb342]' : 'bi-exclamation-circle text-[#ffd166]'
                  }`}
                />
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-[#f5c842] text-sm">
              Already have an account?
              <Link
                to="/signin"
                className="text-[#f5c842] hover:text-white/75 transition-colors font-medium underline"
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
