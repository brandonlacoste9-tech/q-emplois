import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreditsService } from '../credits/credits.service';
import { NotificationsService } from '../notifications/notifications.service';
import { geocodeQuebecAddress } from '../common/utils/geocode';
import { CreateTaskDto, DeclineTaskDto } from './dto/job.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly creditsService: CreditsService,
    private readonly notificationsService: NotificationsService,
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

  private shouldRevealContact(task: { clientId: string; taskerId?: string | null; status: TaskStatus }, viewerUserId: string): boolean {
    if (task.clientId === viewerUserId) return true;
    if (task.taskerId === viewerUserId) return true;
    return task.status !== TaskStatus.open;
  }

  private publicPostalArea(postalCode?: string | null): string {
    return postalCode?.replace(/\s/g, '').toUpperCase().slice(0, 3) ?? '';
  }

  private mapTask(task: any, provider: any | undefined, viewerUserId: string) {
    const revealContact = this.shouldRevealContact(task, viewerUserId);
    const clientName = revealContact
      ? [task.client?.firstName, task.client?.lastName].filter(Boolean).join(' ') || 'Client'
      : 'Client';

    return {
      id: task.id,
      clientId: task.clientId,
      clientName,
      clientPhone: revealContact ? task.client?.phone ?? undefined : undefined,
      serviceType: task.serviceType,
      title: task.title,
      description: task.description,
      address: {
        street: revealContact ? task.address : '',
        city: task.city ?? '',
        postalCode: revealContact
          ? task.postalCode ?? ''
          : this.publicPostalArea(task.postalCode),
        coordinates:
          revealContact && task.locationLat != null && task.locationLng != null
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
        client: { select: { firstName: true, lastName: true, phone: true } },
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
        client: { select: { firstName: true, lastName: true, phone: true } },
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
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    await this.auditService.log({
      userId: clientId,
      action: 'task_created',
      resource: 'task',
      resourceId: task.id,
    });

    return this.mapTask(task, undefined, clientId);
  }

  async claim(taskId: string, taskerId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.status !== TaskStatus.open) {
      throw new BadRequestException('Cette tâche n\'est plus disponible.');
    }
    if (task.clientId === taskerId) {
      throw new BadRequestException('Vous ne pouvez pas réclamer votre propre tâche.');
    }

    await this.creditsService.spendCredit(taskerId, taskId, 'Réclamation de tâche');

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.claimed,
        taskerId,
        claimedAt: new Date(),
      },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true } },
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
      'Tâche acceptée',
      `${tasker?.firstName ?? 'Un travailleur'} a accepté votre tâche « ${task.title} ».`,
      { taskId },
    );

    return this.mapTask(updated, undefined, taskerId);
  }

  async accept(taskId: string, taskerId: string) {
    return this.claim(taskId, taskerId);
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
        client: { select: { firstName: true, lastName: true, phone: true } },
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
        client: { select: { firstName: true, lastName: true, phone: true } },
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
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

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

    await this.prisma.task.delete({ where: { id: taskId } });

    await this.auditService.log({
      userId,
      action: 'task_deleted',
      resource: 'task',
      resourceId: taskId,
    });

    return { success: true };
  }
}