# Tradesmen Portal

## Overview
The Tradesmen Portal is a dedicated dashboard for licensed providers to manage their services, view job requests, and handle payments. It is accessible via the web app and a mobile app (Expo React Native) and integrates tightly with OpenClaw for notifications.

## Features
| Feature | Description |
|---------|-------------|
| **Profile Dashboard** | Personal info, certifications, OQLF‑approved name, rating, verification badge. |
| **Job Board** | List of incoming job requests with filters (status, date, service type). |
| **Availability Calendar** | Set working hours, block off days, sync with Google Calendar. |
| **Messaging Portal** | Direct chat with clients via OpenClaw (WhatsApp/Telegram). |
| **Payment History** | View earnings, pending payouts, export CSV for accounting. |
| **Certification Upload** | Upload PDF of licence; system validates against provincial database (optional API). |

## Licensing Verification Process
1. Provider uploads licence PDF.
2. System extracts licence number using OCR (via OpenAI Vision or Tesseract).
3. Calls external **Québec licence verification API** (if available) or performs manual admin review.
4. Upon successful verification, a **"Vérifié"** badge appears on the profile.
5. Unverified providers see a warning and limited access to job board.

## UI Wireframe (simplified)
```
+---------------------------------------------------+
| Tradesmen Portal                                  |
+---------------------------------------------------+
| [Profile]   [Jobs]   [Calendar]   [Payments]    |
+---------------------------------------------------+
| Profile Section                                   |
|  - Name: Jean Tremblay (Vérifié)                 |
|  - Skills: plomberie, débouchage                  |
|  - Rating: 4.8 ★ (120 reviews)                 |
+---------------------------------------------------+
| Jobs Section (list)                              |
|  1. 2026‑02‑20 14:00 – Plomberie – $80 – New    |
|  2. 2026‑02‑22 09:00 – Débouchage – $50 – New   |
+---------------------------------------------------+
| Calendar (summary)                               |
|  • 20/02 – 14h – Plomberie (Jean)               |
|  • 22/02 – 09h – Débouchage (Jean)              |
+---------------------------------------------------+
| Payments                                          |
|  - Total earned: $1 200 CAD                      |
|  - Pending payout: $300 CAD (expected 05/03)      |
+---------------------------------------------------+
```

## Technical Details
- **Backend**: NestJS endpoints under `/api/providers/*`.
- **Database**: `Provider` table with fields `id`, `license_number`, `is_verified`, `certification_url`.
- **OpenClaw Integration**: Skills `provider_dashboard_skill` and `notification_system_skill` handle real‑time alerts (new job, payment status).
- **Mobile App**: Expo React Native screens mirror the web portal; push notifications via Firebase.
- **Security**: Access controlled by JWT with role `provider`. All API calls validated against Law 25 data‑retention policies.

## Next Steps
1. Scaffold the Provider UI (React components in `src/components/provider`).
2. Implement license upload endpoint (`POST /api/providers/:id/license`).
3. Connect OpenClaw notification skill to trigger messages on new job assignments.
4. Add unit tests for verification flow.
5. Deploy early beta to a small group of Québec tradesmen for feedback.
