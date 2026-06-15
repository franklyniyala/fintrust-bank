import { defineConfig } from 'eslint/config';
import nPlugin from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import js from '@eslint/js';

export default defineConfig([
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '**/*.min.js'],
  },
  {
    files: ['**/*.js'],
    plugins: {
      n: nPlugin,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...nPlugin.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'n/no-missing-require': 'error',
      'n/no-unpublished-require': 'warn',
    },
  },
  prettierPlugin,
]);
