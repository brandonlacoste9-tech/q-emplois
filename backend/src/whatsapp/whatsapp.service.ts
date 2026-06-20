import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import Twilio from 'twilio';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: Twilio.Twilio | null = null;
  private fromNumber: string;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const apiKeySid = this.configService.get<string>('TWILIO_API_KEY_SID');
    const apiKeySecret = this.configService.get<string>('TWILIO_API_KEY_SECRET');
    this.fromNumber =
      this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') ||
      'whatsapp:+14155238886';

    if (accountSid && apiKeySid && apiKeySecret) {
      this.twilioClient = Twilio(apiKeySid, apiKeySecret, { accountSid });
      this.logger.log('Twilio WhatsApp client initialized (API key)');
    } else if (accountSid && authToken) {
      this.twilioClient = Twilio(accountSid, authToken);
      this.logger.log('Twilio WhatsApp client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured. WhatsApp will not work.');
    }
  }

  isConfigured(): boolean {
    return this.twilioClient != null;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      this.logger.warn(`WhatsApp (dry run) to=${to}: ${message.slice(0, 120)}...`);
      return;
    }

    const destination = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: destination,
      });
      this.logger.log(`Message sent to ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to send message: ${(error as Error).message}`);
      throw error;
    }
  }

  getSandboxInstructions(): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://q-emplois.vercel.app';
    return `📱 *WhatsApp Québec emplois — bêta*

1️⃣ Ajoutez le numéro sandbox Twilio à vos contacts
2️⃣ Envoyez le code *join …* affiché dans la console Twilio
3️⃣ Inscrivez-vous travailleur: ${frontendUrl}/register/tasker
4️⃣ Activez les alertes dans votre profil

Commandes: POSTULER · PASSER · STOP · /aide`;
  }

  processGeneralMessage(message: string, name: string): string {
    const messageLower = message.toLowerCase().trim();

    // Handle /start link_<userId> for account linking
    const linkMatch = message.match(/^\/start\s+link_([a-zA-Z0-9-]+)/);
    if (linkMatch) {
      const userId = linkMatch[1];
      // This path is handled asynchronously in the controller via linkAccount
      return ''; // not reachable — controller intercepts first
    }
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://q-emplois.vercel.app';

    if (
      messageLower === '/start' ||
      messageLower === 'bonjour' ||
      messageLower === 'salut' ||
      messageLower === 'hello'
    ) {
      return `👋 Bonjour ${name}! Bienvenue sur *Québec emplois* ⚜

Je vous alerte quand une tâche correspond à vos services près de chez vous.

*Travailleur?*
1. Inscrivez-vous: ${frontendUrl}/register/tasker
2. Activez les alertes WhatsApp dans votre profil
3. Répondez *POSTULER* quand vous recevez une alerte 🔔

Tapez /aide pour plus d'info.`;
    }

    if (messageLower === '/aide' || messageLower === 'aide' || messageLower === 'help') {
      return `📚 *Alertes tâches WhatsApp*

Quand une tâche est publiée près de vous:
• *POSTULER* — candidater (1 crédit, remboursé si non retenu)
• *PASSER* — ignorer
• *STOP* — désactiver les alertes

Le *client choisit* parmi les candidats — pas de course pour accepter en premier.

Profil & crédits: ${frontendUrl}/profile`;
    }

    return `Je n'ai pas compris 🤔

Attendez une alerte 🔔 *Nouvelle tâche* ou tapez /aide.

Travailleur? Inscrivez-vous: ${frontendUrl}/recrute`;
  }
}
