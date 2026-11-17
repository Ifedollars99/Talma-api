interface WelcomeCardProps {
  username: string
  notifications: number
}

/**
 * Home greeting. The classroom search, feed tabs and posts now live on the
 * Classroom tab, so Home keeps only this welcome section.
 */
export default function WelcomeCard({ username, notifications }: WelcomeCardProps) {
  return (
    <>
      {/* Mobile greeting */}
      <div className="welcome-card lg:hidden relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl px-5 py-4 text-white shadow-lg">
        <div className="welcome-card__glow absolute -top-20 -right-20 w-40 h-40 bg-[#f5c842]/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="welcome-card__title font-heading text-xl font-semibold">
            Welcome back, <span className="text-[#f5c842]">{username}</span>
          </h1>
          <p className="welcome-card__meta text-sm text-white/70 leading-relaxed mt-1">
            You have{' '}
            <span className="text-[#f5c842] font-medium">{notifications} new notifications</span>{' '}
            waiting for you.
          </p>
        </div>
      </div>

      {/* Desktop greeting */}
      <div className="welcome-card hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl px-8 py-6 text-white shadow-lg">
        <div className="welcome-card__glow absolute -top-24 -right-16 w-56 h-56 bg-[#f5c842]/10 rounded-full blur-3xl" />
        <div className="welcome-card__glow welcome-card__glow--green absolute -bottom-24 -left-16 w-56 h-56 bg-[#3a8f4d]/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="welcome-card__title font-heading text-2xl xl:text-3xl font-semibold">
            Welcome back, <span className="text-[#f5c842]">{username}</span>
          </h1>
          <p className="welcome-card__meta text-sm text-white/70">
            <span className="text-[#f5c842] font-medium">{notifications} new notifications</span>{' '}
            waiting.
          </p>
        </div>
      </div>
    </>
  )
}
