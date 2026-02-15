# QWORKS - Quebec-Compliant Gig Platform

## Overview
QWORKS is a localized gig platform (like TaskRabbit) tailored for Québec's French-speaking majority, ensuring full compliance with Bill 96 (language) and Law 25 (privacy).

## Bill 96 (Charter of the French Language) Compliance

### Implementation Details
1. **French as Primary Language**: The application defaults to French (`fr`) as the primary locale
2. **Equal Quality Content**: All content is available in both French and English with equal quality
3. **Language Switcher**: Users can switch between French and English, but French is the default
4. **Bilingual Navigation**: All UI elements and pages are fully translated

### Key Features
- Default locale set to `fr` in `i18n.ts`
- Comprehensive French translations in `messages/fr.json`
- Language switcher prominently displayed in navigation
- Middleware ensures proper locale routing

## Law 25 (Privacy Law) Compliance

### Implementation Details
1. **Cookie Consent Banner**: Compliant cookie consent mechanism with accept/decline options
2. **Privacy Policy Page**: Dedicated privacy policy page (`/[locale]/privacy`)
3. **Terms of Service Page**: Comprehensive terms of use page (`/[locale]/terms`)
4. **Data Protection Documentation**: Clear information about data collection and usage

### Key Features
- Cookie consent component (`components/CookieConsent.tsx`)
- Privacy policy with Law 25 compliance statement
- Terms of service with Bill 96 compliance statement
- Links to privacy documentation in footer

## Technical Stack
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Internationalization**: next-intl
- **Styling**: Tailwind CSS 3
- **Build Tool**: Turbopack

## Project Structure
```
/
├── app/
│   └── [locale]/          # Locale-based routing
│       ├── layout.tsx     # Root layout with i18n provider
│       ├── page.tsx       # Homepage
│       ├── privacy/       # Privacy policy page
│       │   └── page.tsx
│       └── terms/         # Terms of service page
│           └── page.tsx
├── components/
│   ├── Navigation.tsx     # Navigation bar with language switcher
│   ├── Footer.tsx         # Footer with compliance links
│   └── CookieConsent.tsx  # Cookie consent banner
├── messages/
│   ├── fr.json            # French translations (primary)
│   └── en.json            # English translations
├── i18n.ts                # Internationalization configuration
├── middleware.ts          # Locale routing middleware
└── next.config.mjs        # Next.js configuration
```

## Running the Application

### Development
```bash
npm run dev
```
Navigate to `http://localhost:3000` - will redirect to `/fr` (French by default)

### Production Build
```bash
npm run build
npm start
```

### Testing Language Switching
1. Visit `http://localhost:3000` → redirects to `/fr`
2. Click "EN" button in navigation to switch to English (`/en`)
3. Click "FR" button to switch back to French

## Key Pages
- `/fr` or `/en` - Homepage with platform overview
- `/fr/privacy` or `/en/privacy` - Privacy Policy (Law 25 compliant)
- `/fr/terms` or `/en/terms` - Terms of Service (Bill 96 compliant)

## Compliance Statements
Each legal page includes compliance statements:
- **Privacy Page**: Includes Law 25 compliance notice
- **Terms Page**: Includes Bill 96 compliance notice
- **Footer**: Links to both compliance pages

## Future Enhancements
This is a foundational implementation. Future development should include:
1. User authentication and authorization
2. Task marketplace functionality
3. Payment processing system
4. Real-time messaging between users
5. Rating and review system
6. Mobile responsive design improvements
7. Accessibility (WCAG) compliance
8. SEO optimization for Quebec market

## Notes
- The application prioritizes French content while maintaining equal English translation quality
- All user-facing text is translated through the i18n system
- The platform is designed with Quebec's legal requirements as core features, not afterthoughts
