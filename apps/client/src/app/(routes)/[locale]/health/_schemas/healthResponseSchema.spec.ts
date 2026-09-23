import { healthResultSchema, indicatorStatusSchema } from './healthResponseSchema';

const validateOptions = { stripUnknown: true, abortEarly: false };

describe('healthResponseSchema', () => {
  describe('indicatorStatusSchema', () => {
    it('accepts an up indicator with an uptime', async () => {
      // Arrange
      const indicator = { status: 'up', uptime: 120 };

      // Act
      const act = indicatorStatusSchema.validate(indicator, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(indicator);
    });

    it('accepts a down indicator with an error message', async () => {
      // Arrange
      const indicator = { status: 'down', error: 'connection refused' };

      // Act
      const act = indicatorStatusSchema.validate(indicator, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(indicator);
    });

    it('rejects an indicator whose status is outside up/down', async () => {
      // Arrange
      const indicator = { status: 'sideways' };

      // Act
      const act = indicatorStatusSchema.validate(indicator, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });
  });

  describe('healthResultSchema', () => {
    it('accepts a full report with an up and a down indicator', async () => {
      // Arrange
      const report = {
        status: 'ok',
        info: {
          server: { status: 'up', uptime: 42 },
          mysql: { status: 'down', error: 'connection refused' },
        },
      };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(report);
    });

    it('accepts extra info keys and still validates each of them', async () => {
      // Arrange
      const report = {
        status: 'ok',
        info: {
          redis: { status: 'up' },
          custom: { status: 'down', error: 'timeout' },
        },
      };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(report);
    });

    it('rejects when an extra info key has a bad status', async () => {
      // Arrange
      const report = { status: 'ok', info: { redis: { status: 'sideways' } } };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });

    it('rejects a report missing info', async () => {
      // Arrange
      const report = { status: 'ok' };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });

    it('rejects a report whose info is not an object', async () => {
      // Arrange
      const report = { status: 'ok', info: 'not-an-object' };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });

    it('accepts a report with an empty info object', async () => {
      // Arrange
      const report = { status: 'ok', info: {} };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(report);
    });

    it('rejects a top-level status outside ok/error', async () => {
      // Arrange
      const report = { status: 'degraded', info: {} };

      // Act
      const act = healthResultSchema.validate(report, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });

    it('removes unknown top-level and indicator fields instead of rejecting the report', async () => {
      // Arrange
      const report = {
        status: 'ok',
        info: { server: { status: 'up', uptime: 1, extra: 'unexpected' } },
        extraTopLevel: 'unexpected',
      };

      // Act
      const result = await healthResultSchema.validate(report, validateOptions);

      // Assert
      expect(result).toEqual({ status: 'ok', info: { server: { status: 'up', uptime: 1 } } });
    });
  });
});
