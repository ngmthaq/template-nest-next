import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

/**
 * Aggregates all feature modules behind a single import for `AppModule`.
 * Add new feature modules to the `imports` array as the application grows.
 */
@Module({
  imports: [UserModule, AuthModule, CacheModule, HealthModule],
  exports: [UserModule, AuthModule, CacheModule, HealthModule],
  controllers: [],
  providers: [],
})
export class FeatureModule {}
