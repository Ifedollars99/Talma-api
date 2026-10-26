import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ProfileMenu from '../components/profile/ProfileMenu'
import ProfileScreen from '../components/profile/ProfileScreen'

/** Public Twitter-style profile page (`/u/:username`). */
export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, isAuthenticated } = useAuth()

  const isOwnProfile =
    Boolean(user?.username) &&
    Boolean(username) &&
    user!.username.toLowerCase() === username!.toLowerCase()

  return (
    <div className="talma-app min-h-screen bg-[#f7f9f7]">
      <header className="bg-[#0a0a0a] shadow-sm border-b border-[#000000] sticky top-0 z-50">
        <div className="px-4 lg:px-12">
          <div className="flex justify-between items-center py-3 lg:py-5">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Link
                to={isAuthenticated ? '/mycamp' : '/'}
                className="w-10 h-10 lg:w-12 lg:h-12 bg-[#f5c842] rounded-xl flex items-center justify-center"
                aria-label="Back"
              >
                <i className="bi bi-mortarboard-fill text-[#0a0a0a] text-lg lg:text-xl" />
              </Link>
              <div>
                <h1 className="font-heading text-lg lg:text-2xl font-semibold text-white tracking-tight">
                  Talma
                </h1>
                <p className="hidden sm:block text-sm text-white/55">
                  {isOwnProfile ? 'Your public profile' : 'Profile'}
                </p>
              </div>
            </div>
            {isAuthenticated && <ProfileMenu />}
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-2xl border-x border-[#e6e9e6] bg-white lg:min-h-[calc(100vh-80px)]">
        <ProfileScreen username={username} isOwnProfile={isOwnProfile} />
      </main>
    </div>
  )
}
