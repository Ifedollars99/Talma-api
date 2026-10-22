// Extracted from the original AcademicHubPage.vue during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const academicCategories: HubCategory[] = [
  {
    "id": "materials",
    "short": "Materials",
    "title": "Course materials & lecture notes",
    "desc": "Organise your reading per course — outlines first, textbooks second.",
    "icon": "bi-book",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "items": [
      {
        "title": "Course materials",
        "desc": "Collect the official outline, recommended texts and handouts for each course at the start of the semester.",
        "tag": "Per course"
      },
      {
        "title": "Lecture notes",
        "desc": "Rewrite class notes within 24 hours; compare with classmates to fill gaps."
      },
      {
        "title": "Assignments",
        "desc": "Submit before deadlines — continuous assessment often decides borderline grades. Keep copies of every submission."
      }
    ]
  },
  {
    "id": "past-questions",
    "short": "Past Qs",
    "title": "Past questions & exam information",
    "desc": "OOU lecturers repeat patterns — past questions reveal them.",
    "icon": "bi-file-earmark-text",
    "bg": "from-[#e6f6ea] to-[#dcfce7]",
    "iconColor": "text-[#15803d]",
    "items": [
      {
        "title": "Past questions",
        "desc": "Practise at least 5 years of past questions per course under timed conditions."
      },
      {
        "title": "Exam information",
        "desc": "Confirm exam mode (CBT/theory), venue, docket/ID requirements and prohibited items before each diet.",
        "tag": "Exam doc"
      },
      {
        "title": "Academic calendar",
        "desc": "Track lecture weeks, revision week, exams and breaks from the Senate-approved calendar each session."
      }
    ]
  },
  {
    "id": "announcements",
    "short": "Announce",
    "title": "Course & lecturer announcements",
    "desc": "Never miss a test venue change again.",
    "icon": "bi-megaphone",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "items": [
      {
        "title": "Course announcements",
        "desc": "Test dates, assignment briefs, venue changes and cancelled classes — check class groups daily."
      },
      {
        "title": "Lecturer announcements",
        "desc": "Office hours, makeup classes and marking schemes come directly from lecturers; respect them."
      }
    ]
  },
  {
    "id": "community",
    "short": "Community",
    "title": "Study groups, departments & discussions",
    "desc": "The social-school layer — learn with your people.",
    "icon": "bi-people",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "items": [
      {
        "title": "Study groups",
        "desc": "Join or form small groups (4–6 serious members) with weekly targets and mock tests."
      },
      {
        "title": "Department communities",
        "desc": "Follow your department channel for outlines, past questions and senior-student guidance."
      },
      {
        "title": "Class discussions",
        "desc": "Ask and answer questions in course threads — teaching others is the fastest way to master a topic."
      }
    ]
  }
]
