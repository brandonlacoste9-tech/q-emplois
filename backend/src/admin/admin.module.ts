import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VerificationJobsService } from '../common/services/verification-jobs.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, VerificationJobsService],
})
export class AdminModule {}