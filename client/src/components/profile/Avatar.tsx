import { useEffect, useState } from 'react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-24 w-24 text-3xl',
}

interface AvatarProps {
  src?: string
  name: string
  size?: AvatarSize
  className?: string
}

/** Profile photo with a branded initials fallback. */
export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase() || 'S'
  const sizeClass = SIZE_CLASSES[size]

  // A new upload should get a fresh chance even if the previous URL was broken.
  useEffect(() => setImageFailed(false), [src])

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={`${name}'s profile photo`}
        onError={() => setImageFailed(true)}
        className={`${sizeClass} flex-shrink-0 rounded-full bg-[#eef3ee] object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-label={`${name}'s profile photo`}
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0b53a] font-semibold text-[#0a0a0a] ${className}`}
    >
      {initial}
    </span>
  )
}
