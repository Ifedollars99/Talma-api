import { useMemo, useState } from 'react'
import {
  useCreateCommunity,
  useLeaveCommunity,
  useMyCommunities,
} from '../../hooks/useCommunities'
import { ApiError } from '../../lib/apiClient'
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

type Pane = 'mine' | 'explore'

/**
 * Notifications & Communities — messages and chats have been removed from this
 * screen, and the Explore tab is intentionally blank for now.
 */
export default function MessagesView() {
  const [activePane, setActivePane] = useState<Pane>('mine')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [communityForm, setCommunityForm] = useState({
    name: '',
    desc: '',
    category: 'Study Group',
    school: '',
  })

  const { data: myCommunitiesData } = useMyCommunities()
  const createCommunity = useCreateCommunity()
  const leaveCommunity = useLeaveCommunity()

  const joinedCommunities = useMemo(
    () => myCommunitiesData?.communities ?? [],
    [myCommunitiesData],
  )

  const tabs: { id: Pane; label: string; count: number | null }[] = [
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

      {/* My communities pane */}
      {activePane === 'mine' && (
        <div className="space-y-4">
          {joinedCommunities.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e6e9e6] p-10 text-center">
              <p className="text-[#7b857b]">You haven't joined any community yet.</p>
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

      {/* Explore pane is intentionally blank for now. */}

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
