import { CacheController } from './cache.controller';
import { CacheEntry, CacheService } from './cache.service';

describe('CacheController', () => {
  let controller: CacheController;
  let cacheService: jest.Mocked<Pick<CacheService, 'search' | 'delete'>>;

  beforeEach(() => {
    cacheService = {
      search: jest.fn(),
      delete: jest.fn(),
    };
    controller = new CacheController(cacheService as unknown as CacheService);
  });

  describe('search', () => {
    it('delegates the pattern to the service and returns its result', async () => {
      // Arrange
      const expected: CacheEntry[] = [{ key: 'user:1', value: { name: 'Ada' } }];
      cacheService.search.mockResolvedValue(expected);

      // Act
      const result = await controller.search('user:*');

      // Assert
      expect(cacheService.search).toHaveBeenCalledWith('user:*');
      expect(result).toBe(expected);
    });
  });

  describe('remove', () => {
    it('returns { key, deleted: true } when the service reports the key existed', async () => {
      // Arrange
      cacheService.delete.mockResolvedValue(true);

      // Act
      const result = await controller.remove('user:1');

      // Assert
      expect(cacheService.delete).toHaveBeenCalledWith('user:1');
      expect(result).toEqual({ key: 'user:1', deleted: true });
    });

    it('returns { key, deleted: false } when the service reports the key never existed', async () => {
      // Arrange
      cacheService.delete.mockResolvedValue(false);

      // Act
      const result = await controller.remove('user:missing');

      // Assert
      expect(cacheService.delete).toHaveBeenCalledWith('user:missing');
      expect(result).toEqual({ key: 'user:missing', deleted: false });
    });
  });
});
