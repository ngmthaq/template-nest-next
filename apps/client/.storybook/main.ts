import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@': clientRoot,
    };

    return viteConfig;
  },
};

export default config;
