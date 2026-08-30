'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { Button } from '@/app/(shared)/_libs/shadcn-ui/button';
import { Typography } from '@/app/(shared)/_libs/shadcn-ui/typography';
import { logUtils } from '@/app/(shared)/_utils/logUtils';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function Error({ error, retry }: ErrorProps) {
  const t = useTranslations('error');
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logUtils.error(error);
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
