// Extracted from the original CampusNewsPage.vue during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const campusNewsCategories: HubCategory[] = [
  {
    "id": "official",
    "short": "Official",
    "title": "OOU official announcements",
    "desc": "Management-approved notices every OOU student should follow.",
    "icon": "bi-megaphone",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "OOU portal (oouagoiwoye.edu.ng), faculty notice boards, official OOU social handles.",
    "items": [
      {
        "title": "Resumption & lecture notices",
        "desc": "Resumption dates, lecture schedules and public-holiday adjustments are published by management each semester.",
        "tag": "All students"
      },
      {
        "title": "School-fees & payment notices",
        "desc": "Approved fee schedules, payment channels and late-payment penalties. Pay only through the official portal.",
        "tag": "Fees"
      },
      {
        "title": "Security & conduct notices",
        "desc": "Campus security advisories, dress-code and conduct rules, and sanctions for examination malpractice.",
        "tag": "Conduct"
      },
      {
        "title": "Convocation ceremonies",
        "desc": "Convocation programmes, gown collection and guest arrangements for graduating sets.",
        "tag": "Events"
      }
    ]
  },
  {
    "id": "admission",
    "short": "Admission",
    "title": "Admission updates",
    "desc": "For aspirants and newly admitted OOU students.",
    "icon": "bi-mortarboard",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "source": "OOU admission portal, JAMB CAPS, departmental cut-off notices.",
    "items": [
      {
        "title": "Merit & supplementary lists",
        "desc": "Check your admission status on both the OOU portal and JAMB CAPS; accept the offer on CAPS promptly.",
        "tag": "Aspirants"
      },
      {
        "title": "Acceptance fee & clearance",
        "desc": "Pay acceptance fees within the stated window and complete physical/digital clearance with original documents.",
        "tag": "Freshers"
      },
      {
        "title": "Change of course / transfer",
        "desc": "Inter-departmental transfer windows and requirements are announced per session — meet the CGPA cut-off.",
        "tag": "Notice"
      },
      {
        "title": "Direct Entry admissions",
        "desc": "DE applicants should verify OND/HND/NCE/IJMB requirements for their chosen OOU programme.",
        "tag": "DE"
      }
    ]
  },
  {
    "id": "postutme",
    "short": "Post-UTME",
    "title": "Post-UTME announcements",
    "desc": "Screening registration, dates and requirements.",
    "icon": "bi-pencil-square",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "OOU Post-UTME portal, JAMB brochure for subject combinations.",
    "items": [
      {
        "title": "Screening registration",
        "desc": "Register with JAMB reg. number, O’level results and a valid email/phone. Upload results correctly.",
        "tag": "Registration"
      },
      {
        "title": "Eligibility & cut-off",
        "desc": "OOU sets a minimum UTME score per session plus departmental cut-offs — confirm before paying.",
        "tag": "Cut-off"
      },
      {
        "title": "Screening date & venue",
        "desc": "Print your screening slip; attend with original credentials and arrive early.",
        "tag": "Exam day"
      },
      {
        "title": "Result & aggregate",
        "desc": "Screening scores are combined with UTME and O’level grades — check your aggregate on the portal.",
        "tag": "Results"
      }
    ]
  },
  {
    "id": "registration",
    "short": "Registration",
    "title": "Registration deadlines",
    "desc": "Missing these blocks exams and results — treat them as hard deadlines.",
    "icon": "bi-calendar-check",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "OOU student portal, departmental course advisers.",
    "items": [
      {
        "title": "Course registration",
        "desc": "Register all courses (core, required, elective) each semester and print your course form.",
        "tag": "Every semester"
      },
      {
        "title": "Add & drop window",
        "desc": "Correct wrong course codes within the add/drop period — afterwards changes attract penalties.",
        "tag": "Correction"
      },
      {
        "title": "School-fees deadline",
        "desc": "Unpaid fees usually block course registration, exam dockets and result checking.",
        "tag": "Fees"
      },
      {
        "title": "Late registration penalty",
        "desc": "Late windows attract extra charges and can disqualify you from that semester’s exams.",
        "tag": "Penalty"
      }
    ]
  },
  {
    "id": "matriculation",
    "short": "Matric & Graduation",
    "title": "Matriculation / graduation information",
    "desc": "Entry and exit milestones for OOU students.",
    "icon": "bi-flag",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "source": "OOU academic affairs, faculty officers, convocation brochure.",
    "items": [
      {
        "title": "Matriculation ceremony",
        "desc": "Freshers take the matriculation oath; gowns and matric numbers are issued ahead of the event.",
        "tag": "Freshers"
      },
      {
        "title": "Final clearance",
        "desc": "Finalists clear library, bursary, department, faculty and student affairs before results are released.",
        "tag": "Finalists"
      },
      {
        "title": "Statement of result & certificates",
        "desc": "Apply for notification of results first; original certificates follow after Senate approval.",
        "tag": "Graduates"
      },
      {
        "title": "Transcript requests",
        "desc": "Request transcripts early for jobs, NYSC-exempt documentation or postgraduate applications.",
        "tag": "Admin"
      }
    ]
  },
  {
    "id": "calendar",
    "short": "Calendar",
    "title": "Academic calendar",
    "desc": "The session roadmap — plan hostel, fees and reading around it.",
    "icon": "bi-calendar3",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "OOU Senate-approved academic calendar per session.",
    "items": [
      {
        "title": "Semester structure",
        "desc": "First and second semesters with lecture weeks, revision week, exams and marking/break periods.",
        "tag": "Session"
      },
      {
        "title": "Tests & continuous assessment",
        "desc": "CA tests, assignments and practicals run mid-semester and count toward final grades.",
        "tag": "CA"
      },
      {
        "title": "Examination periods",
        "desc": "Exam timetables, dockets and ID requirements are released before each exam diet.",
        "tag": "Exams"
      },
      {
        "title": "SIWES / holidays",
        "desc": "Long vacations accommodate SIWES for eligible programmes; confirm your department’s schedule.",
        "tag": "Breaks"
      }
    ]
  },
  {
    "id": "faculty",
    "short": "Faculties",
    "title": "Faculty / department announcements",
    "desc": "Your department board often matters more than the general portal.",
    "icon": "bi-building",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "Faculty and departmental notice boards, class representatives, course lecturers.",
    "items": [
      {
        "title": "Lecture & venue changes",
        "desc": "Room swaps, timetable adjustments and cancelled classes are posted at department level.",
        "tag": "Timetable"
      },
      {
        "title": "Departmental dues & associations",
        "desc": "Faculty/student association dues, dinners, jerseys and academic week events.",
        "tag": "Dues"
      },
      {
        "title": "Project & supervisor lists",
        "desc": "Final-year supervisor allocations, project defence schedules and formatting guidelines.",
        "tag": "Projects"
      },
      {
        "title": "Pharmacy, Law, Medicine & Engineering boards",
        "desc": "Professional programmes add council/exam requirements — follow your faculty officer closely.",
        "tag": "Professional"
      }
    ]
  },
  {
    "id": "scholarships",
    "short": "Scholarships",
    "title": "Scholarships",
    "desc": "Free money with deadlines — track these alongside school fees.",
    "icon": "bi-gift",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "source": "Donor portals (MTN, NNPC, PTDF), Ogun State bursary board, OOU student affairs.",
    "items": [
      {
        "title": "Federal & state bursaries",
        "desc": "Ogun State bursary and federal scholarship board awards — indigene proof and CGPA often required.",
        "tag": "Government"
      },
      {
        "title": "Corporate scholarships",
        "desc": "MTN Foundation, NNPC/TotalEnergies, Shell, Agbami and similar schemes with yearly application windows.",
        "tag": "Corporate"
      },
      {
        "title": "NELFUND upkeep & institutional charges",
        "desc": "The national student loan covers charges plus upkeep in phases — apply on the official NELFUND portal only.",
        "tag": "Loan"
      },
      {
        "title": "Departmental prizes",
        "desc": "Best-student and faculty prizes are announced after Senate-approved results each session.",
        "tag": "Merit"
      }
    ]
  },
  {
    "id": "nysc",
    "short": "NYSC",
    "title": "NYSC-related information",
    "desc": "Start preparing from 300 level — errors delay mobilisation by a full batch.",
    "icon": "bi-person-badge",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "NYSC portal, OOU student affairs / DSA, JAMB regularisation portal.",
    "items": [
      {
        "title": "Senate-list mobilisation",
        "desc": "Your name must appear on the NYSC Senate list exactly as on your certificate — confirm spelling and matric number.",
        "tag": "Mobilisation"
      },
      {
        "title": "JAMB regularisation",
        "desc": "DE, transfer and remedial entrants often need JAMB regularisation before NYSC approval.",
        "tag": "JAMB"
      },
      {
        "title": "Call-up letter & camp",
        "desc": "Print call-up letters and green cards; report to camp with originals plus photocopies.",
        "tag": "Camp"
      },
      {
        "title": "Exemptions & exclusions",
        "desc": "Over-30 graduates and part-time programmes receive exemption/exclusion letters instead of call-ups.",
        "tag": "Letters"
      }
    ]
  }
]
