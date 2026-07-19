import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from '../shared/config/logger.config';
import { SecurityModule } from './security/security.module';
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
 *
 * `ThrottlerModule.forRootAsync` sets up application-wide request rate limiting
 * with three named tiers — `short`, `medium`, and `long` — each a `limit` of
 * requests per `ttl` window (milliseconds), resolved from `ConfigService`; see
 * `configuration.ts`. All tiers apply together, so a request must satisfy every
 * one (e.g. burst-protection via `short` plus a sustained cap via `long`).
 * `ThrottlerGuard` is registered as a global `APP_GUARD` so every HTTP route is
 * throttled by default. Opt routes out with `@SkipThrottle()` (optionally per
 * tier, e.g. `@SkipThrottle({ short: true })`) or override a tier with
 * `@Throttle({ long: { limit, ttl } })`. Rate limiting is skipped entirely in
 * local development (`nodeEnv === 'development'`) via `skipIf`, and active in
 * every other environment. The default in-memory store is per-instance; back
 * it with a shared store (e.g. Redis) if running multiple instances behind a
 * load balancer.
 *
 * `SecurityModule` (global) provides the cryptographic services `HashService`
 * (one-way bcrypt hashing for passwords) and `EncryptionService` (reversible
 * AES-256-GCM encryption for recoverable secrets). Both are injectable anywhere;
 * their parameters are resolved from `ConfigService` (see `configuration.ts`).
 */
@Module({
  imports: [
    SecurityModule,
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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        skipIf: () => config.get<string>('nodeEnv', 'development') === 'development',
        throttlers: [
          {
            name: 'short',
            ttl: config.get<number>('throttle.short.ttl', 1000),
            limit: config.get<number>('throttle.short.limit', 3),
          },
          {
            name: 'medium',
            ttl: config.get<number>('throttle.medium.ttl', 10000),
            limit: config.get<number>('throttle.medium.limit', 20),
          },
          {
            name: 'long',
            ttl: config.get<number>('throttle.long.ttl', 60000),
            limit: config.get<number>('throttle.long.limit', 100),
          },
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CoreModule {}
