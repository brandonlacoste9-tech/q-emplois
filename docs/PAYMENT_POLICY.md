# Payment Policy — Québec Emplois

Canonical reference for how payments work on the platform (as of Phase B, June 2026).

## Summary

| Flow | Method | Required? |
|------|--------|-----------|
| Tasker credit packs | Stripe Checkout | Yes (to buy credits) |
| Task payment (client → tasker) | Stripe Checkout **or** direct | **Optional** — client chooses |

## Credit purchases (tasker → platform)

1. Tasker visits `/credits` and selects a credit pack.
2. Redirected to **Stripe Checkout** (live keys on production API).
3. On successful webhook, credits are added to the tasker account.
4. **1 credit = 1 job application** (refunded if not selected).

Credits are the platform's primary revenue source.

## Task payments (client → tasker)

After the client **selects a tasker** and the job moves to `accepted`, `in_progress`, or `completed`:

- The client may click **Payer $X** on the job detail page → Stripe Checkout.
- **Or** the client may pay the tasker directly (e-transfer, cash, etc.) without using Stripe.

The platform does **not** require Stripe for task payment. Direct arrangements are explicitly supported.

### When Stripe task payment is available

- Job status: `accepted`, `in_progress`, or `completed`
- Viewer: job owner (client)
- `paymentStatus` not yet `paid`
- Stripe configured on API (`GET /payments/config` → `configured: true`)

### What we do not do

- We do not take a commission on task payments.
- We do not hold task funds in escrow (see L'Atelier for milestone escrow — separate product).
- We do not guarantee work quality; see Garantie satisfaction for support process.

## Copy guidelines (marketing & UI)

Use consistent language across surfaces:

- **FR:** « Paiement en ligne optionnel (Stripe) » or « payez en ligne (Stripe) ou directement avec le travailleur »
- **EN:** « Optional online payment (Stripe) » or « pay online (Stripe) or directly with your tasker »

Avoid: « paiement en ligne à venir », « coming soon », « we don't handle payments » — these are outdated.

## Admin suspend (unrelated but Phase B)

Soft suspend blocks login and API access until an admin unsuspends. Does not affect Stripe or payment records.