import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import type { Locale } from 'next-intl';
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

const messageLoaders = {
  en: () => import('../messages/en.json'),
  zh: () => import('../messages/zh.json'),
} satisfies Record<Locale, () => Promise<unknown>>;

async function loadMessages(locale: string) {
  if (!hasLocale(routing.locales, locale)) notFound();

  return (await messageLoaders[locale]()).default;
}
