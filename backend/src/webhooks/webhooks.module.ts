import { Module } from '@nestjs/common';
import { TelegramWebhookController } from './telegram-webhook.controller';
// TelegramService is provided globally by CommonModule — no need to re-provide it here.

@Module({
  controllers: [TelegramWebhookController],
})
export class WebhooksModule {}