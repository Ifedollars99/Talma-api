import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useFollowUser, useUnfollowUser } from '../../hooks/useFollows'

interface FollowButtonProps {
  username: string
  isFollowing: boolean
  compact?: boolean
  className?: string
}

/** Gold Follow pill that becomes an outlined Following pill once connected. */
export default function FollowButton({
  username,
  isFollowing,
  compact = false,
  className = '',
}: FollowButtonProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const follow = useFollowUser()
  const unfollow = useUnfollowUser()
  const isPending = follow.isPending || unfollow.isPending

  const onClick = () => {
    if (!isAuthenticated) {
      navigate('/signin')
      return
    }
    if (isPending) return
    if (isFollowing) {
      unfollow.mutate(username)
    } else {
      follow.mutate(username)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Unfollow ${username}` : `Follow ${username}`}
      className={`inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
        compact ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm'
      } ${
        isFollowing
          ? 'border border-[#e6e9e6] bg-white text-[#0a0a0a] hover:border-[#8a6d00] hover:text-[#8a6d00]'
          : 'bg-[#f5c842] text-[#0a0a0a] hover:bg-[#e8b92e]'
      } ${className}`}
    >
      {isPending ? (
        <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" />
      ) : (
        <i
          className={`bi ${isFollowing ? 'bi-person-check' : 'bi-person-plus'}`}
          aria-hidden="true"
        />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
