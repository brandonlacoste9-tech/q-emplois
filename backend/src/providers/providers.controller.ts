import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService, UpsertProviderDto } from './providers.service';
import { UploadLicenseDocumentDto } from './dto/license-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Parcourir les travailleurs' })
  search(
    @Query('serviceType') serviceType?: string,
    @Query('city') city?: string,
    @Query('postalCode') postalCode?: string,
  ) {
    return this.providersService.search(serviceType, city, postalCode);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil prestataire' })
  me(@CurrentUser('userId') userId: string) {
    return this.providersService.findByUserId(userId);
  }

  @Get(':userId/public')
  @Public()
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

  @Post('me/license-document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Téléverser une pièce d\'identité' })
  uploadLicense(
    @CurrentUser('userId') userId: string,
    @Body() dto: UploadLicenseDocumentDto,
  ) {
    return this.providersService.uploadLicenseDocument(userId, dto);
  }
}
