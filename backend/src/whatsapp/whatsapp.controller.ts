import { Controller, Post, Body, Get, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { WhatsappTaskAlertsService } from './whatsapp-task-alerts.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly taskAlerts: WhatsappTaskAlertsService,
    private configService: ConfigService,
  ) {}

  /**
   * Twilio webhook for incoming WhatsApp messages
   */
  @Post('webhook')
  @ApiOperation({ summary: 'Receive WhatsApp messages from Twilio' })
  @ApiResponse({ status: 200, description: 'Message processed' })
  async receiveMessage(@Body() body: Record<string, string>): Promise<string> {
    const from = body.From;
    const messageBody = body.Body ?? '';
    const profileName = body.ProfileName || 'Utilisateur';

    this.logger.debug(`Received WhatsApp message from ${from}`);

    const taskReply = await this.taskAlerts.handleTaskerReply(from, messageBody, profileName);
    const response =
      taskReply ?? this.whatsAppService.processGeneralMessage(messageBody, profileName);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Message>${this.escapeXml(response)}</Message>
</Response>`;
  }

  /**
   * Test endpoint to send a message
   */
  @Post('send')
  @ApiOperation({ summary: 'Send WhatsApp message (test)' })
  async sendMessage(
    @Body() data: { to: string; message: string },
    @Headers('authorization') auth: string,
  ): Promise<{ success: boolean }> {
    // Simple auth check
    const apiKey = this.configService.get<string>('API_KEY');
    if (auth !== `Bearer ${apiKey}`) {
      throw new UnauthorizedException();
    }

    await this.whatsAppService.sendMessage(data.to, data.message);
    return { success: true };
  }

  /**
   * Get sandbox instructions for testing
   */
  @Get('setup')
  @ApiOperation({ summary: 'Get WhatsApp sandbox setup instructions' })
  getSetupInstructions(): { message: string } {
    return { message: this.whatsAppService.getSandboxInstructions() };
  }

  /**
   * Health check
   */
  @Get('health')
  @ApiOperation({ summary: 'WhatsApp service health check' })
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Escape XML for TwiML response
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
