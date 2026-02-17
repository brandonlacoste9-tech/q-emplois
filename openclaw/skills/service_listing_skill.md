---
name: service_listing
description: Enables tradesmen to list a new service offering.
parameters:
  type: object
  properties:
    service_type:
      type: string
      description: Trade category (e.g., plumbing, nettoyage).
    price:
      type: number
      description: Hourly rate in CAD.
    description:
      type: string
    location:
      type: object
      properties:
        lat:
          type: number
        lng:
          type: number
  required:
    - service_type
    - price
    - location
---

**Flow**
1. Collect service details via chat prompts.
2. Validate price > 0 and location present.
3. Call `POST /api/providers/{id}/services` with JWT.
4. Respond with a confirmation and the service ID.

**Error handling**
- Missing fields → ask user to provide.
- API error → log and advise retry.
