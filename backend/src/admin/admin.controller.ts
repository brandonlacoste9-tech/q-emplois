import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
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
  listPending(@Query('q') q?: string) {
    return this.adminService.listPendingVerifications(q);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Rechercher des prestataires' })
  searchProviders(@Query('q') q?: string, @Query('status') status?: string) {
    return this.adminService.searchProviders(q, status);
  }

  @Post('verifications/:providerId/approve')
  approve(@Param('providerId') providerId: string, @CurrentUser('userId') adminId: string) {
    return this.adminService.verifyProvider(providerId, adminId);
  }

  @Post('verifications/:providerId/reject')
  @ApiOperation({ summary: 'Rejeter un document de vérification' })
  reject(
    @Param('providerId') providerId: string,
    @CurrentUser('userId') adminId: string,
    @Body() body?: { reason?: string },
  ) {
    return this.adminService.rejectVerification(providerId, adminId, body?.reason);
  }

  @Post('invites')
  @ApiOperation({ summary: 'Générer un code d\'invitation fondateur' })
  generateInvite(
    @CurrentUser('userId') adminId: string,
    @Body() body?: { maxRedemptions?: number; rewardCredits?: number; discountPct?: number },
  ) {
    return this.adminService.generateInvite(adminId, body);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Parcourir les logs d\'audit' })
  auditLogs(
    @Query('page') page?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAuditLogs(page ? parseInt(page, 10) : 1, action, userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Rechercher des utilisateurs' })
  listUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.listUsers(q, role, page ? parseInt(page, 10) : 1);
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur' })
  updateUserRole(
    @Param('userId') userId: string,
    @CurrentUser('userId') adminId: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(userId, body.role, adminId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Lister toutes les tâches (admin)' })
  listJobs(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.listAllJobs(status, q, page ? parseInt(page, 10) : 1);
  }

  @Post('seed-demo')
  @ApiOperation({ summary: 'Restaurer les tâches démo (été)' })
  seedDemo(@CurrentUser('userId') adminId: string) {
    return this.adminService.seedDemoJobs(adminId);
  }
}
