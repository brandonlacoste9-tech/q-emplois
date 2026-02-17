---
name: search_services
description: Allows users to search for services based on filters.
parameters:
  type: object
  properties:
    trade:
      type: string
    location:
      type: object
      properties:
        lat:
          type: number
        lng:
          type: number
    radius_km:
      type: number
      default: 10
  required:
    - location
---

**Flow**
1. Receive filter criteria.
2. Build a PostGIS query: `ST_DWithin(location, point, radius_km*1000)`.
3. Call `GET /api/services?trade=...&lat=...&lng=...&radius=...`.
4. Return a list of matching services with provider name, rating, price.

**Error handling**
- No results → inform user no providers nearby.
- API error → log and ask to try again later.
