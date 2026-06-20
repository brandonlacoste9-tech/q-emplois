import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CreditsModule } from '../credits/credits.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [CreditsModule, NotificationsModule, forwardRef(() => WhatsAppModule)],
  controllers: [JobsController],
  providers: [JobsService, NotificationService],
  exports: [JobsService],
})
export class JobsModule {}