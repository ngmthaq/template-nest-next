import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import type { Redis } from 'ioredis';
import type { Pool } from 'mysql2/promise';
import { of, throwError } from 'rxjs';

import { HealthService } from './health.service';

interface MysqlPoolMock {
  query: jest.Mock;
  end: jest.Mock;
}

interface RedisClientMock {
  ping: jest.Mock;
  quit: jest.Mock;
}

interface HttpServiceMock {
  get: jest.Mock;
}

interface ConfigServiceMock {
  get: jest.Mock;
}

describe('HealthService', () => {
  const pyServiceUrl = 'http://py-service.internal:8000';

  let mysql: MysqlPoolMock;
  let redis: RedisClientMock;
  let http: HttpServiceMock;
  let config: ConfigServiceMock;
  let service: HealthService;

  beforeEach(() => {
    mysql = {
      query: jest.fn().mockResolvedValue([[], []]),
      end: jest.fn().mockResolvedValue(undefined),
    };
    redis = { ping: jest.fn().mockResolvedValue('PONG'), quit: jest.fn().mockResolvedValue('OK') };
    http = { get: jest.fn() };
    // Default: pyService.url is not set, matching an environment without py-service configured.
    config = { get: jest.fn().mockReturnValue(undefined) };
    service = new HealthService(
      mysql as unknown as Pool,
      redis as unknown as Redis,
      http as unknown as HttpService,
      config as unknown as ConfigService,
    );
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

  describe('pyService indicator', () => {
    it('does not include a pyService key and does not call http.get when pyService.url is not set', async () => {
      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService).toBeUndefined();
      expect(http.get).not.toHaveBeenCalled();
    });

    it('reports pyService up and the overall status ok when the body status is ok', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: { status: 'ok' } }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.status).toBe('ok');
      expect(result.info.pyService).toEqual({ status: 'up' });
    });

    it('calls http.get with the health path and a 3 second timeout', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: { status: 'ok' } }));

      // Act
      await service.check();

      // Assert
      expect(http.get).toHaveBeenCalledWith(`${pyServiceUrl}/health`, { timeout: 3000 });
    });

    it('reports pyService up when the body has extra fields alongside a status of ok', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: { status: 'ok', version: '1.2.3' } }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService).toEqual({ status: 'up' });
    });

    it('reports pyService down and the overall status error when http.get rejects with a connection error', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(throwError(() => new Error('connect ECONNREFUSED 127.0.0.1:8000')));

      // Act
      const result = await service.check();

      // Assert
      expect(result.status).toBe('error');
      expect(result.info.pyService).toEqual({
        status: 'down',
        error: 'connect ECONNREFUSED 127.0.0.1:8000',
      });
    });

    it('reports pyService down when http.get rejects with a timeout error', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      const timeoutError = Object.assign(new Error('timeout of 3000ms exceeded'), {
        code: 'ECONNABORTED',
      });
      http.get.mockReturnValue(throwError(() => timeoutError));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService?.status).toBe('down');
      expect(result.info.pyService?.error).toBe('timeout of 3000ms exceeded');
    });

    it('reports pyService down when http.get rejects with a 500 AxiosError', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      const axiosError = new AxiosError('Request failed with status code 500');
      http.get.mockReturnValue(throwError(() => axiosError));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService?.status).toBe('down');
      expect(result.info.pyService?.error).toBe('Request failed with status code 500');
    });

    it('reports pyService down with a validation message when the body status is not ok', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: { status: 'error' } }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService).toEqual({
        status: 'down',
        error: 'Invalid py-service health response: status',
      });
    });

    it('reports pyService down when the body is an empty object', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: {} }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService?.status).toBe('down');
      expect(result.info.pyService?.error).toContain('Invalid py-service health response');
    });

    it('reports pyService down with the invalid-response message without throwing when the body is null', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: null }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.status).toBe('error');
      expect(result.info.pyService).toEqual({
        status: 'down',
        error: 'Invalid py-service health response',
      });
    });

    it('reports pyService down with the invalid-response message without throwing when the body is a plain string', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: 'not-json-shaped' }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService).toEqual({
        status: 'down',
        error: 'Invalid py-service health response',
      });
    });

    it('reports pyService down with the invalid-response message without throwing when the body is an array', async () => {
      // Arrange
      config.get.mockReturnValue(pyServiceUrl);
      http.get.mockReturnValue(of({ data: [{ status: 'ok' }] }));

      // Act
      const result = await service.check();

      // Assert
      expect(result.info.pyService).toEqual({
        status: 'down',
        error: 'Invalid py-service health response',
      });
    });
  });
});
