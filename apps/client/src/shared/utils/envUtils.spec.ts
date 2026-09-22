import { envUtils } from './envUtils';

describe('EnvUtils', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isProduction', () => {
    it('returns true when APP_ENV is production', () => {
      // Arrange
      vi.stubEnv('APP_ENV', 'production');

      // Act
      const result = envUtils.isProduction();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when APP_ENV is staging', () => {
      // Arrange
      vi.stubEnv('APP_ENV', 'staging');

      // Act
      const result = envUtils.isProduction();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when APP_ENV is development', () => {
      // Arrange
      vi.stubEnv('APP_ENV', 'development');

      // Act
      const result = envUtils.isProduction();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when APP_ENV is unset', () => {
      // Arrange
      vi.stubEnv('APP_ENV', undefined);

      // Act
      const result = envUtils.isProduction();

      // Assert
      expect(result).toBe(false);
    });

    it('reads APP_ENV at call time, not at construction time', () => {
      // Arrange
      vi.stubEnv('APP_ENV', 'staging');
      const before = envUtils.isProduction();

      // Act
      vi.stubEnv('APP_ENV', 'production');
      const after = envUtils.isProduction();

      // Assert
      expect(before).toBe(false);
      expect(after).toBe(true);
    });
  });
});
