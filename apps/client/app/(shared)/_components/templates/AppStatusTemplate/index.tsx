import type { ReactNode } from 'react';

import { Typography } from '@/app/(shared)/_libs/shadcn-ui/typography';

interface AppStatusTemplateProps {
  code: number | string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function AppStatusTemplate({ code, title, description, children }: AppStatusTemplateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background font-sans">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center md:px-16 md:py-32">
        <Typography variant="small" className="tracking-widest text-muted-foreground uppercase">
          {code}
        </Typography>
        <Typography variant="h1" className="max-w-xs text-3xl/10 tracking-tight">
          {title}
        </Typography>
        <Typography variant="lead" className="max-w-md text-lg/8">
          {description}
        </Typography>
        {children}
      </main>
    </div>
  );
}
