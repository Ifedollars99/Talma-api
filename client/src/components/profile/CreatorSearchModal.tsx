import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import { useCreatorSearch } from '../../hooks/useFollows'
import { formatCount } from '../../lib/formatCount'

interface CreatorSearchModalProps {
  open: boolean
  onClose: () => void
}

/** TikTok-style creator search — a focused sheet with people, bios and follow pills. */
export default function CreatorSearchModal({ open, onClose }: CreatorSearchModalProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const search = useCreatorSearch(debouncedQuery, open)
  const users = search.data?.users ?? []
  const hasTerm = Boolean(query.trim())

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="creator-search-title"
      className="flex h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-[#e6e9e6] px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="rounded-full p-2 text-[#4d554d] transition-colors hover:bg-[#f7f9f7] hover:text-[#0a0a0a]"
        >
          <i className="bi bi-arrow-left text-lg" />
        </button>

        <div className="relative min-w-0 flex-1">
          <i className="bi bi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7b857b]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators, educators, students..."
            aria-label="Search creators"
            className="w-full rounded-full border border-transparent bg-[#f7f9f7] py-2.5 pl-10 pr-10 text-[15px] text-[#0a0a0a] outline-none transition focus:border-[#f5c842]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#7b857b] hover:bg-[#eef1ee] hover:text-[#0a0a0a]"
            >
              <i className="bi bi-x-circle-fill text-sm" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-[#e6e9e6] px-5 py-3">
        <div>
          <h2
            id="creator-search-title"
            className="font-heading text-[17px] font-semibold text-[#0a0a0a]"
          >
            {hasTerm ? 'Search results' : 'Suggested creators'}
          </h2>
          <p className="mt-0.5 text-xs text-[#7b857b]">
            {hasTerm
              ? `People matching “${query.trim()}”`
              : 'Verified educators making Talma worth following'}
          </p>
        </div>
        {hasTerm && !search.isLoading && (
          <span className="rounded-full bg-[#f7f9f7] px-2.5 py-1 text-xs font-medium text-[#4d554d]">
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {search.isLoading ? (
          <div className="space-y-4 p-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[#eef1ee]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded bg-[#eef1ee]" />
                  <div className="h-3 w-full max-w-sm rounded bg-[#eef1ee]" />
                  <div className="h-3 w-24 rounded bg-[#eef1ee]" />
                </div>
              </div>
            ))}
          </div>
        ) : search.isError ? (
          <div className="px-6 py-16 text-center">
            <i className="bi bi-wifi-off text-2xl text-[#8a6d00]" />
            <p className="mt-3 font-medium text-[#0a0a0a]">Search is unavailable right now</p>
            <p className="mt-1 text-sm text-[#7b857b]">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => void search.refetch()}
              className="mt-5 rounded-full border border-[#e6e9e6] px-5 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f7f9f7]"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5d7]">
              <i className="bi bi-search text-2xl text-[#8a6d00]" />
            </div>
            <p className="font-heading text-lg font-semibold text-[#0a0a0a]">
              {hasTerm ? 'No creators found' : 'No creators to suggest yet'}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-[#7b857b]">
              {hasTerm
                ? 'Try their username, a topic in their bio, or a different spelling.'
                : 'Verified creators will appear here as the community grows.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e6e9e6]">
            {users.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f7f9f7] sm:px-5"
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
                          className="bi bi-patch-check-fill flex-shrink-0 text-sm text-[#8a6d00]"
                          aria-label="Verified creator"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#7b857b]">
                      {account.bio || `@${account.username}`}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#7b857b]">
                      <span>{formatCount(account.followerCount)} followers</span>
                      {(account.state || account.region) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">
                            {[account.state, account.region].filter(Boolean).join(', ')}
                          </span>
                        </>
                      )}
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

      <div className="border-t border-[#e6e9e6] bg-[#f7f9f7] px-5 py-3">
        <p className="text-center text-[11px] leading-relaxed text-[#7b857b]">
          Follow educators to fill your Following feed with their latest posts.
        </p>
      </div>
    </Modal>
  )
}
