import { Module } from '@nestjs/common';

import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

/** Cache administration endpoints. Guarded by `NonProductionGuard` — never live in production. */
@Module({
  imports: [],
  exports: [CacheService],
  controllers: [CacheController],
  providers: [CacheService],
})
export class CacheModule {}
