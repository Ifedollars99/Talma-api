<template>
    <div class="min-h-screen bg-[#F7F5F0]">
        <div class="bg-[#1C2B39] text-white sticky top-0 z-40 shadow-sm">
            <div class="px-4 lg:px-12 py-4 flex items-center gap-3">
                <button @click="goBack"
                    class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Back">
                    <i class="bi bi-arrow-left text-lg"></i>
                </button>
                <div class="min-w-0">
                    <p class="text-[#C6862E] text-[11px] font-semibold uppercase tracking-wide">Discover · Hub</p>
                    <h1 class="font-heading text-xl lg:text-2xl font-semibold truncate">Know Your School — OOU</h1>
                </div>
            </div>
        </div>

        <div class="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-60 h-60 bg-[#C6862E]/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <h2 class="font-heading text-2xl lg:text-4xl font-semibold mb-2">Olabisi Onabanjo University at a glance</h2>
                    <p class="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
                        Faculties, departments, communities, events, clubs, lost & found and marketplace —
                        the social layer of campus. Main campus: Ago-Iwoye, Ogun State.
                    </p>
                    <div class="relative mt-4 max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input v-model="query" type="text" placeholder="Search faculties, clubs, events, marketplace..."
                            class="w-full pl-11 pr-10 py-3 bg-white/10 border border-white/15 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
                        <button v-if="query" @click="query = ''"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Campus map: worldwide satellite + streets, campus picker on top -->
            <div class="bg-white border border-[#E4E0D8] rounded-2xl overflow-hidden shadow-sm mb-4 lg:mb-6">
                <div class="p-5 lg:p-8 border-b border-[#E4E0D8] flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E9F2EF] to-[#D4E8E1] flex items-center justify-center flex-shrink-0">
                        <i class="bi bi-geo-alt text-2xl text-[#2F6F5E]"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-lg lg:text-xl text-[#1C2B39]">School map — pick your campus</h3>
                        <p class="text-sm text-[#8B95A0] mt-1">Showing: <span class="font-medium text-[#1C2B39]">{{ activeCampus.name }}</span></p>
                    </div>
                </div>
                <div class="px-5 lg:px-8 py-4 border-b border-[#E4E0D8] bg-[#F7F5F0]/50 space-y-3">
                    <div class="relative max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
                        <input v-model="placeSearch" @keyup.enter="searchPlace" type="text"
                            placeholder="Search any university or campus…"
                            class="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E4E0D8] rounded-full text-sm text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
                        <button v-if="placeSearch" @click="placeSearch = ''"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A0] hover:text-[#1C2B39]">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                    <p v-if="placeStatus" class="text-xs text-[#8B95A0]">{{ placeStatus }}</p>
                    <div v-for="group in campusGroups" :key="group.label" class="flex items-start gap-2">
                        <span class="text-[11px] font-semibold uppercase tracking-wide text-[#8B95A0] w-24 flex-shrink-0 pt-2">{{ group.label }}</span>
                        <div class="flex gap-2 overflow-x-auto pb-1 flex-1">
                            <button v-for="c in group.items" :key="c.id" @click="selectCampus(c.id)"
                                :class="['flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors',
                                    selectedCampusId === c.id
                                        ? 'bg-[#1C2B39] text-white border-[#1C2B39]'
                                        : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                                {{ c.name }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="w-full h-72 lg:h-96 bg-[#1C2B39] relative">
                    <div ref="mapEl" class="w-full h-full z-0"></div>
                    <div v-if="mapError"
                        class="absolute inset-0 bg-[#1C2B39]/95 text-white flex items-center justify-center p-6">
                        <div class="max-w-md w-full text-center">
                            <i class="bi bi-map text-4xl text-[#C6862E]"></i>
                            <h4 class="font-semibold text-lg mt-3">Map failed to load</h4>
                            <p class="text-sm text-white/70 mt-1 leading-relaxed">{{ mapError }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="filteredSections.length === 0" class="bg-white border border-[#E4E0D8] rounded-2xl p-10 text-center">
                <p class="text-[#8B95A0]">Nothing matches "{{ query }}"</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <section v-for="s in filteredSections" :key="s.id"
                    class="bg-white border border-[#E4E0D8] rounded-2xl overflow-hidden shadow-sm">
                    <div class="p-5 lg:p-6 border-b border-[#E4E0D8] flex items-start gap-4">
                        <div :class="['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', s.bg]">
                            <i :class="['text-xl', s.icon, s.iconColor]"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-[17px] text-[#1C2B39]">{{ s.title }}</h3>
                            <p class="text-[13px] text-[#8B95A0] mt-0.5">{{ s.desc }}</p>
                        </div>
                    </div>
                    <ul class="p-5 lg:p-6 space-y-2.5">
                        <li v-for="(item, i) in s.items" :key="i" class="flex gap-2.5 text-sm text-[#5B6672] leading-relaxed">
                            <i class="bi bi-dot text-[#C6862E] text-lg leading-none mt-0.5"></i>
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const query = ref('')

const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/mycamp')
}

// ---------- Worldwide school map (Leaflet, free tiles, no key) ----------
// OOU Main Campus boundary was traced from satellite imagery (exact).
// Other pins are approximate town/campus-level points — send corrections and they will be tightened.
const campusGroups = [
    {
        label: 'OOU',
        items: [
            { id: 'oou-main', name: 'OOU Main Campus', coords: [6.9233, 3.8712], zoom: 16, boundary: 'oou-main' },
            { id: 'oou-sagamu', name: 'OOU Sagamu', coords: [6.832, 3.641], zoom: 15 },
            { id: 'oou-ayetoro', name: 'OOU Ayetoro', coords: [7.246, 3.037], zoom: 15 },
            { id: 'oou-ibogun', name: 'OOU Ibogun', coords: [6.85, 3.18], zoom: 14 }
        ]
    },
    {
        label: 'Others',
        items: [
            { id: 'unilag', name: 'UNILAG Akoka', coords: [6.5158, 3.3898], zoom: 15 },
            { id: 'ui', name: 'UI Ibadan', coords: [7.4419, 3.9013], zoom: 15 },
            { id: 'oau', name: 'OAU Ife', coords: [7.5207, 4.5255], zoom: 15 }
        ]
    }
]
// Traced OOU main-campus perimeter — shown as a gold outline when OOU Main Campus is selected
const OOU_MAIN_BOUNDARY = [
    [6.93573931580142, 3.8674772045757453],
    [6.926153926264766, 3.8664043210317836],
    [6.920786022836477, 3.8677346963188],
    [6.915119836517129, 3.8676917809770415],
    [6.917335195653473, 3.8742578282660873],
    [6.920189585373264, 3.87503030441774],
    [6.921680677618209, 3.8768756641133546],
    [6.929136068161178, 3.874300743607846]
]

const allCampuses = computed(() => campusGroups.flatMap(g => g.items))

const mapEl = ref(null)
const mapError = ref('')
const selectedCampusId = ref('oou-main')
const placeSearch = ref('')
const placeStatus = ref('')
let mapInstance = null
let marker = null
let boundaryLayer = null

const activeCampus = computed(() =>
    allCampuses.value.find(c => c.id === selectedCampusId.value) || { name: 'OOU Main Campus' }
)

const showBoundary = (campus) => {
    if (boundaryLayer) {
        boundaryLayer.remove()
        boundaryLayer = null
    }
    if (campus && campus.boundary === 'oou-main' && mapInstance) {
        boundaryLayer = L.polygon(OOU_MAIN_BOUNDARY, {
            color: '#C6862E',
            weight: 3,
            fillOpacity: 0,
            interactive: false
        }).addTo(mapInstance)
    }
}

const flyToCampus = (campus) => {
    if (!mapInstance || !campus) return
    selectedCampusId.value = campus.id
    placeStatus.value = ''
    mapInstance.flyTo(campus.coords, campus.zoom || 15, { duration: 1.2 })
    if (marker) marker.setLatLng(campus.coords).setTooltipContent(campus.name)
    showBoundary(campus)
}

const selectCampus = (id) => {
    const campus = allCampuses.value.find(c => c.id === id)
    flyToCampus(campus)
}

const searchPlace = async () => {
    const q = placeSearch.value.trim()
    if (!q || !mapInstance) return
    placeStatus.value = 'Searching…'
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!data || !data.length) {
            placeStatus.value = `No results for "${q}" — try adding the city or state.`
            return
        }
        const hit = data[0]
        const coords = [parseFloat(hit.lat), parseFloat(hit.lon)]
        selectedCampusId.value = ''
        placeStatus.value = `Showing: ${hit.display_name.split(',').slice(0, 3).join(',')}`
        mapInstance.flyTo(coords, 15, { duration: 1.2 })
        if (marker) marker.setLatLng(coords).setTooltipContent(hit.display_name.split(',')[0])
        if (boundaryLayer) {
            boundaryLayer.remove()
            boundaryLayer = null
        }
    } catch {
        placeStatus.value = 'Search failed — check your connection and try again.'
    }
}

onMounted(() => {
    try {
        const first = allCampuses.value[0]
        mapInstance = L.map(mapEl.value, {
            center: first.coords,
            zoom: first.zoom,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: true,
            worldCopyJump: true
        })

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: 'Imagery © Esri & contributors'
        })
        const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        })
        satellite.addTo(mapInstance)
        L.control.layers({ Satellite: satellite, Streets: streets }, null, { position: 'topright' }).addTo(mapInstance)

        marker = L.circleMarker(first.coords, {
            radius: 8,
            color: '#C6862E',
            weight: 3,
            fillColor: '#1C2B39',
            fillOpacity: 1
        }).addTo(mapInstance).bindTooltip(first.name)
        showBoundary(first)
    } catch (e) {
        mapError.value = e && e.message ? e.message : 'Map failed to load.'
    }
})

