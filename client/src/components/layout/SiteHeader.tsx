import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/landing.css'

/**
 * Landing page navigation bar — Green, Gold, Black & White edition.
 */
export function SiteHeader() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobile = () => setIsMobileOpen((open) => !open)
  const closeMobile = () => setIsMobileOpen(false)

  const navLinkClass =
    'block text-gray-900 hover:text-[#15803d] hover:bg-[#15803d]/10 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200'

  return (
    <nav className="site-header">
      <div className="site-header__inner">
        <div className="site-header__bar">
          <Link to="/" className="brand" onClick={closeMobile}>
            <span className="brand__mark">
              <i className="bi bi-book-fill" />
            </span>
            <span className="brand__name">Talma</span>
          </Link>

          <div className="site-header__nav">
            <a href="#how" className="nav-link">
              How It Works
            </a>
            <a href="#audience" className="nav-link">
              Who It&rsquo;s For
            </a>
            <a href="#moments" className="nav-link">
              Campus Moments
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>
          </div>

          <div className="site-header__cta">
            <Link to="/signup" className="btn btn--green btn--sm">
              Get Started
            </Link>
          </div>

          <div className="site-header__burger lg:hidden">
            <button
              type="button"
              onClick={toggleMobile}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileOpen}
              className="text-gray-900 hover:text-[#15803d] p-2 rounded-xl transition-all duration-200 hover:bg-[#15803d]/10"
            >
              <i className={`bi ${isMobileOpen ? 'bi-x-lg' : 'bi-list'} text-2xl`} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`site-header__mobile lg:hidden transition-all duration-300 ease-out ${
          isMobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2 border-t border-[#15803d]/15 bg-white/95 backdrop-blur-md">
          <a
            href="#how"
            onClick={toggleMobile}
            className={`${navLinkClass} flex items-center`}
          >
            <i className="bi bi-gear mr-3" />
            How It Works
          </a>

          <a
            href="#audience"
            onClick={toggleMobile}
            className={`${navLinkClass} flex items-center`}
          >
            <i className="bi bi-people mr-3" />
            Who It&rsquo;s For
          </a>

          <a
            href="#moments"
            onClick={toggleMobile}
            className={`${navLinkClass} flex items-center`}
          >
            <i className="bi bi-camera mr-3" />
            Campus Moments
          </a>

          <a
            href="#contact"
            onClick={toggleMobile}
            className={`${navLinkClass} flex items-center`}
          >
            <i className="bi bi-envelope mr-3" />
            Contact Us
          </a>

          <Link
            to="/signup"
            onClick={toggleMobile}
            className="w-full mt-4 bg-[#15803d] hover:bg-[#22c55e] text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <i className="bi bi-arrow-right" />
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default SiteHeader
