import 'server-only';

import { HttpUtilsHelper, type HttpUtilsRequestOptions } from './httpUtilsHelper';

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

/** No Authorization header — use `httpUtilsAuth` for authenticated calls. */
export const httpUtils = new HttpUtils();
