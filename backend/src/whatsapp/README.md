# WhatsApp Integration - QWORKS

## Twilio WhatsApp Setup

### 1. Create Twilio Account
- Sign up at https://www.twilio.com/try-twilio
- Get your Account SID and Auth Token from the console

### 2. Get WhatsApp Sandbox Number
- Go to Messaging → Try it out → Send a WhatsApp message
- Your sandbox number: `+1 (415) 523-8886` (or similar)
- Join code: `join soap-warm` (changes periodically)

### 3. Environment Variables
Add to your `.env` file:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Configure Webhook URL
In Twilio Console:
- Go to Messaging → Settings → WhatsApp Sandbox Settings
- Set "When a message comes in" webhook to:
  ```
  https://your-domain.com/api/v1/whatsapp/webhook
  ```
- Method: HTTP POST

### 5. Test the Integration
1. Save the Twilio sandbox number in your phone contacts
2. Send WhatsApp message: `join soap-warm`
3. You should receive a confirmation
4. Send: `/start` or "Bonjour"
5. The bot should respond!

## WhatsApp Business API (Production)

For production with your own WhatsApp Business number:

1. Apply for WhatsApp Business API at https://business.whatsapp.com/products/business-platform
2. Complete Meta business verification
3. Get a Twilio WhatsApp Business number or use direct Meta API
4. Update `TWILIO_WHATSAPP_NUMBER` to your verified number

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/aide` | Help information |
| `/services` | List available services |
| Service name | Start booking (e.g., "plombier") |

## API Endpoints

- `POST /api/v1/whatsapp/webhook` - Receive messages from Twilio
- `POST /api/v1/whatsapp/send` - Send test message (authenticated)
- `GET /api/v1/whatsapp/setup` - Get sandbox instructions
- `GET /api/v1/whatsapp/health` - Health check

## Natural Language Examples

Users can book by simply messaging:
- "J'ai besoin d'un plombier demain"
- "Électricien urgent ce soir"
- "Déménagement samedi matin"
- "Nettoyage pour Airbnb cette semaine"

## Law 25 Compliance

WhatsApp messages respect Quebec privacy law:
- No PII stored in message logs
- Consent obtained before storing data
- 30-day data retention policy
- Users can request data deletion via /profil