onBeforeUnmount(() => {
    if (mapInstance) {
        mapInstance.remove()
        mapInstance = null
    }
})

const sections = [
    {
        id: 'faculties',
        title: 'Faculties',
        desc: 'Confirm the current faculty list on the OOU portal.',
        icon: 'bi-building',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        items: [
            'Arts, Education, Law, Science, Social Sciences, Management Sciences',
            'Engineering, Pharmacy, Basic & Clinical Medical Sciences',
            'Environmental Studies, Agricultural Sciences and related schools',
            'Some programmes run at Sagamu / Ayetoro / Ibogun campuses'
        ]
    },
    {
        id: 'departments',
        title: 'Departments & Courses',
        desc: 'Your department board is your real homepage.',
        icon: 'bi-diagram-3',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        items: [
            'Each faculty lists its departments and degree options on the portal',
            'Check course outlines, advisers and class reps per department',
            'Cross-faculty electives and prerequisites vary by session'
        ]
    },
    {
        id: 'communities',
        title: 'Student Communities',
        desc: 'Find your people per level, course and interest.',
        icon: 'bi-people',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        items: [
            'Department and faculty groups for outlines and past questions',
            'Level-based class groups for tests, venues and assignments',
            'Study circles, tech/dev, debate, press and volunteer teams'
        ]
    },
    {
        id: 'news-events',
        title: 'Campus News & Events',
        desc: 'Never miss matric, convocation and faculty weeks.',
        icon: 'bi-calendar-event',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        items: [
            'Matriculation, convocation, faculty/departmental weeks',
            'Career fairs, exhibitions, religious and cultural festivals',
            'Follow verified OOU and faculty handles — ignore rumour blogs'
        ]
    },
    {
        id: 'clubs',
        title: 'Clubs & Student Associations',
        desc: 'Build skills and networks outside lectures.',
        icon: 'bi-trophy',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        items: [
            'SUG, faculty and departmental associations',
            'JETS, press clubs, drama, choir, sports teams, tech communities',
            'Confirm registration and dues with student affairs before paying'
        ]
    },
    {
        id: 'services',
        title: 'Lost & Found + Marketplace',
        desc: 'Campus services that save time and money.',
        icon: 'bi-bag',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        items: [
            'Lost & Found: report ID cards, phones and documents at security / student affairs with proof of ownership',
            'Marketplace: verified student vendors for food, thrift, gadgets, printing and hostel essentials',
            'Meet in public places and confirm items before payment'
        ]
    }
]

const filteredSections = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return sections
    return sections
        .map(s => ({
            ...s,
            items: s.items.filter(i => i.toLowerCase().includes(q) || s.title.toLowerCase().includes(q))
        }))
        .filter(s => s.items.length > 0)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

.font-heading {
    font-family: 'Lora', Georgia, serif;
    letter-spacing: -0.01em;
}
</style>
