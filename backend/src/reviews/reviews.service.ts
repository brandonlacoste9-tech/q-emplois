import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      include: { reviews: true },
    });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.status !== TaskStatus.completed) {
      throw new BadRequestException('Seules les tâches terminées peuvent être évaluées.');
    }

    const isClient = task.clientId === reviewerId;
    const isTasker = task.taskerId === reviewerId;
    if (!isClient && !isTasker) {
      throw new ForbiddenException('Accès refusé.');
    }

    const revieweeId = isClient ? task.taskerId : task.clientId;
    if (!revieweeId) {
      throw new BadRequestException('Aucun utilisateur à évaluer pour cette tâche.');
    }

    const existing = await this.prisma.taskReview.findUnique({
      where: {
        taskId_reviewerId: { taskId: dto.taskId, reviewerId },
      },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà évalué cette tâche.');
    }

    const review = await this.prisma.taskReview.create({
      data: {
        taskId: dto.taskId,
        reviewerId,
        revieweeId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });

    const provider = await this.prisma.provider.findUnique({
      where: { userId: revieweeId },
    });
    if (provider) {
      const stats = await this.prisma.taskReview.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
        _count: true,
      });
      await this.prisma.provider.update({
        where: { id: provider.id },
        data: {
          rating: stats._avg.rating ?? 0,
          reviewCount: stats._count,
        },
      });
    }

    return review;
  }

  async listForUser(userId: string) {
    return this.prisma.taskReview.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
        task: { select: { title: true, serviceType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getForTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== userId && task.taskerId !== userId) {
      throw new ForbiddenException('Accès refusé.');
    }
    return this.prisma.taskReview.findMany({
      where: { taskId },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
