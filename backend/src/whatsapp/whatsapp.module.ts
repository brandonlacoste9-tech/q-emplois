import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsappTaskAlertsService } from './whatsapp-task-alerts.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [forwardRef(() => JobsModule)],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsappTaskAlertsService],
  exports: [WhatsAppService, WhatsappTaskAlertsService],
})
export class WhatsAppModule {}
