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
                    <h1 class="font-heading text-xl lg:text-2xl font-semibold truncate">Aspirant / Admission Hub</h1>
                </div>
            </div>
        </div>

        <div class="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
            <div class="bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-60 h-60 bg-[#2F6F5E]/20 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <h2 class="font-heading text-2xl lg:text-4xl font-semibold mb-2">I'm an Aspirant</h2>
                    <p class="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
                        Everything from choosing OOU to clearance — requirements, aggregate, CAPS and the mistakes that cost admission.
                        Always confirm cut-offs and dates on the OOU portal and JAMB brochure.
                    </p>
                    <div class="relative mt-4 max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input v-model="query" type="text" placeholder="Search courses, CAPS, aggregate, cut-off..."
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
                <p class="text-[#8B95A0]">No admission topics match "{{ query }}"</p>
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
        id: 'courses',
        short: 'Courses',
        title: 'Courses available at OOU',
        desc: 'OOU runs programmes across Arts, Education, Law, Science, Social & Management Sciences, Engineering, Pharmacy, Medicine and related faculties. Confirm the current list on the portal — departments change per session.',
        icon: 'bi-grid',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'OOU portal programme list, JAMB brochure.',
        items: [
            { title: 'Check the official programme list first', desc: 'Search your intended course on the OOU portal before buying the JAMB form — course names and faculties determine your subject combination.', tag: 'Step 1' },
            { title: 'Competitive vs less-competitive courses', desc: 'Medicine, Law, Pharmacy, Nursing and Engineering typically need the highest aggregates. Have a realistic second choice within the same faculty.', tag: 'Strategy' },
            { title: 'Professional accreditation', desc: 'For Law, Medicine, Pharmacy, Nursing and Engineering, confirm council accreditation status for the current session.', tag: 'Verify' }
        ]
    },
    {
        id: 'utme',
        short: 'UTME',
        title: 'UTME requirements',
        desc: 'What JAMB expects before OOU can admit you.',
        icon: 'bi-pencil',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'JAMB brochure, caps.jamb.gov.ng.',
        items: [
            { title: 'Choose OOU as first choice', desc: 'OOU generally considers first-choice candidates for Post-UTME. If OOU was second choice, do a change of institution early.', tag: 'Choice' },
            { title: 'Meet the minimum UTME score', desc: 'OOU announces a minimum UTME score each session (commonly around the national benchmark) plus higher departmental cut-offs.', tag: 'Score' },
            { title: 'Correct subject combination', desc: 'Use the JAMB brochure for your course — e.g. Sciences need English + Maths + two science subjects; wrong combos disqualify you.', tag: 'Combo' }
        ]
    },
    {
        id: 'olevel',
        short: "O'Level",
        title: "O'Level requirements",
        desc: 'WAEC, NECO or NABTEB — five credits including English, usually Mathematics.',
        icon: 'bi-file-earmark-check',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'JAMB brochure per course, OOU screening guidelines.',
        items: [
            { title: 'Five credits in relevant subjects', desc: 'Most OOU courses require 5 credits at not more than two sittings, including English Language and course-relevant subjects.', tag: 'Credits' },
            { title: 'Awaiting result rules', desc: 'If using awaiting result, declare it honestly at screening and upload the result immediately after release.', tag: 'AR' },
            { title: 'Two sittings vs one sitting', desc: 'Competitive courses (Medicine, Law, Pharmacy) often prefer one sitting — check the departmental note.', tag: 'Note' }
        ]
    },
    {
        id: 'postutme',
        short: 'Post-UTME',
        title: 'Post-UTME requirements & aggregate',
        desc: 'How OOU screening and aggregate scores work.',
        icon: 'bi-calculator',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'OOU Post-UTME portal announcements.',
        items: [
            { title: 'Screening registration documents', desc: 'JAMB reg. number, O\u2019level details, passport photo, valid email and phone number. Print your screening slip.', tag: 'Docs' },
            { title: 'How to calculate aggregate (typical pattern)', desc: 'A common pattern: UTME counts 50%, Post-UTME 30%, O\u2019level grades 20% — but OOU\u2019s exact weighting changes per session, so use the screening guideline for your year.', tag: 'Formula' },
            { title: 'Previous / current cut-off information', desc: 'Departmental cut-offs from last session are a guide, not a promise. Competitive departments move several points yearly — aim 10+ marks above last year\u2019s cut-off.', tag: 'Cut-off' }
        ]
    },
    {
        id: 'status',
        short: 'Status & CAPS',
        title: 'Admission status, CAPS & change of institution',
        desc: 'Where to check and what to click.',
        icon: 'bi-patch-check',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'caps.jamb.gov.ng, OOU admission portal.',
        items: [
            { title: 'How to check admission status', desc: 'Check BOTH the OOU portal and JAMB CAPS. Admission on one without the other is incomplete.', tag: 'Check' },
            { title: 'JAMB CAPS: accept or reject', desc: 'On CAPS, click Accept once offered. Ignoring the offer can void it. Print your JAMB admission letter afterwards.', tag: 'CAPS' },
            { title: 'Change of institution / course', desc: 'Done on the JAMB portal (with a fee) within the sale window. Reprint your slip and re-register for OOU screening if required.', tag: 'COI' }
        ]
    },
    {
        id: 'acceptance',
        short: 'Acceptance',
        title: 'Acceptance fee, verification & registration',
        desc: 'From offer to matric number.',
        icon: 'bi-card-checklist',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'OOU acceptance/clearance notices, academic affairs.',
        items: [
            { title: 'Acceptance fee', desc: 'Pay within the stated window on the OOU portal only. Missing it can forfeit the admission.', tag: 'Pay early' },
            { title: 'Physical verification', desc: 'Present originals: JAMB result, O\u2019level, birth certificate, LGA identification, acceptance receipt and passport photos.', tag: 'Clearance' },
            { title: 'Registration & matric number', desc: 'Pay school fees, register courses, and collect your matric number before lectures and matriculation.', tag: 'Final step' }
        ]
    },
    {
        id: 'mistakes',
        short: 'Mistakes',
        title: 'Common admission mistakes',
        desc: 'These cost aspirants their slot every year.',
        icon: 'bi-exclamation-triangle',
        bg: 'from-[#FBE4E4] to-[#F5D5D5]',
        iconColor: 'text-[#8B3A3A]',
        items: [
            { title: 'Wrong JAMB subject combination', desc: 'The #1 killer — verify against the brochure for your exact OOU course before the exam.' },
            { title: 'Ignoring CAPS', desc: 'Admission offered but never accepted on CAPS expires.' },
            { title: 'Fake portals and agents', desc: 'Pay and register only on official OOU/JAMB portals. No agent can "upgrade" your score.' },
            { title: 'Late uploads', desc: 'O\u2019level upload delays on JAMB portal block screening and admission.' }
        ]
    },
    {
        id: 'faq',
        short: 'FAQ',
        title: 'Aspirant FAQ',
        desc: 'Quick answers to repeated questions.',
        icon: 'bi-question-circle',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        items: [
            { title: 'Does OOU accept second choice?', desc: 'Generally prioritise first choice — switch to first choice via change of institution if serious about OOU.' },
            { title: 'Can I combine WAEC and NECO?', desc: 'Usually yes at two sittings, except departments that insist on one sitting.' },
            { title: 'What if my course is full?', desc: 'Watch for supplementary/shopping lists and be ready with an acceptable alternative course.' },
            { title: 'When do lectures start for freshers?', desc: 'After clearance and matriculation — follow the academic calendar, not rumours.' }
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
