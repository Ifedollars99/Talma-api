# Talma

**Talma** is a social learning platform for students and lecturers: a feed where students trade
notes, ask questions and study together — built for class, not for scrolling.

Talma started life as *SocialStudy / Study Social*, a Vue 3 + Supabase application. It has been
migrated end-to-end to **React + TypeScript** on the front end and a custom **Node.js + Express +
MongoDB** API on the back end, keeping the original design, content and behaviour intact.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [MongoDB setup](#mongodb-setup)
- [Development commands](#development-commands)
- [API overview](#api-overview)
- [Authentication approach](#authentication-approach)
- [Testing](#testing)
- [Production build](#production-build)
- [Deployment](#deployment)
- [External integrations](#external-integrations)
- [Known limitations](#known-limitations)
- [Credits](#credits)

---

## Features

| Area | What Talma does |
| --- | --- |
| **Landing page** | Ticker, hero, feature/campus-moments carousels, students/lecturer sections, a public AI Study Assistant demo, WhatsApp contact and a working footer calendar. |
| **Authentication** | Sign up as *Student* or *Staff/Lecturer*, sign in with inline validation, sign out, password reset, session restore on reload, optional email verification. |
| **Profile** | Avatar dropdown, settings modal (Account, Region & language, Privacy), password strength meter, account deletion. |
| **Community feed** | For You / Following / Discover tabs, create posts with text, subject and image/video uploads, like/unlike, delete your own posts, desktop and X-style mobile layouts, floating action button on mobile. |
| **Courses** | Country → University → Campus → Faculty → Department → Level → Course browser with search, add faculty, add course (with PDF upload), in-app PDF viewer and download. |
| **Messages & communities** | Inbox with search and read state, *My Communities*, *Explore* with category filters, join/leave, create community. |
| **Tests** | Pick a faculty → department → answer a 10-question practice test → server-graded score. |
| **Assignments** | Assignment list with per-student submission state. |
| **Discover hubs** | Campus News, Aspirant/Admission, SIWES/IT, Academic, Final-Year and Know Your School (Leaflet satellite map + campus picker + place search). |
| **Notifications** | Server-backed notification counter. |
| **Study Assistant** | Full-page AI chat (General and Study modes, primary/secondary/university levels), streamed answers, Markdown rendering, picture attachments, multiple saved conversations and copy/share actions. Powered by any OpenAI-compatible model through the server proxy, with a free no-key text fallback and an offline demo reply when neither is reachable. |

---

## Tech stack

### Frontend — `client/`

| Concern | Technology |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Routing | React Router 6 (`BrowserRouter`, lazy routes) |
| Server state | TanStack Query 5 |
| Forms / validation | React Hook Form + Zod (schema definitions live with the API client; the original inline validation was preserved on the auth screens) |
| Styling | Tailwind CSS 3 (same configuration as the original app) + plain CSS files carrying the original scoped styles |
| Icons | Bootstrap Icons (kept from the original app) |
| Maps | Leaflet (Know Your School hub) |
| AI | Server-sent-event streaming client → `/api/ai/chat` (the API key never reaches the browser) |
| Tests | Vitest + React Testing Library |

### Backend — `server/`

| Concern | Technology |
| --- | --- |
| HTTP | Express 5 + TypeScript (strict, ESM) |
| Database | MongoDB + Mongoose 8 |
| Validation | Zod |
| Password hashing | Argon2id |
| Tokens | `jsonwebtoken` (access + refresh, refresh rotation with replay detection) |
| Security | Helmet, explicit CORS allow-list, `express-rate-limit` |
| Logging | Pino + `pino-http` |
| Uploads | Multer (local disk, served from `/uploads`) |
| Tests | Vitest + Supertest + `mongodb-memory-server` |

---

## Repository structure

```
talma/
├── package.json               # npm workspaces root (client + server)
├── docker-compose.yml         # optional local MongoDB
├── scripts/
│   ├── generate-course-pdfs.mjs   # regenerates the bundled course outlines
│   └── extract-hub-content.mjs    # one-off helper used during the migration
├── client/                    # React + TypeScript + Vite
│   ├── public/                # favicon, course-pdfs/, videos/
│   └── src/
│       ├── components/        # landing, layout, dashboard, courses, messages, hubs, ui
│       ├── data/hubs/         # static hub content (typed)
│       ├── hooks/             # TanStack Query hooks per API module
│       ├── lib/               # api client, auth provider, query client
│       ├── pages/             # route components
│       ├── styles/            # landing.css, auth.css (carried over from Vue)
│       └── types.ts           # shared API types
└── server/                    # Express 5 + TypeScript + MongoDB
    ├── src/
    │   ├── app.ts             # Express application
    │   ├── server.ts          # HTTP server + graceful shutdown
    │   ├── routes.ts          # /api route table
    │   ├── common/            # errors, middleware, utils, validation
    │   ├── config/            # env + logger
    │   ├── database/          # connection + seed
    │   ├── data/              # catalogue, communities, tests seed content
    │   └── modules/           # auth, users, posts, courses, communities,
    │                          # messages, assignments, notifications, tests,
    │                          # uploads, ai
    └── tests/                 # Vitest + Supertest suites
```

---

## Installation

**Requirements:** Node.js 20+ and npm 10+. MongoDB is optional for the frontend and required for the
API (see [MongoDB setup](#mongodb-setup)).

```bash
# 1. install every workspace dependency
npm install

# 2. create the environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. generate a couple of strong JWT secrets and paste them into server/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. start MongoDB (optional — see below)
docker compose up -d

# 5. seed the development data (course catalogue, communities, demo accounts)
npm run seed

# 6. start the API and the web client together
npm run dev
```

| Service | URL |
| --- | --- |
| Web client (Vite dev server) | <http://localhost:5173> |
| API | <http://localhost:4000/api> |
| API health check | <http://localhost:4000/api/health> |

The Vite dev server proxies `/api` and `/uploads` to the API, so the refresh-token cookie stays
same-origin during development.

### Seeded demo accounts

`npm run seed` creates three fictional accounts (all with the password `TalmaDemo123`):

| Username | Email | Role |
| --- | --- | --- |
| `AishaBello` | `aisha.bello@example.com` | Student |
| `TundeAdeyemi` | `tunde.adeyemi@example.com` | Student |
| `DrSarahOkonkwo` | `sarah.okonkwo@example.com` | Lecturer |

They come with a few enrolments, community posts, inbox messages, assignments and notifications so
the dashboard is not empty on a fresh install. Re-running the seed never overwrites your data; use
`npm run seed -- --force` to wipe and re-create the app collections.

---

## Environment variables

### `server/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` / `test` / `production`. |
| `PORT` | `4000` | HTTP port. |
| `HOST` | `0.0.0.0` | Bind address. |
| `CORS_ORIGINS` | `http://localhost:5173,…` | Comma-separated list of allowed browser origins. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/talma` | MongoDB connection string (local or Atlas). |
| `JWT_ACCESS_SECRET` | — | Secret for access tokens (≥ 16 chars). **Required.** |
| `JWT_REFRESH_SECRET` | — | Secret for refresh tokens. Must differ from the access secret in production. **Required.** |
| `JWT_ACCESS_TTL` | `15m` | Access-token lifetime. |
| `JWT_REFRESH_TTL` | `30d` | Refresh-token lifetime. |
| `REFRESH_COOKIE_NAME` | `talma_refresh` | Name of the refresh cookie. |
| `REFRESH_COOKIE_SECURE` | `false` | Set to `true` behind HTTPS in production. |
| `REFRESH_COOKIE_SAMESITE` | `lax` | `lax` / `strict` / `none`. |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `false` | Require a confirmed email address before signing in. |
| `PUBLIC_API_URL` | `http://localhost:4000` | Public base URL used to build absolute media URLs. |
| `UPLOAD_DIR` | `uploads` | Where uploaded media is written (relative to `server/`). |
| `UPLOAD_ALLOWED_TYPES` | image/video/pdf list | Comma-separated allow-list of upload MIME types. |
| `UPLOAD_MAX_MB` | `25` | Maximum upload size in megabytes. |
| `LOG_LEVEL` | `info` | Pino log level. |
| `OPENAI_API_KEY` | — | Server key for the Study Assistant. Empty = free Pollinations text fallback. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint (Gemini, Groq, DeepSeek, OpenRouter…). |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model name for the configured endpoint. |
| `AI_MAX_OUTPUT_TOKENS` | `1600` | Maximum reply length in tokens. |
| `AI_VISION_ENABLED` | `true` | Whether the configured server model can read pictures. |
| `FREE_AI_ENABLED` | `true` | Use the free no-key Pollinations text model when no server key is set. |
| `FREE_AI_BASE_URL` | `https://text.pollinations.ai/v1` | Free provider endpoint. |
| `FREE_AI_MODEL` | `openai-fast` | Free provider model (text only). |

### `client/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base URL of the API. Keep `/api` to use the dev proxy. |
| `VITE_API_PROXY_TARGET` | `http://localhost:4000` | Where the dev server proxies `/api` and `/uploads`. |
| `VITE_PORT` | `5173` | Dev-server port. |

> Only variables prefixed with `VITE_` reach the browser. Server secrets never leave the API
> process.

---

## MongoDB setup

**Option 1 — Docker (recommended for local development)**

```bash
docker compose up -d
```

This starts MongoDB 7 on `mongodb://127.0.0.1:27017/talma` with a named volume.

**Option 2 — MongoDB Atlas**

1. Create a free cluster and a database user.
2. Copy the connection string into `MONGODB_URI`, e.g.
   `mongodb+srv://user:password@cluster.mongodb.net/talma?retryWrites=true&w=majority`.
3. Allow your IP in the Atlas network access list.

The API waits up to 10 seconds for the initial connection and exits with a clear error if MongoDB
is unreachable.

---

## Development commands

Run from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and the web client together (`concurrently`). |
| `npm run dev:server` | API only, with hot reload (`tsx watch`). |
| `npm run dev:client` | Web client only (Vite dev server). |
| `npm run build` | Type-checks and builds both packages for production. |
| `npm run typecheck` | Strict TypeScript check for both packages. |
| `npm run lint` | ESLint over both packages. |
| `npm test` | Backend test suite (Vitest + Supertest + in-memory MongoDB). |
| `npm run seed` | Seeds the development data. |
| `npm run generate:pdfs` | Regenerates the bundled course-outline PDFs. |

Client-only and server-only scripts can be run with `npm run <script> --workspace client|server`.

---

## API overview

All endpoints are prefixed with `/api`. Protected routes expect `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | – | Create a student or lecturer account. |
| `POST` | `/login` | – | Sign in; sets the refresh cookie. |
| `POST` | `/refresh` | cookie | Rotate the refresh token and issue a new access token. |
| `POST` | `/logout` | cookie | Revoke every session for the user. |
| `GET` | `/me` | Bearer | The signed-in user's profile. |
| `POST` | `/forgot-password` | – | Start a password reset. Returns the token in development. |
| `POST` | `/reset-password` | – | Complete a password reset. |
| `POST` | `/verify-email` | – | Confirm an email address. |

### Users — `/api/users`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `PATCH` | `/me` | Bearer | Update username, region, language, timezone and privacy flags. |
| `POST` | `/me/password` | Bearer | Change the password (requires the current one). |
| `DELETE` | `/me` | Bearer | Permanently delete the account and all of its data. |
| `GET` | `/:username` | – | Public profile. |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | optional | Feed. `?feed=foryou\|following\|discover&search=&page=&limit=`. |
| `POST` | `/` | Bearer | Create a post (`content`, optional `subject`, `mediaType`, `mediaUrl`). |
| `POST` | `/:id/like` | Bearer | Like a post. |
| `DELETE` | `/:id/like` | Bearer | Remove a like. |
| `DELETE` | `/:id` | Bearer | Delete a post (author or admin only). |

### Courses — `/api/courses`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/catalog` | – | The full country → university → campus → faculty → department → level → course catalogue. |
| `POST` | `/catalog/faculties` | Bearer | Add a faculty to a campus. |
| `POST` | `/catalog/courses` | Bearer | Add a course to a level. |
| `GET` | `/` | Bearer | The caller's enrolments. |
| `POST` | `/` | Bearer | Enrol in a course. |
| `DELETE` | `/:id` | Bearer | Remove an enrolment. |

### Communities — `/api/communities`

`GET /` (directory with membership state) · `GET /mine` · `POST /` (create) · `POST /:id/join` ·
`POST /:id/leave`

### Messages — `/api/messages`

`GET /` (inbox, optional `?search=`) · `POST /` (send) · `POST /:id/read`

### Assignments — `/api/assignments`

`GET /` · `POST /` (lecturers and admins) · `POST /:id/submit`

### Notifications — `/api/notifications`

`GET /` (list + unread counter) · `POST /:id/read` · `POST /read-all`

### Tests — `/api/tests`

`GET /faculties` · `GET /attempts` · `POST /start` (draws the questions) · `POST /:id/submit`
(graded on the server)

### Uploads — `/api/uploads`

`POST /post-media` (multipart, field `file`) · `POST /course-pdf` (multipart, field `file`)

### Study Assistant — `/api/ai`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/status` | Bearer | Whether an AI provider is connected, which one, and whether it accepts pictures. |
| `POST` | `/chat` | Bearer | Streams an answer as server-sent events (`data: {"delta":"…"}` … `data: [DONE]`). Body: `messages`, `mode` (`general\|study`) and `level` (`primary\|secondary\|university`). Pictures ride along as data URLs; the server decides the model, prompt and temperature. |

The assistant uses `OPENAI_API_KEY` + `OPENAI_BASE_URL` + `OPENAI_MODEL` when a key is set. With no
key it falls back to the free, text-only Pollinations model, which allows one answer roughly every
30 seconds. The browser never sees the server key.

### Health

`GET /api/health`

---

## Authentication approach

* **Passwords** are hashed with **Argon2id** (memory-hard, `m=19456, t=2, p=1`). Plaintext
  passwords are never stored or logged.
* **Access tokens** are short-lived JWTs (15 minutes by default) and are kept **in memory only** in
  the React client — never in `localStorage`.
* **Refresh tokens** are long-lived JWTs (30 days by default) stored in an **HttpOnly, SameSite=Lax
  cookie** scoped to `/api/auth`. `Secure` is enabled in production.
* **Refresh-token rotation**: every refresh issues a new token and replaces the stored hash. The
  raw token is never persisted — only its SHA-256 hash. Presenting an already-rotated token is
  treated as a replay attack and revokes the entire session family.
* **Logout** revokes every active session for the user.
* **Rate limiting** is applied globally, with a stricter limiter on the credential endpoints and a
  separate limiter on writes.
* **Authorisation is enforced on the server.** Hiding a button in React is never the only
  protection: post deletion, assignment creation, message reads and profile updates all check
  ownership or role on the API.

---

## Testing

```bash
npm test                      # backend suite
npm run test --workspace client   # frontend component tests
```

The backend suite uses `mongodb-memory-server`, so **no running MongoDB instance is required**. It
covers:

* registration, duplicate handling, validation, login, logout and session revocation;
* refresh-token rotation and replay detection;
* the password-reset flow;
* post creation, pagination, search, likes, and **cross-user deletion protection**;
* profile updates and the guarantee that one student can never edit another student's profile;
* the Study Assistant: auth guard, provider status, request validation, picture rejection on a
  text-only model, and SSE streaming from a mocked upstream (including key isolation and upstream
  rate-limit/failure handling).

The frontend suite uses Vitest and React Testing Library and covers the Discover hub filter and the
hub search/empty-state behaviour.

---

## Production build

```bash
npm run build
```

* `server/` compiles to `server/dist/` — run it with `npm run start --workspace server`.
* `client/` compiles to `client/dist/` — serve it with any static host (nginx, Netlify, Vercel,
  Cloudflare Pages).

---

## Deployment

1. **API** — deploy `server/` to any Node host (Render, Railway, Fly.io, a VPS…). Set every
   variable from `server/.env.example`, use a `MONGODB_URI` pointing at Atlas or a managed
   MongoDB, and set `REFRESH_COOKIE_SECURE=true`, `NODE_ENV=production` and
   `CORS_ORIGINS=https://your-frontend-domain`.
2. **Web client** — build with `npm run build --workspace client` and serve `client/dist/`.
3. **Routing** — the client uses history routing, so the static host must rewrite unknown paths to
   `index.html`.
4. **API routing** — proxy `/api` and `/uploads` to the API host so the refresh cookie stays
   same-origin, or set `VITE_API_BASE_URL=https://api.your-domain.com/api` and add that origin to
   `CORS_ORIGINS` (use `SameSite=None; Secure` for the cookie in that setup).

---

## External integrations

| Integration | Status | Notes |
| --- | --- | --- |
| **MongoDB** | Required | Local Docker, a managed instance or MongoDB Atlas. |
| **OpenAI-compatible AI** | Optional | Powers the signed-in Study Assistant through the server proxy. Without a server key it falls back to the free Pollinations text model. Pictures need a vision-capable model — set `OPENAI_API_KEY`, `OPENAI_BASE_URL` and `OPENAI_MODEL` in `server/.env` (for example Gemini 2.5 Flash or Llama 4 Scout). |
| **OpenStreetMap / Nominatim** | Optional | Used by the *Know Your School* place search and by the Leaflet map tiles. |
| **Wikimedia Commons** | Optional | The landing page hotlinks campus photographs from Wikimedia Commons. |
| **Email delivery** | Not wired up | Password-reset and verification tokens are generated and logged server-side; in development the reset token is returned by the API so the flow can be completed locally. Connect a mail transport before deploying. |
| **ArcGIS imagery** | Optional | Satellite tiles for the campus map. |

---

## Known limitations

* **Comments** are counted on posts but there is no comment thread UI — the original application
  only ever displayed the counter.
* **Follow** relationships are not modelled; the *Following* tab shows posts written by lecturers,
  exactly as the original did.
* **Email delivery** is not implemented (see above).
* **Bookmarks and sharing** on posts are visual affordances only, as they were in the original.
* **Assistant history** is stored in the browser (`localStorage`) per device; conversations are not
  synced to the server or shared between devices.
* The free AI fallback is **text-only** and rate limited. Picture support and unlimited answers need
  an `OPENAI_API_KEY` on the server (see [External integrations](#external-integrations)).
* The bundled course-outline PDFs cover 328 unique course files for the 352 catalogue entries
  (a few courses share a code and title, so they map onto the same PDF) — this matches the original
  repository exactly.

---

## Credits

Built by **Ifedollars** (Hamzah Taofeeq ifedolapo). Campus photographs are credited to the
Wikimedia Commons contributors referenced on the landing page.

Licensed under the MIT License.
