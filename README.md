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
- [Paystack and the paid video library](#paystack-and-the-paid-video-library)
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
| **Landing page** | Ticker, hero, feature/campus-moments carousels, students/lecturer sections, a public LINT demo, WhatsApp contact and a working footer calendar. |
| **Authentication** | Sign up as *Normal user* or *Creator*, sign in with inline validation, sign out, password reset, session restore on reload, optional email verification. |
| **Profile** | Twitter-style profile screen at `/u/:username` with cover, avatar, bio, gender, country/state, creator badge and full post timeline. Editable avatar, bio and profile details, “View profile” in the avatar menu, settings modal (Account, Region & language, Appearance, Privacy), light/dark app theme in Settings only, password strength meter and account deletion. |
| **Community feed** | For You / Following tabs, creator search, create posts with text, subject and image/video uploads, like/unlike, delete your own posts, desktop and X-style mobile layouts, floating action button on mobile. |
| **Courses** | Country → University → Campus → Faculty → Department → Level → Course browser with search, add faculty, add course (with PDF upload), in-app PDF viewer and download. |
| **Paid videos** | Approved creators upload lessons from the browser; Talma sends the file straight to YouTube as a private video, an admin reviews it, then it becomes an unlisted, locked card. Students pay ₦2,000 once through Paystack and the creator receives 70% via a Paystack subaccount. Lifetime access per video, server-enforced entitlement. |
| **Messages & communities** | Inbox with search and read state, *My Communities*, *Explore* with category filters, join/leave, create community. |
| **Tests** | Pick a faculty → department → answer a 10-question practice test → server-graded score. |
| **Assignments** | Assignment list with per-student submission state. |
| **Discover hubs** | Campus News, Aspirant/Admission, SIWES/IT, Academic, Final-Year and Know Your School (Leaflet satellite map + campus picker + place search). |
| **Notifications** | Server-backed notification counter. |
| **LINT (Learning Intelligence)** | Full-page AI chat (General and Study modes, primary/secondary/university levels), streamed answers, Markdown rendering, picture attachments, multiple saved conversations and copy/share actions. Powered by any OpenAI-compatible model through the server proxy, with a free no-key text fallback and an offline demo reply when neither is reachable. |

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
│       ├── components/        # landing, layout, dashboard, courses, messages, videos, hubs, ui
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
    │                          # uploads, videos, creators, youtube, payments, ai
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

`npm run seed` creates four fictional accounts (all with the password `TalmaDemo123`):

| Username | Email | Role |
| --- | --- | --- |
| `AishaBello` | `aisha.bello@example.com` | Student |
| `TundeAdeyemi` | `tunde.adeyemi@example.com` | Student |
| `DrSarahOkonkwo` | `sarah.okonkwo@example.com` | Lecturer |
| `TalmaAdmin` | `admin@talma.app` | Admin |

The admin account reviews creator applications and uploaded videos in **Videos → Review**. Seeded
accounts are not creators by default: sign in as any user, open **Videos → Become a creator**, and
submit bank details (Paystack must be configured) to start the approval flow. The seeded users also
come with a few enrolments, community posts, inbox messages, assignments and notifications so the
dashboard is not empty on a fresh install. Re-running the seed never overwrites your data; use
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
| `EMAIL_PROVIDER` | `auto` | `auto` / `resend` / `smtp` / `ethereal` / `console`. `auto` prefers Resend, then SMTP, then Ethereal in development. |
| `RESEND_API_KEY` | — | Resend API key. Recommended for production email. |
| `MAIL_FROM` | `Talma <onboarding@resend.dev>` | Sender shown in inboxes. Use a verified domain in production. |
| `MAIL_REPLY_TO` | — | Optional reply-to address for support replies. |
| `SMTP_HOST` | — | SMTP server hostname when using `EMAIL_PROVIDER=smtp`. |
| `SMTP_PORT` | `587` | SMTP port (`465` with `SMTP_SECURE=true`). |
| `SMTP_SECURE` | `false` | Use implicit TLS for SMTP. |
| `SMTP_USER` | — | SMTP username. Leave empty for unauthenticated relays. |
| `SMTP_PASS` | — | SMTP password or app password. |
| `PUBLIC_API_URL` | `http://localhost:4000` | Public base URL used to build absolute media URLs. |
| `CLIENT_APP_URL` | `http://localhost:5173` | Public URL of the web client. Paystack sends buyers back to `/mycamp` here. |
| `PAYSTACK_SECRET_KEY` | — | Paystack secret key (`sk_test_…` locally, `sk_live_…` in production). Empty disables purchases. |
| `PAYSTACK_CURRENCY` | `NGN` | Currency sent to Paystack. Must match the currency of your Paystack account. |
| `PAYSTACK_CALLBACK_URL` | `${CLIENT_APP_URL}/mycamp` | Optional override for the post-checkout redirect. |
| `VIDEO_DEFAULT_PRICE_KOBO` | `200000` | Default video price in kobo (₦2,000). |
| `VIDEO_MAX_UPLOAD_BYTES` | `4294967296` | Maximum creator upload size (4 GiB). |
| `PLATFORM_VIDEO_SHARE_PERCENT` | `30` | Talma's cut of each video sale; creators receive the remainder. |
| `YOUTUBE_CLIENT_ID` | — | Google OAuth desktop-app client id. Required for creator uploads. |
| `YOUTUBE_CLIENT_SECRET` | — | Google OAuth client secret. Required for creator uploads. |
| `YOUTUBE_REFRESH_TOKEN` | — | Refresh token for the Talma channel, minted with `npm run youtube:auth --workspace server`. |
| `YOUTUBE_CHANNEL_ID` | — | The Talma channel id. Uploads that land on another channel are rejected. Required for uploads. |
| `YOUTUBE_CATEGORY_ID` | `27` | YouTube category id (27 = Education). |
| `UPLOAD_DIR` | `uploads` | Where uploaded media is written (relative to `server/`). |
| `UPLOAD_ALLOWED_TYPES` | image/video/pdf list | Comma-separated allow-list of upload MIME types. |
| `UPLOAD_MAX_MB` | `25` | Maximum upload size in megabytes. |
| `LOG_LEVEL` | `info` | Pino log level. |
| `OPENAI_API_KEY` | — | Server key for LINT. Empty = free Pollinations text fallback. |
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

### Email delivery

Talma sends branded transactional email for creator verification, creator welcome
messages and password resets. Resend is the recommended provider:

1. Create a free account at [resend.com](https://resend.com) and add an API key.
2. Verify your sending domain, then set `MAIL_FROM` to an address on that domain.
3. Run the interactive setup from the project root:

```bash
npm run email:setup
```

The setup writes the key and sender to `server/.env`, keeps a backup at
`server/.env.bak`, and can send a test message immediately. To configure it by
hand instead:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
MAIL_FROM="Talma <hello@yourdomain.com>"
MAIL_REPLY_TO=support@yourdomain.com
```

4. Send a test message:

```bash
npm run email:test --workspace server -- you@example.com
```

> Until you verify a domain in Resend, use `MAIL_FROM="Talma <onboarding@resend.dev>"`
> and send the test only to the email address on your Resend account. Resend
> rejects every other recipient from the shared `onboarding@resend.dev` sender.

To review the email design without sending anything:

```bash
npm run email:preview --workspace server
```

The previews are written to `server/email-previews/`.

If you prefer SMTP, set `EMAIL_PROVIDER=smtp` and fill in `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER` and `SMTP_PASS`. In development, `auto` falls back to **Ethereal** when
no Resend or SMTP credentials are present: emails are really sent to a throwaway
inbox and the API logs a preview URL. The creator verification modal shows that
preview link instead of exposing the code. A code is returned only when no
provider is configured at all, so local testing still works. In test and
production, `auto` falls back to the console only when no provider is configured;
set Resend or SMTP before deploying so real users can receive mail.

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

## Paystack, YouTube and the paid video library

Talma uses a **creator upload → admin review → Paystack sale** flow. Creators never paste links; the
browser uploads the file straight to the Talma YouTube channel through a one-time resumable session,
so large files do not pass through the API.

### 1. Paystack

1. Create a Paystack account and copy the secret key from
   *Dashboard → Settings → API Keys & Webhooks* into `PAYSTACK_SECRET_KEY` (use the test key while
   developing).
2. Set the webhook URL to `https://your-api-domain.com/api/payments/paystack/webhook` and make sure
   the API is reachable over HTTPS. For local testing, expose port 4000 with ngrok or cloudflared and
   use that HTTPS URL.
3. Approving a creator creates a Paystack **subaccount** using the bank details they submitted. Each
   checkout passes that subaccount to Paystack, which pays the creator directly. The platform keeps
   `PLATFORM_VIDEO_SHARE_PERCENT` (30% by default) and bears Paystack's processing fee
   (`bearer: account`). A ₦2,000 sale therefore pays the creator ₦1,400 before tax.
4. Live payments and creator payouts require a Paystack business account with completed KYC.

### 2. YouTube channel and OAuth

1. Sign in to Google with the account that owns the Talma YouTube channel. Create the channel if it
   does not exist, and **phone-verify** it — YouTube requires verification for videos longer than 15
   minutes.
2. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the
   **YouTube Data API v3**.
3. Configure the **OAuth consent screen** (External). While the app is in *Testing*, refresh tokens
   expire after 7 days; publish the app (or add the channel account as a test user and re-authorize
   weekly) before relying on uploads in production.
4. Create an OAuth client of type **Desktop app**, then put its id and secret in
   `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`.
5. Run the helper and approve access as the channel owner:

   ```bash
   npm run youtube:auth --workspace server
   ```

   Paste the printed `YOUTUBE_REFRESH_TOKEN` into `server/.env`. The helper also prints
   `YOUTUBE_CHANNEL_ID`; if it does not, copy it from *YouTube Studio → Settings → Channel →
   Advanced settings*. Restart the API.
   The refresh token is scoped to `https://www.googleapis.com/auth/youtube` so Talma can initiate
   uploads, switch privacy and delete rejected videos.

### 3. Running the flow

1. **Apply as a creator** — any signed-in user can open **Multimedia → Become a creator** and submit a
   display name, bio, bank and account number. Paystack verifies the account name immediately.
2. **Approve the creator** — an administrator opens **Videos → Review → Creator applications** and
   approves. Talma creates the Paystack subaccount; the creator can now upload.
3. **Upload** — the creator opens **Videos → Upload video**, chooses an MP4/WebM/MOV up to 4 GB and
   one hour, selects the curriculum **Subject** (for example Mathematics) and **Class level** (Primary
   1 through University 600 Level), and confirms they own the rights. The browser sends the file to
   YouTube in 8 MiB chunks
   with progress and automatic resume. The YouTube video is **private** and does not appear in the
   app yet.
4. **Review** — the admin sees the upload in **Review**, opens it in YouTube Studio, and either
   approves it (switches it to **unlisted** and publishes the card at ₦2,000) or rejects it (deletes
   the YouTube copy and shows the creator the reason).
5. **Buy** — a student taps **Unlock**. The API creates a Paystack transaction with the server-side
   price and the creator's subaccount, then redirects to hosted checkout. Paystack calls the webhook
   and sends the buyer back to `/mycamp`; Talma verifies the transaction and unlocks the video. The
   **Watch** button opens the unlisted YouTube URL in a new tab.

A **legacy admin flow** remains under **Videos → Add YouTube link** for already-published content.
It requires the same subject and class level and does not pay a creator. Existing catalogue entries
keep working with blank metadata until an administrator edits them.

The amount is always read from the database on the server — the browser cannot change the price.
Access is granted once per user per video, and a payment retry cannot grant it twice. Pending
checkouts are reused for 30 minutes so a double-click cannot create two payable references.

> **Important:** an unlisted YouTube link is not a true DRM lock. Anyone who receives the URL can
> watch it. If you need playback that cannot be shared, use a private video host with signed URLs
> instead of YouTube (see [Known limitations](#known-limitations)).

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
| `npm run make:admin --workspace server -- <email>` | Promotes an existing account to the admin role. |
| `npm run email:setup` | Interactively saves a Resend API key and sender to `server/.env`, then optionally sends a test. |
| `npm run email:test --workspace server -- <email>` | Sends a sample branded verification email through the configured provider. |
| `npm run email:preview --workspace server` | Renders both email templates to local HTML files for design review. |
| `npm run youtube:auth --workspace server` | One-time OAuth helper that prints the YouTube refresh token and channel id. |
| `npm run generate:pdfs` | Regenerates the bundled course-outline PDFs. |

Client-only and server-only scripts can be run with `npm run <script> --workspace client|server`.

---

## API overview

All endpoints are prefixed with `/api`. Protected routes expect `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | – | Create a normal user or creator account. |
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
| `PATCH` | `/me` | Bearer | Update username, avatar, bio, gender, country/state, language, timezone and privacy flags. |
| `POST` | `/me/password` | Bearer | Change the password (requires the current one). |
| `DELETE` | `/me` | Bearer | Permanently delete the account and all of its data. |
| `GET` | `/search` | optional | Search public accounts by username or bio. Empty `q` returns verified creators. |
| `GET` | `/:username` | optional | Public profile, follower/following counts and its posts. Private profiles are visible only to their owner. |
| `GET` | `/:username/followers` | optional | Public accounts following this profile. |
| `GET` | `/:username/following` | optional | Public accounts this profile follows. |
| `POST` | `/:username/follow` | Bearer | Follow an account. |
| `DELETE` | `/:username/follow` | Bearer | Unfollow an account. |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | optional | Feed. `?feed=foryou\|following&search=&page=&limit=`. `following` uses real follow relationships. |
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

`POST /post-media` (multipart, field `file`) · `POST /avatar` (multipart, field `file`) ·
`POST /course-pdf` (multipart, field `file`)

Post media accepts **photos and videos only** (JPEG, PNG, GIF, WebP, MP4, WebM); audio files are
rejected. Profile photos accept images only, up to 8MB. Course outlines accept PDF only.

### Creators — `/api/creators`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/me` | Bearer | The caller's creator profile and application status. |
| `GET` | `/banks` | Bearer | Paystack settlement-bank list for the application form. |
| `POST` | `/apply` | Bearer | Submit a creator application; Paystack resolves the bank account name. |
| `GET` | `/` | Admin | List applications, optionally filtered by `?status=pending`. |
| `POST` | `/:id/approve` | Admin | Approve the creator and create their Paystack subaccount. |
| `POST` | `/:id/reject` | Admin | Reject an application with a reason. |

### Videos — `/api/videos`

Signed-in students browse the library and buy one video at a time. Creator uploads go straight to
YouTube; Talma stores only the metadata and entitlement. The Videos section accepts **video files
only** — feed post media is unchanged and still accepts photos and videos.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | optional | Published catalogue with `locked` / `purchased` state. Administrators also receive every status. |
| `GET` | `/mine` | Bearer | The caller's own uploads in every state (creators/admins). |
| `GET` | `/review` | Admin | Uploads that finished on YouTube and are waiting for approval. |
| `GET` | `/:id` | optional | One video. Pending uploads are visible only to their creator and admins. |
| `GET` | `/:id/thumbnail` | – | Proxied YouTube thumbnail; a placeholder is served for private uploads. |
| `GET` | `/:id/watch` | Bearer | Returns the YouTube URL only when the video is free, purchased, owned or viewed by an admin. Otherwise `402 PAYMENT_REQUIRED`. |
| `POST` | `/:id/checkout` | Bearer | Creates a pending purchase and returns Paystack's `authorizationUrl`. The amount and creator split are read from the database. |
| `POST` | `/purchases/verify` | Bearer | Reconciles a payment after Paystack redirects the buyer back. Idempotent. |
| `POST` | `/uploads` | Creator | Reserve a YouTube resumable upload session (`title`, `description`, `subject`, `classLevel`, `fileName`, `mimeType`, `fileSizeBytes`, `madeForKids`). Returns a one-time `uploadUrl` for the browser. |
| `POST` | `/:id/upload-complete` | Creator | Verify the new YouTube id, duration and channel, then queue the video for review. |
| `POST` | `/:id/approve` | Admin | Switch the private YouTube video to unlisted and publish the card (optional `priceNaira`). |
| `POST` | `/:id/reject` | Admin | Delete the YouTube copy and mark the upload rejected with a reason. |
| `POST` | `/` | Admin | Legacy: add an existing video by pasting a YouTube link. |
| `PATCH` | `/:id` | Admin | Update metadata, price or visibility; published creator videos also update YouTube. |
| `DELETE` | `/:id` | Admin/owner | Administrators delete any video and its purchases; creators may delete their own unsold work. |

### Paystack webhook

`POST /api/payments/paystack/webhook` — called by Paystack, not by the browser. The API verifies the
`x-paystack-signature` HMAC-SHA512 against the **raw** request body, confirms the transaction with
Paystack's verify endpoint, checks the amount and currency, and grants access exactly once. The
webhook must be reachable over HTTPS in production (local development needs ngrok or cloudflared).

### LINT (Learning Intelligence) — `/api/ai`

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
* profile updates (avatar, bio, gender, state), private-profile owner access and the guarantee that
  one student can never edit another student's profile;
* the LINT assistant: auth guard, provider status, request validation, picture rejection on a
  text-only model, and SSE streaming from a mocked upstream (including key isolation and upstream
  rate-limit/failure handling);
* post media and avatar uploads: photos and videos accepted, audio/PDF rejected, authentication
  enforced, and profile photos restricted to images;
* paid videos: admin-only catalogue management, the YouTube id being hidden before purchase, the
  `402` guard on watch, server-side pricing, checkout initialization, webhook signature rejection,
  signed-webhook idempotency, return-from-Paystack reconciliation and cascade deletion;
* creator videos: creator onboarding and Paystack subaccount creation, the approved-creator upload
  guard, resumable session initialization, YouTube channel verification, the one-hour limit, the
  pending-review state being hidden from students, admin approve/reject, creator revenue-split
  checkout and rejection deleting the YouTube copy.

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
| **OpenAI-compatible AI** | Optional | Powers the signed-in LINT assistant through the server proxy. Without a server key it falls back to the free Pollinations text model. Pictures need a vision-capable model — set `OPENAI_API_KEY`, `OPENAI_BASE_URL` and `OPENAI_MODEL` in `server/.env` (for example Gemini 2.5 Flash or Llama 4 Scout). |
| **OpenStreetMap / Nominatim** | Optional | Used by the *Know Your School* place search and by the Leaflet map tiles. |
| **Paystack** | Optional | Paid video library and creator splits. Set `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY` and a public HTTPS webhook URL. Buyers pay on Paystack's hosted checkout and return to `/mycamp`; access is granted by the signed webhook. Creator approvals create Paystack subaccounts using the bank details in the application. |
| **YouTube Data API v3** | Optional | Approved creator uploads. Set the OAuth client id/secret, `YOUTUBE_REFRESH_TOKEN` and `YOUTUBE_CHANNEL_ID`. The API creates resumable sessions; the browser uploads directly to Google. Review happens in YouTube Studio before a video is switched to unlisted. |
| **Wikimedia Commons** | Optional | The landing page hotlinks campus photographs from Wikimedia Commons. |
| **Email delivery** | Optional | Resend is recommended for production; SMTP is supported. Development falls back to an Ethereal preview inbox when no credentials are set. Configure `RESEND_API_KEY`/`MAIL_FROM` or SMTP before real users need verification or reset emails. |
| **ArcGIS imagery** | Optional | Satellite tiles for the campus map. |

---

## Known limitations

* **Paid videos live on YouTube as unlisted uploads.** Unlisted videos are hidden from the channel
  page, search and recommendations, but anyone who obtains the URL can still watch them — YouTube
  offers no way to restrict playback to referrals from a specific app. Talma withholds the URL until
  the student pays, but it cannot stop a paying student from sharing the link. True playback locking
  requires a video host with signed URLs (Bunny Stream, Cloudflare Stream, Mux) instead of YouTube.
  Selling access to YouTube-hosted videos is also not an officially supported YouTube paywall, and
  YouTube's terms describe the service as personal, non-commercial use; check the current terms
  before charging at scale. The channel owner bears the risk of termination or copyright strikes for
  creator uploads.
* **Talma does not store or transcode video files.** The creator's browser uploads directly to
  YouTube through a resumable session; the API only stores metadata and a one-time session URL. A
  YouTube channel must be phone-verified to upload videos longer than 15 minutes, and the default
  YouTube quota allows roughly 100 uploads per day. The existing 25 MB uploader is for feed images,
  short feed videos and course PDFs only.
* **Creator payouts are only as good as the bank details and Paystack KYC.** Talma creates a
  subaccount with `percentage_charge` set to the platform's cut and asks Paystack to settle the
  creator's share directly. Refunds, chargebacks and tax reporting are not automated; reconcile them
  in the Paystack dashboard. The platform bears Paystack's processing fee (`bearer: account`).
* **YouTube OAuth in *Testing* mode expires after 7 days.** Publish the OAuth consent screen for a
  long-lived refresh token, and re-run `npm run youtube:auth` if the token is revoked. The
  `YOUTUBE_CHANNEL_ID` guard prevents a misconfigured token from publishing to the wrong channel.
* **Paystack** must be configured for purchases. The webhook needs a public HTTPS URL, and live
  payments require a Paystack business account and completed KYC. Paystack's processing fee is
  deducted from the platform's share, not the creator's.
* **Comments** are counted on posts but there is no comment thread UI — the original application
  only ever displayed the counter.
* **Development email previews stay in Ethereal.** With no Resend or SMTP credentials, emails are
  captured by a throwaway Ethereal inbox and are not delivered to the recipient. Configure a real
  provider before relying on email outside local development.
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
