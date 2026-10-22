import { useEffect, useMemo, useState } from 'react'
import { useAddCourse, useAddFaculty, useCourseCatalog } from '../../hooks/useCourses'
import { useUploadCoursePdf } from '../../hooks/useUploads'
import { ApiError } from '../../lib/apiClient'
import type { CatalogCourse, CatalogDepartment, CatalogLevel } from '../../types'
import Collapse from '../ui/Collapse'
import Modal from '../ui/Modal'
import { Toast } from '../ui/Toast'

/** Bundled course outlines live in the client's `public/course-pdfs` folder. */
function pdfUrlFor(course: CatalogCourse): string {
  if (course.pdfUrl) return course.pdfUrl
  return `${import.meta.env.BASE_URL}course-pdfs/${course.fileName}`
}

function countLevelCourses(level: CatalogLevel): number {
  return level.courses.length
}

function countDepartmentCourses(department: CatalogDepartment): number {
  return department.levels.reduce((total, level) => total + countLevelCourses(level), 0)
}

/**
 * Course browser — a direct port of the original `MycoursesPage.vue`:
 * Country → University → Campus → Faculty → Department → Level → Course.
 */
export default function CoursesView() {
  const { data, isLoading, isError } = useCourseCatalog()
  const addFaculty = useAddFaculty()
  const addCourse = useAddCourse()
  const uploadPdf = useUploadCoursePdf()

  const countries = useMemo(() => data?.countries ?? [], [data])

  const [selectedCountryId, setSelectedCountryId] = useState('nigeria')
  const [selectedUniversityId, setSelectedUniversityId] = useState('oou')
  const [selectedCampusId, setSelectedCampusId] = useState('oou-main')
  const [searchQuery, setSearchQuery] = useState('')

  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null)
  const [expandedDepartment, setExpandedDepartment] = useState<Record<string, string | null>>({})
  const [selectedLevel, setSelectedLevel] = useState<Record<string, string>>({})

  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [viewCourseModal, setViewCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CatalogCourse | null>(null)
  const [facultyName, setFacultyName] = useState('')
  const [courseForm, setCourseForm] = useState({ title: '', lecturer: '', students: 0 })
  const [courseTarget, setCourseTarget] = useState<{
    facultyId: string
    departmentId: string
    levelId: string
  } | null>(null)
  const [coursePdf, setCoursePdf] = useState<{ url: string; fileName: string } | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string; tone: 'success' | 'error' } | null>(
    null,
  )

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), text, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  const selectedCountry =
    countries.find((country) => country.id === selectedCountryId) ?? countries[0]

  const selectedUniversity = useMemo(() => {
    if (!selectedCountry) return undefined
    return (
      selectedCountry.universities.find((university) => university.id === selectedUniversityId) ??
      selectedCountry.universities[0]
    )
  }, [selectedCountry, selectedUniversityId])

  const selectedCampus = useMemo(() => {
    if (!selectedUniversity) return undefined
    return (
      selectedUniversity.campuses.find((campus) => campus.id === selectedCampusId) ??
      selectedUniversity.campuses[0]
    )
  }, [selectedUniversity, selectedCampusId])

  const resetExpanded = () => {
    setExpandedFaculty(null)
    setExpandedDepartment({})
    setSelectedLevel({})
  }

  const selectCountry = (id: string) => {
    setSelectedCountryId(id)
    const country = countries.find((entry) => entry.id === id)
    const firstUniversity = country?.universities[0]
    if (firstUniversity) {
      setSelectedUniversityId(firstUniversity.id)
      setSelectedCampusId(firstUniversity.campuses[0]?.id ?? '')
    }
    resetExpanded()
  }

  const selectUniversity = (id: string) => {
    setSelectedUniversityId(id)
    const university = selectedCountry?.universities.find((entry) => entry.id === id)
    setSelectedCampusId(university?.campuses[0]?.id ?? '')
    resetExpanded()
  }

  const selectCampus = (id: string) => {
    setSelectedCampusId(id)
    resetExpanded()
  }

  /**
   * The picked level pill for a department — falling back to the first level
   * that actually has courses so search results never show an empty picker.
   */
  const activeLevel = (department: CatalogDepartment): CatalogLevel => {
    const levels = department.levels ?? []
    if (!levels.length) return { id: '', label: '', courses: [] }
    const picked = levels.find((level) => level.id === selectedLevel[department.id])
    if (picked && (picked.courses.length > 0 || !searchQuery.trim())) return picked
    return levels.find((level) => level.courses.length > 0) ?? levels[0]!
  }

  const filteredFaculties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const faculties = selectedCampus?.faculties ?? []
    if (!query) return faculties

    return faculties
      .map((faculty) => ({
        ...faculty,
        departments: faculty.departments
          .map((department) => ({
            ...department,
            levels: department.levels
              .map((level) => ({
                ...level,
                courses: level.courses.filter(
                  (course) =>
                    course.title.toLowerCase().includes(query) ||
                    (course.code && course.code.toLowerCase().includes(query)) ||
                    level.label.toLowerCase().includes(query) ||
                    department.name.toLowerCase().includes(query) ||
                    faculty.name.toLowerCase().includes(query),
                ),
              }))
              .filter((level) => level.courses.length > 0),
          }))
          .filter((department) => department.levels.length > 0),
      }))
      .filter((faculty) => faculty.departments.length > 0)
  }, [selectedCampus, searchQuery])

  const toggleFaculty = (facultyId: string) => {
    setExpandedFaculty((current) => (current === facultyId ? null : facultyId))
  }

  const toggleDepartment = (facultyId: string, departmentId: string) => {
    setExpandedDepartment((current) => ({
      ...current,
      [facultyId]: current[facultyId] === departmentId ? null : departmentId,
    }))
  }

  const openAddCourseModal = (facultyId: string, departmentId: string, levelId: string) => {
    setCourseTarget({ facultyId, departmentId, levelId })
    setCourseForm({ title: '', lecturer: '', students: 0 })
    setCoursePdf(null)
    setShowCourseModal(true)
  }

  const saveFaculty = async () => {
    if (!facultyName.trim() || !selectedCampus) return
    try {
      await addFaculty.mutateAsync({ campusId: selectedCampus.id, name: facultyName.trim() })
      setFacultyName('')
      setShowAddFacultyModal(false)
      showToast('Faculty added successfully!')
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'Could not add the faculty.',
        'error',
      )
    }
  }

  const saveCourse = async () => {
    if (!courseTarget || !courseForm.title || !courseForm.lecturer) return
    try {
      await addCourse.mutateAsync({
        facultyId: courseTarget.facultyId,
        departmentId: courseTarget.departmentId,
        levelId: courseTarget.levelId,
        title: courseForm.title,
        lecturer: courseForm.lecturer,
        students: courseForm.students,
        ...(coursePdf ? { fileName: coursePdf.fileName, pdfUrl: coursePdf.url } : {}),
      })
      showToast('Course added successfully!')
      setShowCourseModal(false)
      setCourseForm({ title: '', lecturer: '', students: 0 })
      setCoursePdf(null)
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not add the course.', 'error')
    }
  }

  const handlePdfUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      const result = await uploadPdf.mutateAsync(file)
      setCoursePdf({ url: result.url, fileName: result.fileName })
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Upload failed.', 'error')
    }
  }

  const viewCourse = (course: CatalogCourse) => {
    setSelectedCourse(course)
    setViewCourseModal(true)
  }

  const downloadCourse = async (course: CatalogCourse) => {
    const url = pdfUrlFor(course)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = course.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
      showToast(`Downloaded: ${course.title}`)
    } catch {
      showToast(`Download failed: ${course.fileName}`, 'error')
    }
  }

  // Keep the selection valid once the catalogue arrives from the API.
  useEffect(() => {
    if (!selectedCountry) return
    if (!selectedCountry.universities.some((u) => u.id === selectedUniversityId)) {
      const first = selectedCountry.universities[0]
      if (first) {
        setSelectedUniversityId(first.id)
        setSelectedCampusId(first.campuses[0]?.id ?? '')
      }
    }
  }, [selectedCountry, selectedUniversityId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#7b857b]">
        <span className="w-8 h-8 rounded-full border-[3px] border-[#e6e9e6] border-t-[#f5c842] animate-spin" />
      </div>
    )
  }

  if (isError || !selectedCountry || !selectedUniversity || !selectedCampus) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e9e6] p-10 text-center text-[#7b857b]">
        The course catalogue could not be loaded. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} />}

      <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a]">Classroom</h2>
          <p className="text-sm text-[#4d554d] mt-1">
            Browse your faculties, courses and class materials.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddFacultyModal(true)}
          className="bg-[#f5c842] text-[#0a0a0a] px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium"
        >
          <i className="bi bi-plus-circle text-lg" />
          <span className="text-base">Add Faculty</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857b]" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          type="text"
          placeholder="Search faculties, departments, levels, courses…"
          className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#e6e9e6] rounded-xl text-[15px] text-[#0a0a0a] placeholder-[#7b857b] focus:outline-none focus:ring-2 focus:ring-[#f5c842]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b857b] hover:text-[#0a0a0a]"
          >
            <i className="bi bi-x-circle" />
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <p className="text-sm text-[#7b857b]">
        <span className="font-medium text-[#0a0a0a]">{selectedCountry.name}</span>
        <span className="mx-1">/</span>
        <span className="font-medium text-[#0a0a0a]">{selectedUniversity.fullName}</span>
        <span className="mx-1">/</span>
        <span className="font-medium text-[#0a0a0a]">
          {selectedCampus.name} ({selectedCampus.location})
        </span>
      </p>

      {/* Level 1: Countries */}
      <div>
        <p className="text-xs font-semibold text-[#7b857b] uppercase tracking-wide mb-2">Country</p>
        <div className="flex gap-2 flex-wrap">
          {countries.map((country) => (
            <button
              key={country.id}
              type="button"
              onClick={() => selectCountry(country.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-[15px] transition-colors ${
                selectedCountryId === country.id
                  ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                  : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
              }`}
            >
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
              <span className="text-xs opacity-70">{country.universities.length} schools</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level 2: Universities */}
      <div>
        <p className="text-xs font-semibold text-[#7b857b] uppercase tracking-wide mb-2">
          Schools in {selectedCountry.name}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {selectedCountry.universities.map((university) => {
            const isSelected = selectedUniversityId === university.id
            const courseCount = university.campuses.reduce(
              (campusTotal, campus) =>
                campusTotal +
                campus.faculties.reduce(
                  (facultyTotal, faculty) =>
                    facultyTotal +
                    faculty.departments.reduce(
                      (departmentTotal, department) =>
                        departmentTotal + countDepartmentCourses(department),
                      0,
                    ),
                  0,
                ),
              0,
            )

            return (
              <button
                key={university.id}
                type="button"
                onClick={() => selectUniversity(university.id)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a] shadow-md'
                    : 'bg-white border-[#e6e9e6] hover:border-[#f5c842] hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-heading font-semibold text-lg flex-shrink-0 ${
                      isSelected ? 'bg-[#f5c842] text-[#0a0a0a]' : 'bg-[#fdf5d7] text-[#8a6d00]'
                    }`}
                  >
                    {university.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] leading-tight">{university.name}</p>
                    <p
                      className={`text-xs truncate ${
                        isSelected ? 'text-white/60' : 'text-[#7b857b]'
                      }`}
                    >
                      {university.fullName}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex gap-3 mt-3 text-xs ${
                    isSelected ? 'text-white/70' : 'text-[#7b857b]'
                  }`}
                >
                  <span>
                    <i className="bi bi-geo-alt mr-1" />
                    {university.campuses.length}{' '}
                    {university.campuses.length === 1 ? 'campus' : 'campuses'}
                  </span>
                  <span>
                    <i className="bi bi-book mr-1" />
                    {courseCount} courses
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Level 3: Branches / Campuses */}
      {selectedUniversity.campuses.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-[#7b857b] uppercase tracking-wide mb-2">
            {selectedUniversity.name} branches
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedUniversity.campuses.map((campus) => (
              <button
                key={campus.id}
                type="button"
                onClick={() => selectCampus(campus.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  selectedCampusId === campus.id
                    ? 'bg-[#f5c842] text-[#0a0a0a] border-[#f5c842]'
                    : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
                }`}
              >
                {campus.name} · {campus.location}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level 4: Faculties → Departments → Levels → Courses */}
      <div>
        <p className="text-xs font-semibold text-[#7b857b] uppercase tracking-wide mb-2">
          Faculties at {selectedUniversity.name} — {selectedCampus.name}
        </p>
        {filteredFaculties.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e6e9e6] p-10 text-center">
            <p className="text-[#7b857b]">No faculties match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaculties.map((faculty) => (
              <div
                key={faculty.id}
                className="bg-white rounded-xl border border-[#e6e9e6] overflow-hidden"
              >
                {/* Faculty Header */}
                <div
                  onClick={() => toggleFaculty(faculty.id)}
                  className="p-5 cursor-pointer hover:bg-[#f7f9f7] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <i
                      className={`bi text-xl text-[#0a0a0a] ${
                        expandedFaculty === faculty.id ? 'bi-chevron-down' : 'bi-chevron-right'
                      }`}
                    />
                    <h3 className="text-xl font-semibold text-[#0a0a0a]">{faculty.name}</h3>
                    <span className="bg-[#fdf5d7] text-[#8a6d00] text-sm px-3 py-1 rounded-full font-medium">
                      {faculty.departments.length} departments
                    </span>
                  </div>
                </div>

                {/* Departments (Collapsible) */}
                <Collapse open={expandedFaculty === faculty.id}>
                  <div className="border-t border-[#e6e9e6]">
                    {faculty.departments.map((department) => (
                      <div
                        key={department.id}
                        className="border-b border-[#e6e9e6] last:border-b-0"
                      >
                        {/* Department Header */}
                        <div
                          onClick={() => toggleDepartment(faculty.id, department.id)}
                          className="p-5 pl-12 cursor-pointer hover:bg-[#f2f4f2] flex items-center justify-between bg-[#f7f9f7] transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <i
                              className={`bi text-lg text-[#15803d] ${
                                expandedDepartment[faculty.id] === department.id
                                  ? 'bi-folder-open'
                                  : 'bi-folder'
                              }`}
                            />
                            <h4 className="text-lg font-semibold text-[#0a0a0a]">
                              {department.name}
                            </h4>
                            <span className="bg-[#e6f6ea] text-[#15803d] text-xs px-2 py-1 rounded-full font-medium">
                              {countDepartmentCourses(department)} courses
                            </span>
                          </div>
                        </div>

                        {/* Level picker (Collapsible) */}
                        <Collapse open={expandedDepartment[faculty.id] === department.id}>
                          <div className="bg-white">
                            <div className="px-5 lg:px-8 py-3 pl-16 lg:pl-20 bg-[#fbfcfb] border-b border-[#e6e9e6] flex items-center gap-2 flex-wrap">
                              {department.levels.map((level) => (
                                <button
                                  key={level.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedLevel((current) => ({
                                      ...current,
                                      [department.id]: level.id,
                                    }))
                                  }
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                    activeLevel(department).id === level.id
                                      ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                                      : 'bg-white text-[#4d554d] border-[#e6e9e6] hover:border-[#f5c842]'
                                  }`}
                                >
                                  {level.label}
                                </button>
                              ))}
                              <span className="ml-auto text-xs text-[#7b857b]">
                                {activeLevel(department).courses.length} courses
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  openAddCourseModal(
                                    faculty.id,
                                    department.id,
                                    activeLevel(department).id,
                                  )
                                }
                                className="text-[#8a6d00] hover:text-[#6b5400] text-sm flex items-center space-x-1 font-medium"
                              >
                                <i className="bi bi-plus-circle" />
                                <span>Add Course</span>
                              </button>
                            </div>

                            {activeLevel(department).courses.map((course) => (
                              <div
                                key={course.id}
                                className="p-5 pl-20 border-b border-[#e6e9e6] last:border-b-0 hover:bg-[#f7f9f7] transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      {course.code && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0a0a0a] text-white tracking-wide">
                                          {course.code}
                                        </span>
                                      )}
                                      <h5 className="font-semibold text-[#0a0a0a] text-base">
                                        {course.title}
                                      </h5>
                                    </div>
                                    <div className="space-y-1 text-sm text-[#4d554d]">
                                      <p>
                                        <i className="bi bi-person mr-2" />
                                        {course.lecturer}
                                      </p>
                                      <p>
                                        <i className="bi bi-people mr-2" />
                                        {course.students} students
                                      </p>
                                      <p className="text-[#7b857b]">
                                        <i className="bi bi-clock mr-2" />
                                        Updated {course.lastUpdate}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 ml-4">
                                    <button
                                      type="button"
                                      onClick={() => void downloadCourse(course)}
                                      className="bg-[#0a0a0a] text-white p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                                      title="Download Course"
                                    >
                                      <i className="bi bi-download text-lg" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => viewCourse(course)}
                                      className="bg-[#15803d] text-white p-2 rounded-lg hover:bg-[#115e2e] transition-colors"
                                      title="View Course"
                                    >
                                      <i className="bi bi-eye text-lg" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {activeLevel(department).courses.length === 0 && (
                              <div className="p-5 pl-20 text-center text-[#7b857b]">
                                <p>
                                  No courses yet.{' '}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openAddCourseModal(
                                        faculty.id,
                                        department.id,
                                        activeLevel(department).id,
                                      )
                                    }
                                    className="text-[#8a6d00] hover:underline font-medium"
                                  >
                                    Add one now!
                                  </button>
                                </p>
                              </div>
                            )}
                          </div>
                        </Collapse>
                      </div>
                    ))}
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        open={showAddFacultyModal}
        onClose={() => setShowAddFacultyModal(false)}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
      >
        <h2 className="font-heading text-2xl font-semibold text-[#0a0a0a] mb-2">Add New Faculty</h2>
        <p className="text-sm text-[#7b857b] mb-6">
          Adding to {selectedUniversity.name} — {selectedCampus.name}
        </p>
        <div>
          <label htmlFor="faculty-name" className="block text-sm font-medium text-[#4d554d] mb-1">
            Faculty Name
          </label>
          <input
            id="faculty-name"
            value={facultyName}
            onChange={(event) => setFacultyName(event.target.value)}
            type="text"
            placeholder="e.g. Faculty of Engineering"
            className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
          />
        </div>
        <div className="flex space-x-3 mt-8">
          <button
            type="button"
            onClick={() => setShowAddFacultyModal(false)}
            className="flex-1 px-4 py-2.5 border border-[#e6e9e6] text-[#0a0a0a] rounded-lg hover:bg-[#f7f9f7] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveFaculty()}
            disabled={!facultyName.trim() || addFaculty.isPending}
            className="flex-1 px-4 py-2.5 bg-[#f5c842] text-[#0a0a0a] rounded-lg hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium disabled:opacity-50"
          >
            Add Faculty
          </button>
        </div>
      </Modal>

      {/* Add Course Modal */}
      <Modal
        open={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
      >
        <h2 className="font-heading text-2xl font-semibold text-[#0a0a0a] mb-6">Add New Course</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="course-title" className="block text-sm font-medium text-[#4d554d] mb-1">
              Course Title
            </label>
            <input
              id="course-title"
              value={courseForm.title}
              onChange={(event) => setCourseForm((form) => ({ ...form, title: event.target.value }))}
              type="text"
              placeholder="Enter course title"
              className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="course-lecturer" className="block text-sm font-medium text-[#4d554d] mb-1">
              Lecturer Name
            </label>
            <input
              id="course-lecturer"
              value={courseForm.lecturer}
              onChange={(event) =>
                setCourseForm((form) => ({ ...form, lecturer: event.target.value }))
              }
              type="text"
              placeholder="Enter lecturer name"
              className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="course-students" className="block text-sm font-medium text-[#4d554d] mb-1">
              Number of Students
            </label>
            <input
              id="course-students"
              value={courseForm.students}
              onChange={(event) =>
                setCourseForm((form) => ({
                  ...form,
                  students: Number.parseInt(event.target.value, 10) || 0,
                }))
              }
              type="number"
              min={0}
              placeholder="0"
              className="w-full border border-[#e6e9e6] rounded-lg px-4 py-2 outline-none focus:border-[#f5c842] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="course-pdf" className="block text-sm font-medium text-[#4d554d] mb-1">
              Course Outline (PDF)
            </label>
            <input
              id="course-pdf"
              type="file"
              accept="application/pdf"
              onChange={(event) => void handlePdfUpload(event.target.files?.[0])}
              className="w-full text-sm text-[#4d554d] file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[#fdf5d7] file:text-[#8a6d00] file:font-medium"
            />
            {coursePdf && (
              <p className="text-xs text-[#15803d] mt-2">
                Uploaded: {coursePdf.fileName}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            type="button"
            onClick={() => setShowCourseModal(false)}
            className="flex-1 px-4 py-2.5 border border-[#e6e9e6] text-[#0a0a0a] rounded-lg hover:bg-[#f7f9f7] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveCourse()}
            disabled={!courseForm.title || !courseForm.lecturer || addCourse.isPending}
            className="flex-1 px-4 py-2.5 bg-[#f5c842] text-[#0a0a0a] rounded-lg hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium disabled:opacity-50"
          >
            Add Course
          </button>
        </div>
      </Modal>

      {/* Course View Modal with PDF Viewer */}
      <Modal
        open={viewCourseModal}
        onClose={() => setViewCourseModal(false)}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-start p-6 border-b border-[#e6e9e6]">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-[#0a0a0a]">
              {selectedCourse?.title}
            </h2>
            <p className="text-[#4d554d] mt-1">{selectedCourse?.lecturer}</p>
          </div>
          <button
            type="button"
            onClick={() => setViewCourseModal(false)}
            aria-label="Close"
            className="text-[#7b857b] hover:text-[#0a0a0a] transition-colors"
          >
            <i className="bi bi-x text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#f7f9f7]">
          {selectedCourse ? (
            <iframe
              src={pdfUrlFor(selectedCourse)}
              title={selectedCourse.title}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-[#7b857b]">
              <p>No PDF available for this course</p>
            </div>
          )}
        </div>

        <div className="border-t border-[#e6e9e6] p-6 bg-white flex justify-between items-center">
          <div className="space-y-1 text-sm text-[#4d554d]">
            <p>
              <strong className="text-[#0a0a0a]">Students:</strong> {selectedCourse?.students}
            </p>
            <p>
              <strong className="text-[#0a0a0a]">Last Updated:</strong> {selectedCourse?.lastUpdate}
            </p>
          </div>
          <div className="flex space-x-3">
            {selectedCourse && (
              <button
                type="button"
                onClick={() => void downloadCourse(selectedCourse)}
                className="bg-[#0a0a0a] text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors flex items-center space-x-2 font-medium"
              >
                <i className="bi bi-download" />
                <span>Download PDF</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
