import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

const serverOnlySpecs = 'src/shared/utils/http*.spec.ts';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(clientRoot, 'src'),
      '@vitest-helpers': path.resolve(clientRoot, 'vitest.helpers.tsx'),
      'server-only': path.resolve(clientRoot, 'vitest.server-only-stub.ts'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: [...configDefaults.exclude, serverOnlySpecs],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [serverOnlySpecs],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.{ts,tsx}', 'src/app/**/_*/**/*.{ts,tsx}', 'src/proxy.ts'],
      exclude: ['**/*.spec.*', '**/*.stories.*', '**/_constants/**', '**/*Async/**'],
    },
  },
});
