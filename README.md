# Q-Emplois Chatbot

OpenClaw chatbot for booking services via Telegram/WhatsApp. Connects customers with service providers (plumbers, electricians, cleaners, etc.) in Quebec.

## Features

- 📱 Natural French conversation via Telegram & WhatsApp
- 🔧 Service booking: Plomberie, Électricité, Nettoyage, Jardinage, Déménagement
- 📍 Location-based provider matching
- ⭐ Provider ratings & reviews
- 💳 Secure payment integration
- 🔔 Real-time notifications
- 🔐 Law 25 compliant (Quebec privacy law)

## Architecture

```
openclaw/
├── skills/
│   ├── qemplois/
│   │   ├── __init__.py
│   │   ├── booking_flow.py      # Main booking conversation state machine
│   │   ├── auth_handler.py      # Account linking & authentication
│   │   ├── job_notifications.py # Provider notification templates
│   │   ├── bot_handler.py       # OpenClaw integration entry point
│   │   ├── utils.py             # French date/time parsing, formatting
│   │   └── SKILL.yaml           # Skill configuration
│   └── __init__.py
```

## Booking Flow

1. **Welcome** → Select service type (1-5)
2. **Ask Date** → Natural language date parsing (aujourd'hui, demain, 20 février)
3. **Ask Time** → Time parsing (14h, 9h30)
4. **Ask Location** → Address with geocoding
5. **Search** → Find available providers
6. **Select Provider** → Choose from rated providers
7. **Confirm** → Booking summary & confirmation
8. **Payment** → Secure payment link

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Begin booking flow |
| `/aide` | Show help |
| `/mesreservations` | List my bookings |
| `/annuler [numéro]` | Cancel booking |
| `/profil` | View/edit profile |
| `/devenirpro` | Sign up as provider |

## Skills

### booking_request
Create a new service booking
```yaml
input:
  service_type: string
  date: ISO8601
  time: string
  location: {address, lat, lng}
  provider_id: string (optional)
output:
  booking_id: string
  provider: object
  price_estimate: number
  status: pending_payment
```

### search_services
Find available providers
```yaml
input:
  service_type: string
  date: ISO8601
  lat: float
  lng: float
  radius_km: int
output:
  providers: array
```

### payment_processing
Generate payment link
```yaml
input:
  booking_id: string
  amount: number
output:
  payment_url: string
  status: pending
```

## Privacy (Law 25 Compliance)

- ✅ No PII stored in chat logs
- ✅ Session data encrypted
- ✅ Consent required before data storage
- ✅ 30-day data retention limit
- ✅ One-click account deletion
- ✅ Clear privacy policy

## Testing

```bash
cd q-emplois
python -m pytest tests/
```

## Deployment

1. Configure environment variables:
   ```bash
   export TELEGRAM_BOT_TOKEN=xxx
   export WHATSAPP_API_KEY=xxx
   export QEMPLOIS_API_URL=https://api.qemplois.ca
   ```

2. Install OpenClaw skill:
   ```bash
   openclaw skill install ./openclaw/skills/qemplois
   ```

3. Configure webhooks for Telegram/WhatsApp

## License

MIT - For Q-Emplois platform
