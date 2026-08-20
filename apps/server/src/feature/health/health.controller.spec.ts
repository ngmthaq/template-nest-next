import { ServiceUnavailableException } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthResult, HealthService } from './health.service';

describe('HealthController', () => {
  let healthService: { check: jest.Mock };
  let controller: HealthController;

  beforeEach(() => {
    healthService = { check: jest.fn() };
    controller = new HealthController(healthService as unknown as HealthService);
  });

  it('returns the health result as-is when status is ok', async () => {
    // Arrange
    const okResult: HealthResult = {
      status: 'ok',
      info: {
        server: { status: 'up', uptime: 12.3 },
        mysql: { status: 'up' },
        redis: { status: 'up' },
      },
    };
    healthService.check.mockResolvedValue(okResult);

    // Act
    const result = await controller.check();

    // Assert
    expect(result).toBe(okResult);
  });

  it('throws ServiceUnavailableException carrying the full health result when status is error', async () => {
    // Arrange
    const errorResult: HealthResult = {
      status: 'error',
      info: {
        server: { status: 'up', uptime: 12.3 },
        mysql: { status: 'down', error: 'connect ECONNREFUSED' },
        redis: { status: 'up' },
      },
    };
    healthService.check.mockResolvedValue(errorResult);

    // Act
    const error = await controller.check().catch((caught: unknown) => caught);

    // Assert
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toEqual(errorResult);
  });
});
