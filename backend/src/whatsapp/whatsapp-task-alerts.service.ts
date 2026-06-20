import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { JobsService } from '../jobs/jobs.service';
import { serviceLabelFr } from '../common/constants/service-labels';
import { phoneToWhatsappId, whatsappIdToPhone, normalizePhone } from '../common/utils/phone';
import { TaskStatus } from '@prisma/client';

const MAX_ALERTS_PER_TASK = 20;
const OFFER_TTL_MS = 48 * 60 * 60 * 1000;

interface PendingOffer {
  taskId: string;
  expiresAt: number;
}

@Injectable()
export class WhatsappTaskAlertsService {
  private readonly logger = new Logger(WhatsappTaskAlertsService.name);
  private readonly pendingOffers = new Map<string, PendingOffer>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppService: WhatsAppService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Notify matching taskers when a client posts a new open task.
   */
  async notifyNewTask(task: {
    id: string;
    title: string;
    serviceType: string;
    city?: string | null;
    estimatedPrice?: unknown;
    scheduledDate?: Date | null;
    locationLat?: unknown;
    locationLng?: unknown;
  }): Promise<number> {
    if (!this.whatsAppService.isConfigured()) {
      this.logger.debug('Twilio not configured — skipping WhatsApp task alerts');
      return 0;
    }

    const providers = await this.prisma.provider.findMany({
      where: {
        whatsappNotifyEnabled: true,
        serviceTypes: { has: task.serviceType },
        user: {
          deletedAt: null,
          OR: [{ whatsappId: { not: null } }, { phone: { not: null } }],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            phone: true,
            whatsappId: true,
          },
        },
      },
      take: 50,
    });

    const taskLat = task.locationLat != null ? Number(task.locationLat) : null;
    const taskLng = task.locationLng != null ? Number(task.locationLng) : null;

    const eligible = providers.filter((p) => {
      if (
        taskLat != null &&
        taskLng != null &&
        p.locationLat != null &&
        p.locationLng != null
      ) {
        const km = this.haversineKm(
          Number(p.locationLat),
          Number(p.locationLng),
          taskLat,
          taskLng,
        );
        if (km > (p.serviceRadiusKm ?? 25)) return false;
      }
      return true;
    });

