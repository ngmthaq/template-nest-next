import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginStorybook from 'eslint-plugin-storybook';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettierRecommended,
  noUnsanitized.configs.recommended,
  ...eslintPluginStorybook.configs['flat/recommended'],
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/(shared)/_theme/globals.css',
      },
      'jsx-a11y': {
        components: {
          Link: 'a',
          Image: 'img',
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'warn',
      eqeqeq: ['error', 'smart'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      ...eslintPluginJsxA11y.flatConfigs.strict.rules,
      'jsx-a11y/alt-text': ['error', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/control-has-associated-label': 'error',
      'jsx-a11y/lang': 'error',
      'jsx-a11y/anchor-ambiguous-text': 'error',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
      'jsx-a11y/prefer-tag-over-role': 'error',

      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/enforce-canonical-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-conflicting-classes': 'warn',
      'better-tailwindcss/no-deprecated-classes': 'warn',

      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-script-url': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'AGENTS.md',
    'CLAUDE.md',
  ]),
]);

export default eslintConfig;
