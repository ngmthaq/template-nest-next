export class HttpClientTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpClientTimeoutError';
  }
}

export class HttpClientResponseError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpClientResponseError';
    this.status = status;
    this.body = body;
  }
}

export interface HttpClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export class HttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    this.timeout = options.timeout ?? 60000; // Default timeout in milliseconds
  }

  private async request(url: string, options: RequestInit): Promise<Response> {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const endpoint = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const controller = new AbortController();

    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, this.timeout);

    try {
      return await fetch(fullUrl, { ...options, signal: controller.signal });
    } catch (error) {
      if (isTimedOut) throw new HttpClientTimeoutError('Request timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const body = text ? (JSON.parse(text) as unknown) : undefined;
    if (!response.ok) throw new HttpClientResponseError(response.status, body);
    return body as T;
  }

  private jsonOptions(options: RequestInit): RequestInit {
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
  }

  public async get<T>(
    url: string,
    params?: Record<string, string>,
    options: RequestInit = {},
  ): Promise<T> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params).toString()}` : url;
    const response = await this.request(urlWithParams, { ...options, method: 'GET' });
    return this.parse<T>(response);
  }

  public async post<T>(
    url: string,
    body?: Record<string, unknown>,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...this.jsonOptions(options),
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parse<T>(response);
  }

  public async postFormData<T>(
    url: string,
    formData: FormData,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
    });
    return this.parse<T>(response);
  }

  public async put<T>(
    url: string,
    body?: Record<string, unknown>,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...this.jsonOptions(options),
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parse<T>(response);
  }

  public async putFormData<T>(
    url: string,
    formData: FormData,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...options,
      method: 'PUT',
      body: formData,
    });
    return this.parse<T>(response);
  }

  public async patch<T>(
    url: string,
    body?: Record<string, unknown>,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...this.jsonOptions(options),
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parse<T>(response);
  }

  public async patchFormData<T>(
    url: string,
    formData: FormData,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(url, {
      ...options,
      method: 'PATCH',
      body: formData,
    });
    return this.parse<T>(response);
  }

  public async delete<T>(
    url: string,
    params?: Record<string, string>,
    options: RequestInit = {},
  ): Promise<T> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params).toString()}` : url;
    const response = await this.request(urlWithParams, { ...options, method: 'DELETE' });
    return this.parse<T>(response);
  }
}

export const httpClient = new HttpClient();
