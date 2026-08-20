'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { Button } from '@/app/(shared)/_components/shadcn/button';
import { Typography } from '@/app/(shared)/_components/shadcn/typography';
import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';

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
        <Button type="button" size="lg" onClick={() => retry()}>
          {t('retry')}
        </Button>
        {error.digest ? (
          <Typography variant="muted" className="text-xs">
            Reference: {error.digest}
          </Typography>
        ) : null}
      </AppStatusTemplate>
    </div>
  );
}
