import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Cache } from 'cache-manager';

import { CacheService } from './cache.service';

/** A single `[key, value]` pair a mock store's iterator yields. */
type StoreEntry = [unknown, unknown];

/** Minimal shape of a cache-manager store as consumed by `CacheService.search`. */
interface MockStore {
  iterator?: (arg: undefined) => AsyncGenerator<StoreEntry>;
}

/** Build a mock store whose `iterator()` yields the given entries in order. */
function createStore(entries: StoreEntry[]): MockStore {
  return {
    iterator: async function* iterate(): AsyncGenerator<StoreEntry> {
      await Promise.resolve();
      for (const entry of entries) {
        yield entry;
      }
    },
  };
}

/** Build a mock store exposing no `iterator` function at all. */
function createStoreWithoutIterator(): MockStore {
  return {};
}

describe('CacheService', () => {
  let service: CacheService;
  let getMock: jest.Mock;
  let delMock: jest.Mock;
  let stores: MockStore[];

  /** Assemble a `Cache`-shaped mock backed by the mutable `stores` array. */
  function buildCacheMock(): Cache {
    return {
      get: getMock,
      del: delMock,
      get stores() {
        return stores;
      },
    } as unknown as Cache;
  }

  beforeEach(async () => {
    getMock = jest.fn();
    delMock = jest.fn();
    stores = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService, { provide: CACHE_MANAGER, useValue: buildCacheMock() }],
    }).compile();

    service = module.get(CacheService);
  });

  describe('search', () => {
    it.each<[string, string[]]>([
      ['*', ['', 'a', 'abc', 'axbxc', 'user:1']],
      ['a*b*c', ['abc', 'axbxc']],
      ['*c', ['abc', 'axbxc']],
      ['a*', ['a', 'abc', 'axbxc']],
    ])('matches keys against pattern %j', async (pattern, expectedKeys) => {
      // Arrange
      const candidateKeys = ['', 'a', 'abc', 'axbxc', 'user:1'];
      stores = [createStore(candidateKeys.map((key) => [key, `value:${key}`]))];

      // Act
      const result = await service.search(pattern);

      // Assert
      expect(result.map((entry) => entry.key).sort()).toEqual([...expectedKeys].sort());
    });

    it('matches "?" against exactly one character', async () => {
      // Arrange
      stores = [
        createStore([
          ['user:1', 'a'],
          ['user:12', 'b'],
          ['user:', 'c'],
        ]),
      ];

      // Act
      const result = await service.search('user:?');

      // Assert
      expect(result).toEqual([{ key: 'user:1', value: 'a' }]);
    });

    it('matches literal characters only against themselves', async () => {
      // Arrange
      stores = [
        createStore([
          ['abc', 1],
          ['abd', 2],
        ]),
      ];

      // Act
      const result = await service.search('abc');

      // Assert
      expect(result).toEqual([{ key: 'abc', value: 1 }]);
    });

    it('anchors the match so a prefix pattern does not match a key with extra leading characters', async () => {
      // Arrange
      stores = [
        createStore([
          ['user:1', 'a'],
          ['xuser:1', 'b'],
        ]),
      ];

      // Act
      const result = await service.search('user:*');

      // Assert
      expect(result).toEqual([{ key: 'user:1', value: 'a' }]);
    });

    it('does not duplicate a key already seen in an earlier store', async () => {
      // Arrange
      stores = [
        createStore([['user:1', 'from-first-store']]),
        createStore([
          ['user:1', 'from-second-store'],
          ['user:2', 'from-second-store'],
        ]),
      ];

      // Act
      const result = await service.search('user:*');

      // Assert
      expect(result).toEqual([
        { key: 'user:1', value: 'from-first-store' },
        { key: 'user:2', value: 'from-second-store' },
      ]);
    });

    it('skips a store lacking an iterator function without throwing', async () => {
      // Arrange
      stores = [createStoreWithoutIterator(), createStore([['user:1', 'a']])];

      // Act
      const result = await service.search('user:*');

      // Assert
      expect(result).toEqual([{ key: 'user:1', value: 'a' }]);
    });

    it('ignores entries whose key is not a string', async () => {
      // Arrange
      stores = [
        createStore([
          [123, 'numeric-key'],
          ['user:1', 'string-key'],
        ]),
      ];

      // Act
      const result = await service.search('*');

      // Assert
      expect(result).toEqual([{ key: 'user:1', value: 'string-key' }]);
    });

    it('throws BadRequestException when the pattern is empty', async () => {
      // Arrange
      stores = [createStore([])];

      // Act
      const act = service.search('');

      // Assert
      await expect(act).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when the pattern exceeds the maximum length', async () => {
      // Arrange
      stores = [createStore([])];
      const overLongPattern = 'a'.repeat(201);

      // Act
      const act = service.search(overLongPattern);

      // Assert
      await expect(act).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('delete', () => {
    it('returns true and calls cache.del when the key existed', async () => {
      // Arrange
      getMock.mockResolvedValue('cached-value');

      // Act
      const result = await service.delete('user:1');

      // Assert
      expect(result).toBe(true);
      expect(delMock).toHaveBeenCalledWith('user:1');
    });

    it('returns false and still calls cache.del when the key never existed', async () => {
      // Arrange
      getMock.mockResolvedValue(undefined);

      // Act
      const result = await service.delete('user:missing');

      // Assert
      expect(result).toBe(false);
      expect(delMock).toHaveBeenCalledWith('user:missing');
    });
  });
});
