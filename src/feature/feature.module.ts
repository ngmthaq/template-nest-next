import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';

/**
 * Aggregates all feature modules behind a single import for `AppModule`.
 * Add new feature modules to the `imports` array as the application grows.
 */
@Module({
  imports: [CacheModule],
})
export class FeatureModule {}
