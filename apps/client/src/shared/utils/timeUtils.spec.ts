import { timeUtils } from './timeUtils';

describe('TimeUtils / timeUtils', () => {
  describe('formatSeconds', () => {
    it.each([
      [45, '45 seconds'],
      [123.45, '2 minutes 3 seconds'],
      [3725, '1 hour 2 minutes 5 seconds'],
      [90061, '1 day 1 hour 1 minute 1 second'],
      [3600, '1 hour'],
    ])('formats %s seconds as "%s" in English', (seconds, expected) => {
      // Arrange
      const locale = 'en';

      // Act
      const result = timeUtils.formatSeconds(seconds, locale);

      // Assert
      expect(result).toBe(expected);
    });

    it('keeps days instead of switching to calendar months for long durations', () => {
      // Arrange
      const seconds = 3_000_000;

      // Act
      const result = timeUtils.formatSeconds(seconds, 'en');

      // Assert
      expect(result).toBe('34 days 17 hours 20 minutes');
    });

    it('formats zero as "0 seconds" instead of an empty string', () => {
      // Arrange
      const seconds = 0;

      // Act
      const result = timeUtils.formatSeconds(seconds, 'en');

      // Assert
      expect(result).toBe('0 seconds');
    });

    it('treats a negative value as zero', () => {
      // Arrange
      const seconds = -5;

      // Act
      const result = timeUtils.formatSeconds(seconds, 'en');

      // Assert
      expect(result).toBe('0 seconds');
    });

    it('formats in Traditional Chinese for the zh locale', () => {
      // Arrange
      const seconds = 3725;

      // Act
      const result = timeUtils.formatSeconds(seconds, 'zh');

      // Assert
      expect(result).toBe('1 小時 2 分鐘 5 秒');
    });
  });
});
