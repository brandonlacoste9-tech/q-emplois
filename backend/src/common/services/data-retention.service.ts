import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './audit/audit.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Run daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDataRetentionCleanup(): Promise<void> {
    this.logger.log('Starting data retention cleanup...');
    
    const deletedCount = await this.deleteExpiredUserData();
    const logsCleaned = await this.audit.cleanupOldLogs(365);
    
    this.logger.log(`Data retention cleanup complete. Deleted ${deletedCount} users, ${logsCleaned} audit logs.`);
  }

  async deleteExpiredUserData(): Promise<number> {
    const now = new Date();
    
    // Find users whose data retention date has passed
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        dataRetentionDate: {
          lt: now,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (expiredUsers.length === 0) {
      return 0;
    }

    // Soft delete and anonymize
    for (const user of expiredUsers) {
      await this.anonymizeAndDeleteUser(user.id);
    }

    return expiredUsers.length;
  }

  private async anonymizeAndDeleteUser(userId: string): Promise<void> {
    const anonymizedEmail = `deleted_${userId}@deleted.qemplois.ca`;
    const anonymizedPhone = `deleted_${userId}`;

    await this.prisma.$transaction([
      // Anonymize user data
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          emailEncrypted: null,
          phone: anonymizedPhone,
          phoneEncrypted: null,
          firstName: 'Supprimé',
          lastName: 'Supprimé',
          deletedAt: new Date(),
          telegramId: null,
          whatsappId: null,
        },
      }),
      // Log the deletion
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'data_deletion',
          resource: 'user',
          resourceId: userId,
          details: { reason: 'data_retention_policy' },
        },
      }),
    ]);
  }

  // Schedule data retention date for a user
  async scheduleDataRetention(userId: string, days: number = 2555): Promise<void> {
    // Default 7 years (2555 days) as per Quebec business records requirements
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + days);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dataRetentionDate: retentionDate,
      },
    });
  }
}