import type { AxiosInstance } from 'axios';
import type { CookiesFn } from 'cookies-next';

import { cookieUtils } from './cookieUtils';
import {
  HttpUtilsHelper,
  HttpUtilsNetworkError,
  HttpUtilsRequestCanceledError,
  type HttpUtilsRequestOptions,
  HttpUtilsResponseError,
  HttpUtilsTimeoutError,
} from './httpUtilsHelper';

vi.mock('./cookieUtils', () => ({
  cookieUtils: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

class TestableHelper extends HttpUtilsHelper {
  public get exposedAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  public exposedBuildUrl(url: string, params?: Record<string, string>): string {
    return this.buildUrl(url, params);
  }

  public exposedRequest<T>(url: string, options: HttpUtilsRequestOptions): Promise<T> {
    return this.request<T>(url, options);
  }
}

// axios calls `fetch(request, fetchOptions)`; arg [1] is the only place Next's `next: {...}`
// survives, since `Request` drops it. Codes: ETIMEDOUT, ERR_CANCELED, ERR_NETWORK.

function buildResponse(
  body: string,
  init: { status?: number; headers?: HeadersInit } = {},
): Response {
  return new Response(body, { status: 200, ...init });
}

function jsonResponse(data: unknown, status = 200): Response {
  return buildResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Rejects only on abort, so the timeout and cancel paths are reachable. */
function abortAwareFetchMock(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation(
    (request: Request) =>
      new Promise((_resolve, reject) => {
        request.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }),
  );
}

describe('HttpUtilsHelper', () => {
  let helper: TestableHelper;

  beforeEach(() => {
    helper = new TestableHelper({ baseUrl: 'http://api.test', timeout: 5000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('error classes', () => {
    it('gives HttpUtilsTimeoutError a default message and a stable name', () => {
      // Arrange & Act
      const error = new HttpUtilsTimeoutError();

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HttpUtilsTimeoutError');
      expect(error.message).toBe('Timeout Error');
    });

    it('gives HttpUtilsNetworkError a default message and a stable name', () => {
      // Arrange & Act
      const error = new HttpUtilsNetworkError();

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HttpUtilsNetworkError');
      expect(error.message).toBe('Network Error');
    });

    it('gives HttpUtilsRequestCanceledError a default message and a stable name', () => {
      // Arrange & Act
      const error = new HttpUtilsRequestCanceledError();

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HttpUtilsRequestCanceledError');
      expect(error.message).toBe('Request Canceled Error');
    });

    it('lets a caller override the default message on each defaulted error class', () => {
      // Arrange & Act
      const timeout = new HttpUtilsTimeoutError('slow upstream');
      const network = new HttpUtilsNetworkError('dns down');
      const canceled = new HttpUtilsRequestCanceledError('user navigated away');

      // Assert
      expect(timeout.message).toBe('slow upstream');
      expect(network.message).toBe('dns down');
      expect(canceled.message).toBe('user navigated away');
    });

    it('derives the HttpUtilsResponseError message from the status and keeps status and body', () => {
      // Arrange & Act
      const error = new HttpUtilsResponseError(422, { field: 'email' });

      // Assert
      expect(error.name).toBe('HttpUtilsResponseError');
      expect(error.message).toBe('Request failed with status 422');
      expect(error.status).toBe(422);
      expect(error.body).toEqual({ field: 'email' });
    });

    it('keeps the four error classes mutually exclusive so callers can branch on instanceof', () => {
      // Arrange & Act
      const timeout = new HttpUtilsTimeoutError();

      // Assert
      expect(timeout).not.toBeInstanceOf(HttpUtilsNetworkError);
      expect(timeout).not.toBeInstanceOf(HttpUtilsRequestCanceledError);
      expect(timeout).not.toBeInstanceOf(HttpUtilsResponseError);
      expect(new HttpUtilsNetworkError()).not.toBeInstanceOf(HttpUtilsRequestCanceledError);
    });
  });

  describe('constructor baseUrl resolution', () => {
    it('resolves the base URL from process.env.API_URL when no baseUrl option is given', async () => {
      // Arrange
      vi.stubEnv('API_URL', 'http://env.test');
      const instance = new TestableHelper();
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await instance.exposedRequest('/foo', {});

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.url).toBe('http://env.test/foo');
    });

    it('prefers an explicit baseUrl option over process.env.API_URL', async () => {
      // Arrange
      vi.stubEnv('API_URL', 'http://env.test');
      const instance = new TestableHelper({ baseUrl: 'http://option.test' });
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await instance.exposedRequest('/foo', {});

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.url).toBe('http://option.test/foo');
    });

    it('rejects without ever calling fetch when neither baseUrl nor process.env.API_URL is set', async () => {
      // Arrange
      vi.stubEnv('API_URL', undefined);
      const instance = new TestableHelper();
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = instance.exposedRequest('/foo', {});

      // Assert
      await expect(act).rejects.toThrow(/Failed to parse URL/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignores the legacy NEXT_PUBLIC_API_URL variable and still resolves to an empty base URL', async () => {
      // Arrange
      vi.stubEnv('API_URL', undefined);
      vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://legacy.test');
      const instance = new TestableHelper();
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = instance.exposedRequest('/foo', {});

      // Assert
      await expect(act).rejects.toThrow(/Failed to parse URL/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('token cookie accessors', () => {
    it('writes the access token under the access token key with the default cookie options', async () => {
      // Arrange
      const expectedOptions = { path: '/', httpOnly: true, sameSite: 'strict', secure: false };

      // Act
      await helper.setAccessToken('token-123');

      // Assert
      expect(cookieUtils.set).toHaveBeenCalledWith('access_token', 'token-123', expectedOptions);
    });

    it('writes the refresh token under the refresh token key with the default cookie options', async () => {
      // Arrange
      const expectedOptions = { path: '/', httpOnly: true, sameSite: 'strict', secure: false };

      // Act
      await helper.setRefreshToken('refresh-123');

      // Assert
      expect(cookieUtils.set).toHaveBeenCalledWith('refresh_token', 'refresh-123', expectedOptions);
    });

    it('merges caller options over the default cookie options when writing a token', async () => {
      // Arrange
      const cookies = vi.fn() as unknown as CookiesFn;

      // Act
      await helper.setAccessToken('token-123', { cookies, sameSite: 'lax' });

      // Assert
      expect(cookieUtils.set).toHaveBeenCalledWith('access_token', 'token-123', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        cookies,
      });
    });

    it('reads each token back through cookieUtils without applying the write-side cookie options', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValueOnce('token-123');
      vi.mocked(cookieUtils.get).mockResolvedValueOnce('refresh-123');

      // Act
      const accessToken = await helper.getAccessToken();
      const refreshToken = await helper.getRefreshToken();

      // Assert
      expect(accessToken).toBe('token-123');
      expect(refreshToken).toBe('refresh-123');
      expect(cookieUtils.get).toHaveBeenNthCalledWith(1, 'access_token', undefined);
      expect(cookieUtils.get).toHaveBeenNthCalledWith(2, 'refresh_token', undefined);
    });

    it('returns undefined when a token cookie is absent', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue(undefined);

      // Act
      const result = await helper.getAccessToken();

      // Assert
      expect(result).toBeUndefined();
    });

    it('removes each token with the default cookie options so the delete matches the write', async () => {
      // Arrange
      const expectedOptions = { path: '/', httpOnly: true, sameSite: 'strict', secure: false };

      // Act
      await helper.removeAccessToken();
      await helper.removeRefreshToken();

      // Assert
      expect(cookieUtils.remove).toHaveBeenNthCalledWith(1, 'access_token', expectedOptions);
      expect(cookieUtils.remove).toHaveBeenNthCalledWith(2, 'refresh_token', expectedOptions);
    });

    it('honours a caller-overridden token key', async () => {
      // Arrange
      helper.accessTokenKey = 'custom_access_token';

      // Act
      await helper.setAccessToken('token-123');

      // Assert
      expect(cookieUtils.set).toHaveBeenCalledWith(
        'custom_access_token',
        'token-123',
        expect.anything(),
      );
    });
  });

  describe('buildUrl', () => {
    it('returns the url unchanged when no params are given', () => {
      // Arrange
      const url = '/foo?a=1';

      // Act
      const result = helper.exposedBuildUrl(url);

      // Assert
      expect(result).toBe('/foo?a=1');
    });

    it('merges params into an existing query string', () => {
      // Arrange
      const url = '/foo?a=1';

      // Act
      const result = helper.exposedBuildUrl(url, { b: '2' });

      // Assert
      expect(result).toBe('/foo?a=1&b=2');
    });

    it('overwrites a query param the url already carries rather than duplicating it', () => {
      // Arrange
      const url = '/foo?a=1';

      // Act
      const result = helper.exposedBuildUrl(url, { a: '2' });

      // Assert
      expect(result).toBe('/foo?a=2');
    });

    it('percent-encodes param values', () => {
      // Arrange
      const url = '/foo';

      // Act
      const result = helper.exposedBuildUrl(url, { q: 'a b&c' });

      // Assert
      expect(result).toBe('/foo?q=a+b%26c');
    });

    it('appends a trailing question mark when given an empty params object', () => {
      // Arrange
      const url = '/foo';

      // Act
      const result = helper.exposedBuildUrl(url, {});

      // Assert
      expect(result).toBe('/foo?');
    });
  });

  describe('request', () => {
    describe('baseURL and endpoint joining', () => {
      it('joins the base URL and endpoint the same way whether or not the endpoint has a leading slash', async () => {
        // Arrange
        const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(buildResponse('')));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('foo', {});
        await helper.exposedRequest('/foo', {});

        // Assert
        const [withoutSlash] = fetchMock.mock.calls[0] as [Request, unknown];
        const [withSlash] = fetchMock.mock.calls[1] as [Request, unknown];
        expect(withoutSlash.url).toBe('http://api.test/foo');
        expect(withSlash.url).toBe('http://api.test/foo');
      });

      it('normalizes a trailing slash on the base URL against a leading slash on the endpoint', async () => {
        // Arrange
        const trimmed = new TestableHelper({ baseUrl: 'http://api.test/', timeout: 5000 });
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await trimmed.exposedRequest('/foo', {});

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.url).toBe('http://api.test/foo');
      });
    });

    // Auth belongs to HttpUtilsAuth; the helper must stay out of it.
    describe('auth-free transport', () => {
      it('sends no Authorization header even when a token is stored', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', {});

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.has('Authorization')).toBe(false);
      });

      it('never reads the cookie store, even with withAuth left at its default', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', {});

        // Assert
        expect(cookieUtils.get).not.toHaveBeenCalled();
      });

      it('passes a caller-supplied Authorization header straight through', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', { headers: { Authorization: 'Bearer original' } });

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.get('Authorization')).toBe('Bearer original');
      });

      it('forwards caller headers unchanged', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', { headers: { 'X-Trace-Id': 'trace-1' } });

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.get('X-Trace-Id')).toBe('trace-1');
      });

      it('hands withAuth and cookies to the axios config so an interceptor can read them', async () => {
        // Arrange
        const cookies = vi.fn() as unknown as CookiesFn;
        const seen: Array<Record<string, unknown>> = [];
        const spy = vi.spyOn(helper.exposedAxiosInstance, 'request');
        spy.mockImplementation(async (config: unknown) => {
          seen.push(config as Record<string, unknown>);
          return { data: '' };
        });

        // Act
        await helper.exposedRequest('/foo', { cookies, withAuth: false });

        // Assert
        expect(seen[0]).toMatchObject({ withAuth: false, cookies });
        spy.mockRestore();
      });
    });

    describe('error mapping', () => {
      it('throws HttpUtilsResponseError carrying status and parsed body for a non-2xx response', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = helper.exposedRequest('/foo', {});

        // Assert
        await expect(act).rejects.toBeInstanceOf(HttpUtilsResponseError);
        await expect(act).rejects.toMatchObject({ status: 404, body: { error: 'not found' } });
      });

      it('throws HttpUtilsResponseError with the server status for a 500 response', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = helper.exposedRequest('/foo', {});

        // Assert
        await expect(act).rejects.toMatchObject({
          name: 'HttpUtilsResponseError',
          status: 500,
          body: { error: 'boom' },
        });
      });

      it('throws HttpUtilsNetworkError when the fetch layer rejects with a network TypeError', async () => {
        // Arrange
        const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = helper.exposedRequest('/foo', {});

        // Assert
        await expect(act).rejects.toBeInstanceOf(HttpUtilsNetworkError);
        await expect(act).rejects.toMatchObject({ message: 'Network Error' });
      });

      it('throws HttpUtilsTimeoutError when the axios fetch adapter times out', async () => {
        // Arrange
        const timingOut = new TestableHelper({ baseUrl: 'http://api.test', timeout: 20 });
        const fetchMock = abortAwareFetchMock();
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = timingOut.exposedRequest('/foo', {});

        // Assert
        await expect(act).rejects.toBeInstanceOf(HttpUtilsTimeoutError);
        await expect(act).rejects.toMatchObject({ message: 'Timeout Error' });
      }, 3000);

      it('throws HttpUtilsRequestCanceledError, not HttpUtilsTimeoutError, for a caller-initiated abort', async () => {
        // Arrange
        const controller = new AbortController();
        const fetchMock = abortAwareFetchMock();
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = helper.exposedRequest('/foo', { signal: controller.signal });
        controller.abort();

        // Assert
        await expect(act).rejects.toBeInstanceOf(HttpUtilsRequestCanceledError);
        await expect(act).rejects.not.toBeInstanceOf(HttpUtilsTimeoutError);
        await expect(act).rejects.toMatchObject({ message: 'Request Canceled Error' });
      }, 3000);

      it('rethrows an unrecognized failure untouched instead of coercing it into a typed error', async () => {
        // Arrange
        const fetchMock = vi.fn().mockRejectedValue(new Error('something unexpected'));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const act = helper.exposedRequest('/foo', {});

        // Assert
        await expect(act).rejects.toThrow('something unexpected');
        await expect(act).rejects.not.toBeInstanceOf(HttpUtilsNetworkError);
        await expect(act).rejects.not.toBeInstanceOf(HttpUtilsTimeoutError);
        await expect(act).rejects.not.toBeInstanceOf(HttpUtilsRequestCanceledError);
        await expect(act).rejects.not.toBeInstanceOf(HttpUtilsResponseError);
      });
    });

    describe('response body handling', () => {
      it('resolves to an empty string, not undefined, for an empty response body', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const result = await helper.exposedRequest('/foo', { method: 'DELETE' });

        // Assert
        expect(result).toBe('');
      });

      it('resolves to the parsed JSON payload for a JSON response', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1, name: 'bar' }));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        const result = await helper.exposedRequest<{ id: number; name: string }>('/foo', {});

        // Assert
        expect(result).toEqual({ id: 1, name: 'bar' });
      });
    });

    describe('fetch option forwarding', () => {
      it('forwards cache and next fetch options through to the underlying fetch call', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', {
          cache: 'no-store',
          next: { revalidate: 60, tags: ['tag-a'] },
        });

        // Assert
        const [, fetchOptions] = fetchMock.mock.calls[0] as [Request, Record<string, unknown>];
        expect(fetchOptions).toMatchObject({
          cache: 'no-store',
          next: { revalidate: 60, tags: ['tag-a'] },
        });
      });

      it('forwards referrerPolicy and priority fetch options through to the underlying fetch call', async () => {
        // Arrange
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await helper.exposedRequest('/foo', {
          referrerPolicy: 'no-referrer',
          priority: 'high',
        });

        // Assert
        const [, fetchOptions] = fetchMock.mock.calls[0] as [Request, Record<string, unknown>];
        expect(fetchOptions).toMatchObject({
          referrerPolicy: 'no-referrer',
          priority: 'high',
        });
      });

      it('keeps httpUtils-only options out of the forwarded fetch options', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);
        const cookies = vi.fn() as unknown as CookiesFn;

        // Act
        await helper.exposedRequest('/foo', { cookies, withAuth: true, cache: 'no-store' });

        // Assert
        const [, fetchOptions] = fetchMock.mock.calls[0] as [Request, Record<string, unknown>];
        expect(fetchOptions).not.toHaveProperty('cookies');
        expect(fetchOptions).not.toHaveProperty('withAuth');
        expect(fetchOptions).toMatchObject({ cache: 'no-store' });
      });
    });
  });
});
