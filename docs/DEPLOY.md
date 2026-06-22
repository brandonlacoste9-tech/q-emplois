# Production deploy checklist

## Railway (backend)

1. Open the **active** Railway service → **Variables**:
   - `DATABASE_URL` — Supabase **session pooler** (`aws-1-us-east-1.pooler.supabase.com:5432`)
   - `JWT_SECRET` — min 32 chars
   - `CORS_ORIGIN` — Vercel frontend URL
   - `FRONTEND_URL` — same Vercel URL
   - `RESEND_API_KEY` — transactional email (password reset, application alerts)
   - `EMAIL_FROM` — e.g. `Q-Emplois <noreply@qemplois.ca>`
   - `MIGRATE_DATABASE_URL` — Supabase **session pooler** `:5432` (for auto-migrate on deploy)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — ID document storage (optional; falls back to inline)
   - Remove `REDIS_URL` if it points to localhost (in-memory fallback is fine)
   - Optional: `STRIPE_*`, `TWILIO_*` for payments and WhatsApp

2. **Settings → Domains** — copy the current `*.up.railway.app` URL (old `q-emplois-production` may 404 if the service was recreated).

3. After deploy, verify:
   - `GET https://YOUR-RAILWAY-URL.up.railway.app/api/v1/health` → `{ "status": "ok" }`
   - Logs show `Connected to PostgreSQL`

4. Run migrations once (local or CI):
   ```bash
   cd backend && npx prisma migrate deploy
   npm run seed   # optional demo data
   ```

## Vercel (frontend)

Set `VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api/v1` in Vercel env (or update `frontend/.env.production` and redeploy).

## Stripe webhook

Point Stripe to: `https://YOUR-RAILWAY-URL.up.railway.app/api/v1/payments/webhook`

## Tasker alerts (Telegram — live)

Taskers connect Telegram from **Profile**. Job alerts use the Telegram bot (`TELEGRAM_BOT_USERNAME` on Railway).

## WhatsApp (deferred)

Twilio WhatsApp is **not** part of the current beta. Do not configure `TWILIO_*` unless building Phase 3 messaging. User-facing copy is Telegram-only.

## Beta smoke test

1. Register client → post task
2. Register tasker → claim with credits → start → complete → review
3. Buy credits (Stripe test mode)
4. Send in-app message after claim
5. (Optional) L'Atelier escrow — requires `VITE_FEATURE_L_ATELIER=true` on Vercel
