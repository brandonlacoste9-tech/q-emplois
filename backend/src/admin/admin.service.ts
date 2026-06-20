import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { AuditService } from '../common/audit/audit.service';

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
}
