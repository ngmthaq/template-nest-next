import '@testing-library/jest-dom/vitest';

// jsdom does not implement `window.matchMedia`. `next-themes` (and other
// consumers of the `prefers-color-scheme` media query) call it eagerly on
// mount, so specs need a deterministic stub rather than a runtime crash.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
