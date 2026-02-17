import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DataRetentionService } from './services/data-retention.service';

@Module({
  imports: [PrismaModule, RedisModule, AuditModule],
  providers: [JwtAuthGuard, RolesGuard, DataRetentionService],
  exports: [PrismaModule, RedisModule, AuditModule, DataRetentionService],
})
export class CommonModule {}