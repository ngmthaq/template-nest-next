import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { Typography } from '@/libs/shadcn-ui/typography';
import { RefreshRouterButton } from '@/shared/components/molecules/RefreshRouterButton';

import { HealthReportAsync } from './_components/HealthReportAsync';
import { HealthReportFallback } from './_components/HealthReportFallback';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('health');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function HealthPage() {
  const t = await getTranslations('health');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h1" className="text-2xl">
          {t('title')}
        </Typography>
        <RefreshRouterButton label={t('refresh')} />
      </div>
      <Suspense fallback={<HealthReportFallback />}>
        <HealthReportAsync />
      </Suspense>
    </div>
  );
}
