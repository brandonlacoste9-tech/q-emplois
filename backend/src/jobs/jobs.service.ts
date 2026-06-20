import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreditsService } from '../credits/credits.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import { WhatsappTaskAlertsService } from '../whatsapp/whatsapp-task-alerts.service';
import { geocodeQuebecAddress } from '../common/utils/geocode';
import { publicPostalSector, sanitizePublicDescription } from '../common/utils/privacy';
import { CreateTaskDto, DeclineTaskDto, ApplyTaskDto } from './dto/job.dto';
import { TaskStatus, TaskApplicationStatus, CreditTransactionType } from '@prisma/client';
import { getPriceGuide, getAllPriceGuides } from '../common/constants/price-guides';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly creditsService: CreditsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Optional() private readonly whatsappAlerts?: WhatsappTaskAlertsService,
  ) {}

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private computeDistance(task: any, provider?: any): number | undefined {
    if (
      provider?.locationLat == null ||
      provider?.locationLng == null ||
      task.locationLat == null ||
      task.locationLng == null
    ) {
      return undefined;
    }
    return Math.round(
      this.haversineKm(
        Number(provider.locationLat),
        Number(provider.locationLng),
        Number(task.locationLat),
        Number(task.locationLng),
      ) * 10,
    ) / 10;
  }

  private shouldRevealContact(
    task: { clientId: string; taskerId?: string | null; status: TaskStatus },
    viewerUserId: string,
  ): boolean {
    if (task.clientId === viewerUserId) return true;
    if (task.taskerId === viewerUserId && task.status !== TaskStatus.open) return true;
    return false;
  }

  private shouldRevealAddress(
    task: { clientId: string; taskerId?: string | null; status: TaskStatus },
    viewerUserId: string,
  ): boolean {
    if (task.clientId === viewerUserId) return true;
    if (
      task.taskerId === viewerUserId &&
      (task.status === TaskStatus.in_progress || task.status === TaskStatus.completed)
    ) {
      return true;
    }
    return false;
  }

  private publicPostalArea(postalCode?: string | null): string {
    return publicPostalSector(postalCode);
  }

  private mapTask(task: any, provider: any | undefined, viewerUserId: string) {
    const revealContact = this.shouldRevealContact(task, viewerUserId);
    const revealAddress = this.shouldRevealAddress(task, viewerUserId);
    const clientName = revealContact
      ? [task.client?.firstName, task.client?.lastName].filter(Boolean).join(' ') || 'Client'
      : 'Client';

    const applications = task.applications ?? [];
    const pendingApplicationCount = applications.filter(
      (a: { status: string }) => a.status === TaskApplicationStatus.pending,
    ).length;
    const myApplication = applications.find(
      (a: { taskerId: string }) => a.taskerId === viewerUserId,
    );

    return {
      id: task.id,
      clientId: task.clientId,
      clientName,
      clientAvatar: task.client?.avatarUrl ?? undefined,
      clientPhone: revealContact ? task.client?.phone ?? undefined : undefined,
      serviceType: task.serviceType,
      title: task.title,
      description: revealContact
        ? task.description
        : sanitizePublicDescription(task.description),
      address: {
        street: revealAddress ? task.address : '',
        city: task.city ?? '',
        postalCode: revealAddress
          ? task.postalCode ?? ''
          : this.publicPostalArea(task.postalCode),
        coordinates:
          revealAddress && task.locationLat != null && task.locationLng != null
            ? { lat: Number(task.locationLat), lng: Number(task.locationLng) }
            : undefined,
      },
      scheduledDate: task.scheduledDate?.toISOString() ?? new Date().toISOString(),
      estimatedDuration: task.estimatedDuration,
      estimatedPrice: Number(task.estimatedPrice),
      status: this.mapStatus(task.status),
      createdAt: task.createdAt.toISOString(),
      distance: this.computeDistance(task, provider),
      contactRedacted: !revealContact,
      addressRedacted: !revealAddress,
      pendingApplicationCount,
      myApplicationStatus: myApplication?.status ?? null,
      paymentStatus: (task as { paymentStatus?: string }).paymentStatus ?? 'unpaid',
      photoUrls: (task as { photoUrls?: string[] }).photoUrls ?? [],
    };
  }

  private mapStatus(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      open: 'pending',
      claimed: 'accepted',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
      declined: 'declined',
    };
    return map[status] ?? status;
  }

  private reverseStatus(status?: string): TaskStatus | undefined {
    if (!status) return undefined;
    const map: Record<string, TaskStatus> = {
      pending: TaskStatus.open,
      open: TaskStatus.open,
      accepted: TaskStatus.claimed,
      claimed: TaskStatus.claimed,
      in_progress: TaskStatus.in_progress,
      completed: TaskStatus.completed,
      cancelled: TaskStatus.cancelled,
      declined: TaskStatus.declined,
    };
    return map[status];
  }

  async list(userId: string, filters?: { status?: string; serviceType?: string; perspective?: string }) {
    const status = this.reverseStatus(filters?.status);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    });
    const provider = user?.provider;
    const clientView = filters?.perspective === 'mine';

    const tasks = await this.prisma.task.findMany({
      where: clientView
        ? {
            clientId: userId,
            ...(status ? { status } : {}),
            ...(filters?.serviceType ? { serviceType: filters.serviceType } : {}),
          }
        : {
            ...(status ? { status } : {}),
            ...(filters?.serviceType ? { serviceType: filters.serviceType } : {}),
            OR: [
              { status: TaskStatus.open },
              { taskerId: userId },
              { clientId: userId },
            ],
          },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = tasks.map((t) => this.mapTask(t, provider, userId));

    if (!clientView && provider) {
      results = results.filter((job) => {
        if (job.status !== 'pending') return true;
        if (job.clientId === userId) return true;
        if (provider.serviceTypes?.length && !provider.serviceTypes.includes(job.serviceType)) {
          return false;
        }
        if (
          job.distance != null &&
          provider.serviceRadiusKm != null &&
          job.distance > Number(provider.serviceRadiusKm)
        ) {
          return false;
        }
        return true;
      });

      results.sort((a, b) => {
        if (a.status === 'pending' && b.status === 'pending') {
          if (a.distance != null && b.distance != null) return a.distance - b.distance;
          if (a.distance != null) return -1;
          if (b.distance != null) return 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return results;
  }

  async getById(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    });
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (
      task.status !== TaskStatus.open &&
      task.clientId !== userId &&
      task.taskerId !== userId
    ) {
      throw new ForbiddenException('Accès refusé.');
    }
    return this.mapTask(task, user?.provider, userId);
  }

  async create(clientId: string, dto: CreateTaskDto) {
    let locationLat = dto.locationLat;
    let locationLng = dto.locationLng;
    if (locationLat == null || locationLng == null) {
      const coords = geocodeQuebecAddress(dto.city, dto.postalCode);
      if (coords) {
        locationLat = coords.lat;
        locationLng = coords.lng;
      }
    }

    const task = await this.prisma.task.create({
      data: {
        clientId,
        title: dto.title,
        description: dto.description,
        serviceType: dto.serviceType,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        locationLat,
        locationLng,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        estimatedDuration: dto.estimatedDuration ?? 60,
        estimatedPrice: dto.estimatedPrice,
        photoUrls: dto.photoUrls ?? [],
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });

    await this.auditService.log({
      userId: clientId,
      action: 'task_created',
      resource: 'task',
      resourceId: task.id,
    });

    if (this.whatsappAlerts) {
      void this.whatsappAlerts.notifyNewTask(task).catch((err) => {
        this.logger.warn(`WhatsApp task alerts failed: ${(err as Error).message}`);
      });
    }

    return this.mapTask(task, undefined, clientId);
  }

  async claim(taskId: string, taskerId: string, skipCreditSpend = false) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.status !== TaskStatus.open) {
      throw new BadRequestException('Cette tâche n\'est plus disponible.');
    }
    if (task.clientId === taskerId) {
      throw new BadRequestException('Vous ne pouvez pas réclamer votre propre tâche.');
    }

    if (!skipCreditSpend) {
      await this.creditsService.spendCredit(
        taskerId,
        taskId,
        'Réclamation de tâche',
        CreditTransactionType.claim,
      );
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.claimed,
        taskerId,
        claimedAt: new Date(),
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });

    const existingConversation = await this.prisma.conversation.findFirst({
      where: { clientId: task.clientId, providerId: taskerId },
    });
    if (!existingConversation) {
      await this.prisma.conversation.create({
        data: {
          clientId: task.clientId,
          providerId: taskerId,
          taskId,
        },
      });
    } else if (!existingConversation.taskId) {
      await this.prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { taskId },
      });
    }

    await this.auditService.log({
      userId: taskerId,
      action: 'task_claimed',
      resource: 'task',
      resourceId: taskId,
    });

    const tasker = await this.prisma.user.findUnique({
      where: { id: taskerId },
      select: { firstName: true, lastName: true },
    });
    await this.notificationsService.create(
      task.clientId,
      'job_accepted',
      'Travailleur choisi',
      `${tasker?.firstName ?? 'Un travailleur'} a été choisi pour « ${task.title} ». Votre nom et téléphone lui sont visibles; l'adresse exacte s'affichera au démarrage du travail.`,
      { taskId },
    );

    await this.notificationsService.create(
      taskerId,
      'job_accepted',
      'Contact débloqué',
      `Vous avez été choisi pour « ${task.title} ». Vous pouvez contacter le client; l'adresse exacte sera visible lorsque vous démarrez le job.`,
      { taskId },
    );

    return this.mapTask(updated, undefined, taskerId);
  }

  async apply(taskId: string, taskerId: string, dto: ApplyTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.status !== TaskStatus.open) {
      throw new BadRequestException('Cette tâche n\'accepte plus de candidatures.');
    }
    if (task.clientId === taskerId) {
      throw new BadRequestException('Vous ne pouvez pas postuler à votre propre tâche.');
    }

    const existing = await this.prisma.taskApplication.findUnique({
      where: { taskId_taskerId: { taskId, taskerId } },
    });
    if (existing?.status === TaskApplicationStatus.pending) {
      throw new BadRequestException('Vous avez déjà postulé à cette tâche.');
    }
    if (existing?.status === TaskApplicationStatus.selected) {
      throw new BadRequestException('Vous avez déjà été choisi pour cette tâche.');
    }

    await this.creditsService.spendCredit(
      taskerId,
      taskId,
      'Candidature à une tâche',
      CreditTransactionType.apply,
    );

    if (existing) {
      await this.prisma.taskApplication.update({
        where: { id: existing.id },
        data: { status: TaskApplicationStatus.pending, message: dto.message },
      });
    } else {
      await this.prisma.taskApplication.create({
        data: {
          taskId,
          taskerId,
          message: dto.message,
          status: TaskApplicationStatus.pending,
        },
      });
    }

    const tasker = await this.prisma.user.findUnique({
      where: { id: taskerId },
      select: { firstName: true, lastName: true },
    });

    await this.notificationsService.create(
      task.clientId,
      'job_application',
      'Nouvelle candidature',
      `${tasker?.firstName ?? 'Un travailleur'} a postulé pour « ${task.title} ».`,
      { taskId, taskerId },
    );

    const client = await this.prisma.user.findUnique({
      where: { id: task.clientId },
      select: { email: true },
    });
    const pendingCount = await this.prisma.taskApplication.count({
      where: { taskId, status: TaskApplicationStatus.pending },
    });
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    if (client?.email) {
      const taskerName = [tasker?.firstName, tasker?.lastName].filter(Boolean).join(' ') || 'Un travailleur';
      await this.emailService.sendNewApplication(
        client.email,
        task.title,
        taskerName,
        `${frontendUrl}/jobs/${taskId}`,
        pendingCount,
      );
    }

    await this.auditService.log({
      userId: taskerId,
      action: 'task_applied',
      resource: 'task',
      resourceId: taskId,
    });

    return this.getById(taskId, taskerId);
  }

  async listApplications(taskId: string, clientId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== clientId) {
      throw new ForbiddenException('Seul le client peut voir les candidatures.');
    }

    const applications = await this.prisma.taskApplication.findMany({
      where: { taskId, status: TaskApplicationStatus.pending },
      include: {
        tasker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            provider: {
              select: {
                serviceTypes: true,
                rating: true,
                reviewCount: true,
                isVerified: true,
                hourlyRate: true,
                locationAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return applications.map((app) => ({
      id: app.id,
      taskerId: app.taskerId,
      message: app.message,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      tasker: {
        id: app.tasker.id,
        firstName: app.tasker.firstName,
        lastName: app.tasker.lastName,
        avatar: app.tasker.avatarUrl ?? undefined,
        serviceTypes: app.tasker.provider?.serviceTypes ?? [],
        rating: app.tasker.provider?.rating ?? 0,
        reviewCount: app.tasker.provider?.reviewCount ?? 0,
        isVerified: app.tasker.provider?.isVerified ?? false,
        hourlyRate: app.tasker.provider?.hourlyRate
          ? Number(app.tasker.provider.hourlyRate)
          : undefined,
        city: app.tasker.provider?.locationAddress,
      },
    }));
  }

  async selectTasker(taskId: string, clientId: string, taskerId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== clientId) {
      throw new ForbiddenException('Seul le client peut choisir un travailleur.');
    }
    if (task.status !== TaskStatus.open) {
      throw new BadRequestException('Cette tâche n\'accepte plus de candidatures.');
    }

    const application = await this.prisma.taskApplication.findUnique({
      where: { taskId_taskerId: { taskId, taskerId } },
    });
    if (!application || application.status !== TaskApplicationStatus.pending) {
      throw new BadRequestException('Candidature non trouvée ou déjà traitée.');
    }

    const otherPending = await this.prisma.taskApplication.findMany({
      where: {
        taskId,
        status: TaskApplicationStatus.pending,
        taskerId: { not: taskerId },
      },
    });

    for (const other of otherPending) {
      await this.prisma.taskApplication.update({
        where: { id: other.id },
        data: { status: TaskApplicationStatus.rejected },
      });
      await this.creditsService.refundCredit(
        other.taskerId,
        taskId,
        'Candidature non retenue — remboursement',
      );
      await this.notificationsService.create(
        other.taskerId,
        'job_application_rejected',
        'Candidature non retenue',
        `Le client a choisi un autre travailleur pour « ${task.title} ». Votre crédit a été remboursé.`,
        { taskId },
      );
    }

    await this.prisma.taskApplication.update({
      where: { id: application.id },
      data: { status: TaskApplicationStatus.selected },
    });

    return this.claim(taskId, taskerId, true);
  }

  async withdrawApplication(taskId: string, taskerId: string) {
    const application = await this.prisma.taskApplication.findUnique({
      where: { taskId_taskerId: { taskId, taskerId } },
      include: { task: true },
    });
    if (!application) throw new NotFoundException('Candidature non trouvée.');
    if (application.status !== TaskApplicationStatus.pending) {
      throw new BadRequestException('Cette candidature ne peut plus être retirée.');
    }

    await this.prisma.taskApplication.update({
      where: { id: application.id },
      data: { status: TaskApplicationStatus.withdrawn },
    });

    await this.creditsService.refundCredit(
      taskerId,
      taskId,
      'Candidature retirée — remboursement',
    );

    return { success: true };
  }

  private hoursUntilScheduled(scheduledDate?: Date | null): number | null {
    if (!scheduledDate) return null;
    return (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
  }

  async cancel(taskId: string, clientId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== clientId) {
      throw new ForbiddenException('Seul le client peut annuler cette tâche.');
    }

    if (task.status === TaskStatus.open) {
      return this.remove(taskId, clientId);
    }

    if (task.status !== TaskStatus.claimed && task.status !== TaskStatus.in_progress) {
      throw new BadRequestException('Cette tâche ne peut pas être annulée.');
    }

    const hoursLeft = this.hoursUntilScheduled(task.scheduledDate);
    const refundCredit = hoursLeft === null || hoursLeft >= 24;

    if (task.taskerId && refundCredit) {
      await this.creditsService.refundCredit(
        task.taskerId,
        taskId,
        'Annulation client (24h+) — remboursement',
      );
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.cancelled,
        cancelledAt: new Date(),
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: { select: { id: true, status: true, taskerId: true } },
      },
    });

    if (task.taskerId) {
      await this.notificationsService.create(
        task.taskerId,
        'job_cancelled',
        'Tâche annulée',
        refundCredit
          ? `« ${task.title} » a été annulée par le client. Votre crédit a été remboursé.`
          : `« ${task.title} » a été annulée par le client (moins de 24 h). Aucun remboursement de crédit.`,
        { taskId },
      );
    }

    await this.auditService.log({
      userId: clientId,
      action: 'task_cancelled',
      resource: 'task',
      resourceId: taskId,
      details: { refundCredit },
    });

    return this.mapTask(updated, undefined, clientId);
  }

  async accept(taskId: string, taskerId: string) {
    return this.apply(taskId, taskerId, {});
  }

  async decline(taskId: string, taskerId: string, dto: DeclineTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.taskerId !== taskerId) throw new ForbiddenException('Accès refusé.');

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.declined,
        declineReason: dto.reason,
        taskerId: null,
        claimedAt: null,
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });

    return this.mapTask(updated, undefined, taskerId);
  }

  async complete(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.taskerId !== userId && task.clientId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });

    const notifyUserId = userId === task.clientId ? task.taskerId : task.clientId;
    if (notifyUserId) {
      await this.notificationsService.create(
        notifyUserId,
        'job_completed',
        'Tâche terminée',
        `La tâche « ${task.title} » a été marquée comme terminée.`,
        { taskId },
      );
    }

    return this.mapTask(updated, undefined, userId);
  }

  async start(taskId: string, taskerId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.taskerId !== taskerId) throw new ForbiddenException('Accès refusé.');

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.in_progress },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        applications: {
          select: { id: true, status: true, taskerId: true },
        },
      },
    });

    await this.notificationsService.create(
      taskerId,
      'job_started',
      'Adresse débloquée',
      `L'adresse complète de « ${task.title} » est maintenant visible.`,
      { taskId },
    );

    await this.notificationsService.create(
      task.clientId,
      'job_started',
      'Travailleur en route',
      `${task.title} : le travailleur a démarré le job et voit votre adresse complète.`,
      { taskId },
    );

    return this.mapTask(updated, undefined, taskerId);
  }

  async remove(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== userId) {
      throw new ForbiddenException('Seul le client peut supprimer cette tâche.');
    }
    if (task.status !== TaskStatus.open) {
      throw new BadRequestException(
        'Seules les tâches en attente peuvent être supprimées.',
      );
    }

    const pendingApplications = await this.prisma.taskApplication.findMany({
      where: { taskId, status: TaskApplicationStatus.pending },
    });

    for (const app of pendingApplications) {
      await this.creditsService.refundCredit(
        app.taskerId,
        taskId,
        'Tâche supprimée — remboursement candidature',
      );
      await this.notificationsService.create(
        app.taskerId,
        'job_deleted',
        'Tâche retirée',
        `« ${task.title} » a été supprimée par le client. Votre crédit a été remboursé.`,
        { taskId },
      );
    }

    await this.prisma.task.delete({ where: { id: taskId } });

    await this.auditService.log({
      userId,
      action: 'task_deleted',
      resource: 'task',
      resourceId: taskId,
    });

    return { success: true };
  }

  getPriceGuides(city?: string) {
    return getAllPriceGuides(city);
  }

  getPriceGuideForService(serviceType: string, city?: string) {
    return getPriceGuide(serviceType, city);
  }
}