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
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateTaskDto, DeclineTaskDto } from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

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

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.getById(id, userId);
  }

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateTaskDto) {
    return this.jobsService.create(userId, dto);
  }

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
  @ApiOperation({ summary: 'Supprimer une tâche (client, en attente uniquement)' })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.jobsService.remove(id, userId);
  }
}