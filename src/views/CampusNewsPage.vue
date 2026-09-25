<template>
    <div class="min-h-screen bg-[#F7F5F0]">
        <!-- Header -->
        <div class="bg-[#1C2B39] text-white sticky top-0 z-40 shadow-sm">
            <div class="px-4 lg:px-12 py-4 flex items-center gap-3">
                <button @click="goBack"
                    class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Back">
                    <i class="bi bi-arrow-left text-lg"></i>
                </button>
                <div class="min-w-0">
                    <p class="text-[#C6862E] text-[11px] font-semibold uppercase tracking-wide">Discover · Hub</p>
                    <h1 class="font-heading text-xl lg:text-2xl font-semibold truncate">Campus News & Announcements</h1>
                </div>
            </div>
        </div>

        <div class="px-4 lg:px-12 py-4 lg:py-8 pb-24 lg:pb-12 max-w-6xl mx-auto">
            <!-- Intro + search -->
            <div class="bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-6 lg:p-10 text-white shadow-lg mb-4 lg:mb-6 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-60 h-60 bg-[#C6862E]/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <h2 class="font-heading text-2xl lg:text-4xl font-semibold mb-2">OOU & Nigeria student updates in one place</h2>
                    <p class="text-sm lg:text-base text-white/70 max-w-2xl leading-relaxed">
                        Official announcements, admissions, calendar, scholarships and NYSC guidance.
                        Always confirm dates on the OOU portal and notice boards — this hub summarises what to check.
                    </p>
                    <div class="relative mt-4 max-w-xl">
                        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input v-model="query" type="text" placeholder="Search announcements, deadlines, scholarships..."
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

            <!-- Deadline reminders banner -->
            <div class="bg-[#FBF3E4] border border-[#E4D9CC] rounded-2xl p-5 lg:p-6 mb-4 lg:mb-6 flex gap-4">
                <div class="w-11 h-11 rounded-xl bg-[#C6862E] flex items-center justify-center flex-shrink-0">
                    <i class="bi bi-alarm text-xl text-[#1C2B39]"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-[#1C2B39]">Important deadline reminders</h3>
                    <ul class="text-sm text-[#5B6672] mt-1.5 space-y-1 leading-relaxed">
                        <li>· Course registration & school-fees deadlines come before exams — pay and register early.</li>
                        <li>· Post-UTME screening has a short window — check OOU portal + JAMB CAPS regularly.</li>
                        <li>· Final-year clearance, NYSC mobilisation and JAMB regularisation have strict cut-offs.</li>
                    </ul>
                </div>
            </div>

            <div v-if="filteredCategories.length === 0" class="bg-white border border-[#E4E0D8] rounded-2xl p-10 text-center">
                <p class="text-[#8B95A0]">No announcements match "{{ query }}"</p>
            </div>

            <!-- Category sections -->
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

            <!-- OOU + Nigeria essentials -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div class="bg-white border border-[#E4E0D8] rounded-2xl p-5 lg:p-8">
                    <h3 class="font-semibold text-lg text-[#1C2B39] mb-1">OOU student essentials</h3>
                    <p class="text-sm text-[#8B95A0] mb-4">Olabisi Onabanjo University, Ago-Iwoye, Ogun State</p>
                    <ul class="text-sm text-[#5B6672] space-y-2.5 leading-relaxed">
                        <li><i class="bi bi-globe text-[#C6862E] mr-2"></i>Official portal: <span class="font-medium text-[#1C2B39]">oouagoiwoye.edu.ng</span> — admission lists, fees, registration, results.</li>
                        <li><i class="bi bi-envelope text-[#C6862E] mr-2"></i>Use your OOU student email for official complaints and clearance.</li>
                        <li><i class="bi bi-building text-[#C6862E] mr-2"></i>Faculties include Arts, Education, Law, Science, Social Sciences, Management Sciences, Engineering, Pharmacy, Medicine, Environmental Studies — confirm departmental notices on faculty boards.</li>
                        <li><i class="bi bi-card-checklist text-[#C6862E] mr-2"></i>Keep printed + digital copies of admission letter, school-fee receipts, course forms and ID card.</li>
                        <li><i class="bi bi-shield-check text-[#C6862E] mr-2"></i>Beware of fake admission/fee links — pay only via the official OOU portal.</li>
                    </ul>
                </div>
                <div class="bg-white border border-[#E4E0D8] rounded-2xl p-5 lg:p-8">
                    <h3 class="font-semibold text-lg text-[#1C2B39] mb-1">Nigeria students essentials</h3>
                    <p class="text-sm text-[#8B95A0] mb-4">Applies to OOU and all Nigerian tertiary students</p>
                    <ul class="text-sm text-[#5B6672] space-y-2.5 leading-relaxed">
                        <li><i class="bi bi-patch-check text-[#2F6F5E] mr-2"></i>JAMB CAPS: accept admission on <span class="font-medium text-[#1C2B39]">caps.jamb.gov.ng</span> or risk losing the slot.</li>
                        <li><i class="bi bi-bank text-[#2F6F5E] mr-2"></i>NELFUND student loan: check eligibility and application windows on the official NELFUND portal.</li>
                        <li><i class="bi bi-award text-[#2F6F5E] mr-2"></i>Scholarships: PTDF, MTN Foundation, NNPC/TotalEnergies, state bursaries — watch eligibility (CGPA, level, indigene status).</li>
                        <li><i class="bi bi-person-badge text-[#2F6F5E] mr-2"></i>NYSC: JAMB regularisation, correct name/DOB on certificates, and Senate-list appearance are required for mobilisation.</li>
                        <li><i class="bi bi-file-earmark-text text-[#2F6F5E] mr-2"></i>WAEC/NECO O'level: keep original result checker cards and ensure 5-credit requirements for your course.</li>
                    </ul>
                </div>
            </div>
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
        id: 'official',
        short: 'Official',
        title: 'OOU official announcements',
        desc: 'Management-approved notices every OOU student should follow.',
        icon: 'bi-megaphone',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'OOU portal (oouagoiwoye.edu.ng), faculty notice boards, official OOU social handles.',
        items: [
            { title: 'Resumption & lecture notices', desc: 'Resumption dates, lecture schedules and public-holiday adjustments are published by management each semester.', tag: 'All students' },
            { title: 'School-fees & payment notices', desc: 'Approved fee schedules, payment channels and late-payment penalties. Pay only through the official portal.', tag: 'Fees' },
            { title: 'Security & conduct notices', desc: 'Campus security advisories, dress-code and conduct rules, and sanctions for examination malpractice.', tag: 'Conduct' },
            { title: 'Convocation ceremonies', desc: 'Convocation programmes, gown collection and guest arrangements for graduating sets.', tag: 'Events' }
        ]
    },
    {
        id: 'admission',
        short: 'Admission',
        title: 'Admission updates',
        desc: 'For aspirants and newly admitted OOU students.',
        icon: 'bi-mortarboard',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'OOU admission portal, JAMB CAPS, departmental cut-off notices.',
        items: [
            { title: 'Merit & supplementary lists', desc: 'Check your admission status on both the OOU portal and JAMB CAPS; accept the offer on CAPS promptly.', tag: 'Aspirants' },
            { title: 'Acceptance fee & clearance', desc: 'Pay acceptance fees within the stated window and complete physical/digital clearance with original documents.', tag: 'Freshers' },
            { title: 'Change of course / transfer', desc: 'Inter-departmental transfer windows and requirements are announced per session — meet the CGPA cut-off.', tag: 'Notice' },
            { title: 'Direct Entry admissions', desc: 'DE applicants should verify OND/HND/NCE/IJMB requirements for their chosen OOU programme.', tag: 'DE' }
        ]
    },
    {
        id: 'postutme',
        short: 'Post-UTME',
        title: 'Post-UTME announcements',
        desc: 'Screening registration, dates and requirements.',
        icon: 'bi-pencil-square',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'OOU Post-UTME portal, JAMB brochure for subject combinations.',
        items: [
            { title: 'Screening registration', desc: 'Register with JAMB reg. number, O\u2019level results and a valid email/phone. Upload results correctly.', tag: 'Registration' },
            { title: 'Eligibility & cut-off', desc: 'OOU sets a minimum UTME score per session plus departmental cut-offs — confirm before paying.', tag: 'Cut-off' },
            { title: 'Screening date & venue', desc: 'Print your screening slip; attend with original credentials and arrive early.', tag: 'Exam day' },
            { title: 'Result & aggregate', desc: 'Screening scores are combined with UTME and O\u2019level grades — check your aggregate on the portal.', tag: 'Results' }
        ]
    },
    {
        id: 'registration',
        short: 'Registration',
        title: 'Registration deadlines',
        desc: 'Missing these blocks exams and results — treat them as hard deadlines.',
        icon: 'bi-calendar-check',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'OOU student portal, departmental course advisers.',
        items: [
            { title: 'Course registration', desc: 'Register all courses (core, required, elective) each semester and print your course form.', tag: 'Every semester' },
            { title: 'Add & drop window', desc: 'Correct wrong course codes within the add/drop period — afterwards changes attract penalties.', tag: 'Correction' },
            { title: 'School-fees deadline', desc: 'Unpaid fees usually block course registration, exam dockets and result checking.', tag: 'Fees' },
            { title: 'Late registration penalty', desc: 'Late windows attract extra charges and can disqualify you from that semester\u2019s exams.', tag: 'Penalty' }
        ]
    },
    {
        id: 'matriculation',
        short: 'Matric & Graduation',
        title: 'Matriculation / graduation information',
        desc: 'Entry and exit milestones for OOU students.',
        icon: 'bi-flag',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'OOU academic affairs, faculty officers, convocation brochure.',
        items: [
            { title: 'Matriculation ceremony', desc: 'Freshers take the matriculation oath; gowns and matric numbers are issued ahead of the event.', tag: 'Freshers' },
            { title: 'Final clearance', desc: 'Finalists clear library, bursary, department, faculty and student affairs before results are released.', tag: 'Finalists' },
            { title: 'Statement of result & certificates', desc: 'Apply for notification of results first; original certificates follow after Senate approval.', tag: 'Graduates' },
            { title: 'Transcript requests', desc: 'Request transcripts early for jobs, NYSC-exempt documentation or postgraduate applications.', tag: 'Admin' }
        ]
    },
    {
        id: 'calendar',
        short: 'Calendar',
        title: 'Academic calendar',
        desc: 'The session roadmap — plan hostel, fees and reading around it.',
        icon: 'bi-calendar3',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'OOU Senate-approved academic calendar per session.',
        items: [
            { title: 'Semester structure', desc: 'First and second semesters with lecture weeks, revision week, exams and marking/break periods.', tag: 'Session' },
            { title: 'Tests & continuous assessment', desc: 'CA tests, assignments and practicals run mid-semester and count toward final grades.', tag: 'CA' },
            { title: 'Examination periods', desc: 'Exam timetables, dockets and ID requirements are released before each exam diet.', tag: 'Exams' },
            { title: 'SIWES / holidays', desc: 'Long vacations accommodate SIWES for eligible programmes; confirm your department\u2019s schedule.', tag: 'Breaks' }
        ]
    },
    {
        id: 'faculty',
        short: 'Faculties',
        title: 'Faculty / department announcements',
        desc: 'Your department board often matters more than the general portal.',
        icon: 'bi-building',
        bg: 'from-[#FBF3E4] to-[#F5E6C8]',
        iconColor: 'text-[#C6862E]',
        source: 'Faculty and departmental notice boards, class representatives, course lecturers.',
        items: [
            { title: 'Lecture & venue changes', desc: 'Room swaps, timetable adjustments and cancelled classes are posted at department level.', tag: 'Timetable' },
            { title: 'Departmental dues & associations', desc: 'Faculty/student association dues, dinners, jerseys and academic week events.', tag: 'Dues' },
            { title: 'Project & supervisor lists', desc: 'Final-year supervisor allocations, project defence schedules and formatting guidelines.', tag: 'Projects' },
            { title: 'Pharmacy, Law, Medicine & Engineering boards', desc: 'Professional programmes add council/exam requirements — follow your faculty officer closely.', tag: 'Professional' }
        ]
    },
    {
        id: 'scholarships',
        short: 'Scholarships',
        title: 'Scholarships',
        desc: 'Free money with deadlines — track these alongside school fees.',
        icon: 'bi-gift',
        bg: 'from-[#E9F2EF] to-[#D4E8E1]',
        iconColor: 'text-[#2F6F5E]',
        source: 'Donor portals (MTN, NNPC, PTDF), Ogun State bursary board, OOU student affairs.',
        items: [
            { title: 'Federal & state bursaries', desc: 'Ogun State bursary and federal scholarship board awards — indigene proof and CGPA often required.', tag: 'Government' },
            { title: 'Corporate scholarships', desc: 'MTN Foundation, NNPC/TotalEnergies, Shell, Agbami and similar schemes with yearly application windows.', tag: 'Corporate' },
            { title: 'NELFUND upkeep & institutional charges', desc: 'The national student loan covers charges plus upkeep in phases — apply on the official NELFUND portal only.', tag: 'Loan' },
            { title: 'Departmental prizes', desc: 'Best-student and faculty prizes are announced after Senate-approved results each session.', tag: 'Merit' }
        ]
    },
    {
        id: 'nysc',
        short: 'NYSC',
        title: 'NYSC-related information',
        desc: 'Start preparing from 300 level — errors delay mobilisation by a full batch.',
        icon: 'bi-person-badge',
        bg: 'from-[#EFEAE0] to-[#E4D9CC]',
        iconColor: 'text-[#1C2B39]',
        source: 'NYSC portal, OOU student affairs / DSA, JAMB regularisation portal.',
        items: [
            { title: 'Senate-list mobilisation', desc: 'Your name must appear on the NYSC Senate list exactly as on your certificate — confirm spelling and matric number.', tag: 'Mobilisation' },
            { title: 'JAMB regularisation', desc: 'DE, transfer and remedial entrants often need JAMB regularisation before NYSC approval.', tag: 'JAMB' },
            { title: 'Call-up letter & camp', desc: 'Print call-up letters and green cards; report to camp with originals plus photocopies.', tag: 'Camp' },
            { title: 'Exemptions & exclusions', desc: 'Over-30 graduates and part-time programmes receive exemption/exclusion letters instead of call-ups.', tag: 'Letters' }
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
