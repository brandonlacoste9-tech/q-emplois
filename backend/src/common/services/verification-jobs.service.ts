import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

/**
 * Background jobs that keep verification state healthy:
 *
 * 1. Stale-pending alert: notify admin + tasker if a document has
 *    been waiting for review for more than 48 hours. Promises
 *    made in the UI ("sous 48 h") must be enforced or relaxed.
 *
 * 2. Verification expiry: any provider whose verificationExpiresAt
 *    has passed gets flipped back to isVerified=false. The tasker
 *    must re-upload a fresh document. Required for ongoing trust.
 */
@Injectable()
export class VerificationJobsService {
  private readonly logger = new Logger(VerificationJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** Daily at 10:00 AM Eastern (matches Quebec business hours). */
  @Cron('0 10 * * *', { timeZone: 'America/Toronto' })
  async handleStalePendingVerifications(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stale = await this.prisma.provider.findMany({
      where: {
        licenseDocumentUrl: { not: null },
        isVerified: false,
        updatedAt: { lt: cutoff },
      },
      include: {
        user: { select: { email: true, firstName: true, id: true } },
      },
    });

    if (stale.length === 0) {
      this.logger.log('No stale pending verifications.');
      return;
    }

    this.logger.warn(
      `Found ${stale.length} stale pending verification(s) (>48h).`,
    );

    const adminEmail =
      this.config.get<string>('ADMIN_EMAIL') || 'admin@qemplois.ca';

    for (const provider of stale) {
      await this.audit.log({
        userId: provider.user.id,
        action: 'verification_stale_pending_alert',
        resource: 'provider',
        resourceId: provider.id,
        details: { pendingSince: provider.updatedAt.toISOString() },
      });

      if (provider.user.email) {
        try {
          await this.email.sendStaleVerificationNotice(
            provider.user.email,
            provider.user.firstName,
          );
        } catch (err) {
          this.logger.error(
            `Failed to email tasker ${provider.id}: ${(err as Error).message}`,
          );
        }
      }
    }

    try {
      await this.email.sendAdminStaleDigest(
        adminEmail,
        stale.map((p) => ({
          providerId: p.id,
          taskerName: p.user.firstName ?? p.user.email,
          taskerEmail: p.user.email,
          pendingSince: p.updatedAt.toISOString(),
        })),
      );
    } catch (err) {
      this.logger.error(
        `Failed to email admin digest: ${(err as Error).message}`,
      );
    }
  }

  /** Daily at 9:00 AM Eastern — stale jobs with 0 applications */
  @Cron('0 9 * * *', { timeZone: 'America/Toronto' })
  async handleStaleJobs(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleJobs = await this.prisma.task.findMany({
      where: {
        status: 'open',
        createdAt: { lte: sevenDaysAgo },
        applications: { none: {} },
      },
      include: {
        client: { select: { email: true, firstName: true } },
      },
    });

    if (staleJobs.length === 0) {
      this.logger.log('No stale jobs with 0 applications.');
      return;
    }

    this.logger.log(`Found ${staleJobs.length} stale job(s) with 0 applications.`);
    for (const job of staleJobs) {
      if (job.client.email) {
        await this.email.send({
          to: job.client.email,
          subject: `Votre tâche « ${job.title} » n'a pas reçu de candidature`,
          html: `<p>Bonjour ${job.client.firstName ?? ''},</p>
<p>Votre tâche « ${job.title} » a été publiée il y a plus d'une semaine mais n'a reçu aucune candidature.</p>
<p>Suggestions pour attirer des travailleurs :</p>
<ul>
<li>Vérifier que le prix estimé est compétitif</li>
<li>Ajouter des photos pour donner plus de détails</li>
<li>Élargir le rayon de recherche</li>
</ul>
<p><a href="${this.config.get('FRONTEND_URL', 'http://localhost:5173')}/jobs/${job.id}">Modifier ma tâche</a></p>
<p>— Q-Emplois</p>`,
        });
      }
    }
  }
  /** Daily at 3:00 AM ET — flip expired verifications */
  @Cron('0 3 * * *', { timeZone: 'America/Toronto' })
  async handleVerificationExpiry(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.provider.findMany({
      where: {
        isVerified: true,
        verificationExpiresAt: { lt: now },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (expired.length === 0) {
      this.logger.log('No expired verifications to flip.');
      return;
    }

    this.logger.warn(
      `Expiring verification for ${expired.length} provider(s).`,
    );

    for (const provider of expired) {
      await this.prisma.provider.update({
        where: { id: provider.id },
        data: {
          isVerified: false,
          verificationExpiresAt: null,
          // Keep verifiedAt/verifiedBy as historical record of last approval.
        },
      });

      await this.audit.log({
        userId: provider.user.id,
        action: 'verification_expired',
        resource: 'provider',
        resourceId: provider.id,
        details: {
          previouslyVerifiedAt: provider.verifiedAt?.toISOString() ?? null,
        },
      });

      if (provider.user.email) {
        try {
          await this.email.sendVerificationExpiredNotice(
            provider.user.email,
            provider.user.firstName,
          );
        } catch (err) {
          this.logger.error(
            `Failed to email tasker about expiry ${provider.id}: ${(err as Error).message}`,
          );
        }
      }
    }
  }
}