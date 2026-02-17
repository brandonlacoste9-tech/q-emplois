# Booking Conversation Flow (Multi‑Day Scenario)

## Overview
This flow models a multi‑step booking process via chat (Telegram/WhatsApp). It uses a **state machine** stored in the OpenClaw session to track progress.

```
State Machine
└─ START
   ├─ ASK_SERVICE
   ├─ ASK_DATE_TIME
   ├─ ASK_LOCATION
   ├─ MATCH_PROVIDER
   ├─ CONFIRM_DETAILS
   └─ FINALIZE
```

## Step‑by‑Step
1. **START** – Bot greets and asks what service the user needs.
   - Input: free‑text or quick‑reply buttons (Plomberie, Électricité, Nettoyage, …).
2. **ASK_SERVICE** – Stores `service_type` in session.
3. **ASK_DATE_TIME** – Presents an inline calendar widget (or asks for date/time text).
   - Validates that the datetime is at least 1 hour in the future.
4. **ASK_LOCATION** – If the user has a saved address, offers it; otherwise asks for new address.
   - Uses Google Maps API to geocode the address to lat/lng.
5. **MATCH_PROVIDER** – Calls `search_services_skill` with the collected filters (service_type, datetime, location).
   - Returns up to 3 provider options with rating and price.
   - Bot sends options as numbered list.
6. **CONFIRM_DETAILS** – User selects provider (or declines to see more).
   - Bot summarizes:
     - Service, date/time, provider name, price, estimated duration.
   - Asks "Confirmer la réservation ? (oui / non)".
7. **FINALIZE** – On confirmation:
   - Calls `booking_request_skill` → creates booking record.
   - Calls `payment_processing_skill` → creates Stripe payment intent, sends payment link.
   - Sends success message with booking ID and provider contact.
   - Updates session state to `COMPLETED`.

## Error Paths
- **Invalid Input** – Bot replies with a brief error in French and repeats the question.
- **No Providers** – Bot offers to broaden radius or suggest alternative dates.
- **Payment Failure** – Bot notifies user, offers alternative payment method, and retries.
- **Timeout** – If no user reply within 5 minutes, bot sends a reminder; after 3 reminders, it aborts and clears session.

## Example Dialogue (Telegram)
```
[Bot] Bonjour ! Quel service cherchez‑vous ? (Plomberie, Nettoyage, …)
[User] Nettoyage
[Bot] Quelle date et heure préférez‑vous ? (ex: 2026‑02‑20 14:00)
[User] 20 février à 14h
[Bot] Où se situe le nettoyage ? (adresse ou "ma localisation")
[User] 123 Rue Sherbrooke, Montréal
[Bot] Nous avons trouvé 2 prestataires :
1️⃣ Marie – 45 $/h – 4,8★ – 2 km
2️⃣ Luc – 40 $/h – 4,5★ – 3 km
Quel prestataire choisissez‑vous ? (1 / 2 / autre)
[User] 1
[Bot] Vous avez choisi Marie pour un nettoyage le 20 février à 14 h, à l’adresse 123 Rue Sherbrooke. Prix estimé : 90 $.
Confirmer ? (oui / non)
[User] oui
[Bot] ✅ Réservation créée ! Paiement sécurisé via Stripe : https://pay.stripe.com/... 
Vous recevrez un SMS de confirmation.
```

## Implementation Tips
- Use **OpenClaw’s session storage** (`session.set`, `session.get`) to keep `service_type`, `datetime`, `location`, `provider_choice`.
- Leverage **inline keyboards** for quick replies (Telegram) or **list templates** (WhatsApp Business API).
- After each successful step, call `session.save()` to survive disconnections.
- For multi‑day bookings, allow the user to pick a **date range**; store as `start_date` and `end_date`.
- Trigger a **reminder cron job** (`heartbeat`) that sends a reminder 24 h before the appointment.
