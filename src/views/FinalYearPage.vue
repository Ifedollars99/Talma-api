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
                    <h1 class="font-heading text-xl lg:text-2xl font-semibold truncate">Final-Year Hub</h1>
                </div>
            </div>
        </div>

        <div class="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-60 h-60 bg-[#2F6F5E]/20 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <h2 class="font-heading text-2xl lg:text-4xl font-semibold mb-2">I'm a Final-Year Student</h2>
                    <p class="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
                        Topic to defence — proposal, chapters, documentation, implementation and viva prep for OOU finalists.
                        Your department's project handbook overrides everything here.
                    </p>
                    <div class="relative mt-4 max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input v-model="query" type="text" placeholder="Search proposal, chapters, UML, defence..."
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
                <p class="text-[#8B95A0]">No final-year topics match "{{ query }}"</p>
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
        id: 'topic',
        short: 'Topic',
        title: 'Final-year project & choosing a topic',
        desc: 'A good topic is narrow, measurable and completable in one session.',
        icon: 'bi-lightbulb',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'Departmental project handbook, supervisor guidance.',
        items: [
            { title: 'How to choose a project topic', desc: 'Pick a real problem in your field, confirm data/system access, and check that past students have not exhausted it. Clear it with your supervisor before writing.', tag: 'Step 1' },
            { title: 'Project proposal', desc: 'Problem statement, objectives, scope, methodology and expected outcome — usually 3–5 pages for approval.' },
            { title: 'Department-specific requirements', desc: 'Every OOU department sets its own format, chapter count, citation style and defence rules — get the handbook first.' }
        ]
    },
    {
        id: 'chapters',
        short: 'Chapters',
        title: 'Chapters 1 – 5 & literature review',
        desc: 'The classic Nigerian undergraduate structure.',
        icon: 'bi-book',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        items: [
            { title: 'Chapter 1 — Introduction', desc: 'Background, problem statement, objectives, research questions, significance, scope and definitions.' },
            { title: 'Chapter 2 — Literature review', desc: 'Review related works, identify gaps your project fills, and organise thematically — not as random summaries.' },
            { title: 'Chapter 3 — Methodology', desc: 'Research design, data collection, system analysis/design method, tools and procedures.' },
            { title: 'Chapter 4 — Results / implementation', desc: 'Present findings, system screenshots, tables and analysis tied back to your objectives.' },
            { title: 'Chapter 5 — Summary & conclusion', desc: 'Summary, conclusion, recommendations and suggestions for further work.' }
        ]
    },
    {
        id: 'research',
        short: 'Research',
        title: 'Referencing, questionnaire & documentation',
        desc: 'Where many projects lose marks silently.',
        icon: 'bi-journal-check',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        items: [
            { title: 'Referencing', desc: 'Use your department\u2019s style (commonly APA) consistently for in-text citations and the reference list. Uncited work risks plagiarism penalties.' },
            { title: 'Questionnaire', desc: 'Keep questions short, neutral and tied to objectives. Pilot-test with a few respondents before mass distribution.' },
            { title: 'Project documentation', desc: 'Title page, abstract, certification, dedication, acknowledgement, table of contents, lists of tables/figures, references and appendices.' }
        ]
    },
    {
        id: 'system',
        short: 'System',
        title: 'System design, UML, implementation & testing',
        desc: 'For computing, engineering and technology projects.',
        icon: 'bi-cpu',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        items: [
            { title: 'System design', desc: 'Architecture, database schema, input/output design and module breakdown.' },
            { title: 'UML', desc: 'Use-case, class and sequence/activity diagrams to show how the system works before you code.' },
            { title: 'Implementation', desc: 'Tools, languages and hardware/software requirements plus key code modules and screenshots.' },
            { title: 'Testing', desc: 'Unit, integration and user-acceptance tests with test cases and results tables.' }
        ]
    },
    {
        id: 'defence',
        short: 'Defence',
        title: 'Project defence & common mistakes',
        desc: 'Defend what YOU did with confidence.',
        icon: 'bi-mic',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        items: [
            { title: 'Project defence prep', desc: 'Prepare 10–15 slides: problem, objectives, method, results, conclusion. Rehearse likely questions on your methodology and findings.' },
            { title: 'Common mistakes', desc: 'Copied projects, inconsistent chapters, fake data, missing references, unreadable screenshots and late binding.' },
            { title: 'After defence corrections', desc: 'Implement panel corrections immediately and get your supervisor\u2019s sign-off before final submission and clearance.' }
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
