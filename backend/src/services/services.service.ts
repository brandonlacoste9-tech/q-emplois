import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, language: 'fr' | 'en' = 'fr') {
    const where: any = { isActive: true };
    
    if (category) {
      where.category = category;
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // Localize service names and descriptions based on language preference
    return services.map(service => this.localizeService(service, language));
  }

  async findById(id: string, language: 'fr' | 'en' = 'fr') {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service non trouvé.');
    }

    return this.localizeService(service, language);
  }

  async getCategories() {
    const categories = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map(c => c.category);
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        nameFr: dto.nameFr,
        category: dto.category,
        description: dto.description,
        descriptionFr: dto.descriptionFr,
        basePrice: dto.basePrice,
        priceUnit: dto.priceUnit,
        icon: dto.icon,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service non trouvé.');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service non trouvé.');
    }

    // Soft delete - deactivate instead of hard delete
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private localizeService(service: any, language: 'fr' | 'en') {
    return {
      ...service,
      displayName: language === 'fr' ? service.nameFr : service.name,
      displayDescription: language === 'fr' ? service.descriptionFr : service.description,
    };
  }
}