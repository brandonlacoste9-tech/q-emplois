---
name: review_submission
description: Collects feedback after a service is completed.
parameters:
  type: object
  properties:
    booking_id:
      type: integer
    rating:
      type: integer
      minimum: 1
      maximum: 5
    comment:
      type: string
  required:
    - booking_id
    - rating
---

**Flow**
1. After booking marked `completed`, bot asks user to rate (1‑5) and optionally comment.
2. Call `POST /api/reviews` with JWT.
3. Store review and update provider's aggregate rating.
4. Send thank‑you message.

**Error handling**
- Invalid rating → ask again.
- API failure → log and notify user.
