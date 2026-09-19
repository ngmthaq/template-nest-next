import KeyvRedis from '@keyv/redis';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { CoreCacheModule } from './core-cache.module';

jest.mock('@keyv/redis');

/** Token `CacheModule.registerAsync` resolves its options under (`@nestjs/cache-manager`). */
const CACHE_MODULE_OPTIONS_TOKEN = 'CACHE_MODULE_OPTIONS';

interface TestConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
  };
  cache?: {
    ttl?: number;
  };
}

interface CacheFactoryOptions {
  ttl: number;
}

async function buildCacheOptions(config: TestConfig): Promise<CacheFactoryOptions> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      CoreCacheModule,
    ],
  }).compile();

  const options = moduleRef.get<CacheFactoryOptions>(CACHE_MODULE_OPTIONS_TOKEN);
  await moduleRef.close();

  return options;
}

describe('CoreCacheModule', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds the Redis url and ttl from config values', async () => {
    // Arrange
    const config: TestConfig = {
      redis: { host: 'cache.local', port: 6390, password: 'secret' },
      cache: { ttl: 12345 },
    };

    // Act
    const options = await buildCacheOptions(config);

    // Assert
    expect(jest.mocked(KeyvRedis)).toHaveBeenCalledWith('redis://:secret@cache.local:6390');
    expect(options.ttl).toBe(12345);
  });

  it('builds a Redis url with no auth part when no password is set', async () => {
    // Arrange
    const config: TestConfig = { redis: { host: 'cache.local', port: 6390 } };

    // Act
    await buildCacheOptions(config);

    // Assert
    expect(jest.mocked(KeyvRedis)).toHaveBeenCalledWith('redis://cache.local:6390');
  });

  it('encodes a password with special characters into the Redis url', async () => {
    // Arrange
    const config: TestConfig = {
      redis: { host: 'cache.local', port: 6390, password: 'p@ss:word' },
    };

    // Act
    await buildCacheOptions(config);

    // Assert
    expect(jest.mocked(KeyvRedis)).toHaveBeenCalledWith('redis://:p%40ss%3Aword@cache.local:6390');
  });

  it('falls back to localhost:6379 and a 3600000ms ttl when config is missing', async () => {
    // Arrange
    const config: TestConfig = {};

    // Act
    const options = await buildCacheOptions(config);

    // Assert
    expect(jest.mocked(KeyvRedis)).toHaveBeenCalledWith('redis://localhost:6379');
    expect(options.ttl).toBe(3600000);
  });
});
