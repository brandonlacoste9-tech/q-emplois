import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: Twilio.Twilio;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886'; // Sandbox number

    if (accountSid && authToken) {
      this.twilioClient = Twilio(accountSid, authToken);
      this.logger.log('Twilio WhatsApp client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured. WhatsApp will not work.');
    }
  }

  /**
   * Handle incoming WhatsApp message from Twilio webhook
   */
  async handleIncomingMessage(body: any): Promise<string> {
    const from = body.From; // whatsapp:+1234567890
    const to = body.To;
    const messageBody = body.Body;
    const profileName = body.ProfileName || 'Utilisateur';

    this.logger.log(`Message from ${profileName} (${from}): ${messageBody}`);

    // Parse the message and generate response
    const response = await this.processMessage(from, messageBody, profileName);

    return response;
  }

  /**
   * Process user message and generate response
   */
  private async processMessage(from: string, message: string, name: string): Promise<string> {
    const messageLower = message.toLowerCase().trim();

    // Command handling
    if (messageLower === '/start' || messageLower === 'bonjour' || messageLower === 'salut') {
      return this.getWelcomeMessage(name);
    }

    if (messageLower === '/aide' || messageLower === 'aide') {
      return this.getHelpMessage();
    }

    if (messageLower === '/services' || messageLower === 'services') {
      return this.getServicesList();
    }

    // Service booking flow
    if (this.isServiceRequest(messageLower)) {
      return this.startBookingFlow(message, name);
    }

    // Default response
    return this.getDefaultResponse();
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      this.logger.error('Twilio client not initialized');
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });
      this.logger.log(`Message sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(to: string, bookingDetails: any): Promise<void> {
    const message = `✅ *Réservation Confirmée!*

📋 Numéro: ${bookingDetails.id}
🔧 Service: ${bookingDetails.service}
📅 Date: ${bookingDetails.date}
⏰ Heure: ${bookingDetails.time}
📍 Adresse: ${bookingDetails.address}

👨‍🔧 Prestataire: ${bookingDetails.providerName}
📞 Téléphone: ${bookingDetails.providerPhone}

💰 Prix estimé: ${bookingDetails.price} $

Pour annuler, répondez *ANNULER ${bookingDetails.id}*
Pour modifier, répondez *MODIFIER ${bookingDetails.id}*`;

    await this.sendMessage(to, message);
  }

  /**
   * Send notification to provider
   */
  async sendProviderNotification(to: string, jobDetails: any): Promise<void> {
    const message = `🔔 *Nouvelle demande de service!*

🔧 Service: ${jobDetails.service}
📅 Date: ${jobDetails.date}
⏰ Heure: ${jobDetails.time}
📍 Distance: ${jobDetails.distance} km
💰 Prix estimé: ${jobDetails.price} $

Pour accepter, répondez *ACCEPTER ${jobDetails.bookingId}*
Pour refuser, répondez *REFUSER ${jobDetails.bookingId}*`;

    await this.sendMessage(to, message);
  }

  /**
   * Welcome message
   */
  private getWelcomeMessage(name: string): string {
    return `👋 Bonjour ${name}! Bienvenue sur *QWORKS* 🔧

Je suis votre assistant pour trouver des professionnels au Québec.

*Services disponibles:*
🔧 Plomberie
⚡ Électricité  
🧹 Nettoyage
🌱 Jardinage
🚚 Déménagement

*Commandes utiles:*
• /services - Voir tous les services
• /aide - Comment ça marche
• /mesreservations - Mes réservations

*Pour réserver, dites-moi:*
"J'ai besoin d'un plombier demain à 14h"`;
  }

  /**
   * Help message
   */
  private getHelpMessage(): string {
    return `📚 *Comment utiliser QWORKS*

*Réserver un service:*
Dites simplement ce dont vous avez besoin, par exemple:
• "Plombier demain matin"
• "J'ai besoin d'aide pour déménager samedi"
• "Électricien cette semaine après 17h"

*Commandes disponibles:*
/services - Liste des services
/mesreservations - Voir mes réservations
/annuler - Annuler une réservation
/profil - Mon profil

*Questions?*
Visitez: https://qworks.ca/aide`;
  }

  /**
   * Services list
   */
  private getServicesList(): string {
    return `🔧 *Nos Services*

1️⃣ *Plomberie*
Réparations, installations, débouchage
À partir de 75$/heure

2️⃣ *Électricité*
Réparations, installations, inspections
À partir de 85$/heure

3️⃣ *Nettoyage*
Résidentiel, commercial, Airbnb
À partir de 35$/heure

4️⃣ *Jardinage*
Tonte, taille, entretien saisonnier
À partir de 40$/heure

5️⃣ *Déménagement*
Transport, monte-meuble, emballage
À partir de 90$/heure

*Pour réserver:*
Dites-moi quel service vous intéresse!`;
  }

  /**
   * Check if message is a service request
   */
  private isServiceRequest(message: string): boolean {
    const serviceKeywords = [
      'plombier', 'plomberie', 'fuite', 'tuyau', 'toilette',
      'électricien', 'électricité', 'prise', 'lumière', 'circuit',
      'nettoyage', 'ménage', 'nettoyer', 'propre',
      'jardinage', 'jardin', 'tonte', 'herbe', 'taille',
      'déménagement', 'déménager', 'transport', 'meuble'
    ];
    return serviceKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Start booking flow
   */
  private startBookingFlow(message: string, name: string): string {
    // Extract service type
    let service = 'Service';
    const msg = message.toLowerCase();
    
    if (msg.includes('plomb')) service = 'Plomberie 🔧';
    else if (msg.includes('élec')) service = 'Électricité ⚡';
    else if (msg.includes('nettoy') || msg.includes('ménage')) service = 'Nettoyage 🧹';
    else if (msg.includes('jardin')) service = 'Jardinage 🌱';
    else if (msg.includes('démenag')) service = 'Déménagement 🚚';

    // Parse date/time (simplified)
    let dateInfo = '';
    if (msg.includes('demain')) dateInfo = 'demain';
    else if (msg.includes('aujourd')) dateInfo = "aujourd'hui";
    else if (msg.includes('semaine')) dateInfo = 'cette semaine';

    return `📝 *Demande de ${service}*

Merci ${name}! J'ai bien noté votre demande ${dateInfo ? 'pour ' + dateInfo : ''}.

Pour compléter votre réservation, j'ai besoin de:

1️⃣ *Votre adresse complète*
2️⃣ *Une description du problème/travail*

Vous pouvez aussi créer un compte sur:
https://qworks.ca/register

*Répondez avec votre adresse pour continuer.*`;
  }

  /**
   * Default response
   */
  private getDefaultResponse(): string {
    return `Je n'ai pas compris 🤔

Essayez de me dire:
• "J'ai besoin d'un plombier"
• "Déménagement samedi matin"
• "Électricien urgent"

Ou tapez /aide pour voir les commandes disponibles.`;
  }

  /**
   * Get Twilio sandbox join code
   */
  getSandboxInstructions(): string {
    return `📱 *Configuration WhatsApp Sandbox*

Pour tester avant d'être approuvé par Meta:

1️⃣ Enregistrez ce numéro dans vos contacts:
   *+1 (415) 523-8886*

2️⃣ Envoyez ce message WhatsApp:
   *join soap-warm*

3️⃣ Vous pourrez alors interagir avec le bot!

*Note:* En production, vous aurez votre propre numéro WhatsApp Business vérifié.`;
  }
}
