# Q-emplois — Livre blanc interne

> **TaskRabbit meets Uber, built for Québec.**

---

## 1. Problème

Québec has no homegrown on-demand service marketplace. Existing platforms (TaskRabbit, Handy, Thumbtack) are English-first, US-centric, and ignore provincial regulations. Meanwhile, Quebecers rely on Kijiji ads, Facebook groups, and word-of-mouth to find plumbers, cleaners, electricians, and handypeople — a fragmented, trust-deficient experience.

**Pain points:**

- No real-time matching — users post and wait hours or days for a response
- No verification — no way to confirm licences, insurance, or competence
- Language barrier — most platforms default to English, violating the spirit (and soon the letter) of Bill 96
- Privacy gaps — platforms store data on US servers with no regard for Law 25
- Payment friction — cash or e-Transfer with no dispute resolution, escrow, or receipts

---

## 2. Solution

**Q-emplois** is an on-demand service marketplace that combines TaskRabbit's service variety with Uber's real-time matching engine — purpose-built for Québec's French-speaking majority.

### The Uber model applied to services

| Uber (rides) | Q-emplois (services) |
|---|---|
| Rider requests a ride | Client requests a service (plomberie, nettoyage, etc.) |
| Driver gets pinged in real-time | Provider gets pinged based on proximity, availability, rating |
| GPS tracking during ride | Status updates (en route → arrivé → en cours → terminé) |
| Automatic payment + tip | Stripe payment + optional tip, automatic receipt |
| Two-way rating | Two-way rating (client ↔ provider) |
| Surge pricing | Demand-based pricing zones (optional, Phase 3) |

### The TaskRabbit model applied to Québec

| TaskRabbit | Q-emplois |
|---|---|
| English-first | French-first (Bill 96 compliant) |
| US/UK markets | Québec-exclusive (expand to ROC later) |
| Background checks (US) | Provincial licence verification (RBQ, CMEQ, CMMTQ) |
| Generic categories | Québec-specific trades + informal gigs (déneigement, tonte de pelouse, etc.) |
| No AI | AI-powered matching + customer support via Max (Ti-Guy) |

---

## 3. Architecture

### 3.1 Platform overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Q-emplois                            │
├──────────────┬──────────────┬───────────────────────────────┤
│  Client App  │ Provider App │      Admin Dashboard          │
│  (React/RN)  │  (React/RN)  │        (React)                │
├──────────────┴──────────────┴───────────────────────────────┤
│                    API Gateway (Express)                     │
├─────────┬──────────┬──────────┬────────────┬────────────────┤
│  Auth   │ Matching │ Booking  │  Payment   │   Messaging    │
│ Service │  Engine  │ Service  │  (Stripe)  │  (WA Business  │
│         │          │          │            │   + OpenClaw)   │
├─────────┴──────────┴──────────┴────────────┴────────────────┤
│              PostgreSQL (Neon) + PostGIS                     │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure                            │
│          Vercel (frontend) · Railway (backend)              │
│            Neon (DB) · Stripe (payments)                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS, React Router |
| **Mobile** | Expo React Native (shared components) |
| **Backend** | Express, TypeScript, Drizzle ORM |
| **Database** | PostgreSQL (Neon) with PostGIS |
| **Payments** | Stripe Connect (split payments, escrow) |
| **AI Agent** | OpenClaw + Kimi K2.5 |
| **Messaging** | WhatsApp Business API (Meta Cloud API) — primary channel |
| **Secondary channels** | Telegram Bot API |
| **Auth** | JWT + session-based, OAuth for messaging channels |
| **Hosting** | Vercel (frontend), Railway (backend), Neon (DB) |
| **Notifications** | WhatsApp Business API (primary), Firebase (push), SendGrid (email) |

### 3.3 WhatsApp Business API integration

Q-emplois uses the **official WhatsApp Business API** (via Meta Cloud API) as the primary communication channel. This is a business-grade integration — verified, scalable, and compliant.

**Why WhatsApp Business API (not personal WhatsApp):**

