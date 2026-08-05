import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createPool } from 'mysql2/promise';
import { HealthController } from './health.controller';
import { HEALTH_MYSQL_POOL, HEALTH_REDIS_CLIENT } from './health.constants';
import { HealthService } from './health.service';

/**
 * Feature module exposing the `GET /health` probe.
 *
 * Provides {@link HealthService} together with the dedicated MySQL pool and
 * Redis client it checks. Both clients are configured to fail fast — small
 * connection limits and no offline queue — so an unreachable dependency turns
 * into a `down` indicator quickly instead of hanging the request. Connection
 * settings come from `mysql.*` / `redis.*` in `configuration.ts`.
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
          // Connect eagerly so the first PING has a live socket; commands fail
          // fast (rather than queue) whenever the connection is down, keeping a
          // dead Redis from hanging the health request.
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
