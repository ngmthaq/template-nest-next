import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';

/**
 * Aggregates development-only feature modules — endpoints that must never be
 * reachable in production (each is guarded by `NonProductionGuard`).
 * Add new dev-only feature modules to the `imports` array as they are created.
 */
@Module({
  imports: [CacheModule],
})
export class DevFeatureModule {}
