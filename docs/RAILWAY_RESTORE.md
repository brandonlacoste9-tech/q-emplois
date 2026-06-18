# Restore Railway backend (Q-Emplois)

Your live frontend: **https://q-emplois.vercel.app**

The API URL in git (`q-emplois-production.up.railway.app`) is **dead (404)**. Signup fails until a new backend is live.

## Step 1 — Railway dashboard

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select repo: `brandonlacoste9-tech/q-emplois`
3. Railway should detect the root **Dockerfile** (NestJS backend)

## Step 2 — Environment variables

In the service → **Variables**, add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Supabase → Project Settings → Database → **Session pooler** URI (host `aws-1-us-east-1.pooler.supabase.com`, port **5432**) |
| `JWT_SECRET` | Random string, at least 32 characters |
| `CORS_ORIGIN` | `https://q-emplois.vercel.app` |
| `FRONTEND_URL` | `https://q-emplois.vercel.app` |
| `PORT` | `3000` (usually auto-set by Railway) |

**Do not set `REDIS_URL`** unless you have Redis — the app uses in-memory fallback.

Remove any `REDIS_URL` pointing at `localhost`.

## Step 3 — Domain

**Settings → Networking → Generate domain** → copy URL, e.g. `https://q-emplois-api-production.up.railway.app`

## Step 4 — Verify

Open: `https://YOUR-URL.up.railway.app/api/v1/health`

Expected: `{"status":"ok","service":"q-emplois-api",...}`

Deploy logs should show: `Connected to PostgreSQL`

## Step 5 — Wire Vercel (automated)

From repo root in PowerShell:

```powershell
.\scripts\setup-production.ps1 -RailwayUrl "https://YOUR-URL.up.railway.app"
```

This updates `frontend/.env.production`, sets Vercel `VITE_API_URL`, and redeploys.

## Step 6 — Run migrations (once)

```powershell
cd backend
$env:DATABASE_URL = "your-supabase-session-pooler-uri"
npx prisma migrate deploy
npm run seed
```

## Railway CLI (optional)

If CLI shows no output, re-login:

```powershell
railway login
railway link
railway variables set CORS_ORIGIN=https://q-emplois.vercel.app
```
