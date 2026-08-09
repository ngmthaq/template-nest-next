import type { CookiesFn, OptionsType } from 'cookies-next';

import { cookieService } from './cookieService';

export class HttpServiceTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpServiceTimeoutError';
  }
}

export class HttpServiceResponseError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpServiceResponseError';
    this.status = status;
    this.body = body;
  }
}

export interface HttpServiceOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface HttpServiceRequestOptions extends RequestInit {
  cookies?: CookiesFn;
  withAuth?: boolean;
}

export class HttpService {
  public accessTokenKey = 'access_token';
  public refreshTokenKey = 'refresh_token';
  public tokenCookieOptions: OptionsType = {
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  };

  private baseUrl: string;
  private timeout: number;

  constructor(options: HttpServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '';
    this.timeout = options.timeout ?? 60000; // Default timeout in milliseconds
  }

  public async setAccessToken(token: string, options?: OptionsType): Promise<void> {
    await cookieService.set(this.accessTokenKey, token, this.cookieOptions(options));
  }

  public async getAccessToken(options?: OptionsType): Promise<string | undefined> {
    return cookieService.get(this.accessTokenKey, options);
  }

  public async removeAccessToken(options?: OptionsType): Promise<void> {
    await cookieService.remove(this.accessTokenKey, this.cookieOptions(options));
  }

  public async setRefreshToken(token: string, options?: OptionsType): Promise<void> {
    await cookieService.set(this.refreshTokenKey, token, this.cookieOptions(options));
  }

  public async getRefreshToken(options?: OptionsType): Promise<string | undefined> {
    return cookieService.get(this.refreshTokenKey, options);
  }

  public async removeRefreshToken(options?: OptionsType): Promise<void> {
    await cookieService.remove(this.refreshTokenKey, this.cookieOptions(options));
  }

  private cookieOptions(options?: OptionsType): OptionsType {
    return Object.assign({}, this.tokenCookieOptions, options ?? {});
  }

  private buildUrl(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    const [path, query] = url.split('?');
    const search = new URLSearchParams(query);
    for (const [key, value] of Object.entries(params)) search.set(key, value);
    return `${path}?${search.toString()}`;
  }

  private async request(url: string, options: HttpServiceRequestOptions): Promise<Response> {
    const { cookies, withAuth = true, ...init } = options;
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const endpoint = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const controller = new AbortController();

    const headers = new Headers(init.headers);
    if (withAuth && !headers.has('Authorization')) {
      const token = await this.getAccessToken(cookies ? { cookies } : undefined);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, this.timeout);

    const callerSignal = init.signal;
    const onCallerAbort = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) controller.abort(callerSignal.reason);
    else callerSignal?.addEventListener('abort', onCallerAbort, { once: true });

    try {
      return await fetch(fullUrl, { ...init, headers, signal: controller.signal });
    } catch (error) {
      if (isTimedOut) throw new HttpServiceTimeoutError('Request timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener('abort', onCallerAbort);
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    const text = await response.text();

    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }

    if (!response.ok) throw new HttpServiceResponseError(response.status, body);
    return body as T;
  }

  private jsonOptions(options: HttpServiceRequestOptions): HttpServiceRequestOptions {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return { ...options, headers };
  }

  public async get<T>(
    url: string,
    params?: Record<string, string>,
    options: HttpServiceRequestOptions = {},
  ): Promise<T> {
    const urlWithParams = this.buildUrl(url, params);
    const response = await this.request(urlWithParams, { ...options, method: 'GET' });
    return this.parse<T>(response);
  }

  public async post<T>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
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
    options: HttpServiceRequestOptions = {},
  ): Promise<T> {
    const urlWithParams = this.buildUrl(url, params);
    const response = await this.request(urlWithParams, { ...options, method: 'DELETE' });
    return this.parse<T>(response);
  }
}

export const httpService = new HttpService();
