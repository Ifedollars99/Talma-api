<template>
    <!-- Mobile variant: compact stacked list -->
    <div v-if="variant === 'mobile'" class="bg-white px-4 pt-4 pb-4 border-b border-[#E4E0D8]">
        <h3 class="font-semibold text-[17px] text-[#1C2B39] mb-1">Discover</h3>
        <p class="text-xs text-[#8B95A0] mb-3">Search contents, hubs, courses and people</p>
        <div class="relative mb-4">
            <i class="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
            <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" type="text"
                placeholder="Search contents, hubs, courses..."
                class="w-full pl-10 pr-10 py-2.5 bg-[#F7F5F0] border border-[#E4E0D8] rounded-full text-sm text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
            <button v-if="modelValue" @click="$emit('update:modelValue', '')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A0]">
                <i class="bi bi-x-circle"></i>
            </button>
        </div>
        <div v-if="filteredHubs.length === 0" class="py-6 text-center">
            <p class="text-sm text-[#8B95A0]">No hubs match "{{ modelValue }}"</p>
        </div>
        <div class="space-y-3">
            <button v-for="hub in filteredHubs" :key="hub.id" @click="handleHubClick(hub)"
                class="w-full text-left bg-[#F7F5F0] border border-[#E4E0D8] rounded-2xl p-4 flex items-start gap-3 active:bg-[#EFE9DE]">
                <div :class="['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', hub.bg]">
                    <i :class="['text-xl', hub.icon, hub.iconColor]"></i>
                </div>
                <span class="flex-1 min-w-0">
                    <span class="block font-semibold text-[15px] text-[#1C2B39] leading-snug">{{ hub.title }}</span>
                    <span class="block text-xs text-[#8B95A0] mt-1 leading-relaxed">{{ hub.desc }}</span>
                </span>
                <i class="bi bi-chevron-right text-[#8B95A0] mt-1"></i>
            </button>
        </div>
    </div>

    <!-- Desktop variant: spacious grid -->
    <div v-else class="px-8 py-6 border-b border-[#E4E0D8] bg-[#F7F5F0]/50">
        <h3 class="font-semibold text-lg text-[#1C2B39]">Discover</h3>
        <p class="text-sm text-[#8B95A0] mt-1 mb-4">Search contents, hubs, courses and people</p>
        <div class="relative max-w-xl mb-5">
            <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
            <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" type="text"
                placeholder="Search contents, hubs, courses..."
                class="w-full pl-11 pr-10 py-3 bg-white border border-[#E4E0D8] rounded-full text-[15px] text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
            <button v-if="modelValue" @click="$emit('update:modelValue', '')"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A0] hover:text-[#1C2B39]">
                <i class="bi bi-x-circle"></i>
            </button>
        </div>
        <div v-if="filteredHubs.length === 0" class="py-6 text-center">
            <p class="text-[#8B95A0]">No hubs match "{{ modelValue }}"</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <button v-for="hub in filteredHubs" :key="hub.id" @click="handleHubClick(hub)"
                class="text-left bg-white border border-[#E4E0D8] rounded-2xl p-5 hover:shadow-md transition-shadow flex items-start gap-4">
                <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', hub.bg]">
                    <i :class="['text-2xl', hub.icon, hub.iconColor]"></i>
                </div>
                <span class="flex-1 min-w-0">
                    <span class="block font-semibold text-[15px] text-[#1C2B39] leading-snug">{{ hub.title }}</span>
                    <span class="block text-[13px] text-[#8B95A0] mt-1 leading-relaxed">{{ hub.desc }}</span>
                </span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    variant: {
        type: String,
        default: 'desktop',
        validator: (v) => ['mobile', 'desktop'].includes(v)
    }
})

const emit = defineEmits(['update:modelValue', 'select-hub'])

const handleHubClick = (hub) => {
    if (hub.route) {
        router.push(hub.route).catch(() => {})
        return
    }
    emit('select-hub', hub)
}

// Single source of truth for Discover hubs — edit titles/descriptions here
const discoverHubs = [
    {
        id: 'campus-news',
        title: 'Campus News & Announcements',
        desc: 'Official updates, events, deadlines and school-wide notices.',
        icon: 'bi-megaphone',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        keywords: 'news announcement update event notice campus',
        route: '/hubs/campus-news'
    },
    {
        id: 'aspirant',
        title: 'Aspirant / Admission Hub',
        desc: 'JAMB, Post-UTME, admission lists, cut-off marks and guidance.',
        icon: 'bi-mortarboard',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        keywords: 'aspirant admission jamb post-utme cutoff jambite',
        route: '/hubs/aspirant'
    },
    {
        id: 'siwes',
        title: 'SIWES / IT Hub',
        desc: 'Placements, logbook tips, defence prep and SIWES opportunities.',
        icon: 'bi-briefcase',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        keywords: 'siwes it internship placement logbook industrial training',
        route: '/hubs/siwes'
    },
    {
        id: 'academic',
        title: 'Academic Hub',
        desc: 'Past questions, tutorials, study groups and course materials.',
        icon: 'bi-book',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        keywords: 'academic study tutorial past question material course exam',
        route: '/hubs/academic'
    },
    {
        id: 'final-year',
        title: 'Final Year Students Hub',
        desc: 'Projects, supervisors, defence tips and graduation checklist.',
        icon: 'bi-award',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        keywords: 'final year project thesis defence supervisor graduation',
        route: '/hubs/final-year'
    },
    {
        id: 'know-your-school',
        title: 'Know Your School',
        desc: 'Faculties, map, clubs, events, lost & found and marketplace.',
        icon: 'bi-geo-alt',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        keywords: 'map school faculties departments clubs events marketplace lost found community',
        route: '/hubs/know-your-school'
    }
]

const filteredHubs = computed(() => {
    const q = (props.modelValue || '').trim().toLowerCase()
    if (!q) return discoverHubs
    return discoverHubs.filter(h =>
        h.title.toLowerCase().includes(q) ||
        h.desc.toLowerCase().includes(q) ||
        h.keywords.includes(q)
    )
})
</script>
