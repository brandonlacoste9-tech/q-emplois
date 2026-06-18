import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthCallbackController } from './auth-callback.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ProvidersModule } from '../providers/providers.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    ProvidersModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthCallbackController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}