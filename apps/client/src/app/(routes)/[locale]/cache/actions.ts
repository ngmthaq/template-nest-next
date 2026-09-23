'use server';

import { envUtils } from '@/shared/utils/envUtils';
import { httpUtils } from '@/shared/utils/httpUtils';
import { logUtils } from '@/shared/utils/logUtils';

import type { CacheActionResult } from './_components/CacheExplorer';
import { apiEndpoints } from './_constants/apiEndpoints';
import {
  type CacheDeleteResult,
  cacheDeleteResultSchema,
  type CacheEntry,
  cacheEntryListSchema,
} from './_schemas/cacheResponseSchema';

/** Search cached entries by glob pattern. Refuses to call the API in production. */
export async function searchCacheAction(pattern: string): Promise<CacheActionResult<CacheEntry[]>> {
  if (envUtils.isProduction()) {
    return { ok: false, error: 'production' };
  }
  try {
    const data = await httpUtils.get(
      apiEndpoints.get.cache,
      { pattern },
      {
        schema: cacheEntryListSchema,
      },
    );
    return { ok: true, data };
  } catch (error) {
    logUtils.error(error);
    return { ok: false, error: 'unexpected' };
  }
}

/** Delete one cache entry by exact key. Refuses to call the API in production. */
export async function deleteCacheAction(
  key: string,
): Promise<CacheActionResult<CacheDeleteResult>> {
  if (envUtils.isProduction()) {
    return { ok: false, error: 'production' };
  }
  try {
    const data = await httpUtils.delete(
      `${apiEndpoints.delete.cache}/${encodeURIComponent(key)}`,
      undefined,
      {
        schema: cacheDeleteResultSchema,
      },
    );
    return { ok: true, data };
  } catch (error) {
    logUtils.error(error);
    return { ok: false, error: 'unexpected' };
  }
}
