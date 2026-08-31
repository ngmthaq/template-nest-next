import { cacheTag, refresh, revalidatePath, revalidateTag, updateTag } from 'next/cache';

export type CachePathParams = Record<string, string | number | boolean | null | undefined>;

export type CacheProfile =
  | 'default'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'max'
  | 'api'
  | 'apiShort'
  | 'apiLong'
  | 'apiPrivate';

export interface CacheRevalidateOptions {
  params?: CachePathParams;
  profile?: CacheProfile | { expire: number };
}

export class CacheUtils {
  public tagPrefix = 'path';
  public maxTagLength = 256;
  public maxTagCount = 128;

  public normalize(path: string, params?: CachePathParams): string {
    const [rawPathname, rawQuery] = path.split('?');
    const segments = rawPathname.split('/').filter(Boolean);
    const pathname = `/${segments.join('/')}`;
    const search = new URLSearchParams(rawQuery);

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null) search.delete(key);
      else search.set(key, String(value));
    }

    search.sort();
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  public toTag(path: string, params?: CachePathParams): string {
    return `${this.tagPrefix}:${this.normalize(path, params)}`;
  }

  public toTags(path: string, params?: CachePathParams): string[] {
    const normalized = this.normalize(path, params);
    const [pathname] = normalized.split('?');
    const segments = pathname.split('/').filter(Boolean);
    const paths = ['/'];

    let current = '';
    for (const segment of segments) {
      current += `/${segment}`;
      paths.push(current);
    }
    if (normalized !== pathname) paths.push(normalized);

    return paths
      .map((value) => `${this.tagPrefix}:${value}`)
      .filter((tag) => tag.length <= this.maxTagLength)
      .slice(0, this.maxTagCount);
  }

  public tag(path: string, params?: CachePathParams): void {
    cacheTag(...this.toTags(path, params));
  }

  public revalidate(path: string, options: CacheRevalidateOptions = {}): void {
    revalidateTag(this.toTag(path, options.params), options.profile ?? 'max');
  }

  public update(path: string, params?: CachePathParams): void {
    updateTag(this.toTag(path, params));
  }

  public revalidateRoute(route: string, type?: 'page' | 'layout'): void {
    revalidatePath(route, type);
  }

  public refresh(): void {
    refresh();
  }
}

export const cacheUtils = new CacheUtils();
