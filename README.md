# 🎬 CineLink

> A full-stack movie & TV series discovery platform with a custom admin panel, Firebase backend, TMDb API integration, and a Telegram bot for user requests.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)](https://firebase.google.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**Live demo:** [cinelink-eight.vercel.app](https://cinelink-eight.vercel.app)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#1-clone--install)
  - [API Keys Setup](#2-api-keys-setup)
  - [Configure Environment Variables](#3-configure-environment-variables)
  - [Deploy Firestore Rules](#4-deploy-firestore-rules)
  - [Run Locally](#5-run-locally)
- [Deploying to Vercel](#-deploying-to-vercel)
- [Firestore Data Model](#-firestore-data-model)
- [Firestore Security Rules](#-firestore-security-rules)
- [Admin Panel Guide](#-admin-panel-guide)
- [Public Site Guide](#-public-site-guide)
- [Telegram Bot Integration](#-telegram-bot-integration)
- [Routing](#-routing)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)

---

## 🌐 Overview

CineLink is a self-hosted movie and TV series site. Users can browse trending titles from the TMDb API, discover what's available to download, and request content they can't find. The admin manages all available content through a protected dashboard — adding download links, managing episodes, fulfilling or rejecting user requests, and receiving real-time Telegram notifications.

---

## ✨ Features

### Public Side
- **Hero section** — auto-rotating banner of trending titles from TMDb with smooth fade transitions
- **Available on CineLink** — real-time list of titles the admin has added with download links
- **Browse & Search** — search movies and TV series via TMDb API with live dropdown suggestions
- **Movie / Series detail pages** — poster, backdrop, rating, runtime, cast, genres, trailers, similar titles
- **Quality-based download links** — per-title and per-episode links organized by resolution (4K, 1080p, 720p, etc.)
- **Episode browser** — per-season episode list with individual download links
- **Person detail pages** — cast member profiles with filmography and biography
- **Request system** — users can request any movie, series, or specific episode; requests are deduplicated and tracked
- **Watchlist** — save titles to a local watchlist using `localStorage`

### Admin Panel (`/admin`)
- **Protected by Firebase Auth** — single admin email, fully server-side enforced via Firestore rules
- **Real-time dashboard** — live stats for total movies, series, and pending requests
- **TMDb search to add content** — search TMDb and add a title in one step
- **Multi-quality link management** — add separate download URLs for 4K, 1080p, 720p, 480p, 360p
- **Quality / source tagging** — tag entries with BluRay, WEB-DL, WebRip, HDTV, CAMRip, etc.
- **Episode manager** — add, edit, and delete individual episodes for any series
- **Request management** — view all pending requests, fulfill them by adding links directly from the request panel, or reject them
- **Real-time Telegram notifications** — new requests are instantly forwarded to a Telegram channel via a Vercel serverless function

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 |
| Typography | Bebas Neue (display), DM Sans (body), JetBrains Mono (mono) |
| Icons | react-icons (Feather set) |
| Toast notifications | react-hot-toast |
| Authentication | Firebase Authentication (Email/Password) |
| Database | Firebase Firestore |
| External content API | TMDb API v3 |
| Bot integration | Telegram Bot API |
| Serverless function | Vercel Functions (`api/telegram.js`) |
| Hosting | Vercel |

---

## 📁 Project Structure

```
cinelink/
├── api/
│   └── telegram.js              # Vercel serverless — Telegram bot handler (server-side only)
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── api/
│   │   └── tmdb.js              # All TMDb API calls (search, details, trending, genres, person)
│   │
│   ├── components/
│   │   ├── CastCard.jsx         # Cast member card with link to person page
│   │   ├── HeroSection.jsx      # Auto-rotating trending hero banner
│   │   ├── LoadingSpinner.jsx   # Spinner + skeleton loaders (CardSkeleton, DetailsSkeleton)
│   │   ├── MediaRow.jsx         # Horizontally scrollable row of MovieCards
│   │   ├── MovieCard.jsx        # Poster card used across all grids and rows
│   │   ├── Navbar.jsx           # Fixed top nav with live search dropdown
│   │   ├── ProtectedRoute.jsx   # Guards /admin — redirects if not logged in as admin
│   │   └── RequestModal.jsx     # Request flow (idle → checking → already_requested → done)
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # Firebase Auth context (user, isAdmin, login, logout)
│   │
│   ├── firebase/
│   │   ├── config.js            # Firebase app init (auth + firestore)
│   │   └── firestore.js         # All Firestore CRUD helpers (entries, episodes, requests)
│   │
│   ├── pages/
│   │   ├── Admin.jsx            # Full admin dashboard (movies, series, requests tabs)
│   │   ├── Home.jsx             # Landing page (hero + available + media rows)
│   │   ├── Login.jsx            # Admin login page
│   │   ├── MovieDetails.jsx     # Movie detail page with download panel
│   │   ├── NotFound.jsx         # 404 page
│   │   ├── PersonDetails.jsx    # Cast/crew profile page with filmography
│   │   ├── Search.jsx           # Search results page with tabs and pagination
│   │   └── SeriesDetails.jsx    # Series detail page with episode manager
│   │
│   ├── App.jsx                  # Route definitions
│   ├── index.css                # Tailwind layers + custom component classes
│   └── main.jsx                 # React root + BrowserRouter + AuthProvider + Toaster
│
├── .env.example                 # Environment variable template
├── .gitignore
├── firebase.json                # Firebase CLI config (Firestore rules + indexes)
├── firestore.indexes.json
├── firestore.rules              # Security rules (public read, admin write, request create)
├── index.html                   # Vite entry HTML (Google Fonts loaded here)
├── package.json
├── postcss.config.js
├── tailwind.config.js           # Custom colors (brand, dark), fonts, animations
├── vercel.json                  # SPA rewrites + CORS headers for /api/*
└── vite.config.js
```

---

## ⚙️ How It Works

### Content flow

```
Admin searches TMDb  →  Selects a title  →  Adds download links + quality tags
       ↓
Entry saved to Firestore (movies / series collection)
       ↓
Public site reads Firestore in real-time  →  "Available on CineLink" section updates instantly
```

### Request flow

```
User clicks "Request" on any title or episode
       ↓
RequestModal checks Firestore for an existing request (by request_key)
       ↓
If new: saves request to Firestore  →  calls /api/telegram serverless function
       ↓
Telegram bot sends formatted message to admin's channel
       ↓
Admin sees request in dashboard  →  adds links  →  marks as "fulfilled"
       ↓
User sees updated status on next request check
```

### Episode flow (series)

```
Admin opens Episode Manager for a series
       ↓
Adds episodes per season with individual download links (4K, 1080p, etc.)
       ↓
Episodes stored in Firestore subcollection: series/{seriesId}/episodes/{s01e01}
       ↓
SeriesDetails page reads episodes in real-time, organizes by season
       ↓
Users see per-episode download buttons; missing episodes show "Request" button
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [TMDb account](https://www.themoviedb.org/settings/api)
- A [Firebase project](https://console.firebase.google.com) (free Spark plan is sufficient)
- A [Telegram bot](https://t.me/BotFather) and a channel for notifications
- A [Vercel account](https://vercel.com) for deployment

---

### 1. Clone & Install

```bash
git clone https://github.com/tharindu899/cinelink.git
cd cinelink
npm install
```

---

### 2. API Keys Setup

#### TMDb API Key
1. Go to [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Create a free account and request an API key
3. Copy the **API Key (v3 auth)** — it looks like `abcd1234ef5678...`

#### Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (disable Google Analytics if not needed)
3. Enable **Authentication → Sign-in method → Email/Password**
4. Under Authentication → Users, create a user with your admin email and a strong password
5. Enable **Firestore Database** → Start in **production mode**
6. Go to **Project Settings → Your apps → Web**, register a web app, and copy the `firebaseConfig` object

#### Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts — you will receive a **bot token** like `7123456789:AAH...`
3. Create a Telegram channel (or use an existing one)
4. Add your bot to the channel as an **Administrator** with permission to post messages
5. Get the channel's **chat ID**:
   - Send a test message in your channel
   - Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser
   - Look for `"chat":{"id":...}` in the result — this is your chat ID (usually negative for channels, e.g. `-1001234567890`)

---

### 3. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# ─── TMDb ─────────────────────────────────────────────
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p

# ─── Firebase ─────────────────────────────────────────
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ─── Admin ────────────────────────────────────────────
# Must exactly match the Firebase Auth user you created
VITE_ADMIN_EMAIL=admin@yourdomain.com

# ─── Telegram (server-side only — DO NOT prefix with VITE_) ───
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_channel_chat_id
```

> **Important:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` must NOT have the `VITE_` prefix. They are only used in the Vercel serverless function (`api/telegram.js`) and are never exposed to the browser.

---

### 4. Deploy Firestore Rules

Open `firestore.rules` and replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` with your actual admin email:

```js
function isAdmin() {
  return request.auth != null
      && request.auth.token.email == 'your-actual-admin@email.com';
}
```

Then deploy the rules using the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

### 5. Run Locally

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

To test the Telegram serverless function locally, install and use the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

This runs the `/api/telegram` function locally alongside Vite so the request modal works end-to-end.

---

## ☁️ Deploying to Vercel

### Option A — Vercel Dashboard (recommended)

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Set **Framework Preset** to `Vite`
4. Under **Settings → Environment Variables**, add every variable from your `.env` file — including `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (without the `VITE_` prefix)
5. Click **Deploy**

### Option B — Vercel CLI

```bash
vercel
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
vercel --prod
```

> After deploying, go to your Vercel project → **Settings → Functions** and confirm that `api/telegram.js` appears as a serverless function.

---

## 🗄️ Firestore Data Model

### `movies/{tmdbId}`

```json
{
  "tmdb_id": 550,
  "type": "movie",
  "title": "Fight Club",
  "poster_path": "/path.jpg",
  "links": {
    "1080p": "https://t.me/your_channel/123",
    "720p": "https://t.me/your_channel/124"
  },
  "note": "WEB-DL · English subtitles",
  "added_date": "<Timestamp>",
  "updated_at": "<Timestamp>"
}
```

### `series/{tmdbId}`

```json
{
  "tmdb_id": 1399,
  "type": "series",
  "name": "Game of Thrones",
  "poster_path": "/path.jpg",
  "links": {
    "1080p": "https://t.me/your_channel/200"
  },
  "note": "BluRay · All 8 seasons",
  "added_date": "<Timestamp>",
  "updated_at": "<Timestamp>"
}
```

### `series/{tmdbId}/episodes/{s01e03}`

Episode IDs are zero-padded: `s01e03`, `s02e11`, etc.

```json
{
  "season": 1,
  "episode": 3,
  "title": "Lord Snow",
  "links": {
    "1080p": "https://t.me/your_channel/210",
    "720p": "https://t.me/your_channel/211"
  },
  "note": "WEB-DL · English",
  "added_date": "<Timestamp>",
  "updated_at": "<Timestamp>"
}
```

### `requests/{autoId}`

```json
{
  "tmdb_id": 12345,
  "title": "Dune: Part Two",
  "type": "movie",
  "poster_path": "/path.jpg",
  "request_key": "12345",
  "requested_at": "<Timestamp>",
  "status": "pending"
}
```

For episode requests, `request_key` is `"tmdbId_s1e3"` (e.g. `"1399_s2e9"`).

**Status values:** `pending` | `fulfilled` | `rejected`

---

## 🔐 Firestore Security Rules

```
Collection        Read          Write
─────────────────────────────────────────────────
movies            Public        Admin only
series            Public        Admin only
series/*/episodes Public        Admin only
requests          Admin only    Public (create)
```

- Any visitor can read movie/series data and submit a request
- Only the admin (verified by email in the JWT token) can write entries or read requests
- Users can create requests but cannot read, update, or delete them

---

## 🛠️ Admin Panel Guide

Navigate to `/admin` (you will be redirected to `/login` if not authenticated).

### Movies tab
- Use the TMDb search box to find a movie
- Click a result to open the **Add Entry** modal
- Add download URLs for each quality (4K, 1080p, 720p, 480p, 360p) — leave empty qualities blank
- Optionally select a source tag (BluRay, WEB-DL, etc.) and add a custom note
- Click **Save** — the entry appears on the public site immediately

### Series tab
- Same flow as movies
- After saving a series, click the **Episodes** button on its row to open the **Episode Manager**
- In the Episode Manager, specify Season and Episode numbers, add per-episode download links, and save
- Episodes appear in the `SeriesDetails` page organized by season

### Requests tab
- Shows all user requests ordered by most recent
- Pending requests have a **Fulfill** button — click to expand a panel where you add download links and fulfill the request in one action (this saves the entry and marks the request as `fulfilled`)
- **Reject** marks the request as `rejected` without saving content
- **Delete** (trash icon) permanently removes the request record

---

## 📱 Public Site Guide

### Home page
- The **Hero** rotates through the top 5 weekly trending titles from TMDb
- **Available on CineLink** shows all titles the admin has added, sorted newest first — with a green dot and quality count badge
- Rows below show Trending Today, Popular Movies, Popular Series, Top Rated, and Now Playing from TMDb

### Search page (`/search`)
- Type in the search bar and press Enter, or use the live dropdown in the navbar for quick navigation
- Filter by **All / Movies / Series / Trending / Top Rated** using the tab row
- Results are paginated; click **Load More** to fetch the next page

### Movie / Series detail pages
- If the title is available on CineLink, a green **Available** badge and a download panel appear below the hero
- Quality pills let you switch between available resolutions before downloading
- For series, the **Watch Episodes** section lists all episodes by season — green dot = download available, grey dot = not yet added
- Missing episodes show a **Request** button that opens the request modal pre-filled with the episode info
- Cast cards link to the person's profile page
- The heart button saves the title to a local watchlist (stored in `localStorage`)

### Request modal states
| State | What the user sees |
|---|---|
| `checking` | Spinner while Firestore is queried for an existing request |
| `already_requested` | Shows the existing request's status (pending / fulfilled / rejected) |
| `idle` | Confirmation screen with the title info and Send Request button |
| `loading` | Sending spinner while Firestore write + Telegram call complete |
| `done` | Success screen confirming the request was sent |

---

## 🤖 Telegram Bot Integration

The Telegram notification is handled entirely server-side by `api/telegram.js` — a Vercel Edge/Node serverless function. The bot token never reaches the browser.

**Notification format (Markdown):**

```
🔔 New Movie Request

🎬 Title: Oppenheimer
🆔 TMDb ID: `872585`
🔗 View on TMDb
⏰ Requested: Mon, 06 Apr 2026 10:30:00 GMT
```

For episode requests:

```
🔔 New TV Episode Request

📺 Title: Breaking Bad
🎞 Episode: Season 3 · Episode 7
🆔 TMDb ID: `1396`
🔗 View on TMDb
⏰ Requested: ...
```

The Firestore request is always saved first; the Telegram call is best-effort (a failed notification does not block the request from being recorded).

---

## 🛣️ Routing

| Route | Component | Protected |
|---|---|---|
| `/` | `Home` | No |
| `/search` | `Search` | No |
| `/movie/:id` | `MovieDetails` | No |
| `/series/:id` | `SeriesDetails` | No |
| `/person/:id` | `PersonDetails` | No |
| `/login` | `Login` | No |
| `/admin` | `Admin` | ✅ Admin only |
| `*` | `NotFound` | No |

The `vercel.json` rewrites all paths to `index.html` so React Router handles client-side navigation correctly after deployment.

---

## 🎨 Customization

### Colors

Edit `tailwind.config.js`. The primary brand color is red (`#ed1f13`). To change it, update the `brand` color scale:

```js
brand: {
  500: '#your-color',
  600: '#your-darker-color',
  // ...
}
```

### Fonts

Fonts are loaded from Google Fonts in `index.html`. The three typefaces are:

| Variable | Font | Usage |
|---|---|---|
| `font-display` | Bebas Neue | Section titles, hero headings |
| `font-body` | DM Sans | All body text, buttons, labels |
| `font-mono` | JetBrains Mono | Badges, episode codes, quality tags |

### Available qualities / sources

Edit the `RESOLUTIONS` and `QUALITIES` arrays at the top of `src/pages/Admin.jsx`:

```js
const RESOLUTIONS = ['4K', '1080p', '720p', '480p', '360p'];
const QUALITIES   = ['BluRay', 'WEB-DL', 'WebRip', 'HDTV', 'CAMRip', 'HDRip', 'DVDRip', 'Blurry'];
```

---

## 🐛 Troubleshooting

**Site shows blank / routing broken after deploy**
→ Check that `vercel.json` is present in the repo root. The SPA rewrite (`"source": "/(.*)"` → `index.html`) is required for React Router to work on Vercel.

**TMDb images not loading**
→ Verify `VITE_TMDB_IMAGE_BASE` is set to `https://image.tmdb.org/t/p` (no trailing slash).

**Admin login says "Invalid credential"**
→ Make sure the user was created in Firebase Authentication (not just in Firestore), and that `VITE_ADMIN_EMAIL` exactly matches the email used there.

**Telegram notifications not arriving**
→ Confirm `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set in Vercel environment variables (not prefixed with `VITE_`). Check your Vercel function logs under **Deployments → Functions**.

**Firestore permission denied errors in browser console**
→ Run `firebase deploy --only firestore:rules` to push the updated `firestore.rules` file. Make sure the admin email in the rules matches `VITE_ADMIN_EMAIL`.

**Request modal always shows "Already Requested"**
→ The `request_key` field is used to deduplicate. If you want to reset this for testing, delete the document from the `requests` collection in the Firebase console.

**Episodes not appearing on the series page**
→ Episodes are stored in a Firestore subcollection (`series/{id}/episodes`). Make sure the series itself was saved to Firestore first (it must exist as a document) before adding episodes through the Episode Manager.

---

## 📄 License

MIT — free to use, fork, and modify.

---

## 👨‍💻 Author

**Tharindu Prabath**
- GitHub: [@tharindu899](https://github.com/tharindu899)
- Email: tprabath81t@gmail.com

---

*Powered by [TMDb](https://www.themoviedb.org). This product uses the TMDb API but is not endorsed or certified by TMDb.*
