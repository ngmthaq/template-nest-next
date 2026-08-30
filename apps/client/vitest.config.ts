import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': clientRoot,
      'server-only': path.resolve(clientRoot, 'vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['app/**/*.spec.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.*',
        '**/*.stories.*',
        'app/(routes)/**',
        'app/(shared)/_constants/**',
        'app/(shared)/_libs/**',
        'app/global-error.tsx',
        'app/global-not-found.tsx',
        'vitest.config.ts',
        'vitest.setup.ts',
        'vitest.d.ts',
      ],
    },
  },
});
