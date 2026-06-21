import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateTaskDto, DeclineTaskDto, ApplyTaskDto } from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get('guides/prices')
  @ApiOperation({ summary: 'Fourchettes de prix suggérées par type de service' })
  priceGuides(@Query('city') city?: string) {
    return this.jobsService.getPriceGuides(city);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tâches disponibles' })
  list(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: string,
    @Query('serviceType') serviceType?: string,
    @Query('perspective') perspective?: string,
  ) {
    return this.jobsService.list(userId, { status, serviceType, perspective });
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Lister les candidatures (client uniquement)' })
  listApplications(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.jobsService.listApplications(id, userId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.getById(id, userId);
  }

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateTaskDto) {
    return this.jobsService.create(userId, dto);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Postuler à une tâche (tasker)' })
  apply(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ApplyTaskDto,
  ) {
    return this.jobsService.apply(id, userId, dto);
  }

  @Post(':id/select/:taskerId')
  @ApiOperation({ summary: 'Choisir un travailleur (client)' })
  selectTasker(
    @Param('id') id: string,
    @Param('taskerId') taskerId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.jobsService.selectTasker(id, userId, taskerId);
  }

  @Post(':id/applications/withdraw')
  @ApiOperation({ summary: 'Retirer sa candidature (tasker)' })
  withdrawApplication(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.jobsService.withdrawApplication(id, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une tâche (client ou admin)' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.jobsService.cancel(id, userId, role);
  }

  /** @deprecated use POST /jobs/:id/apply */
  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.accept(id, userId);
  }

  @Post(':id/decline')
  decline(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: DeclineTaskDto,
  ) {
    return this.jobsService.decline(id, userId, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.complete(id, userId);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.start(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche (client ou admin, en attente uniquement)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.jobsService.remove(id, userId, role);
  }
}
