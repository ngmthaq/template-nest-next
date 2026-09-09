import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

/**
 * Global `ThrottlerGuard`; three tiers (`short`/`medium`/`long`) all apply at once, skipped in
 * development. The in-memory store is per-instance — back it with Redis before running replicas.
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
