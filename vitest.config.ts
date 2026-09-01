import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests were confined to `lib/**` while 72,000 lines of TSX had none, which
    // is how a homepage tile came to render a hard-coded figure under a LIVE
    // badge for months: the builder and the panel each behaved as written, and
    // nothing ever checked that they agreed. Component and route tests are now
    // collected too. A suite that needs a DOM opts in per file with a
    // `// @vitest-environment jsdom` docblock; the default stays node, which is
    // faster and is all the pure data rules need.
    include: [
      'lib/**/*.{test,spec}.{ts,tsx}',
      'components/**/*.{test,spec}.{ts,tsx}',
      'app/**/*.{test,spec}.{ts,tsx}',
      'scripts/**/*.{test,spec}.{ts,mts,mjs}',
    ],
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