import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { useApplyCreator, useCreatorBanks } from '../../hooks/useCreators'
import Modal from '../ui/Modal'

interface CreatorApplicationModalProps {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
  defaultDisplayName?: string
  defaultBio?: string
  sharePercent?: number
}

export default function CreatorApplicationModal({
  open,
  onClose,
  onSubmitted,
  defaultDisplayName,
  defaultBio,
  sharePercent = 70,
}: CreatorApplicationModalProps) {
  const { user } = useAuth()
  const banks = useCreatorBanks(open)
  const apply = useApplyCreator()

  const [displayName, setDisplayName] = useState(defaultDisplayName ?? '')
  const [bio, setBio] = useState(defaultBio ?? '')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDisplayName(defaultDisplayName ?? user?.username ?? '')
    setBio(defaultBio ?? '')
    setBankCode('')
    setAccountNumber('')
    setError(null)
  }, [open, defaultDisplayName, defaultBio, user?.username])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (displayName.trim().length < 2) {
      setError('Enter the name students should see.')
      return
    }
    if (!bankCode) {
      setError('Choose your bank.')
      return
    }
    if (!/^\d{10,20}$/.test(accountNumber.trim())) {
      setError('Enter a valid bank account number.')
      return
    }

    apply.mutate(
      {
        displayName: displayName.trim(),
        bio: bio.trim(),
        bankCode,
        accountNumber: accountNumber.trim(),
      },
      {
        onSuccess: () => onSubmitted(),
        onError: (caught) => {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Could not submit your creator application.',
          )
        },
      },
    )
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      labelledBy="creator-application-title"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h3
            id="creator-application-title"
            className="font-heading text-2xl font-semibold text-[#0a0a0a]"
          >
            Become a Talma creator
          </h3>
          <p className="mt-1 text-sm text-[#4d554d]">
            Upload your lessons to Talma&apos;s YouTube channel. After an admin approves your
            application, you keep {sharePercent}% of every ₦2,000 sale.
          </p>
        </div>

        <div>
          <label htmlFor="creator-display-name" className={labelClass}>
            Creator name
          </label>
          <input
            id="creator-display-name"
            type="text"
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="e.g. Ada Creates"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="creator-bio" className={labelClass}>
            Short bio <span className="font-normal text-[#7b857b]">(optional)</span>
          </label>
          <textarea
            id="creator-bio"
            value={bio}
            maxLength={500}
            onChange={(event) => setBio(event.target.value)}
            rows={2}
            placeholder="What do you teach?"
            className={fieldClass}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="creator-bank" className={labelClass}>
              Bank
            </label>
            <select
              id="creator-bank"
              value={bankCode}
              onChange={(event) => setBankCode(event.target.value)}
              disabled={banks.isLoading || apply.isPending}
              className={fieldClass}
            >
              <option value="">
                {banks.isLoading ? 'Loading banks…' : 'Choose your bank'}
              </option>
              {(banks.data?.banks ?? []).map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="creator-account" className={labelClass}>
              Account number
            </label>
            <input
              id="creator-account"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              maxLength={20}
              onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ''))}
              placeholder="0123456789"
              className={fieldClass}
            />
          </div>
        </div>

        {banks.isError && (
          <p className="text-sm text-[#991b1b]">
            {banks.error instanceof ApiError
              ? banks.error.message
              : 'Could not load the bank list. Check the API’s Paystack configuration.'}
          </p>
        )}

        <div className="rounded-xl border border-[#e6e9e6] bg-[#f7f9f7] px-4 py-3 text-xs text-[#4d554d]">
          <i className="bi bi-shield-lock me-2 text-[#8a6d00]" />
          Paystack verifies this account and pays your share directly to it. Talma never stores
          your bank password or card details.
        </div>

        {error && (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={apply.isPending || banks.isLoading}
            className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {apply.isPending ? 'Submitting…' : 'Apply to create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
