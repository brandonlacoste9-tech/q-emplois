import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { StorageService } from '../common/storage/storage.service';
import { geocodeQuebecAddress } from '../common/utils/geocode';
import { phoneToWhatsappId } from '../common/utils/phone';

export interface UpsertProviderDto {
  serviceTypes: string[];
  hourlyRate?: number;
  serviceRadiusKm?: number;
  licenseNumber?: string;
  licenseDocumentUrl?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  whatsappNotifyEnabled?: boolean;
}

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
    private readonly storageService: StorageService,
  ) {}

  async upsertForUser(userId: string, dto: UpsertProviderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    let locationLat = dto.locationLat;
    let locationLng = dto.locationLng;
    if ((locationLat == null || locationLng == null) && dto.locationAddress) {
      const coords = geocodeQuebecAddress(dto.locationAddress);
      if (coords) {
        locationLat = coords.lat;
        locationLng = coords.lng;
      }
    }

    const provider = await this.prisma.provider.upsert({
      where: { userId },
      create: {
        userId,
        serviceTypes: dto.serviceTypes,
        hourlyRate: dto.hourlyRate,
        serviceRadiusKm: dto.serviceRadiusKm ?? 25,
        licenseNumber: dto.licenseNumber,
        licenseDocumentUrl: dto.licenseDocumentUrl,
        locationAddress: dto.locationAddress,
        locationLat,
        locationLng,
        whatsappNotifyEnabled: dto.whatsappNotifyEnabled ?? false,
      },
      update: {
        serviceTypes: dto.serviceTypes,
        hourlyRate: dto.hourlyRate,
        serviceRadiusKm: dto.serviceRadiusKm,
        licenseNumber: dto.licenseNumber,
        licenseDocumentUrl: dto.licenseDocumentUrl,
        locationAddress: dto.locationAddress,
        locationLat,
        locationLng,
        ...(dto.whatsappNotifyEnabled !== undefined
          ? { whatsappNotifyEnabled: dto.whatsappNotifyEnabled }
          : {}),
      },
    });

    if (dto.whatsappNotifyEnabled && user.phone) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { whatsappId: phoneToWhatsappId(user.phone) },
        });
      } catch {
        // invalid phone — opt-in stays on profile but alerts need valid phone
      }
    }

    await this.creditsService.maybeGrantFoundingTaskerBonus(userId);

    return provider;
  }

  async findByUserId(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
    if (!provider) throw new NotFoundException('Profil prestataire non trouvé.');
    return provider;
  }

  async search(serviceType?: string) {
    return this.prisma.provider.findMany({
      where: {
        ...(serviceType ? { serviceTypes: { has: serviceType } } : {}),
        isVerified: true,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      take: 20,
    });
  }

  async getPublicProfile(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
    });
    if (!provider) throw new NotFoundException('Profil prestataire non trouvé.');

    return {
      id: provider.user.id,
      firstName: provider.user.firstName,
      lastName: provider.user.lastName,
      serviceTypes: provider.serviceTypes,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      isVerified: provider.isVerified,
      hourlyRate: provider.hourlyRate ? Number(provider.hourlyRate) : undefined,
      city: provider.locationAddress,
      memberSince: provider.user.createdAt.toISOString(),
    };
  }

  async uploadLicenseDocument(
    userId: string,
    dto: { data: string; filename: string; contentType: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    let buffer: Buffer;
    let contentType = dto.contentType || 'application/octet-stream';
    if (dto.data.startsWith('data:')) {
      const match = dto.data.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new BadRequestException('Format de fichier invalide.');
      contentType = match[1];
      buffer = Buffer.from(match[2], 'base64');
    } else {
      buffer = Buffer.from(dto.data, 'base64');
    }

    const url = await this.storageService.uploadProviderDocument(
      userId,
      buffer,
      dto.filename || 'document',
      contentType,
    );

    await this.prisma.provider.upsert({
      where: { userId },
      create: {
        userId,
        serviceTypes: [],
        licenseDocumentUrl: url,
        isVerified: false,
      },
      update: {
        licenseDocumentUrl: url,
        isVerified: false,
        verifiedAt: null,
      },
    });

    return { licenseDocumentUrl: url };
  }
}