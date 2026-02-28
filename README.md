# Q-EMPLOIS 🚀

**Tous les jobs du Québec - accessible à tous**

Q-EMPLOIS is a Quebec-first task-based marketplace platform where customers post tasks and taskers get paid to complete them. Think TaskRabbit, but built specifically for Quebec.

---

## 🎯 WHAT IS Q-EMPLOIS?

### The Platform

**For Customers:**
- Post any task (moving, cleaning, handyman, tech help, etc.)
- Get matched with qualified taskers
- Pay securely via Stripe
- Leave reviews

**For Taskers:**
- Browse available tasks
- Claim tasks using credits
- Get paid for completing work
- Build your reputation

### How It Works

1. **Customer posts task** - "Need help moving furniture"
2. **Taskers claim task** - Use 1 credit to claim
3. **Work gets done** - Tasker completes the task
4. **Payment happens** - Customer pays tasker directly
5. **Reviews exchanged** - Both parties leave reviews

---

## 💰 BUSINESS MODEL

### Revenue Source

**Credit Packs (Taskers buy credits to claim tasks):**
- 12 credits = $17.99 CAD
- 24 credits = $34.99 CAD (save 3%)
- 60 credits = $84.99 CAD (save 6%)

**1 credit = 1 task claim**

### What We DON'T Do

- ❌ We don't handle customer-to-tasker payments
- ❌ We don't take commissions on work
- ❌ We don't guarantee work quality
- ❌ We're just the middleman connecting people

### Liability

- Maximum liability: $100 CAD
- Platform is a marketplace only
- Users are independent contractors
- See `docs/LIABILITY_DISCLAIMER.md` for details

---

## 🚀 BETA LAUNCH STRATEGY

### The Offer

**First 50 Founding Taskers Get:**
- ✅ 60 FREE credits (worth $84.99)
- ✅ Founding Tasker badge 🏆 (permanent)
- ✅ Lifetime 20% discount on all future credits
- ✅ Priority support
- ✅ Input on features

### Investment

**Total Cost: $0**
- Free credits = $0 (just database entries)
- Manual verification = $0 (skip Certn initially)
- Free tier hosting = $0 (Railway, Vercel, Supabase)

### Expected Return

- **Month 1 (Beta):** $0 revenue, 50 taskers, 200+ tasks
- **Month 2:** $1,200 revenue (beta users buy more credits)
- **Month 3:** $4,500 revenue (word of mouth growth)
- **Month 6:** $15,000/month revenue

See `BETA_LAUNCH_STRATEGY.md` for full details.

---

## 🏗️ TECH STACK

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router v7
- **Styling:** Custom CSS (Quebec leather theme)
- **State:** React Query (TanStack Query)
- **API:** Axios
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js + NestJS
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** JWT + Passport
- **Payments:** Stripe
- **File Upload:** Multer
- **Validation:** class-validator

### Infrastructure
- **Frontend Hosting:** Vercel (free tier)
- **Backend Hosting:** Railway (free tier)
- **Database:** Supabase (free tier)
- **Email:** Resend (free tier)
- **Redis:** Upstash (free tier)

---

## 📁 PROJECT STRUCTURE

```
q-emplois/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service layer
│   │   └── styles/          # CSS files
│   └── package.json
│
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── bookings/        # Bookings/tasks module
│   │   ├── chat/            # Chat module
│   │   ├── common/          # Shared utilities
│   │   ├── credits/         # Credits system
│   │   ├── notifications/   # Notifications
│   │   ├── payments/        # Stripe integration
│   │   ├── reviews/         # Reviews system
│   │   ├── users/           # User management
│   │   └── verification/    # ID verification
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
├── docs/                     # Documentation
│   ├── TERMS_OF_SERVICE.md
│   ├── PRIVACY_POLICY.md
│   ├── REFUND_POLICY.md
│   └── LIABILITY_DISCLAIMER.md
│
├── BETA_LAUNCH_STRATEGY.md  # Beta launch plan
├── BOOTSTRAP_FREE_PLAN.md   # $0 infrastructure setup
├── EXPENSES_BREAKDOWN.md    # Financial projections
├── QUEBEC_TASK_CATEGORIES.md # 100+ task categories
└── SEO_KEYWORDS.md          # SEO strategy
```

---

## 🚀 GETTING STARTED

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payments)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL, Stripe keys, etc.
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Backend runs on `http://localhost:3000`

### Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_WHATSAPP_URL=https://wa.me/YOUR_NUMBER
```

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/qemplois
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎨 DESIGN SYSTEM

### Quebec Leather Theme

**Colors:**
- Primary: `#B87B44` (Leather brown)
- Secondary: `#D9B38C` (Cream)
- Background: `#1F2F3F` (Dark blue-grey)
- Accent: `#C88B54` (Gold)

**Typography:**
- Headings: Playfair Display (serif)
- Body: Lora (serif)
- Monospace: System monospace

**Visual Elements:**
- Leather texture background
- Stitching borders (dashed lines)
- Gold buttons with embossed effect
- Service icons in circular badges
- WhatsApp green for chat CTA

---

## 📊 TASK CATEGORIES

### 100+ Categories Across 6 Main Groups

1. **Livraison & Transport** (Delivery & Transport)
   - Coursier, chauffeur, déménagement, livraison colis

2. **Restauration & Événements** (Food Service & Events)
   - Serveur, barman, sécurité, DJ, animation

