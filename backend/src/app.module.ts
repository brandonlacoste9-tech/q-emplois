import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ProvidersModule } from './providers/providers.module';
import { ChatModule } from './chat/chat.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './common/audit/audit.module';
import { JobsModule } from './jobs/jobs.module';
import { CreditsModule } from './credits/credits.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';
import { EmailModule } from './common/email/email.module';
import { StorageModule } from './common/storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { GeoModule } from './geo/geo.module';
import { MediaModule } from './media/media.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuditModule,
    EmailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    ProvidersModule,
    ChatModule,
    WhatsAppModule,
    CommonModule,
    JobsModule,
    CreditsModule,
    DashboardModule,
    NotificationsModule,
    ProfileModule,
    HealthModule,
    ReviewsModule,
    AdminModule,
    GeoModule,
    MediaModule,
    WebhooksModule,
  ],
})
export class AppModule {}