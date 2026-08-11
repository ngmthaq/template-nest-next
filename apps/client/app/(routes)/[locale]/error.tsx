'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { AppStatusTemplate } from '@/app/(shared)/_components';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function Error({ error, retry }: ErrorProps) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppStatusTemplate code={500} title={t('title')} description={t('description')}>
      <button
        type="button"
        onClick={() => retry()}
        className="bg-foreground text-background flex h-12 items-center justify-center rounded-full px-5 text-base font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        {t('retry')}
      </button>
      {error.digest ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Reference: {error.digest}</p>
      ) : null}
    </AppStatusTemplate>
  );
}
