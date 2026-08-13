import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { Cache } from 'cache-manager';

/** A single cache entry returned by a search. */
export class CacheEntry {
  @ApiProperty({ example: 'user:42', description: 'The cache key.' })
  key!: string;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'The cached value (arbitrary JSON).',
  })
  value!: unknown;
}

/** Result of deleting a single cache entry by key. */
export class CacheDeleteResult {
  @ApiProperty({
    example: 'user:42',
    description: 'The key that was targeted.',
  })
  key!: string;

  @ApiProperty({
    example: true,
    description: 'True when an entry existed and was removed.',
  })
  deleted!: boolean;
}

/**
 * Business logic for the cache administration endpoints.
 *
 * Reads and mutates the global `CACHE_MANAGER` (registered in `CoreModule`).
 * Key enumeration is done by iterating each underlying Keyv store — the
 * standard cache-manager interface has no `keys()` method, but every store
 * backed by an iterable adapter (including the Redis store) exposes an async
 * `iterator()` yielding `[key, value]` pairs.
 */
@Injectable()
export class CacheService {
  /** Maximum accepted pattern length, as a cheap bound on input size. */
  private static readonly MAX_PATTERN_LENGTH = 200;

  public constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Search cached entries whose key matches the given glob pattern.
   * Returns every matching entry as a `{ key, value }` pair.
   */
  public async search(pattern: string): Promise<CacheEntry[]> {
    const matches = this.compileMatcher(pattern);
    const entries: CacheEntry[] = [];
    const seen = new Set<string>();

    for (const store of this.cache.stores) {
      if (typeof store.iterator !== 'function') {
        continue;
      }
      for await (const [key, value] of store.iterator(undefined)) {
        if (typeof key !== 'string' || seen.has(key)) {
          continue;
        }
        if (matches(key)) {
          seen.add(key);
          entries.push({ key, value });
        }
      }
    }

    return entries;
  }

  /**
   * Delete a single cache entry by its exact key.
   *
   * Returns `true` only when an entry actually existed and was removed. The
   * existence check is explicit because cache-manager's `del()` resolves to
   * `true` even for keys that were never present.
   */
  public async delete(key: string): Promise<boolean> {
    const existed = (await this.cache.get(key)) !== undefined;
    await this.cache.del(key);
    return existed;
  }

  /**
   * Compile the user-supplied glob pattern into a predicate that tests a key
   * for a full-string (anchored) match.
   *
   * Glob syntax: `*` matches any run of characters, including none; `?`
   * matches exactly one character; every other character matches itself
   * literally. There are no character classes, no brace expansion, and no
   * escaping. Matching uses an iterative two-pointer scan with a remembered
   * star position — the standard linear-ish wildcard algorithm — so it has
   * no backtracking state and cannot be driven into catastrophic runtime
   * regardless of input.
   */
  private compileMatcher(pattern: string): (key: string) => boolean {
    if (!pattern) {
      throw new BadRequestException('A "pattern" query parameter is required.');
    }
    if (pattern.length > CacheService.MAX_PATTERN_LENGTH) {
      throw new BadRequestException(
        `Pattern exceeds the maximum allowed length of ${CacheService.MAX_PATTERN_LENGTH} characters.`,
      );
    }

    return (key: string): boolean => {
      let patternIndex = 0;
      let keyIndex = 0;
      let starPatternIndex = -1;
      let starKeyIndex = -1;

      while (keyIndex < key.length) {
        const patternChar = pattern[patternIndex];
        if (patternIndex < pattern.length && patternChar === '*') {
          starPatternIndex = patternIndex;
          starKeyIndex = keyIndex;
          patternIndex++;
        } else if (
          patternIndex < pattern.length &&
          (patternChar === '?' || patternChar === key[keyIndex])
        ) {
          patternIndex++;
          keyIndex++;
        } else if (starPatternIndex !== -1) {
          patternIndex = starPatternIndex + 1;
          starKeyIndex++;
          keyIndex = starKeyIndex;
        } else {
          return false;
        }
      }

      while (patternIndex < pattern.length && pattern[patternIndex] === '*') {
        patternIndex++;
      }

      return patternIndex === pattern.length;
    };
  }
}
