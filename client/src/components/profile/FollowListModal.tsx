import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import { useFollowers, useFollowing } from '../../hooks/useFollows'
import { formatCount } from '../../lib/formatCount'

export type FollowListTab = 'followers' | 'following'

interface FollowListModalProps {
  open: boolean
  username: string
  initialTab: FollowListTab
  onClose: () => void
}

export default function FollowListModal({
  open,
  username,
  initialTab,
  onClose,
}: FollowListModalProps) {
  const [tab, setTab] = useState<FollowListTab>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  const followersQuery = useFollowers(username, open && tab === 'followers')
  const followingQuery = useFollowing(username, open && tab === 'following')
  const activeQuery = tab === 'followers' ? followersQuery : followingQuery
  const users = activeQuery.data?.users ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="follow-list-title"
      className="flex h-[min(78vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-[#e6e9e6] px-5 py-4">
        <div>
          <h2 id="follow-list-title" className="font-heading text-lg font-semibold text-[#0a0a0a]">
            @{username}
          </h2>
          <p className="text-xs text-[#7b857b]">People in this community</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-[#7b857b] transition-colors hover:bg-[#f7f9f7] hover:text-[#0a0a0a]"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="grid grid-cols-2 border-b border-[#e6e9e6]">
        {(['followers', 'following'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-selected={tab === item}
            className={`relative py-3.5 text-sm capitalize transition-colors ${
              tab === item
                ? 'font-bold text-[#0a0a0a]'
                : 'font-medium text-[#7b857b] hover:bg-[#f7f9f7] hover:text-[#4d554d]'
            }`}
          >
            {item}
            {tab === item && (
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#f5c842]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeQuery.isLoading ? (
          <div className="space-y-4 p-5">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#eef1ee]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-[#eef1ee]" />
                  <div className="h-3 w-48 rounded bg-[#eef1ee]" />
                </div>
              </div>
            ))}
          </div>
        ) : activeQuery.isError ? (
          <div className="px-6 py-14 text-center">
            <i className="bi bi-wifi-off text-2xl text-[#8a6d00]" />
            <p className="mt-3 font-medium text-[#0a0a0a]">Could not load this list</p>
            <button
              type="button"
              onClick={() => void activeQuery.refetch()}
              className="mt-4 rounded-full border border-[#e6e9e6] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f7f9f7]"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <i className="bi bi-people text-2xl text-[#8a6d00]" />
            <p className="mt-3 font-medium text-[#0a0a0a]">
              No {tab === 'followers' ? 'followers' : 'following'} yet
            </p>
            <p className="mt-1 text-sm text-[#7b857b]">
              {tab === 'followers'
                ? 'When people follow this account, they will appear here.'
                : 'Accounts this person follows will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e6e9e6]">
            {users.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f7f9f7]"
              >
                <Link
                  to={`/u/${encodeURIComponent(account.username)}`}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar src={account.avatarUrl} name={account.username} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-bold text-[#0a0a0a]">
                        {account.username}
                      </span>
                      {account.creatorStatus === 'approved' && (
                        <i
                          className="bi bi-patch-check-fill text-sm text-[#8a6d00]"
                          aria-label="Verified creator"
                        />
                      )}
                    </div>
                    <p className="truncate text-[13px] text-[#7b857b]">
                      {account.bio || `@${account.username}`}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#7b857b]">
                      {formatCount(account.followerCount)} followers
                    </p>
                  </div>
                </Link>

                <FollowButton
                  username={account.username}
                  isFollowing={account.isFollowing}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
