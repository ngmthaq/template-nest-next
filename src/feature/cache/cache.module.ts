import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

/**
 * Feature module exposing cache administration endpoints.
 *
 * The global `CACHE_MANAGER` (registered in `CoreModule`) is injected directly
 * by `CacheService`, so no cache store needs to be imported here.
 */
@Module({
  imports: [],
  exports: [CacheService],
  controllers: [CacheController],
  providers: [CacheService],
})
export class CacheModule {}
