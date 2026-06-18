import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check (no database required)' })
  check() {
    return {
      status: 'ok',
      service: 'q-emplois-api',
      timestamp: new Date().toISOString(),
    };
  }
}