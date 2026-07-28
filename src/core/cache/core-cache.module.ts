import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

/**
 * Registers the cache as a global module, backed by Redis via a Keyv store
 * (cache-manager v7's store interface). Its options are resolved asynchronously
 * from `ConfigService` so the `CACHE_MANAGER` provider can be injected anywhere
 * for manual caching. `ttl` is expressed in milliseconds. The Redis connection
 * reuses the same `redis.*` settings as BullMQ; keys are namespaced under
 * `cache` to keep them separate from other Redis users. Requires a running
 * Redis instance (see `configuration.ts`).
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('redis.host', 'localhost');
        const port = config.get<number>('redis.port', 6379);
        const password = config.get<string>('redis.password');
        const auth = password ? `:${encodeURIComponent(password)}@` : '';
        const url = `redis://${auth}${host}:${port}`;

        return {
          ttl: config.get<number>('cache.ttl', 3600000),
          stores: [
            new Keyv({
              namespace: 'cache',
              store: new KeyvRedis(url),
            }),
          ],
        };
      },
    }),
  ],
  exports: [CacheModule],
  controllers: [],
  providers: [],
})
export class CoreCacheModule {}
