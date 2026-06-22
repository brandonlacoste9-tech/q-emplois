import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const DEFAULT_AVAILABILITY = {
  monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
  saturday: { isAvailable: false },
  sunday: { isAvailable: false },
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getTradesmanProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    const provider = user.provider;
    let availability = DEFAULT_AVAILABILITY;
    if (provider?.availabilityJson) {
      try {
        availability = JSON.parse(provider.availabilityJson);
      } catch {
        availability = DEFAULT_AVAILABILITY;
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      avatar: user.avatarUrl ?? undefined,
      telegramId: user.telegramId ?? undefined,
      telegramBotLink: this.configService.get('TELEGRAM_BOT_USERNAME')
        ? `https://t.me/${this.configService.get('TELEGRAM_BOT_USERNAME')}?start=link_${user.id}`
        : undefined,
      isVerified: provider?.isVerified ?? false,
      verificationExpiresAt: provider?.verificationExpiresAt?.toISOString() ?? null,
      rejectedAt: provider?.rejectedAt?.toISOString() ?? null,
      rejectionReason: provider?.rejectionReason ?? null,
      rating: provider?.rating ?? 0,
      reviewCount: provider?.reviewCount ?? 0,
      createdAt: user.createdAt.toISOString(),
      serviceTypes: provider?.serviceTypes ?? [],
      hourlyRate: provider?.hourlyRate ? Number(provider.hourlyRate) : 0,
      serviceRadius: provider?.serviceRadiusKm ?? 25,
      licenseNumber: provider?.licenseNumber ?? undefined,
      licenseDocument: provider?.licenseDocumentUrl ?? undefined,
      address: provider?.locationAddress
        ? {
            street: provider.locationAddress,
            city: '',
            postalCode: '',
            coordinates:
              provider.locationLat != null && provider.locationLng != null
                ? {
                    lat: Number(provider.locationLat),
                    lng: Number(provider.locationLng),
                  }
                : undefined,
          }
        : undefined,
      availability,
      isTaskerEnabled: (provider?.serviceTypes?.length ?? 0) > 0,
    };
  }

  async updateNotifications(
    userId: string,
    body: {
      telegramId?: string | null;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    const updateData: Record<string, unknown> = {};
    if (body.telegramId !== undefined) updateData.telegramId = body.telegramId || null;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: updateData });
    }

    return { success: true };
  }
}