'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { AppStatusTemplate } from '@/app/(shared)/_components';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function Error({ error, retry }: ErrorProps) {
  const t = useTranslations('error');
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    announcementRef.current?.focus();
  }, [error]);

  return (
    <div ref={announcementRef} role="alert" tabIndex={-1}>
      <AppStatusTemplate code={500} title={t('title')} description={t('description')}>
        <button
          type="button"
          onClick={() => retry()}
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {t('retry')}
        </button>
        {error.digest ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Reference: {error.digest}</p>
        ) : null}
      </AppStatusTemplate>
    </div>
  );
}
