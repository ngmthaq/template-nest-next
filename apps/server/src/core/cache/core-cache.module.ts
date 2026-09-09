import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keyv } from 'keyv';

/**
 * Redis-backed `CACHE_MANAGER` via a Keyv store, `ttl` in milliseconds. Keys are
 * namespaced under `cache` to stay clear of other users of the same Redis.
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
