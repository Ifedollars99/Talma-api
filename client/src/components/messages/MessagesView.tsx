import { useMemo, useState } from 'react'
import {
  useCommunities,
  useCreateCommunity,
  useJoinCommunity,
  useLeaveCommunity,
  useMyCommunities,
} from '../../hooks/useCommunities'
import { useMarkMessageRead } from '../../hooks/useMessages'
import { ApiError } from '../../lib/apiClient'
import type { Message } from '../../types'
import Modal from '../ui/Modal'

const COMMUNITY_CATEGORIES = [
  'All',
  'Department',
  'Study Group',
  'Academic',
  'Admission',
  'Career',
  'Campus Life',
]

const CREATABLE_CATEGORIES = COMMUNITY_CATEGORIES.filter((category) => category !== 'All')

type Pane = 'chats' | 'mine' | 'explore'

interface MessagesViewProps {
  messages: Message[]
}

/**
 * Messages & Communities — a direct port of the original `MessageCom.vue`.
 */
export default function MessagesView({ messages }: MessagesViewProps) {
  const [activePane, setActivePane] = useState<Pane>('chats')
  const [chatQuery, setChatQuery] = useState('')
  const [exploreQuery, setExploreQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [communityForm, setCommunityForm] = useState({
    name: '',
    desc: '',
    category: 'Study Group',
    school: '',
  })

  const { data: communitiesData } = useCommunities(activeCategory, exploreQuery)
  const { data: myCommunitiesData } = useMyCommunities()
  const createCommunity = useCreateCommunity()
  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()
  const markRead = useMarkMessageRead()

  const communities = useMemo(() => communitiesData?.communities ?? [], [communitiesData])
  const joinedCommunities = useMemo(
    () => myCommunitiesData?.communities ?? [],
    [myCommunitiesData],
  )

  const unreadCount = messages.filter((message) => message.unread).length

  const filteredMessages = useMemo(() => {
    const query = chatQuery.trim().toLowerCase()
    if (!query) return messages
    return messages.filter(
      (message) =>
        message.sender.toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.preview.toLowerCase().includes(query),
    )
  }, [messages, chatQuery])

  const tabs: { id: Pane; label: string; count: number | null }[] = [
    { id: 'chats', label: 'Chats', count: unreadCount || null },
    { id: 'mine', label: 'My Communities', count: joinedCommunities.length },
    { id: 'explore', label: 'Explore', count: null },
  ]

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCommunityForm({ name: '', desc: '', category: 'Study Group', school: '' })
  }

  const submitCommunity = async () => {
    if (!communityForm.name.trim()) return
    try {
      await createCommunity.mutateAsync({
        name: communityForm.name.trim(),
        desc: communityForm.desc.trim(),
        category: communityForm.category,
        school: communityForm.school.trim(),
      })
      closeCreateModal()
      setActivePane('mine')
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
        <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a]">
          Messages &amp; Communities
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="bg-[#f5c842] text-[#0a0a0a] px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium"
        >
          <i className="bi bi-plus-circle text-lg" />
          <span className="text-base">Create Community</span>
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePane(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activePane === tab.id
                ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activePane === tab.id
                    ? 'bg-[#f5c842] text-[#0a0a0a]'
                    : 'bg-[#f7f9f7] text-[#7b857b]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chats pane */}
      {activePane === 'chats' && (
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857b]" />
            <input
              value={chatQuery}
              onChange={(event) => setChatQuery(event.target.value)}
              type="text"
              placeholder="Search messages…"
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#e6e9e6] rounded-xl text-[15px] text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
            />
            {chatQuery && (
              <button
                type="button"
                onClick={() => setChatQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b857b] hover:text-[#0a0a0a]"
              >
                <i className="bi bi-x-circle" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e6e9e6]">
            {filteredMessages.length === 0 ? (
              <div className="p-10 text-center text-[#7b857b]">
                <p>No messages match "{chatQuery}"</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  onClick={() => markRead.mutate(message.id)}
                  className={`p-5 hover:bg-[#f7f9f7] cursor-pointer transition-colors ${
                    index !== filteredMessages.length - 1 ? 'border-b border-[#e6e9e6]' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#eef3ee] rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="bi bi-person text-[#0a0a0a] text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-base ${
                            message.unread
                              ? 'font-semibold text-[#0a0a0a]'
                              : 'font-medium text-[#4d554d]'
                          }`}
                        >
                          {message.sender}
                        </h4>
                        <span className="text-sm text-[#7b857b]">{message.time}</span>
                      </div>
                      <h5
                        className={`text-base mb-1 ${
                          message.unread ? 'font-medium text-[#0a0a0a]' : 'text-[#4d554d]'
                        }`}
                      >
                        {message.subject}
                      </h5>
                      <p className="text-base text-[#7b857b] truncate">{message.preview}</p>
                    </div>
                    {message.unread && (
                      <div className="w-2.5 h-2.5 bg-[#f5c842] rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My communities pane */}
      {activePane === 'mine' && (
        <div className="space-y-4">
          {joinedCommunities.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e6e9e6] p-10 text-center">
              <p className="text-[#7b857b]">You haven't joined any community yet.</p>
              <button
                type="button"
                onClick={() => setActivePane('explore')}
                className="mt-3 text-[#8a6d00] font-medium hover:underline"
              >
                Explore communities →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {joinedCommunities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl border border-[#e6e9e6] p-5 flex gap-4 hover:shadow-sm transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${community.bg}`}
                  >
                    <i className={`text-2xl ${community.icon} ${community.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-[#0a0a0a] leading-snug">
                      {community.name}
                    </p>
                    <p className="text-xs text-[#7b857b] mt-0.5">
                      {community.members} members · Active {community.lastActive}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        Open chat
                      </button>
                      <button
                        type="button"
                        onClick={() => leaveCommunity.mutate(community.id)}
                        className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#e6e9e6] text-[#7b857b] hover:text-[#8a6d00] hover:border-[#8a6d00] transition-colors"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explore pane */}
      {activePane === 'explore' && (
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857b]" />
            <input
              value={exploreQuery}
              onChange={(event) => setExploreQuery(event.target.value)}
              type="text"
              placeholder="Search communities…"
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#e6e9e6] rounded-xl text-[15px] text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
            />
            {exploreQuery && (
              <button
                type="button"
                onClick={() => setExploreQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b857b] hover:text-[#0a0a0a]"
              >
                <i className="bi bi-x-circle" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {COMMUNITY_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  activeCategory === category
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {communities.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e6e9e6] p-10 text-center">
              <p className="text-[#7b857b]">No communities match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl border border-[#e6e9e6] p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${community.bg}`}
                    >
                      <i className={`text-2xl ${community.icon} ${community.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[15px] text-[#0a0a0a] leading-snug">
                          {community.name}
                        </p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f7f9f7] border border-[#e6e9e6] text-[#4d554d]">
                          {community.category}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#7b857b] mt-1 leading-relaxed">
                        {community.desc}
                      </p>
                      <p className="text-xs text-[#7b857b] mt-1.5">
                        {community.school} · {community.members} members
                      </p>
                      {!community.joined ? (
                        <button
                          type="button"
                          onClick={() => joinCommunity.mutate(community.id)}
                          className="mt-3 text-xs font-semibold px-4 py-2 rounded-full bg-[#f5c842] text-[#0a0a0a] hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors"
                        >
                          Join community
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => leaveCommunity.mutate(community.id)}
                          className="mt-3 text-xs font-medium px-4 py-2 rounded-full border border-[#15803d] text-[#15803d]"
                        >
                          <i className="bi bi-check-circle mr-1" />
                          Joined — leave?
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      <Modal
        open={showCreateModal}
        onClose={closeCreateModal}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
      >
        <h2 className="font-heading text-2xl font-semibold text-[#0a0a0a] mb-6">Create Community</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="community-name" className="block text-sm font-medium text-[#4d554d] mb-1">
              Community Name
            </label>
            <input
              id="community-name"
              value={communityForm.name}
              onChange={(event) =>
                setCommunityForm((form) => ({ ...form, name: event.target.value }))
              }
              type="text"
              placeholder="e.g. OOU CSC 200L Class"
              className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="community-desc" className="block text-sm font-medium text-[#4d554d] mb-1">
              Description
            </label>
            <textarea
              id="community-desc"
              value={communityForm.desc}
              onChange={(event) =>
                setCommunityForm((form) => ({ ...form, desc: event.target.value }))
              }
              rows={3}
              placeholder="What is this community about?"
              className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="community-category" className="block text-sm font-medium text-[#4d554d] mb-1">
                Category
              </label>
              <select
                id="community-category"
                value={communityForm.category}
                onChange={(event) =>
                  setCommunityForm((form) => ({ ...form, category: event.target.value }))
                }
                className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors bg-white"
              >
                {CREATABLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="community-school" className="block text-sm font-medium text-[#4d554d] mb-1">
                School
              </label>
              <input
                id="community-school"
                value={communityForm.school}
                onChange={(event) =>
                  setCommunityForm((form) => ({ ...form, school: event.target.value }))
                }
                type="text"
                placeholder="e.g. OOU"
                className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            type="button"
            onClick={closeCreateModal}
            className="flex-1 px-4 py-2.5 border border-[#e6e9e6] text-[#0a0a0a] rounded-lg hover:bg-[#f7f9f7] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submitCommunity()}
            disabled={!communityForm.name.trim() || createCommunity.isPending}
            className="flex-1 px-4 py-2.5 bg-[#f5c842] text-[#0a0a0a] rounded-lg hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </Modal>
    </div>
  )
}
