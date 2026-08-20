import '../../(shared)/_theme/globals.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { Toaster } from '@/app/(shared)/_components/shadcn/sonner';
import { localeDirections } from '@/app/(shared)/_i18n/dir';
import { routing } from '@/app/(shared)/_i18n/routing';
import { ThemeProvider } from '@/app/(shared)/_theme/ThemeProvider';

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
        <ThemeProvider>
          <NextIntlClientProvider>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
