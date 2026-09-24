<template>
    <!-- X-style profile: avatar button only, everything else hidden until click/hover -->
    <div class="relative" ref="rootEl" @mouseenter="onHoverOpen" @mouseleave="onHoverLeave">
        <!-- Profile avatar button -->
        <button @click="toggleMenu" title="Profile"
            class="w-10 h-10 bg-[#C6862E] rounded-full flex items-center justify-center hover:ring-2 hover:ring-white/40 transition-all">
            <span class="text-[#1C2B39] text-base font-semibold">{{ initial }}</span>
        </button>

        <!-- Dropdown menu (X style) -->
        <div v-if="menuOpen"
            class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-[#E4E0D8] overflow-hidden z-[60]">
            <!-- Profile summary -->
            <div class="px-4 pt-4 pb-3 border-b border-[#E4E0D8]">
                <div class="flex items-center space-x-3">
                    <div class="w-11 h-11 bg-[#C6862E] rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-[#1C2B39] font-semibold">{{ initial }}</span>
                    </div>
                    <div class="min-w-0">
                        <p class="font-semibold text-[#1C2B39] truncate">{{ username }}</p>
                        <p class="text-sm text-[#8B95A0] truncate">{{ email }}</p>
                        <span class="inline-block mt-1 text-[11px] px-2 py-0.5 bg-[#F7F5F0] border border-[#E4E0D8] rounded-full text-[#5B6672] font-medium capitalize">{{ userRole }}</span>
                    </div>
                </div>
            </div>

            <!-- Menu items : lead to Settings -->
            <div class="p-2">
                <button @click="openSettings('account')"
                    class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F5F0] text-left transition-colors">
                    <i class="bi bi-gear text-lg text-[#5B6672]"></i>
                    <span class="text-[15px] text-[#1C2B39] font-medium">Settings</span>
                    <i class="bi bi-chevron-right ml-auto text-[#8B95A0]"></i>
                </button>
                <button @click="openSettings('account')"
                    class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F5F0] text-left transition-colors">
                    <i class="bi bi-person-gear text-lg text-[#5B6672]"></i>
                    <span class="text-[15px] text-[#1C2B39]">Account settings</span>
                </button>
                <button @click="openSettings('region')"
                    class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F5F0] text-left transition-colors">
                    <i class="bi bi-globe text-lg text-[#5B6672]"></i>
                    <span class="text-[15px] text-[#1C2B39]">Region & language</span>
                </button>
                <button @click="openSettings('privacy')"
                    class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F5F0] text-left transition-colors">
                    <i class="bi bi-shield-lock text-lg text-[#5B6672]"></i>
                    <span class="text-[15px] text-[#1C2B39]">Privacy</span>
                </button>
            </div>

            <!-- Sign out UNDER settings, not inside it -->
            <div class="border-t border-[#E4E0D8] p-2">
                <button @click="handleSignOut"
                    class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#F7E9E9] text-left transition-colors">
                    <i class="bi bi-box-arrow-right text-lg text-[#8B3A3A]"></i>
                    <span class="text-[15px] text-[#8B3A3A] font-medium">Sign out</span>
                </button>
            </div>
        </div>

        <!-- Settings modal -->
        <teleport to="body">
            <div v-if="settingsOpen"
                class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-[70] px-4" @click.self="settingsOpen = false">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div class="flex items-center justify-between px-5 py-4 border-b border-[#E4E0D8]">
                        <h3 class="font-semibold text-lg text-[#1C2B39]">Settings</h3>
                        <button @click="settingsOpen = false" class="w-9 h-9 rounded-full hover:bg-[#F7F5F0] flex items-center justify-center text-[#5B6672]">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row min-h-0">
                        <!-- Settings side tabs -->
                        <div class="sm:w-52 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[#E4E0D8] p-2 flex sm:flex-col gap-1 overflow-x-auto">
                            <button @click="settingsTab = 'account'"
                                :class="['px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap', settingsTab === 'account' ? 'bg-[#FBF3E4] text-[#1C2B39]' : 'text-[#5B6672] hover:bg-[#F7F5F0]']">Account</button>
                            <button @click="settingsTab = 'region'"
                                :class="['px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap', settingsTab === 'region' ? 'bg-[#FBF3E4] text-[#1C2B39]' : 'text-[#5B6672] hover:bg-[#F7F5F0]']">Region & language</button>
                            <button @click="settingsTab = 'privacy'"
                                :class="['px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap', settingsTab === 'privacy' ? 'bg-[#FBF3E4] text-[#1C2B39]' : 'text-[#5B6672] hover:bg-[#F7F5F0]']">Privacy</button>
                        </div>
                        <!-- Settings content (no sign out in here) -->
                        <div class="flex-1 p-5 space-y-5 overflow-y-auto">
                            <div v-if="settingsTab === 'account'" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Username</label>
                                    <input v-model="editableUsername" type="text"
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6862E] text-[#1C2B39]" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Email</label>
                                    <input :value="email" type="email" disabled
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl bg-[#F7F5F0] text-[#8B95A0]" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Role</label>
                                    <input :value="userRole" type="text" disabled
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl bg-[#F7F5F0] text-[#8B95A0] capitalize" />
                                </div>
                                <button @click="saveAccount" :disabled="saving"
                                    class="px-5 py-2.5 bg-[#1C2B39] text-white rounded-xl text-sm font-medium hover:bg-[#24384A] disabled:opacity-50">
                                    {{ saving ? 'Saving...' : 'Save changes' }}
                                </button>
                                <p v-if="saveMsg" class="text-sm text-[#2F6F5E]">{{ saveMsg }}</p>

                                <div class="border-t border-[#E4E0D8] pt-4">
                                    <h4 class="font-semibold text-[#8B3A3A] mb-1">Danger zone</h4>
                                    <p class="text-sm text-[#8B95A0] mb-3">Permanently delete your account and all data.</p>
                                    <button @click="confirmDeleteAccount = true"
                                        class="px-4 py-2.5 border border-[#8B3A3A] text-[#8B3A3A] rounded-xl text-sm font-medium hover:bg-[#F7E9E9]">
                                        Delete my account
                                    </button>
                                </div>
                            </div>

                            <div v-if="settingsTab === 'region'" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Country / Region</label>
                                    <select v-model="region"
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6862E] text-[#1C2B39]">
                                        <option>Nigeria</option>
                                        <option>Ghana</option>
                                        <option>Kenya</option>
                                        <option>United Kingdom</option>
                                        <option>United States</option>
                                        <option>Canada</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Language</label>
                                    <select v-model="language"
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6862E] text-[#1C2B39]">
                                        <option>English</option>
                                        <option>French</option>
                                        <option>Yoruba</option>
                                        <option>Hausa</option>
                                        <option>Igbo</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[#5B6672] mb-1.5">Timezone</label>
                                    <select v-model="timezone"
                                        class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6862E] text-[#1C2B39]">
                                        <option>Africa/Lagos (WAT)</option>
                                        <option>Africa/Accra (GMT)</option>
                                        <option>Europe/London (GMT)</option>
                                        <option>America/New_York (EST)</option>
                                    </select>
                                </div>
                                <button @click="saveRegion"
                                    class="px-5 py-2.5 bg-[#1C2B39] text-white rounded-xl text-sm font-medium hover:bg-[#24384A]">Save region</button>
                                <p v-if="regionMsg" class="text-sm text-[#2F6F5E]">{{ regionMsg }}</p>
                            </div>

                            <div v-if="settingsTab === 'privacy'" class="space-y-3">
                                <label class="flex items-center justify-between py-2">
                                    <span class="text-[15px] text-[#1C2B39]">Show my profile to community</span>
                                    <input v-model="privacyPublic" type="checkbox" class="w-5 h-5 accent-[#C6862E]" />
                                </label>
                                <label class="flex items-center justify-between py-2 border-t border-[#E4E0D8]">
                                    <span class="text-[15px] text-[#1C2B39]">Email notifications</span>
                                    <input v-model="privacyEmail" type="checkbox" class="w-5 h-5 accent-[#C6862E]" />
                                </label>
                                <p class="text-sm text-[#8B95A0]">More privacy controls coming soon.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete account confirm -->
            <div v-if="confirmDeleteAccount"
                class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-[80] px-4" @click.self="confirmDeleteAccount = false">
                <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                    <div class="w-14 h-14 bg-[#F7E9E9] rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="bi bi-exclamation-triangle text-[#8B3A3A] text-2xl"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-[#1C2B39] mb-1">Delete account?</h3>
                    <p class="text-sm text-[#5B6672] mb-5">This removes your account. This cannot be undone.</p>
                    <div class="flex gap-3">
                        <button @click="confirmDeleteAccount = false"
                            class="flex-1 px-4 py-2.5 border border-[#E4E0D8] rounded-xl font-medium text-[#1C2B39] hover:bg-[#F7F5F0]">Cancel</button>
                        <button @click="deleteAccount" :disabled="deleting"
                            class="flex-1 px-4 py-2.5 bg-[#8B3A3A] text-white rounded-xl font-medium hover:bg-[#732E2E] disabled:opacity-50">
                            {{ deleting ? 'Deleting...' : 'Yes, delete' }}
                        </button>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const props = defineProps({
    username: { type: String, default: '' },
    email: { type: String, default: '' },
    role: { type: String, default: '' }
})

const router = useRouter()
const rootEl = ref(null)
const menuOpen = ref(false)
const settingsOpen = ref(false)
const settingsTab = ref('account')
const confirmDeleteAccount = ref(false)
const deleting = ref(false)
const saving = ref(false)
const saveMsg = ref('')
const regionMsg = ref('')

const localUsername = ref(props.username || 'Student')
const localEmail = ref(props.email || '')
const localRole = ref(props.role || 'student')
const editableUsername = ref(localUsername.value)
const region = ref('Nigeria')
const language = ref('English')
const timezone = ref('Africa/Lagos (WAT)')
const privacyPublic = ref(true)
const privacyEmail = ref(true)

let hoverTimer = null

const username = computed(() => props.username || localUsername.value)
const email = computed(() => props.email || localEmail.value)
const userRole = computed(() => props.role || localRole.value)
const initial = computed(() => (username.value ? username.value.charAt(0).toUpperCase() : 'S'))

const toggleMenu = () => { menuOpen.value = !menuOpen.value }
const onHoverOpen = () => {
    if (hoverTimer) clearTimeout(hoverTimer)
    menuOpen.value = true
}
const onHoverLeave = () => {
    // slight delay so moving to dropdown doesn't flicker
    hoverTimer = setTimeout(() => { if (!settingsOpen.value) menuOpen.value = false }, 180)
}

const openSettings = (tab) => {
    settingsTab.value = tab
    settingsOpen.value = true
    menuOpen.value = false
}

const onDocClick = (e) => {
    if (rootEl.value && !rootEl.value.contains(e.target)) menuOpen.value = false
}
const onEsc = (e) => {
    if (e.key === 'Escape') { menuOpen.value = false; settingsOpen.value = false; confirmDeleteAccount.value = false }
}

const handleSignOut = async () => {
    menuOpen.value = false
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
    else router.push('/')
}

const saveAccount = async () => {
    saveMsg.value = ''
    saving.value = true
    try {
        const name = editableUsername.value.trim()
        if (name.length < 3) { saveMsg.value = 'Username must be at least 3 characters.'; return }
        const { error } = await supabase.auth.updateUser({ data: { username: name } })
        if (error) throw error
        localUsername.value = name
        try { localStorage.setItem('ss_region', region.value) } catch (storeErr) { console.warn(storeErr) }
        saveMsg.value = 'Account updated.'
    } catch (e) {
        saveMsg.value = e.message || 'Could not save.'
    } finally {
        saving.value = false
    }
}

const saveRegion = () => {
    try {
        localStorage.setItem('ss_region', region.value)
        localStorage.setItem('ss_language', language.value)
        localStorage.setItem('ss_timezone', timezone.value)
    } catch (storeErr) { console.warn(storeErr) }
    regionMsg.value = 'Region saved.'
}

const deleteAccount = async () => {
    deleting.value = true
    try {
        // No client-side delete API key — sign out and route home.
        // Wire a server function / admin endpoint here for hard delete.
        await supabase.auth.signOut()
        confirmDeleteAccount.value = false
        settingsOpen.value = false
        router.push('/')
    } finally {
        deleting.value = false
    }
}

onMounted(async () => {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            localUsername.value = props.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Student'
            localEmail.value = props.email || user.email || ''
            localRole.value = props.role || user.user_metadata?.role || user.user_metadata?.category || 'student'
            editableUsername.value = localUsername.value
        }
        try {
            region.value = localStorage.getItem('ss_region') || 'Nigeria'
            language.value = localStorage.getItem('ss_language') || 'English'
            timezone.value = localStorage.getItem('ss_timezone') || 'Africa/Lagos (WAT)'
        } catch (readErr) { console.warn(readErr) }
    } catch (e) { console.error(e) }
})

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onEsc)
    if (hoverTimer) clearTimeout(hoverTimer)
})
</script>
