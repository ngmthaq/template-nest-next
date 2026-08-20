'use client';

import './(shared)/_assets/css/globals.css';

import { useEffect, useRef } from 'react';

import { Button } from '@/app/(shared)/_components/shadcn/button';
import { Typography } from '@/app/(shared)/_components/shadcn/typography';
import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { AppThemeProvider } from '@/app/(shared)/_providers/AppThemeProvider';

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    announcementRef.current?.focus();
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body>
        <AppThemeProvider>
          <div ref={announcementRef} role="alert" tabIndex={-1}>
            <AppStatusTemplate
              code={500}
              title="Something went wrong"
              description="An unexpected error occurred. Please try again."
            >
              <Button type="button" size="lg" onClick={() => retry()}>
                Try again
              </Button>
              {error.digest ? (
                <Typography variant="muted" className="text-xs">
                  Reference: {error.digest}
                </Typography>
              ) : null}
            </AppStatusTemplate>
          </div>
        </AppThemeProvider>
      </body>
    </html>
  );
}
