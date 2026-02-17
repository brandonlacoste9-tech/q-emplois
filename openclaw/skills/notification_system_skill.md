---
name: notification_system
description: Sends alerts for bookings, payments, reminders.
parameters:
  type: object
  properties:
    event_type:
      type: string
      enum: [booking_confirmed, payment_success, reminder]
    user_id:
      type: integer
    payload:
      type: object
  required:
    - event_type
    - user_id
---

**Flow**
1. Receive event from Q‑Works backend (via webhook or direct call).
2. Choose channel based on user preferences (WhatsApp, Telegram, email, push).
3. Format message in Québec French.
4. Call respective API:
   - WhatsApp via Baileys sendMessage
   - Telegram via `sendMessage`
   - Email via SendGrid
   - Push via Firebase
5. Log delivery status.

**Error handling**
- Channel unavailable → fallback to next channel.
- Message send failure → retry 2 times, then log.
