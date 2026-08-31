import '@/assets/css/globals.css';

import type { Metadata } from 'next';
import Link from 'next/link';

import { AppStatusTemplate } from '@/components/templates/AppStatusTemplate';
import { AppThemeProvider } from '@/libs/next-themes/AppThemeProvider';
import { Button } from '@/libs/shadcn-ui/button';

export const metadata: Metadata = {
  title: 'Page not found',
  description: "The page you are looking for doesn't exist or has been moved.",
  icons: { icon: '/favicon.ico' },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body>
        <AppThemeProvider>
          <AppStatusTemplate
            code={404}
            title="Page not found"
            description="The page you are looking for doesn't exist or has been moved."
          >
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
          </AppStatusTemplate>
        </AppThemeProvider>
      </body>
    </html>
  );
}
