# 🚀 Deploying Playnex to Vercel

This guide provides step-by-step instructions for deploying **Playnex** to **Vercel**.

Playnex consists of:
- **Frontend:** React 18 + Vite + TypeScript (SPA)
- **Backend:** FastAPI (Python) + SQLAlchemy (PostgreSQL / MySQL / SQLite)

---

## 🌟 Choose Your Deployment Architecture

| Architecture | Description | Recommended For |
| :--- | :--- | :--- |
| **Option 1 (Recommended)** | **Frontend on Vercel + Backend on Render/Railway** | Best reliability, persistent DB, background sync, and easiest setup. |
| **Option 2 (All-in-One)** | **Full-Stack on Vercel Serverless** | Deploying both React and Python functions directly inside Vercel. |

---

## 📦 Option 1: Deploy Frontend to Vercel (Recommended)

### Step 1: Push your code to GitHub
Make sure your latest code is pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: configure Vercel deployment and environment variables"
git push origin main
```

### Step 2: Deploy Frontend on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Select your repository: **`Playnex`**.
3. Under **Project Settings**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select `frontend`
   - **Build Command:** `npm run build` (or leave default)
   - **Output Directory:** `dist` (default)
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | URL of your deployed FastAPI backend |
5. Click **Deploy**!

> [!NOTE]
> The included `frontend/vercel.json` automatically handles SPA client-side routing so refreshing pages like `/playlists/1` or `/dashboard` will not return 404 errors.

---

## ⚡ Option 2: Full-Stack Monorepo Deployment on Vercel

If you want to host both the React frontend and the Python FastAPI API directly on Vercel Serverless:

### Step 1: Configure a Hosted PostgreSQL Database
Because Vercel Serverless Functions have ephemeral filesystems, SQLite resets on every cold start. Use a free cloud database:
- **Neon PostgreSQL:** [neon.tech](https://neon.tech) (Free tier)
- **Supabase:** [supabase.com](https://supabase.com) (Free PostgreSQL)
- **Aiven / Railway:** Cloud PostgreSQL

### Step 2: Import Root Repository in Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select **`Playnex`** repository.
3. Keep **Root Directory** as `./` (the root).
4. Vercel will automatically read the root `vercel.json` and build:
   - `frontend/package.json` with `@vercel/static-build`
   - `api/index.py` with `@vercel/python`
5. Under **Environment Variables**, add:
   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` | Hosted PostgreSQL Connection String |
   | `SECRET_KEY` | `your-super-secret-key-min-32-chars` | JWT Secret Key |
   | `CORS_ORIGINS` | `*` | Allowed CORS origins |
   | `YOUTUBE_API_KEY` | *(Optional)* | Optional YouTube Data API v3 key |
6. Click **Deploy**!

---

## 💻 Deploying via Vercel CLI (Terminal)

You can also deploy directly from your terminal using the Vercel CLI:

### 1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

### 2. Deploy Frontend only:
```bash
cd frontend
vercel
```
Follow the interactive prompts:
- Set up and deploy? `Y`
- Link to existing project? `N`
- Project name: `playnex`
- Directory: `./`
- Modify build settings? `N`

For production deployment:
```bash
vercel --prod
```

### 3. Deploy Fullstack (Root):
```bash
# In the project root directory
vercel
vercel --prod
```

---

## 🛠️ Deploying the Backend to Render / Railway (For Option 1)

If you chose Option 1 (recommended for production Python apps):

### Deploy to Render ([render.com](https://render.com)):
1. Create a **New Web Service**.
2. Connect your `Playnex` GitHub repo.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, set:
   - `DATABASE_URL` = `sqlite:///./playlist_manager.db` (or PostgreSQL URL)
   - `SECRET_KEY` = `your-super-secret-jwt-key`
   - `CORS_ORIGINS` = `https://your-frontend.vercel.app`
5. Copy your Render service URL (e.g., `https://playnex-api.onrender.com`) and paste it as `VITE_API_BASE_URL` in your Vercel frontend project settings!

---

## ✅ Deployment Checklist

- [x] `frontend/vercel.json` SPA routing rewrite configured
- [x] `frontend/src/services/api.ts` dynamic `VITE_API_BASE_URL` support added
- [x] `api/index.py` and `api/requirements.txt` configured for serverless execution
- [x] Backend CORS configured to automatically allow `*.vercel.app` domains
- [x] Database connector supports both PostgreSQL (`postgres://` & `postgresql://`) and SQLite
- [x] `npm run build` tested and verified
