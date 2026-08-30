// Test-only stub for the `server-only` package.
//
// The real `server-only` module throws on import to fail builds where
// server-only code leaks into a client bundle (see httpUtils.ts). Under
// Vitest's jsdom environment that throw would fail every test that imports
// such a module, even though no bundler boundary is being violated here.
// vitest.config.ts aliases `server-only` to this empty module so the
// side-effect import resolves as a no-op during tests.
export {};
