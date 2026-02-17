# Authentication Flow for Telegram & WhatsApp

## Goal
Securely link a user’s messaging identity (Telegram user ID or WhatsApp phone number) to their Q‑Works account so the bot can act on their behalf (bookings, payments, profile updates).

## Steps
1. **User initiates conversation**
   - Bot sends a welcome message with a **"Login / Register"** button that contains a deep‑link to the web portal: `https://qworks.ca/auth?platform=telegram&uid=123456` (Telegram) or `https://qworks.ca/auth?platform=whatsapp&phone=+15145551234` (WhatsApp).
2. **Web login**
   - User logs in using email/password or creates an account.
   - Upon successful login, the server generates a short‑lived JWT (e.g., 15 min) and stores it linked to the messaging identifier.
   - The web page redirects to `https://t.me/QWorksBot?start=auth_<token>` (Telegram) or sends the token back via a WhatsApp Business API **template message**.
3. **Bot receives token**
   - OpenClaw extracts the token from the `start` parameter (Telegram) or from the incoming message payload (WhatsApp).
   - Bot validates the JWT against Q‑Works auth service (`GET /api/auth/validate`).
   - On success, the token is cached in the OpenClaw session and associated with the user’s `chat_id`.
4. **Session Management**
   - All subsequent commands include the cached JWT automatically.
   - Tokens are refreshed when nearing expiry: the bot sends a silent “refresh” request to `/api/auth/refresh`.
   - If validation fails, the bot prompts the user to re‑authenticate.

## Security Considerations (Law 25)
- **No data is stored on the messaging platform** – only the JWT (signed, short‑lived).
- **Consent** – The first login message includes a consent notice in French: *« J’autorise Q‑Works à associer mon compte à ce numéro de téléphone pour les services de messagerie »*.
- **Revocation** – An admin can revoke a token via the Q‑Works dashboard, instantly invalidating the session.
- **Encryption** – All HTTP traffic uses TLS; the bot stores tokens in memory only.

## Sample Bot Interaction (Telegram)
```
[Bot] Bonjour ! Pour accéder à votre compte, cliquez sur le bouton ci‑dessous.
[Button] Se connecter → https://qworks.ca/auth?platform=telegram&uid=123456

[User clicks link, logs in, is redirected]
[Bot] ✅ Vous êtes maintenant connecté. Vous pouvez réserver des services, vérifier vos réservations, …
```

## Sample Bot Interaction (WhatsApp)
```
[Bot] Salut ! Pour lier votre compte, envoyez le code suivant à https://qworks.ca/auth?platform=whatsapp&phone=+15145551234
[User opens link, logs in, receives message]
[WhatsApp] Votre compte est lié. Vous pouvez maintenant discuter avec Q‑Works.
```

---
**Implementation Tips**
- Use **OpenClaw’s `session` storage** to keep the JWT (`session.set('jwt', token)`).
- Expose a **webhook** in Q‑Works (`/api/auth/webhook`) that receives the token and forwards it to OpenClaw via an internal RPC call.
- For Telegram, leverage the `start` parameter mechanism; for WhatsApp use the outbound message template with the token payload.
