# 🎬 CineLink

> A full-stack movie & TV series discovery app with custom admin panel, Firebase backend, TMDb API, and Telegram bot integration.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase) ![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)

---

## ✨ Features

### 🌐 Public Side
- Search movies & TV series via **TMDb API**
- Full detail pages: poster, rating, runtime, cast, overview, trailer
- Custom data from **Firebase**: watch link, added date, admin note
- **"Request Movie"** button → auto-sends message to your Telegram channel via bot (user never leaves the site)
- Real-time updates when admin adds new content

### 🔒 Admin Panel (`/admin`)
- Protected by **Firebase Auth** (single admin email)
- Search TMDb and add/edit entries with:
  - `custom_link` (Telegram or any URL)
  - `note` (optional info)
  - `added_date` (auto-set)
- Edit and delete existing entries
- View & manage all user requests (fulfill / reject)
- Real-time request notifications

---

## 📁 Folder Structure

```
cinelink/
├── api/
│   └── telegram.js          # Vercel serverless — bot token lives here only
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── tmdb.js          # All TMDb API calls
│   ├── components/
│   │   ├── CastCard.jsx
│   │   ├── HeroSection.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MediaRow.jsx
│   │   ├── MovieCard.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RequestModal.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Firebase Auth context
│   ├── firebase/
│   │   ├── config.js        # Firebase init
│   │   └── firestore.js     # All Firestore CRUD helpers
│   ├── pages/
│   │   ├── Admin.jsx        # Admin dashboard
│   │   ├── Home.jsx         # Landing page
│   │   ├── Login.jsx        # Admin login
│   │   ├── MovieDetails.jsx
│   │   ├── NotFound.jsx
│   │   ├── Search.jsx
│   │   └── SeriesDetails.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

---

## 🚀 Quick Setup

### 1. Clone & install

```bash
git clone https://github.com/tharindu899/cinelink.git
cd cinelink
npm install
```

### 2. Get your API keys

#### TMDb API
1. Go to [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Create a free account → request an API key
3. Copy the **API Key (v3 auth)**

#### Firebase
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Create a user with your admin email & password
5. Enable **Firestore Database** → start in production mode
6. Go to **Project Settings → Your apps → Web** → copy the config

#### Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copy the **bot token**
3. Add the bot to your channel as admin
4. Get the **channel chat ID** (use [@userinfobot](https://t.me/userinfobot) or `https://api.telegram.org/bot<TOKEN>/getUpdates`)

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_ADMIN_EMAIL=admin@yourdomain.com

# Server-side only — DO NOT prefix with VITE_
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_channel_id
```

### 4. Deploy Firestore rules

Edit `firestore.rules` — replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` with your actual admin email.

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

For local serverless function testing, install Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

---

## ☁️ Deploy to Vercel

### Option A: Vercel Dashboard (recommended)

1. Push your repo to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Set **Framework Preset** to `Vite`
5. Add all environment variables from `.env` in **Settings → Environment Variables**
   - Include `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (no `VITE_` prefix)
6. Deploy!

### Option B: Vercel CLI

```bash
vercel
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
vercel --prod
```

---

## 🔐 Firestore Security Rules

The rules in `firestore.rules` enforce:

| Collection  | Read       | Write      |
|-------------|------------|------------|
| `movies`    | Public     | Admin only |
| `series`    | Public     | Admin only |
| `requests`  | Admin only | Public     |

---

## 🗄️ Firestore Data Model

### `movies/{tmdbId}`
```json
{
  "tmdb_id": 550,
  "type": "movie",
  "title": "Fight Club",
  "poster_path": "/path.jpg",
  "custom_link": "https://t.me/your_channel/123",
  "note": "1080p, English subtitles",
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
  "custom_link": "https://t.me/your_channel/456",
  "note": "All 8 seasons",
  "added_date": "<Timestamp>",
  "updated_at": "<Timestamp>"
}
```

### `requests/{auto-id}`
```json
{
  "tmdb_id": 12345,
  "title": "Some Movie",
  "type": "movie",
  "poster_path": "/path.jpg",
  "requested_at": "<Timestamp>",
  "status": "pending"
}
```

---

## 🛣️ Routes

| Route         | Description              | Protected |
|---------------|--------------------------|-----------|
| `/`           | Home — trending & popular| No        |
| `/search`     | Search & filter          | No        |
| `/movie/:id`  | Movie detail page        | No        |
| `/series/:id` | Series detail page       | No        |
| `/login`      | Admin login              | No        |
| `/admin`      | Admin dashboard          | ✅ Yes    |

---

## 🧰 Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite 5              |
| Routing   | React Router v6                |
| Styling   | Tailwind CSS 3                 |
| Auth      | Firebase Authentication        |
| Database  | Firebase Firestore             |
| API       | TMDb API v3                    |
| Bot       | Telegram Bot API               |
| Serverless| Vercel Functions               |
| Deploy    | Vercel                         |

---

## 📝 License

MIT — free to use and modify.
