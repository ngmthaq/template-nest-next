import {
  deleteCookie,
  getCookie,
  getCookies,
  hasCookie,
  type OptionsType,
  setCookie,
  type TmpCookiesObj,
} from 'cookies-next';

export class CookieService {
  public async getAll(options?: OptionsType): Promise<TmpCookiesObj> {
    return (await getCookies(options)) ?? {};
  }

  public async get(key: string, options?: OptionsType): Promise<string | undefined> {
    return await getCookie(key, options);
  }

  public async getJson<T>(key: string, options?: OptionsType): Promise<T | undefined> {
    const value = await this.get(key, options);
    if (value === undefined) return undefined;

    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  public async set(key: string, value: string, options?: OptionsType): Promise<void> {
    await setCookie(key, value, options);
  }

  public async setJson<T>(key: string, value: T, options?: OptionsType): Promise<void> {
    await setCookie(key, JSON.stringify(value), options);
  }

  public async has(key: string, options?: OptionsType): Promise<boolean> {
    return await hasCookie(key, options);
  }

  public async remove(key: string, options?: OptionsType): Promise<void> {
    await deleteCookie(key, options);
  }
}

export const cookieService = new CookieService();
