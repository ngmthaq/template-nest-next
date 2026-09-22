import { cookieUtils } from './cookieUtils';
import { HttpUtils, httpUtils } from './httpUtils';
import { HttpUtilsHelper, HttpUtilsResponseError } from './httpUtilsHelper';

vi.mock('./cookieUtils', () => ({
  cookieUtils: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// axios calls `fetch(request, fetchOptions)`; this suite reads only the `Request`.

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

describe('HttpUtils', () => {
  let http: HttpUtils;

  beforeEach(() => {
    http = new HttpUtils({ baseUrl: 'http://api.test', timeout: 5000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('module surface', () => {
    it('builds on HttpUtilsHelper so token and request behaviour is inherited, not duplicated', () => {
      // Arrange & Act
      const instance = new HttpUtils();

      // Assert
      expect(instance).toBeInstanceOf(HttpUtilsHelper);
    });

    it('exports a ready-to-use singleton instance', () => {
      // Arrange & Act & Assert
      expect(httpUtils).toBeInstanceOf(HttpUtils);
    });

    it('sends no Authorization header, since auth lives in the HttpUtilsAuth subclass', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.get('/foo');

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.headers.has('Authorization')).toBe(false);
    });
  });

  describe('get', () => {
    it('merges params into the URL, issues a GET request, and parses the JSON response', async () => {
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

    it('leaves the URL untouched when no params are given', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.get('/foo');

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.url).toBe('http://api.test/foo');
    });

    it('propagates the helper error mapping for a failed GET', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'nope' }, 403));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const act = http.get('/foo');

      // Assert
      await expect(act).rejects.toBeInstanceOf(HttpUtilsResponseError);
      await expect(act).rejects.toMatchObject({ status: 403 });
    });

    it('passes request options such as withAuth through to the helper', async () => {
      // Arrange
      vi.mocked(cookieUtils.get).mockResolvedValue('token-123');
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      await http.get('/foo', undefined, { withAuth: false });

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.headers.has('Authorization')).toBe(false);
    });
  });

  describe('post', () => {
    it('sends a JSON-serialized body with the Content-Type header set', async () => {
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
      // axios still JSON-serializes the body; only the header changes.
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
      // No body: axios skips its JSON transform, uses its default POST Content-Type.
      expect(request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      await expect(request.clone().text()).resolves.toBe('');
    });
  });

  describe('put', () => {
    it('sends a JSON-serialized body with the Content-Type header set', async () => {
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
  });

  describe('patch', () => {
    it('sends a JSON-serialized body with the Content-Type header set', async () => {
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
  });

  describe('delete', () => {
    it('merges params into the URL and issues a DELETE request', async () => {
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

    it('resolves to an empty string, not undefined, for an empty response body', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(buildResponse(''));
      vi.stubGlobal('fetch', fetchMock);

      // Act
      const result = await http.delete('/foo');

      // Assert
      expect(result).toBe('');
    });
  });

  describe('form data verbs', () => {
    // A boundary can only come from fetch, so no Content-Type was sent.
    it.each([
      ['postFormData', 'POST'],
      ['putFormData', 'PUT'],
      ['patchFormData', 'PATCH'],
    ] as const)('%s sends the FormData instance as the body as a %s', async (verb, method) => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);
      const formData = new FormData();
      formData.append('file', 'content');

      // Act
      await http[verb]('/foo', formData);

      // Assert
      const [request] = fetchMock.mock.calls[0] as [Request, unknown];
      expect(request.method).toBe(method);
      expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
      await expect(request.clone().text()).resolves.toContain('name="file"');
    });
  });
});
