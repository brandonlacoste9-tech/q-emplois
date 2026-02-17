---
name: profile_management
description: Allows users to update their profile details.
parameters:
  type: object
  properties:
    updates:
      type: object
      description: Key‑value pairs of fields to update (e.g., name, address, language).
  required:
    - updates
---

**Flow**
1. Bot receives an update request.
2. Validate fields (e.g., email format, phone format).
3. Call `PATCH /api/users/me` with the updates and the user's JWT.
4. Return a success or failure message in French.

**Error handling**
- Validation error → explain which field is wrong.
- API failure → log and notify the user to try later.
