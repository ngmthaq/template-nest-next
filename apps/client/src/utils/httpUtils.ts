import 'server-only';

import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';
import type { CookiesFn, OptionsType } from 'cookies-next';

import { cookieUtils } from './cookieUtils';

export interface HttpUtilsOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface HttpUtilsRequestOptions extends Omit<RequestInit, 'body'> {
  cookies?: CookiesFn;
  withAuth?: boolean;
  body?: RequestInit['body'] | Record<string, unknown>;
}

export class HttpUtilsTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpUtilsTimeoutError';
  }
}

export class HttpUtilsResponseError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpUtilsResponseError';
    this.status = status;
    this.body = body;
  }
}

export class HttpUtilsHelper {
  public accessTokenKey = 'access_token';
  public refreshTokenKey = 'refresh_token';
  public tokenCookieOptions: OptionsType = {
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  };

  private readonly axiosInstance: AxiosInstance;

  constructor(options: HttpUtilsOptions = {}) {
    this.axiosInstance = axios.create({
      adapter: 'fetch',
      baseURL: options.baseUrl ?? process.env.API_URL ?? '',
      timeout: options.timeout ?? 60000, // Default timeout in milliseconds
    });
  }

  public async setAccessToken(token: string, options?: OptionsType): Promise<void> {
    await cookieUtils.set(this.accessTokenKey, token, this.cookieOptions(options));
  }

  public async getAccessToken(options?: OptionsType): Promise<string | undefined> {
    return cookieUtils.get(this.accessTokenKey, options);
  }

  public async removeAccessToken(options?: OptionsType): Promise<void> {
    await cookieUtils.remove(this.accessTokenKey, this.cookieOptions(options));
  }

  public async setRefreshToken(token: string, options?: OptionsType): Promise<void> {
    await cookieUtils.set(this.refreshTokenKey, token, this.cookieOptions(options));
  }

  public async getRefreshToken(options?: OptionsType): Promise<string | undefined> {
    return cookieUtils.get(this.refreshTokenKey, options);
  }

  public async removeRefreshToken(options?: OptionsType): Promise<void> {
    await cookieUtils.remove(this.refreshTokenKey, this.cookieOptions(options));
  }

  private cookieOptions(options?: OptionsType): OptionsType {
    return Object.assign({}, this.tokenCookieOptions, options ?? {});
  }

  protected buildUrl(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    const [path, query] = url.split('?');
    const search = new URLSearchParams(query);
    for (const [key, value] of Object.entries(params)) search.set(key, value);
    return `${path}?${search.toString()}`;
  }

  protected async request<T>(url: string, options: HttpUtilsRequestOptions): Promise<T> {
    const { cookies, withAuth = true, method, body, signal, headers, ...fetchOptions } = options;

    const requestHeaders = new Headers(headers);
    if (withAuth && !requestHeaders.has('Authorization')) {
      const token = await this.getAccessToken(cookies ? { cookies } : undefined);
      if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await this.axiosInstance.request({
        url,
        method,
        data: body,
        headers: Object.fromEntries(requestHeaders.entries()),
        signal: signal ?? undefined,
        fetchOptions,
      });
      return response.data as T;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw new HttpUtilsTimeoutError('Request timed out');
      }
      if (axiosError.response) {
        throw new HttpUtilsResponseError(axiosError.response.status, axiosError.response.data);
      }
      throw error;
    }
  }
}

export class HttpUtils extends HttpUtilsHelper {
  public get<T>(
    url: string,
    params?: Record<string, string>,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(this.buildUrl(url, params), { ...options, method: 'GET' });
  }

  public post<T>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  public postFormData<T>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body: formData });
  }

  public put<T>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  public putFormData<T>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body: formData });
  }

  public patch<T>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  public patchFormData<T>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: formData });
  }

  public delete<T>(
    url: string,
    params?: Record<string, string>,
    options: HttpUtilsRequestOptions = {},
  ): Promise<T> {
    return this.request<T>(this.buildUrl(url, params), { ...options, method: 'DELETE' });
  }
}

export const httpUtils = new HttpUtils();
