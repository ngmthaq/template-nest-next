'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function AppThemeProvider(props: ThemeProviderProps) {
  const { children, ...themeProps } = props;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...themeProps}
    >
      {children}
    </NextThemesProvider>
  );
}
