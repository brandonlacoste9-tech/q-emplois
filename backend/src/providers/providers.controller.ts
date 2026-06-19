import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService, UpsertProviderDto } from './providers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Rechercher des prestataires' })
  search(@Query('serviceType') serviceType?: string) {
    return this.providersService.search(serviceType);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil prestataire' })
  me(@CurrentUser('userId') userId: string) {
    return this.providersService.findByUserId(userId);
  }

  @Get(':userId/public')
  @ApiOperation({ summary: 'Profil public d\'un travailleur' })
  getPublic(@Param('userId') userId: string) {
    return this.providersService.getPublicProfile(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour mon profil prestataire' })
  upsert(@CurrentUser('userId') userId: string, @Body() dto: UpsertProviderDto) {
    return this.providersService.upsertForUser(userId, dto);
  }
}
