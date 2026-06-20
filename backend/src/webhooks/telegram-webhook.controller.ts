import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { TelegramService } from '../common/services/telegram.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Public()
  @Post('telegram')
  @ApiExcludeEndpoint()
  async handleTelegramUpdate(@Body() update: Record<string, unknown>) {
    this.logger.debug(`Telegram webhook update received`);
    return this.telegramService.processUpdate(update);
  }
}