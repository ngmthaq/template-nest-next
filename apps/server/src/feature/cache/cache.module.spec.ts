import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { CacheController } from './cache.controller';
import { CacheModule } from './cache.module';
import { CacheService } from './cache.service';

/**
 * Stands in for the real, `@Global()` `CACHE_MANAGER` provider (normally registered by
 * `CoreCacheModule` against Redis) so `CacheModule` can resolve it in isolation.
 */
@Global()
@Module({
  providers: [{ provide: CACHE_MANAGER, useValue: { get: jest.fn(), del: jest.fn(), stores: [] } }],
  exports: [CACHE_MANAGER],
})
class MockCacheManagerModule {}

describe('CacheModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({})] }),
        MockCacheManagerModule,
        CacheModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes CacheService as an exported provider', () => {
    // Act
    const service = moduleRef.get(CacheService);

    // Assert
    expect(service).toBeInstanceOf(CacheService);
  });

  it('compiles and exposes CacheController', () => {
    // Act
    const controller = moduleRef.get(CacheController);

    // Assert
    expect(controller).toBeInstanceOf(CacheController);
  });
});
