import { CanceledError } from 'axios';
import type { CookiesFn } from 'cookies-next';

import { cookieUtils } from './cookieUtils';
import {
  HttpUtils,
  type HttpUtilsRequestOptions,
  HttpUtilsResponseError,
  HttpUtilsTimeoutError,
} from './httpUtils';

vi.mock('./cookieUtils', () => ({
  cookieUtils: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

class TestableHttp extends HttpUtils {
  public exposedBuildUrl(url: string, params?: Record<string, string>): string {
    return this.buildUrl(url, params);
  }

  public exposedRequest<T>(url: string, options: HttpUtilsRequestOptions): Promise<T> {
    return this.request<T>(url, options);
  }
}

// Empirically verified against the installed axios@1.18.1 fetch adapter
// (node_modules/axios/lib/adapters/fetch.js) under this project's jsdom + Node test environment,
// where a global `Request` constructor is available: the adapter builds `resolvedOptions` (method,
// headers, body, signal, and the spread `fetchOptions` — cache/credentials/mode/redirect/keepalive
// /integrity/referrer), constructs `request = new Request(url, resolvedOptions)`, and then calls
// `fetch(request, fetchOptions)` — TWO arguments, not a single Request and not a (url, init) pair.
// Consequences confirmed by a throwaway probe spec (run and deleted, not part of this suite):
//   - `calls[0][0]` is a real `Request` — `.url`, `.method`, `.headers` (a real `Headers`, lower-
//     cased keys) and the body (read via `.clone().text()`) all reflect what httpUtils.ts sent.
//     Standard RequestInit keys such as `cache` land on the Request itself too.
//   - `calls[0][1]` is the raw `fetchOptions` object httpUtils.ts builds, verbatim. This is the
//     only place `next: { revalidate, tags }` survives, because `next` is a Next.js-only fetch
//     extension that `Request`'s constructor silently drops — this is the actual regression guard
//     for the fetch-adapter migration (see the 'forwards cache and next fetch options' test below).
//   - A timeout produces an `AxiosError` with `code === 'ETIMEDOUT'` (not `'ECONNABORTED'`).
//   - A caller-initiated `AbortController.abort()` produces axios's `CanceledError`
//     (`code === 'ERR_CANCELED'`), a distinct error class from the timeout `AxiosError`.
//   - When `baseURL` resolves to `''` and the endpoint is a bare relative path (no leading
//     `http(s)://`), `new Request(url, ...)` throws synchronously ("Failed to parse URL from
//     /foo") before `fetch` is ever invoked — this environment's `Request` implementation requires
//     an absolute URL. This is real, observed adapter behaviour, not a mock artifact.

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

describe('HttpUtilsHelper / HttpUtils', () => {
  let http: TestableHttp;

  beforeEach(() => {
    http = new TestableHttp({ baseUrl: 'http://api.test', timeout: 5000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('constructor baseUrl resolution', () => {
    it('resolves the base URL from process.env.API_URL when no baseUrl option is given', async () => {
      // Arrange
      vi.stubEnv('API_URL', 'http://env.test');
      const instance = new TestableHttp();
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
      const instance = new TestableHttp({ baseUrl: 'http://option.test' });
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
      const instance = new TestableHttp();
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
      const instance = new TestableHttp();
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = instance.exposedRequest('/foo', {});

      // Assert
      await expect(act).rejects.toThrow(/Failed to parse URL/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('buildUrl', () => {
    it('returns the url unchanged when no params are given', () => {
      // Arrange
      const url = '/foo?a=1';

      // Act
      const result = http.exposedBuildUrl(url);

      // Assert
      expect(result).toBe('/foo?a=1');
    });

    it('merges params into an existing query string', () => {
      // Arrange
      const url = '/foo?a=1';

      // Act
      const result = http.exposedBuildUrl(url, { b: '2' });

      // Assert
      expect(result).toBe('/foo?a=1&b=2');
    });
  });

  describe('request', () => {
    describe('baseURL and endpoint joining', () => {
      it('joins the base URL and endpoint the same way whether or not the endpoint has a leading slash', async () => {
        // Arrange
        const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(buildResponse('')));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await http.exposedRequest('foo', {});
        await http.exposedRequest('/foo', {});

        // Assert
        const [withoutSlash] = fetchMock.mock.calls[0] as [Request, unknown];
        const [withSlash] = fetchMock.mock.calls[1] as [Request, unknown];
        expect(withoutSlash.url).toBe('http://api.test/foo');
        expect(withSlash.url).toBe('http://api.test/foo');
      });

      it('normalizes a trailing slash on the base URL against a leading slash on the endpoint', async () => {
        // Arrange
        const trimmed = new TestableHttp({ baseUrl: 'http://api.test/', timeout: 5000 });
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await trimmed.exposedRequest('/foo', {});

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.url).toBe('http://api.test/foo');
      });
    });

    describe('Authorization header injection', () => {
      it('attaches a Bearer token when withAuth defaults true and a token exists', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await http.exposedRequest('/foo', {});

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.get('Authorization')).toBe('Bearer token-123');
      });

      it('does not attach an Authorization header when withAuth is false', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await http.exposedRequest('/foo', { withAuth: false });

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.has('Authorization')).toBe(false);
        expect(cookieUtils.get).not.toHaveBeenCalled();
      });

      it('never overwrites an Authorization header the caller already supplied', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);

        // Act
        await http.exposedRequest('/foo', { headers: { Authorization: 'Bearer original' } });

        // Assert
        const [request] = fetchMock.mock.calls[0] as [Request, unknown];
        expect(request.headers.get('Authorization')).toBe('Bearer original');
        expect(cookieUtils.get).not.toHaveBeenCalled();
      });

      it('forwards the caller-supplied cookies function to getAccessToken', async () => {
        // Arrange
        vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
        const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
        vi.stubGlobal('fetch', fetchMock);
        const cookies = vi.fn() as unknown as CookiesFn;

        // Act
        await http.exposedRequest('/foo', { cookies });

        // Assert
        expect(cookieUtils.get).toHaveBeenCalledWith('access_token', { cookies });
      });
    });
  });

  describe('error mapping', () => {
    it('throws HttpUtilsResponseError carrying status and parsed body for a non-2xx response', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = http.exposedRequest('/foo', {});

      // Assert
      await expect(act).rejects.toBeInstanceOf(HttpUtilsResponseError);
      await expect(act).rejects.toMatchObject({ status: 404, body: { error: 'not found' } });
    });

    it('throws HttpUtilsTimeoutError when the axios fetch adapter times out', async () => {
      // Arrange
      const timingOut = new TestableHttp({ baseUrl: 'http://api.test', timeout: 20 });
      const fetchMock = vi.fn().mockImplementation(
        (request: Request) =>
          new Promise((_resolve, reject) => {
            request.signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = timingOut.exposedRequest('/foo', {});

      // Assert
      await expect(act).rejects.toBeInstanceOf(HttpUtilsTimeoutError);
    }, 3000);

    it('surfaces a caller-initiated abort as axios CanceledError, never as HttpUtilsTimeoutError', async () => {
      // Arrange
      const controller = new AbortController();
      const fetchMock = vi.fn().mockImplementation(
        (request: Request) =>
          new Promise((_resolve, reject) => {
            request.signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = http.exposedRequest('/foo', { signal: controller.signal });
      controller.abort();

      // Assert
      await expect(act).rejects.toBeInstanceOf(CanceledError);
      await expect(act).rejects.not.toBeInstanceOf(HttpUtilsTimeoutError);
    }, 3000);
  });

  describe('empty body handling', () => {
    it('resolves to an empty string, not undefined, for a request with an empty response body', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const result = await http.delete('/foo');

      // Assert
      expect(result).toBe('');
    });
  });

  describe('verbs', () => {
    it('get merges params into the URL, issues a GET request, and parses the JSON response', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: 'ok' }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const result = await http.get<{ data: string }>('/foo', { page: '2' });

      // Assert
      expect(result).toEqual({ data: 'ok' });
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.url).toBe('http://api.test/foo?page=2');
      expect(request.method).toBe('GET');
    });

    it('post sends a JSON-serialized body with the Content-Type header set', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.post('/foo', { name: 'bar' });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('POST');
      expect(request.headers.get('Content-Type')).toBe('application/json');
      await expect(request.clone().text()).resolves.toBe('{"name":"bar"}');
    });

    it('put sends a JSON-serialized body with the Content-Type header set', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.put('/foo', { name: 'bar' });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('PUT');
      expect(request.headers.get('Content-Type')).toBe('application/json');
      await expect(request.clone().text()).resolves.toBe('{"name":"bar"}');
    });

    it('patch sends a JSON-serialized body with the Content-Type header set', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.patch('/foo', { name: 'bar' });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('PATCH');
      expect(request.headers.get('Content-Type')).toBe('application/json');
      await expect(request.clone().text()).resolves.toBe('{"name":"bar"}');
    });

    it('lets a caller-supplied Content-Type override the axios default on a JSON post', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.post(
        '/foo',
        { name: 'bar' },
        { headers: { 'Content-Type': 'application/vnd.api+json' } },
      );

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      // Empirically verified: axios still JSON-serializes the plain-object body even when the
      // caller overrides Content-Type — only the header itself is left untouched.
      expect(request.headers.get('Content-Type')).toBe('application/vnd.api+json');
      await expect(request.clone().text()).resolves.toBe('{"name":"bar"}');
    });

    it('sends a bodyless post without failing', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = http.post('/foo');

      // Assert
      await expect(act).resolves.toEqual({});
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('POST');
      // Empirically verified: with no body, axios never reaches its JSON transform and falls
      // back to its own default POST Content-Type, sending an empty string body.
      expect(request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      await expect(request.clone().text()).resolves.toBe('');
    });

    it('delete merges params into the URL and issues a DELETE request', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.delete('/foo', { id: '9' });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.url).toBe('http://api.test/foo?id=9');
      expect(request.method).toBe('DELETE');
    });

    it('postFormData sends the FormData instance as the body without an explicit Content-Type', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);
      const formData = new FormData();
      formData.append('file', 'content');

      // Act
      await http.postFormData('/foo', formData);

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('POST');
      // The fetch layer (not httpUtils) sets this header — the boundary proves no explicit
      // Content-Type was sent, since axios strips any caller-supplied multipart Content-Type
      // that lacks a boundary so fetch can generate its own.
      expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
    });

    it('putFormData sends the FormData instance as the body without an explicit Content-Type', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);
      const formData = new FormData();
      formData.append('file', 'content');

      // Act
      await http.putFormData('/foo', formData);

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('PUT');
      expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
    });

    it('patchFormData sends the FormData instance as the body without an explicit Content-Type', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);
      const formData = new FormData();
      formData.append('file', 'content');

      // Act
      await http.patchFormData('/foo', formData);

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe('PATCH');
      expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
    });

    it('forwards cache and next fetch options through to the underlying fetch call', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.get('/foo', undefined, {
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
      await http.get('/foo', undefined, {
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
  });
});
