import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ProfileMenu from '../components/profile/ProfileMenu'

/** Standalone profile screen (the `/myprofile` route). */
export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="talma-app min-h-screen bg-[#f7f9f7]">
      <header className="bg-[#0a0a0a] shadow-sm border-b border-[#000000] sticky top-0 z-50">
        <div className="px-4 lg:px-12">
          <div className="flex justify-between items-center py-3 lg:py-5">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Link
                to="/mycamp"
                className="w-10 h-10 lg:w-12 lg:h-12 bg-[#f5c842] rounded-xl flex items-center justify-center"
                aria-label="Back to dashboard"
              >
                <i className="bi bi-mortarboard-fill text-[#0a0a0a] text-lg lg:text-xl" />
              </Link>
              <div>
                <h1 className="font-heading text-lg lg:text-2xl font-semibold text-white tracking-tight">
                  Talma
                </h1>
                <p className="hidden sm:block text-sm text-white/55">Your profile</p>
              </div>
            </div>

            <div className="flex items-center space-x-5">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-12 py-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#e6e9e6] shadow-sm p-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-[#f5c842] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#0a0a0a] text-3xl font-semibold">
                {(user?.username ?? 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-semibold text-[#0a0a0a]">
                {user?.username ?? 'Student'}
              </h2>
              <p className="text-[#7b857b]">{user?.email}</p>
              <span className="inline-block mt-2 text-[11px] px-2 py-0.5 bg-[#f7f9f7] border border-[#e6e9e6] rounded-full text-[#4d554d] font-medium capitalize">
                {user?.role ?? 'student'}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-[#e6e9e6]">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#7b857b]">Region</dt>
              <dd className="text-[#0a0a0a] mt-1">{user?.region}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#7b857b]">Language</dt>
              <dd className="text-[#0a0a0a] mt-1">{user?.language}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#7b857b]">
                Timezone
              </dt>
              <dd className="text-[#0a0a0a] mt-1">{user?.timezone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#7b857b]">
                Member since
              </dt>
              <dd className="text-[#0a0a0a] mt-1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-8 pt-6 border-t border-[#e6e9e6] flex gap-3">
            <Link
              to="/mycamp"
              className="px-5 py-2.5 bg-[#0a0a0a] text-white rounded-xl text-sm font-medium hover:bg-[#1a1a1a]"
            >
              Back to dashboard
            </Link>
            <Link
              to="/hubs/academic"
              className="px-5 py-2.5 border border-[#e6e9e6] text-[#0a0a0a] rounded-xl text-sm font-medium hover:bg-[#f7f9f7]"
            >
              Browse the Academic Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
