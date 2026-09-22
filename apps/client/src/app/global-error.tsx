'use client';

import '@/assets/css/globals.css';

import { useEffect, useRef } from 'react';

import { AppThemeProvider } from '@/libs/next-themes/AppThemeProvider';
import { Button } from '@/libs/shadcn-ui/button';
import { Typography } from '@/libs/shadcn-ui/typography';
import { AppStatusTemplate } from '@/shared/components/templates/AppStatusTemplate';
import { logUtils } from '@/shared/utils/logUtils';

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function GlobalError(props: GlobalErrorProps) {
  const { error, retry } = props;
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
