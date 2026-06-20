import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { DataRetentionService } from '../common/services/data-retention.service';
import { RegisterDto, LoginDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { UserRole, LanguagePreference } from '@prisma/client';
import { ProvidersService } from '../providers/providers.service';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly dataRetentionService: DataRetentionService,
    private readonly providersService: ProvidersService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Validate consent for Law 25
    if (!dto.consentGiven) {
      throw new BadRequestException('Le consentement est obligatoire pour utiliser nos services (Loi 25).');
    }

    // Check if email already exists
    let existingUser;
    try {
      existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
    } catch (error) {
      this.logger.error('Database unavailable during registration', error);
      throw new ServiceUnavailableException(
        'Service temporairement indisponible. La base de données n\'est pas connectée.',
      );
    }

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

    // Create user — taskers (with serviceTypes) become providers; others stay clients
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: dto.serviceTypes?.length ? UserRole.provider : UserRole.client,
        languagePreference: dto.languagePreference || LanguagePreference.fr,
        consentGiven: true,
        consentDate: new Date(),
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    if (dto.serviceTypes?.length) {
      await this.providersService.upsertForUser(user.id, {
        serviceTypes: dto.serviceTypes,
      });
    }

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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      return { message: 'Si ce courriel existe, un lien de réinitialisation a été envoyé.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordReset(user.email, resetUrl);
    this.logger.log(`Password reset requested for ${user.email}`);

    await this.auditService.log({
      userId: user.id,
      action: 'password_reset_requested',
      resource: 'user',
    });

    return { message: 'Si ce courriel existe, un lien de réinitialisation a été envoyé.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date() || record.user.deletedAt) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    await this.auditService.log({
      userId: record.userId,
      action: 'password_reset_completed',
      resource: 'user',
    });

    return { message: 'Mot de passe mis à jour avec succès.' };
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