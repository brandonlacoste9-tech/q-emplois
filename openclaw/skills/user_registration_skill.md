---
name: user_registration
description: Handles new user sign‑up via phone or email.
parameters:
  type: object
  properties:
    method:
      type: string
      enum: [phone, email]
    identifier:
      type: string
      description: Phone number (E.164) or email address.
  required:
    - method
    - identifier
---

**Flow**
1. Bot asks the user which method they prefer (phone/email).
2. Collect the identifier.
3. Call Q‑Works API `POST /api/auth/register` with `{ method, identifier }`.
4. If successful, store the returned JWT token in the OpenClaw session storage.
5. Respond with a confirmation message in Québec French.

**Error handling**
- Invalid format → reply with a friendly error and ask to retry.
- API error → log the error, inform the user that registration failed and suggest trying again later.
