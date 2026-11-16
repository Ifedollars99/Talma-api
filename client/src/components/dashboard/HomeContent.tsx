import { Link } from 'react-router-dom'
import { useHomeContent } from '../../hooks/useHome'
import { formatCount } from '../../lib/formatCount'
import type { Advertisement } from '../../types'
import Avatar from '../profile/Avatar'

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6d00]">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-heading text-2xl font-semibold text-[#0a0a0a]">{title}</h2>
      <p className="mt-1 text-sm text-[#4d554d]">{description}</p>
    </div>
  )
}

function AdCard({ ad }: { ad: Advertisement }) {
  const isSchool = ad.kind === 'school'
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white shadow-sm">
      <div
        className={`h-1.5 ${
          isSchool
            ? 'bg-gradient-to-r from-[#f5c842] to-[#e9b92b]'
            : 'bg-gradient-to-r from-[#3a8f4d] to-[#7cb342]'
        }`}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isSchool
                ? 'bg-[#fdf5d7] text-[#8a6d00]'
                : 'bg-[#edf4dc] text-[#2f6b3d]'
            }`}
          >
            <i className={`bi ${isSchool ? 'bi-building' : 'bi-easel'}`} />
            {ad.badge}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-[#7b857b]">
            {isSchool ? 'School' : 'Teaching'}
          </span>
        </div>

        <h3 className="mt-3 font-heading text-lg font-semibold text-[#0a0a0a]">{ad.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-[#8a6d00]">{ad.subtitle}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4d554d]">
          {ad.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#7b857b]">
            <i className="bi bi-geo-alt" />
            {ad.location}
          </span>
          <a
            href={ad.ctaUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
          >
            {ad.ctaLabel}
            <i className="bi bi-arrow-up-right" />
          </a>
        </div>
      </div>
    </article>
  )
}

/**
 * Home content below the welcome card: verified educators and their WhatsApp
 * communities, followed by school and teaching advertisement placements.
 */
export default function HomeContent() {
  const { data, isLoading, isError, refetch } = useHomeContent()

  const educators = data?.educators ?? []
  const schoolAds = data?.schoolAds ?? []
  const teachingAds = data?.teachingAds ?? []

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-2xl border border-[#e6e9e6] bg-white"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#e6e9e6] bg-white px-6 py-8 text-center">
        <p className="text-[#4d554d]">Could not load the Home spotlight.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 font-semibold text-[#8a6d00] underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Educator profiles"
          title="People you can learn from"
          description="Tap an educator's photo to open their full profile, bio and posts. Join their WhatsApp community to learn with them."
        />

        {educators.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cfd6cf] bg-white px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf5d7] text-[#8a6d00]">
              <i className="bi bi-people text-xl" />
            </div>
            <p className="font-medium text-[#0a0a0a]">No educator communities yet</p>
            <p className="mt-1 text-sm text-[#4d554d]">
              Verified educators appear here after they add a WhatsApp group link.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {educators.map((educator) => {
              const location = [educator.state, educator.region].filter(Boolean).join(', ')
              const profileUrl = `/u/${encodeURIComponent(educator.username)}`
              return (
                <article
                  key={educator.id}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Facebook-style cover strip */}
                  <div className="relative h-28 overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#17331f] to-[#8a6d00]">
                    <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[#f5c842]/20 blur-2xl" />
                    <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-[#7cb342]/25 blur-2xl" />
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                      <i className="bi bi-patch-check-fill text-[#f5c842]" />
                      Verified
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5">
                    <div className="flex items-end justify-between gap-3">
                      <Link
                        to={profileUrl}
                        aria-label={`Open ${educator.username}'s profile`}
                        className="-mt-14 block w-fit rounded-full ring-4 ring-white shadow-lg transition-transform group-hover:scale-105"
                      >
                        <Avatar
                          src={educator.avatarUrl}
                          name={educator.username}
                          size="2xl"
                        />
                      </Link>
                      <Link
                        to={profileUrl}
                        className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-[#8a6d00] hover:underline"
                      >
                        View profile
                        <i className="bi bi-arrow-right" />
                      </Link>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={profileUrl}
                          className="min-w-0 font-heading text-lg font-semibold text-[#0a0a0a] hover:underline after:absolute after:inset-0 after:content-['']"
                        >
                          <span className="block truncate">{educator.username}</span>
                        </Link>
                        <i
                          className="bi bi-patch-check-fill flex-shrink-0 text-[#8a6d00]"
                          title="Verified educator"
                        />
                      </div>
                      <p className="truncate text-xs text-[#7b857b]">
                        <i className="bi bi-geo-alt me-1" />
                        {location || 'Online educator'}
                      </p>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#4d554d]">
                      {educator.bio || 'Verified educator sharing lessons on Talma.'}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-[#7b857b]">
                      <span>
                        <strong className="font-semibold text-[#0a0a0a]">
                          {formatCount(educator.followerCount)}
                        </strong>{' '}
                        followers
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <i className="bi bi-mortarboard" />
                        Educator
                      </span>
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <a
                        href={educator.whatsappUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3a8f4d] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2f6b3d]"
                      >
                        <i className="bi bi-whatsapp" />
                        WhatsApp group
                      </a>
                      <Link
                        to={profileUrl}
                        className="rounded-lg border border-[#e6e9e6] px-3.5 py-2 text-sm font-semibold text-[#4d554d] transition-colors hover:bg-[#f7f9f7]"
                      >
                        About
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {schoolAds.length > 0 && (
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Schools & colleges"
            title="Places to learn"
            description="Admissions, scholarships and campus updates from schools on Talma."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {schoolAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}

      {teachingAds.length > 0 && (
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Classes & revision"
            title="Teaching advertisements"
            description="Live classes, exam clinics and revision cohorts from educators."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachingAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
