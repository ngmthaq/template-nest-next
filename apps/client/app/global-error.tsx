'use client';

import './(shared)/_assets/css/globals.css';

import { useEffect, useRef } from 'react';

import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { AppThemeProvider } from '@/app/(shared)/_libs/next-themes/AppThemeProvider';
import { Button } from '@/app/(shared)/_libs/shadcn-ui/button';
import { Typography } from '@/app/(shared)/_libs/shadcn-ui/typography';
import { logUtils } from '@/app/(shared)/_utils/logUtils';

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logUtils.error(error);
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
