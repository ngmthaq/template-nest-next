import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createPool } from 'mysql2/promise';

import { HEALTH_MYSQL_POOL, HEALTH_REDIS_CLIENT } from './health.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Exposes `GET /health`. Its MySQL pool and Redis client are configured to fail fast —
 * small limits, no offline queue — so an unreachable dependency reports `down` quickly.
 */
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HEALTH_MYSQL_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createPool({
          host: config.get<string>('mysql.host', 'localhost'),
          port: config.get<number>('mysql.port', 3306),
          user: config.get<string>('mysql.user', 'root'),
          password: config.get<string>('mysql.password'),
          database: config.get<string>('mysql.database', ''),
          connectionLimit: 2,
          connectTimeout: 3000,
          waitForConnections: true,
        }),
    },
    {
      provide: HEALTH_REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis({
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
          // Connect eagerly and fail fast rather than queue, so a dead Redis
          // reports `down` instead of hanging the health request.
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
        });
        // Swallow connection errors: liveness is reported by the PING check,
        // and an unhandled 'error' event would otherwise crash the process.
        client.on('error', () => undefined);
        return client;
      },
    },
    HealthService,
  ],
})
export class HealthModule {}
