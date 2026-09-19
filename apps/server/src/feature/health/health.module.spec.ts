import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';

import { HEALTH_MYSQL_POOL, HEALTH_REDIS_CLIENT } from './health.constants';
import { HealthModule } from './health.module';

jest.mock('ioredis');
jest.mock('mysql2/promise');

interface TestConfig {
  mysql?: Partial<{
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }>;
  redis?: Partial<{ host: string; port: number; password: string }>;
}

function buildMysqlPoolMock(): { query: jest.Mock; end: jest.Mock } {
  return {
    query: jest.fn().mockResolvedValue([[], []]),
    end: jest.fn().mockResolvedValue(undefined),
  };
}

async function buildHealthModule(config: TestConfig = {}): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      HealthModule,
    ],
  }).compile();
}

type RedisOnMock = jest.Mock<void, [string, (error: Error) => void]>;

describe('HealthModule', () => {
  const mockedCreatePool = jest.mocked(createPool);
  const MockedRedis = Redis as jest.MockedClass<typeof Redis>;
  let mockRedisOn: RedisOnMock;

  beforeEach(() => {
    mockedCreatePool.mockReset().mockReturnValue(buildMysqlPoolMock() as unknown as Pool);
    MockedRedis.mockClear();
    mockRedisOn = jest.fn<void, [string, (error: Error) => void]>();
    MockedRedis.prototype.on = mockRedisOn as unknown as typeof MockedRedis.prototype.on;
    MockedRedis.prototype.quit = jest.fn().mockResolvedValue('OK');
  });

  it('creates the mysql pool with the configured connection settings and fixed pool limits', async () => {
    // Arrange
    const config: TestConfig = {
      mysql: {
        host: 'db.internal',
        port: 3307,
        user: 'app',
        password: 'secret',
        database: 'app_db',
      },
    };

    // Act
    const moduleRef = await buildHealthModule(config);

    // Assert
    expect(mockedCreatePool).toHaveBeenCalledWith({
      host: 'db.internal',
      port: 3307,
      user: 'app',
      password: 'secret',
      database: 'app_db',
      connectionLimit: 2,
      connectTimeout: 3000,
      waitForConnections: true,
    });
    await moduleRef.close();
  });

  it('falls back to default mysql connection settings when config is missing', async () => {
    // Act
    const moduleRef = await buildHealthModule();

    // Assert
    expect(mockedCreatePool).toHaveBeenCalledWith({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: undefined,
      database: '',
      connectionLimit: 2,
      connectTimeout: 3000,
      waitForConnections: true,
    });
    await moduleRef.close();
  });

  it('creates the redis client with the configured host, port and password', async () => {
    // Arrange
    const config: TestConfig = {
      redis: { host: 'cache.internal', port: 6380, password: 'redis-secret' },
    };

    // Act
    const moduleRef = await buildHealthModule(config);

    // Assert
    expect(MockedRedis).toHaveBeenCalledWith({
      host: 'cache.internal',
      port: 6380,
      password: 'redis-secret',
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    await moduleRef.close();
  });

  it('falls back to default redis connection settings when config is missing', async () => {
    // Act
    const moduleRef = await buildHealthModule();

    // Assert
    expect(MockedRedis).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
      password: undefined,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    await moduleRef.close();
  });

  it('swallows redis client errors instead of throwing', async () => {
    // Arrange
    const moduleRef = await buildHealthModule();
    const errorCall = mockRedisOn.mock.calls.find(([event]) => event === 'error');
    const errorHandler = errorCall?.[1];

    // Act
    const act = (): void => errorHandler?.(new Error('connection reset'));

    // Assert
    expect(act).not.toThrow();
    await moduleRef.close();
  });

  it('closes the mysql pool and redis client when the module is destroyed', async () => {
    // Arrange
    const moduleRef = await buildHealthModule();
    const pool = moduleRef.get<{ end: jest.Mock }>(HEALTH_MYSQL_POOL);
    const redisClient = moduleRef.get<{ quit: jest.Mock }>(HEALTH_REDIS_CLIENT);

    // Act
    await moduleRef.close();

    // Assert
    expect(pool.end).toHaveBeenCalledTimes(1);
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
  });
});
