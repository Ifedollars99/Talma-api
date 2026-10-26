import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePost, useDeletePost, useFeed, useToggleLike } from '../../hooks/usePosts'
import { useUploadPostMedia } from '../../hooks/useUploads'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from '../../lib/auth'
import { VIDEO_CLASS_LEVELS, VIDEO_SUBJECTS } from '../../lib/videoOptions'
import type { FeedTab, Message } from '../../types'
import Avatar from '../profile/Avatar'
import Modal from '../ui/Modal'
import CreatorVerificationModal from '../videos/CreatorVerificationModal'

interface DashboardFeedProps {
  messages: Message[]
  notifications: number
  username: string
  onOpenSearch: () => void
}

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'foryou', label: 'For You' },
  { id: 'following', label: 'Following' },
]

/** Formats a timestamp the same way the original feed did. */
function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

export default function DashboardFeed({
  messages,
  notifications,
  username,
  onOpenSearch,
}: DashboardFeedProps) {
  const [feedTab, setFeedTab] = useState<FeedTab>('foryou')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [verifyOpen, setVerifyOpen] = useState(false)

  const { user } = useAuth()
  const isCreator = user?.creatorStatus === 'approved' || user?.role === 'admin'

  const { data, isLoading, isError } = useFeed({ tab: feedTab })
  const createPost = useCreatePost()
  const deletePost = useDeletePost()
  const toggleLike = useToggleLike()

  const posts = useMemo(() => data?.items ?? [], [data])

  const openComposer = () => {
    setShowCreatePost(true)
  }

  const closeComposer = () => {
    setShowCreatePost(false)
  }

  const handleDelete = () => {
    if (!postToDelete) return
    deletePost.mutate(postToDelete, {
      onSettled: () => {
        setPostToDelete(null)
        closeComposer()
      },
    })
  }

  return (
    <>
      {/* ============ MOBILE X / TWITTER HOME (mobile only) ============ */}
      <div className="lg:hidden -mx-4 -mt-4">
        {/* Mobile Welcome (same as desktop, compact) — before tabs */}
        <div className="welcome-card mx-4 mt-4 mb-3 relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl px-5 py-4 text-white shadow-lg">
          <div className="welcome-card__glow absolute -top-20 -right-20 w-40 h-40 bg-[#f5c842]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="welcome-card__title font-heading text-xl font-semibold">
              Welcome back, <span className="text-[#f5c842]">{username}</span>
            </h1>
            <p className="welcome-card__meta text-sm text-white/70 leading-relaxed mt-1">
              You have{' '}
              <span className="text-[#f5c842] font-medium">{notifications} new notifications</span>{' '}
              and <span className="text-[#86efac] font-medium">{messages.length} unread</span>{' '}
              messages waiting for you.
            </p>
          </div>
        </div>

        {/* Creator search */}
        <div className="px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-full items-center gap-2.5 rounded-full bg-[#f2f5f2] px-4 py-2.5 text-left text-sm text-[#7b857b] transition-colors hover:bg-[#eef1ee] hover:text-[#4d554d]"
          >
            <i className="bi bi-search text-base" />
            <span>Search creators, educators, students...</span>
          </button>
        </div>

        {/* Sticky For You / Following tabs */}
        <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-[#e6e9e6]">
          <div className="grid grid-cols-2">
            {FEED_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedTab(tab.id)}
                className={`relative py-3.5 text-[15px] transition-colors ${
                  feedTab === tab.id
                    ? 'font-bold text-[#0a0a0a]'
                    : 'font-medium text-[#7b857b]'
                }`}
              >
                <span>{tab.label}</span>
                {feedTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#f5c842] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile composer (X style) */}
        <div className="bg-white border-b border-[#e6e9e6] px-4 py-3 flex space-x-3">
          <Avatar src={user?.avatarUrl} name={username} size="sm" />
          <button
            type="button"
            onClick={() => openComposer()}
            className="flex-1 text-left text-[15px] text-[#7b857b] pt-2"
          >
            Share something educational...
          </button>
          <button
            type="button"
            onClick={() => openComposer()}
            aria-label="Add a video"
            title="Add a video"
            className="self-center w-9 h-9 rounded-full bg-[#fdf5d7] text-[#8a6d00] flex items-center justify-center hover:bg-[#fdeeb8] transition-colors"
          >
            <i className="bi bi-camera-video" />
          </button>
        </div>

        {/* Mobile create-post sheet */}
        {showCreatePost && (
          <div className="bg-white border-b border-[#e6e9e6] p-4">
            <PostComposer
              variant="mobile"
              canAttachMedia={isCreator}
              onRequireVerification={() => setVerifyOpen(true)}
              onCancel={closeComposer}
              onSubmit={(values) => {
                createPost.mutate(values, {
                  onSuccess: closeComposer,
                })
              }}
            />
          </div>
        )}

        {/* MOBILE FEED: X-style rows */}
        <div className="bg-white divide-y divide-[#e6e9e6] border-b border-[#e6e9e6]">
          {posts.length === 0 && !isLoading && (
            <div className="p-10 text-center">
              <p className="text-[#7b857b]">
                {feedTab === 'following'
                  ? 'Follow creators to see their posts here.'
                  : 'No posts yet. Be the first to share!'}
              </p>
            </div>
          )}

          {posts.map((post) => (
            <article key={post.id} className="px-4 py-3 flex space-x-3 active:bg-[#fafbfa]">
              <Link
                to={`/u/${encodeURIComponent(post.authorUsername ?? post.authorId)}`}
                className="flex-shrink-0"
                aria-label={`View ${post.author}'s profile`}
              >
                <Avatar
                  src={post.authorAvatarUrl}
                  name={post.author}
                  size="sm"
                  className="border border-[#e6e9e6]"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[15px] min-w-0">
                  <Link
                    to={`/u/${encodeURIComponent(post.authorUsername ?? post.authorId)}`}
                    className="font-bold text-[#0a0a0a] truncate hover:underline"
                  >
                    {post.author}
                  </Link>
                  {post.authorRole === 'creator' && (
                    <span
                      className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-[#fdf5d7] text-[#8a6d00] rounded-full font-semibold flex-shrink-0"
                      title="Verified creator"
                    >
                      <i className="bi bi-patch-check-fill" />
                      Creator
                    </span>
                  )}
                  <span className="text-[#7b857b] text-[13px] flex-shrink-0">
                    · {formatTimeAgo(post.timestamp)}
                  </span>
                  {post.canDelete && (
                    <button
                      type="button"
                      onClick={() => setPostToDelete(post.id)}
                      aria-label="Delete post"
                      className="ml-auto text-[#7b857b] p-1"
                    >
                      <i className="bi bi-trash text-sm" />
                    </button>
                  )}
                </div>
                {(post.subject || post.classLevel) && (
                  <p className="text-[13px] text-[#8a6d00] font-medium">
                    {[post.subject, post.classLevel].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-[15px] text-[#0a0a0a] leading-normal mt-0.5">{post.content}</p>
                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-[#e6e9e6]">
                    <img src={post.mediaUrl} alt="" className="w-full max-h-72 object-cover" />
                  </div>
                )}
                {post.mediaType === 'video' && post.mediaUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-[#e6e9e6]">
                    <video src={post.mediaUrl} className="w-full max-h-72 object-cover" controls />
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 -ml-2 max-w-[300px]">
                  <button
                    type="button"
                    onClick={() => toggleLike.mutate({ postId: post.id, liked: post.likedByMe })}
                    className={`flex items-center gap-1 p-2 ${
                      post.likedByMe ? 'text-[#8a6d00]' : 'text-[#7b857b]'
                    }`}
                  >
                    <i className={`bi ${post.likedByMe ? 'bi-heart-fill' : 'bi-heart'} text-[17px]`} />
                    <span className="text-[13px]">{post.likes}</span>
                  </button>
                  <button type="button" className="flex items-center gap-1 text-[#7b857b] p-2">
                    <i className="bi bi-chat text-[17px]" />
                    <span className="text-[13px]">{post.comments}</span>
                  </button>
                  <button type="button" className="text-[#7b857b] p-2">
                    <i className="bi bi-share text-[17px]" />
                  </button>
                  <button type="button" className="text-[#7b857b] p-2">
                    <i className="bi bi-bookmark text-[17px]" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile FAB (compose) */}
        <button
          type="button"
          onClick={() => (showCreatePost ? closeComposer() : openComposer())}
          aria-label="Create post"
          className="fixed bottom-[78px] right-4 z-40 w-14 h-14 bg-[#f5c842] rounded-full shadow-xl flex items-center justify-center text-[#0a0a0a]"
        >
          <i className="bi bi-plus-lg text-2xl" />
        </button>
      </div>

      {/* Welcome Section — compact greeting (DESKTOP ONLY) */}
      <div className="welcome-card hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl px-8 py-6 text-white shadow-lg">
        <div className="welcome-card__glow absolute -top-24 -right-16 w-56 h-56 bg-[#f5c842]/10 rounded-full blur-3xl" />
        <div className="welcome-card__glow welcome-card__glow--green absolute -bottom-24 -left-16 w-56 h-56 bg-[#3a8f4d]/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="welcome-card__title font-heading text-2xl xl:text-3xl font-semibold">
            Welcome back, <span className="text-[#f5c842]">{username}</span>
          </h1>
          <p className="welcome-card__meta text-sm text-white/70">
            <span className="text-[#f5c842] font-medium">{notifications} new notifications</span>{' '}
            and <span className="text-[#7cb342] font-medium">{messages.length} unread</span> messages
            waiting.
          </p>
        </div>
      </div>

      {/* Desktop creator search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden lg:flex w-full items-center gap-3 rounded-2xl border border-[#e6e9e6] bg-white px-5 py-3.5 text-left text-[15px] text-[#7b857b] shadow-sm transition-colors hover:border-[#d8ded8] hover:text-[#4d554d]"
      >
        <i className="bi bi-search text-lg" />
        <span>Search creators, educators and students...</span>
      </button>

      {/* Desktop For You / Following tabs */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#e6e9e6] shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 max-w-2xl mx-auto">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFeedTab(tab.id)}
              className={`relative py-4 text-[15px] transition-colors ${
                feedTab === tab.id
                  ? 'font-bold text-[#0a0a0a]'
                  : 'font-medium text-[#7b857b] hover:text-[#4d554d]'
              }`}
            >
              <span>{tab.label}</span>
              {feedTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#f5c842] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create Post Section - Refined (DESKTOP ONLY) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#e6e9e6] overflow-hidden shadow-sm">
        <div className="p-8 bg-gradient-to-r from-white via-[#fdf5d7]/20 to-white">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar
                src={user?.avatarUrl}
                name={username}
                size="md"
                className="shadow-md"
              />
              <button
                type="button"
                onClick={() => openComposer()}
                className="flex-1 text-left px-6 py-3.5 bg-[#f7f9f7] rounded-full text-[#7b857b] hover:bg-[#eef1ee] transition-all duration-300 focus:ring-2 focus:ring-[#f5c842] focus:ring-offset-2 font-medium"
              >
                Share something educational with your community...
              </button>
              <button
                type="button"
                onClick={() => openComposer()}
                aria-label="Add a video"
                title="Add a video"
                className="w-12 h-12 flex-shrink-0 rounded-full bg-[#fdf5d7] text-[#8a6d00] hover:bg-[#fdeeb8] hover:scale-105 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:ring-offset-2"
              >
                <i className="bi bi-camera-video text-xl" />
              </button>
            </div>

            {showCreatePost && (
              <div className="border-t border-[#e6e9e6] pt-8 space-y-6 animate-fade-in">
                <PostComposer
                  variant="desktop"
                  canAttachMedia={isCreator}
                  onRequireVerification={() => setVerifyOpen(true)}
                  onCancel={closeComposer}
                  onSubmit={(values) => {
                    createPost.mutate(values, {
                      onSuccess: closeComposer,
                    })
                  }}
                />
              </div>
            )}
        </div>
      </div>

      {/* Educational Posts Feed - Premium Treatment (DESKTOP ONLY) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#e6e9e6] overflow-hidden shadow-sm">
        <div className="px-8 py-8 border-b border-[#e6e9e6] bg-gradient-to-r from-white via-[#eef3ee]/10 to-white">
          <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a]">
            Educational Community
          </h2>
          <p className="text-[#7b857b] mt-2">
            Connect, learn, and share knowledge with your peers
          </p>
        </div>

        <div className="divide-y divide-[#e6e9e6]">
          {posts.length === 0 && !isLoading && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[#fdf5d7] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-chat-dots text-2xl text-[#8a6d00]" />
              </div>
              <p className="text-[#7b857b] text-lg">
                {feedTab === 'following'
                  ? 'Follow creators to see their posts here.'
                  : 'No posts yet. Be the first to share something!'}
              </p>
            </div>
          )}

          {isError && (
            <div className="p-12 text-center">
              <p className="text-[#8a6d00]">Could not load the feed. Please try again.</p>
            </div>
          )}

          {posts.map((post) => (
            <article key={post.id} className="p-8 hover:bg-[#fafbfa] transition-colors duration-300">
              {/* Post Header */}
              <div className="flex items-start space-x-4 mb-6">
                <Link
                  to={`/u/${encodeURIComponent(post.authorUsername ?? post.authorId)}`}
                  className="flex-shrink-0"
                  aria-label={`View ${post.author}'s profile`}
                >
                  <Avatar
                    src={post.authorAvatarUrl}
                    name={post.author}
                    size="md"
                    className="border border-[#e6e9e6] shadow-sm"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 flex-wrap">
                    <Link
                      to={`/u/${encodeURIComponent(post.authorUsername ?? post.authorId)}`}
                      className="font-semibold text-lg text-[#0a0a0a] hover:underline"
                    >
                      {post.author}
                    </Link>
                    {post.authorRole === 'creator' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdf5d7] text-[#8a6d00] border border-[#e6e9e6]">
                        <i className="bi bi-patch-check-fill" />
                        Verified creator
                      </span>
                    ) : post.authorRole === 'admin' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#edf4dc] text-[#3a8f4d] border border-[#e8f2d4]">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-[#7b857b] mt-2 flex-wrap">
                    {post.subject && (
                      <span className="flex items-center space-x-1 bg-[#f7f9f7] px-3 py-1 rounded-full">
                        <i className="bi bi-bookmark" />
                        <span>{post.subject}</span>
                      </span>
                    )}
                    {post.classLevel && (
                      <span className="flex items-center space-x-1 bg-[#f7f9f7] px-3 py-1 rounded-full">
                        <i className="bi bi-mortarboard" />
                        <span>{post.classLevel}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <i className="bi bi-clock" />
                      <span>{formatTimeAgo(post.timestamp)}</span>
                    </span>
                  </div>
                </div>

                {post.canDelete && (
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPostToDelete(post.id)}
                      className="text-[#7b857b] hover:text-[#8a6d00] hover:bg-[#fdf3cf] p-2.5 rounded-lg transition-all duration-300"
                      title="Delete post"
                    >
                      <i className="bi bi-trash text-lg" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-6 ml-18">
                <p className="text-base text-[#0a0a0a] leading-relaxed">{post.content}</p>
              </div>

              {/* Post Media */}
              {post.mediaType === 'image' && post.mediaUrl && (
                <div className="mb-6 ml-18 relative group rounded-xl overflow-hidden border border-[#e6e9e6]">
                  <img src={post.mediaUrl} alt={post.content} className="w-full max-h-96 object-cover" />
                  <button
                    type="button"
                    onClick={() => downloadMedia(post.mediaUrl as string, `${post.author}-${post.id}.jpg`)}
                    className="absolute top-4 right-4 bg-[#0a0a0a]/80 hover:bg-[#0a0a0a] text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    title="Download image"
                  >
                    <i className="bi bi-download text-lg" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>
              )}

              {post.mediaType === 'video' && post.mediaUrl && (
                <div className="mb-6 ml-18 relative group rounded-xl overflow-hidden border border-[#e6e9e6]">
                  <video src={post.mediaUrl} className="w-full max-h-96 object-cover" controls />
                  <button
                    type="button"
                    onClick={() => downloadMedia(post.mediaUrl as string, `${post.author}-${post.id}.mp4`)}
                    className="absolute top-4 right-4 bg-[#0a0a0a]/80 hover:bg-[#0a0a0a] text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    title="Download video"
                  >
                    <i className="bi bi-download text-lg" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e6e9e6] ml-18">
                <div className="flex items-center space-x-8">
                  <button
                    type="button"
                    onClick={() => toggleLike.mutate({ postId: post.id, liked: post.likedByMe })}
                    className={`flex items-center space-x-2 group transition-colors ${
                      post.likedByMe ? 'text-[#8a6d00]' : 'text-[#7b857b] hover:text-[#8a6d00]'
                    }`}
                  >
                    <div className="p-2 rounded-lg group-hover:bg-[#fdf5d7] transition-colors">
                      <i className={`bi ${post.likedByMe ? 'bi-heart-fill' : 'bi-heart'} text-lg`} />
                    </div>
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center space-x-2 text-[#7b857b] hover:text-[#3a8f4d] group transition-colors"
                  >
                    <div className="p-2 rounded-lg group-hover:bg-[#edf4dc] transition-colors">
                      <i className="bi bi-chat text-lg" />
                    </div>
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center space-x-2 text-[#7b857b] hover:text-[#0a0a0a] group transition-colors"
                  >
                    <div className="p-2 rounded-lg group-hover:bg-[#eef3ee] transition-colors">
                      <i className="bi bi-share text-lg" />
                    </div>
                    <span className="text-sm font-medium">Share</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="text-[#7b857b] hover:text-[#8a6d00] p-2 rounded-lg hover:bg-[#fdf5d7] transition-all duration-300"
                >
                  <i className="bi bi-bookmark text-lg" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={postToDelete !== null} onClose={() => setPostToDelete(null)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-[#fdf5d7] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-[#8a6d00] text-2xl" />
          </div>
          <h3 className="font-heading text-xl font-semibold text-[#0a0a0a] mb-2">Delete Post?</h3>
          <p className="text-[#4d554d] mb-6">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setPostToDelete(null)}
              className="flex-1 px-4 py-2.5 border border-[#e6e9e6] text-[#0a0a0a] rounded-lg hover:bg-[#f7f9f7] transition-colors font-medium"
            >
              No, Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 bg-[#8a6d00] text-white rounded-lg hover:bg-[#6b5400] transition-colors font-medium"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

      <CreatorVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
      />
    </>
  )
}

/** Triggers a browser download for post media. */
function downloadMedia(mediaUrl: string, fileName: string): void {
  try {
    const link = document.createElement('a')
    link.href = mediaUrl
    link.download = fileName
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    window.open(mediaUrl, '_blank')
  }
}

/* ---------------------------------------------------------------------------
   Post composer — shared by the desktop form and the mobile sheet.
   --------------------------------------------------------------------------- */

interface ComposerValues {
  content: string
  subject?: string
  classLevel?: string
  mediaType?: 'none' | 'image' | 'video'
  mediaUrl?: string
}

interface PostComposerProps {
  variant: 'desktop' | 'mobile'
  /** Verified creators may attach media; everyone else is asked to verify. */
  canAttachMedia?: boolean
  onRequireVerification?: () => void
  onCancel: () => void
  onSubmit: (values: ComposerValues) => void
  error?: string
}

function PostComposer({
  variant,
  canAttachMedia = false,
  onRequireVerification,
  onCancel,
  onSubmit,
  error,
}: PostComposerProps) {
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none')
  const [mediaUrl, setMediaUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileError, setFileError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadPostMedia()
  const uploading = upload.isPending

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    const isPhoto = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isPhoto && !isVideo) {
      setFileError('Only photos and videos can be attached — audio files are not supported.')
      return
    }

    setFileError('')
    setPreviewUrl(URL.createObjectURL(file))
    setMediaType(isVideo ? 'video' : 'image')

    try {
      const result = await upload.mutateAsync(file)
      setMediaUrl(result.url)
    } catch (caught) {
      setFileError(
        caught instanceof ApiError ? caught.message : 'That file could not be uploaded.',
      )
      setPreviewUrl('')
      setMediaUrl('')
      setMediaType('none')
    }
  }

  const clearMedia = () => {
    setMediaUrl('')
    setPreviewUrl('')
    setMediaType('none')
  }

  const submit = () => {
    if (!content.trim()) return
    if (mediaType === 'video' && (!subject || !classLevel)) {
      setFileError('Choose a subject and class level for this video.')
      return
    }
    setFileError('')
    onSubmit({
      content: content.trim(),
      ...(subject ? { subject } : {}),
      ...(classLevel ? { classLevel } : {}),
      mediaType,
      mediaUrl: mediaUrl || undefined,
    })
  }

  const canSubmit =
    content.trim().length > 0 &&
    !uploading &&
    (mediaType !== 'video' || (Boolean(subject) && Boolean(classLevel)))

  const mediaPreview = previewUrl ? (
    <div
      className={
        variant === 'mobile'
          ? 'rounded-xl overflow-hidden border border-[#e6e9e6]'
          : 'relative rounded-xl overflow-hidden border border-[#e6e9e6]'
      }
    >
      {mediaType === 'image' ? (
        <img
          src={previewUrl}
          alt="Preview"
          className={variant === 'mobile' ? 'w-full max-h-56 object-cover' : 'w-full max-h-64 object-cover'}
        />
      ) : (
        <video
          src={previewUrl}
          className={variant === 'mobile' ? 'w-full max-h-56 object-cover' : 'w-full max-h-64 object-cover'}
          controls
        />
      )}
      {variant === 'desktop' && (
        <button
          type="button"
          onClick={clearMedia}
          aria-label="Remove media"
          className="absolute top-3 right-3 bg-[#8a6d00]/90 hover:bg-[#6b5400] text-white rounded-lg w-8 h-8 flex items-center justify-center text-lg transition-colors shadow-md"
        >
          ✕
        </button>
      )}
    </div>
  ) : null

  const tagFields = (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`post-subject-${variant}`}
            className="mb-1.5 block text-sm font-medium text-[#4d554d]"
          >
            Subject
          </label>
          <select
            id={`post-subject-${variant}`}
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value)
              setFileError('')
            }}
            className="w-full rounded-xl border border-[#e6e9e6] bg-white px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
          >
            <option value="">Choose a subject</option>
            {VIDEO_SUBJECTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`post-class-level-${variant}`}
            className="mb-1.5 block text-sm font-medium text-[#4d554d]"
          >
            Class level
          </label>
          <select
            id={`post-class-level-${variant}`}
            value={classLevel}
            onChange={(event) => {
              setClassLevel(event.target.value)
              setFileError('')
            }}
            className="w-full rounded-xl border border-[#e6e9e6] bg-white px-4 py-2.5 text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
          >
            <option value="">Choose a class level</option>
            {VIDEO_CLASS_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      {mediaType === 'video' && (!subject || !classLevel) && (
        <p className="mt-2 text-xs font-medium text-[#8a6d00]">
          Choose a subject and class level to publish this video.
        </p>
      )}
    </div>
  )

  const uploadField = (
    <div>
      {variant === 'mobile' ? (
        canAttachMedia ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              id="post-media-upload-mobile"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <label
              htmlFor="post-media-upload-mobile"
              aria-label="Choose image or video"
              className="w-10 h-10 rounded-full bg-[#fdf5d7] text-[#8a6d00] flex items-center justify-center cursor-pointer"
            >
              <i className="bi bi-camera-video" />
            </label>
          </>
        ) : (
          <button
            type="button"
            onClick={onRequireVerification}
            aria-label="Verify to add media"
            className="w-10 h-10 rounded-full bg-[#fdf5d7] text-[#8a6d00] flex items-center justify-center"
          >
            <i className="bi bi-camera-video" />
          </button>
        )
      ) : canAttachMedia ? (
        <>
          <span className="block text-sm font-medium text-[#4d554d] mb-3">Add media</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            id="post-media-upload"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <label
            htmlFor="post-media-upload"
            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#fdf5d7] to-[#fdeeb8] text-[#8a6d00] rounded-xl cursor-pointer hover:from-[#fdeeb8] hover:to-[#fbe7a1] transition-all duration-300 flex items-center justify-center space-x-2 font-medium border border-[#e6e9e6]"
          >
            <i className="bi bi-camera-video text-lg" />
            <span>{uploading ? 'Uploading…' : 'Choose a video or photo'}</span>
          </label>
        </>
      ) : (
        <button
          type="button"
          onClick={onRequireVerification}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#fdf5d7] to-[#fdeeb8] text-[#8a6d00] rounded-xl cursor-pointer hover:from-[#fdeeb8] hover:to-[#fbe7a1] transition-all duration-300 flex items-center justify-center space-x-2 font-medium border border-[#e6e9e6]"
        >
          <i className="bi bi-patch-check text-lg" />
          <span>Verify to attach media</span>
        </button>
      )}
    </div>
  )

  if (variant === 'mobile') {
    return (
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share educational content, tips, resources, or questions..."
          className="w-full p-3 border border-[#e6e9e6] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c842] text-[15px] text-[#0a0a0a]"
          rows={3}
        />
        {tagFields}
        {mediaPreview}
        {fileError && <p className="text-sm text-[#8a6d00]">{fileError}</p>}
        {error && <p className="text-sm text-[#8a6d00]">{error}</p>}
        <div className="flex items-center justify-between">
          {uploadField}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-[#4d554d] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="px-5 py-2 bg-[#0a0a0a] text-white rounded-full text-sm font-semibold disabled:opacity-40"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="post-content" className="block text-sm font-medium text-[#4d554d] mb-3">
          Your insight
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share educational content, tips, resources, or questions..."
          className="w-full p-4 border border-[#e6e9e6] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c842] focus:border-transparent text-[#0a0a0a] placeholder-[#7b857b] leading-relaxed"
          rows={4}
        />
      </div>

      {tagFields}

      <div>
        {uploadField}
      </div>

      {fileError && <p className="text-sm text-[#8a6d00]">{fileError}</p>}
      {error && <p className="text-sm text-[#8a6d00]">{error}</p>}

      {mediaPreview}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-[#4d554d] hover:text-[#0a0a0a] transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="px-8 py-2.5 bg-gradient-to-r from-[#f5c842] to-[#e0b53a] text-white rounded-xl hover:shadow-lg hover:from-[#e0b53a] hover:to-[#b8860b] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          Share Post
        </button>
      </div>
    </div>
  )
}
