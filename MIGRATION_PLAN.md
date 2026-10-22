# Talma Migration Plan

Audit of the original **SocialStudy / "Study Social"** Vue 3 + Supabase app, and the plan to
migrate it to **Talma** (React + TypeScript + Vite frontend, Node/Express + TypeScript +
MongoDB backend).

## 1. What the original app actually contains

### Framework / tooling
| Concern | Original | Target |
| --- | --- | --- |
| UI framework | Vue 3 SFC (`@vue/cli-service`, webpack) | React 19 + TypeScript + Vite |
| Routing | Vue Router 4 (lazy `import()`) | React Router 7 (`createBrowserRouter`, lazy) |
| State | Pinia installed but **no stores defined** | React state + TanStack Query |
| Styling | Tailwind CSS 3 + per-SFC `<style scoped>` | Tailwind CSS 3 (same version) + CSS Modules-free plain CSS files |
| Icons | `bootstrap-icons` (CSS font, `bi bi-*` classes) | **kept** — framework-agnostic |
| Backend | Supabase (Auth + Storage only; no Realtime/RPC) | Express 5 + Mongoose + MongoDB |
| Animations | `animate.css`, `aos` — **imported but never used** | removed |
| Charts | `chart.js`, `chartkick`, `vue-chartjs` — **never used** | removed |
| Extras | `swiper`, `bootstrap`, `@popperjs/core`, `material-design-icons`, `@vueuse/core` — **never used** | removed |
| Maps | `leaflet` — used in *Know Your School* | **kept** |
| PDF gen | `pdf-lib` — used by `scripts/generate-course-pdfs.mjs` | **kept** (root devDependency) |

### Supabase surface that must be replaced
| Original usage | File | Replacement |
| --- | --- | --- |
| `supabase.auth.signUp` (metadata: username, category, user_type, role) | `views/SignUpPage.vue` | `POST /api/auth/register` |
| `supabase.auth.signInWithPassword` | `views/SignInPage.vue` | `POST /api/auth/login` |
| `supabase.auth.getUser()` (read username/role) | `views/MycampPage.vue`, `views/MyprofilePage.vue` | `GET /api/auth/me` |
| `supabase.auth.updateUser({ data: { username } })` | `views/MyprofilePage.vue` | `PATCH /api/users/me` |
| `supabase.auth.signOut()` | `views/MyprofilePage.vue` | `POST /api/auth/logout` (refresh-token revocation) |
| `supabase.storage.from('courses').getPublicUrl()` | `components/MycoursesPage.vue` | `POST /api/uploads/course-pdf` → `/uploads/courses/<file>` |
| `supabase.storage.from('courses').download()` | `components/MycoursesPage.vue` | same upload endpoint + static file serving |
| hard-coded anon key in `src/supabase.js` | `src/supabase.js` | removed; server-side secrets only |

### Feature inventory (all preserved)
1. **Landing** — ticker, hero crossfade carousel, feature marquee, campus-moments carousel,
   students/lecturers section, AI Study Assistant (OpenAI + offline fallback), WhatsApp
   contact, footer with working month calendar.
2. **Auth** — sign-up (category student/lecturer, username, email, password strength meter,
   terms), sign-in (inline validation, remember-me), sign-out, profile dropdown + settings
   modal (Account / Region & language / Privacy), delete-account, password reset.
3. **Dashboard** — desktop sidebar + mobile bottom nav, welcome banner, For You / Following /
   Discover feed tabs, quick-stat cards, post composer (text + subject + image/video),
   post feed (like, delete, share, bookmark), delete-confirmation modal.
4. **Courses** — Country → University → Campus → Faculty → Department → Level → Course
   browser, search, add faculty, add course, PDF viewer modal, PDF download.
5. **Messages & Communities** — chats list, My Communities, Explore (category filter, join/leave),
   create community.
6. **Tests** — faculty → department → 10-question quiz → score.
7. **Assignments** — list, submit.
8. **Discover hubs** — Campus News, Aspirant/Admission, SIWES/IT, Academic, Final-Year,
   Know Your School (Leaflet satellite map + campus picker + Nominatim place search).
9. **Notifications** — bell counter.
10. **AI Study Assistant** — General and Study modes with primary/secondary/university levels,
    streamed Markdown answers through the server proxy (`/api/ai/chat`), picture attachments when a
    vision-capable model is configured, saved conversations in `localStorage`, and a free text-only
    fallback (Pollinations) plus an offline demo reply when no provider is reachable.

