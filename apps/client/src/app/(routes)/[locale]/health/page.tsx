import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { RefreshRouterButton } from '@/components/molecules/RefreshRouterButton';
import { HealthStatusPanel } from '@/components/organisms/HealthStatusPanel';
import { Skeleton } from '@/libs/shadcn-ui/skeleton';
import { Typography } from '@/libs/shadcn-ui/typography';

import { fetchHealthReport } from './actions';

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
        <HealthReport />
      </Suspense>
    </div>
  );
}

/** Reads the live report at request time, kept out of the static shell so the route can prerender. */
async function HealthReport() {
  await connection();
  const report = await fetchHealthReport();

  return <HealthStatusPanel report={report} />;
}

function HealthReportFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
