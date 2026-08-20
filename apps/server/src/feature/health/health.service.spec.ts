import type { Redis } from 'ioredis';
import type { Pool } from 'mysql2/promise';

import { HealthService } from './health.service';

interface MysqlPoolMock {
  query: jest.Mock;
  end: jest.Mock;
}

interface RedisClientMock {
  ping: jest.Mock;
  quit: jest.Mock;
}

describe('HealthService', () => {
  let mysql: MysqlPoolMock;
  let redis: RedisClientMock;
  let service: HealthService;

  beforeEach(() => {
    mysql = {
      query: jest.fn().mockResolvedValue([[], []]),
      end: jest.fn().mockResolvedValue(undefined),
    };
    redis = { ping: jest.fn().mockResolvedValue('PONG'), quit: jest.fn().mockResolvedValue('OK') };
    service = new HealthService(mysql as unknown as Pool, redis as unknown as Redis);
  });

  it('reports ok with every indicator up when mysql and redis are healthy', async () => {
    // Act
    const result = await service.check();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.info.server.status).toBe('up');
    expect(result.info.mysql.status).toBe('up');
    expect(result.info.redis.status).toBe('up');
    expect(typeof result.info.server.uptime).toBe('number');
  });

  it('does not include an uptime value on the mysql or redis indicators', async () => {
    // Act
    const result = await service.check();

    // Assert
    expect(result.info.mysql.uptime).toBeUndefined();
    expect(result.info.redis.uptime).toBeUndefined();
  });

  it('reports error with mysql down when the mysql query rejects', async () => {
    // Arrange
    mysql.query.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3306'));

    // Act
    const result = await service.check();

    // Assert
    expect(result.status).toBe('error');
    expect(result.info.mysql.status).toBe('down');
    expect(result.info.mysql.error).toBe('connect ECONNREFUSED 127.0.0.1:3306');
  });

  it('reports error with redis down when the redis ping rejects', async () => {
    // Arrange
    redis.ping.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:6379'));

    // Act
    const result = await service.check();

    // Assert
    expect(result.status).toBe('error');
    expect(result.info.redis.status).toBe('down');
    expect(result.info.redis.error).toBe('connect ECONNREFUSED 127.0.0.1:6379');
  });

  it('reports error with both mysql and redis down when both checks reject', async () => {
    // Arrange
    mysql.query.mockRejectedValue(new Error('mysql unreachable'));
    redis.ping.mockRejectedValue(new Error('redis unreachable'));

    // Act
    const result = await service.check();

    // Assert
    expect(result.status).toBe('error');
    expect(result.info.mysql.status).toBe('down');
    expect(result.info.redis.status).toBe('down');
  });

  it('unwraps an AggregateError with an empty own message to its first underlying cause message', async () => {
    // Arrange
    const cause = new Error('ECONNREFUSED');
    mysql.query.mockRejectedValue(new AggregateError([cause], ''));

    // Act
    const result = await service.check();

    // Assert
    expect(result.info.mysql.error).toBe('ECONNREFUSED');
  });

  it('calls both mysql.end and redis.quit on module destroy', async () => {
    // Act
    await service.onModuleDestroy();

    // Assert
    expect(mysql.end).toHaveBeenCalledTimes(1);
    expect(redis.quit).toHaveBeenCalledTimes(1);
  });
});
