import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

/**
 * Shared chrome for the public Privacy Policy and Terms of Service pages.
 * These routes are intentionally unauthenticated: Google's OAuth review team
 * (and anyone else) must be able to open them without signing in.
 */
export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#0a0a0a]">
      <header className="border-b border-[#e6e9e6] bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3a8f4d] text-white">
              <i className="bi bi-book-fill" />
            </span>
            <span className="font-heading text-xl font-semibold">Talma</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold text-[#4d554d]">
            <Link to="/privacy" className="hover:text-[#3a8f4d]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#3a8f4d]">
              Terms
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-[#e6e9e6] px-3 py-1.5 hover:bg-[#f7f9f7]"
            >
              Back to Talma
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6d00]">
          Legal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[#7b857b]">Last updated: {lastUpdated}</p>

        <div className="mt-8 space-y-8 rounded-2xl border border-[#e6e9e6] bg-white p-6 shadow-sm sm:p-10">
          {children}
        </div>
      </main>

      <footer className="border-t border-[#e6e9e6] bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-[#7b857b]">
          <p>© 2026 Talma. All rights reserved.</p>
          <p>
            Questions?{' '}
            <a href="mailto:taofeeqifedollar@gmail.com" className="font-semibold text-[#2f6b3d] underline">
              taofeeqifedollar@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-[#0a0a0a]">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-7 text-[#4d554d]">{children}</div>
    </section>
  )
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>
}
