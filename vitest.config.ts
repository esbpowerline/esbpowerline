import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.spec.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` throws on import outside a React Server Component, which
      // is exactly what it is for — and it puts the comparison engines out of
      // reach of a unit test. Stubbed here so the rules that decide whether a
      // figure is real can be tested directly; nothing else about those
      // modules is affected, because the package has no runtime behaviour
      // beyond the throw.
      'server-only': path.resolve(__dirname, 'lib/test/stubs/server-only.ts'),
    },
  },
});