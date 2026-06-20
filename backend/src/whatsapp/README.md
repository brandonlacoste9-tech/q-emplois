# WhatsApp tasker alerts — Québec emplois

Taskers opt in via **Profile → Alertes WhatsApp**. When a client posts a task, matching providers receive a WhatsApp message and can reply **POSTULER** (apply) or **PASSER** (skip).

## Flow

1. Client posts task on web → `JobsService.create`
2. `WhatsappTaskAlertsService.notifyNewTask` finds providers where:
   - `whatsappNotifyEnabled = true`
   - `serviceTypes` includes task type
   - within `serviceRadiusKm` (when lat/lng known)
3. Twilio sends alert with job summary + link
4. Tasker replies **POSTULER** → `JobsService.apply` (1 credit, same rules as web)
5. **STOP** disables alerts; **PASSER** dismisses without applying

## Twilio setup

### Environment

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
FRONTEND_URL=https://q-emplois.vercel.app
```

### Webhook

`POST https://YOUR-RAILWAY-URL.up.railway.app/api/v1/whatsapp/webhook`

### Sandbox test

1. Join Twilio WhatsApp sandbox (`join …` code in Twilio console)
2. Register as tasker with the **same phone number**
3. Enable alerts in Profile
4. Post a task as client (matching service + area)
5. Reply **POSTULER** on WhatsApp

## API

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/whatsapp/webhook` | Twilio inbound |
| `GET /api/v1/whatsapp/setup` | Sandbox instructions |
| `PUT /api/v1/providers/me` | `{ whatsappNotifyEnabled: true }` |

## Loi 25

Explicit opt-in checkbox in Profile. **STOP** disables alerts. No client PII in alert body (city/sector only).
