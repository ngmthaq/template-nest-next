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

  public exposedRequest(url: string, options: HttpUtilsRequestOptions): Promise<Response> {
    return this.request(url, options);
  }

  public exposedParse<T>(response: Response): Promise<T> {
    return this.parse<T>(response);
  }

  public exposedJsonOptions(options: HttpUtilsRequestOptions): HttpUtilsRequestOptions {
    return this.jsonOptions(options);
  }
}

function buildResponse(overrides: Partial<Response> & { text: () => Promise<string> }): Response {
  return {
    ok: true,
    status: 200,
    ...overrides,
  } as Response;
}

describe('HttpUtilsHelper / HttpUtils', () => {
  let http: TestableHttp;

  beforeEach(() => {
    http = new TestableHttp({ baseUrl: 'http://api.test', timeout: 5000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  describe('parse', () => {
    it('resolves undefined for an empty response body', async () => {
      // Arrange
      const response = buildResponse({ text: () => Promise.resolve('') });

      // Act
      const result = await http.exposedParse(response);

      // Assert
      expect(result).toBeUndefined();
    });

    it('resolves the parsed value for a valid JSON body', async () => {
      // Arrange
      const response = buildResponse({ text: () => Promise.resolve('{"a":1}') });

      // Act
      const result = await http.exposedParse<{ a: number }>(response);

      // Assert
      expect(result).toEqual({ a: 1 });
    });

    it('resolves the raw text for a non-JSON body', async () => {
      // Arrange
      const response = buildResponse({ text: () => Promise.resolve('not-json') });

      // Act
      const result = await http.exposedParse(response);

      // Assert
      expect(result).toBe('not-json');
    });

    it('throws HttpUtilsResponseError carrying status and body for a non-ok response', async () => {
      // Arrange
      const response = buildResponse({
        ok: false,
        status: 404,
        text: () => Promise.resolve('{"error":"not found"}'),
      });

      // Act
      const act = http.exposedParse(response);

      // Assert
      await expect(act).rejects.toBeInstanceOf(HttpUtilsResponseError);
      await expect(act).rejects.toMatchObject({ status: 404, body: { error: 'not found' } });
    });
  });

  describe('jsonOptions', () => {
    it('sets the Content-Type header when it is absent', () => {
      // Arrange
      const options: HttpUtilsRequestOptions = {};

      // Act
      const result = http.exposedJsonOptions(options);

      // Assert
      expect(new Headers(result.headers).get('Content-Type')).toBe('application/json');
    });

    it('leaves an existing Content-Type header untouched', () => {
      // Arrange
      const options: HttpUtilsRequestOptions = { headers: { 'Content-Type': 'text/plain' } };

      // Act
      const result = http.exposedJsonOptions(options);

      // Assert
      expect(new Headers(result.headers).get('Content-Type')).toBe('text/plain');
    });
  });

  describe('request', () => {
    it('trims a trailing slash from the base URL', async () => {
      // Arrange
      const trimmed = new TestableHttp({ baseUrl: 'http://api.test/', timeout: 5000 });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await trimmed.exposedRequest('/foo', {});

      // Assert
      expect(fetchMock).toHaveBeenCalledWith('http://api.test/foo', expect.anything());
    });

    it('normalizes an endpoint missing a leading slash', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.exposedRequest('foo', {});

      // Assert
      expect(fetchMock).toHaveBeenCalledWith('http://api.test/foo', expect.anything());
    });

    it('injects a Bearer token when withAuth defaults true and no Authorization header is present', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.exposedRequest('/foo', {});

      // Assert
      const [, init] = fetchMock.mock.calls[0];
      expect((init.headers as Headers).get('Authorization')).toBe('Bearer token-123');
    });

    it('does not overwrite an Authorization header already present', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.exposedRequest('/foo', { headers: { Authorization: 'Bearer original' } });

      // Assert
      const [, init] = fetchMock.mock.calls[0];
      expect((init.headers as Headers).get('Authorization')).toBe('Bearer original');
      expect(cookieUtils.get).not.toHaveBeenCalled();
    });

    it('throws HttpUtilsTimeoutError instead of a bare AbortError when the request times out', async () => {
      // Arrange
      vi.useFakeTimers();
      const timingOut = new TestableHttp({ baseUrl: 'http://api.test', timeout: 1000 });
      const fetchMock = vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const promise = timingOut.exposedRequest('/foo', {});
      const assertion = expect(promise).rejects.toBeInstanceOf(HttpUtilsTimeoutError);
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      await assertion;
    });

    it('forwards an already-aborted caller signal to the underlying fetch call', async () => {
      // Arrange
      const controller = new AbortController();
      controller.abort('caller-cancelled');
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.exposedRequest('/foo', { signal: controller.signal });

      // Assert
      const [, init] = fetchMock.mock.calls[0];
      expect((init.signal as AbortSignal).aborted).toBe(true);
    });

    it('removes the caller abort listener in the finally block after the request settles', async () => {
      // Arrange
      const controller = new AbortController();
      const removeEventListenerSpy = vi.spyOn(controller.signal, 'removeEventListener');
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.exposedRequest('/foo', { signal: controller.signal });

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('verbs', () => {
    it('get merges params into the URL and parses the JSON response', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('{"data":"ok"}') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const result = await http.get<{ data: string }>('/foo', { page: '2' });

      // Assert
      expect(result).toEqual({ data: 'ok' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/foo?page=2',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('post sends a JSON-serialized body with the Content-Type header set', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('{}') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.post('/foo', { name: 'bar' });

      // Assert
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.body).toBe('{"name":"bar"}');
      expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    });

    it('postFormData sends the FormData instance directly as the body', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('{}') }));
      vi.stubGlobal('fetch', fetchMock);
      const formData = new FormData();
      formData.append('file', 'content');

      // Act
      await http.postFormData('/foo', formData);

      // Assert
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.body).toBe(formData);
    });

    it('delete merges params into the URL and issues a DELETE request', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValue(buildResponse({ text: () => Promise.resolve('{}') }));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.delete('/foo', { id: '9' });

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/foo?id=9',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
