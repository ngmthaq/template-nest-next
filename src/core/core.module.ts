import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from '../shared/config/logger.config';
import configuration from './configuration';

/**
 * Core module — wires up cross-cutting, application-wide infrastructure.
 *
 * `ConfigModule` is registered here as a global module so `ConfigService`
 * can be injected anywhere without re-importing. Environment variables are
 * loaded from environment-specific `.env` files, resolved dynamically from
 * `NODE_ENV`. The lookup is ordered — the first file to define a variable
 * wins — so `.env.<NODE_ENV>` overrides the shared `.env` defaults.
 *
 * `CacheModule` is registered as a global module too, backed by the default
 * in-memory store. Its options are resolved asynchronously from `ConfigService`
 * so the `CACHE_MANAGER` provider can be injected anywhere for manual caching.
 * `ttl` is expressed in milliseconds (cache-manager v7). The configured `max`
 * is not applied here because the default in-memory store in cache-manager v7
 * exposes no top-level `max` option; see `configuration.ts`.
 *
 * `WinstonModule` is registered globally and its options are resolved from
 * `ConfigService`. It exposes the Nest-compatible logger provider that
 * `main.ts` attaches via `app.useLogger`, so all framework and application
 * logs flow through Winston.
 *
 * `ScheduleModule` sets up the scheduler infrastructure so any provider can
 * declare cron jobs, intervals, or timeouts with `@Cron`, `@Interval`, and
 * `@Timeout`. Registered once here; no jobs are defined at this layer.
 *
 * `EventEmitterModule` sets up the application-wide event bus so any provider
 * can dispatch events with `EventEmitter2` and react with `@OnEvent`.
 * Registered once here; no events or listeners are defined at this layer.
 *
 * `HttpModule` (`@nestjs/axios`) is registered globally so `HttpService` can
 * be injected anywhere for outbound HTTP calls. Its Axios defaults (`timeout`,
 * `maxRedirects`) are resolved from `ConfigService`; see `configuration.ts`.
 *
 * `BullModule.forRoot` establishes the shared BullMQ Redis connection used by
 * every queue in the app. Its connection settings are resolved from
 * `ConfigService` (see `configuration.ts`). Individual queues are registered
 * per-feature with `BullModule.registerQueue(...)`; none are defined here.
 * Requires a running Redis instance.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createWinstonOptions,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('cache.ttl', 3600000),
      }),
    }),
    HttpModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('http.timeout', 60000),
        maxRedirects: config.get<number>('http.maxRedirects', 5),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
  ],
})
export class CoreModule {}
