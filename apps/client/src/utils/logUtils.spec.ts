import { logUtils, OpenObserveLogEntry } from './logUtils';

function stubServerEnvironment(): void {
  vi.stubGlobal('window', undefined);
}

function resetOpenObserveState(): void {
  const internals = logUtils as unknown as {
    batch: OpenObserveLogEntry[];
    flushTimer: ReturnType<typeof setTimeout> | undefined;
  };
  if (internals.flushTimer) clearTimeout(internals.flushTimer);
  internals.flushTimer = undefined;
  internals.batch = [];
}

function silenceConsole(): void {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
}

describe('LogUtils / logUtils', () => {
  beforeEach(() => {
    resetOpenObserveState();
  });

  afterEach(() => {
    resetOpenObserveState();
    vi.useRealTimers();
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

  describe('OpenObserve log shipping', () => {
    it('posts a batch of 20 entries once the batch fills up', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      silenceConsole();
      const fetchMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://openobserve.local/api/default/client/_json');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body as string) as OpenObserveLogEntry[];
      expect(body).toHaveLength(20);
      expect(body[0]).toMatchObject({ level: 'info', message: 'message-0', service: 'client' });
    });

    it('does not call fetch when OPENOBSERVE_URL is not set', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', '');
      silenceConsole();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);

      // Assert
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not call fetch when running in the browser', () => {
      // Arrange
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      silenceConsole();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.error(`message-${i}`);

      // Assert
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not enqueue entries that LOG_LEVEL filters out', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'error');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      silenceConsole();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.debug(`message-${i}`);

      // Assert
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('flushes a partial batch after the 5 second timer fires', async () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      silenceConsole();
      const fetchMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('fetch', fetchMock);
      vi.useFakeTimers();

      // Act
      logUtils.info('single message');
      await vi.advanceTimersByTimeAsync(5000);

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as OpenObserveLogEntry[];
      expect(body).toHaveLength(1);
    });

    it('sends no Authorization header when OPENOBSERVE_USER is not set', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      silenceConsole();
      const fetchMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);

      // Assert
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });

    it('sends a Basic auth header built from OPENOBSERVE_USER and OPENOBSERVE_PASSWORD', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      vi.stubEnv('OPENOBSERVE_USER', 'admin');
      vi.stubEnv('OPENOBSERVE_PASSWORD', 'secret');
      silenceConsole();
      const fetchMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);

      // Assert
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Basic ${btoa('admin:secret')}`);
    });

    it('uses custom org and stream env vars and trims a trailing slash from the url', () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local/');
      vi.stubEnv('OPENOBSERVE_ORG', 'myorg');
      vi.stubEnv('OPENOBSERVE_STREAM', 'mystream');
      silenceConsole();
      const fetchMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);

      // Assert
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://openobserve.local/api/myorg/mystream/_json');
    });

    it('does not throw and does not log again when fetch rejects', async () => {
      // Arrange
      stubServerEnvironment();
      vi.stubEnv('LOG_LEVEL', 'debug');
      vi.stubEnv('OPENOBSERVE_URL', 'https://openobserve.local');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      for (let i = 0; i < 20; i += 1) logUtils.info(`message-${i}`);
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      // Assert
      expect(infoSpy).toHaveBeenCalledTimes(20);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
