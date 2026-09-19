import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';

import en from '@/libs/next-intl/messages/en.json';

/** Renders `ui` inside a `NextIntlClientProvider` with the English messages, for specs that read translated text. */
export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale="en" messages={en}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
