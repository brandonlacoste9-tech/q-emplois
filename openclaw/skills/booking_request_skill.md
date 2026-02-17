---
name: booking_request
description: Initiates a booking for a selected service.
parameters:
  type: object
  properties:
    service_id:
      type: integer
    datetime:
      type: string
      format: date-time
    location:
      type: object
      properties:
        lat:
          type: number
        lng:
          type: number
  required:
    - service_id
    - datetime
    - location
---

**Flow**
1. Confirm service details with user.
2. Collect desired date/time and location.
3. Call `POST /api/bookings` with JWT.
4. If provider auto‑matches, return provider info and price.
5. Ask user to confirm.
6. On confirmation, trigger Stripe payment intent.

**Error handling**
- Provider unavailable → suggest alternative times.
- Payment failure → inform user and retry.
