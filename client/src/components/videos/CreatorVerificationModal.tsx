import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import {
  useCompleteCreatorWhatsApp,
  useConfirmCreatorVerification,
  useRequestCreatorVerification,
} from '../../hooks/useCreators'
import {
  isWhatsAppGroupUrl,
  normalizeWhatsAppUrl,
  WHATSAPP_LINK_ERROR,
} from '../../lib/whatsapp'
import Modal from '../ui/Modal'

interface CreatorVerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified?: () => void
}

type Step = 'intro' | 'code' | 'whatsapp' | 'success'

/**
 * Educator verification in two clear stages:
 *
 * 1. Confirm the six-digit code emailed to the account.
 * 2. Add a WhatsApp group/community link, which completes verification.
 *
 * The account is not marked as a fully verified educator until both stages are
 * done, so uploads stay locked in between.
 */
export default function CreatorVerificationModal({
  open,
  onClose,
  onVerified,
}: CreatorVerificationModalProps) {
  const { user, refreshUser } = useAuth()
  const requestCode = useRequestCreatorVerification()
  const confirmCode = useConfirmCreatorVerification()
  const completeWhatsApp = useCompleteCreatorWhatsApp()

  const [step, setStep] = useState<Step>('intro')
  const [code, setCode] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState(user?.whatsappUrl ?? '')
  const [devCode, setDevCode] = useState<string | undefined>()
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [delivered, setDelivered] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | undefined>()

  useEffect(() => {
    if (!open) return
    setStep(
      user?.creatorStatus === 'approved'
        ? 'success'
        : user?.creatorEmailVerified
          ? 'whatsapp'
          : 'intro',
    )
    setCode('')
    setWhatsappUrl(user?.whatsappUrl ?? '')
    setDevCode(undefined)
    setPreviewUrl(undefined)
    setDelivered(true)
    setError(null)
    setSendError(undefined)
    // Reset only when the modal opens. A background user refresh must not wipe
    // the step the user is currently working on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const sendCode = () => {
    setError(null)
    requestCode.mutate(undefined, {
      onSuccess: (result) => {
        setStep('code')
        setCode('')
        setDelivered(result.delivered)
        setDevCode(result.devCode)
        setPreviewUrl(result.previewUrl)
        setSendError(result.error)
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
    confirmCode.mutate(
      { code: code.trim() },
      {
        onSuccess: async (result) => {
          await refreshUser()
          if (result.needsWhatsappUrl || result.user.creatorStatus !== 'approved') {
            setStep('whatsapp')
            return
          }
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
      },
    )
  }

  const finish = () => {
    setError(null)
    if (!isWhatsAppGroupUrl(whatsappUrl)) {
      setError(WHATSAPP_LINK_ERROR)
      return
    }
    completeWhatsApp.mutate(
      { whatsappUrl: normalizeWhatsAppUrl(whatsappUrl) },
      {
        onSuccess: async () => {
          await refreshUser()
          setStep('success')
          onVerified?.()
        },
        onError: (caught) => {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'We could not save your WhatsApp link. Please try again.',
          )
        },
      },
    )
  }

  const pending = requestCode.isPending || confirmCode.isPending || completeWhatsApp.isPending

  const close = () => {
    if (pending) return
    onClose()
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  const isIntro = step === 'intro'
  const isCode = step === 'code'
  const isWhatsapp = step === 'whatsapp'

  return (
    <Modal
      open={open}
      onClose={close}
      closeOnBackdrop={!pending}
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
            Welcome to being an educator!
          </h3>
          <p className="mt-2 text-sm text-[#4d554d]">
            You&apos;re fully verified. Your WhatsApp community is now live on Home, and you can
            upload videos and media straight away.
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-6 w-full rounded-xl bg-[#0a0a0a] px-5 py-2.5 font-semibold text-white"
          >
            Start teaching
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5d7] text-[#8a6d00]">
              <i
                className={`bi ${
                  isIntro ? 'bi-envelope-check' : isCode ? 'bi-shield-lock' : 'bi-whatsapp'
                } text-2xl`}
              />
            </div>
            <h3
              id="creator-verification-title"
              className="font-heading text-2xl font-semibold text-[#0a0a0a]"
            >
              {isIntro
                ? 'Verify your email'
                : isCode
                  ? 'Enter your code'
                  : 'Add your WhatsApp group'}
            </h3>
            <p className="mt-2 text-sm text-[#4d554d]">
              {isIntro
                ? `We'll send a six-digit code to ${user?.email ?? 'your email'}. Confirm it first, then add your WhatsApp group link to complete verification.`
                : isCode
                  ? `Enter the six-digit code we sent to ${user?.email ?? 'your email'}.`
                  : 'Your email is confirmed. Add a WhatsApp group or community link so students can join — this completes your verification.'}
            </p>
          </div>

          {isCode && (
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
                <p className="mt-1 text-xs text-[#7b857b]">
                  Can&apos;t find it? Check your Spam folder and mark the email as “Not spam” so
                  future codes land in your inbox.
                </p>
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
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    sendError
                      ? 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
                      : 'border-[#f5c842]/50 bg-[#fdf5d7] text-[#6b5400]'
                  }`}
                >
                  <i className={`bi ${sendError ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2`} />
                  {sendError ? (
                    <>
                      The email was not delivered: {sendError} For local testing, use this code:{' '}
                      <strong className="tracking-widest">{devCode}</strong>.
                    </>
                  ) : (
                    <>
                      The verification email did not reach a real inbox, so this code is shown for
                      local testing:{' '}
                      <strong className="tracking-widest">{devCode}</strong>.
                    </>
                  )}
                </div>
              )}

              {!delivered && !devCode && !previewUrl && (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                  {sendError
                    ? `The email could not be sent: ${sendError}`
                    : "The email could not be sent. Check the server's mail configuration, then request a new code."}
                </div>
              )}
            </>
          )}

          {isWhatsapp && (
            <div>
              <label htmlFor="creator-whatsapp" className={labelClass}>
                WhatsApp group or community link
              </label>
              <input
                id="creator-whatsapp"
                value={whatsappUrl}
                onChange={(event) => setWhatsappUrl(event.target.value)}
                type="url"
                autoComplete="url"
                placeholder="https://chat.whatsapp.com/…"
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-[#7b857b]">
                Students will see this link on your Home card so they can join your community.
              </p>
            </div>
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
              disabled={pending}
              className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d] disabled:opacity-60"
            >
              Cancel
            </button>
            {isIntro && (
              <button
                type="button"
                onClick={sendCode}
                disabled={requestCode.isPending}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestCode.isPending ? 'Sending…' : 'Send code'}
              </button>
            )}
            {isCode && (
              <button
                type="button"
                onClick={verify}
                disabled={confirmCode.isPending || code.length !== 6}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirmCode.isPending ? 'Verifying…' : 'Verify email'}
              </button>
            )}
            {isWhatsapp && (
              <button
                type="button"
                onClick={finish}
                disabled={completeWhatsApp.isPending}
                className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completeWhatsApp.isPending ? 'Finishing…' : 'Finish verification'}
              </button>
            )}
          </div>

          {isCode && (
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
