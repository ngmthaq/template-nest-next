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
 * Cache administration behind the `/cache` endpoints. Enumerates keys by iterating each
 * Keyv store's async `iterator()`, since cache-manager itself exposes no `keys()`.
 */
@Injectable()
export class CacheService {
  /** Maximum accepted pattern length, as a cheap bound on input size. */
  private static readonly MAX_PATTERN_LENGTH = 200;

  public constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** Every cached entry whose key matches the glob `pattern`. */
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
   * Delete one entry by exact key. Returns `true` only if it existed — cache-manager's
   * `del()` resolves `true` even for keys that were never present.
   */
  public async delete(key: string): Promise<boolean> {
    const existed = (await this.cache.get(key)) !== undefined;
    await this.cache.del(key);
    return existed;
  }

  /**
   * Compile a glob (`*` any run, `?` one char, everything else literal) into an anchored
   * predicate. Two-pointer scan with a remembered star — no backtracking, so no ReDoS.
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
