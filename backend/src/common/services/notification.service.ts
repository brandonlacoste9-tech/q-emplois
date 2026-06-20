import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  /** Notify an eligible tasker that a new job matching their services was posted. */
  async notifyTaskerNewJob(taskerId: string, job: any) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: taskerId },
      include: { user: true },
    });

    if (!provider?.user.telegramId) return;

    // Use rich job alert with inline keyboard action buttons
    await this.telegramService.sendJobAlert(provider.user.telegramId, job).catch((err) => {
      this.logger.warn(`Telegram job alert failed for ${taskerId}: ${(err as Error).message}`);
    });

    this.logger.log(`Telegram job alert sent to tasker ${taskerId}`);
  }

  /** Notify a tasker that they have been selected by the client. */
  async notifyTaskerSelected(taskerId: string, job: any) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: taskerId },
      include: { user: true },
    });

    if (!provider?.user.telegramId) return;

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://q-emplois.vercel.app';
    const message =
      `🎉 <b>Félicitations ! Tu as été sélectionné.</b>\n\n` +
      `Le client t'a choisi pour :\n<b>${job.title}</b>\n\n` +
      `Son nom et numéro de téléphone sont maintenant visibles dans la tâche.\n\n` +
      `<a href="${frontendUrl}/jobs/${job.id}">Voir la tâche →</a>`;

    await this.telegramService.sendMessage(provider.user.telegramId, message).catch((err) => {
      this.logger.warn(`Telegram selection notification failed for ${taskerId}: ${(err as Error).message}`);
    });
  }
}
