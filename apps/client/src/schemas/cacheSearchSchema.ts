import type { useTranslations } from 'next-intl';
import type { InferType } from 'yup';
import * as Yup from 'yup';

/** Max length of the cache key pattern, matched by the input `maxLength` and the schema. */
export const MAX_CACHE_PATTERN_LENGTH = 200;

/** Builds the cache search form's validation schema from a `cache` namespace translator. */
export function createCacheSearchSchema(t: ReturnType<typeof useTranslations<'cache'>>) {
  return Yup.object({
    pattern: Yup.string()
      .required(t('formPatternRequired'))
      .max(MAX_CACHE_PATTERN_LENGTH, t('formPatternTooLong')),
  });
}

export type CacheSearchFormValues = InferType<ReturnType<typeof createCacheSearchSchema>>;
