import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHomeContent } from '../../hooks/useHome'
import { formatCount } from '../../lib/formatCount'
import type { Advertisement, HomeEducator } from '../../types'
import Avatar from '../profile/Avatar'
import AdvertisementModal from './AdvertisementModal'

export type HomeSection = 'overview' | 'educators' | 'schools' | 'classes'

interface HomeContentProps {
  section: HomeSection
  onNavigate: (section: HomeSection) => void
}

const SECTION_TABS: { id: HomeSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Home', icon: 'bi-house-door' },
  { id: 'educators', label: 'Educators', icon: 'bi-people' },
  { id: 'schools', label: 'Schools & colleges', icon: 'bi-building' },
  { id: 'classes', label: 'Classes & revision', icon: 'bi-easel' },
]

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

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd6cf] bg-white px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf5d7] text-[#8a6d00]">
        <i className={`bi ${icon} text-xl`} />
      </div>
      <p className="font-medium text-[#0a0a0a]">{title}</p>
      <p className="mt-1 text-sm text-[#4d554d]">{description}</p>
    </div>
  )
}

function SectionNav({
  section,
  onNavigate,
}: {
  section: HomeSection
  onNavigate: (section: HomeSection) => void
}) {
  return (
    <nav
      aria-label="Home sections"
      className="rounded-2xl border border-[#e6e9e6] bg-white p-1.5 shadow-sm"
    >
      <div className="flex gap-1 overflow-x-auto">
        {SECTION_TABS.map((tab) => {
          const active = section === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#fdf5d7] text-[#0a0a0a] shadow-sm'
                  : 'text-[#4d554d] hover:bg-[#f7f9f7]'
              }`}
            >
              <i className={`bi ${tab.icon}`} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function OverviewCard({
  icon,
  title,
  description,
  count,
  accent,
  onClick,
}: {
  icon: string
  title: string
  description: string
  count: string
  accent: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-[#e6e9e6] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${accent}`}
      >
        <i className={`bi ${icon}`} />
      </span>
      <h3 className="mt-4 font-heading text-xl font-semibold text-[#0a0a0a]">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[#4d554d]">{description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#7b857b]">
          {count}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#8a6d00]">
          Open
          <i className="bi bi-arrow-right transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}

function HomeOverview({
  educators,
  schoolAds,
  teachingAds,
  onNavigate,
}: {
  educators: HomeEducator[]
  schoolAds: Advertisement[]
  teachingAds: Advertisement[]
  onNavigate: (section: HomeSection) => void
}) {
  const educatorCount = `${educators.length} educator${educators.length === 1 ? '' : 's'}`
  const schoolCount = `${schoolAds.length} advert${schoolAds.length === 1 ? '' : 's'}`
  const teachingCount = `${teachingAds.length} opportunit${teachingAds.length === 1 ? 'y' : 'ies'}`

  return (
    <section className="space-y-4">
      <SectionHeading
        eyebrow="Home"
        title="Explore Talma"
        description="Educator profiles, school adverts and teaching jobs now each have their own page. Choose where you want to go."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          icon="bi-people"
          title="Educator profiles"
          description="Meet verified educators, view their full profiles and join their WhatsApp communities."
          count={educatorCount}
          accent="bg-[#fdf5d7] text-[#8a6d00]"
          onClick={() => onNavigate('educators')}
        />
        <OverviewCard
          icon="bi-building"
          title="Schools & colleges"
          description="Browse admissions, scholarships and school adverts posted by the Talma community."
          count={schoolCount}
          accent="bg-[#eef7ff] text-[#1d4ed8]"
          onClick={() => onNavigate('schools')}
        />
        <OverviewCard
          icon="bi-easel"
          title="Classes & revision"
          description="Find teaching jobs, lecturer vacancies and classroom opportunities posted by the community."
          count={teachingCount}
          accent="bg-[#edf4dc] text-[#2f6b3d]"
          onClick={() => onNavigate('classes')}
        />
      </div>
    </section>
  )
}

function EducatorsPage({ educators }: { educators: HomeEducator[] }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        eyebrow="Educator profiles"
        title="People you can learn from"
        description="Tap an educator's photo to open their full profile, bio and posts. Join their WhatsApp community to learn with them."
      />

      {educators.length === 0 ? (
        <EmptyState
          icon="bi-people"
          title="No educator communities yet"
          description="Verified educators appear here after they add a WhatsApp group link."
        />
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
                      <Avatar src={educator.avatarUrl} name={educator.username} size="2xl" />
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
            <i className={`bi ${isSchool ? 'bi-building' : 'bi-briefcase'}`} />
            {ad.badge}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-[#7b857b]">
            {isSchool ? 'School' : 'Job opportunity'}
          </span>
        </div>

        <h3 className="mt-3 font-heading text-lg font-semibold text-[#0a0a0a]">{ad.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-[#8a6d00]">{ad.subtitle}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4d554d]">
          {ad.description}
        </p>

        {ad.authorUsername && (
          <p className="mt-2 text-xs text-[#7b857b]">
            Posted by{' '}
            <span className="font-medium text-[#4d554d]">@{ad.authorUsername}</span>
          </p>
        )}

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

function AdsPage({
  kind,
  ads,
}: {
  kind: Advertisement['kind']
  ads: Advertisement[]
}) {
  const isSchool = kind === 'school'
  const [posting, setPosting] = useState(false)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          eyebrow={isSchool ? 'Schools & colleges' : 'Classes & revision'}
          title={isSchool ? 'Places to learn' : 'Teaching jobs & opportunities'}
          description={
            isSchool
              ? 'Admissions, scholarships and school adverts posted by the Talma community.'
              : 'Teaching vacancies, lecturer roles and classroom opportunities posted by the Talma community.'
          }
        />
        <button
          type="button"
          onClick={() => setPosting(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] shadow-sm transition-colors hover:bg-[#e9b92b]"
        >
          <i className="bi bi-plus-circle" />
          {isSchool ? 'Advertise a school' : 'Post a job'}
        </button>
      </div>

      {ads.length === 0 ? (
        <EmptyState
          icon={isSchool ? 'bi-building' : 'bi-briefcase'}
          title={isSchool ? 'No school adverts yet' : 'No teaching opportunities yet'}
          description={
            isSchool
              ? 'Be the first to advertise a school or college using the button above.'
              : 'Be the first to post a teaching or lecturer vacancy using the button above.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      <AdvertisementModal open={posting} kind={kind} onClose={() => setPosting(false)} />
    </section>
  )
}

/**
 * Home's page switcher: an overview plus separate pages for educators, schools
 * and teaching adverts.
 */
export default function HomeContent({ section, onNavigate }: HomeContentProps) {
  const { data, isLoading, isError, refetch } = useHomeContent()

  const educators = data?.educators ?? []
  const schoolAds = data?.schoolAds ?? []
  const teachingAds = data?.teachingAds ?? []

  return (
    <div className="space-y-5">
      <SectionNav section={section} onNavigate={onNavigate} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-[#e6e9e6] bg-white"
            />
          ))}
        </div>
      ) : isError ? (
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
      ) : section === 'educators' ? (
        <EducatorsPage educators={educators} />
      ) : section === 'schools' ? (
        <AdsPage kind="school" ads={schoolAds} />
      ) : section === 'classes' ? (
        <AdsPage kind="teaching" ads={teachingAds} />
      ) : (
        <HomeOverview
          educators={educators}
          schoolAds={schoolAds}
          teachingAds={teachingAds}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}
