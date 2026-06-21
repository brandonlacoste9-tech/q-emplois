import { Global, Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DataRetentionService } from './services/data-retention.service';
import { NotificationService } from './services/notification.service';
import { TelegramService } from './services/telegram.service';
import { EmailService } from './services/email.service';
import { CreditsModule } from '../credits/credits.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuditModule,
    forwardRef(() => CreditsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard, DataRetentionService, NotificationService, TelegramService, EmailService],
  exports: [
    PrismaModule,
    RedisModule,
    AuditModule,
    DataRetentionService,
    NotificationService,
    TelegramService,
    EmailService,
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CommonModule {}