import { useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useEnrollments } from '../hooks/useCourses'
import { useMessages } from '../hooks/useMessages'
import { useNotifications } from '../hooks/useNotifications'
import ProfileMenu from '../components/profile/ProfileMenu'
import DashboardFeed from '../components/dashboard/DashboardFeed'
import ClassroomView from '../components/courses/CoursesView'
import MessagesView from '../components/messages/MessagesView'
import StudyAssistantView from '../components/assistant/StudyAssistantView'
import SettingsView from '../components/settings/SettingsView'

type Tab = 'dashboard' | 'classroom' | 'messages' | 'assistant' | 'settings'

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { id: 'classroom', label: 'Classroom', icon: 'bi-easel2' },
  { id: 'messages', label: 'Messages', icon: 'bi-chat-dots' },
  { id: 'assistant', label: 'Study Assistant', icon: 'bi-stars' },
  { id: 'settings', label: 'Settings', icon: 'bi-gear' },
]

const MOBILE_NAV_ITEMS: { id: Tab; label: string; icon: string; activeIcon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: 'bi-house-door', activeIcon: 'bi-house-door-fill' },
  { id: 'classroom', label: 'Classroom', icon: 'bi-easel2', activeIcon: 'bi-easel2-fill' },
  { id: 'messages', label: 'Messages', icon: 'bi-chat-dots', activeIcon: 'bi-chat-dots-fill' },
  { id: 'assistant', label: 'Assistant', icon: 'bi-stars', activeIcon: 'bi-stars' },
  { id: 'settings', label: 'Settings', icon: 'bi-gear', activeIcon: 'bi-gear-fill' },
]

/**
 * The signed-in application shell — a direct port of the original
 * `MycampPage.vue`: desktop sidebar, mobile bottom navigation and the five
 * dashboard tabs.
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const { data: enrollmentsData } = useEnrollments()
  const { data: messagesData } = useMessages()
  const { data: notificationsData } = useNotifications()

  const courses = useMemo(() => enrollmentsData?.enrollments ?? [], [enrollmentsData])
  const messages = useMemo(() => messagesData?.messages ?? [], [messagesData])
  const unreadMessages = useMemo(() => messages.filter((message) => message.unread).length, [messages])
  const notifications = notificationsData?.unread ?? 0

  const username = user?.username ?? 'Student'
  const userRole = user?.role === 'lecturer' ? 'Lecturer' : 'Student'

  return (
    <div className="talma-app min-h-screen bg-[#f7f9f7]">
      {/* Desktop Header */}
      <header className="bg-[#0a0a0a] shadow-sm border-b border-[#000000] sticky top-0 z-50">
        <div className="px-4 lg:px-12">
          <div className="flex justify-between items-center py-3 lg:py-5">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#f5c842] rounded-xl flex items-center justify-center">
                <i className="bi bi-mortarboard-fill text-[#0a0a0a] text-lg lg:text-xl" />
              </div>
              <div>
                <h1 className="font-heading text-lg lg:text-2xl font-semibold text-white tracking-tight">
                  Talma
                </h1>
                <p className="hidden sm:block text-sm text-white/55">
                  {userRole === 'Student'
                    ? 'You signed up as a Student'
                    : 'You signed up as a Lecturer'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-5">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  aria-label="Notifications"
                  className="p-2 text-white/70 hover:text-white relative transition-colors"
                >
                  <i className="bi bi-bell text-xl" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#8a6d00] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {notifications}
                    </span>
                  )}
                </button>
              </div>

              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - Desktop only, mobile uses bottom nav */}
          <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
            <nav className="bg-white rounded-xl border border-[#e6e9e6] p-3 lg:sticky lg:top-28">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 pl-3 pr-4 py-3 rounded-lg transition-colors text-base border-l-4 ${
                        activeTab === item.id
                          ? 'bg-[#fdf5d7] text-[#0a0a0a] border-[#f5c842] font-medium'
                          : 'text-[#4d554d] hover:bg-[#f7f9f7] border-transparent'
                      }`}
                    >
                      <i className={`bi ${item.icon} text-lg`} />
                      <span>{item.label}</span>
                      {item.id === 'messages' && unreadMessages > 0 && (
                        <span className="ml-auto bg-[#f5c842] text-[#0a0a0a] text-xs px-2 py-0.5 rounded-full font-semibold">
                          {unreadMessages}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <DashboardFeed
                  courses={courses}
                  messages={messages}
                  notifications={notifications}
                  username={username}
                />
              </div>
            )}

            {activeTab === 'classroom' && <ClassroomView />}

            {activeTab === 'messages' && <MessagesView messages={messages} />}

            {activeTab === 'assistant' && <StudyAssistantView />}

            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav - X / Twitter style */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#e6e9e6] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[62px]">
          {MOBILE_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === item.id ? 'text-[#0a0a0a]' : 'text-[#7b857b]'
              }`}
            >
              {item.id === 'messages' ? (
                <span className="relative">
                  <i
                    className={`text-[22px] leading-none ${
                      activeTab === item.id ? `bi ${item.activeIcon}` : `bi ${item.icon}`
                    }`}
                  />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#f5c842] text-[#0a0a0a] text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </span>
              ) : (
                <i
                  className={`text-[22px] leading-none ${
                    activeTab === item.id ? `bi ${item.activeIcon}` : `bi ${item.icon}`
                  }`}
                />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

