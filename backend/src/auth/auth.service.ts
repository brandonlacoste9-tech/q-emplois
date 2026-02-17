import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { DataRetentionService } from '../common/services/data-retention.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { UserRole, LanguagePreference } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly dataRetentionService: DataRetentionService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Validate consent for Law 25
    if (!dto.consentGiven) {
      throw new BadRequestException('Le consentement est obligatoire pour utiliser nos services (Loi 25).');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Cette adresse email est déjà utilisée.');
    }

    // Check if phone already exists
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: UserRole.client,
        languagePreference: dto.languagePreference || LanguagePreference.fr,
        consentGiven: true,
        consentDate: new Date(),
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    // Schedule data retention (7 years default)
    await this.dataRetentionService.scheduleDataRetention(user.id);

    // Audit log
    await this.auditService.log({
      userId: user.id,
      action: 'registration',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { consentGiven: true },
    });

    // Generate tokens
    return this.generateTokens(user);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Log failed attempt
      await this.auditService.log({
        userId: user.id,
        action: 'login_failed',
        resource: 'user',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // Update last access
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastAccessAt: new Date() },
    });

    // Audit log
    await this.auditService.log({
      userId: user.id,
      action: 'login_success',
      resource: 'user',
      ipAddress,
      userAgent,
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Token invalide.');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré.');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.auditService.log({
      userId,
      action: 'logout',
      resource: 'user',
    });
  }

  async linkTelegram(userId: string, telegramId: string): Promise<void> {
    // Check if telegram ID already linked
    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Ce compte Telegram est déjà lié à un autre utilisateur.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId },
    });

    await this.auditService.log({
      userId,
      action: 'telegram_linked',
      resource: 'user',
      details: { telegramId },
    });
  }

  async linkWhatsapp(userId: string, whatsappId: string): Promise<void> {
    // Check if whatsapp ID already linked
    const existing = await this.prisma.user.findUnique({
      where: { whatsappId },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Ce compte WhatsApp est déjà lié à un autre utilisateur.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { whatsappId },
    });

    await this.auditService.log({
      userId,
      action: 'whatsapp_linked',
      resource: 'user',
      details: { whatsappId },
    });
  }

  private generateTokens(user: any): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '24h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        languagePreference: user.languagePreference,
      },
    };
  }
}