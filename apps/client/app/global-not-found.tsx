import './(shared)/_theme/globals.css';

import clsx from 'clsx';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppStatusTemplate } from '@/app/(shared)/_components';
import { fontGeistMono, fontGeistSans } from '@/app/(shared)/_theme';

export const metadata: Metadata = {
  title: 'Page not found',
  description: "The page you are looking for doesn't exist or has been moved.",
  icons: { icon: '/favicon.ico' },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={clsx([fontGeistSans.variable, fontGeistMono.variable, 'h-full antialiased'])}
    >
      <body>
        <AppStatusTemplate
          code={404}
          title="Page not found"
          description="The page you are looking for doesn't exist or has been moved."
        >
          <Link
            href="/"
            className="bg-foreground text-background flex h-12 items-center justify-center rounded-full px-5 text-base font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Back to home
          </Link>
        </AppStatusTemplate>
      </body>
    </html>
  );
}
