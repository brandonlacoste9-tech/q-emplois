/**
 * Auth Callback Controller — platform linking for WhatsApp/Telegram bots
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { REDIS_CLIENT, RedisClient } from '../common/redis/redis.module';
import { PrismaService } from '../common/prisma/prisma.service';

interface LinkPlatformDto {
  token: string;
  platform: 'whatsapp' | 'telegram' | 'signal';
  platformUserId: string;
  platformUsername?: string;
  userId: string;
}

interface WebhookPayload {
  event: 'auth.linked' | 'auth.failed';
  timestamp: string;
  payload: {
    token: string;
    userId: string;
    platform: string;
    platformUserId: string;
    metadata?: Record<string, unknown>;
  };
}

@Controller('auth')
export class AuthCallbackController {
  private readonly logger = new Logger(AuthCallbackController.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly prisma: PrismaService,
  ) {}

  @Post('link-platform')
  @HttpCode(HttpStatus.OK)
  async linkPlatform(
    @Body() dto: LinkPlatformDto,
    @Headers('authorization') authHeader: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.validateAuthHeader(authHeader)) {
      throw new UnauthorizedException('Invalid or missing authorization');
    }

    const session = await this.getSession(dto.token);
    if (!session) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (session.user_id !== dto.userId) {
      throw new BadRequestException('Token does not match user');
    }

    await this.storePlatformLink(dto);

    if (dto.platform === 'whatsapp') {
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { whatsappId: dto.platformUserId },
      });
    } else if (dto.platform === 'telegram') {
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { telegramId: dto.platformUserId },
      });
    }

    await this.updateSession(dto.token, {
      status: 'linked',
      linked_user_id: dto.platformUserId,
      linked_platform: dto.platform,
      linked_at: new Date().toISOString(),
      linked_username: dto.platformUsername,
    });

    await this.fireWebhook({
      event: 'auth.linked',
      timestamp: new Date().toISOString(),
      payload: {
        token: dto.token,
        userId: dto.userId,
        platform: dto.platform,
        platformUserId: dto.platformUserId,
        metadata: {
          username: dto.platformUsername,
          linked_at: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Linked ${dto.platform}:${dto.platformUserId} to user ${dto.userId}`);

    return {
      success: true,
      message: `Successfully linked ${dto.platform} account`,
    };
  }

  @Post('verify-link')
  @HttpCode(HttpStatus.OK)
  async verifyLink(
    @Body() dto: { platform: string; platformUserId: string },
  ): Promise<{ linked: boolean; userId?: string }> {
    const linkKey = `auth:link:${dto.platform}:${dto.platformUserId}`;
    const linkData = await this.redis.get(linkKey);

    if (!linkData) {
      return { linked: false };
    }

    const link = JSON.parse(linkData);
    return {
      linked: true,
      userId: link.user_id,
    };
  }

  @Post('create-session')
  @HttpCode(HttpStatus.OK)
  async createSession(
    @Body() dto: { userId: string; platform: string },
  ): Promise<{ token: string; expiresIn: number }> {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionKey = `auth:session:${token}`;
    const ttl = 86400;

    await this.redis.setex(
      sessionKey,
      ttl,
      JSON.stringify({
        user_id: dto.userId,
        platform: dto.platform,
        status: 'pending',
        created_at: new Date().toISOString(),
      }),
    );

    return { token, expiresIn: ttl };
  }

  private validateAuthHeader(authHeader: string): boolean {
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    const jwtSecret = this.configService.get('JWT_SECRET');
    if (!jwtSecret) return true;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const signature = crypto
        .createHmac('sha256', jwtSecret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url');
      return signature === parts[2];
    } catch {
      return false;
    }
  }

  private async getSession(token: string): Promise<Record<string, unknown> | null> {
    const data = await this.redis.get(`auth:session:${token}`);
    return data ? JSON.parse(data) : null;
  }

  private async updateSession(token: string, updates: Record<string, unknown>): Promise<void> {
    const sessionKey = `auth:session:${token}`;
    const data = await this.redis.get(sessionKey);
    if (!data) return;

    const session = JSON.parse(data);
    Object.assign(session, updates, { updated_at: new Date().toISOString() });
    const ttl = await this.redis.ttl(sessionKey);
    await this.redis.setex(sessionKey, ttl > 0 ? ttl : 86400, JSON.stringify(session));
  }

  private async storePlatformLink(dto: LinkPlatformDto): Promise<void> {
    const linkKey = `auth:link:${dto.platform}:${dto.platformUserId}`;
    const linkData = {
      user_id: dto.userId,
      token: dto.token,
      linked_at: new Date().toISOString(),
      username: dto.platformUsername,
    };

    await this.redis.setex(linkKey, 30 * 86400, JSON.stringify(linkData));
    await this.redis.setex(
      `auth:user:${dto.userId}:${dto.platform}`,
      30 * 86400,
      dto.platformUserId,
    );
  }

  private async fireWebhook(payload: WebhookPayload): Promise<void> {
    const webhookUrl = this.configService.get(
      'WEBHOOK_URL',
      'https://api.qemplois.ca/api/webhooks/auth',
    );
    const webhookSecret = this.configService.get('WEBHOOK_SECRET', '');

    try {
      const signature = crypto
        .createHmac('sha256', webhookSecret || 'dev-secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-QEmplois-Signature': signature,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error('Failed to fire webhook:', error);
    }
  }
}