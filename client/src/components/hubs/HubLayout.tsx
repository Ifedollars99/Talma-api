import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HubCategory } from '../../data/hubs/shared'

interface HubLayoutProps {
  title: string
  heroTitle: string
  heroDescription: string
  searchPlaceholder: string
  emptyMessage: string
  categories: HubCategory[]
  /** Optional content rendered between the hero and the category sections. */
  children?: ReactNode
  /** Optional content rendered after the category sections. */
  after?: ReactNode
}

/**
 * Shared shell for the Discover hub pages. The five content hubs
 * (Campus News, Aspirant, SIWES, Academic and Final Year) used identical
 * markup in the original Vue application, so they now share this component.
 */
export default function HubLayout({
  title,
  heroTitle,
  heroDescription,
  searchPlaceholder,
  emptyMessage,
  categories,
  children,
  after,
}: HubLayoutProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/mycamp')
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            category.title.toLowerCase().includes(q),
        ),
      }))
      .filter((category) => category.items.length > 0)
  }, [categories, query])

  return (
    <div className="talma-app hub-shell min-h-screen bg-[#f7f9f7]">
      <div className="hub-topbar bg-[#0a0a0a] text-white sticky top-0 z-40 shadow-sm">
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
            <h1 className="font-heading text-xl lg:text-2xl font-semibold truncate">{title}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
        <div className="hub-hero bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1f1f1f] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#f5c842]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="font-heading text-2xl lg:text-4xl font-semibold mb-2">{heroTitle}</h2>
            <p className="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
              {heroDescription}
            </p>
            <div className="relative mt-4 max-w-xl">
              <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder={searchPlaceholder}
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
            <div className="flex gap-2 overflow-x-auto mt-4 pb-1 -mx-1 px-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => scrollTo(category.id)}
                  className="flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full bg-white/10 hover:bg-[#f5c842] hover:text-[#0a0a0a] border border-white/10 transition-colors"
                >
                  {category.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {children}

        {filteredCategories.length === 0 && (
          <div className="bg-white border border-[#e6e9e6] rounded-2xl p-10 text-center">
            <p className="text-[#7b857b]">{emptyMessage}</p>
          </div>
        )}

        {filteredCategories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="hub-panel bg-white border border-[#e6e9e6] rounded-2xl overflow-hidden shadow-sm mb-4 lg:mb-6 scroll-mt-24"
          >
            <div className="p-5 lg:p-8 border-b border-[#e6e9e6] flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${category.bg}`}
              >
                <i className={`text-2xl ${category.icon} ${category.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg lg:text-xl text-[#0a0a0a]">
                  {category.title}
                </h3>
                <p className="text-sm text-[#7b857b] mt-1 leading-relaxed">{category.desc}</p>
              </div>
            </div>

            <div className="divide-y divide-[#e6e9e6]">
              {category.items.map((item, index) => (
                <div key={`${category.id}-${index}`} className="p-5 lg:px-8 flex gap-3">
                  <i className="bi bi-check-circle-fill text-[#15803d] mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[15px] text-[#0a0a0a]">{item.title}</p>
                      {item.tag && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f7f9f7] border border-[#e6e9e6] text-[#4d554d]">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#4d554d] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {category.source && (
              <div className="px-5 lg:px-8 py-4 bg-[#f7f9f7]/60 border-t border-[#e6e9e6]">
                <p className="text-xs text-[#7b857b]">
                  <i className="bi bi-link-45deg mr-1" />
                  Verify via: {category.source}
                </p>
              </div>
            )}
          </section>
        ))}

        {after}
      </div>
    </div>
  )
}
