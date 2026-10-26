import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

interface Campus {
  id: string
  name: string
  coords: [number, number]
  zoom: number
  boundary?: string
}

const CAMPUS_GROUPS: { label: string; items: Campus[] }[] = [
  {
    label: 'OOU',
    items: [
      { id: 'oou-main', name: 'OOU Main Campus', coords: [6.9233, 3.8712], zoom: 16, boundary: 'oou-main' },
      { id: 'oou-sagamu', name: 'OOU Sagamu', coords: [6.832, 3.641], zoom: 15 },
      { id: 'oou-ayetoro', name: 'OOU Ayetoro', coords: [7.246, 3.037], zoom: 15 },
      { id: 'oou-ibogun', name: 'OOU Ibogun', coords: [6.85, 3.18], zoom: 14 },
    ],
  },
  {
    label: 'Others',
    items: [
      { id: 'unilag', name: 'UNILAG Akoka', coords: [6.5158, 3.3898], zoom: 15 },
      { id: 'ui', name: 'UI Ibadan', coords: [7.4419, 3.9013], zoom: 15 },
      { id: 'oau', name: 'OAU Ife', coords: [7.5207, 4.5255], zoom: 15 },
    ],
  },
]

/**
 * Traced OOU main-campus perimeter — shown as a gold outline when
 * OOU Main Campus is selected.
 */
const OOU_MAIN_BOUNDARY: [number, number][] = [
  [6.93573931580142, 3.8674772045757453],
  [6.926153926264766, 3.8664043210317836],
  [6.920786022836477, 3.8677346963188],
  [6.915119836517129, 3.8676917809770415],
  [6.917335195653473, 3.8742578282660873],
  [6.920189585373264, 3.87503030441774],
  [6.921680677618209, 3.8768756641133546],
  [6.929136068161178, 3.874300743607846],
]

interface SchoolSection {
  id: string
  title: string
  desc: string
  icon: string
  bg: string
  iconColor: string
  items: string[]
}

const SECTIONS: SchoolSection[] = [
  {
    id: 'faculties',
    title: 'Faculties',
    desc: 'Confirm the current faculty list on the OOU portal.',
    icon: 'bi-building',
    bg: 'from-[#fdf5d7] to-[#fdeeb8]',
    iconColor: 'text-[#8a6d00]',
    items: [
      'Arts, Education, Law, Science, Social Sciences, Management Sciences',
      'Engineering, Pharmacy, Basic & Clinical Medical Sciences',
      'Environmental Studies, Agricultural Sciences and related schools',
      'Some programmes run at Sagamu / Ayetoro / Ibogun campuses',
    ],
  },
  {
    id: 'departments',
    title: 'Departments & Courses',
    desc: 'Your department board is your real homepage.',
    icon: 'bi-diagram-3',
    bg: 'from-[#edf4dc] to-[#e8f2d4]',
    iconColor: 'text-[#3a8f4d]',
    items: [
      'Each faculty lists its departments and degree options on the portal',
      'Check course outlines, advisers and class reps per department',
      'Cross-faculty electives and prerequisites vary by session',
    ],
  },
  {
    id: 'communities',
    title: 'Student Communities',
    desc: 'Find your people per level, course and interest.',
    icon: 'bi-people',
    bg: 'from-[#eef3ee] to-[#e8ece8]',
    iconColor: 'text-[#0a0a0a]',
    items: [
      'Department and faculty groups for outlines and past questions',
      'Level-based class groups for tests, venues and assignments',
      'Study circles, tech/dev, debate, press and volunteer teams',
    ],
  },
  {
    id: 'news-events',
    title: 'Campus News & Events',
    desc: 'Never miss matric, convocation and faculty weeks.',
    icon: 'bi-calendar-event',
    bg: 'from-[#fdf5d7] to-[#fdeeb8]',
    iconColor: 'text-[#8a6d00]',
    items: [
      'Matriculation, convocation, faculty/departmental weeks',
      'Career fairs, exhibitions, religious and cultural festivals',
      'Follow verified OOU and faculty handles — ignore rumour blogs',
    ],
  },
  {
    id: 'clubs',
    title: 'Clubs & Student Associations',
    desc: 'Build skills and networks outside lectures.',
    icon: 'bi-trophy',
    bg: 'from-[#edf4dc] to-[#e8f2d4]',
    iconColor: 'text-[#3a8f4d]',
    items: [
      'SUG, faculty and departmental associations',
      'JETS, press clubs, drama, choir, sports teams, tech communities',
      'Confirm registration and dues with student affairs before paying',
    ],
  },
  {
    id: 'services',
    title: 'Lost & Found + Marketplace',
    desc: 'Campus services that save time and money.',
    icon: 'bi-bag',
    bg: 'from-[#eef3ee] to-[#e8ece8]',
    iconColor: 'text-[#0a0a0a]',
    items: [
      'Lost & Found: report ID cards, phones and documents at security / student affairs with proof of ownership',
      'Marketplace: verified student vendors for food, thrift, gadgets, printing and hostel essentials',
      'Meet in public places and confirm items before payment',
    ],
  },
]

