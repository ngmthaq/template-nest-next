import { getTranslations } from 'next-intl/server';

import { Button } from '@/app/(shared)/_components/shadcn/button';
import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { Link } from '@/app/(shared)/_i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <AppStatusTemplate code={404} title={t('title')} description={t('description')}>
      <Button asChild size="lg">
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </AppStatusTemplate>
  );
}
