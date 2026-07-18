import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
 */
@Module({
  imports: [
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
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('cache.ttl', 3600000),
      }),
    }),
  ],
})
export class CoreModule {}
