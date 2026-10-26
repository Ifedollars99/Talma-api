import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import FollowListModal, { type FollowListTab } from './FollowListModal'
import { usePublicProfile } from '../../hooks/useProfile'
import { useToggleLike } from '../../hooks/usePosts'
import { formatCount } from '../../lib/formatCount'
import type { Post, PublicProfile } from '../../types'

type ProfileTab = 'posts' | 'media'

interface ProfileScreenProps {
  username: string | undefined
  isOwnProfile?: boolean
  onEdit?: () => void
}

function formatProfileDate(value: string | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return 'now'
}

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female' }

function profileLocation(profile: PublicProfile): string {
  return [profile.state, profile.region].filter(Boolean).join(', ')
}

/** Twitter/X-inspired profile timeline shared by the public and own-profile screens. */
export default function ProfileScreen({
  username,
  isOwnProfile = false,
  onEdit,
}: ProfileScreenProps) {
  const profileQuery = usePublicProfile(username)
  const toggleLike = useToggleLike()
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [followList, setFollowList] = useState<FollowListTab | null>(null)
  const [shared, setShared] = useState<'idle' | 'copied' | 'error'>('idle')

  const profile = profileQuery.data?.user
  const posts = profileQuery.data?.posts ?? []
  const mediaCount = posts.filter((post) => Boolean(post.mediaUrl)).length
  const visiblePosts = tab === 'media' ? posts.filter((post) => Boolean(post.mediaUrl)) : posts

  const shareProfile = async () => {
    if (!profile) return
    const url = `${window.location.origin}/u/${encodeURIComponent(profile.username)}`

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${profile.username} on Talma`, url })
        return
      }
      if (!navigator.clipboard) {
        window.prompt('Copy this profile link', url)
        return
      }
      await navigator.clipboard.writeText(url)
      setShared('copied')
      window.setTimeout(() => setShared('idle'), 2400)
    } catch {
      setShared('error')
      window.setTimeout(() => setShared('idle'), 2400)
    }
  }

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5d7]">
          <i className="bi bi-person-x text-2xl text-[#8a6d00]" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-[#0a0a0a]">
          This profile is not available
        </h2>
        <p className="mt-1 text-[#4d554d]">
          The account may be private, or the link may be incorrect.
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="mt-5 rounded-xl bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  const isCreator = profile.creatorStatus === 'approved'

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#e6e9e6] px-4 py-3 sm:px-6">
        <div>
          <h1 className="font-heading text-xl font-semibold text-[#0a0a0a]">Profile</h1>
          <p className="text-xs text-[#7b857b]">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
        <span className="rounded-full bg-[#f7f9f7] px-3 py-1 text-xs font-medium text-[#4d554d]">
          @{profile.username}
        </span>
      </div>

      <div className="relative">
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#17331f] to-[#8a6d00] sm:h-48">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#f5c842]/20 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#7cb342]/25 blur-3xl" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
              backgroundSize: '18px 18px',
            }}
          />
        </div>

        <div className="px-4 sm:px-6">
          <div className="relative z-10 -mt-12 flex items-end justify-between gap-3 sm:-mt-14">
            <Avatar
              src={profile.avatarUrl}
              name={profile.username}
              size="xl"
              className="border-4 border-white shadow-lg"
            />

            <div className="mb-2 flex items-center gap-2">
              {isOwnProfile ? (
                onEdit ? (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-[#e6e9e6] px-5 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f7f9f7]"
                  >
                    Edit profile
                  </button>
                ) : (
                  <Link
                    to="/myprofile"
                    className="rounded-full border border-[#e6e9e6] px-5 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f7f9f7]"
                  >
                    Edit profile
                  </Link>
                )
              ) : (
                <>
                  <FollowButton
                    username={profile.username}
                    isFollowing={profile.isFollowing}
                  />
                  <button
                    type="button"
                    onClick={() => void shareProfile()}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e6e9e6] px-3 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#f7f9f7] sm:px-5"
                  >
                    <i className="bi bi-share" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pb-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0a0a0a]">
                {profile.username}
              </h2>
              {isCreator && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#f5c842] bg-[#fdf5d7] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6d00]">
                  <i className="bi bi-patch-check-fill" />
                  Creator
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-[#7b857b]">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#0a0a0a]">
                {profile.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#7b857b]">
              <span className="inline-flex items-center gap-1.5">
                <i className="bi bi-geo-alt text-[#8a6d00]" />
                {profileLocation(profile)}
              </span>
              {profile.gender && (
                <span className="inline-flex items-center gap-1.5">
                  <i className="bi bi-person text-[#8a6d00]" />
                  {GENDER_LABEL[profile.gender] ?? profile.gender}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <i className="bi bi-calendar3 text-[#8a6d00]" />
                Joined {formatProfileDate(profile.createdAt)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <button
                type="button"
                onClick={() => setFollowList('following')}
                className="text-left transition-colors hover:text-[#8a6d00]"
                aria-label={`View ${profile.followingCount} following`}
              >
                <strong className="font-semibold text-[#0a0a0a]">
                  {formatCount(profile.followingCount)}
                </strong>{' '}
                <span className="text-[#7b857b]">Following</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowList('followers')}
                className="text-left transition-colors hover:text-[#8a6d00]"
                aria-label={`View ${profile.followerCount} followers`}
              >
                <strong className="font-semibold text-[#0a0a0a]">
                  {formatCount(profile.followerCount)}
                </strong>{' '}
                <span className="text-[#7b857b]">Followers</span>
              </button>
              <span>
                <strong className="font-semibold text-[#0a0a0a]">{posts.length}</strong>{' '}
                <span className="text-[#7b857b]">posts</span>
              </span>
              <span>
                <strong className="font-semibold text-[#0a0a0a]">{mediaCount}</strong>{' '}
                <span className="text-[#7b857b]">media</span>
              </span>
              {isCreator && profile.creatorVerifiedAt && (
                <span className="text-[#7b857b]">
                  Creator since{' '}
                  <strong className="font-semibold text-[#0a0a0a]">
                    {formatProfileDate(profile.creatorVerifiedAt)}
                  </strong>
                </span>
              )}
            </div>

            {shared === 'copied' && (
              <p className="mt-3 text-xs font-medium text-[#3a8f4d]">Profile link copied.</p>
            )}
            {shared === 'error' && (
              <p className="mt-3 text-xs font-medium text-[#8a6d00]">
                Could not share the profile link.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-[#e6e9e6]">
        <div className="grid grid-cols-2">
          {(
            [
              { id: 'posts', label: 'Posts', count: posts.length },
              { id: 'media', label: 'Media', count: mediaCount },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-selected={tab === item.id}
              className={`relative py-4 text-sm transition-colors ${
                tab === item.id
                  ? 'font-bold text-[#0a0a0a]'
                  : 'font-medium text-[#7b857b] hover:bg-[#f7f9f7] hover:text-[#4d554d]'
              }`}
            >
              {item.label}
              <span className="ml-1.5 text-xs font-medium text-[#7b857b]">{item.count}</span>
              {tab === item.id && (
                <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#f5c842]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#e6e9e6]">
        {visiblePosts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <i
              className={`bi ${
                tab === 'media' ? 'bi-images' : 'bi-chat-square-text'
              } text-2xl text-[#8a6d00]`}
            />
            <p className="mt-3 font-medium text-[#0a0a0a]">
              {tab === 'media' ? 'No media yet' : 'No posts yet'}
            </p>
            <p className="mt-1 text-sm text-[#7b857b]">
              {tab === 'media'
                ? 'Photos and videos shared by this creator will appear here.'
                : 'When this account posts, it will show up here.'}
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              profile={profile}
              onLike={() => toggleLike.mutate({ postId: post.id, liked: post.likedByMe })}
            />
          ))
        )}
      </div>

      <FollowListModal
        open={followList !== null}
        username={profile.username}
        initialTab={followList ?? 'followers'}
        onClose={() => setFollowList(null)}
      />
    </div>
  )
}

