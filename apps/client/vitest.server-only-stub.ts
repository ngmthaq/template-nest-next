// The real `server-only` throws on import to fail client bundles, which under jsdom would
// fail every spec that imports one. vitest.config.ts aliases it here to make that a no-op.
export {};
