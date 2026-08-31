import { getTranslations } from 'next-intl/server';

import { AppStatusTemplate } from '@/components/templates/AppStatusTemplate';
import { Link } from '@/libs/next-intl/configs/navigation';
import { Button } from '@/libs/shadcn-ui/button';

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
