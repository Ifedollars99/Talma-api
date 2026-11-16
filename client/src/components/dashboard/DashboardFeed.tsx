import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeletePost, useFeed, useToggleLike } from '../../hooks/usePosts'
import { useAuth } from '../../lib/auth'
import type { FeedTab } from '../../types'
import Avatar from '../profile/Avatar'
import Modal from '../ui/Modal'
import YouTubeVideoLink from '../videos/YouTubeVideoLink'

interface DashboardFeedProps {
  onOpenSearch: () => void
  /** Opens the creator upload flow (Classroom - Upload a video). */
  onUpload: () => void
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

export default function DashboardFeed({ onOpenSearch, onUpload }: DashboardFeedProps) {
  const [feedTab, setFeedTab] = useState<FeedTab>('foryou')
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  const { user } = useAuth()
  const isEducator =
    user?.role === 'creator' || user?.role === 'lecturer' || user?.role === 'admin'
  const isCreator =
    isEducator && (user?.creatorStatus === 'approved' || user?.role === 'admin')

  const { data, isLoading, isError } = useFeed({ tab: feedTab })
  const deletePost = useDeletePost()
  const toggleLike = useToggleLike()

  const posts = useMemo(() => data?.items ?? [], [data])

  const handleDelete = () => {
    if (!postToDelete) return
    deletePost.mutate(postToDelete, {
      onSettled: () => {
        setPostToDelete(null)
      },
    })
  }

  return (
    <>
      {/* ============ MOBILE X / TWITTER CLASSROOM (mobile only) ============ */}
      <div className="lg:hidden -mx-4 -mt-4">
        {/* Creator search */}
        <div className="px-4 pb-3 pt-4">
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

        {/* Mobile upload entry */}
        {isCreator && (
          <div className="bg-white border-b border-[#e6e9e6] px-4 py-3">
            <button
              type="button"
              onClick={onUpload}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
            >
              <i className="bi bi-cloud-arrow-up text-[#f5c842]" />
              Upload a video
            </button>
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
                    Â· {formatTimeAgo(post.timestamp)}
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
                    {[post.subject, post.classLevel].filter(Boolean).join(' Â· ')}
                  </p>
                )}
                <p className="text-[15px] text-[#0a0a0a] leading-normal mt-0.5">{post.content}</p>
                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-[#e6e9e6]">
                    <img src={post.mediaUrl} alt="" className="w-full max-h-72 object-cover" />
                  </div>
                )}
                {post.mediaType === 'video' && (
                  <YouTubeVideoLink
                    href={post.youtubeUrl}
                    mediaUrl={post.mediaUrl}
                    title={post.content}
                    className="mt-2 max-h-72"
                  />
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

        {/* Mobile FAB (upload) */}
        {isCreator && (
          <button
            type="button"
            onClick={onUpload}
            aria-label="Upload a video"
            className="fixed bottom-[78px] right-4 z-40 w-14 h-14 bg-[#f5c842] rounded-full shadow-xl flex items-center justify-center text-[#0a0a0a]"
          >
            <i className="bi bi-cloud-arrow-up text-2xl" />
          </button>
        )}
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

      {/* Upload Video Section - Refined (DESKTOP ONLY) */}
      {isCreator && (
        <div className="hidden lg:block bg-white rounded-2xl border border-[#e6e9e6] overflow-hidden shadow-sm">
          <div className="p-8 bg-gradient-to-r from-white via-[#fdf5d7]/20 to-white">
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-[#fdf5d7] flex items-center justify-center">
                <i className="bi bi-cloud-arrow-up text-2xl text-[#8a6d00]" />
              </div>
              <div className="max-w-md">
                <h2 className="font-heading text-xl font-semibold text-[#0a0a0a]">Upload a video</h2>
                <p className="text-[#7b857b] text-sm mt-2">
                  Share an educational lesson with your community. The video is sent to your YouTube
                  channel and listed in the Talma library after review.
                </p>
              </div>
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-6 py-3 font-semibold text-[#0a0a0a] shadow-md transition-colors hover:bg-[#e9b92b]"
              >
                <i className="bi bi-cloud-arrow-up" />
                Upload video
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Post Media — images and videos uploaded with the post */}
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

              {post.mediaType === 'video' && (
                <div className="mb-6 ml-18 max-w-xl">
                  <YouTubeVideoLink
                    href={post.youtubeUrl}
                    mediaUrl={post.mediaUrl}
                    title={post.content}
                  />
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