- **Verified business profile** — green checkmark, business name "Q-emplois", description, address, website
- **Template messages** — pre-approved French templates for notifications outside the 24h session window (booking confirmations, reminders, payment receipts, review requests)
- **Interactive messages** — buttons, list pickers, and quick replies for structured conversations
- **Catalog integration** — showcase service categories directly in WhatsApp (future)
- **Compliance** — official API, no risk of phone number bans
- **Scale** — handles thousands of concurrent conversations via webhook delivery
- **Analytics** — delivery rates, read receipts, response time metrics
- **Multi-agent** — multiple team members can handle conversations (L'Atelier dashboard)

**Message flow:**

```
Client (WhatsApp) → Meta Cloud API → Webhook → Q-emplois Backend
                                                    ├→ OpenClaw (Max AI routing)
                                                    ├→ Booking Service
                                                    ├→ Payment Service
                                                    └→ Notification Service
```

**Message types:**

| Type | Use case |
|---|---|
| **Template messages** | Booking confirmations, payment receipts, 24h reminders, review requests |
| **Interactive list** | Service category selection (Plomberie, Nettoyage, Électricité, etc.) |
| **Interactive buttons** | Confirm/cancel booking, accept/decline job (provider side) |
| **Location request** | Client shares location for proximity-based matching |
| **Text messages** | Free-form conversation with Max (Ti-Guy) AI |
| **Media messages** | Photo of issue (client), photo of completed work (provider) |

**Template examples (pre-approved, French):**

```
# Booking confirmation
Bonjour {{1}} ! ✅ Votre réservation est confirmée.
📋 Service : {{2}}
📅 Date : {{3}}
👷 Prestataire : {{4}}
💰 Prix estimé : {{5}} $

# Payment receipt
Merci {{1}} ! 💳 Paiement reçu.
Montant : {{2}} $
Réservation : #{{3}}
⭐ N'oubliez pas d'évaluer votre prestataire !

# Provider job ping
🔔 Nouvelle demande !
📋 {{1}} — {{2}}
📍 {{3}} ({{4}} km de vous)
💰 {{5}} $/h
[Accepter] [Refuser]

# 24h reminder
Rappel : votre {{1}} est prévu demain à {{2}}.
👷 {{3}} sera chez vous au {{4}}.
[Confirmer] [Modifier] [Annuler]
```

### 3.4 Max (Ti-Guy) — AI concierge

Max is Q-emplois' AI assistant, powered by OpenClaw and Kimi K2.5, delivered through the WhatsApp Business API.

**Capabilities:**

- **Service discovery** — "Je cherche un plombier proche de Longueuil" → instant matching via interactive list
- **Booking flow** — multi-step conversation using WhatsApp interactive messages (list pickers → date → location share → confirm button)
- **Payment links** — sends Stripe checkout URLs directly in chat
- **Notifications** — booking confirmations, reminders, status updates via template messages
- **Reviews** — post-service rating collection using interactive buttons (⭐ 1-5)
- **Profile management** — address updates, preferences via conversational flow
- **Provider dispatch** — pings available providers with accept/decline buttons
- **Escalation** — hands off to human support when confidence is low

Max speaks authentic Québec French (not France French) and understands joual expressions. "Envoye, book-moi un plombier pour à soir" → Max gets it.

### 3.5 OpenClaw skills

| Skill | Function | WA Business feature |
|---|---|---|
| `search_services` | PostGIS provider search by trade, location, radius | Interactive list (results) |
| `booking_request` | Creates booking, matches provider, triggers payment | Interactive buttons (confirm) |
| `payment_processing` | Stripe payment intent creation, status tracking | Template message (receipt) |
| `notification_system` | Multi-channel alerts | Template messages |
| `review_submission` | Post-service feedback | Interactive buttons (1-5 rating) |
| `profile_management` | User profile CRUD | Text conversation |
| `user_registration` | Phone/email sign-up with JWT | Deep-link to web portal |
| `service_listing` | Provider-side service creation | Guided conversation |
| `rbq_verifier` | Licence RBQ verification via registre officiel | Text conversation |

---

## 4. Matching engine

The core differentiator. Unlike TaskRabbit (post-and-wait), Q-emplois matches in real-time like Uber.

### 4.1 Matching algorithm

```
Score = (proximity × 0.35) + (rating × 0.25) + (response_time × 0.20)
      + (price × 0.10) + (availability × 0.10)
```

### 4.2 Real-time matching flow

1. Client submits request via WhatsApp (interactive list → service type, location share, date)
2. System queries providers within radius using PostGIS: `ST_DWithin(location, point, radius)`
3. Filters by availability (calendar) and trade match
4. Scores remaining providers
5. Top 3 providers receive WhatsApp Business template ping with **[Accepter] [Refuser]** buttons
6. First provider to accept gets the job (Uber-style instant dispatch)
7. If no response in 2 minutes → expand radius, ping next batch
8. Client receives confirmation template with provider details + ETA

### 4.3 Service zones

| Zone | Coverage |
|---|---|
| **Montréal** | Centre-Ville, Plateau, Rosemont, Hochelaga, NDG, Verdun, Villeray, Ahuntsic |
| **Rive-Sud** | Longueuil, Brossard, Saint-Hubert, Saint-Lambert, Chambly |
| **Rive-Nord** | Laval, Terrebonne, Repentigny, Blainville |
| **Québec City** | Limoilou, Sainte-Foy, Charlesbourg, Beauport |
| **Outaouais** | Gatineau, Hull, Aylmer |

---

## 5. Compliance

### 5.1 Bill 96 (Loi 96) — French language

- All UI, notifications, and bot conversations are French-first
- English available as secondary language (user preference)
- All legal documents available in French
- Provider profiles display OQLF-approved trade names
- WhatsApp Business template messages submitted and approved in French
- WhatsApp Business profile set to French with Québec address

### 5.2 Law 25 (Loi 25) — Privacy

- All data stored on Canadian infrastructure (Neon — AWS ca-central-1)
- Explicit consent at registration: « J'autorise Q-emplois à traiter mes données personnelles conformément à sa politique de confidentialité »
- Data retention: active only, deleted 30 days after account closure
- Right to access and deletion via Max chatbot or web portal
- No data shared with third parties without consent
- WhatsApp conversations: metadata stored (timestamps, type); content processed in real-time, not persisted beyond session
- Privacy officer designated per Law 25 requirements

### 5.3 Provincial licensing

- Licensed trades (plomberie, électricité, gaz) require RBQ/CMEQ/CMMTQ licence
- Licence verified via OCR upload + optional provincial database cross-reference
- Verified providers display "Vérifié ✓" badge
- Unverified providers limited to non-licensed categories (nettoyage, déménagement, tonte, etc.)

---

## 6. Revenue model

| Stream | Mechanism | Target |
|---|---|---|
| **Service fee** | 15% commission on each completed booking | Primary revenue |
| **Provider subscription** | Monthly plans: priority listing, analytics, tax tools | $29/mo (Pro), $79/mo (Business) |
| **Featured listings** | Providers pay to appear first in search results | $5-15/boost |
| **L'Atelier dashboard** | Premium analytics, TPS/TVQ reporting, CRM | Included in Pro/Business |
| **API access** | Traction API for partners, integration | Phase 3 |

---

## 7. L'Atelier — Provider dashboard

| Feature | Description |
|---|---|
| **Revenue tracker** | Real-time earnings, weekly/monthly summaries, CSV export |
| **Tax calculator** | Automatic TPS (5%) + TVQ (9.975%) on earnings |
| **Job board** | Incoming requests with filters (status, date, type, zone) |
| **Availability calendar** | Working hours, blocked days, Google Calendar sync |
| **Client messaging** | Direct chat via WhatsApp Business API |
| **Certification vault** | Licence PDFs, insurance documents |
| **Rating dashboard** | Scores, response rate, completion rate |
| **Payout history** | Stripe payouts, pending amounts, next payout date |

---

## 8. Roadmap

### Phase 1 — Foundation (Current)

- [x] Project scaffolding (Express + React + Drizzle + Neon)
- [x] OpenClaw bot framework with 8 skills
- [x] Auth flow design (WhatsApp Business + Telegram)
- [x] Booking conversation flow design
- [x] Tradesmen portal wireframes
- [x] WHITEPAPER + internal docs
- [ ] Database schema (Drizzle migrations)
- [ ] Core API endpoints (auth, bookings, providers, services)
- [ ] WhatsApp Business API registration + Meta verification
- [ ] Template message approval (French)
- [ ] Frontend: landing page + client booking flow
- [ ] Stripe Connect integration

### Phase 2 — MVP Launch

- [ ] Real-time matching engine (PostGIS)
- [ ] Max (Ti-Guy) live on WhatsApp Business
- [ ] Provider mobile app (Expo React Native)
- [ ] L'Atelier dashboard v1
- [ ] Licence verification (OCR + review)
- [ ] Payment flow (Stripe escrow → release on completion)
- [ ] Beta launch: Longueuil / Rive-Sud (50 providers, 5 categories)

### Phase 3 — Growth

- [ ] Expand to Montréal, Laval, Québec City
- [ ] Demand-based pricing zones
- [ ] Provider subscription tiers
- [ ] Traction API for grant reporting
- [ ] Google Calendar / iCal sync
- [ ] Referral program (client + provider)
- [ ] WhatsApp catalog integration

### Phase 4 — Scale

- [ ] Full Québec coverage
- [ ] Multi-day / recurring bookings
- [ ] In-app messaging (reduce WhatsApp dependency)
- [ ] Insurance partnerships
- [ ] Expand to ROC — English + French
- [ ] Enterprise contracts (property mgmt, condo boards)

---

## 9. Competitive landscape

| Platform | Market | Real-time? | French? | Licensed? | AI? | WA Business? |
|---|---|---|---|---|---|---|
| TaskRabbit | US/UK | No | No | No | No | No |
| Handy | US | No | No | No | No | No |
| Thumbtack | US | No | No | Partial | No | No |
| Kijiji | Canada | No | Partial | No | No | No |
| Jiffy | Canada (ON) | Yes | No | Yes | No | No |
| **Q-emplois** | **Québec** | **Yes** | **Natif** | **Provincial** | **Max (Ti-Guy)** | **Oui** |

---

## 10. North Star metrics

| Metric | Definition | Phase 2 target |
|---|---|---|
| **GMV** | Total booking value | $50K/mo |
| **Take rate** | Commission / GMV | 15% |
| **Time to match** | Request → provider accepts | < 5 min |
| **Provider utilization** | Hours booked / hours available | > 40% |
| **Client retention** | Rebook within 30 days | > 35% |
| **NPS** | Net Promoter Score | > 50 |
| **Bot resolution** | Max handles without escalation | > 70% |
| **WA response time** | First response via WA Business | < 30 sec |

---

*Document interne — Q-emplois — Mis à jour : février 2026*
