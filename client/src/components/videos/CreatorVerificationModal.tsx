import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import {
  useConfirmCreatorVerification,
  useRequestCreatorVerification,
} from '../../hooks/useCreators'
import Modal from '../ui/Modal'

interface CreatorVerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified?: () => void
}

type Step = 'intro' | 'code' | 'success'

/**
 * Two-step creator verification: ask for a six-digit code by email, then
 * confirm it. A successful confirmation upgrades the account to a verified
 * creator so they can upload videos and media.
 */
export default function CreatorVerificationModal({
  open,
  onClose,
  onVerified,
}: CreatorVerificationModalProps) {
  const { user, refreshUser } = useAuth()
  const requestCode = useRequestCreatorVerification()
  const confirmCode = useConfirmCreatorVerification()

  const [step, setStep] = useState<Step>('intro')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>()
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [delivered, setDelivered] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('intro')
    setCode('')
    setDevCode(undefined)
    setPreviewUrl(undefined)
    setDelivered(true)
    setError(null)
  }, [open])

  const sendCode = () => {
    setError(null)
    requestCode.mutate(undefined, {
      onSuccess: (result) => {
        setStep('code')
        setDelivered(result.delivered)
        setDevCode(result.devCode)
        setPreviewUrl(result.previewUrl)
      },
      onError: (caught) => {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'We could not send the verification code. Please try again.',
        )
      },
    })
  }

  const verify = () => {
    setError(null)
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the six-digit code from your email.')
      return
    }
    confirmCode.mutate(code.trim(), {
      onSuccess: async () => {
        await refreshUser()
        setStep('success')
        onVerified?.()
      },
      onError: (caught) => {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'That code could not be verified. Please try again.',
        )
      },
    })
  }

  const close = () => {
    if (confirmCode.isPending || requestCode.isPending) return
    onClose()
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  return (
    <Modal
      open={open}
      onClose={close}
      closeOnBackdrop={!confirmCode.isPending && !requestCode.isPending}
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      labelledBy="creator-verification-title"
    >
      {step === 'success' ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5c842] text-[#0a0a0a]">
            <i className="bi bi-patch-check-fill text-3xl" />
          </div>
          <h3
            id="creator-verification-title"
            className="font-heading text-2xl font-semibold text-[#0a0a0a]"
          >
            Welcome to being a creator!
          </h3>
          <p className="mt-2 text-sm text-[#4d554d]">
            Your account is verified. Your profile now shows the creator badge, and you can
            upload videos and media straight away.
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-6 w-full rounded-xl bg-[#0a0a0a] px-5 py-2.5 font-semibold text-white"
          >
            Start creating
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5d7] text-[#8a6d00]">
              <i className="bi bi-envelope-check text-2xl" />
            </div>
            <h3
              id="creator-verification-title"
              className="font-heading text-2xl font-semibold text-[#0a0a0a]"
            >
              {step === 'intro' ? 'Verify to become a creator' : 'Enter your code'}
            </h3>
            <p className="mt-2 text-sm text-[#4d554d]">
              {step === 'intro'
                ? 'Uploading media is for verified creators. We will email a six-digit code to confirm your account.'
                : `Enter the six-digit code we sent to ${user?.email ?? 'your email'}.`}
            </p>
          </div>

          {step === 'code' && (
            <>
              <div>
                <label htmlFor="creator-code" className={labelClass}>
                  Verification code
                </label>
                <input
                  id="creator-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className={`${fieldClass} text-center text-2xl font-semibold tracking-[0.5em]`}
                />
              </div>

              {previewUrl && (
                <div className="rounded-xl border border-[#f5c842]/50 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
                  <i className="bi bi-envelope-paper me-2" />
                  This server is using a development email preview, so the message did not reach
                  your real inbox.{' '}
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Open the email preview
                  </a>{' '}
                  to see your code.
                </div>
              )}

              {devCode && (
                <div className="rounded-xl border border-[#f5c842]/50 bg-[#fdf5d7] px-4 py-3 text-sm text-[#6b5400]">
                  <i className="bi bi-info-circle me-2" />
                  No email provider is configured, so this code is shown for local testing:{' '}
                  <strong className="tracking-widest">{devCode}</strong>.
                </div>
              )}

              {!delivered && !devCode && !previewUrl && (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                  The email could not be sent. Check the server&apos;s mail configuration, then
                  request a new code.
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
            >
              Cancel
            </button>
            {step === 'intro' ? (
              <button
                type="button"
                onClick={sendCode}
                disabled={requestCode.isPending}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestCode.isPending ? 'Sending…' : 'Send code'}
              </button>
            ) : (
              <button
                type="button"
                onClick={verify}
                disabled={confirmCode.isPending || code.length !== 6}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirmCode.isPending ? 'Verifying…' : 'Verify'}
              </button>
            )}
          </div>

          {step === 'code' && (
            <button
              type="button"
              onClick={sendCode}
              disabled={requestCode.isPending}
              className="w-full text-center text-sm font-medium text-[#8a6d00] underline disabled:opacity-60"
            >
              {requestCode.isPending ? 'Sending a new code…' : 'Resend code'}
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
