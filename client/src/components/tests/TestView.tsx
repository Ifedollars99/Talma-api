import { useMemo, useState } from 'react'
import { useStartTest, useSubmitTest, useTestFaculties } from '../../hooks/useTests'
import type { TestQuestion } from '../../types'

type Step = 'select-faculty' | 'select-department' | 'test' | 'result'

/**
 * "Take a Test" — a direct port of the original test feature that lived
 * inside `MycampPage.vue`. Questions are drawn and graded by the API so the
 * correct answers are never shipped to the browser.
 */
export default function TestView() {
  const { data, isLoading } = useTestFaculties()
  const startTest = useStartTest()
  const submitTest = useSubmitTest()

  const [step, setStep] = useState<Step>('select-faculty')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('')
  const [selectedFacultyName, setSelectedFacultyName] = useState('')

  const faculties = useMemo(() => data?.faculties ?? [], [data])

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => faculty.id === selectedFacultyId),
    [faculties, selectedFacultyId],
  )

  const filteredFaculties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return faculties
    return faculties.filter((faculty) => faculty.name.toLowerCase().includes(query))
  }, [faculties, searchQuery])

  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty) return []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return selectedFaculty.departments
    return selectedFaculty.departments.filter((department) =>
      department.name.toLowerCase().includes(query),
    )
  }, [selectedFaculty, searchQuery])

  const answeredCount = Object.keys(answers).length

  const selectFaculty = (facultyId: number) => {
    setSelectedFacultyId(facultyId)
    setSearchQuery('')
    setStep('select-department')
  }

  const backToFaculties = () => {
    setSelectedFacultyId(null)
    setSearchQuery('')
    setStep('select-faculty')
  }

  const selectDepartment = async (departmentId: number) => {
    setSearchQuery('')
    try {
      const result = await startTest.mutateAsync({ departmentId, count: 10 })
      setAttemptId(result.attemptId)
      setQuestions(result.questions)
      setSelectedFacultyName(result.faculty)
      setSelectedDepartmentName(result.department)
      setAnswers({})
      setStep('test')
    } catch {
      // The error is surfaced through the disabled state / retry.
    }
  }

  const submit = async () => {
    if (!attemptId) return
    try {
      const result = await submitTest.mutateAsync({ attemptId, answers })
      setScore(result.score)
      setTotal(result.total)
      setStep('result')
    } catch {
      // Keep the test open so the student can try again.
    }
  }

  const reset = () => {
    setStep('select-faculty')
    setSelectedFacultyId(null)
    setSearchQuery('')
    setQuestions([])
    setAnswers({})
    setScore(0)
    setTotal(0)
    setAttemptId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-heading text-3xl font-semibold text-[#0a0a0a]">Take a Test</h2>
        {step !== 'select-faculty' && (
          <button
            type="button"
            onClick={reset}
            className="text-[#4d554d] hover:text-[#0a0a0a] flex items-center space-x-2 text-sm font-medium transition-colors"
          >
            <i className="bi bi-arrow-left" />
            <span>Start Over</span>
          </button>
        )}
      </div>

      {/* Step 1: Select Faculty */}
      {step === 'select-faculty' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#e6e9e6] p-4 focus-within:border-[#f5c842] transition-colors">
            <div className="flex items-center space-x-4">
              <i className="bi bi-search text-[#7b857b] text-lg" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search faculty..."
                className="flex-1 outline-none text-base bg-transparent placeholder:text-[#7b857b]"
              />
            </div>
          </div>

          <p className="text-[#4d554d]">Select your faculty at Olabisi Onabanjo University (OOU)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaculties.map((faculty) => (
              <button
                key={faculty.id}
                type="button"
                onClick={() => selectFaculty(faculty.id)}
                className="bg-white rounded-xl border border-[#e6e9e6] p-5 cursor-pointer hover:border-[#f5c842] transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#fdf5d7] rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-bank text-[#8a6d00] text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0a0a0a] text-base">{faculty.name}</h4>
                    <p className="text-sm text-[#7b857b]">{faculty.departments.length} departments</p>
                  </div>
                </div>
              </button>
            ))}

            {filteredFaculties.length === 0 && !isLoading && (
              <div className="col-span-full text-center text-[#7b857b] py-8">
                No faculty matches "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Department */}
      {step === 'select-department' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-[#7b857b]">
            <button
              type="button"
              onClick={backToFaculties}
              className="hover:text-[#0a0a0a] flex items-center space-x-1 transition-colors"
            >
              <i className="bi bi-arrow-left" />
              <span>Faculties</span>
            </button>
            <i className="bi bi-chevron-right" />
            <span className="font-medium text-[#0a0a0a]">{selectedFaculty?.name}</span>
          </div>

          <div className="bg-white rounded-lg border border-[#e6e9e6] p-4 focus-within:border-[#f5c842] transition-colors">
            <div className="flex items-center space-x-4">
              <i className="bi bi-search text-[#7b857b] text-lg" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search department..."
                className="flex-1 outline-none text-base bg-transparent placeholder:text-[#7b857b]"
              />
            </div>
          </div>

          <p className="text-[#4d554d]">Select a department under {selectedFaculty?.name}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDepartments.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => void selectDepartment(department.id)}
                disabled={startTest.isPending}
                className="bg-white rounded-xl border border-[#e6e9e6] p-5 cursor-pointer hover:border-[#f5c842] transition-colors text-left disabled:opacity-60"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#e6f6ea] rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-journal-bookmark text-[#15803d] text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0a0a0a] text-base">{department.name}</h4>
                    <p className="text-sm text-[#7b857b]">
                      {startTest.isPending ? 'Starting…' : 'Tap to start a 10-question test'}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full text-center text-[#7b857b] py-8">
                No department matches "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Taking the Test */}
      {step === 'test' && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-xl font-semibold text-white">
                {selectedDepartmentName} Test
              </h3>
              <span className="bg-[#f5c842] text-[#0a0a0a] text-sm px-3 py-1 rounded-full font-semibold">
                {answeredCount} / {questions.length} answered
              </span>
            </div>
            <p className="text-white/55 text-sm">{selectedFacultyName}</p>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-xl border border-[#e6e9e6] p-6">
              <h4 className="font-medium text-[#0a0a0a] text-base mb-4">
                {index + 1}. {question.question}
              </h4>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[String(question.id)] === optionIndex
                        ? 'border-[#f5c842] bg-[#fdf5d7]'
                        : 'border-[#e6e9e6] hover:bg-[#f7f9f7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[String(question.id)] === optionIndex}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [String(question.id)]: optionIndex,
                        }))
                      }
                      className="accent-[#f5c842]"
                    />
                    <span className="text-base text-[#0a0a0a]">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-[#e6e9e6] p-6 flex justify-between items-center">
            <p className="text-sm text-[#7b857b]">You can review your answers before submitting.</p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitTest.isPending}
              className="bg-[#0a0a0a] text-white px-6 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium disabled:opacity-60"
            >
              {submitTest.isPending ? 'Submitting…' : 'Submit Test'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#e6e9e6] p-8 text-center">
            <div className="w-16 h-16 bg-[#e6f6ea] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-check-circle text-[#15803d] text-3xl" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-[#0a0a0a] mb-2">
              Test Submitted!
            </h3>
            <p className="text-[#4d554d] mb-1">
              {selectedDepartmentName} • {selectedFacultyName}
            </p>
            <p className="font-heading text-4xl font-semibold text-[#0a0a0a] my-4">
              {score} / {total}
            </p>
            <button
              type="button"
              onClick={reset}
              className="bg-[#f5c842] text-[#0a0a0a] px-6 py-2.5 rounded-lg hover:bg-[#e0b53a] hover:text-[#0a0a0a] transition-colors font-medium"
            >
              Take Another Test
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
