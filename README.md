# 🚀 PLAYNEX

<div align="center">

**Turn Any YouTube Playlist into a Structured, Distraction-Free Technical Mastery Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

[Features](#-key-features) • [Architecture](#-tech-stack--architecture) • [Getting Started](#-quickstart-guide) • [API Reference](#-api-endpoints) • [Configuration](#-environment-variables)

</div>

---

## 📌 Overview

Free technical education on YouTube is world-class, but the YouTube interface is engineered for entertainment, algorithmic retention, and ads rather than course completion. 

**PlayNex** transforms unstructured YouTube playlists into an interactive, distraction-free learning environment equipped with **frame-accurate timestamped notes**, **active recall revision queues**, **dedicated doubt resolution workflows**, and **real-time learning telemetry**.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🛡️ **Distraction-Free Video Engine** | Custom player stripped of recommendation sidebars, clickbait feeds, and comment rabbit holes. Automatic progress synchronization every 8 seconds, auto-resume from the last second watched, and seamless auto-play for next videos. |
| ⚡ **Resilient 3-Tier Ingestion** | Fetch any playlist via URL or ID using an intelligent 3-tier fallback engine: **YouTube Data API v3** $\rightarrow$ **`yt-dlp` flat extractor** $\rightarrow$ **Web HTML scraper**. Never blocked by API rate limits. |
| ⏱️ **Frame-Accurate Timestamp Notebook** | 1-click note creation tied directly to the exact playback second. Clicking any timestamp chip in your notes immediately seeks the player to that exact video frame. |
| ❓ **Integrated Doubt Resolution Hub** | Log doubts during video playback with an `OPEN` $\rightarrow$ `RESOLVED` lifecycle. Attach resolution notes, step-by-step solutions, and reference links for later review. |
| 🧠 **Spaced Revision & Active Recall** | Flag high-difficulty videos into **High / Medium / Low** priority queues. Switch into dedicated *Revision Focus Mode* to rapidly drill concepts before technical interviews and exams. |
| 📑 **Auto Chapter & Topic Quick-Jump** | Regex engine automatically extracts creator-defined chapter timestamps from video descriptions into a horizontal quick-jump navigation strip with active-chapter highlighting. |
| 🏷️ **Custom Taxonomy & Tag Matrix** | Categorize and organize videos across playlists using a multi-color tagging matrix (e.g., `DSA`, `System Design`, `Interview`, `Backend`) with 1-click multi-filtering. |
| 📊 **Learning Telemetry & Analytics** | Real-time progress dashboard calculating curriculum completion %, video status breakdowns (*Completed*, *In Progress*, *Unstarted*), watch time estimation, and 1-click resume. |
| 🔐 **Dual-Mode Authentication** | **6-digit Email OTP verification** with rate limiting & brute-force defense, plus an instant **1-Click Ephemeral Guest Sandbox** pre-seeded with starter courses for zero-friction exploration. |

---

## 🆚 Why PlayNex? (Comparative Matrix)

| Dimension | Native YouTube | Generic Notes (Notion / Docs) | Paid LMS (Udemy / Coursera) | **PlayNex** |
| :--- | :---: | :---: | :---: | :---: |
| **Learning Environment** | ❌ High distraction & ads | ⚪ Text only, disconnected | ⚪ Proprietary paywalled video | ✅ **100% Focused & Distraction-Free** |
| **Timestamp Linking** | ❌ Manual comments | ⚪ External text links | ⚪ Basic progress bar only | ✅ **1-Click Auto-Timestamp & Seek** |
| **Doubt Tracking** | ❌ Lost in comments | ❌ Plain text notes | ⚪ Slow unlinked forums | ✅ **Structured Open $\rightarrow$ Resolved Hub** |
| **Active Recall / Spaced Queues** | ❌ None | ⚪ Manual task lists | ❌ Linear playback only | ✅ **Priority Revision Queues** |
| **Content Freedom** | ⚪ Unstructured tutorials | ⚪ User must paste everything | ❌ Expensive closed silos | ✅ **Import ANY Public YouTube Playlist** |
| **Chapter Navigation** | ⚪ Scrubber only | ❌ None | ⚪ Creator uploaded | ✅ **Auto-Extracted Topic Quick-Jump** |
| **Instant Sandbox** | ❌ Requires Google login | ❌ Requires sign-up | ❌ Paid subscriptions | ✅ **1-Click Ephemeral Guest Mode** |

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) — Asynchronous high-performance REST API
- **ORM & Database:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with [SQLite](https://sqlite.org/) (configurable for PostgreSQL/MySQL)
- **Validation:** [Pydantic v2](https://docs.pydantic.dev/) & `pydantic-settings`
- **Security:** PyJWT, Passlib (Bcrypt password hashing), OTP token verification
- **Scraping & Video Ingestion:** `yt-dlp`, `httpx`, YouTube Data API v3 client

### Frontend
- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with modern dark-mode glassmorphism
- **Routing:** [React Router v6](https://reactrouter.com/)
- **Icons & Visuals:** [Lucide React](https://lucide.dev/), Canvas Confetti
- **HTTP Client:** [Axios](https://axios-http.com/)

---

## 📂 Project Structure

```text
playnex/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI route controllers
│   │   │   ├── analytics.py # Learning metrics & telemetry endpoints
│   │   │   ├── auth.py      # Dual-mode auth (Email OTP + Guest Sandbox)
│   │   │   ├── doubts.py    # Doubt lifecycle (Open / Resolved)
│   │   │   ├── notes.py     # Timestamp-anchored notes
│   │   │   ├── playlists.py # Playlist ingestion & management
│   │   │   ├── progress.py  # Video playback position & status sync
│   │   │   ├── revisions.py # Spaced priority revision queues
│   │   │   ├── tags.py      # Custom taxonomy matrix
│   │   │   └── videos.py    # Video metadata & chapters
│   │   ├── core/            # App configuration & security settings
│   │   ├── db/              # SQLAlchemy session & database initializer
│   │   ├── models/          # Database ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # YouTube multi-tier scraper & email SMTP service
│   │   ├── main.py          # FastAPI application entrypoint
│   │   └── seed.py          # Demo course & mock data seeder
│   ├── .env.example         # Backend environment template
│   ├── requirements.txt     # Python backend dependencies
│   ├── test_api.py          # Backend API unit/integration tests
│   └── test_auth_flow.py    # End-to-end OTP authentication tests
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI components (Player, Notes, Doubts, etc.)
│   │   ├── context/         # AuthContext & global state providers
│   │   ├── pages/           # Application views (Dashboard, PlaylistView, Notes, etc.)
│   │   ├── services/        # Axios API client integrations
│   │   ├── types/           # TypeScript data contracts & interfaces
│   │   ├── utils/           # Timestamp formatters & helpers
│   │   ├── App.tsx          # App root routing & layout
│   │   ├── index.css        # Tailwind directives & global styling
│   │   └── main.tsx         # React DOM mount point
│   ├── package.json         # Frontend dependencies & scripts
│   ├── tailwind.config.js   # Tailwind theme configurations
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite configuration
│
└── README.md
```

---

## 🚦 Quickstart Guide

### 1. Prerequisites
- **Node.js** 18.0 or higher
- **Python** 3.10 or higher
- **Git**

---

### 2. Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(By default, SQLite is configured and ready to use immediately without any external database setup).*

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`.  
   Interactive Swagger documentation is available at `http://localhost:8000/api/docs`.

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install Node packages:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   The frontend application will start at `http://localhost:5173`.

---

## ⚙️ Environment Variables

Configure your backend settings in `backend/.env`:

```ini
# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
# Default: Local SQLite (zero configuration required)
DATABASE_URL=sqlite:///./playlist_manager.db
# PostgreSQL Example:
# DATABASE_URL=postgresql://user:password@localhost:5432/playnex_db

# ==============================================================================
# SECURITY & JWT
# ==============================================================================
SECRET_KEY=change-this-to-a-super-secret-random-key-in-production-playnex-2026
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ==============================================================================
# YOUTUBE API (Optional: Built-in scraper handles ingestion without key)
# ==============================================================================
YOUTUBE_API_KEY=

# ==============================================================================
# EMAIL SMTP CONFIGURATION (For 6-Digit Signup/Login OTP Delivery)
# ==============================================================================
# When left empty, OTP codes are logged directly to the backend terminal for easy dev testing.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=True
SMTP_SSL=False
EMAILS_FROM_EMAIL=noreply@playnex.com
EMAILS_FROM_NAME=Playnex Platform
```

---

## 📡 API Endpoints

PlayNex provides comprehensive REST APIs. Explore and test live with Swagger UI at `/api/docs`:

| Resource | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/send-otp` | Request a 6-digit registration OTP |
| **Auth** | `POST` | `/api/auth/verify-otp` | Verify OTP and issue JWT access token |
| **Auth** | `POST` | `/api/auth/login` | Email/password sign-in |
| **Auth** | `POST` | `/api/auth/guest` | Instant guest sandbox session |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Playlists** | `POST` | `/api/playlists/import` | Ingest playlist via YouTube URL / ID |
| **Playlists** | `GET` | `/api/playlists` | List user's imported playlists |
| **Playlists** | `GET` | `/api/playlists/{id}` | Retrieve playlist with videos and stats |
| **Playlists** | `DELETE`| `/api/playlists/{id}` | Delete playlist from library |
| **Progress** | `POST` | `/api/progress/update` | Sync playback timestamp & video status |
| **Notes** | `GET` | `/api/notes/` | Get all timestamped notes |
| **Notes** | `POST` | `/api/notes/` | Create a new frame-accurate note |
| **Notes** | `DELETE`| `/api/notes/{id}` | Delete a note |
| **Doubts** | `GET` | `/api/doubts/` | Get doubts with status filters |
| **Doubts** | `POST` | `/api/doubts/` | Create a timestamp-linked doubt |
| **Doubts** | `PATCH`| `/api/doubts/{id}` | Update doubt status (`OPEN` / `RESOLVED`) |
| **Revisions** | `GET` | `/api/revisions/` | List prioritized revision queue |
| **Revisions** | `POST` | `/api/revisions/` | Add/update video revision priority |
| **Tags** | `GET` | `/api/tags/` | List all custom taxonomy tags |
| **Tags** | `POST` | `/api/tags/` | Create a custom tag |
| **Analytics** | `GET` | `/api/analytics/dashboard`| Aggregate curriculum mastery statistics |

---

## 🧪 Testing

Run backend test suites:

```bash
# Run API endpoint tests
python backend/test_api.py

# Run end-to-end OTP authentication tests
python backend/test_auth_flow.py
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


<div align="center">
Made with ❤️ for focused learners worldwide.
</div>


npm install

npm is Node Package Manager, which comes with Node.js.
This downloads and installs the libraries/packages that the frontend needs.
It usually creates a node_modules folder.
npm run dev

Starts the frontend's development server.
It lets you view the website locally while you're developing it.
