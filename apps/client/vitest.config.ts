import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

const serverOnlySpecs = 'src/utils/http*.spec.ts';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(clientRoot, 'src'),
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
