<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center mb-2 gap-3 flex-wrap">
            <h2 class="font-heading text-3xl font-semibold text-[#1C2B39]">My Courses</h2>
            <button @click="showAddFacultyModal = true"
                class="bg-[#C6862E] text-[#1C2B39] px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#B37726] hover:text-white transition-colors font-medium">
                <i class="bi bi-plus-circle text-lg"></i>
                <span class="text-base">Add Faculty</span>
            </button>
        </div>

        <!-- Search -->
        <div class="relative max-w-xl">
            <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A0]"></i>
            <input v-model="searchQuery" type="text" placeholder="Search faculties, departments, levels, courses…"
                class="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E4E0D8] rounded-xl text-[15px] text-[#1C2B39] placeholder-[#8B95A0] focus:outline-none focus:ring-2 focus:ring-[#C6862E]" />
            <button v-if="searchQuery" @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A0] hover:text-[#1C2B39]">
                <i class="bi bi-x-circle"></i>
            </button>
        </div>

        <!-- Breadcrumb -->
        <p class="text-sm text-[#8B95A0]">
            <span class="font-medium text-[#1C2B39]">{{ selectedCountry.name }}</span>
            <span class="mx-1">/</span>
            <span class="font-medium text-[#1C2B39]">{{ selectedUniversity.fullName }}</span>
            <span class="mx-1">/</span>
            <span class="font-medium text-[#1C2B39]">{{ selectedCampus.name }} ({{ selectedCampus.location }})</span>
        </p>

        <!-- Level 1: Countries -->
        <div>
            <p class="text-xs font-semibold text-[#8B95A0] uppercase tracking-wide mb-2">Country</p>
            <div class="flex gap-2 flex-wrap">
                <button v-for="country in catalog" :key="country.id" @click="selectCountry(country.id)"
                    :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-[15px] transition-colors',
                        selectedCountryId === country.id
                            ? 'bg-[#1C2B39] text-white border-[#1C2B39]'
                            : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                    <span class="text-lg">{{ country.flag }}</span>
                    <span>{{ country.name }}</span>
                    <span class="text-xs opacity-70">{{ country.universities.length }} schools</span>
                </button>
            </div>
        </div>

        <!-- Level 2: Universities -->
        <div>
            <p class="text-xs font-semibold text-[#8B95A0] uppercase tracking-wide mb-2">Schools in {{ selectedCountry.name }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <button v-for="uni in selectedCountry.universities" :key="uni.id" @click="selectUniversity(uni.id)"
                    :class="['text-left rounded-xl border p-4 transition-all',
                        selectedUniversityId === uni.id
                            ? 'bg-[#1C2B39] text-white border-[#1C2B39] shadow-md'
                            : 'bg-white border-[#E4E0D8] hover:border-[#C6862E] hover:shadow-sm']">
                    <div class="flex items-center gap-3">
                        <div :class="['w-11 h-11 rounded-xl flex items-center justify-center font-heading font-semibold text-lg flex-shrink-0',
                            selectedUniversityId === uni.id ? 'bg-[#C6862E] text-[#1C2B39]' : 'bg-[#FBF3E4] text-[#C6862E]']">
                            {{ uni.name.charAt(0) }}
                        </div>
                        <div class="min-w-0">
                            <p class="font-semibold text-[15px] leading-tight">{{ uni.name }}</p>
                            <p :class="['text-xs truncate', selectedUniversityId === uni.id ? 'text-white/60' : 'text-[#8B95A0]']">{{ uni.fullName }}</p>
                        </div>
                    </div>
                    <div :class="['flex gap-3 mt-3 text-xs', selectedUniversityId === uni.id ? 'text-white/70' : 'text-[#8B95A0]']">
                        <span><i class="bi bi-geo-alt mr-1"></i>{{ uni.campuses.length }} {{ uni.campuses.length === 1 ? 'campus' : 'campuses' }}</span>
                        <span><i class="bi bi-book mr-1"></i>{{ countUniversityCourses(uni) }} courses</span>
                    </div>
                </button>
            </div>
        </div>

        <!-- Level 3: Branches / Campuses -->
        <div v-if="selectedUniversity.campuses.length > 1">
            <p class="text-xs font-semibold text-[#8B95A0] uppercase tracking-wide mb-2">{{ selectedUniversity.name }} branches</p>
            <div class="flex gap-2 overflow-x-auto pb-1">
                <button v-for="campus in selectedUniversity.campuses" :key="campus.id" @click="selectCampus(campus.id)"
                    :class="['flex-shrink-0 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors',
                        selectedCampusId === campus.id
                            ? 'bg-[#C6862E] text-[#1C2B39] border-[#C6862E]'
                            : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                    {{ campus.name }} · {{ campus.location }}
                </button>
            </div>
        </div>

        <!-- Level 4: Faculties → Departments → Levels → Courses -->
        <div>
            <p class="text-xs font-semibold text-[#8B95A0] uppercase tracking-wide mb-2">
                Faculties at {{ selectedUniversity.name }} — {{ selectedCampus.name }}
            </p>
            <div v-if="filteredFaculties.length === 0" class="bg-white rounded-xl border border-[#E4E0D8] p-10 text-center">
                <p class="text-[#8B95A0]">No faculties match "{{ searchQuery }}"</p>
            </div>
            <div class="space-y-4">
                <div v-for="faculty in filteredFaculties" :key="faculty.id"
                    class="bg-white rounded-xl border border-[#E4E0D8] overflow-hidden">

                    <!-- Faculty Header -->
                    <div @click="toggleFaculty(faculty.id)"
                        class="p-5 cursor-pointer hover:bg-[#F7F5F0] flex items-center justify-between transition-colors">
                        <div class="flex items-center space-x-3">
                            <i :class="['bi text-xl text-[#1C2B39]', expandedFaculty === faculty.id ? 'bi-chevron-down' : 'bi-chevron-right']"></i>
                            <h3 class="text-xl font-semibold text-[#1C2B39]">{{ faculty.name }}</h3>
                            <span class="bg-[#FBF3E4] text-[#C6862E] text-sm px-3 py-1 rounded-full font-medium">
                                {{ faculty.departments.length }} departments
                            </span>
                        </div>
                    </div>

                    <!-- Departments (Collapsible) -->
                    <transition name="expand">
                        <div v-if="expandedFaculty === faculty.id" class="border-t border-[#E4E0D8]">
                           <div v-for="department in faculty.departments" :key="department.id"
                                class="border-b border-[#E4E0D8] last:border-b-0">

                                <!-- Department Header -->
                                <div @click="toggleDepartment(faculty.id, department.id)"
                                    class="p-5 pl-12 cursor-pointer hover:bg-[#F0EDE6] flex items-center justify-between bg-[#F7F5F0] transition-colors">
                                    <div class="flex items-center space-x-3">
                                        <i :class="['bi text-lg text-[#2F6F5E]', expandedDepartment[faculty.id] === department.id ? 'bi-folder-open' : 'bi-folder']"></i>
                                        <h4 class="text-lg font-semibold text-[#1C2B39]">{{ department.name }}</h4>
                                        <span class="bg-[#E9F2EF] text-[#2F6F5E] text-xs px-2 py-1 rounded-full font-medium">
                                            {{ countDepartmentCourses(department) }} courses
                                        </span>
                                    </div>
                                </div>

                                <!-- Level picker (Collapsible) -->
                                <transition name="expand">
                                    <div v-if="expandedDepartment[faculty.id] === department.id" class="bg-white">
                                        <div class="px-5 lg:px-8 py-3 pl-16 lg:pl-20 bg-[#FBFAF6] border-b border-[#E4E0D8] flex items-center gap-2 flex-wrap">
                                            <button v-for="level in department.levels" :key="level.id" @click="selectLevel(department.id, level.id)"
                                                :class="['px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                                                    activeLevelId(department) === level.id
                                                        ? 'bg-[#1C2B39] text-white border-[#1C2B39]'
                                                        : 'bg-white text-[#5B6672] border-[#E4E0D8] hover:border-[#C6862E]']">
                                                {{ level.label }}
                                            </button>
                                            <span class="ml-auto text-xs text-[#8B95A0]">{{ activeLevel(department).courses.length }} courses</span>
                                            <button @click="showAddCourseModal(faculty.id, department.id, activeLevelId(department))"
                                                class="text-[#C6862E] hover:text-[#B37726] text-sm flex items-center space-x-1 font-medium">
                                                <i class="bi bi-plus-circle"></i>
                                                <span>Add Course</span>
                                            </button>
                                        </div>
                                            <div v-for="course in activeLevel(department).courses" :key="course.id"
                                                class="p-5 pl-20 border-b border-[#E4E0D8] last:border-b-0 hover:bg-[#F7F5F0] transition-colors">

                                                <div class="flex items-start justify-between">
                                                    <div class="flex-1">
                                                        <div class="flex items-center gap-2 flex-wrap mb-2">
                                                            <span v-if="course.code" class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#1C2B39] text-white tracking-wide">{{ course.code }}</span>
                                                            <h5 class="font-semibold text-[#1C2B39] text-base">{{ course.title }}</h5>
                                                        </div>
                                                        <div class="space-y-1 text-sm text-[#5B6672]">
                                                            <p><i class="bi bi-person mr-2"></i>{{ course.lecturer }}</p>
                                                            <p><i class="bi bi-people mr-2"></i>{{ course.students }} students</p>
                                                            <p class="text-[#8B95A0]"><i class="bi bi-clock mr-2"></i>Updated {{ course.lastUpdate }}</p>
                                                        </div>
                                                    </div>
                                                    <div class="flex space-x-2 ml-4">
                                                        <button @click="downloadCourse(course)"
                                                            class="bg-[#1C2B39] text-white p-2 rounded-lg hover:bg-[#24384A] transition-colors"
                                                            title="Download Course">
                                                            <i class="bi bi-download text-lg"></i>
                                                        </button>
                                                        <button @click="viewCourse(course)"
                                                            class="bg-[#2F6F5E] text-white p-2 rounded-lg hover:bg-[#265A4C] transition-colors"
                                                            title="View Course">
                                                            <i class="bi bi-eye text-lg"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Empty level state -->
                                            <div v-if="activeLevel(department).courses.length === 0"
                                                class="p-5 pl-20 text-center text-[#8B95A0]">
                                                <p>No courses yet. <button @click="showAddCourseModal(faculty.id, department.id, activeLevelId(department))"
                                                    class="text-[#C6862E] hover:underline font-medium">Add one now!</button></p>
                                            </div>
                                        </div>
                                    </transition>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <!-- Success Message -->
        <transition name="fade">
            <div v-if="showSuccessMessage"
                class="fixed top-4 right-4 bg-[#2F6F5E] text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
                <i class="bi bi-check-circle text-xl"></i>
                <span>{{ successMessage }}</span>
            </div>
        </transition>

        <!-- Add Faculty Modal -->
        <div v-if="showAddFacultyModal"
            class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-50 px-4">
            <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 class="font-heading text-2xl font-semibold text-[#1C2B39] mb-2">Add New Faculty</h2>
                <p class="text-sm text-[#8B95A0] mb-6">Adding to {{ selectedUniversity.name }} — {{ selectedCampus.name }}</p>
                <div>
                    <label class="block text-sm font-medium text-[#5B6672] mb-1">Faculty Name</label>
                    <input v-model="facultyFormData.name" type="text" placeholder="e.g. Faculty of Engineering"
                        class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                </div>
                <div class="flex space-x-3 mt-8">
                    <button @click="showAddFacultyModal = false"
                        class="flex-1 px-4 py-2.5 border border-[#E4E0D8] text-[#1C2B39] rounded-lg hover:bg-[#F7F5F0] transition-colors font-medium">
                        Cancel
                    </button>
                    <button @click="saveFaculty"
                        class="flex-1 px-4 py-2.5 bg-[#C6862E] text-[#1C2B39] rounded-lg hover:bg-[#B37726] hover:text-white transition-colors font-medium">
                        Add Faculty
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Course Modal -->
        <div v-if="showCourseModal"
            class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-50 px-4">
            <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 class="font-heading text-2xl font-semibold text-[#1C2B39] mb-6">Add New Course</h2>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-1">Course Title</label>
                        <input v-model="courseFormData.title" type="text" placeholder="Enter course title"
                            class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-1">Lecturer Name</label>
                        <input v-model="courseFormData.lecturer" type="text" placeholder="Enter lecturer name"
                            class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-1">Number of Students</label>
                        <input v-model.number="courseFormData.students" type="number" placeholder="0"
                            class="w-full border border-[#E4E0D8] rounded-lg px-4 py-2 outline-none focus:border-[#C6862E] transition-colors">
                    </div>
                </div>

                <div class="flex space-x-3 mt-8">
                    <button @click="closeCourseModal"
                        class="flex-1 px-4 py-2.5 border border-[#E4E0D8] text-[#1C2B39] rounded-lg hover:bg-[#F7F5F0] transition-colors font-medium">
                        Cancel
                    </button>
                    <button @click="saveCourse"
                        class="flex-1 px-4 py-2.5 bg-[#C6862E] text-[#1C2B39] rounded-lg hover:bg-[#B37726] hover:text-white transition-colors font-medium">
                        Add Course
                    </button>
                </div>
            </div>
        </div>

        <!-- Course View Modal with PDF Viewer -->
        <div v-if="viewCourseModal"
            class="fixed inset-0 bg-[#1C2B39]/60 flex items-center justify-center z-50 px-4">
            <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="flex justify-between items-start p-6 border-b border-[#E4E0D8]">
                    <div>
                        <h2 class="font-heading text-2xl font-semibold text-[#1C2B39]">{{ selectedCourse.title }}</h2>
                        <p class="text-[#5B6672] mt-1">{{ selectedCourse.lecturer }}</p>
                    </div>
                    <button @click="viewCourseModal = false" class="text-[#8B95A0] hover:text-[#1C2B39] transition-colors">
                        <i class="bi bi-x text-2xl"></i>
                    </button>
                </div>

                <!-- PDF Viewer -->
                <div class="flex-1 overflow-auto bg-[#F7F5F0]">
                    <div v-if="selectedCourse.pdfUrl" class="w-full h-full">
                        <iframe :src="selectedCourse.pdfUrl"
                            class="w-full h-full"
                            type="application/pdf"
                            allow="fullscreen"></iframe>
                    </div>
                    <div v-else class="flex items-center justify-center h-96 text-[#8B95A0]">
                        <p>No PDF available for this course</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-[#E4E0D8] p-6 bg-white flex justify-between items-center">
                    <div class="space-y-1 text-sm text-[#5B6672]">
                        <p><strong class="text-[#1C2B39]">Students:</strong> {{ selectedCourse.students }}</p>
                        <p><strong class="text-[#1C2B39]">Last Updated:</strong> {{ selectedCourse.lastUpdate }}</p>
                    </div>
                    <div class="flex space-x-3">
                        <button @click="downloadCourse(selectedCourse)"
                            class="bg-[#1C2B39] text-white px-4 py-2.5 rounded-lg hover:bg-[#24384A] transition-colors flex items-center space-x-2 font-medium">
                            <i class="bi bi-download"></i>
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, ref, defineEmits, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import { universityCatalog } from '../data/universities'

const emit = defineEmits(['course-added'])

defineProps({
    userRole: {
        type: String,
        required: true
    }
})

// Catalog browser state: Country → University → Campus → Faculties → Departments → Levels
const catalog = ref(universityCatalog)
const selectedCountryId = ref('nigeria')
const selectedUniversityId = ref('oou')
const selectedCampusId = ref('oou-main')
const searchQuery = ref('')

const selectedCountry = computed(
    () => catalog.value.find(c => c.id === selectedCountryId.value) || catalog.value[0]
)
const selectedUniversity = computed(
    () => selectedCountry.value.universities.find(u => u.id === selectedUniversityId.value)
        || selectedCountry.value.universities[0]
)
const selectedCampus = computed(
    () => selectedUniversity.value.campuses.find(c => c.id === selectedCampusId.value)
        || selectedUniversity.value.campuses[0]
)

const selectCountry = (id) => {
    selectedCountryId.value = id
    selectedUniversityId.value = selectedCountry.value.universities[0].id
    selectedCampusId.value = selectedCountry.value.universities[0].campuses[0].id
    resetExpanded()
}

const selectUniversity = (id) => {
    selectedUniversityId.value = id
    selectedCampusId.value = selectedUniversity.value.campuses[0].id
    resetExpanded()
}

const selectCampus = (id) => {
    selectedCampusId.value = id
    resetExpanded()
}

const resetExpanded = () => {
    expandedFaculty.value = null
    expandedDepartment.value = {}
    selectedLevel.value = {}
}

// Active level per department — the picked pill, falling back to the first level
// with courses (so search results never show an empty picker)
const activeLevel = (department) => {
    const levels = department.levels || []
    if (!levels.length) return { id: '', label: '', courses: [] }
    const picked = levels.find(l => l.id === selectedLevel.value[department.id])
    if (picked && (picked.courses.length > 0 || !searchQuery.value.trim())) return picked
    return levels.find(l => l.courses.length > 0) || levels[0]
}
const activeLevelId = (department) => activeLevel(department).id
const selectLevel = (departmentId, levelId) => {
    selectedLevel.value[departmentId] = levelId
}

const countLevelCourses = (level) => level.courses.length
const countDepartmentCourses = (dept) =>
    dept.levels.reduce((n, l) => n + countLevelCourses(l), 0)
const countCampusCourses = (campus) =>
    campus.faculties.reduce((n, f) =>
        n + f.departments.reduce((m, d) => m + countDepartmentCourses(d), 0), 0)
const countUniversityCourses = (uni) =>
    uni.campuses.reduce((n, cp) => n + countCampusCourses(cp), 0)

// Search filters faculties → departments → levels → courses within the selected campus
const filteredFaculties = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const faculties = selectedCampus.value.faculties
    if (!q) return faculties
    return faculties
        .map(f => ({
            ...f,
            departments: f.departments
                .map(d => ({
                    ...d,
                    levels: d.levels
                        .map(l => ({
                            ...l,
                            courses: l.courses.filter(course =>
                                course.title.toLowerCase().includes(q) ||
                                (course.code && course.code.toLowerCase().includes(q)) ||
                                l.label.toLowerCase().includes(q) ||
                                d.name.toLowerCase().includes(q) ||
                                f.name.toLowerCase().includes(q)
                            )
                        }))
                        .filter(l => l.courses.length > 0)
                }))
                .filter(d => d.levels.length > 0)
        }))
        .filter(f => f.departments.length > 0)
})

