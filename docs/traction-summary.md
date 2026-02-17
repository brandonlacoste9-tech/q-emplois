# Q-emplois — Traction Summary

> Internal metrics dashboard & progress tracker

---

## Current status: Phase 1 — Foundation

**Last updated:** February 17, 2026

---

## 1. Build progress

### Completed

| Component | Status | Notes |
|---|---|---|
| Project scaffolding | ✅ Done | Express + React 19 + Vite 7 + Drizzle + Neon |
| OpenClaw bot framework | ✅ Done | 8 skills defined (search, booking, payment, notification, review, profile, registration, service listing) |
| Auth flow design | ✅ Done | JWT-based, WhatsApp Business API + Telegram deep-link |
| Booking conversation flow | ✅ Done | State machine: START → ASK_SERVICE → ASK_DATE → ASK_LOCATION → MATCH → CONFIRM → FINALIZE |
| Tradesmen portal wireframes | ✅ Done | Profile, jobs, calendar, payments sections |
| WHITEPAPER | ✅ Done | Internal roadmap with full architecture |
| OpenClaw gateway (local) | ✅ Done | Running on Windows (foreground mode), WhatsApp channel enabled |
| RBQ verification API | ✅ Done | POST /api/verify/rbq (browser-use + cache) |
| RBQ metrics & monitoring | ✅ Done | GET /metrics, /health, /metrics/dashboard |

### In progress

| Component | Status | Blocker |
|---|---|---|
| OpenClaw model routing | 🟡 Partial | Kimi K2.5 configured, WhatsApp responses pending model fix |
| OpenClaw VPS deployment | 🟡 Partial | Gateway auth resolved, needs service persistence |

### Not started

| Component | Priority | Dependency |
|---|---|---|
| Database schema (Drizzle migrations) | 🔴 High | None — ready to build |
| Core API endpoints | 🔴 High | Schema first |
| WhatsApp Business API registration | 🔴 High | Meta Business verification |
| Template message approval (French) | 🔴 High | WA Business account |
| Frontend: landing page | 🟠 Medium | None |
| Frontend: client booking flow | 🟠 Medium | API endpoints |
| Stripe Connect integration | 🟠 Medium | API endpoints |
| Provider mobile app (Expo RN) | 🟡 Low | API + booking flow |
| L'Atelier dashboard | 🟡 Low | API + provider endpoints |

---

## 2. Traction metrics (pre-launch)

All metrics are zero — tracking begins at beta launch.

| Metric | Current | Phase 2 target | Measurement |
|---|---|---|---|
| Total clients | 0 | 500 | DB count |
| Total providers | 0 | 50 | DB count (Rive-Sud) |
| Monthly active users | 0 | 200 | Unique users with activity in 30 days |
| Bookings (total) | 0 | 300/mo | Completed bookings |
| GMV (CAD) | $0 | $50K/mo | Sum of booking values |
| Revenue (CAD) | $0 | $7.5K/mo | 15% commission |
| Avg rating | — | > 4.5 | Mean provider rating |
| Time to match | — | < 5 min | Request → acceptance |
| WA conversations | 0 | 1,000/mo | WhatsApp Business API analytics |
| Bot resolution rate | — | > 70% | Max handles without escalation |
| WA response time | — | < 30 sec | First response avg |

---

## 3. Traction API

**Endpoint:** `GET /api/traction/summary`

**Status:** Not yet implemented — schema below for reference.

```json
{
  "generated_at": "2026-02-17T00:00:00Z",
  "period": "2026-Q1",
  "build": {
    "phase": 1,
    "phase_name": "Foundation",
    "components_completed": 7,
    "components_total": 16,
    "completion_pct": 44
  },
  "users": {
    "total_clients": 0,
    "total_providers": 0,
    "new_this_period": 0,
    "active_monthly": 0,
    "verified_providers": 0
  },
  "bookings": {
    "total": 0,
    "completed": 0,
    "cancelled": 0,
    "in_progress": 0,
    "avg_rating": null,
    "gmv_cad": 0,
    "avg_booking_value_cad": null
  },
  "revenue": {
    "commission_cad": 0,
    "subscriptions_cad": 0,
    "boosts_cad": 0,
    "total_cad": 0
  },
  "matching": {
    "avg_match_time_seconds": null,
    "provider_acceptance_rate": null,
    "radius_expansion_rate": null
  },
  "messaging": {
    "whatsapp_conversations": 0,
    "telegram_conversations": 0,
    "avg_response_time_seconds": null,
    "bot_resolution_rate": null,
    "template_messages_sent": 0
  },
  "coverage": {
    "zones_active": 0,
    "zones_total": 5,
    "providers_per_zone_avg": 0,
    "categories_available": 0,
    "categories_target": 12
  }
}
```

---

## 4. Service categories (target)

### Licensed trades (require verification)

