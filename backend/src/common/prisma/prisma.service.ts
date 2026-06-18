import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`PostgreSQL connection failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
