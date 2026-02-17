---
name: payment_processing
description: Manages secure payment transactions via Stripe.
parameters:
  type: object
  properties:
    amount_cad:
      type: number
    payment_method_id:
      type: string
    booking_id:
      type: integer
  required:
    - amount_cad
    - payment_method_id
    - booking_id
---

**Flow**
1. Receive amount and Stripe payment method ID from previous step.
2. Call Stripe `paymentIntents.create` with `amount * 100` (cents) and currency `CAD`.
3. Attach the payment intent to the booking via `POST /api/payments`.
4. Return status (`succeeded`, `requires_action`, `failed`).
5. On success, mark booking as `paid`.

**Error handling**
- Card declined → inform user and ask for alternative method.
- Network error → retry up to 2 times, then log.