| Category | French name | Licence body |
|---|---|---|
| Plumbing | Plomberie | RBQ / CMMTQ |
| Electrical | Électricité | RBQ / CMEQ |
| HVAC | Chauffage et climatisation | RBQ |
| Gas fitting | Installation de gaz | RBQ |
| Roofing | Toiture | RBQ |

### Unlicensed services (open to all)

| Category | French name | Seasonal? |
|---|---|---|
| Cleaning | Nettoyage | No |
| Moving | Déménagement | Peak: July 1 |
| Snow removal | Déneigement | Winter |
| Lawn care | Tonte de pelouse | Summer |
| Painting | Peinture | No |
| Handyperson | Homme/femme à tout faire | No |
| Assembly | Assemblage de meubles | No |

---

## 5. Beta launch plan

**Target:** Q2 2026
**Zone:** Longueuil / Rive-Sud
**Scale:** 50 providers, 5 categories (nettoyage, plomberie, déménagement, déneigement, homme à tout faire)

### Pre-launch checklist

| Task | Status | Owner |
|---|---|---|
| WhatsApp Business API approved | ⬜ | Bee |
| French template messages approved | ⬜ | Bee |
| 50 provider sign-ups | ⬜ | Outreach |
| Stripe Connect live (CAD) | ⬜ | Dev |
| Landing page live (qemplois.ca / qworks.ca) | ⬜ | Dev |
| Max (Ti-Guy) responding on WhatsApp | ⬜ | Dev |
| Core booking flow end-to-end | ⬜ | Dev |
| Privacy policy (Law 25 compliant) | ⬜ | Legal |
| Terms of service (French) | ⬜ | Legal |

### Provider acquisition strategy

1. **Direct outreach** — contact Rive-Sud tradespeople via Facebook groups, Kijiji listings
2. **Referral bonus** — $50 credit for first 50 providers who complete 3 jobs
3. **Trade associations** — partner with local chapters (APCHQ, ACQ)
4. **Community events** — sponsor local Longueuil business meetups

### Client acquisition strategy

1. **WhatsApp forwarding** — "Envoie 'ALLO' au +1-XXX-XXX-XXXX pour trouver un pro"
2. **Facebook/Instagram ads** — geo-targeted Rive-Sud, French-only
3. **Referral program** — $10 off first booking for referrer + referee
4. **Local partnerships** — condo boards, property managers, real estate agents

---

## 6. Grant & funding readiness

### Applicable programs

| Program | Eligibility | Amount | Status |
|---|---|---|---|
| **CDPQ / Fondaction** | Québec-based startup, tech | Variable | Research |
| **PARI-CNRC** | Innovation, AI integration | Up to $50K | Research |
| **PME MTL** | Montréal-based startup | Up to $50K | Research |
| **Futurpreneur** | Founder 18-39, business plan | $20K loan + mentorship | Research |
| **BDC** | Tech startup, revenue potential | Variable | Research |
| **Zone Rive-Sud** | Rive-Sud economic development | Variable | Research |

### RBQ Metrics (GET /metrics)

- **Sécurité** : Protégé par `METRICS_API_KEY` (X-API-Key ou ?api_key=) si défini. `/health` reste public.
- **Schéma** : `schema_version: rbq_metrics_v1`, `request_id` pour corrélation.
- **Export** : Axiom (AXIOM_TOKEN, AXIOM_DATASET) ou Datadog (DD_API_KEY) — fire-and-forget.

Métriques RBQ pour subventions et debug :
- `total_requests`, `success_count`, `valid_count`, `invalid_count`, `error_count`
- `success_rate_pct`, `avg_latency_ms`, `p50/p95/p99_latency_ms`
- `error_breakdown`, `licence_prefix_counts`
- Persistance : `backend/data/metrics.json` (flush toutes les 60s)

### What the Traction API provides for grant applications

- Real-time metrics exportable as PDF or JSON
- User growth curves (clients + providers)
- GMV and revenue trends
- Job creation metrics (providers earning income)
- Geographic coverage expansion
- AI performance metrics (bot resolution, response time)

---

## 7. Key risks

| Risk | Impact | Mitigation |
|---|---|---|
| WhatsApp Business API rejection | 🔴 High | Apply early, have fallback (Telegram, web chat) |
| Low provider supply | 🔴 High | Aggressive outreach, referral bonuses, start with 1 zone |
| Regulatory changes (Bill 96 tightening) | 🟠 Medium | Already French-first, monitor OQLF updates |
| Stripe Connect compliance (CAD) | 🟡 Low | Standard integration, well-documented |
| Competition enters Québec | 🟠 Medium | First-mover advantage, cultural authenticity, AI differentiator |
| AI hallucination in bookings | 🟠 Medium | Confirmation step required before any booking finalized |

---

*Document interne — Q-emplois — Mis à jour : février 2026*
