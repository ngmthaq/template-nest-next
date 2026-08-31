import '@/assets/css/globals.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { localeDirections } from '@/libs/next-intl/configs/dir';
import { routing } from '@/libs/next-intl/configs/routing';
import { AppThemeProvider } from '@/libs/next-themes/AppThemeProvider';
import { Toaster } from '@/libs/shadcn-ui/sonner';

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
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      dir={localeDirections[locale]}
      className="antialiased"
      suppressHydrationWarning
    >
      <body>
        <AppThemeProvider>
          <NextIntlClientProvider>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
