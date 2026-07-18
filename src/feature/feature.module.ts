import { Module } from '@nestjs/common';

/**
 * Aggregates all feature modules behind a single import for `AppModule`.
 * Add new feature modules to the `imports` array as the application grows.
 */
@Module({
  imports: [],
})
export class FeatureModule {}
