import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, IsAdmin } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les services disponibles' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrer par catégorie' })
  @ApiResponse({ status: 200, description: 'Liste des services' })
  async findAll(
    @Query('category') category?: string,
    @CurrentUser('languagePreference') language?: string,
  ) {
    return this.servicesService.findAll(category, (language as 'fr' | 'en') || 'fr');
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lister toutes les catégories de services' })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un service par ID' })
  @ApiResponse({ status: 200, description: 'Détails du service' })
  @ApiResponse({ status: 404, description: 'Service non trouvé' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('languagePreference') language?: string,
  ) {
    return this.servicesService.findById(id, (language as 'fr' | 'en') || 'fr');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @IsAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau service (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Service créé' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @IsAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un service (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Service mis à jour' })
  @ApiResponse({ status: 404, description: 'Service non trouvé' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @IsAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un service (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Service supprimé' })
  @ApiResponse({ status: 404, description: 'Service non trouvé' })
  async delete(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }
}