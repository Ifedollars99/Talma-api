// Extracted from the original AspirantPage.vue during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const aspirantCategories: HubCategory[] = [
  {
    "id": "courses",
    "short": "Courses",
    "title": "Courses available at OOU",
    "desc": "OOU runs programmes across Arts, Education, Law, Science, Social & Management Sciences, Engineering, Pharmacy, Medicine and related faculties. Confirm the current list on the portal — departments change per session.",
    "icon": "bi-grid",
    "bg": "from-[#e6f6ea] to-[#dcfce7]",
    "iconColor": "text-[#15803d]",
    "source": "OOU portal programme list, JAMB brochure.",
    "items": [
      {
        "title": "Check the official programme list first",
        "desc": "Search your intended course on the OOU portal before buying the JAMB form — course names and faculties determine your subject combination.",
        "tag": "Step 1"
      },
      {
        "title": "Competitive vs less-competitive courses",
        "desc": "Medicine, Law, Pharmacy, Nursing and Engineering typically need the highest aggregates. Have a realistic second choice within the same faculty.",
        "tag": "Strategy"
      },
      {
        "title": "Professional accreditation",
        "desc": "For Law, Medicine, Pharmacy, Nursing and Engineering, confirm council accreditation status for the current session.",
        "tag": "Verify"
      }
    ]
  },
  {
    "id": "utme",
    "short": "UTME",
    "title": "UTME requirements",
    "desc": "What JAMB expects before OOU can admit you.",
    "icon": "bi-pencil",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "JAMB brochure, caps.jamb.gov.ng.",
    "items": [
      {
        "title": "Choose OOU as first choice",
        "desc": "OOU generally considers first-choice candidates for Post-UTME. If OOU was second choice, do a change of institution early.",
        "tag": "Choice"
      },
      {
        "title": "Meet the minimum UTME score",
        "desc": "OOU announces a minimum UTME score each session (commonly around the national benchmark) plus higher departmental cut-offs.",
        "tag": "Score"
      },
      {
        "title": "Correct subject combination",
        "desc": "Use the JAMB brochure for your course — e.g. Sciences need English + Maths + two science subjects; wrong combos disqualify you.",
        "tag": "Combo"
      }
    ]
  },
  {
    "id": "olevel",
    "short": "O'Level",
    "title": "O'Level requirements",
    "desc": "WAEC, NECO or NABTEB — five credits including English, usually Mathematics.",
    "icon": "bi-file-earmark-check",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "JAMB brochure per course, OOU screening guidelines.",
    "items": [
      {
        "title": "Five credits in relevant subjects",
        "desc": "Most OOU courses require 5 credits at not more than two sittings, including English Language and course-relevant subjects.",
        "tag": "Credits"
      },
      {
        "title": "Awaiting result rules",
        "desc": "If using awaiting result, declare it honestly at screening and upload the result immediately after release.",
        "tag": "AR"
      },
      {
        "title": "Two sittings vs one sitting",
        "desc": "Competitive courses (Medicine, Law, Pharmacy) often prefer one sitting — check the departmental note.",
        "tag": "Note"
      }
    ]
  },
  {
    "id": "postutme",
    "short": "Post-UTME",
    "title": "Post-UTME requirements & aggregate",
    "desc": "How OOU screening and aggregate scores work.",
    "icon": "bi-calculator",
    "bg": "from-[#e6f6ea] to-[#dcfce7]",
    "iconColor": "text-[#15803d]",
    "source": "OOU Post-UTME portal announcements.",
    "items": [
      {
        "title": "Screening registration documents",
        "desc": "JAMB reg. number, O’level details, passport photo, valid email and phone number. Print your screening slip.",
        "tag": "Docs"
      },
      {
        "title": "How to calculate aggregate (typical pattern)",
        "desc": "A common pattern: UTME counts 50%, Post-UTME 30%, O’level grades 20% — but OOU’s exact weighting changes per session, so use the screening guideline for your year.",
        "tag": "Formula"
      },
      {
        "title": "Previous / current cut-off information",
        "desc": "Departmental cut-offs from last session are a guide, not a promise. Competitive departments move several points yearly — aim 10+ marks above last year’s cut-off.",
        "tag": "Cut-off"
      }
    ]
  },
  {
    "id": "status",
    "short": "Status & CAPS",
    "title": "Admission status, CAPS & change of institution",
    "desc": "Where to check and what to click.",
    "icon": "bi-patch-check",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "caps.jamb.gov.ng, OOU admission portal.",
    "items": [
      {
        "title": "How to check admission status",
        "desc": "Check BOTH the OOU portal and JAMB CAPS. Admission on one without the other is incomplete.",
        "tag": "Check"
      },
      {
        "title": "JAMB CAPS: accept or reject",
        "desc": "On CAPS, click Accept once offered. Ignoring the offer can void it. Print your JAMB admission letter afterwards.",
        "tag": "CAPS"
      },
      {
        "title": "Change of institution / course",
        "desc": "Done on the JAMB portal (with a fee) within the sale window. Reprint your slip and re-register for OOU screening if required.",
        "tag": "COI"
      }
    ]
  },
  {
    "id": "acceptance",
    "short": "Acceptance",
    "title": "Acceptance fee, verification & registration",
    "desc": "From offer to matric number.",
    "icon": "bi-card-checklist",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "source": "OOU acceptance/clearance notices, academic affairs.",
    "items": [
      {
        "title": "Acceptance fee",
        "desc": "Pay within the stated window on the OOU portal only. Missing it can forfeit the admission.",
        "tag": "Pay early"
      },
      {
        "title": "Physical verification",
        "desc": "Present originals: JAMB result, O’level, birth certificate, LGA identification, acceptance receipt and passport photos.",
        "tag": "Clearance"
      },
      {
        "title": "Registration & matric number",
        "desc": "Pay school fees, register courses, and collect your matric number before lectures and matriculation.",
        "tag": "Final step"
      }
    ]
  },
  {
    "id": "mistakes",
    "short": "Mistakes",
    "title": "Common admission mistakes",
    "desc": "These cost aspirants their slot every year.",
    "icon": "bi-exclamation-triangle",
    "bg": "from-[#fdf3cf] to-[#FBE7A1]",
    "iconColor": "text-[#8a6d00]",
    "items": [
      {
        "title": "Wrong JAMB subject combination",
        "desc": "The #1 killer — verify against the brochure for your exact OOU course before the exam."
      },
      {
        "title": "Ignoring CAPS",
        "desc": "Admission offered but never accepted on CAPS expires."
      },
      {
        "title": "Fake portals and agents",
        "desc": "Pay and register only on official OOU/JAMB portals. No agent can \"upgrade\" your score."
      },
      {
        "title": "Late uploads",
        "desc": "O’level upload delays on JAMB portal block screening and admission."
      }
    ]
  },
  {
    "id": "faq",
    "short": "FAQ",
    "title": "Aspirant FAQ",
    "desc": "Quick answers to repeated questions.",
    "icon": "bi-question-circle",
    "bg": "from-[#e6f6ea] to-[#dcfce7]",
    "iconColor": "text-[#15803d]",
    "items": [
      {
        "title": "Does OOU accept second choice?",
        "desc": "Generally prioritise first choice — switch to first choice via change of institution if serious about OOU."
      },
      {
        "title": "Can I combine WAEC and NECO?",
        "desc": "Usually yes at two sittings, except departments that insist on one sitting."
      },
      {
        "title": "What if my course is full?",
        "desc": "Watch for supplementary/shopping lists and be ready with an acceptable alternative course."
      },
      {
        "title": "When do lectures start for freshers?",
        "desc": "After clearance and matriculation — follow the academic calendar, not rumours."
      }
    ]
  }
]
