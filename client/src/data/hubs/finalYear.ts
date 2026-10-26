// Extracted from the original FinalYearPage.vue during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const finalYearCategories: HubCategory[] = [
  {
    "id": "topic",
    "short": "Topic",
    "title": "Final-year project & choosing a topic",
    "desc": "A good topic is narrow, measurable and completable in one session.",
    "icon": "bi-lightbulb",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "source": "Departmental project handbook, supervisor guidance.",
    "items": [
      {
        "title": "How to choose a project topic",
        "desc": "Pick a real problem in your field, confirm data/system access, and check that past students have not exhausted it. Clear it with your supervisor before writing.",
        "tag": "Step 1"
      },
      {
        "title": "Project proposal",
        "desc": "Problem statement, objectives, scope, methodology and expected outcome — usually 3–5 pages for approval."
      },
      {
        "title": "Department-specific requirements",
        "desc": "Every OOU department sets its own format, chapter count, citation style and defence rules — get the handbook first."
      }
    ]
  },
  {
    "id": "chapters",
    "short": "Chapters",
    "title": "Chapters 1 – 5 & literature review",
    "desc": "The classic Nigerian undergraduate structure.",
    "icon": "bi-book",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "items": [
      {
        "title": "Chapter 1 — Introduction",
        "desc": "Background, problem statement, objectives, research questions, significance, scope and definitions."
      },
      {
        "title": "Chapter 2 — Literature review",
        "desc": "Review related works, identify gaps your project fills, and organise thematically — not as random summaries."
      },
      {
        "title": "Chapter 3 — Methodology",
        "desc": "Research design, data collection, system analysis/design method, tools and procedures."
      },
      {
        "title": "Chapter 4 — Results / implementation",
        "desc": "Present findings, system screenshots, tables and analysis tied back to your objectives."
      },
      {
        "title": "Chapter 5 — Summary & conclusion",
        "desc": "Summary, conclusion, recommendations and suggestions for further work."
      }
    ]
  },
  {
    "id": "research",
    "short": "Research",
    "title": "Referencing, questionnaire & documentation",
    "desc": "Where many projects lose marks silently.",
    "icon": "bi-journal-check",
    "bg": "from-[#eef3ee] to-[#e8ece8]",
    "iconColor": "text-[#0a0a0a]",
    "items": [
      {
        "title": "Referencing",
        "desc": "Use your department’s style (commonly APA) consistently for in-text citations and the reference list. Uncited work risks plagiarism penalties."
      },
      {
        "title": "Questionnaire",
        "desc": "Keep questions short, neutral and tied to objectives. Pilot-test with a few respondents before mass distribution."
      },
      {
        "title": "Project documentation",
        "desc": "Title page, abstract, certification, dedication, acknowledgement, table of contents, lists of tables/figures, references and appendices."
      }
    ]
  },
  {
    "id": "system",
    "short": "System",
    "title": "System design, UML, implementation & testing",
    "desc": "For computing, engineering and technology projects.",
    "icon": "bi-cpu",
    "bg": "from-[#fdf5d7] to-[#fdeeb8]",
    "iconColor": "text-[#f5c842]",
    "items": [
      {
        "title": "System design",
        "desc": "Architecture, database schema, input/output design and module breakdown."
      },
      {
        "title": "UML",
        "desc": "Use-case, class and sequence/activity diagrams to show how the system works before you code."
      },
      {
        "title": "Implementation",
        "desc": "Tools, languages and hardware/software requirements plus key code modules and screenshots."
      },
      {
        "title": "Testing",
        "desc": "Unit, integration and user-acceptance tests with test cases and results tables."
      }
    ]
  },
  {
    "id": "defence",
    "short": "Defence",
    "title": "Project defence & common mistakes",
    "desc": "Defend what YOU did with confidence.",
    "icon": "bi-mic",
    "bg": "from-[#edf4dc] to-[#e8f2d4]",
    "iconColor": "text-[#3a8f4d]",
    "items": [
      {
        "title": "Project defence prep",
        "desc": "Prepare 10–15 slides: problem, objectives, method, results, conclusion. Rehearse likely questions on your methodology and findings."
      },
      {
        "title": "Common mistakes",
        "desc": "Copied projects, inconsistent chapters, fake data, missing references, unreadable screenshots and late binding."
      },
      {
        "title": "After defence corrections",
        "desc": "Implement panel corrections immediately and get your supervisor’s sign-off before final submission and clearance."
      }
    ]
  }
]
