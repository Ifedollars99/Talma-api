import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DiscoverHub } from '../../types'

/** Single source of truth for the Discover hubs — edit titles/descriptions here. */
const DISCOVER_HUBS: DiscoverHub[] = [
  {
    id: 'campus-news',
    title: 'Campus News & Announcements',
    desc: 'Official updates, events, deadlines and school-wide notices.',
    icon: 'bi-megaphone',
    bg: 'from-[#fdf5d7] to-[#fdeeb8]',
    iconColor: 'text-[#8a6d00]',
    keywords: 'news announcement update event notice campus',
    route: '/hubs/campus-news',
  },
  {
    id: 'aspirant',
    title: 'Aspirant / Admission Hub',
    desc: 'JAMB, Post-UTME, admission lists, cut-off marks and guidance.',
    icon: 'bi-mortarboard',
    bg: 'from-[#e6f6ea] to-[#dcfce7]',
    iconColor: 'text-[#15803d]',
    keywords: 'aspirant admission jamb post-utme cutoff jambite',
    route: '/hubs/aspirant',
  },
  {
    id: 'siwes',
    title: 'SIWES / IT Hub',
    desc: 'Placements, logbook tips, defence prep and SIWES opportunities.',
    icon: 'bi-briefcase',
    bg: 'from-[#eef3ee] to-[#e8ece8]',
    iconColor: 'text-[#0a0a0a]',
    keywords: 'siwes it internship placement logbook industrial training',
    route: '/hubs/siwes',
  },
  {
    id: 'academic',
    title: 'Academic Hub',
    desc: 'Past questions, tutorials, study groups and course materials.',
    icon: 'bi-book',
    bg: 'from-[#fdf5d7] to-[#fdeeb8]',
    iconColor: 'text-[#8a6d00]',
    keywords: 'academic study tutorial past question material course exam',
    route: '/hubs/academic',
  },
  {
    id: 'final-year',
    title: 'Final Year Students Hub',
    desc: 'Projects, supervisors, defence tips and graduation checklist.',
    icon: 'bi-award',
    bg: 'from-[#e6f6ea] to-[#dcfce7]',
    iconColor: 'text-[#15803d]',
    keywords: 'final year project thesis defence supervisor graduation',
    route: '/hubs/final-year',
  },
  {
    id: 'know-your-school',
    title: 'Know Your School',
    desc: 'Faculties, map, clubs, events, lost & found and marketplace.',
    icon: 'bi-geo-alt',
    bg: 'from-[#eef3ee] to-[#e8ece8]',
    iconColor: 'text-[#0a0a0a]',
    keywords: 'map school faculties departments clubs events marketplace lost found community',
    route: '/hubs/know-your-school',
  },
]

interface DiscoverPanelProps {
  search: string
  onSearchChange: (value: string) => void
  variant: 'mobile' | 'desktop'
}

/**
 * Discover hub browser — a direct port of the original `HubsPage.vue`, which
 * was rendered in both a compact mobile layout and a spacious desktop grid.
 */
export default function DiscoverPanel({ search, onSearchChange, variant }: DiscoverPanelProps) {
  const navigate = useNavigate()

  const filteredHubs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return DISCOVER_HUBS
    return DISCOVER_HUBS.filter(
      (hub) =>
        hub.title.toLowerCase().includes(query) ||
        hub.desc.toLowerCase().includes(query) ||
        hub.keywords.includes(query),
    )
  }, [search])

  if (variant === 'mobile') {
    return (
      <div className="bg-white px-4 pt-4 pb-4 border-b border-[#e6e9e6]">
        <h3 className="font-semibold text-[17px] text-[#0a0a0a] mb-1">Discover</h3>
        <p className="text-xs text-[#7b857b] mb-3">Search contents, hubs, courses and people</p>
        <div className="relative mb-4">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7b857b]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            type="text"
            placeholder="Search contents, hubs, courses..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#f7f9f7] border border-[#e6e9e6] rounded-full text-sm text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b857b]"
            >
              <i className="bi bi-x-circle" />
            </button>
          )}
        </div>
        {filteredHubs.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-[#7b857b]">No hubs match "{search}"</p>
          </div>
        )}
        <div className="space-y-3">
          {filteredHubs.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => navigate(hub.route)}
              className="w-full text-left bg-[#f7f9f7] border border-[#e6e9e6] rounded-2xl p-4 flex items-start gap-3 active:bg-[#eef1ee]"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${hub.bg}`}
              >
                <i className={`text-xl ${hub.icon} ${hub.iconColor}`} />
              </div>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[15px] text-[#0a0a0a] leading-snug">
                  {hub.title}
                </span>
                <span className="block text-xs text-[#7b857b] mt-1 leading-relaxed">{hub.desc}</span>
              </span>
              <i className="bi bi-chevron-right text-[#7b857b] mt-1" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 border-b border-[#e6e9e6] bg-[#f7f9f7]/50">
      <h3 className="font-semibold text-lg text-[#0a0a0a]">Discover</h3>
      <p className="text-sm text-[#7b857b] mt-1 mb-4">Search contents, hubs, courses and people</p>
      <div className="relative max-w-xl mb-5">
        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857b]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          type="text"
          placeholder="Search contents, hubs, courses..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#e6e9e6] rounded-full text-[15px] text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b857b] hover:text-[#0a0a0a]"
          >
            <i className="bi bi-x-circle" />
          </button>
        )}
      </div>
      {filteredHubs.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-[#7b857b]">No hubs match "{search}"</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredHubs.map((hub) => (
          <button
            key={hub.id}
            type="button"
            onClick={() => navigate(hub.route)}
            className="text-left bg-white border border-[#e6e9e6] rounded-2xl p-5 hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${hub.bg}`}
            >
              <i className={`text-2xl ${hub.icon} ${hub.iconColor}`} />
            </div>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-[15px] text-[#0a0a0a] leading-snug">
                {hub.title}
              </span>
              <span className="block text-[13px] text-[#7b857b] mt-1 leading-relaxed">{hub.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
