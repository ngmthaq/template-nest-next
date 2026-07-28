import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

/**
 * Sets up application-wide request rate limiting with three named tiers —
 * `short`, `medium`, and `long` — each a `limit` of requests per `ttl` window
 * (milliseconds), resolved from `ConfigService`; see `configuration.ts`. All
 * tiers apply together, so a request must satisfy every one (e.g. burst
 * protection via `short` plus a sustained cap via `long`).
 *
 * `ThrottlerGuard` is registered as a global `APP_GUARD` so every HTTP route is
 * throttled by default. Opt routes out with `@SkipThrottle()` (optionally per
 * tier, e.g. `@SkipThrottle({ short: true })`) or override a tier with
 * `@Throttle({ long: { limit, ttl } })`. Rate limiting is skipped entirely in
 * local development (`nodeEnv === 'development'`) via `skipIf`, and active in
 * every other environment. The default in-memory store is per-instance; back
 * it with a shared store (e.g. Redis) if running multiple instances behind a
 * load balancer.
 */
@Global()
@Module({
  imports: [
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
  exports: [ThrottlerModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CoreThrottlerModule {}
