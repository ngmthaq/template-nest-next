import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Runs Prettier as an ESLint rule and disables formatting rules that conflict
  // with it. Kept last so it wins over stylistic rules from the configs above.
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    settings: {
      // Tailwind v4 has no JS config; point the plugin at the CSS entry so it
      // can resolve the theme and detect conflicting/duplicate classes.
      'better-tailwindcss': {
        entryPoint: 'app/(shared)/_assets/css/globals.css',
      },
    },
    rules: {
      // --- Common rules ---
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

      // --- Import ordering ---
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // --- Tailwind CSS ---
      // Class order is owned by prettier-plugin-tailwindcss (see .prettierrc),
      // so the ESLint order/wrapping rules stay off to avoid fighting Prettier.
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-conflicting-classes': 'warn',
      'better-tailwindcss/no-deprecated-classes': 'warn',
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
