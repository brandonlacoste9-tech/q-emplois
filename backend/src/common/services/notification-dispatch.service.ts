import { Injectable, Logger } from '@nestjs/common';

export interface DispatchPayload {
  userId: string;
  email: string;
  firstName?: string | null;
  telegramId?: string | null;

  subject: string;
  htmlBody: string;
  textBody: string;

  /** Optional Telegram deep-link to include in email notifications */
  telegramBotLink?: string | null;
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  async dispatch(
    payload: DispatchPayload,
    emailFn: (to: string, html: string) => Promise<void>,
  ): Promise<void> {
    // 1. Always send email (primary channel)
    try {
      await emailFn(payload.email, payload.htmlBody);
    } catch (err) {
      this.logger.error(`Email dispatch failed for ${payload.email}:`, err);
    }

    // 2. Telegram is handled separately via TelegramService (injected by callers)
  }

  /** Build HTML with a Telegram connect CTA appended (for email notifications to unlinked users) */
  appendTelegramCta(htmlBody: string, telegramLink?: string | null): string {
    if (!telegramLink) return htmlBody;
    const cta = `<p style="margin-top:12px;font-size:13px;color:#888;">🔔 <a href="${telegramLink}" style="color:#7FB069;">Connecter Telegram</a> pour recevoir les notifications en temps réel.</p>`;
    const closeIdx = htmlBody.lastIndexOf('</div>');
    if (closeIdx > -1) {
      return htmlBody.slice(0, closeIdx) + cta + htmlBody.slice(closeIdx);
    }
    return htmlBody + cta;
  }
}