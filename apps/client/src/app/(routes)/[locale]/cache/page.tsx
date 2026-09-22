import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';

import { Typography } from '@/libs/shadcn-ui/typography';
import { envUtils } from '@/shared/utils/envUtils';

import { CacheExplorer } from './_components/CacheExplorer';
import { deleteCacheAction, searchCacheAction } from './actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cache');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

/**
 * `proxy.ts` gives production the real 404 status. This is a backup for anything that reaches
 * the page directly (e.g. `next/link` prefetch), so allow this route to block.
 */
export const instant = false;

export default async function CachePage() {
  await connection();
  if (envUtils.isProduction()) notFound();

  const t = await getTranslations('cache');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <Typography variant="h1" className="text-2xl">
        {t('title')}
      </Typography>
      <CacheExplorer searchAction={searchCacheAction} deleteAction={deleteCacheAction} />
    </div>
  );
}
