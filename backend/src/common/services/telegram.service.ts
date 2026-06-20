import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationChannel {
  userId: string;
  email?: string;
  telegramId?: string | null;
  whatsappId?: string | null;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? null;
  }

  isConfigured(): boolean {
    return !!this.botToken;
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — skipping telegram message');
      return false;
    }
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Telegram API error (${res.status}): ${body}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('Telegram send failed:', err);
      return false;
    }
  }

  /** Generate a deep-link for the user to start the bot and auto-link their account */
  getBotLink(userId: string): string | null {
    if (!this.botToken) return null;
    // Extract bot username from token: 123456:ABCdef -> @botusername
    // We use a start parameter with the userId for auto-linking
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    if (!botUsername) return null;
    return `https://t.me/${botUsername}?start=link_${userId}`;
  }

  /** Process an incoming update from the Telegram Bot API webhook */
  async processUpdate(update: Record<string, unknown>): Promise<{ ok: boolean }> {
    const message = (update as any).message;
    if (!message?.text || !message?.chat?.id) {
      return { ok: true }; // non-message updates (callback_query, etc.) are ignored
    }

    const chatId = String(message.chat.id);
    const text = String(message.text).trim();
    const firstName = message.from?.first_name ?? '';

    // Handle /start link_<userId>
    const startMatch = text.match(/^\/start\s+link_([a-zA-Z0-9-]+)/);
    if (startMatch) {
      const userId = startMatch[1];
      try {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          await this.sendMessage(chatId, `❌ Lien invalide. Aucun compte trouvé.`);
          return { ok: true };
        }

        // Check if Telegram is already linked
        const existing = await this.prisma.user.findUnique({ where: { telegramId: chatId } });
        if (existing && existing.id !== userId) {
          await this.sendMessage(chatId, `❌ Ce compte Telegram est déjà lié à un autre utilisateur Q-Emplois.`);
          return { ok: true };
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: { telegramId: chatId },
        });

        await this.sendMessage(
          chatId,
          `✅ <b>Compte lié avec succès, ${firstName} !</b>\n\nTu recevras maintenant tes notifications Q-Emplois ici en temps réel.\n\n📌 Pour te désabonner, envoie /stop.`,
        );
        this.logger.log(`Telegram linked: user=${userId} chatId=${chatId}`);
      } catch (err) {
        this.logger.error('Telegram link error:', err);
        await this.sendMessage(chatId, `❌ Erreur lors de la liaison. Réessaye plus tard.`);
      }
      return { ok: true };
    }

    // Handle /stop — unlink
    if (text === '/stop' || text === '/unlink') {
      const user = await this.prisma.user.findFirst({ where: { telegramId: chatId } });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { telegramId: null },
        });
        await this.sendMessage(chatId, `🔕 Notifications Telegram désactivées. Pour réactiver, visite ton profil Q-Emplois.`);
      } else {
        await this.sendMessage(chatId, `Aucun compte lié à ce chat.`);
      }
      return { ok: true };
    }

    // Handle /start without link param
    if (text === '/start') {
      await this.sendMessage(chatId, `👋 <b>Bienvenue sur Q-Emplois !</b>\n\nPour lier ton compte, visite ton profil sur <a href="https://q-emplois.vercel.app">q-emplois.vercel.app</a> et clique sur « Connecter Telegram ».`);
      return { ok: true };
    }

    // Unknown command
    await this.sendMessage(chatId, `🤖 Commandes disponibles:\n/start — Lier ton compte\n/stop — Désactiver les notifications\n\nPour de l'aide: aide@q-emplois.ca`);
    return { ok: true };
  }
}