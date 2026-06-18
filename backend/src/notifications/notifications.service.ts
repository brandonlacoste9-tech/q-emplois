import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.platformNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.platformNotification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification introuvable.');

    return this.prisma.platformNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: object,
  ) {
    return this.prisma.platformNotification.create({
      data: { userId, type, title, message, data: data as object | undefined },
    });
  }
}