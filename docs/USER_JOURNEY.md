# Q-emplois — Full User Journey Map

_Last updated: June 17, 2026. Based on a direct read of the live frontend routes, NestJS backend controllers, booking state machine, and Prisma schema._

---

## The two-sided marketplace, in one sentence

A **client** posts a job → a **provider** (a Québec tradesperson, RBQ-licensed) accepts it → work happens through a tracked status flow → money moves through **escrow (L'Atelier)** and is released on completion → both leave reviews.

Roles in the system (`UserRole`): **client**, **provider**, **admin**.

---

## Stage 0 — Discovery (public, no login)

The navy marketing pages are the front door. They all funnel to one of two wedges.

| Page | Route | Job in the funnel |
|---|---|---|
| Home (LandingPage) | `/` | Positions Q-emplois as the Québec-first local services marketplace |
| Portal | `/portal` | Hub: choose Q-business (hire) or Q-jobs (work) |
| Q-Jobs | `/q-jobs` | For providers: "find local service work" → CTA to register |
| Q-Business | `/q-business` | For clients/elite trades: RBQ, escrow, Loi 25 trust → CTA to register |
| L'Atelier | `/latelier` | The escrow product surface |

**Exit point of Stage 0:** every CTA → `/register` (or `/login` if returning).

---

## Stage 1 — Onboarding (Register → Login)

**Register** (`/register`, also aliased `/pro`) — a 3-step wizard:
1. Account basics (name, email, phone, password)
2. Trades selected (`serviceTypes`: plomberie, électricité, menuiserie, peinture, chauffage, climatisation, toiture, rénovation, jardinage, ménage, déménagement, autre)
3. Consent (Loi 25 — `consentGiven: true` sent to backend)

→ `POST /auth/register` returns `{ user, accessToken }` → token stored in `localStorage` → `loadUser()` → redirect to `/dashboard`.

**Login** (`/login`) → `POST /auth/login` → same token + redirect flow.
Session persistence: on app mount, if a token exists, `GET /profile` rehydrates the user. A `401` anywhere auto-bounces to `/login`.

Backend auth surface: `register, login, refresh, logout, me`, plus Telegram & WhatsApp account linking.

---

## Stage 2 — The logged-in home (Dashboard)

`/dashboard` (protected) loads three things in parallel:
- `GET /dashboard/stats` — earnings, ratings, job counts
- `GET /notifications` — latest 5
- `GET /jobs?status=accepted` — upcoming jobs (top 3)

This is the provider's command center. It's the hub everything else branches from.

---

## Stage 3 — The work loop (Jobs / Contrats)

`/jobs` (and alias `/contrats`) — the core daily screen. Tabbed by status, filterable by trade.

The **booking state machine** (enforced server-side) is the heart of the product:

```
pending ──► confirmed ──► in_progress ──► completed
   │            │              │
   └──► cancelled ◄────────────┘   (terminal: completed, cancelled)
```

Who can move each step:
- `pending → confirmed` — **provider** accepts (`POST /jobs/:id/accept`)
- `pending → cancelled` — client OR provider declines (`POST /jobs/:id/decline`)
- `confirmed → in_progress` — provider starts (`POST /jobs/:id/start`)
- `in_progress → completed` — provider completes (`POST /jobs/:id/complete`)
- cancel is available from pending/confirmed/in_progress

Each transition is permission-checked by role; invalid transitions return a French error.

---

## Stage 4 — Money (L'Atelier escrow)

`/latelier` — the escrow dashboard. Backed by `EscrowContract` + `EscrowMilestone` models and Stripe (`stripePaymentIntentId`).

Flow:
1. Client funds an escrow contract → `POST /payments/escrow`
2. Work is divided into **milestones** (status: PENDING → released)
3. On milestone completion → `POST /payments/escrow/:contractId/milestones/:milestoneId/release`
4. Provider sees a **tax reserve** calculation (Québec taxes set aside automatically)
5. `GET /payments/escrow` lists contracts; Stripe webhook (`POST /payments/webhook`) reconciles payment events

Parallel monetization: **Credits** (`CreditWallet` / `CreditTransaction`) — providers buy credit packs (`GET /credits/packs`, `POST /credits/purchase`) to unlock/bid on jobs. Balance + history at `GET /credits/balance` and `/credits/transactions`.

---

## Stage 5 — Identity & trust (Profile)

`/profile` — provider edits their trade profile, rates, service area, and uploads their **RBQ license** (`POST /profile/license`). This is the credibility layer that powers the Q-Business "élite des métiers" promise. Reviews (`Review` model) and `StarRating` feed reputation.

---

## Stage 6 — Communication (cross-cutting)

- In-app chat: `Conversation` + `ChatMessage` models, `/conversations` endpoint
- Notifications: `PlatformNotification` model, surfaced on the Dashboard
- WhatsApp + Telegram linking on the auth side — providers can get job alerts off-platform

---

## The complete loop, end to end

```
Visitor (home/portal)
   └─► picks wedge (Q-Jobs / Q-Business)
        └─► Register (3-step) ──► token ──► Dashboard
             └─► Jobs: accept ──► start ──► complete   (state machine)
                  └─► L'Atelier: escrow funded ──► milestone released ──► payout (minus tax reserve)
                       └─► Review left ──► reputation grows ──► more jobs
   (Credits bought along the way to unlock job access)
```

---

## Gaps & open questions before this flow is "real"

1. **Is the Railway backend live?** Everything past `/login` depends on `q-emplois-production.up.railway.app` being up and connected to Supabase. Unverified.
2. **Protected pages are still the old gray theme.** Dashboard, Jobs, Profile don't yet match the navy brand — the journey "breaks" visually right after login.
3. **Client-side journey is thin.** The frontend is provider-centric (accept/complete jobs). Where does a *client* post a job and fund escrow? That UI may be missing or admin-only right now.
4. **Stripe wiring.** Escrow depends on real Stripe keys + webhook configured in the Railway env.
5. **Seed data.** A new provider lands on an empty Dashboard — no jobs to accept. Need either seeded demo jobs or a client-posting flow to make the loop demonstrable.

---

## Suggested build order from here

1. Confirm backend is live (login/register end-to-end against Railway)
2. Theme Dashboard / Jobs / Profile to navy (close the visual break)
3. Build or expose the **client job-posting** path (so the marketplace has both sides)
4. Verify Stripe escrow end-to-end with test keys
5. Seed demo jobs so the Dashboard isn't empty on day one
6. Beta launch
