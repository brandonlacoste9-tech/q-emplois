import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.isConfigured = true;
      this.logger.log(`Email service configured using SMTP: ${host}:${port}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Email service is NOT configured. SMTP credentials are missing. Emails will be logged to the console.',
      );
    }
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    const from = this.configService.get<string>('EMAIL_FROM') ?? '"Q-Emplois" <info@quebec-emplois.ca>';

    if (!this.isConfigured || !this.transporter) {
      this.logger.debug('--- EMAIL DISPATCH (SIMULATION) ---');
      this.logger.debug(`To: ${to}`);
      this.logger.debug(`From: ${from}`);
      this.logger.debug(`Subject: ${subject}`);
      this.logger.debug(`HTML Body: \n${htmlContent}`);
      this.logger.debug('-----------------------------------');
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }
}
