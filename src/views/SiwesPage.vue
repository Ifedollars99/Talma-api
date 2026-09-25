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
                    <h1 class="font-heading text-xl lg:text-2xl font-semibold truncate">SIWES / IT Hub</h1>
                </div>
            </div>
        </div>

        <div class="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-60 h-60 bg-[#C6862E]/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <h2 class="font-heading text-2xl lg:text-4xl font-semibold mb-2">I'm going for SIWES</h2>
                    <p class="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
                        Eligibility, placement, ITF forms, logbook, report and defence — the full industrial training path for OOU students.
                        Confirm timelines with your departmental SIWES coordinator.
                    </p>
                    <div class="relative mt-4 max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input v-model="query" type="text" placeholder="Search placement, logbook, ITF forms, report..."
                            class="w-full pl-11 pr-10 py-3 bg-white/10 border border-white/15 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
                        <button v-if="query" @click="query = ''"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                    <div class="flex gap-2 overflow-x-auto mt-4 pb-1 -mx-1 px-1">
                        <button v-for="c in categories" :key="c.id" @click="scrollTo(c.id)"
                            class="flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full bg-white/10 hover:bg-[#C6862E] hover:text-[#1C2B39] border border-white/10 transition-colors">
                            {{ c.short }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="filteredCategories.length === 0" class="bg-white border border-[#E4E0D8] rounded-2xl p-10 text-center">
                <p class="text-[#8B95A0]">No SIWES topics match "{{ query }}"</p>
            </div>

            <section v-for="c in filteredCategories" :key="c.id" :id="c.id"
                class="bg-white border border-[#E4E0D8] rounded-2xl overflow-hidden shadow-sm mb-4 lg:mb-6 scroll-mt-24">
                <div class="p-5 lg:p-8 border-b border-[#E4E0D8] flex items-start gap-4">
                    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', c.bg]">
                        <i :class="['text-2xl', c.icon, c.iconColor]"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-lg lg:text-xl text-[#1C2B39]">{{ c.title }}</h3>
                        <p class="text-sm text-[#8B95A0] mt-1 leading-relaxed">{{ c.desc }}</p>
                    </div>
                </div>
                <div class="divide-y divide-[#E4E0D8]">
                    <div v-for="(item, i) in c.items" :key="i" class="p-5 lg:px-8 flex gap-3">
                        <i class="bi bi-check-circle-fill text-[#2F6F5E] mt-1 flex-shrink-0"></i>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-medium text-[15px] text-[#1C2B39]">{{ item.title }}</p>
                                <span v-if="item.tag" class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F5F0] border border-[#E4E0D8] text-[#5B6672]">{{ item.tag }}</span>
                            </div>
                            <p class="text-sm text-[#5B6672] mt-1 leading-relaxed">{{ item.desc }}</p>
                        </div>
                    </div>
                </div>
                <div v-if="c.source" class="px-5 lg:px-8 py-4 bg-[#F7F5F0]/60 border-t border-[#E4E0D8]">
                    <p class="text-xs text-[#8B95A0]"><i class="bi bi-link-45deg mr-1"></i>Verify via: {{ c.source }}</p>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const query = ref('')

const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/mycamp')
}

const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const categories = [
    {
        id: 'eligibility',
        short: 'Eligibility',
        title: 'Who is eligible? Level & departments',
        desc: 'SIWES applies to science, engineering, technology, environmental and related programmes — not every department.',
        icon: 'bi-person-check',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'Departmental SIWES coordinator, OOU SIWES unit.',
        items: [
            { title: 'Who is eligible?', desc: 'Students in SIWES-enabled programmes (Sciences, Engineering, Technology, Agriculture, Environmental, some Management/Social Science tech tracks). Confirm your department is on the ITF list.', tag: 'Check dept' },
            { title: 'What level?', desc: 'Typically 200/300 level (first phase) and 300/400 level (second phase) depending on 4- or 5-year programmes. Your coordinator confirms the exact session.', tag: 'Level' },
            { title: 'When does SIWES start?', desc: 'Usually aligned with the long vacation / second-semester break and runs 3–6 months. Dates follow the OOU academic calendar and ITF calendar.', tag: 'Timeline' }
        ]
    },
    {
        id: 'placement',
        short: 'Placement',
        title: 'How to find a placement',
        desc: 'Where you train shapes what you learn — and your report.',
        icon: 'bi-geo-alt',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'SIWES coordinator approved organisation list.',
        items: [
            { title: 'Target relevant organisations', desc: 'Banks for Accounting/Banking, hospitals/labs for Microbiology/Biochemistry, engineering firms for Engineering, IT firms for Computer Science.' },
            { title: 'SIWES introduction letter', desc: 'Collect the official SIWES/IT letter from your department before approaching organisations — most will not accept you without it.', tag: 'Letter' },
            { title: 'Get acceptance early', desc: 'Secure and submit your placement acceptance letter before resumption; late placements delay mobilisation.' },
            { title: 'Avoid unrelated placements', desc: 'Training in an unrelated field weakens your logbook, report and defence score.' }
        ]
    },
    {
        id: 'forms',
        short: 'ITF Forms',
        title: 'ITF forms & supervisor information',
        desc: 'The paperwork that proves you trained.',
        icon: 'bi-file-earmark-text',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'ITF forms issued via OOU SIWES unit.',
        items: [
            { title: 'ITF forms (e.g. Form 8 & placement slips)', desc: 'Fill biodata, organisation details and training period neatly; get organisation stamp/signature where required.' },
            { title: 'Industry-based supervisor', desc: 'Your workplace supervisor signs weekly entries and confirms attendance — keep their name, phone and designation.', tag: 'Supervisor' },
            { title: 'School-based supervisor', desc: 'OOU assigns a visiting supervisor who inspects you at the placement and scores your training.', tag: 'Visitation' }
        ]
    },
    {
        id: 'logbook',
        short: 'Logbook',
        title: 'Logbook — daily/weekly entries',
        desc: 'The logbook is marked. Write it as you train, not after.',
        icon: 'bi-journal-text',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        items: [
            { title: 'Write weekly, not last-minute', desc: 'Record tasks, tools used, skills learnt and observations each week with dates.' },
            { title: 'Be specific and technical', desc: '"Calibrated pH meter and ran water-sample titration" beats "worked in the lab".' },
            { title: 'Get signatures promptly', desc: 'Weekly sign-off by your industry supervisor; unsigned weeks may be rejected.' }
        ]
    },
    {
        id: 'report',
        short: 'Report',
        title: 'Industrial attachment report & submission',
        desc: 'Your bound report + defence carry the grade.',
        icon: 'bi-book',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'Departmental report format / template.',
        items: [
            { title: 'Report structure', desc: 'Title page, abstract, organisation profile, weekly summary of work, skills acquired, challenges, conclusion and references.' },
            { title: 'Submission requirements', desc: 'Bound copies + soft copy, signed logbook, completed ITF forms and placement letters — submitted before the departmental deadline.', tag: 'Checklist' },
            { title: 'Defence / presentation', desc: 'Be ready to explain what YOU did, tools used and what you learnt. Panels quickly spot copied reports.' }
        ]
    },
    {
        id: 'mistakes',
        short: 'Mistakes',
        title: 'Common SIWES mistakes',
        desc: 'Avoid these to protect your score.',
        icon: 'bi-exclamation-triangle',
        bg: 'from-[#FBE4E4] to-[#F5D5D5]',
        iconColor: 'text-[#8B3A3A]',
        items: [
            { title: 'Ghost placements', desc: 'Registering without actually training risks failure when supervisors visit.' },
            { title: 'Backdated logbooks', desc: 'Identical handwriting/ink across months is obvious to examiners.' },
            { title: 'Missing stamps and signatures', desc: 'Unstamped forms and unsigned logbooks get rejected at submission.' },
            { title: 'Late submission', desc: 'Late reports attract penalties or outright rejection — bind early.' }
        ]
    }
]

const filteredCategories = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return categories
    return categories
        .map(c => ({
            ...c,
            items: c.items.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.desc.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q)
            )
        }))
        .filter(c => c.items.length > 0)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

.font-heading {
    font-family: 'Lora', Georgia, serif;
    letter-spacing: -0.01em;
}
</style>
