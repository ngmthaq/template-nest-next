import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (!hasLocale(routing.locales, paramValue)) notFound();
    locale = paramValue;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});

async function loadMessages(locale: string) {
  switch (locale) {
    case 'zh':
      return (await import('./messages/zh.json')).default;
    default:
      return (await import('./messages/en.json')).default;
  }
}
