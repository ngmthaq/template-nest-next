import { getTranslations } from 'next-intl/server';

import { AppStatusTemplate } from '@/app/(shared)/_components/templates/AppStatusTemplate';
import { Link } from '@/app/(shared)/_i18n/configs/navigation';
import { Button } from '@/app/(shared)/_libs/shadcn-ui/button';

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
