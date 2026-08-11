import type { ReactNode } from 'react';

interface StatusTemplateProps {
  code: number | string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function StatusTemplate({ code, title, description, children }: StatusTemplateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 bg-white px-16 py-32 text-center dark:bg-black">
        <p className="text-sm font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
          {code}
        </p>
        <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-black dark:text-zinc-50">
          {title}
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">{description}</p>
        {children}
      </main>
    </div>
  );
}
