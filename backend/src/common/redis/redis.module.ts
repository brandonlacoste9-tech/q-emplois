import { Logger, Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MemoryRedis } from './memory-redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export type RedisClient = Redis | MemoryRedis;

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): RedisClient => {
        const logger = new Logger('RedisModule');
        const redisUrl = configService.get<string>('REDIS_URL')?.trim();

        if (!redisUrl) {
          logger.warn(
            'REDIS_URL not set — using in-memory store (fine for MVP; add Upstash/Railway Redis for production)',
          );
          return new MemoryRedis();
        }

        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        redis
          .connect()
          .then(() => logger.log('Connected to Redis'))
          .catch((err: Error) =>
            logger.error(`Redis connection failed: ${err.message}`),
          );

        redis.on('error', (err) => {
          logger.error(`Redis error: ${err.message}`);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
