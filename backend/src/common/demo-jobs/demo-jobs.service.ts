import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { geocodeQuebecAddress } from '../utils/geocode';
import {
  DEMO_CLIENT_EMAILS,
  DemoJobTemplate,
  DEMO_JOB_ROTATIONS,
  getActiveDemoJobSet,
  getDemoRotationIndex,
} from './demo-jobs.catalog';

export type DemoJobsRefreshResult = {
  created: number;
  updated: number;
  cancelled: number;
  rotationIndex: number;
  total: number;
  openCount: number;
};

@Injectable()
export class DemoJobsService implements OnModuleInit {
  private readonly logger = new Logger(DemoJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  private get cronEnabled(): boolean {
    return this.config.get('DEMO_JOBS_CRON_ENABLED', 'true') === 'true';
  }

  private get rotationDays(): number {
    const days = Number(this.config.get('DEMO_JOBS_ROTATION_DAYS', '3'));
    return Number.isFinite(days) && days >= 1 ? days : 3;
  }

  private get minOpen(): number {
    const min = Number(this.config.get('DEMO_JOBS_MIN_OPEN', '6'));
    return Number.isFinite(min) && min >= 1 ? min : 6;
  }

  async onModuleInit(): Promise<void> {
    if (!this.cronEnabled) {
      this.logger.log('Demo job cron disabled (DEMO_JOBS_CRON_ENABLED=false).');
      return;
    }

    try {
      const openCount = await this.countOpenDemoJobs();
      if (openCount < this.minOpen) {
        this.logger.log(
          `Only ${openCount} open demo jobs (min ${this.minOpen}) — seeding current rotation.`,
        );
        await this.refreshDemoJobs({ rotate: false, reason: 'startup_ensure' });
      }
    } catch (err) {
      this.logger.error('Startup demo job ensure failed', err);
    }
  }

  /** Daily check — rotate when a new 3-day period begins. */
  @Cron('0 5 * * *', { timeZone: 'America/Toronto' })
  async handleScheduledRotation(): Promise<void> {
    if (!this.cronEnabled) return;

    const rotationIndex = getDemoRotationIndex(this.rotationDays);
    const lastRotation = await this.prisma.auditLog.findFirst({
      where: { action: 'demo_jobs_rotated' },
      orderBy: { createdAt: 'desc' },
    });
    const lastIndex = (lastRotation?.details as { rotationIndex?: number } | null)
      ?.rotationIndex;

    if (lastIndex === rotationIndex) {
      const openCount = await this.countOpenDemoJobs();
      if (openCount < this.minOpen) {
        this.logger.log(
          `Rotation ${rotationIndex} already applied but only ${openCount} open — topping up.`,
        );
        await this.refreshDemoJobs({ rotate: false, reason: 'cron_top_up' });
      }
      return;
    }

    this.logger.log(
      `Rotating demo jobs to set ${rotationIndex + 1}/${DEMO_JOB_ROTATIONS.length}.`,
    );
    await this.refreshDemoJobs({ rotate: true, reason: 'cron_rotate' });
  }

  async refreshDemoJobs(options: {
    rotate?: boolean;
    adminUserId?: string;
    reason?: string;
  } = {}): Promise<DemoJobsRefreshResult> {
    const clients = await this.prisma.user.findMany({
      where: {
        email: { in: [...DEMO_CLIENT_EMAILS] },
        deletedAt: null,
      },
    });

    if (clients.length === 0) {
      throw new Error(
        'Comptes démo introuvables. Exécutez npm run seed sur le serveur d\'abord.',
      );
    }

    const clientIds = clients.map((c) => c.id);
    const rotationIndex = getDemoRotationIndex(this.rotationDays);
    const templates = getActiveDemoJobSet(this.rotationDays);
    let cancelled = 0;

    if (options.rotate) {
      const result = await this.prisma.task.updateMany({
        where: {
          clientId: { in: clientIds },
          status: TaskStatus.open,
        },
        data: {
          status: TaskStatus.cancelled,
          cancelledAt: new Date(),
        },
      });
      cancelled = result.count;
    }

    let created = 0;
    let updated = 0;

    for (let i = 0; i < templates.length; i++) {
      const outcome = await this.upsertDemoTask(templates[i], clients[i % clients.length].id, i);
      if (outcome === 'created') created++;
      if (outcome === 'updated') updated++;
    }

    const openCount = await this.countOpenDemoJobs();

    const details = {
      created,
      updated,
      cancelled,
      rotationIndex,
      total: templates.length,
      openCount,
      reason: options.reason ?? (options.rotate ? 'rotate' : 'ensure'),
      rotationDays: this.rotationDays,
    };

    await this.audit.log({
      userId: options.adminUserId,
      action: options.rotate ? 'demo_jobs_rotated' : 'demo_jobs_seeded',
      resource: 'task',
      details,
    });

    return {
      created,
      updated,
      cancelled,
      rotationIndex,
      total: templates.length,
      openCount,
    };
  }

  private async upsertDemoTask(
    template: DemoJobTemplate,
    clientId: string,
    index: number,
  ): Promise<'created' | 'updated' | 'skipped'> {
    const coords = geocodeQuebecAddress(template.city, template.postalCode);
    const existing = await this.prisma.task.findFirst({
      where: {
        title: template.title,
        clientId,
        status: TaskStatus.open,
      },
    });

    if (!existing) {
      await this.prisma.task.create({
        data: {
          clientId,
          title: template.title,
          description: template.description,
          serviceType: template.serviceType,
          address: template.address,
          city: template.city,
          postalCode: template.postalCode,
          locationLat: coords?.lat,
          locationLng: coords?.lng,
          estimatedPrice: template.price,
          estimatedDuration: template.estimatedDuration ?? 120,
          scheduledDate: new Date(Date.now() + (index + 1) * 86400000),
          status: TaskStatus.open,
        },
      });
      return 'created';
    }

    const patch: {
      locationLat?: number;
      locationLng?: number;
      scheduledDate?: Date;
      description?: string;
      estimatedPrice?: number;
    } = {};

    if (existing.locationLat == null && coords) {
      patch.locationLat = coords.lat;
      patch.locationLng = coords.lng;
    }
    patch.scheduledDate = new Date(Date.now() + (index + 1) * 86400000);
    patch.description = template.description;
    patch.estimatedPrice = template.price;

    if (Object.keys(patch).length > 0) {
      await this.prisma.task.update({
        where: { id: existing.id },
        data: patch,
      });
      return 'updated';
    }

    return 'skipped';
  }

  private async countOpenDemoJobs(): Promise<number> {
    const clients = await this.prisma.user.findMany({
      where: { email: { in: [...DEMO_CLIENT_EMAILS] }, deletedAt: null },
      select: { id: true },
    });
    if (clients.length === 0) return 0;

    return this.prisma.task.count({
      where: {
        clientId: { in: clients.map((c) => c.id) },
        status: TaskStatus.open,
      },
    });
  }
}