import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(clientRoot, 'src'),
      'server-only': path.resolve(clientRoot, 'vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.*',
        '**/*.stories.*',
        'src/app/(routes)/**',
        'src/constants/**',
        'src/libs/**',
        'src/app/global-error.tsx',
        'src/app/global-not-found.tsx',
        'vitest.config.ts',
        'vitest.setup.ts',
        'vitest.d.ts',
      ],
    },
  },
});
