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
      `,
    });
  }
}
