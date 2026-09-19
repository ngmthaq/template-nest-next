import type { Duration, Locale as DateFnsLocale } from 'date-fns';
import { formatDuration } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';
import type { Locale } from 'next-intl';

const dateFnsLocales: Record<Locale, DateFnsLocale> = {
  en: enUS,
  zh: zhTW,
};

export class TimeUtils {
  /** Formats seconds as a localized duration, e.g. `1 day 2 hours 3 minutes 4 seconds`. */
  public formatSeconds(totalSeconds: number, locale: Locale): string {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const options = { locale: dateFnsLocales[locale] };

    // formatDuration drops zero units, so a zero duration would be an empty string.
    if (seconds === 0) {
      return formatDuration({ seconds: 0 }, { ...options, format: ['seconds'], zero: true });
    }

    // Split manually: date-fns intervals use calendar months, which vary in length.
    const duration: Duration = {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    };

    return formatDuration(duration, options);
  }
}

export const timeUtils = new TimeUtils();