3. **Tech & Informatique** (Tech & IT)
   - Aide PC, réparation téléphone, graphisme, développement

4. **Bricolage & Réparations** (Handyman & Repairs)
   - Montage meubles, petits travaux, ménage, peinture

5. **Éducation & Services** (Education & Care)
   - Tutorat, garde d'enfants, promenade chiens, aide senior

6. **Manutention & Aide** (Labor & Moving Help)
   - Déménagement, portage, aide déménagement, rangement

See `QUEBEC_TASK_CATEGORIES.md` for full list.

---

## 🔐 LEGAL & COMPLIANCE

### Quebec Compliance

**Bill 96 (Language Law):**
- ✅ French as default language
- ✅ All legal documents in French
- ✅ Bilingual interface (FR/EN)
- ✅ French-first content

**Law 25 (Privacy):**
- ✅ Privacy policy compliant
- ✅ Cookie consent
- ✅ Data retention policies
- ✅ User data rights

### Legal Documents

All legal documents are in `docs/`:
- Terms of Service
- Privacy Policy
- Refund Policy
- Liability Disclaimer
- Acceptable Use Policy
- Cookie Policy

---

## 💳 PAYMENT FLOW

### Credit Purchase (Tasker → Platform)

1. Tasker selects credit pack
2. Redirected to Stripe Checkout
3. Payment processed
4. Credits added to account
5. Confirmation email sent

### Task Payment (Customer → Tasker)

**IMPORTANT:** We do NOT handle this payment.

- Customer pays tasker directly (cash, e-transfer, etc.)
- Platform is NOT involved in work payments
- We only sell credits for task claims

---

## 🤖 WHATSAPP INTEGRATION

### Max (Ti-Guy) - AI Assistant

**Features:**
- Find jobs via WhatsApp chat
- Post tasks via WhatsApp
- Get matched with taskers
- Receive notifications
- Quick responses (< 5 minutes)

**Setup:**
- WhatsApp Business API
- Webhook integration
- AI-powered matching
- Bilingual support (FR/EN)

---

## 📈 SEO STRATEGY

### Top Keywords (Quebec)

**High Volume:**
- déménagement montréal (8,100/month)
- aide déménagement (2,900/month)
- serveur événement (1,600/month)
- bricolage montréal (1,300/month)

**Long Tail:**
- montage meubles ikea montréal
- aide déménagement pas cher
- serveur barman événement
- réparation ordinateur à domicile

See `SEO_KEYWORDS.md` for 500+ keywords.

---

## 🎯 ROADMAP

### Phase 1: Beta Launch (Month 1)
- [x] Complete frontend
- [x] Complete backend
- [x] Beta launch strategy
- [ ] Recruit 50 founding taskers
- [ ] 200+ tasks claimed
- [ ] 50+ tasks completed

### Phase 2: Public Launch (Month 2)
- [ ] Remove "Beta" label
- [ ] Start charging for credits
- [ ] Open to everyone
- [ ] Marketing campaign
- [ ] Target: 100 taskers

### Phase 3: Growth (Month 3-6)
- [ ] WhatsApp bot integration
- [ ] Mobile app (React Native)
- [ ] Advanced matching algorithm
- [ ] Tasker tiers (Bronze, Silver, Gold)
- [ ] Target: 500 taskers

### Phase 4: Scale (Month 6-12)
- [ ] Expand to all Quebec
- [ ] Add more task categories
- [ ] Enterprise accounts
- [ ] API for third-party integrations
- [ ] Target: 2,000 taskers

---

## 🤝 CONTRIBUTING

This is a private project, but if you're a founding tasker or early user:

1. Join our Telegram group: "Q-EMPLOIS Beta - Founding Taskers"
2. Report bugs via Telegram or email
3. Share feedback and feature requests
4. Help test new features
5. Spread the word!

---

## 📞 SUPPORT

**For Taskers:**
- Email: support@q-emplois.ca
- Telegram: @qemplois
- WhatsApp: [Your Number]

**For Customers:**
- Email: help@q-emplois.ca
- WhatsApp: Chat with Max

**For Bugs:**
- GitHub Issues (if public)
- Telegram group (beta users)
- Email: bugs@q-emplois.ca

---

## 📄 LICENSE

Proprietary - All Rights Reserved

© 2026 Q-emplois. All rights reserved.

---

## 🎉 ACKNOWLEDGMENTS

**Built with ❤️ in Quebec, Canada 🇨🇦**

**Fait au Québec, pour le Québec**

Special thanks to:
- Our 50 founding taskers (you know who you are!)
- The Quebec tech community
- Everyone who believed in this vision

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [x] Frontend complete
- [x] Backend complete
- [x] Legal documents ready
- [x] Beta strategy defined
- [x] SEO implemented
- [ ] Stripe account verified
- [ ] Domain purchased
- [ ] Hosting configured

### Beta Launch
- [ ] Deploy to production
- [ ] Add "BETA" label
- [ ] Create Telegram group
- [ ] Recruit first 10 taskers
- [ ] Test all flows
- [ ] Fix critical bugs

### Public Launch
- [ ] 50 beta taskers recruited
- [ ] Remove "BETA" label
- [ ] Launch announcement
- [ ] Marketing campaign
- [ ] Press release
- [ ] Social media push

---

**Ready to launch? Let's go! 🚀**

**First 50 taskers get 60 FREE credits. Join now!**
