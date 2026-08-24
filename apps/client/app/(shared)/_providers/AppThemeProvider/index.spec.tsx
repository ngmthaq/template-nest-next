import { act, render } from '@testing-library/react';

import { AppThemeProvider } from './index';

function stubSystemPreference(prefersDark: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: prefersDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    // next-themes schedules a real setTimeout(…, 1) to remove its transition-disabling
    // <style> tag. Fake timers let each test flush that cleanup deterministically instead
    // of racing a real timer against the next test's DOM state.
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('applies attribute="class" by default, toggling the html class instead of a data attribute', () => {
    // Arrange
    stubSystemPreference(false);

    // Act
    render(
      <AppThemeProvider storageKey="app-theme-provider-default-attribute">
        <span>content</span>
      </AppThemeProvider>,
    );

    // Assert
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('defaults to the system theme via enableSystem when no theme is stored', () => {
    // Arrange
    stubSystemPreference(true);

    // Act
    render(
      <AppThemeProvider storageKey="app-theme-provider-default-system">
        <span>content</span>
      </AppThemeProvider>,
    );

    // Assert
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('injects a transition-disabling style on mount by default (disableTransitionOnChange)', () => {
    // Arrange
    stubSystemPreference(false);

    // Act
    render(
      <AppThemeProvider storageKey="app-theme-provider-default-transition">
        <span>content</span>
      </AppThemeProvider>,
    );

    // Assert
    const transitionStyle = Array.from(document.head.querySelectorAll('style')).find((el) =>
      el.textContent?.includes('transition:none'),
    );
    expect(transitionStyle).not.toBeUndefined();
  });

  it('lets a caller prop override the attribute default, proving props spread after the hard-coded defaults', () => {
    // Arrange
    stubSystemPreference(false);

    // Act
    render(
      <AppThemeProvider storageKey="app-theme-provider-override-attribute" attribute="data-theme">
        <span>content</span>
      </AppThemeProvider>,
    );

    // Assert
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('lets a caller prop override disableTransitionOnChange, skipping the transition-disabling style', () => {
    // Arrange
    stubSystemPreference(false);

    // Act
    render(
      <AppThemeProvider
        storageKey="app-theme-provider-override-transition"
        disableTransitionOnChange={false}
      >
        <span>content</span>
      </AppThemeProvider>,
    );

    // Assert
    const transitionStyle = Array.from(document.head.querySelectorAll('style')).find((el) =>
      el.textContent?.includes('transition:none'),
    );
    expect(transitionStyle).toBeUndefined();
  });
});
