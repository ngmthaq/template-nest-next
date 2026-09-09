import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

/** Aggregates every feature module behind a single import for `AppModule`. */
@Module({
  imports: [UserModule, AuthModule, CacheModule, HealthModule],
  exports: [UserModule, AuthModule, CacheModule, HealthModule],
  controllers: [],
  providers: [],
})
export class FeatureModule {}
