import { cacheTag, refresh, revalidatePath, revalidateTag, updateTag } from 'next/cache';

import { CacheUtils } from './cacheUtils';

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

describe('CacheUtils', () => {
  let cacheUtils: CacheUtils;

  beforeEach(() => {
    cacheUtils = new CacheUtils();
    vi.clearAllMocks();
  });

  describe('normalize', () => {
    it('collapses trailing and duplicate slashes in the pathname', () => {
      // Arrange
      const path = '//foo//bar//';

      // Act
      const result = cacheUtils.normalize(path);

      // Assert
      expect(result).toBe('/foo/bar');
    });

    it('deletes a query key when its param value is null', () => {
      // Arrange
      const path = '/foo?keep=1&drop=2';

      // Act
      const result = cacheUtils.normalize(path, { drop: null });

      // Assert
      expect(result).toBe('/foo?keep=1');
    });

    it('deletes a query key when its param value is undefined', () => {
      // Arrange
      const path = '/foo?keep=1&drop=2';

      // Act
      const result = cacheUtils.normalize(path, { drop: undefined });

      // Assert
      expect(result).toBe('/foo?keep=1');
    });

    it('coerces numeric and boolean param values via String', () => {
      // Arrange
      const path = '/foo';

      // Act
      const result = cacheUtils.normalize(path, { page: 2, active: true });

      // Assert
      expect(result).toBe('/foo?active=true&page=2');
    });

    it('sorts query params regardless of insertion order', () => {
      // Arrange
      const path = '/foo?zeta=1&alpha=2';

      // Act
      const result = cacheUtils.normalize(path);

      // Assert
      expect(result).toBe('/foo?alpha=2&zeta=1');
    });
  });

  describe('toTag', () => {
    it('prefixes the normalized path with the tag prefix', () => {
      // Arrange
      const path = '/foo/bar';

      // Act
      const result = cacheUtils.toTag(path);

      // Assert
      expect(result).toBe('path:/foo/bar');
    });
  });

  describe('toTags', () => {
    it('produces cumulative ancestor tags starting from the root', () => {
      // Arrange
      const path = '/foo/bar';

      // Act
      const result = cacheUtils.toTags(path);

      // Assert
      expect(result).toEqual(['path:/', 'path:/foo', 'path:/foo/bar']);
    });

    it('appends the full normalized path as an extra tag when a query string is present', () => {
      // Arrange
      const path = '/foo/bar?x=1';

      // Act
      const result = cacheUtils.toTags(path);

      // Assert
      expect(result).toEqual(['path:/', 'path:/foo', 'path:/foo/bar', 'path:/foo/bar?x=1']);
    });

    it('filters out tags whose length exceeds maxTagLength', () => {
      // Arrange
      cacheUtils.maxTagLength = 'path:/foo'.length;
      const path = '/foo/bar';

      // Act
      const result = cacheUtils.toTags(path);

      // Assert
      expect(result).toEqual(['path:/', 'path:/foo']);
    });

    it('slices the tag list down to maxTagCount', () => {
      // Arrange
      cacheUtils.maxTagCount = 2;
      const path = '/foo/bar';

      // Act
      const result = cacheUtils.toTags(path);

      // Assert
      expect(result).toEqual(['path:/', 'path:/foo']);
    });
  });

  describe('tag', () => {
    it('delegates to next/cache cacheTag with the computed tags', () => {
      // Arrange
      const path = '/foo';

      // Act
      cacheUtils.tag(path);

      // Assert
      expect(cacheTag).toHaveBeenCalledWith('path:/', 'path:/foo');
    });
  });

  describe('revalidate', () => {
    it('delegates to next/cache revalidateTag defaulting profile to max', () => {
      // Arrange
      const path = '/foo';

      // Act
      cacheUtils.revalidate(path);

      // Assert
      expect(revalidateTag).toHaveBeenCalledWith('path:/foo', 'max');
    });

    it('delegates to next/cache revalidateTag with an explicit profile', () => {
      // Arrange
      const path = '/foo';

      // Act
      cacheUtils.revalidate(path, { profile: 'minutes' });

      // Assert
      expect(revalidateTag).toHaveBeenCalledWith('path:/foo', 'minutes');
    });
  });

  describe('update', () => {
    it('delegates to next/cache updateTag with the computed tag', () => {
      // Arrange
      const path = '/foo';

      // Act
      cacheUtils.update(path);

      // Assert
      expect(updateTag).toHaveBeenCalledWith('path:/foo');
    });
  });

  describe('revalidateRoute', () => {
    it('delegates to next/cache revalidatePath with the given route and type', () => {
      // Arrange
      const route = '/foo';

      // Act
      cacheUtils.revalidateRoute(route, 'layout');

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/foo', 'layout');
    });
  });

  describe('refresh', () => {
    it('delegates to next/cache refresh', () => {
      // Act
      cacheUtils.refresh();

      // Assert
      expect(refresh).toHaveBeenCalled();
    });
  });
});