const expandedFaculty = ref(null)
const expandedDepartment = ref({})
const selectedLevel = ref({})
const showAddFacultyModal = ref(false)
const showCourseModal = ref(false)
const viewCourseModal = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')
const selectedCoursefaculty = ref(null)
const selectedCourseDepartment = ref(null)
const selectedCourseLevel = ref(null)
const selectedCourse = ref(null)

const facultyFormData = ref({ name: '' })

const courseFormData = ref({
    title: '',
    lecturer: '',
    students: 0
})

const toggleFaculty = (facultyId) => {
    expandedFaculty.value = expandedFaculty.value === facultyId ? null : facultyId
}

const toggleDepartment = (facultyId, departmentId) => {
    if (!expandedDepartment.value[facultyId]) {
        expandedDepartment.value[facultyId] = null
    }
    expandedDepartment.value[facultyId] = expandedDepartment.value[facultyId] === departmentId ? null : departmentId
}

const showAddCourseModal = (facultyId, departmentId, levelId) => {
    selectedCoursefaculty.value = facultyId
    selectedCourseDepartment.value = departmentId
    selectedCourseLevel.value = levelId
    showCourseModal.value = true
}

const closeCourseModal = () => {
    showCourseModal.value = false
    courseFormData.value = { title: '', lecturer: '', students: 0 }
}

