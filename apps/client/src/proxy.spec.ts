// @vitest-environment node
import { NextRequest } from 'next/server';

import nextIntlProxy from '@/libs/next-intl/configs/proxy';

import { isCacheRoute, proxy } from './proxy';

vi.mock('@/libs/next-intl/configs/proxy', () => ({
  default: vi.fn(() => 'next-intl-response'),
}));

describe('isCacheRoute', () => {
  it.each(['/cache', '/cache/', '/en/cache', '/zh/cache', '/en/cache/'])(
    'returns true for %s',
    (pathname) => {
      // Act
      const result = isCacheRoute(pathname);

      // Assert
      expect(result).toBe(true);
    },
  );

  it.each(['/cachex', '/en/cache-foo', '/en/cache/abc', '/fr/cache', '/health', '/en/health', '/'])(
    'returns false for %s',
    (pathname) => {
      // Act
      const result = isCacheRoute(pathname);

      // Assert
      expect(result).toBe(false);
    },
  );
});

describe('proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('APP_ENV', 'production');
    });

    it('rewrites /en/cache to the locale not-found page', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3001/en/cache');

      // Act
      const response = proxy(request);

      // Assert
      expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/en\/__not-found$/);
      expect(nextIntlProxy).not.toHaveBeenCalled();
    });

    it('rewrites /zh/cache to the zh not-found page', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3001/zh/cache');

      // Act
      const response = proxy(request);

      // Assert
      expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/zh\/__not-found$/);
      expect(nextIntlProxy).not.toHaveBeenCalled();
    });

    it('rewrites /cache (no locale) to the default locale not-found page', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3001/cache');

      // Act
      const response = proxy(request);

      // Assert
      expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/en\/__not-found$/);
      expect(nextIntlProxy).not.toHaveBeenCalled();
    });

    it('delegates /en/health to the next-intl proxy', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3001/en/health');

      // Act
      const result = proxy(request);

      // Assert
      expect(nextIntlProxy).toHaveBeenCalledWith(request);
      expect(result).toBe('next-intl-response');
    });
  });

  describe.each([
    ['development', 'development'],
    ['unset', undefined],
  ])('in non-production (%s)', (_label, appEnv) => {
    beforeEach(() => {
      vi.stubEnv('APP_ENV', appEnv);
    });

    it('delegates /en/cache to the next-intl proxy instead of rewriting to not-found', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3001/en/cache');

      // Act
      const result = proxy(request);

      // Assert
      expect(nextIntlProxy).toHaveBeenCalledWith(request);
      expect(result).toBe('next-intl-response');
    });
  });
});
