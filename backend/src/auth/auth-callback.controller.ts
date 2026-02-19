/**
 * Auth Callback Controller — NestJS
 * Fix 3: Complete auth flow endpoint for platform linking
 * 
 * POST /api/auth/link-platform
 * Called by frontend after user authenticates and wants to link chat platform
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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as redis from 'redis';

interface LinkPlatformDto {
  token: string;
  platform: 'whatsapp' | 'telegram' | 'signal';
  platformUserId: string;
  platformUsername?: string;
  userId: string;  // Q-Emplois user ID
}

interface WebhookPayload {
  event: 'auth.linked' | 'auth.failed';
  timestamp: string;
  payload: {
    token: string;
    userId: string;
    platform: string;
    platformUserId: string;
    metadata?: Record<string, any>;
  };
}

@Controller('api/auth')
export class AuthCallbackController {
  private readonly logger = new Logger(AuthCallbackController.name);
  private redis: redis.RedisClientType;

  constructor(private configService: ConfigService) {
    // Initialize Redis client
    this.redis = redis.createClient({
      url: this.configService.get('REDIS_URL', 'redis://localhost:6379/0'),
    });
    this.redis.connect().catch(err => {
      this.logger.error('Redis connection failed:', err);
    });
  }

  @Post('link-platform')
  @HttpCode(HttpStatus.OK)
  async linkPlatform(
    @Body() dto: LinkPlatformDto,
    @Headers('authorization') authHeader: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate JWT from auth header
    if (!this.validateAuthHeader(authHeader)) {
      throw new UnauthorizedException('Invalid or missing authorization');
    }

    // Validate token exists in Redis
    const session = await this.getSession(dto.token);
    if (!session) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Validate session matches
    if (session.user_id !== dto.userId) {
      throw new BadRequestException('Token does not match user');
    }

    try {
      // Store the platform link in Redis
      await this.storePlatformLink(dto);

      // Update session status
      await this.updateSession(dto.token, {
        status: 'linked',
        linked_user_id: dto.platformUserId,
        linked_platform: dto.platform,
        linked_at: new Date().toISOString(),
        linked_username: dto.platformUsername,
      });

      // Fire webhook to notify bot/skill
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

    } catch (error) {
      this.logger.error('Failed to link platform:', error);
      throw new BadRequestException('Failed to link platform account');
    }
  }

  @Post('unlink-platform')
  @HttpCode(HttpStatus.OK)
  async unlinkPlatform(
    @Body() dto: Omit<LinkPlatformDto, 'token'> & { token?: string },
    @Headers('authorization') authHeader: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.validateAuthHeader(authHeader)) {
      throw new UnauthorizedException('Invalid or missing authorization');
    }

    const linkKey = `auth:link:${dto.platform}:${dto.platformUserId}`;
    const linkData = await this.redis.get(linkKey);

    if (!linkData) {
      return {
        success: false,
        message: 'Platform not linked',
      };
    }

    await this.redis.del(linkKey);

    this.logger.log(`Unlinked ${dto.platform}:${dto.platformUserId}`);

    return {
      success: true,
      message: `Successfully unlinked ${dto.platform} account`,
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

  // ── Private helpers ────────────────────────────────────────────────────────

  private validateAuthHeader(authHeader: string): boolean {
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);
    const jwtSecret = this.configService.get('JWT_SECRET');

    if (!jwtSecret) {
      this.logger.warn('JWT_SECRET not configured, skipping validation');
      return true; // Dev mode
    }

    try {
      // Simple JWT validation (in production, use JwtService)
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

  private async getSession(token: string): Promise<any | null> {
    const sessionKey = `auth:session:${token}`;
    const data = await this.redis.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  private async updateSession(token: string, updates: Record<string, any>): Promise<void> {
    const sessionKey = `auth:session:${token}`;
    const data = await this.redis.get(sessionKey);
    
    if (!data) return;

    const session = JSON.parse(data);
    Object.assign(session, updates);
    session.updated_at = new Date().toISOString();

    // Keep existing TTL
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

    // Store for 30 days
    await this.redis.setex(linkKey, 30 * 86400, JSON.stringify(linkData));

    // Also store reverse lookup
    const reverseKey = `auth:user:${dto.userId}:${dto.platform}`;
    await this.redis.setex(reverseKey, 30 * 86400, dto.platformUserId);
  }

  private async fireWebhook(payload: WebhookPayload): Promise<void> {
    const webhookUrl = this.configService.get('WEBHOOK_URL', 'https://api.qemplois.ca/api/webhooks/auth');
    const webhookSecret = this.configService.get('WEBHOOK_SECRET', '');

    try {
      const signature = this.signWebhookPayload(payload, webhookSecret);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-QEmplois-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to fire webhook:', error);
      // Don't throw - webhook failure shouldn't break the flow
    }
  }

  private signWebhookPayload(payload: WebhookPayload, secret: string): string {
    const data = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret || 'dev-secret')
      .update(data)
      .digest('hex');
  }
}
