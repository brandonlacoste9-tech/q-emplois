import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        provider: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Remove sensitive data
    const { passwordHash, emailEncrypted, phoneEncrypted, ...result } = user;
    return result;
  }

  async update(userId: string, dto: UpdateUserDto) {
    // Check if email is being changed and if it's already in use
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }
    }

    // Check if phone is being changed and if it's already in use
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        languagePreference: dto.languagePreference,
        updatedAt: new Date(),
      },
      include: {
        provider: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'profile_update',
      resource: 'user',
      resourceId: userId,
      details: { ...dto },
    });

    // Remove sensitive data
    const { passwordHash, emailEncrypted, phoneEncrypted, ...result } = user;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ForbiddenException('Ancien mot de passe incorrect.');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
    });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  // Law 25 - Right to deletion
  async requestDataDeletion(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Schedule immediate deletion (0 days retention)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dataRetentionDate: new Date(), // Immediate deletion
      },
    });

    await this.auditService.log({
      userId,
      action: 'deletion_requested',
      resource: 'user',
      resourceId: userId,
      details: { reason },
    });

    return {
      message: 'Votre demande de suppression a été enregistrée. Vos données seront supprimées conformément à la Loi 25.',
    };
  }

  async getUserAuditLogs(userId: string) {
    return this.auditService.getUserLogs(userId, 100);
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        provider: true,
        creditWallet: { include: { transactions: { take: 500, orderBy: { createdAt: 'desc' } } } },
        postedTasks: { take: 100, orderBy: { createdAt: 'desc' } },
        platformNotifications: { take: 200, orderBy: { createdAt: 'desc' } },
        sentMessages: { take: 200, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      provider: user.provider ? {
        serviceTypes: user.provider.serviceTypes,
        isVerified: user.provider.isVerified,
        rating: user.provider.rating,
      } : null,
      wallet: user.creditWallet ? {
        balance: user.creditWallet.balance,
        transactions: user.creditWallet.transactions.map((t) => ({
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt,
        })),
      } : null,
      tasks: user.postedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  }
}