    const toNotify = eligible.slice(0, MAX_ALERTS_PER_TASK);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://q-emplois.vercel.app';
    const serviceName = serviceLabelFr(task.serviceType);
    const price =
      task.estimatedPrice != null ? `~${Math.round(Number(task.estimatedPrice))} $` : 'Budget à voir';
    const dateStr = task.scheduledDate
      ? task.scheduledDate.toLocaleDateString('fr-CA', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : 'Date flexible';
    const city = task.city ?? 'Québec';

    let sent = 0;
    for (const provider of toNotify) {
      const to = this.resolveWhatsappDestination(provider.user);
      if (!to) continue;

      const distanceKm =
        taskLat != null &&
        taskLng != null &&
        provider.locationLat != null &&
        provider.locationLng != null
          ? Math.round(
              this.haversineKm(
                Number(provider.locationLat),
                Number(provider.locationLng),
                taskLat,
                taskLng,
              ) * 10,
            ) / 10
          : null;

      const message = `🔔 *Nouvelle tâche — Québec emplois*

${serviceName} · ${city}${distanceKm != null ? ` (~${distanceKm} km)` : ''}
📋 ${task.title}
💰 ${price} · 📅 ${dateStr}

Répondez *POSTULER* pour candidater (1 crédit, remboursé si non retenu)
Répondez *PASSER* pour ignorer

👉 ${frontendUrl}/jobs/${task.id}`;

      try {
        await this.whatsAppService.sendMessage(to, message);
        this.setPendingOffer(to, task.id);
        sent += 1;
      } catch (err) {
        this.logger.warn(`WhatsApp alert failed for ${to}: ${(err as Error).message}`);
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} WhatsApp task alert(s) for task ${task.id}`);
    }
    return sent;
  }

  /**
   * Handle inbound WhatsApp replies (POSTULER / PASSER / STOP).
   */
  async handleTaskerReply(from: string, message: string, profileName: string): Promise<string | null> {
    const body = message.trim();
    const upper = body.toUpperCase();

    if (upper === 'STOP' || upper === 'ARRET' || upper === 'ARRÊT') {
      await this.disableAlertsForWhatsapp(from);
      return `✅ Alertes WhatsApp désactivées. Vous pouvez les réactiver dans votre profil sur Québec emplois.`;
    }

    if (upper === 'PASSER' || upper === 'NON' || upper === 'NO') {
      this.pendingOffers.delete(from);
      return `👍 Tâche ignorée. On vous enverra la prochaine près de chez vous.`;
    }

    const postulerMatch = upper.match(/^POSTULER(?:\s+([0-9A-F-]{6,36}))?$/i);
    if (postulerMatch || upper === 'OUI' || upper === 'YES') {
      return this.handleApply(from, profileName, postulerMatch?.[1]);
    }

    return null;
  }

  private async handleApply(
    from: string,
    profileName: string,
    taskIdHint?: string,
  ): Promise<string> {
    const user = await this.findUserByWhatsapp(from);
    if (!user) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') || 'https://q-emplois.vercel.app';
      return `Pour postuler via WhatsApp, créez d'abord un compte travailleur avec ce numéro:\n${frontendUrl}/register/tasker\n\nPuis activez les alertes dans votre profil.`;
    }

    if (!user.provider?.whatsappNotifyEnabled) {
      return `Activez les alertes WhatsApp dans votre profil travailleur pour postuler par message.`;
    }

    let taskId = taskIdHint;
    if (!taskId) {
      const pending = this.getPendingOffer(from);
      if (!pending) {
        return `Je n'ai pas de tâche en attente. Attendez une alerte 🔔 ou ouvrez l'app pour parcourir les jobs.`;
      }
      taskId = pending.taskId;
    } else if (taskId.length < 36) {
      const match = await this.prisma.task.findFirst({
        where: { id: { startsWith: taskId.toLowerCase() }, status: TaskStatus.open },
        select: { id: true },
      });
      if (!match) {
        return `Tâche introuvable ou plus disponible. Répondez à la dernière alerte avec POSTULER.`;
      }
      taskId = match.id;
    }

    try {
      await this.jobsService.apply(taskId, user.id, {
        message: `Candidature via WhatsApp (${profileName})`,
      });
      this.pendingOffers.delete(from);
      return `✅ *Candidature envoyée!*

Le client choisit parmi les candidats — vous serez avisé s'il vous sélectionne.
1 crédit utilisé (remboursé si non retenu).`;
    } catch (err) {
      if (err instanceof BadRequestException) {
        const r = err.getResponse();
        const msg = typeof r === 'string' ? r : (r as { message?: string | string[] }).message;
        const text = Array.isArray(msg) ? msg[0] : msg;
        return `❌ ${text ?? 'Impossible de postuler.'}`;
      }
      return `❌ Impossible de postuler pour le moment. Réessayez dans l'app.`;
    }
  }

  private async findUserByWhatsapp(from: string) {
    let user = await this.prisma.user.findFirst({
      where: { whatsappId: from },
      include: { provider: true },
    });
    if (user) return user;

    const phone = normalizePhone(whatsappIdToPhone(from));
    if (!phone) return null;

    user = await this.prisma.user.findFirst({
      where: { phone },
      include: { provider: true },
    });

    if (user && !user.whatsappId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { whatsappId: from },
      });
    }
    return user;
  }

  private async disableAlertsForWhatsapp(from: string) {
    const user = await this.findUserByWhatsapp(from);
    if (!user?.provider) return;
    await this.prisma.provider.update({
      where: { userId: user.id },
      data: { whatsappNotifyEnabled: false },
    });
  }

  private resolveWhatsappDestination(user: {
    whatsappId: string | null;
    phone: string | null;
  }): string | null {
    if (user.whatsappId?.startsWith('whatsapp:')) return user.whatsappId;
    if (user.phone) {
      try {
        return phoneToWhatsappId(user.phone);
      } catch {
        return null;
      }
    }
    return null;
  }

  private setPendingOffer(to: string, taskId: string) {
    this.pendingOffers.set(to, {
      taskId,
      expiresAt: Date.now() + OFFER_TTL_MS,
    });
  }

  private getPendingOffer(from: string): PendingOffer | null {
    const offer = this.pendingOffers.get(from);
    if (!offer) return null;
    if (Date.now() > offer.expiresAt) {
      this.pendingOffers.delete(from);
      return null;
    }
    return offer;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
