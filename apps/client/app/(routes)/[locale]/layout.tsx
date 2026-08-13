import '../../(shared)/_theme/globals.css';

import clsx from 'clsx';
import type { Metadata } from 'next';
import { locale as rootLocale } from 'next/root-params';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { localeDirections, routing } from '../../(shared)/_i18n';
import { fontGeistMono, fontGeistSans } from '../../(shared)/_theme';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metaData');

  return {
    title: t('title'),
    description: t('description'),
    icons: { icon: '/favicon.ico' },
  };
}

export default async function RootLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale();

  return (
    <html
      lang={locale}
      dir={localeDirections[locale] ?? 'ltr'}
      className={clsx([fontGeistSans.variable, fontGeistMono.variable, 'antialiased'])}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
