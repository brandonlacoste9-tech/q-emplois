import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { AuditService } from '../common/audit/audit.service';
import { geocodeQuebecAddress } from '../common/utils/geocode';

@Injectable()
export class AdminService {
  /**
   * Verification expiry policy: 12 months from approval.
   * After this date, isVerified becomes false and the tasker must
   * re-upload their ID document. Configurable via env if Law 25
   * policy changes; defaults to 365 days.
   */
  private static readonly VERIFICATION_TTL_DAYS =
    Number(process.env.VERIFICATION_TTL_DAYS) || 365;

  private computeExpiryDate(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + AdminService.VERIFICATION_TTL_DAYS);
    return expires;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async getBetaMetrics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      tasksPosted,
      applicationsTotal,
      pendingApplications,
      tasksClaimed,
      tasksCompleted,
      tasksOpen,
      refundTransactions,
      pendingVerifications,
      applyTransactions,
    ] = await Promise.all([
      this.prisma.task.count({ where: { createdAt: { gte: since } } }),
      this.prisma.taskApplication.count({ where: { createdAt: { gte: since } } }),
      this.prisma.taskApplication.count({ where: { status: 'pending' } }),
      this.prisma.task.count({
        where: { createdAt: { gte: since }, status: { in: ['claimed', 'in_progress', 'completed'] } },
      }),
      this.prisma.task.count({ where: { createdAt: { gte: since }, status: 'completed' } }),
      this.prisma.task.count({ where: { status: 'open' } }),
      this.prisma.creditTransaction.count({ where: { type: 'refund', createdAt: { gte: since } } }),
      this.prisma.provider.count({
        where: { licenseDocumentUrl: { not: null }, isVerified: false },
      }),
      this.prisma.creditTransaction.count({ where: { type: 'apply', createdAt: { gte: since } } }),
    ]);

    const openWithApps = await this.prisma.task.findMany({
      where: { status: 'open', applications: { some: { status: 'pending' } } },
      include: {
        applications: { where: { status: 'pending' }, select: { id: true } },
      },
    });

    const avgApplicationsPerOpenJob =
      openWithApps.length > 0
        ? openWithApps.reduce((s, t) => s + t.applications.length, 0) / openWithApps.length
        : 0;

    const selectionRate = tasksPosted > 0 ? Math.round((tasksClaimed / tasksPosted) * 100) : 0;
    const completionRate = tasksClaimed > 0 ? Math.round((tasksCompleted / tasksClaimed) * 100) : 0;

    const recentTasks = await this.prisma.task.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      periodDays: days,
      tasksPosted,
      tasksOpen,
      applicationsTotal,
      pendingApplications,
      applyCreditsSpent: applyTransactions,
      refundTransactions,
      avgApplicationsPerOpenJob: Math.round(avgApplicationsPerOpenJob * 10) / 10,
      selectionRatePercent: selectionRate,
      completionRatePercent: completionRate,
      pendingVerifications,
      recentTasks: recentTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        applications: t._count.applications,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async listPendingVerifications(q?: string) {
    const where: Record<string, unknown> = {
      licenseDocumentUrl: { not: null },
      isVerified: false,
    };
    if (q) {
      where.user = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }
    const providers = await this.prisma.provider.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return providers.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      phone: p.user.phone,
      serviceTypes: p.serviceTypes,
      licenseDocumentUrl: p.licenseDocumentUrl,
      licenseNumber: p.licenseNumber,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      verifiedBy: p.verifiedBy,
      rejectedAt: p.rejectedAt?.toISOString() ?? null,
      rejectionReason: p.rejectionReason,
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async verifyProvider(providerId: string, adminUserId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: { select: { email: true, firstName: true } } },
    });
    if (!provider) throw new NotFoundException('Prestataire non trouvé.');

    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        verificationExpiresAt: this.computeExpiryDate(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'provider_verified',
      resource: 'provider',
      resourceId: providerId,
      details: { verifiedAt: updated.verifiedAt },
    });

    if (provider.user.email) {
      await this.emailService.sendTaskerVerified(provider.user.email, provider.user.firstName);
    }

    return updated;
  }

  async rejectVerification(
    providerId: string,
    adminUserId: string,
    reason?: string,
  ) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: { select: { email: true, firstName: true } } },
    });
    if (!provider) throw new NotFoundException('Prestataire non trouvé.');

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        licenseDocumentUrl: null,
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
        verificationExpiresAt: null,
        rejectedAt: new Date(),
        rejectionReason: reason ?? null,
      },
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'provider_verification_rejected',
      resource: 'provider',
      resourceId: providerId,
      details: { reason: reason ?? null },
    });

    if (provider.user.email) {
      await this.emailService.sendTaskerRejected(
        provider.user.email,
        provider.user.firstName,
        reason,
      );
    }

    return { success: true };
  }

  async generateInvite(
    adminId: string,
    body?: { maxRedemptions?: number; rewardCredits?: number; discountPct?: number },
  ) {
    const code = `FOUNDER-${Date.now().toString(36).toUpperCase()}`;
    const invite = await this.prisma.inviteCode.create({
      data: {
        code,
        maxRedemptions: body?.maxRedemptions ?? 50,
        rewardCredits: body?.rewardCredits ?? 100,
        lifetimeDiscountPct: body?.discountPct ?? 15,
        createdBy: adminId,
      },
    });
    return { code: invite.code, maxRedemptions: invite.maxRedemptions, rewardCredits: invite.rewardCredits };
  }

  async getAuditLogs(page = 1, action?: string, userId?: string) {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    const take = 50;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.ceil(total / take),
    };
  }

  async searchProviders(q?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (status === 'verified') where.isVerified = true;
    else if (status === 'pending') where.isVerified = false;
    else if (status === 'expired') {
      where.isVerified = true;
      where.verificationExpiresAt = { lte: new Date() };
    }
    if (q) {
      where.OR = [
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { serviceTypes: { has: q } },
      ];
    }
    const providers = await this.prisma.provider.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return providers.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      phone: p.user.phone,
      serviceTypes: p.serviceTypes,
      isVerified: p.isVerified,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      licenseNumber: p.licenseNumber,
      rejectedAt: p.rejectedAt?.toISOString() ?? null,
      rejectionReason: p.rejectionReason,
      verificationExpiresAt: p.verificationExpiresAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async listUsers(q?: string, role?: string, page = 1) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (role && ['client', 'provider', 'admin'].includes(role)) {
      where.role = role;
    }
    if (q?.trim()) {
      where.OR = [
        { email: { contains: q.trim(), mode: 'insensitive' } },
        { firstName: { contains: q.trim(), mode: 'insensitive' } },
        { lastName: { contains: q.trim(), mode: 'insensitive' } },
        { phone: { contains: q.trim() } },
      ];
    }
    const take = 50;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
          provider: { select: { isVerified: true, serviceTypes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        isVerified: u.provider?.isVerified ?? false,
        serviceTypes: u.provider?.serviceTypes ?? [],
      })),
      total,
      page,
      pages: Math.ceil(total / take),
    };
  }

  async updateUserRole(targetUserId: string, role: string, adminUserId: string) {
    const validRoles: UserRole[] = [UserRole.client, UserRole.provider, UserRole.admin];
    if (!validRoles.includes(role as UserRole)) {
      throw new BadRequestException('Rôle invalide.');
    }
    if (targetUserId === adminUserId && role !== UserRole.admin) {
      throw new ForbiddenException('Vous ne pouvez pas retirer votre propre rôle admin.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as UserRole },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    await this.auditService.log({
      userId: adminUserId,
      action: 'user_role_updated',
      resource: 'user',
      resourceId: targetUserId,
      details: { previousRole: user.role, newRole: role, email: user.email },
    });
    return updated;
  }

  async listAllJobs(status?: string, q?: string, page = 1) {
    const where: Record<string, unknown> = {};
    const statusMap: Record<string, TaskStatus> = {
      pending: TaskStatus.open,
      open: TaskStatus.open,
      accepted: TaskStatus.claimed,
      claimed: TaskStatus.claimed,
      in_progress: TaskStatus.in_progress,
      completed: TaskStatus.completed,
      cancelled: TaskStatus.cancelled,
      declined: TaskStatus.declined,
    };
    if (status && statusMap[status]) {
      where.status = statusMap[status];
    }
    if (q?.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { city: { contains: q.trim(), mode: 'insensitive' } },
        { client: { email: { contains: q.trim(), mode: 'insensitive' } } },
      ];
    }
    const take = 50;
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          client: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);
    const frontendStatus: Record<TaskStatus, string> = {
      open: 'pending',
      claimed: 'accepted',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
      declined: 'declined',
    };
    return {
      jobs: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: frontendStatus[t.status] ?? t.status,
        serviceType: t.serviceType,
        city: t.city,
        estimatedPrice: Number(t.estimatedPrice),
        applications: t._count.applications,
        clientId: t.clientId,
        clientEmail: t.client.email,
        clientName: [t.client.firstName, t.client.lastName].filter(Boolean).join(' ') || 'Client',
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.ceil(total / take),
    };
  }

  async seedDemoJobs(adminUserId: string) {
    const clients = await this.prisma.user.findMany({
      where: {
        email: { in: ['demo.client1@qemplois.ca', 'demo.client2@qemplois.ca'] },
        deletedAt: null,
      },
    });
    if (clients.length === 0) {
      throw new BadRequestException(
        'Comptes démo introuvables. Exécutez npm run seed sur le serveur d\'abord.',
      );
    }

    const demoTasks = [
      { title: 'Ménage printemps 3½', description: 'Nettoyage complet d\'un 3½ à Rosemont.', serviceType: 'menage', address: '1230 Rue Beaubien E', city: 'Montréal', postalCode: 'H2S 1T7', price: 120 },
      { title: 'Déménagement studio', description: 'Aide pour déménager un studio (2e étage sans ascenseur).', serviceType: 'demenagement', address: '4500 Rue Saint-Denis', city: 'Montréal', postalCode: 'H2J 2L3', price: 180 },
      { title: 'Montage IKEA', description: 'Montage d\'un lit et d\'une commode IKEA.', serviceType: 'montage_meubles', address: '7890 Boul. Décarie', city: 'Montréal', postalCode: 'H4P 1H5', price: 95 },
      { title: 'Nettoyage après rénovation', description: 'Poussière et débris après petite rénovation de cuisine.', serviceType: 'nettoyage', address: '2100 Rue Ontario E', city: 'Montréal', postalCode: 'H2K 1V2', price: 150 },
      { title: 'Tonte de pelouse', description: 'Pelouse moyenne, équipement sur place.', serviceType: 'jardinage', address: '5600 Av. du Parc', city: 'Montréal', postalCode: 'H2V 4H1', price: 60 },
      { title: 'Livraison meubles Kijiji', description: 'Ramasser un canapé et livrer à Verdun.', serviceType: 'livraison', address: '3900 Rue Wellington', city: 'Verdun', postalCode: 'H4G 1V3', price: 75 },
      { title: 'Aide ménage hebdo', description: '2h de ménage régulier.', serviceType: 'menage', address: '1200 Rue Sherbrooke O', city: 'Montréal', postalCode: 'H3A 1H6', price: 70 },
      { title: 'Courses et livraison', description: 'Faire l\'épicerie et livrer chez une personne âgée.', serviceType: 'coursier', address: '1500 Boul. René-Lévesque', city: 'Montréal', postalCode: 'H3G 1T7', price: 35 },
    ].filter((t) => !/déneigement|deneigement|snow removal/i.test(t.title));

    let created = 0;
    let updated = 0;
    for (let i = 0; i < demoTasks.length; i++) {
      const t = demoTasks[i];
      const client = clients[i % clients.length];
      const coords = geocodeQuebecAddress(t.city, t.postalCode);
      const existing = await this.prisma.task.findFirst({
        where: { title: t.title, clientId: client.id },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            clientId: client.id,
            title: t.title,
            description: t.description,
            serviceType: t.serviceType,
            address: t.address,
            city: t.city,
            postalCode: t.postalCode,
            locationLat: coords?.lat,
            locationLng: coords?.lng,
            estimatedPrice: t.price,
            estimatedDuration: 120,
            scheduledDate: new Date(Date.now() + (i + 1) * 86400000),
            status: TaskStatus.open,
          },
        });
        created++;
      } else {
        const patch: {
          locationLat?: number;
          locationLng?: number;
          status?: TaskStatus;
          scheduledDate?: Date;
        } = {};
        if (existing.locationLat == null && coords) {
          patch.locationLat = coords.lat;
          patch.locationLng = coords.lng;
        }
        if (existing.status !== TaskStatus.open) {
          patch.status = TaskStatus.open;
          patch.scheduledDate = new Date(Date.now() + (i + 1) * 86400000);
        }
        if (Object.keys(patch).length > 0) {
          await this.prisma.task.update({
            where: { id: existing.id },
            data: patch,
          });
          updated++;
        }
      }
    }

    await this.auditService.log({
      userId: adminUserId,
      action: 'demo_jobs_seeded',
      resource: 'task',
      details: { created, updated },
    });

    return { created, updated, total: demoTasks.length };
  }
}
