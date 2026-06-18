# Q-Emplois — Handoff Summary

_Last updated: June 18, 2026_

## Project Overview
**Q-Emplois** is a Québec-focused local jobs marketplace (small jobs, delivery, neighbor-to-neighbor services). It connects clients who need work done with local verified workers ("pros"). French-default with an EN toggle.

- **Repo:** `brandonlacoste9-tech/q-emplois` (private), branch `main`
- **Local path:** `/home/user/workspace/q-emplois` (frontend at `/frontend`)
- **Stack:** React + Vite + Tailwind + react-router-dom (frontend); NestJS (backend); Supabase (DB); deploys to Vercel (frontend, auto on push) + Railway (backend: `https://q-emplois-production.up.railway.app/api/v1`)
- **Build:** `cd frontend && npm run build` (currently passing, ~1846 modules; tsc is strict — remove unused imports)

## Design System ("cuir québécois" navy leather theme)
- **Colors:** bg `#1F2F3F`, deep `#152332`, cream `#D9B38C`, cream-hi `#E8CDB0`, gold `#B87B44`, muted `#C4A882`
- **Fonts:** Playfair Display (display) + Lora (body)
- **Tokens:** defined in `frontend/src/styles/theme.css` (classes: `.leather`, `.stitch-box`, `.gold-btn`, `.q-field`, `.nav-link`, `.nav-hide-sm`, `.nav-show-sm`, `.hero-fit`, `.search-bar`, etc.)

## What Was Done (this session)

### Strategic direction
- Decided to launch as a **single-wedge, jobs-only** product (not the original two-sided marketplace). Removed the "Q-business / trades" wedge across homepage, portal, and routes (deleted `/q-business` route). Kept the worker signup flow.
- Wrote a full user journey map → `docs/USER_JOURNEY.md` (Discover → Register → Dashboard → accept job → escrow → review loop, with flagged gaps).

### Theming (navy brand alignment)
- Re-themed all pages to the navy leather brand and aligned copy.
- Fully rewrote `Dashboard.tsx`, `Jobs.tsx`, `Profile.tsx` (navy theme, general local-job service types: déménagement, ménage, montage meubles, nettoyage, jardinage, livraison, coursier, autre).
- Built a new logged-in navbar: `frontend/src/components/AppNav.tsx` (navy, with mobile hamburger menu).
- Replaced the old gray AppShell/Navbar in `App.tsx`.

### Hero image
- Integrated the final AI-generated Québec hero image (`frontend/public/hero/hero-quebec.jpg`) — golden-hour valley, diverse workers, baked-in "Q-Emplois" wordmark + French tagline "Le marché du travail local pour le Québec."
- Removed duplicate HTML wordmark/headline to avoid double-logo; kept search bar layered on top with a gradient overlay.
- Locked hero to 16:9 aspect ratio so the full image shows (no top cropping).

### Mobile responsiveness (homepage)
- Homepage nav → hamburger menu + stacked dropdown on phones (≤640px).
- Hero reframed (cover/center crop) so it fits phone screens without clipping.
- Fixed form fields getting cut off → added `box-sizing: border-box` to `.q-field` (fixes inputs across Profile, Jobs, and search).
- Fixed "Trouver un pro" button being clipped → removed overflow clip, made search bar stack vertically with a full-width button on mobile.
- **Verified:** Dashboard/Jobs/Profile already use `auto-fit minmax()` grids (collapse to single columns on phones) and AppNav already has a mobile menu — so the whole app is now mobile-ready.

### Commits (all pushed to `main`)
| Commit | What |
|---|---|
| `2c5407a` | Align all pages to navy brand |
| `1c73a8c` | Hide trades wedge, focus on jobs |
| `eed1271` | Theme logged-in pages, jobs-focused |
| `c306293` | Add Québec hero image |
| `e215caf` | Remove redundant portal card, size hero |
| `922ca6f` | Shrink hero, show people |
| `0b6e7fc` | Lock hero to 16:9 (no crop) |
| `e83c459` | Mobile-responsive homepage (hamburger, hero) |
| `eaba8a5` | Fix form fields cut off on mobile |
| `3718312` | Fix "Trouver un pro" button clipped on mobile |

**Current HEAD on remote:** `3718312`

## Routes (App.tsx)
`/`, `/portal`, `/q-jobs`, `/latelier`, `/login`, `/register`, `/dashboard` (protected), `/jobs` (protected), `/contrats` (=Jobs, protected), `/pro` (=Register), `/profile` (protected). **Removed:** `/q-business`.

## Backend Status
NestJS backend is **built** (auth, jobs with accept/decline/start/complete, bookings state-machine pending→confirmed→in_progress→completed, payments/escrow + Stripe + milestones, credits, chat, providers, dashboard; roles: client/provider/admin) but **NOT confirmed live/responding**. ⚠️ First task for next person: verify the Railway backend is actually up.

- **Supabase:** ref `masefoylqhqfijszezla`, 16 tables, RLS enabled. (Connection creds are in the team's secrets / `.env.production` — not committed here.)

## What's Left To Do (priority order)
1. **Confirm Railway backend is live** — test the API endpoint before building anything that depends on it.
2. **Client job-posting UI** — there's currently no interface for clients to *post* a job (the journey map flags this as the biggest functional gap).
3. **Stripe payment/escrow wiring** — backend logic exists; needs frontend integration + Stripe keys configured.
4. **Seed data** — populate sample jobs/providers so the marketplace doesn't look empty at launch.
5. **Address 23 Dependabot vulnerabilities** (8 high, 11 moderate, 4 low) flagged on GitHub.
6. **Optional polish:** small sparkle artifact in bottom-right of the hero image (regenerate a clean version if desired); hero wordmark/tagline are baked into the image so they stay French even on EN toggle (acceptable for MVP, noted).

## Useful Dev Notes
- **Push pattern:** `git -c user.name="brandonlacoste9-tech" -c user.email="marifaf77@gmail.com" commit ...` then push with GitHub credentials.
- **Mobile testing:** localhost isn't reachable from the screenshot tool; use Playwright against `vite preview` (viewport 390×844 for phone). Mock `/api/v1/**` + set a localStorage token to test protected pages.
- Responsive helpers (`.nav-hide-sm`, `.nav-show-sm`, `.hero-fit`, `.search-bar`) live in `theme.css` under the `@media (max-width: 640px)` block — reuse them for any future mobile work.
