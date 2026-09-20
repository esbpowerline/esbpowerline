import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const config = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'import/no-anonymous-default-export': 'off'
    }
  },
  {
    ignores: [
      // Agent worktrees are separate checkouts that carry their own build
      // output; linting them reported 74 errors from `.next` chunks and
      // drowned the real signal (2026-09-20).
      '.claude/**/*',
      '.next/**/*',
      '.next-admin/**/*',
      '.next-cms/**/*',
      '.next-public/**/*',
      'node_modules/**/*',
      'dist/**/*'
    ]
  }
];

export default config;
