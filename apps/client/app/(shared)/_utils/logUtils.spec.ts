import { logUtils } from './logUtils';

function stubServerEnvironment(): void {
  vi.stubGlobal('window', undefined);
}

describe('LogUtils / logUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('server branch (typeof window === "undefined")', () => {
    it('emits on all four methods when LOG_LEVEL is "debug"', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).toHaveBeenCalledWith('warn message');
      expect(infoSpy).toHaveBeenCalledWith('info message');
      expect(debugSpy).toHaveBeenCalledWith('debug message');
    });

    it('only emits "error" when LOG_LEVEL is "error"', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'error');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('emits "error", "warn" and "info" but stays silent on "debug" when LOG_LEVEL is "info"', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'info');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).toHaveBeenCalledWith('warn message');
      expect(infoSpy).toHaveBeenCalledWith('info message');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('behaves as "debug" and emits on all four methods when LOG_LEVEL is unset', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).toHaveBeenCalledWith('warn message');
      expect(infoSpy).toHaveBeenCalledWith('info message');
      expect(debugSpy).toHaveBeenCalledWith('debug message');
    });

    it('falls back to "debug" behavior instead of going silent when LOG_LEVEL is an invalid value', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'verbose');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).toHaveBeenCalledWith('warn message');
      expect(infoSpy).toHaveBeenCalledWith('info message');
      expect(debugSpy).toHaveBeenCalledWith('debug message');
    });

    it('forwards multiple arguments unchanged to the underlying console method', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { code: 500 };

      // Act
      logUtils.error('request failed', payload, 42);

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('request failed', payload, 42);
    });
  });

  describe('browser branch (typeof window !== "undefined")', () => {
    it('only emits "error" and ignores LOG_LEVEL="debug" from the environment', () => {
      // Arrange
      vi.stubEnv('LOG_LEVEL', 'debug');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      logUtils.error('error message');
      logUtils.warn('warn message');
      logUtils.info('info message');
      logUtils.debug('debug message');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('error message');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });
});
