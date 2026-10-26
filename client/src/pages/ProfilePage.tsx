import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ProfileMenu from '../components/profile/ProfileMenu'
import ProfileScreen from '../components/profile/ProfileScreen'
import EditProfileModal from '../components/profile/EditProfileModal'

/** The signed-in user's Twitter-style profile screen (`/myprofile`). */
export default function ProfilePage() {
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

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

            <div className="flex items-center space-x-3">
              {user?.username && (
                <Link
                  to={`/u/${encodeURIComponent(user.username)}`}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:border-[#f5c842]/50 hover:text-white"
                >
                  <i className="bi bi-box-arrow-up-right" />
                  Public view
                </Link>
              )}
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-2xl border-x border-[#e6e9e6] bg-white lg:min-h-[calc(100vh-80px)]">
        <ProfileScreen
          username={user?.username}
          isOwnProfile
          onEdit={() => setEditOpen(true)}
        />
      </main>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}
