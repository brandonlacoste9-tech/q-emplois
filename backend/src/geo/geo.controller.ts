import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Recherche d\'adresses au Québec (autocomplete)' })
  search(@Query('q') q?: string) {
    return this.geoService.searchQuebecAddresses(q ?? '');
  }
}
