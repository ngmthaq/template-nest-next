import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useTranslations } from 'next-intl';

import { Link } from '@/app/(shared)/_libs/next-intl/configs/navigation';
import { Button } from '@/app/(shared)/_libs/shadcn-ui/button';
import { Typography } from '@/app/(shared)/_libs/shadcn-ui/typography';

import { AppStatusTemplate } from '.';

const meta = {
  title: 'Templates/AppStatusTemplate',
  component: AppStatusTemplate,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AppStatusTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

// Copy mirrors app/global-not-found.tsx, the real consumer of the 404 case.
export const NotFound: Story = {
  args: {
    code: 404,
    title: 'Page not found',
    description: "The page you are looking for doesn't exist or has been moved.",
    children: (
      <Button asChild size="lg">
        <Link href="/">Back to home</Link>
      </Button>
    ),
  },
};

export const NotFoundWithoutAction: Story = {
  args: {
    code: 404,
    title: 'Page not found',
    description: "The page you are looking for doesn't exist or has been moved.",
  },
};

// Copy mirrors app/global-error.tsx, the real consumer of the 500 case.
export const ServerError: Story = {
  args: {
    code: 500,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    children: (
      <>
        <Button type="button" size="lg">
          Try again
        </Button>
        <Typography variant="muted" className="text-xs">
          Reference: 8f3c1a2e
        </Typography>
      </>
    ),
  },
};

export const ServerErrorWithoutAction: Story = {
  args: {
    code: 500,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

// Renders from real next-intl translations (the `notFound` namespace, same as
// app/(routes)/[locale]/not-found.tsx) so the locale toolbar visibly changes the copy.
function TranslatedNotFoundDemo() {
  const t = useTranslations('notFound');

  return (
    <AppStatusTemplate code={404} title={t('title')} description={t('description')}>
      <Button asChild size="lg">
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </AppStatusTemplate>
  );
}

export const Translated: Story = {
  // `args` are unused by `render` below — the demo pulls copy from next-intl instead —
  // but `StoryObj` still requires them since `AppStatusTemplateProps` has no defaults.
  args: {
    code: 404,
    title: 'Page not found',
    description: "The page you are looking for doesn't exist or has been moved.",
  },
  render: () => <TranslatedNotFoundDemo />,
};
