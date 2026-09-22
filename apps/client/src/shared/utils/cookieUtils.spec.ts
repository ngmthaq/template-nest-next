import {
  deleteCookie,
  getCookie,
  getCookies,
  hasCookie,
  type OptionsType,
  setCookie,
} from 'cookies-next';
import { cookies as nextHeadersCookies } from 'next/headers';

import { CookieUtils } from './cookieUtils';

vi.mock('cookies-next', () => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  getCookies: vi.fn(),
  hasCookie: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('CookieUtils', () => {
  let cookieUtils: CookieUtils;

  beforeEach(() => {
    cookieUtils = new CookieUtils();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getAll', () => {
    it('returns the cookies resolved by cookies-next getCookies', async () => {
      // Arrange
      vi.mocked(getCookies).mockResolvedValue({ foo: 'bar' });

      // Act
      const result = await cookieUtils.getAll();

      // Assert
      expect(result).toEqual({ foo: 'bar' });
    });

    it('falls back to an empty object when getCookies resolves nothing', async () => {
      // Arrange
      vi.mocked(getCookies).mockResolvedValue(undefined);

      // Act
      const result = await cookieUtils.getAll();

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('get', () => {
    it('delegates to cookies-next getCookie with the scoped options', async () => {
      // Arrange
      vi.mocked(getCookie).mockResolvedValue('cookie-value');
      const options = { path: '/custom' };

      // Act
      const result = await cookieUtils.get('token', options);

      // Assert
      expect(result).toBe('cookie-value');
      expect(getCookie).toHaveBeenCalledWith('token', options);
    });
  });

  describe('getJson', () => {
    it('parses a stored JSON value into an object', async () => {
      // Arrange
      vi.mocked(getCookie).mockResolvedValue('{"role":"admin"}');

      // Act
      const result = await cookieUtils.getJson<{ role: string }>('session');

      // Assert
      expect(result).toEqual({ role: 'admin' });
    });

    it('returns undefined when the cookie value is missing', async () => {
      // Arrange
      vi.mocked(getCookie).mockResolvedValue(undefined);

      // Act
      const result = await cookieUtils.getJson('session');

      // Assert
      expect(result).toBeUndefined();
    });

    it('returns undefined instead of throwing when the stored value is not valid JSON', async () => {
      // Arrange
      vi.mocked(getCookie).mockResolvedValue('not-json{');

      // Act
      const result = await cookieUtils.getJson('session');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('delegates to cookies-next setCookie with the scoped options', async () => {
      // Arrange
      const options = { path: '/custom' };

      // Act
      await cookieUtils.set('token', 'raw-value', options);

      // Assert
      expect(setCookie).toHaveBeenCalledWith('token', 'raw-value', options);
    });
  });

  describe('setJson', () => {
    it('serializes the value and delegates to cookies-next setCookie', async () => {
      // Arrange
      const options = { path: '/custom' };

      // Act
      await cookieUtils.setJson('session', { role: 'admin' }, options);

      // Assert
      expect(setCookie).toHaveBeenCalledWith('session', '{"role":"admin"}', options);
    });
  });

  describe('has', () => {
    it('delegates to cookies-next hasCookie with the scoped options', async () => {
      // Arrange
      vi.mocked(hasCookie).mockResolvedValue(true);
      const options = { path: '/custom' };

      // Act
      const result = await cookieUtils.has('token', options);

      // Assert
      expect(result).toBe(true);
      expect(hasCookie).toHaveBeenCalledWith('token', options);
    });
  });

  describe('remove', () => {
    it('delegates to cookies-next deleteCookie with the scoped options', async () => {
      // Arrange
      const options = { path: '/custom' };

      // Act
      await cookieUtils.remove('token', options);

      // Assert
      expect(deleteCookie).toHaveBeenCalledWith('token', options);
    });
  });

  describe('scope', () => {
    it('passes options through untouched when window is defined', async () => {
      // Arrange
      const options = { path: '/browser' };

      // Act
      await cookieUtils.get('token', options);

      // Assert
      expect(getCookie).toHaveBeenCalledWith('token', options);
      expect(nextHeadersCookies).not.toHaveBeenCalled();
    });

    it('short-circuits on the server when options already carry req, res, or cookies', async () => {
      // Arrange
      vi.stubGlobal('window', undefined);
      const options = { cookies: vi.fn() } as unknown as OptionsType;

      // Act
      await cookieUtils.get('token', options);

      // Assert
      expect(getCookie).toHaveBeenCalledWith('token', options);
      expect(nextHeadersCookies).not.toHaveBeenCalled();
    });

    it('merges next/headers cookies into the options on the server fallback path', async () => {
      // Arrange
      vi.stubGlobal('window', undefined);

      // Act
      await cookieUtils.get('token');

      // Assert
      expect(getCookie).toHaveBeenCalledWith('token', { cookies: nextHeadersCookies });
    });
  });
});
