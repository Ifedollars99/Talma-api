<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center mb-2 gap-3 flex-wrap">
            <h2 class="font-heading text-3xl font-semibold text-[#1C2B39]">Messages & Communities</h2>
            <button @click="showCreateModal = true"
                class="bg-[#C6862E] text-[#1C2B39] px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#B37726] hover:text-white transition-colors font-medium">
                <i class="bi bi-plus-circle text-lg"></i>
                <span class="text-base">Create Community</span>
            </button>
        </div>

        <!-- Sub tabs -->
        <div class="flex gap-2 flex-wrap">
            <button v-for="tab in tabs" :key="tab.id" @click="activePane = tab.id"
                :class="['px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                    activePane === tab.id
                        ? 'bg-[#1C2B39] text-white border-[#1C2B39]'
                        : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                {{ tab.label }}
                <span v-if="tab.count !== null" class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                    :class="activePane === tab.id ? 'bg-[#C6862E] text-[#1C2B39]' : 'bg-[#F7F5F0] text-[#8B95A0]'">
                    {{ tab.count }}
                </span>
            </button>
        </div>

        <!-- Chats pane -->
        <div v-if="activePane === 'chats'" class="space-y-4">
            <div class="relative max-w-xl">
                <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
                <input v-model="chatQuery" type="text" placeholder="Search messages…"
                    class="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E4E0D8] rounded-xl text-[15px] text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
                <button v-if="chatQuery" @click="chatQuery = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A0] hover:text-[#1C2B39]">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
            <div class="bg-white rounded-xl border border-[#E4E0D8]">
                <div v-if="filteredMessages.length === 0" class="p-10 text-center text-[#8B95A0]">
                    <p>No messages match "{{ chatQuery }}"</p>
                </div>
                <div v-for="(message, index) in filteredMessages" :key="message.id" @click="openMessage(message)"
                    :class="['p-5 hover:bg-[#F7F5F0] cursor-pointer transition-colors', index !== filteredMessages.length - 1 ? 'border-b border-[#E4E0D8]' : '']">
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-[#EFEAE0] rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="bi bi-person text-[#1C2B39] text-lg"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h4
                                    :class="['text-base', message.unread ? 'font-semibold text-[#1C2B39]' : 'font-medium text-[#5B6672]']">
                                    {{ message.sender }}
                                </h4>
                                <span class="text-sm text-[#8B95A0]">{{ message.time }}</span>
                            </div>
                            <h5
                                :class="['text-base mb-1', message.unread ? 'font-medium text-[#1C2B39]' : 'text-[#5B6672]']">
                                {{ message.subject }}
                            </h5>
                            <p class="text-base text-[#8B95A0] truncate">{{ message.preview }}</p>
                        </div>
                        <div v-if="message.unread" class="w-2.5 h-2.5 bg-[#C6862E] rounded-full mt-2 flex-shrink-0"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- My communities pane -->
        <div v-if="activePane === 'mine'" class="space-y-4">
            <div v-if="joinedCommunities.length === 0" class="bg-white rounded-xl border border-[#E4E0D8] p-10 text-center">
                <p class="text-[#8B95A0]">You haven't joined any community yet.</p>
                <button @click="activePane = 'explore'" class="mt-3 text-[#C6862E] font-medium hover:underline">Explore communities →</button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="community in joinedCommunities" :key="community.id"
                    class="bg-white rounded-xl border border-[#E4E0D8] p-5 flex gap-4 hover:shadow-sm transition-shadow">
                    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', community.bg]">
                        <i :class="['text-2xl', community.icon, community.iconColor]"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-[15px] text-[#1C2B39] leading-snug">{{ community.name }}</p>
                        <p class="text-xs text-[#8B95A0] mt-0.5">{{ community.members }} members · Active {{ community.lastActive }}</p>
                        <div class="flex gap-2 mt-3">
                            <button @click="openCommunity(community)"
                                class="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#1C2B39] text-white hover:bg-[#24384A] transition-colors">
                                Open chat
                            </button>
                            <button @click="leaveCommunity(community.id)"
                                class="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#E4E0D8] text-[#8B95A0] hover:text-[#8B3A3A] hover:border-[#8B3A3A] transition-colors">
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Explore pane -->
        <div v-if="activePane === 'explore'" class="space-y-4">
            <div class="relative max-w-xl">
                <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
                <input v-model="exploreQuery" type="text" placeholder="Search communities…"
                    class="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E4E0D8] rounded-xl text-[15px] text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
                <button v-if="exploreQuery" @click="exploreQuery = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A0] hover:text-[#1C2B39]">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-1">
                <button v-for="cat in communityCategories" :key="cat" @click="activeCategory = cat"
                    :class="['flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                        activeCategory === cat
                            ? 'bg-[#1C2B39] text-white border-[#1C2B39]'
                            : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                    {{ cat }}
                </button>
            </div>
            <div v-if="exploreResults.length === 0" class="bg-white rounded-xl border border-[#E4E0D8] p-10 text-center">
                <p class="text-[#8B95A0]">No communities match your search.</p>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="community in exploreResults" :key="community.id"
                    class="bg-white rounded-xl border border-[#E4E0D8] p-5 hover:shadow-sm transition-shadow">
                    <div class="flex gap-4">
                        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', community.bg]">
                            <i :class="['text-2xl', community.icon, community.iconColor]"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-semibold text-[15px] text-[#1C2B39] leading-snug">{{ community.name }}</p>
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F5F0] border border-[#E4E0D8] text-[#5B6672]">{{ community.category }}</span>
                            </div>
                            <p class="text-[13px] text-[#8B95A0] mt-1 leading-relaxed">{{ community.desc }}</p>
                            <p class="text-xs text-[#8B95A0] mt-1.5">{{ community.school }} · {{ community.members }} members</p>
                            <button v-if="!community.joined" @click="joinCommunity(community.id)"
                                class="mt-3 text-xs font-semibold px-4 py-2 rounded-full bg-[#C6862E] text-[#1C2B39] hover:bg-[#B37726] hover:text-white transition-colors">
                                Join community
                            </button>
                            <button v-else @click="leaveCommunity(community.id)"
                                class="mt-3 text-xs font-medium px-4 py-2 rounded-full border border-[#2F6F5E] text-[#2F6F5E]">
                                <i class="bi bi-check-circle mr-1"></i>Joined — leave?
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Community Modal -->
        <div v-if="showCreateModal"
            class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-50 px-4">
            <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 class="font-heading text-2xl font-semibold text-[#1C2B39] mb-6">Create Community</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-1">Community Name</label>
                        <input v-model="communityForm.name" type="text" placeholder="e.g. OOU CSC 200L Class"
                            class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-1">Description</label>
                        <textarea v-model="communityForm.desc" rows="3" placeholder="What is this community about?"
                            class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors resize-none"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-[#5B6672] mb-1">Category</label>
                            <select v-model="communityForm.category"
                                class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors bg-white">
                                <option v-for="cat in creatableCategories" :key="cat" :value="cat">{{ cat }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[#5B6672] mb-1">School</label>
                            <input v-model="communityForm.school" type="text" placeholder="e.g. OOU"
                                class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                        </div>
                    </div>
                </div>
                <div class="flex space-x-3 mt-8">
                    <button @click="closeCreateModal"
                        class="flex-1 px-4 py-2.5 border border-[#E4E0D8] text-[#1C2B39] rounded-lg hover:bg-[#F7F5F0] transition-colors font-medium">
                        Cancel
                    </button>
                    <button @click="createCommunity"
                        class="flex-1 px-4 py-2.5 bg-[#C6862E] text-[#1C2B39] rounded-lg hover:bg-[#B37726] hover:text-white transition-colors font-medium">
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
/* eslint-disable vue/multi-word-component-names -- filename chosen to match project convention */
import { ref, computed } from 'vue'
import { communityDirectory, communityCategories } from '../data/communities'

const props = defineProps({
    messages: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['open-message', 'create-community', 'join-community', 'leave-community', 'open-community'])

const activePane = ref('chats')
const chatQuery = ref('')
const exploreQuery = ref('')
const activeCategory = ref('All')
const showCreateModal = ref(false)
const communities = ref(communityDirectory.map(c => ({ ...c })))

const communityForm = ref({
    name: '',
    desc: '',
    category: 'Study Group',
    school: ''
})

const creatableCategories = computed(() => communityCategories.filter(c => c !== 'All'))

const unreadCount = computed(() => props.messages.filter(m => m.unread).length)
const joinedCommunities = computed(() => communities.value.filter(c => c.joined))

const tabs = computed(() => [
    { id: 'chats', label: 'Chats', count: unreadCount.value || null },
    { id: 'mine', label: 'My Communities', count: joinedCommunities.value.length },
    { id: 'explore', label: 'Explore', count: null }
])

const filteredMessages = computed(() => {
    const q = chatQuery.value.trim().toLowerCase()
    if (!q) return props.messages
    return props.messages.filter(m =>
        m.sender.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
    )
})

const exploreResults = computed(() => {
    const q = exploreQuery.value.trim().toLowerCase()
    return communities.value.filter(c =>
        (activeCategory.value === 'All' || c.category === activeCategory.value) &&
        (!q || c.name.toLowerCase().includes(q) ||
            c.desc.toLowerCase().includes(q) ||
            c.school.toLowerCase().includes(q))
    )
})

const openMessage = (message) => {
    emit('open-message', message.id)
}

const closeCreateModal = () => {
    showCreateModal.value = false
    communityForm.value = { name: '', desc: '', category: 'Study Group', school: '' }
}

const createCommunity = () => {
    if (!communityForm.value.name.trim()) return
    const community = {
        id: `custom-${Date.now()}`,
        name: communityForm.value.name.trim(),
        desc: communityForm.value.desc.trim() || 'A brand new student community.',
        category: communityForm.value.category,
        school: communityForm.value.school.trim() || 'All schools',
        members: 1,
        icon: 'bi-people',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        lastActive: 'just now',
        joined: true
    }
    communities.value.unshift(community)
    emit('create-community', community)
    closeCreateModal()
    activePane.value = 'mine'
}

const joinCommunity = (id) => {
    const community = communities.value.find(c => c.id === id)
    if (community) {
        community.joined = true
        community.members += 1
        emit('join-community', id)
    }
}

const leaveCommunity = (id) => {
    const community = communities.value.find(c => c.id === id)
    if (community) {
        community.joined = false
        community.members = Math.max(0, community.members - 1)
        emit('leave-community', id)
    }
}

const openCommunity = (community) => {
    emit('open-community', community.id)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

.font-heading {
    font-family: 'Lora', Georgia, serif;
    letter-spacing: -0.01em;
}
</style>
