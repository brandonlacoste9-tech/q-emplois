import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: SendEmailOptions): Promise<boolean> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const from =
      this.configService.get<string>('EMAIL_FROM') ||
      'Q-Emplois <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.warn(`Email (no RESEND_API_KEY): to=${options.to} subject=${options.subject}`);
      this.logger.log(options.text ?? options.html.replace(/<[^>]+>/g, ' ').slice(0, 500));
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Resend error ${res.status}: ${body}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe — Q-Emplois',
      html: `
        <p>Bonjour,</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valide 1 h) :</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce courriel.</p>
        <p>— L'équipe Q-Emplois</p>
      `,
      text: `Réinitialisez votre mot de passe : ${resetUrl}`,
    });
  }

  async sendNewApplication(
    clientEmail: string,
    taskTitle: string,
    taskerName: string,
    jobUrl: string,
    pendingCount: number,
  ): Promise<void> {
    await this.send({
      to: clientEmail,
      subject: `Nouvelle candidature pour « ${taskTitle} »`,
      html: `
        <p>Bonjour,</p>
        <p><strong>${taskerName}</strong> a postulé pour votre tâche « ${taskTitle} ».</p>
        <p>Vous avez maintenant <strong>${pendingCount}</strong> candidature(s) en attente.</p>
        <p><a href="${jobUrl}">Voir les candidatures et choisir un travailleur</a></p>
        <p>— Q-Emplois</p>
      `,
      text: `${taskerName} a postulé pour « ${taskTitle} ». ${pendingCount} candidature(s). ${jobUrl}`,
    });
  }

  async sendTaskerVerified(to: string, firstName?: string | null): Promise<void> {
    await this.send({
      to,
      subject: 'Profil vérifié — Q-Emplois',
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Votre pièce d'identité a été vérifiée. Le badge <strong>Vérifié</strong> apparaît sur votre profil.</p>
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
    });
  }

  async sendTaskerRejected(
    to: string,
    firstName?: string | null,
    reason?: string,
  ): Promise<void> {
    const reasonBlock = reason
      ? `<p><strong>Motif :</strong> ${reason}</p>`
      : `<p>Aucun motif précis n'a été fourni.</p>`;
    await this.send({
      to,
      subject: 'Vérification refusée — Q-Emplois',
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Votre pièce d'identité n'a pas pu être vérifiée. Vous pouvez téléverser un nouveau document sur votre profil pour relancer la vérification.</p>
        ${reasonBlock}
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
    });
  }

  async sendStaleVerificationNotice(
    to: string,
    firstName?: string | null,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Vérification en cours — Q-Emplois',
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Votre pièce d'identité est toujours en cours de vérification. Notre équipe revient vers vous sous 48 heures ouvrables.</p>
        <p>Si vous n'avez rien reçu d'ici là, contactez-nous et nous prioriserons votre dossier.</p>
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
    });
  }

  async sendAdminStaleDigest(
    to: string,
    stale: Array<{
      providerId: string;
      taskerName: string;
      taskerEmail: string;
      pendingSince: string;
    }>,
  ): Promise<void> {
    const rows = stale
      .map(
        (s) => `<li><strong>${s.taskerName}</strong> (${s.taskerEmail}) — en attente depuis ${new Date(s.pendingSince).toLocaleDateString('fr-CA')}</li>`,
      )
      .join('');
    await this.send({
      to,
      subject: `Vérifications en attente >48h — ${stale.length} dossier(s)`,
      html: `
        <p>Bonjour,</p>
        <p>Les pièces d'identité suivantes attendent une vérification depuis plus de 48 heures :</p>
        <ul>${rows}</ul>
        <p>— Q-Emplois</p>
      `,
    });
  }

  async sendVerificationExpiredNotice(
    to: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';
    await this.send({
      to,
      subject: 'Votre vérification a expiré — Q-Emplois',
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Votre vérification Q-Emplois a expiré (validité de 12 mois). Pour continuer à postuler aux tâches, téléversez une nouvelle pièce d'identité sur votre profil.</p>
        <p><a href="${frontendUrl}/profile">Mettre à jour mon profil</a></p>
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
    });
  }

  async sendVerificationReceived(
    to: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';
    await this.send({
      to,
      subject: 'Pièce d\'identité reçue — Q-Emplois',
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Nous avons bien reçu votre pièce d'identité. Notre équipe l'examine habituellement <strong>sous 48 heures ouvrables</strong>.</p>
        <p>Vous recevrez un courriel dès que votre profil est vérifié.</p>
        <p><a href="${frontendUrl}/profile">Voir mon profil</a></p>
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
      text: `Pièce d'identité reçue. Vérification sous 48 h. ${frontendUrl}/profile`,
    });
  }

  async sendCreditPurchaseConfirmation(
    to: string,
    firstName: string | null | undefined,
    credits: number,
    amountCad: number,
    newBalance: number,
    packLabel: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const formattedAmount = amountCad.toFixed(2);
    await this.send({
      to,
      subject: `${credits} crédits ajoutés — Q-Emplois`,
      html: `
        <p>Bonjour ${firstName ?? ''},</p>
        <p>Merci pour votre achat! <strong>${credits} crédit${credits > 1 ? 's' : ''}</strong> (${packLabel}) ont été ajoutés à votre compte.</p>
        <p>Montant payé : <strong>${formattedAmount} $ CAD</strong></p>
        <p>Solde actuel : <strong>${newBalance} crédit${newBalance > 1 ? 's' : ''}</strong></p>
        <p>1 crédit = 1 candidature à une tâche (remboursé si vous n'êtes pas retenu).</p>
        <p><a href="${frontendUrl}/jobs">Voir les tâches disponibles</a> · <a href="${frontendUrl}/credits">Mes crédits</a></p>
        <p>— L'équipe Q-Emplois</p>
        ${this.channelLinksSection()}
      `,
      text: `Achat confirmé: ${credits} crédits (${formattedAmount} $ CAD). Solde: ${newBalance}. ${frontendUrl}/jobs`,
    });
  }

  async sendVerificationPendingAdmin(
    adminEmail: string,
    taskerName: string,
    taskerEmail: string,
    adminUrl: string,
  ): Promise<void> {
    await this.send({
      to: adminEmail,
      subject: `Vérification en attente — ${taskerName}`,
      html: `
        <p>Bonjour,</p>
        <p><strong>${taskerName}</strong> (${taskerEmail}) a téléversé une pièce d'identité.</p>
        <p><a href="${adminUrl}">Examiner la file de vérification</a></p>
        <p>— Q-Emplois</p>
      `,
      text: `${taskerName} (${taskerEmail}) attend une vérification. ${adminUrl}`,
    });
  }

  private channelLinksSection(): string {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) return '';
    return `<p style="margin-top:16px;font-size:13px;color:#999;">🔔 <a href="https://t.me/${botUsername}" style="color:#7FB069;text-decoration:none;">Connecter Telegram</a> pour recevoir vos notifications en temps réel.</p>`;
  }
}
