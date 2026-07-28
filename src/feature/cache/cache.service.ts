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
  public constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Search cached entries whose key matches the given regular expression.
   * Returns every matching entry as a `{ key, value }` pair.
   */
  public async search(pattern: string): Promise<CacheEntry[]> {
    const regex = this.compileRegex(pattern);
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
        if (regex.test(key)) {
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

  /** Compile the user-supplied pattern into a RegExp, rejecting invalid input. */
  private compileRegex(pattern: string): RegExp {
    if (!pattern) {
      throw new BadRequestException('A "pattern" query parameter is required.');
    }
    try {
      return new RegExp(pattern);
    } catch {
      throw new BadRequestException(`Invalid regular expression: ${pattern}`);
    }
  }
}
