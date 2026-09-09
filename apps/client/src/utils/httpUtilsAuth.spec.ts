import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import type { CookiesFn } from 'cookies-next';

import { cookieUtils } from './cookieUtils';
import { HttpUtils } from './httpUtils';
import { HttpUtilsAuth, httpUtilsAuth } from './httpUtilsAuth';
import type { HttpUtilsAuthOptions } from './httpUtilsHelper';

vi.mock('./cookieUtils', () => ({
  cookieUtils: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

type AuthRequestConfig = InternalAxiosRequestConfig & HttpUtilsAuthOptions;

class TestableAuth extends HttpUtilsAuth {
  public exposedOnRequest(config: AuthRequestConfig): Promise<InternalAxiosRequestConfig> {
    return this.onRequest(config);
  }

  public exposedOnRequestError(error: AxiosError): Promise<never> {
    return this.onRequestError(error);
  }

  public exposedOnResponse(response: AxiosResponse): AxiosResponse {
    return this.onResponse(response);
  }

  public exposedOnResponseError(error: AxiosError): Promise<never> {
    return this.onResponseError(error);
  }
}

function buildConfig(overrides: Partial<AuthRequestConfig> = {}): AuthRequestConfig {
  return {
    url: '/foo',
    method: 'get',
    headers: new AxiosHeaders(),
    ...overrides,
  } as AuthRequestConfig;
}

function buildResponse(body: string): Response {
  return new Response(body, { status: 200 });
}

describe('HttpUtilsAuth', () => {
  let auth: TestableAuth;

  beforeEach(() => {
    auth = new TestableAuth({ baseUrl: 'http://api.test', timeout: 5000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('class surface', () => {
    it('extends HttpUtils so it inherits every verb and the token cookie accessors', () => {
      // Arrange & Act
      const instance = new HttpUtilsAuth();

      // Assert
      expect(instance).toBeInstanceOf(HttpUtils);
      expect(typeof instance.get).toBe('function');
      expect(typeof instance.setAccessToken).toBe('function');
    });

    it('exports a ready-to-use singleton instance', () => {
      // Arrange & Act & Assert
      expect(httpUtilsAuth).toBeInstanceOf(HttpUtilsAuth);
    });
  });

  describe('onRequest', () => {
    it('attaches a Bearer token when withAuth is unset, defaulting it to true', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig();

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.get('Authorization')).toBe('Bearer token-123');
    });

    it('attaches a Bearer token when withAuth is explicitly true', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig({ withAuth: true });

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.get('Authorization')).toBe('Bearer token-123');
    });

    it('leaves the header off when no token is stored', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue(undefined);
      const config = buildConfig();

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.has('Authorization')).toBe(false);
    });

    it('never reads the cookie store when withAuth is false', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig({ withAuth: false });

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.has('Authorization')).toBe(false);
      expect(cookieUtils.get).not.toHaveBeenCalled();
    });

    it('never reads the cookie store when the caller already supplied an Authorization header', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig({
        headers: new AxiosHeaders({ Authorization: 'Bearer original' }),
      });

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.get('Authorization')).toBe('Bearer original');
      expect(cookieUtils.get).not.toHaveBeenCalled();
    });

    it('detects a caller-supplied Authorization header case-insensitively', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig({
        headers: new AxiosHeaders({ authorization: 'Bearer original' }),
      });

      // Act
      await auth.exposedOnRequest(config);

      // Assert
      expect(cookieUtils.get).not.toHaveBeenCalled();
    });

    it('forwards a caller-supplied cookies function to the token lookup', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const cookies = vi.fn() as unknown as CookiesFn;
      const config = buildConfig({ cookies });

      // Act
      await auth.exposedOnRequest(config);

      // Assert
      expect(cookieUtils.get).toHaveBeenCalledWith('access_token', { cookies });
    });

    it('looks the token up without cookie options when no cookies function is supplied', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig();

      // Act
      await auth.exposedOnRequest(config);

      // Assert
      expect(cookieUtils.get).toHaveBeenCalledWith('access_token', undefined);
    });

    it('preserves headers the caller already set alongside the injected token', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig({ headers: new AxiosHeaders({ 'X-Trace-Id': 'trace-1' }) });

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result.headers.get('X-Trace-Id')).toBe('trace-1');
      expect(result.headers.get('Authorization')).toBe('Bearer token-123');
    });

    it('returns the same config object axios handed it, as the interceptor contract requires', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const config = buildConfig();

      // Act
      const result = await auth.exposedOnRequest(config);

      // Assert
      expect(result).toBe(config);
    });

    it('lets a cookie store failure propagate instead of silently sending an unauthenticated request', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockRejectedValue(new Error('cookie store unavailable'));

      // Act
      const act = auth.exposedOnRequest(buildConfig());

      // Assert
      await expect(act).rejects.toThrow('cookie store unavailable');
    });

    it('surfaces a cookie store failure to the caller rather than sending the request', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockRejectedValue(new Error('cookie store unavailable'));
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = auth.get('/foo');

      // Assert
      await expect(act).rejects.toThrow('cookie store unavailable');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('onRequestError placeholder', () => {
    it('rejects with the original error', async () => {
      // Arrange
      const error = { code: 'ERR_BAD_OPTION' } as AxiosError;

      // Act
      const act = auth.exposedOnRequestError(error);

      // Assert
      await expect(act).rejects.toBe(error);
    });

    it('never resolves, which would let a broken request continue as a success', async () => {
      // Arrange
      const onResolved = vi.fn();

      // Act
      await auth.exposedOnRequestError({} as AxiosError).then(onResolved, () => undefined);

      // Assert
      expect(onResolved).not.toHaveBeenCalled();
    });
  });

  describe('onResponse placeholder', () => {
    it('returns the response untouched', () => {
      // Arrange
      const response = { status: 200, data: { ok: true } } as AxiosResponse;

      // Act
      const result = auth.exposedOnResponse(response);

      // Assert
      expect(result).toBe(response);
    });
  });

  describe('onResponseError placeholder', () => {
    it('rejects with the original error so the inherited error mapping can classify it', async () => {
      // Arrange
      const error = { code: 'ERR_NETWORK' } as AxiosError;

      // Act
      const act = auth.exposedOnResponseError(error);

      // Assert
      await expect(act).rejects.toBe(error);
    });

    it('never resolves, which would turn an auth failure into an empty success', async () => {
      // Arrange
      const onResolved = vi.fn();

      // Act
      await auth.exposedOnResponseError({} as AxiosError).then(onResolved, () => undefined);

      // Assert
      expect(onResolved).not.toHaveBeenCalled();
    });
  });

  describe('interceptor wiring', () => {
    it('injects the Bearer token into a real request issued through a verb', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await auth.get('/foo');

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.headers.get('Authorization')).toBe('Bearer token-123');
    });

    it('honours withAuth false end to end, leaving the request unauthenticated', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await auth.get('/foo', undefined, { withAuth: false });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.headers.has('Authorization')).toBe(false);
      expect(cookieUtils.get).not.toHaveBeenCalled();
    });

    it('threads the cookies function from a verb call to the token lookup', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);
      const cookies = vi.fn() as unknown as CookiesFn;

      // Act
      await auth.post('/foo', { name: 'bar' }, { cookies });

      // Assert
      expect(cookieUtils.get).toHaveBeenCalledWith('access_token', { cookies });
    });

    it('keeps withAuth and cookies out of the options forwarded to fetch', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);
      const cookies = vi.fn() as unknown as CookiesFn;

      // Act
      await auth.get('/foo', undefined, { cookies, cache: 'no-store' });

      // Assert
      const [, fetchOptions] = fetchMock.mock.calls[0] as [Request, Record<string, unknown>];
      expect(fetchOptions).not.toHaveProperty('cookies');
      expect(fetchOptions).not.toHaveProperty('withAuth');
      expect(fetchOptions).toMatchObject({ cache: 'no-store' });
    });

    it('still maps transport failures through the inherited error mapping', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = auth.get('/foo');

      // Assert
      await expect(act).rejects.toMatchObject({ name: 'HttpUtilsNetworkError' });
    });
  });
});
