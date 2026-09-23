import type { InferType } from 'yup';
import * as Yup from 'yup';

/** A single cache entry returned by `GET /cache?pattern=`. */
export const cacheEntrySchema = Yup.object({
  key: Yup.string().required(),
  value: Yup.mixed().nullable().defined(),
});

/** The list of entries returned by `GET /cache?pattern=`. */
export const cacheEntryListSchema = Yup.array(cacheEntrySchema).defined();

/** Result of deleting a single cache entry by exact key. */
export const cacheDeleteResultSchema = Yup.object({
  key: Yup.string().required(),
  deleted: Yup.boolean().required(),
});

export type CacheEntry = InferType<typeof cacheEntrySchema>;
export type CacheDeleteResult = InferType<typeof cacheDeleteResultSchema>;
