import 'server-only';

import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { HttpUtils } from './httpUtils';
import type { HttpUtilsAuthOptions, HttpUtilsOptions } from './httpUtilsHelper';

type HttpUtilsAuthRequestConfig = InternalAxiosRequestConfig & HttpUtilsAuthOptions;

/** HttpUtils with token injection via axios interceptors. */
export class HttpUtilsAuth extends HttpUtils {
  constructor(options: HttpUtilsOptions = {}) {
    super(options);

    // Arrow wrappers keep `this` bound.
    this.axiosInstance.interceptors.request.use(
      (config) => this.onRequest(config),
      (error) => this.onRequestError(error),
    );
    this.axiosInstance.interceptors.response.use(
      (response) => this.onResponse(response),
      (error) => this.onResponseError(error),
    );
  }

  protected async onRequest(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    const { withAuth = true, cookies } = config as HttpUtilsAuthRequestConfig;
    if (!withAuth || config.headers.has('Authorization')) return config;

    const token = await this.getAccessToken(cookies ? { cookies } : undefined);
    if (token) config.headers.set('Authorization', `Bearer ${token}`);

    return config;
  }

  protected onRequestError(error: AxiosError): Promise<never> {
    return Promise.reject(error);
  }

  protected onResponse(response: AxiosResponse): AxiosResponse {
    return response;
  }

  protected onResponseError(error: AxiosError): Promise<never> {
    return Promise.reject(error);
  }
}

export const httpUtilsAuth = new HttpUtilsAuth();
