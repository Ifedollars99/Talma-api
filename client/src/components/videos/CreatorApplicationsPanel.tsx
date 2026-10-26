import { useState } from 'react'
import { ApiError } from '../../lib/apiClient'
import {
  useApproveCreator,
  useCreatorApplications,
  useRejectCreator,
} from '../../hooks/useCreators'
import Modal from '../ui/Modal'
import type { CreatorProfile } from '../../types'

interface CreatorApplicationsPanelProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function CreatorApplicationsPanel({
  onSuccess,
  onError,
}: CreatorApplicationsPanelProps) {
  const applications = useCreatorApplications('pending')
  const approve = useApproveCreator()
  const reject = useRejectCreator()

  const [rejecting, setRejecting] = useState<CreatorProfile | null>(null)
  const [reason, setReason] = useState('')

  const creators = applications.data?.creators ?? []

  const handleApprove = (creator: CreatorProfile) => {
    approve.mutate(creator.id, {
      onSuccess: () =>
        onSuccess(
          `${creator.displayName} is now an approved creator with a Paystack payout account.`,
        ),
      onError: (caught) =>
        onError(
          caught instanceof ApiError
            ? caught.message
            : 'Could not approve this creator. Check the Paystack configuration.',
        ),
    })
  }

  const handleReject = () => {
    if (!rejecting) return
    if (reason.trim().length < 2) {
      onError('Give the applicant a reason for the rejection.')
      return
    }

    reject.mutate(
      { id: rejecting.id, reason: reason.trim() },
      {
        onSuccess: () => {
          onSuccess(`${rejecting.displayName}'s application was rejected.`)
          setRejecting(null)
          setReason('')
        },
        onError: (caught) =>
          onError(
            caught instanceof ApiError
              ? caught.message
              : 'Could not reject this creator application.',
          ),
      },
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-semibold text-[#0a0a0a]">
            Creator applications
          </h3>
          <p className="text-sm text-[#4d554d]">
            Approving creates a Paystack subaccount that pays the creator their share.
          </p>
        </div>
        {creators.length > 0 && (
          <span className="rounded-full bg-[#f5c842] px-2.5 py-1 text-xs font-semibold text-[#0a0a0a]">
            {creators.length} waiting
          </span>
        )}
      </div>

      {applications.isLoading && (
        <div className="h-24 animate-pulse rounded-2xl border border-[#e6e9e6] bg-white" />
      )}

      {applications.isError && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          {applications.error instanceof ApiError
            ? applications.error.message
            : 'Could not load creator applications.'}
        </div>
      )}

      {!applications.isLoading && !applications.isError && creators.length === 0 && (
        <div className="rounded-xl border border-[#e6e9e6] bg-white px-4 py-4 text-sm text-[#7b857b]">
          <i className="bi bi-check2-circle me-2 text-[#3a8f4d]" />
          No creator applications waiting for review.
        </div>
      )}

      {creators.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {creators.map((creator) => {
            const approving = approve.isPending && approve.variables === creator.id
            return (
              <article
                key={creator.id}
                className="rounded-2xl border border-[#e6e9e6] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-[#0a0a0a]">{creator.displayName}</h4>
                    <p className="text-xs text-[#7b857b]">
                      @{creator.username} · {creator.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fdf5d7] px-2 py-0.5 text-[11px] font-semibold text-[#8a6d00]">
                    {creator.sharePercent}% share
                  </span>
                </div>

                {creator.bio && (
                  <p className="mt-2 line-clamp-2 text-sm text-[#4d554d]">{creator.bio}</p>
                )}

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f9f7] px-3 py-2 text-xs">
                  <div>
                    <dt className="text-[#7b857b]">Bank</dt>
                    <dd className="font-medium text-[#0a0a0a]">{creator.bankName}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7b857b]">Account</dt>
                    <dd className="font-medium text-[#0a0a0a]">
                      {creator.accountName} · {creator.accountNumber}
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 text-[11px] text-[#7b857b]">
                  Applied {new Date(creator.appliedAt).toLocaleString()}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejecting(creator)
                      setReason('')
                    }}
                    className="flex-1 rounded-xl border border-[#e6e9e6] px-3 py-2 text-sm font-semibold text-[#8a6d00] hover:bg-[#fdf5d7]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(creator)}
                    disabled={approving}
                    className="flex-1 rounded-xl bg-[#3a8f4d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2c7a40] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approving ? 'Approving…' : 'Approve creator'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        closeOnBackdrop={false}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        labelledBy="reject-creator-title"
      >
        <h3
          id="reject-creator-title"
          className="font-heading text-xl font-semibold text-[#0a0a0a]"
        >
          Reject {rejecting?.displayName}?
        </h3>
        <p className="mt-1 text-sm text-[#4d554d]">
          They will see your reason and can apply again with updated details.
        </p>
        <label htmlFor="creator-reject-reason" className="mt-4 block text-sm font-medium text-[#4d554d]">
          Reason
        </label>
        <textarea
          id="creator-reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="e.g. The bank account could not be verified."
          className="mt-1 w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
        />
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setRejecting(null)}
            className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={reject.isPending}
            className="flex-1 rounded-xl bg-[#8a6d00] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {reject.isPending ? 'Rejecting…' : 'Reject application'}
          </button>
        </div>
      </Modal>
    </section>
  )
}
