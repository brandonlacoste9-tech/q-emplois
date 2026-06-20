import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IsAdmin } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@IsAdmin()
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Métriques beta (admin)' })
  getMetrics(@Query('days') days?: string) {
    return this.adminService.getBetaMetrics(days ? parseInt(days, 10) : 30);
  }

  @Get('verifications/pending')
  @ApiOperation({ summary: 'Documents en attente de vérification' })
  listPending() {
    return this.adminService.listPendingVerifications();
  }

  @Post('verifications/:providerId/approve')
  approve(@Param('providerId') providerId: string, @CurrentUser('userId') adminId: string) {
    return this.adminService.verifyProvider(providerId, adminId);
  }

  @Post('verifications/:providerId/reject')
  reject(@Param('providerId') providerId: string, @CurrentUser('userId') adminId: string) {
    return this.adminService.rejectVerification(providerId, adminId);
  }
}
