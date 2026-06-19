import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { geocodeQuebecAddress } from '../common/utils/geocode';

export interface UpsertProviderDto {
  serviceTypes: string[];
  hourlyRate?: number;
  serviceRadiusKm?: number;
  licenseNumber?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
}

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
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
        locationAddress: dto.locationAddress,
        locationLat,
        locationLng,
      },
      update: {
        serviceTypes: dto.serviceTypes,
        hourlyRate: dto.hourlyRate,
        serviceRadiusKm: dto.serviceRadiusKm,
        licenseNumber: dto.licenseNumber,
        locationAddress: dto.locationAddress,
        locationLat,
        locationLng,
      },
    });

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
}