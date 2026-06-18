import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const provider = await this.prisma.provider.findUnique({ where: { userId } });

    const [jobsToday, jobsThisWeek, pendingJobs, weekTasks, monthTasks] =
      await Promise.all([
        this.prisma.task.count({
          where: {
            taskerId: userId,
            createdAt: { gte: startOfDay },
          },
        }),
        this.prisma.task.count({
          where: {
            taskerId: userId,
            createdAt: { gte: startOfWeek },
          },
        }),
        this.prisma.task.count({
          where: {
            taskerId: userId,
            status: { in: [TaskStatus.claimed, TaskStatus.in_progress] },
          },
        }),
        this.prisma.task.findMany({
          where: {
            taskerId: userId,
            status: TaskStatus.completed,
            completedAt: { gte: startOfWeek },
          },
          select: { estimatedPrice: true },
        }),
        this.prisma.task.findMany({
          where: {
            taskerId: userId,
            status: TaskStatus.completed,
            completedAt: { gte: startOfMonth },
          },
          select: { estimatedPrice: true },
        }),
      ]);

    const sum = (tasks: { estimatedPrice: any }[]) =>
      tasks.reduce((acc, t) => acc + Number(t.estimatedPrice), 0);

    return {
      jobsToday,
      jobsThisWeek,
      earningsThisWeek: sum(weekTasks),
      earningsThisMonth: sum(monthTasks),
      rating: provider?.rating ?? 0,
      pendingJobs,
    };
  }
}