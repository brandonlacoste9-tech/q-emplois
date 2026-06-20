import { Injectable, Logger } from '@nestjs/common';

export interface DispatchPayload {
  userId: string;
  email: string;
  firstName?: string | null;
  telegramId?: string | null;
  whatsappNumber?: string | null;

  subject: string;
  htmlBody: string;
  textBody: string;

  /** Optional Telegram deep-link to include in notifications */
  telegramBotLink?: string | null;
  whatsappContact?: string | null;
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

    // 2. Telegram (if linked)
    // The telegram service is injected lazily to avoid circular deps
    // This is handled by the caller passing the telegram service reference
  }

  /** Build HTML with channel links appended */
  appendChannelLinks(htmlBody: string, telegramLink?: string | null, whatsapp?: string | null): string {
    let links = '';
    if (telegramLink) {
      links += `<p style="margin-top:12px;font-size:13px;color:#888;">🔔 <a href="${telegramLink}" style="color:#7FB069;">Connecter Telegram</a> pour recevoir les notifications en temps réel.</p>`;
    }
    if (whatsapp) {
      links += `<p style="margin-top:4px;font-size:13px;color:#888;">💬 WhatsApp: <a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}" style="color:#7FB069;">Envoyer un message</a></p>`;
    }
    if (!links) return htmlBody;
    // Insert before closing </body> or append
    const closeIdx = htmlBody.lastIndexOf('</div>');
    if (closeIdx > -1) {
      return htmlBody.slice(0, closeIdx) + links + htmlBody.slice(closeIdx);
    }
    return htmlBody + links;
  }
}