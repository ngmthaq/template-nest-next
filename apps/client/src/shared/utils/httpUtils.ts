import 'server-only';

import { HttpUtilsHelper, type HttpUtilsRequestOptions } from './httpUtilsHelper';

export class HttpUtils extends HttpUtilsHelper {
  public get<T = unknown>(
    url: string,
    params?: Record<string, string>,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(this.buildUrl(url, params), { ...options, method: 'GET' });
  }

  public post<T = unknown>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  public postFormData<T = unknown>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body: formData });
  }

  public put<T = unknown>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  public putFormData<T = unknown>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body: formData });
  }

  public patch<T = unknown>(
    url: string,
    body?: Record<string, unknown>,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  public patchFormData<T = unknown>(
    url: string,
    formData: FormData,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: formData });
  }

  public delete<T = unknown>(
    url: string,
    params?: Record<string, string>,
    options: HttpUtilsRequestOptions<T> = {},
  ): Promise<T> {
    return this.request<T>(this.buildUrl(url, params), { ...options, method: 'DELETE' });
  }
}

/** No Authorization header — use `httpUtilsAuth` for authenticated calls. */
export const httpUtils = new HttpUtils();