### Design system to preserve (do not redesign)
* **Landing** — Fraunces + Inter, `--ink #0a0a0a`, `--paper #fff`, `--paper-warm #f6f5f2`,
  `--rule #dedbd4`, `--highlight #f5c842`, clipped corner `clip-path` cards, marquee.
* **App** — navy `#1C2B39`, gold `#C6862E`, teal `#2F6F5E`, hairline `#E4E0D8`,
  page `#F7F5F0`, muted `#8B95A0`, body `#5B6672`, danger `#8B3A3A`, tints `#FBF3E4`,
  `#E9F2EF`, `#EFEAE0`. Fonts: **Lora** (headings) + **Inter** (body).
* **Auth** — taichi animated background, glassmorphism card, black/white.

## 2. Target repository layout

```
talma/
├── package.json              # npm workspaces root (client + server)
├── docker-compose.yml        # optional local MongoDB
├── scripts/generate-course-pdfs.mjs
├── client/                   # React + TS + Vite
│   ├── public/               # fav.png, course-pdfs/, videos/
│   └── src/
│       ├── components/       # layout, dashboard, courses, messages, hubs…
│       ├── pages/            # route components (landing, auth, dashboard, hubs)
│       ├── hooks/            # TanStack Query hooks per module
│       ├── lib/              # api client, auth provider, query client
│       └── styles/
└── server/                   # Express 5 + TS + Mongoose
    └── src/
        ├── app.ts / server.ts
        ├── config/ database/ common/ modules/ data/
```

## 3. Backend modules (only what the app really uses)

`auth`, `users`, `posts`, `courses` (catalog), `communities`, `messages`, `assignments`,
`notifications`, `tests`, `uploads`.

Mongo models: `User`, `RefreshSession`, `Post`, `Reaction`, `Community`,
`CommunityMembership`, `Message`, `Assignment`, `AssignmentSubmission`, `Notification`,
`CourseCatalog`, `TestQuestion`, `TestAttempt`, `UploadedFile`.

## 4. Execution order
1. Root workspace scaffolding + env templates + docker-compose.
2. Backend: config, db, common (errors, middleware, validation), modules, seed.
3. Frontend: Vite + Tailwind setup, shared contracts, layout, then each page.
4. Wire API client + TanStack Query hooks; remove all hard-coded arrays that the API now serves.
5. Build, typecheck, lint, test both packages; fix real failures.
6. README + docs.

## 5. Progress checklist
- [x] Audit repository
- [x] Migration plan
- [x] Root scaffolding (npm workspaces, env templates, docker-compose)
- [x] Backend implementation (config, db, common, 10 modules, seed)
- [x] Backend tests (29 passing — Vitest + Supertest + in-memory MongoDB)
- [x] Frontend scaffold (Vite 6 / React 18 / strict TypeScript / Tailwind 3)
- [x] Frontend shared contracts + typed API client + auth provider
- [x] Frontend landing page (header, hero, marquee, moments, assistant, footer calendar)
- [x] Frontend auth pages (sign in, sign up, forgot/reset password)
- [x] Frontend dashboard (feed tabs, composer, courses browser, messages/communities, tests, assignments, profile settings)
- [x] Frontend hub pages (Campus News, Aspirant, SIWES, Academic, Final Year, Know Your School with Leaflet)
- [x] AI Study Assistant (Express module + streaming client, dashboard view, free fallback, image attachments)
- [x] Assistant tests (status, validation, vision guard, SSE streaming, upstream errors)
- [x] Cleanup (Vue SFCs, Vue Router, Pinia, Supabase client, unused dependencies and configs removed)
- [x] Build + verify (client and server production builds pass)
- [x] Documentation (README rewritten for Talma)

### Brand rename map
| Old | New |
| --- | --- |
| "Study Social" (header, footer, ticker, page title) | "Talma" |
| "Studysocial" (document title) | "Talma — Social learning for students and lecturers" |
| "Join Campus Today" (sign-up subtitle) | "Join Talma and get started" |
| `support@studysocial.com` | `support@talma.app` |
| `study-assistant-key` (localStorage) | `talma-assistant-key` |
| `study-social-root` (CSS class) | `talma-app` |
| `ss_region` / `ss_language` / `ss_timezone` (localStorage) | stored on the user profile through the API |
| `VUE_APP_OPENAI_API_KEY` | `VITE_OPENAI_API_KEY` |
| `STUDY SOCIAL · COURSE OUTLINE` (PDF header) | `TALMA · COURSE OUTLINE` |
