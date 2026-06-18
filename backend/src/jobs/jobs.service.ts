import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreditsService } from '../credits/credits.service';
import { CreateTaskDto, DeclineTaskDto } from './dto/job.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly creditsService: CreditsService,
  ) {}

  private mapTask(task: any) {
    const clientName = [task.client?.firstName, task.client?.lastName]
      .filter(Boolean)
      .join(' ') || 'Client';

    return {
      id: task.id,
      clientId: task.clientId,
      clientName,
      clientPhone: task.client?.phone ?? undefined,
      serviceType: task.serviceType,
      title: task.title,
      description: task.description,
      address: {
        street: task.address,
        city: task.city ?? '',
        postalCode: task.postalCode ?? '',
        coordinates:
          task.locationLat != null && task.locationLng != null
            ? { lat: Number(task.locationLat), lng: Number(task.locationLng) }
            : undefined,
      },
      scheduledDate: task.scheduledDate?.toISOString() ?? new Date().toISOString(),
      estimatedDuration: task.estimatedDuration,
      estimatedPrice: Number(task.estimatedPrice),
      status: this.mapStatus(task.status),
      createdAt: task.createdAt.toISOString(),
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

  async list(userId: string, filters?: { status?: string; serviceType?: string }) {
    const status = this.reverseStatus(filters?.status);
    const tasks = await this.prisma.task.findMany({
      where: {
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
    return tasks.map((t) => this.mapTask(t));
  }

  async getById(id: string, userId: string) {
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
    return this.mapTask(task);
  }

  async create(clientId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        clientId,
        title: dto.title,
        description: dto.description,
        serviceType: dto.serviceType,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
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

    return this.mapTask(task);
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

    await this.auditService.log({
      userId: taskerId,
      action: 'task_claimed',
      resource: 'task',
      resourceId: taskId,
    });

    return this.mapTask(updated);
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

    return this.mapTask(updated);
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

    return this.mapTask(updated);
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

    return this.mapTask(updated);
  }
}