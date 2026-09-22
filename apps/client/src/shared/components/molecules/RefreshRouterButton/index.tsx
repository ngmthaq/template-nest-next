'use client';

import { useTransition } from 'react';

import { useRouter } from '@/libs/next-intl/configs/navigation';
import { Button } from '@/libs/shadcn-ui/button';
import { Spinner } from '@/libs/shadcn-ui/spinner';

export interface RefreshRouterButtonProps {
  label: string;
  className?: string;
}

export function RefreshRouterButton(props: RefreshRouterButtonProps) {
  const { label, className } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className={className}
    >
      {isPending ? <Spinner /> : null}
      {label}
    </Button>
  );
}
