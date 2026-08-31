import '../src/assets/css/globals.css';

import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';

import en from '../src/libs/next-intl/messages/en.json';
import zh from '../src/libs/next-intl/messages/zh.json';
import { AppThemeProvider } from '../src/libs/next-themes/AppThemeProvider';

const messagesByLocale = { en, zh } as const;
type PreviewLocale = keyof typeof messagesByLocale;

const isPreviewLocale = (value: unknown): value is PreviewLocale =>
  typeof value === 'string' && value in messagesByLocale;

type PreviewTheme = 'light' | 'dark';

const isPreviewTheme = (value: unknown): value is PreviewTheme =>
  value === 'light' || value === 'dark';

/** Mirrors the typography classes the root layout applies on `<html>`. */
const withRootTypography: Decorator = (Story) => (
  <div className="font-sans antialiased">
    <Story />
  </div>
);

/** Mirrors the root layout's `NextIntlClientProvider`, driven by the `locale` toolbar. */
const withIntl: Decorator = (Story, context) => {
  const locale = isPreviewLocale(context.globals.locale) ? context.globals.locale : 'en';

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <Story />
    </NextIntlClientProvider>
  );
};

/**
 * Supplies real next-themes context so `useTheme()` consumers (e.g. sonner's `Toaster`
 * in `shadcn/sonner.tsx`) follow the same `theme` toolbar global that `withThemeByClassName`
 * reads below, instead of next-themes' context-less no-op fallback.
 *
 * `withThemeByClassName` remains the *only* writer of the `dark` class on `<html>` — this
 * provider is pointed at `data-theme` (via `attribute`) so it never touches `class` at all,
 * which rules out any fight over that attribute by construction rather than by convention.
 *
 * `forcedTheme` alone would only force the DOM attribute write; next-themes' `theme` /
 * `resolvedTheme` fields returned by `useTheme()` come from its *internal* state, which is
 * seeded once from `defaultTheme` (or a stored `storageKey`) on mount and is not updated by
 * a `forcedTheme` prop change. Remounting via `key={theme}` re-seeds that internal state to
 * the toolbar's value on every toggle, and a Storybook-only `storageKey` keeps that from ever
 * being shadowed by a persisted preference.
 */
const withThemeContext: Decorator = (Story, context) => {
  const theme = isPreviewTheme(context.globals.theme) ? context.globals.theme : 'light';

  return (
    <AppThemeProvider
      key={theme}
      attribute="data-theme"
      storageKey="storybook-theme"
      defaultTheme={theme}
      forcedTheme={theme}
      enableSystem={false}
    >
      <Story />
    </AppThemeProvider>
  );
};

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Active next-intl locale',
      defaultValue: 'en' satisfies PreviewLocale,
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'zh', title: '中文' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    withIntl,
    withRootTypography,
    withThemeContext,
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
