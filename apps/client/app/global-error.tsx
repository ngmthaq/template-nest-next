'use client';

import './(shared)/_theme/globals.css';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';

import { AppStatusTemplate, Button, Typography } from '@/app/(shared)/_components';
import { fontGeistMono, fontGeistSans, ThemeProvider } from '@/app/(shared)/_theme';

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
    <html
      lang="en"
      className={clsx([fontGeistSans.variable, fontGeistMono.variable, 'h-full antialiased'])}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
