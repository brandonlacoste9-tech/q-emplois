import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VerificationJobsService } from '../common/services/verification-jobs.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [AdminController],
  providers: [AdminService, VerificationJobsService],
})
export class AdminModule {}