/** Know Your School hub — campus map plus the social layer of campus life. */
export default function KnowYourSchoolPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [placeSearch, setPlaceSearch] = useState('')
  const [placeStatus, setPlaceStatus] = useState('')
  const [selectedCampusId, setSelectedCampusId] = useState('oou-main')
  const [mapError, setMapError] = useState('')

  const mapEl = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const marker = useRef<L.CircleMarker | null>(null)
  const boundaryLayer = useRef<L.Polygon | null>(null)

  const allCampuses = useMemo(() => CAMPUS_GROUPS.flatMap((group) => group.items), [])

  const activeCampus = useMemo(
    () => allCampuses.find((campus) => campus.id === selectedCampusId) ?? allCampuses[0],
    [allCampuses, selectedCampusId],
  )

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/mycamp')
  }

  const showBoundary = (campus: Campus | undefined) => {
    if (boundaryLayer.current) {
      boundaryLayer.current.remove()
      boundaryLayer.current = null
    }
    if (campus && campus.boundary === 'oou-main' && mapInstance.current) {
      boundaryLayer.current = L.polygon(OOU_MAIN_BOUNDARY, {
        color: '#f5c842',
        weight: 3,
        fillOpacity: 0,
        interactive: false,
      }).addTo(mapInstance.current)
    }
  }

  const flyToCampus = (campus: Campus | undefined) => {
    if (!mapInstance.current || !campus) return
    setSelectedCampusId(campus.id)
    setPlaceStatus('')
    mapInstance.current.flyTo(campus.coords, campus.zoom || 15, { duration: 1.2 })
    marker.current?.setLatLng(campus.coords).setTooltipContent(campus.name)
    showBoundary(campus)
  }

  const selectCampus = (id: string) => {
    flyToCampus(allCampuses.find((campus) => campus.id === id))
  }

  const searchPlace = async () => {
    const q = placeSearch.trim()
    if (!q || !mapInstance.current) return
    setPlaceStatus('Searching…')
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      )
      const data = (await response.json()) as {
        lat?: string
        lon?: string
        display_name?: string
      }[]
      if (!data || !data.length) {
        setPlaceStatus(`No results for "${q}" — try adding the city or state.`)
        return
      }
      const hit = data[0]
      if (!hit) return
      const coords: [number, number] = [Number.parseFloat(hit.lat ?? '0'), Number.parseFloat(hit.lon ?? '0')]
      setSelectedCampusId('')
      setPlaceStatus(`Showing: ${(hit.display_name ?? '').split(',').slice(0, 3).join(',')}`)
      mapInstance.current.flyTo(coords, 15, { duration: 1.2 })
      marker.current?.setLatLng(coords).setTooltipContent((hit.display_name ?? '').split(',')[0] ?? '')
      if (boundaryLayer.current) {
        boundaryLayer.current.remove()
        boundaryLayer.current = null
      }
    } catch {
      setPlaceStatus('Search failed — check your connection and try again.')
    }
  }

  useEffect(() => {
    const element = mapEl.current
    if (!element) return

    try {
      const first = allCampuses[0]
      if (!first) return

      const map = L.map(element, {
        center: first.coords,
        zoom: first.zoom,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: true,
        worldCopyJump: true,
      })
      mapInstance.current = map

      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, attribution: 'Imagery © Esri & contributors' },
      )
      const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors',
      })
      satellite.addTo(map)
      L.control.layers({ Satellite: satellite, Streets: streets }, undefined, {
        position: 'topright',
      }).addTo(map)

      marker.current = L.circleMarker(first.coords, {
        radius: 8,
        color: '#f5c842',
        weight: 3,
        fillColor: '#0a0a0a',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(first.name)
      showBoundary(first)
    } catch (error) {
      setMapError(error instanceof Error ? error.message : 'Map failed to load.')
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      marker.current = null
      boundaryLayer.current = null
    }
  }, [allCampuses])

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.toLowerCase().includes(q) || section.title.toLowerCase().includes(q),
      ),
    })).filter((section) => section.items.length > 0)
  }, [query])

  return (
    <div className="min-h-screen bg-[#f7f9f7]">
      <div className="bg-[#0a0a0a] text-white sticky top-0 z-40 shadow-sm">
        <div className="px-4 lg:px-12 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            title="Back"
          >
            <i className="bi bi-arrow-left text-lg" />
          </button>
          <div className="min-w-0">
            <p className="text-[#f5c842] text-[11px] font-semibold uppercase tracking-wide">
              Discover · Hub
            </p>
            <h1 className="font-heading text-xl lg:text-2xl font-semibold truncate">
              Know Your School — OOU
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#f5c842]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="font-heading text-2xl lg:text-4xl font-semibold mb-2">
              Olabisi Onabanjo University at a glance
            </h2>
            <p className="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
              Faculties, departments, communities, events, clubs, lost &amp; found and marketplace —
              the social layer of campus. Main campus: Ago-Iwoye, Ogun State.
            </p>
            <div className="relative mt-4 max-w-xl">
              <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Search faculties, clubs, events, marketplace..."
                className="w-full pl-11 pr-10 py-3 bg-white/10 border border-white/15 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <i className="bi bi-x-circle" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campus map: worldwide satellite + streets, campus picker on top */}
        <div className="bg-white border border-[#e6e9e6] rounded-2xl overflow-hidden shadow-sm mb-4 lg:mb-6">
          <div className="p-5 lg:p-8 border-b border-[#e6e9e6] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#edf4dc] to-[#e8f2d4] flex items-center justify-center flex-shrink-0">
              <i className="bi bi-geo-alt text-2xl text-[#3a8f4d]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg lg:text-xl text-[#0a0a0a]">
                School map — pick your campus
              </h3>
              <p className="text-sm text-[#7b857b] mt-1">
                Showing: <span className="font-medium text-[#0a0a0a]">{activeCampus?.name}</span>
              </p>
            </div>
          </div>

          <div className="px-5 lg:px-8 py-4 border-b border-[#e6e9e6] bg-[#f7f9f7]/50 space-y-3">
            <div className="relative max-w-xl">
              <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857b]" />
              <input
                value={placeSearch}
                onChange={(event) => setPlaceSearch(event.target.value)}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') void searchPlace()
                }}
                type="text"
                placeholder="Search any university or campus…"
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#e6e9e6] rounded-full text-sm text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
              />
              {placeSearch && (
                <button
                  type="button"
                  onClick={() => setPlaceSearch('')}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b857b] hover:text-[#0a0a0a]"
                >
                  <i className="bi bi-x-circle" />
                </button>
              )}
            </div>
            {placeStatus && <p className="text-xs text-[#7b857b]">{placeStatus}</p>}
            {CAMPUS_GROUPS.map((group) => (
              <div key={group.label} className="flex items-start gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7b857b] w-24 flex-shrink-0 pt-2">
                  {group.label}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                  {group.items.map((campus) => (
                    <button
                      key={campus.id}
                      type="button"
                      onClick={() => selectCampus(campus.id)}
                      className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
                        selectedCampusId === campus.id
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
                      }`}
                    >
                      {campus.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-72 lg:h-96 bg-[#0a0a0a] relative">
            <div ref={mapEl} className="w-full h-full z-0" />
            {mapError && (
              <div className="absolute inset-0 bg-[#0a0a0a]/95 text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                  <i className="bi bi-map text-4xl text-[#8a6d00]" />
                  <h4 className="font-semibold text-lg mt-3">Map failed to load</h4>
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">{mapError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredSections.length === 0 && (
          <div className="bg-white border border-[#e6e9e6] rounded-2xl p-10 text-center">
            <p className="text-[#7b857b]">Nothing matches "{query}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {filteredSections.map((section) => (
            <section
              key={section.id}
              className="bg-white border border-[#e6e9e6] rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-5 lg:p-6 border-b border-[#e6e9e6] flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${section.bg}`}
                >
                  <i className={`text-xl ${section.icon} ${section.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[17px] text-[#0a0a0a]">{section.title}</h3>
                  <p className="text-[13px] text-[#7b857b] mt-0.5">{section.desc}</p>
                </div>
              </div>
              <ul className="p-5 lg:p-6 space-y-2.5">
                {section.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2.5 text-sm text-[#4d554d] leading-relaxed"
                  >
                    <i className="bi bi-dot text-[#8a6d00] text-lg leading-none mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
