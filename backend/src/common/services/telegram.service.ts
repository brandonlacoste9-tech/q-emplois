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
}