function ProfilePostCard({
  post,
  profile,
  onLike,
}: {
  post: Post
  profile: PublicProfile
  onLike: () => void
}) {
  const isCreator = profile.creatorStatus === 'approved'

  return (
    <article className="flex gap-3 px-4 py-4 transition-colors hover:bg-[#f7f9f7] sm:px-6">
      <Link
        to={`/u/${encodeURIComponent(profile.username)}`}
        aria-label={`View ${profile.username}'s profile`}
        className="flex-shrink-0"
      >
        <Avatar src={profile.avatarUrl} name={profile.username} size="sm" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Link
            to={`/u/${encodeURIComponent(profile.username)}`}
            className="truncate font-semibold text-[#0a0a0a] hover:underline"
          >
            {profile.username}
          </Link>
          {isCreator && (
            <i
              className="bi bi-patch-check-fill text-sm text-[#8a6d00]"
              aria-label="Verified creator"
            />
          )}
          <span className="truncate text-[13px] text-[#7b857b]">@{profile.username}</span>
          <span className="text-[13px] text-[#7b857b]">· {timeAgo(post.timestamp)}</span>
        </div>

        {(post.subject || post.classLevel) && (
          <p className="mt-0.5 text-[12px] font-medium text-[#8a6d00]">
            {[post.subject, post.classLevel].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-[#0a0a0a]">
          {post.content}
        </p>

        {post.mediaType === 'image' && post.mediaUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#e6e9e6]">
            <img src={post.mediaUrl} alt="" className="max-h-96 w-full object-cover" />
          </div>
        )}
        {post.mediaType === 'video' && post.mediaUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#e6e9e6]">
            <video src={post.mediaUrl} controls className="max-h-96 w-full object-cover" />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between max-w-md">
          <button
            type="button"
            onClick={onLike}
            aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
            className={`inline-flex items-center gap-1.5 rounded-full p-2 transition-colors ${
              post.likedByMe
                ? 'text-[#8a6d00]'
                : 'text-[#7b857b] hover:bg-[#fdf5d7] hover:text-[#8a6d00]'
            }`}
          >
            <i className={`bi ${post.likedByMe ? 'bi-heart-fill' : 'bi-heart'}`} />
            <span className="text-[13px] font-medium">{post.likes}</span>
          </button>
          <button
            type="button"
            aria-label="Comments"
            className="inline-flex items-center gap-1.5 rounded-full p-2 text-[#7b857b] transition-colors hover:bg-[#edf4dc] hover:text-[#3a8f4d]"
          >
            <i className="bi bi-chat" />
            <span className="text-[13px] font-medium">{post.comments}</span>
          </button>
          <button
            type="button"
            aria-label="Bookmark post"
            className="inline-flex items-center rounded-full p-2 text-[#7b857b] transition-colors hover:bg-[#f7f9f7] hover:text-[#0a0a0a]"
          >
            <i className="bi bi-bookmark" />
          </button>
        </div>
      </div>
    </article>
  )
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-36 bg-[#eef1ee] sm:h-48" />
      <div className="px-4 sm:px-6">
        <div className="-mt-12 h-24 w-24 rounded-full border-4 border-white bg-[#eef1ee] sm:-mt-14" />
        <div className="mt-4 space-y-3 pb-6">
          <div className="h-6 w-40 rounded bg-[#eef1ee]" />
          <div className="h-3 w-24 rounded bg-[#eef1ee]" />
          <div className="h-3 w-full max-w-md rounded bg-[#eef1ee]" />
          <div className="h-3 w-2/3 max-w-sm rounded bg-[#eef1ee]" />
        </div>
      </div>
      <div className="h-12 border-y border-[#e6e9e6] bg-[#f7f9f7]" />
      <div className="space-y-4 p-6">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-[#eef1ee]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-[#eef1ee]" />
              <div className="h-3 w-full rounded bg-[#eef1ee]" />
              <div className="h-3 w-3/4 rounded bg-[#eef1ee]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
