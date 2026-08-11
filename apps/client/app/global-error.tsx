'use client';

import './(shared)/_theme/globals.css';

import clsx from 'clsx';
import { useEffect } from 'react';

import { AppStatusTemplate } from '@/app/(shared)/_components';
import { fontGeistMono, fontGeistSans } from '@/app/(shared)/_theme';

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="en"
      className={clsx([fontGeistSans.variable, fontGeistMono.variable, 'h-full antialiased'])}
    >
      <body>
        <AppStatusTemplate
          code={500}
          title="Something went wrong"
          description="An unexpected error occurred. Please try again."
        >
          <button
            type="button"
            onClick={() => retry()}
            className="bg-foreground text-background flex h-12 items-center justify-center rounded-full px-5 text-base font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Try again
          </button>
          {error.digest ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Reference: {error.digest}</p>
          ) : null}
        </AppStatusTemplate>
      </body>
    </html>
  );
}
