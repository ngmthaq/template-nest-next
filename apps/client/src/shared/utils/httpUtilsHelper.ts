import 'server-only';

import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { CookiesFn, OptionsType } from 'cookies-next';
import * as Yup from 'yup';

import { cookieUtils } from './cookieUtils';

export interface HttpUtilsOptions {
  baseUrl?: string;
  timeout?: number;
}

/** Auth knobs, forwarded on the axios config for HttpUtilsAuth. */
export interface HttpUtilsAuthOptions {
  cookies?: CookiesFn;
  withAuth?: boolean;
}

export interface HttpUtilsRequestOptions<T = unknown>
  extends Omit<RequestInit, 'body'>, HttpUtilsAuthOptions {
  body?: RequestInit['body'] | Record<string, unknown>;
  /** Validates the response against this schema. Never reaches the axios config. */
  schema?: Yup.Schema<T>;
}

export class HttpUtilsTimeoutError extends Error {
  constructor(message: string = 'Timeout Error') {
    super(message);
    this.name = 'HttpUtilsTimeoutError';
  }
}

export class HttpUtilsNetworkError extends Error {
  constructor(message: string = 'Network Error') {
    super(message);
    this.name = 'HttpUtilsNetworkError';
  }
}

export class HttpUtilsRequestCanceledError extends Error {
  constructor(message: string = 'Request Canceled Error') {
    super(message);
    this.name = 'HttpUtilsRequestCanceledError';
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

/** A response failed schema validation. Carries only Yup's messages, never the raw body. */
export class HttpUtilsYupValidationError extends Error {
  public readonly errors: string[];

  constructor(errors: string[], message: string = 'Validation Error') {
    super(message);
    this.name = 'HttpUtilsYupValidationError';
    this.errors = errors;
  }
}

export class HttpUtilsHelper {
  public accessTokenKey = 'access_token';
  public refreshTokenKey = 'refresh_token';
  // `httpOnly` keeps the tokens out of `document.cookie` so an XSS cannot read them; nothing
  // in the browser needs them, since every read runs inside this server-only module.
  public tokenCookieOptions: OptionsType = {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  };

  protected readonly axiosInstance: AxiosInstance;

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

  protected buildUrl(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    const [path, query] = url.split('?');
    const search = new URLSearchParams(query);
    for (const [key, value] of Object.entries(params)) search.set(key, value);
    return `${path}?${search.toString()}`;
  }

  /** Validates `data` against `schema`, throwing `HttpUtilsYupValidationError` on a bad shape. */
  public async parse<T>(schema: Yup.Schema<T>, data: unknown): Promise<T> {
    return this.validate(schema, data);
  }

  protected async request<T>(url: string, options: HttpUtilsRequestOptions): Promise<T> {
    const { cookies, withAuth, method, body, signal, headers, schema, ...fetchOptions } = options;

    const requestHeaders: Record<string, string | null> = Object.fromEntries(
      new Headers(headers).entries(),
    );

    if (body instanceof FormData && !requestHeaders['content-type']) {
      requestHeaders['content-type'] = null;
    }

    const config: AxiosRequestConfig & HttpUtilsAuthOptions = {
      url,
      method,
      data: body,
      headers: requestHeaders,
      signal: signal ?? undefined,
      fetchOptions,
      withAuth,
      cookies,
    };

    try {
      const response = await this.axiosInstance.request(config);
      const data = response.data as T;
      return schema ? await this.validate(schema as Yup.Schema<T>, data) : data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ERR_NETWORK') {
        throw new HttpUtilsNetworkError();
      }
      if (axiosError.code === 'ERR_CANCELED') {
        throw new HttpUtilsRequestCanceledError();
      }
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw new HttpUtilsTimeoutError();
      }
      if (axiosError.response) {
        throw new HttpUtilsResponseError(axiosError.response.status, axiosError.response.data);
      }
      throw error;
    }
  }

  private cookieOptions(options?: OptionsType): OptionsType {
    return Object.assign({}, this.tokenCookieOptions, options ?? {});
  }

  private async validate<T>(schema: Yup.Schema<T>, data: unknown): Promise<T> {
    try {
      return await schema.validate(data, { stripUnknown: true, abortEarly: false });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        throw new HttpUtilsYupValidationError(error.errors);
      }
      throw error;
    }
  }
}
