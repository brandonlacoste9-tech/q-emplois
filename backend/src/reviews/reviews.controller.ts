import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Laisser une évaluation après une tâche terminée' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Évaluations reçues par un utilisateur' })
  listForUser(@Param('id') id: string) {
    return this.reviewsService.listForUser(id);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Évaluations pour une tâche' })
  getForTask(
    @Param('taskId') taskId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.reviewsService.getForTask(taskId, userId);
  }
}
