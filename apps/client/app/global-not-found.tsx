import './(shared)/_theme/globals.css';

import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/app/(shared)/_components/shadcn/button';
import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { ThemeProvider } from '@/app/(shared)/_theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Page not found',
  description: "The page you are looking for doesn't exist or has been moved.",
  icons: { icon: '/favicon.ico' },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppStatusTemplate
            code={404}
            title="Page not found"
            description="The page you are looking for doesn't exist or has been moved."
          >
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
          </AppStatusTemplate>
        </ThemeProvider>
      </body>
    </html>
  );
}
