// Extracted from the original SiwesPage.vue during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const siwesCategories: HubCategory[] = [
  {
    "id": "eligibility",
    "short": "Eligibility",
    "title": "Who is eligible? Level & departments",
    "desc": "SIWES applies to science, engineering, technology, environmental and related programmes — not every department.",
    "icon": "bi-person-check",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "Departmental SIWES coordinator, OOU SIWES unit.",
    "items": [
      {
        "title": "Who is eligible?",
        "desc": "Students in SIWES-enabled programmes (Sciences, Engineering, Technology, Agriculture, Environmental, some Management/Social Science tech tracks). Confirm your department is on the ITF list.",
        "tag": "Check dept"
      },
      {
        "title": "What level?",
        "desc": "Typically 200/300 level (first phase) and 300/400 level (second phase) depending on 4- or 5-year programmes. Your coordinator confirms the exact session.",
        "tag": "Level"
      },
      {
        "title": "When does SIWES start?",
        "desc": "Usually aligned with the long vacation / second-semester break and runs 3–6 months. Dates follow the OOU academic calendar and ITF calendar.",
        "tag": "Timeline"
      }
    ]
  },
  {
    "id": "placement",
    "short": "Placement",
    "title": "How to find a placement",
    "desc": "Where you train shapes what you learn — and your report.",
    "icon": "bi-geo-alt",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "SIWES coordinator approved organisation list.",
    "items": [
      {
        "title": "Target relevant organisations",
        "desc": "Banks for Accounting/Banking, hospitals/labs for Microbiology/Biochemistry, engineering firms for Engineering, IT firms for Computer Science."
      },
      {
        "title": "SIWES introduction letter",
        "desc": "Collect the official SIWES/IT letter from your department before approaching organisations — most will not accept you without it.",
        "tag": "Letter"
      },
      {
        "title": "Get acceptance early",
        "desc": "Secure and submit your placement acceptance letter before resumption; late placements delay mobilisation."
      },
      {
        "title": "Avoid unrelated placements",
        "desc": "Training in an unrelated field weakens your logbook, report and defence score."
      }
    ]
  },
  {
    "id": "forms",
    "short": "ITF Forms",
    "title": "ITF forms & supervisor information",
    "desc": "The paperwork that proves you trained.",
    "icon": "bi-file-earmark-text",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "source": "ITF forms issued via OOU SIWES unit.",
    "items": [
      {
        "title": "ITF forms (e.g. Form 8 & placement slips)",
        "desc": "Fill biodata, organisation details and training period neatly; get organisation stamp/signature where required."
      },
      {
        "title": "Industry-based supervisor",
        "desc": "Your workplace supervisor signs weekly entries and confirms attendance — keep their name, phone and designation.",
        "tag": "Supervisor"
      },
      {
        "title": "School-based supervisor",
        "desc": "OOU assigns a visiting supervisor who inspects you at the placement and scores your training.",
        "tag": "Visitation"
      }
    ]
  },
  {
    "id": "logbook",
    "short": "Logbook",
    "title": "Logbook — daily/weekly entries",
    "desc": "The logbook is marked. Write it as you train, not after.",
    "icon": "bi-journal-text",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "items": [
      {
        "title": "Write weekly, not last-minute",
        "desc": "Record tasks, tools used, skills learnt and observations each week with dates."
      },
      {
        "title": "Be specific and technical",
        "desc": "\"Calibrated pH meter and ran water-sample titration\" beats \"worked in the lab\"."
      },
      {
        "title": "Get signatures promptly",
        "desc": "Weekly sign-off by your industry supervisor; unsigned weeks may be rejected."
      }
    ]
  },
  {
    "id": "report",
    "short": "Report",
    "title": "Industrial attachment report & submission",
    "desc": "Your bound report + defence carry the grade.",
    "icon": "bi-book",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "Departmental report format / template.",
    "items": [
      {
        "title": "Report structure",
        "desc": "Title page, abstract, organisation profile, weekly summary of work, skills acquired, challenges, conclusion and references."
      },
      {
        "title": "Submission requirements",
        "desc": "Bound copies + soft copy, signed logbook, completed ITF forms and placement letters — submitted before the departmental deadline.",
        "tag": "Checklist"
      },
      {
        "title": "Defence / presentation",
        "desc": "Be ready to explain what YOU did, tools used and what you learnt. Panels quickly spot copied reports."
      }
    ]
  },
  {
    "id": "mistakes",
    "short": "Mistakes",
    "title": "Common SIWES mistakes",
    "desc": "Avoid these to protect your score.",
    "icon": "bi-exclamation-triangle",
    "bg": "from-[#fdf3cf] to-[#FBE7A1]",
    "iconColor": "text-[#8a6d00]",
    "items": [
      {
        "title": "Ghost placements",
        "desc": "Registering without actually training risks failure when supervisors visit."
      },
      {
        "title": "Backdated logbooks",
        "desc": "Identical handwriting/ink across months is obvious to examiners."
      },
      {
        "title": "Missing stamps and signatures",
        "desc": "Unstamped forms and unsigned logbooks get rejected at submission."
      },
      {
        "title": "Late submission",
        "desc": "Late reports attract penalties or outright rejection — bind early."
      }
    ]
  }
]