const saveFaculty = () => {
    if (!facultyFormData.value.name.trim()) return
    selectedCampus.value.faculties.push({
        id: `custom-${Date.now()}`,
        name: facultyFormData.value.name.trim(),
        departments: []
    })
    facultyFormData.value = { name: '' }
    showAddFacultyModal.value = false
    successMessage.value = 'Faculty added successfully!'
    showSuccessMessage.value = true
    setTimeout(() => showSuccessMessage.value = false, 3000)
}

const saveCourse = () => {
    if (!courseFormData.value.title || !courseFormData.value.lecturer) {
        return
    }

    const faculty = selectedCampus.value.faculties.find(f => f.id === selectedCoursefaculty.value)
    const department = faculty.departments.find(d => d.id === selectedCourseDepartment.value)
    const level = department.levels.find(l => l.id === selectedCourseLevel.value)

    if (level.courses.length >= 5) {
        successMessage.value = 'Maximum 5 courses per level reached!'
        showSuccessMessage.value = true
        setTimeout(() => showSuccessMessage.value = false, 3000)
        return
    }

    const fileName = courseFormData.value.title.toLowerCase().replace(/\s+/g, '-') + '.pdf'

    const newCourse = {
        id: Date.now(),
        code: '',
        title: courseFormData.value.title,
        lecturer: courseFormData.value.lecturer,
        students: courseFormData.value.students,
        lastUpdate: 'just now',
        pdfUrl: null,
        fileName
    }

    level.courses.push(newCourse)
    emit('course-added', newCourse)

    // Fetch the public URL for the newly added course immediately
    const { data } = supabase
        .storage
        .from('courses')
        .getPublicUrl(newCourse.fileName)
    newCourse.pdfUrl = data.publicUrl

    successMessage.value = 'Course added successfully!'
    showSuccessMessage.value = true
    setTimeout(() => showSuccessMessage.value = false, 3000)

    closeCourseModal()
}

