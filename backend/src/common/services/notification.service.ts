import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../whatsapp/whatsapp.service';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  async notifyTaskerNewJob(taskerId: string, job: any) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: taskerId },
      include: { user: true },
    });

    if (!provider) return;

    const message = `Nouvelle offre disponible!\n\n${job.title}\n${job.description?.slice(0, 120)}...\n\nLieu: ${job.city || 'Non spécifié'}`;

    // Try WhatsApp first
    if (provider.user.whatsappId) {
      await this.whatsappService.sendMessage(provider.user.whatsappId, message);
      this.logger.log(`WhatsApp notification sent to ${taskerId}`);
      return;
    }

    // Fallback to Telegram
    if (provider.user.telegramId) {
      await this.telegramService.sendMessage(provider.user.telegramId, message);
      this.logger.log(`Telegram notification sent to ${taskerId}`);
    }
  }

  async notifyTaskerSelected(taskerId: string, job: any) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: taskerId },
      include: { user: true },
    });

    if (!provider) return;

    const message = `Félicitations! Vous avez été sélectionné pour:\n${job.title}\n\nLe client va vous contacter.`;

    if (provider.user.whatsappId) {
      await this.whatsappService.sendMessage(provider.user.whatsappId, message);
    } else if (provider.user.telegramId) {
      await this.telegramService.sendMessage(provider.user.telegramId, message);
    }
  }
}
