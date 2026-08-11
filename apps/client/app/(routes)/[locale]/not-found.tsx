import { getTranslations } from 'next-intl/server';

import { StatusTemplate } from '@/app/(shared)/_components';
import { Link } from '@/app/(shared)/_i18n';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <StatusTemplate code={404} title={t('title')} description={t('description')}>
      <Link
        href="/"
        className="bg-foreground text-background flex h-12 items-center justify-center rounded-full px-5 text-base font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        {t('backHome')}
      </Link>
    </StatusTemplate>
  );
}