const viewCourse = (course) => {
    selectedCourse.value = course
    viewCourseModal.value = true
}

const pdfBase = () => (process.env.BASE_URL || '/') + 'course-pdfs/'

const downloadCourse = async (course) => {
    try {
        // Prefer the bundled catalog PDF; fall back to Supabase Storage uploads
        let blob = null
        if (course.pdfUrl) {
            const res = await fetch(course.pdfUrl)
            if (res.ok) blob = await res.blob()
        }
        if (!blob) {
            const { data, error } = await supabase
                .storage
                .from('courses')
                .download(course.fileName)
            if (error) throw error
            blob = data
        }

        // Create blob URL and trigger download
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = course.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        successMessage.value = `Downloaded: ${course.title}`
    } catch (error) {
        successMessage.value = `Download failed: ${error.message}`
    }

    showSuccessMessage.value = true
    setTimeout(() => showSuccessMessage.value = false, 3000)
}

// Point catalog courses at their bundled PDFs on mount
onMounted(async () => {
    try {
        for (const country of catalog.value) {
            for (const uni of country.universities) {
                for (const campus of uni.campuses) {
                    for (const faculty of campus.faculties) {
                        for (const department of faculty.departments) {
                            for (const level of department.levels) {
                                for (const course of level.courses) {
                                    if (course.fileName && !course.pdfUrl) {
                                        course.pdfUrl = pdfBase() + course.fileName
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading PDFs:', error)
    }
})
</script>

<style scoped>
/* Uses the same academic design system as the parent dashboard (navy/gold/teal).
   Font family is inherited from the parent's .study-social-root wrapper;
   font-heading is redeclared here because Vue scoped styles don't cross component boundaries. */
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

.font-heading {
    font-family: 'Lora', Georgia, serif;
    letter-spacing: -0.01em;
}

.expand-enter-active, .expand-leave-active {
    transition: all 0.3s ease;
}

.expand-enter-from {
    opacity: 0;
    height: 0;
}

.expand-leave-to {
    opacity: 0;
    height: 0;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
