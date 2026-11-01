import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * The middleware matcher decides what is gated.
 *
 * Narrowing it is a cost change and a security change at the same time, and the
 * security half is the one with a history: CLAUDE.md records three separate
 * occasions when something was split out of the Grid Explorer's payload and a
 * name-based rule failed to follow it — `curves` alone served 1,979 locked days
 * to anyone. So the matcher is asserted here from its own source text rather
 * than trusted to a reading.
 *
 * The load-bearing case is the first one: `/data/**.json` and its `/api/data/**`
 * twin must keep reaching middleware, because that is where the tier gate runs.
 */

const MATCHER = (() => {
  const src = readFileSync(path.join(process.cwd(), 'middleware.ts'), 'utf8');
  const m = src.match(/matcher:\s*\[\s*'([^']+)'/);
  if (!m) throw new Error('could not read the matcher out of middleware.ts');
  return m[1];
})();

/** Next compiles the matcher as a path pattern; for a bare negative-lookahead
 *  rule like this one, anchoring it is an accurate stand-in. */
const matches = (pathname: string) => new RegExp(`^${MATCHER}$`).test(pathname);

describe('middleware still runs where a decision is made', () => {
  const MUST_MATCH = [
    // The tier gate. Nothing below this line may ever stop matching.
    '/data/daily/2021-04-13.json',
    '/data/curves/2021-04-13.json',
    '/data/plants/2021-04-13.json',
    '/data/petrobangla/daily/2021-04-13.json',
    '/api/data/daily/2021-04-13.json',
    '/api/data/petrobangla/daily/2021-04-13.json',
    '/api/data-manifest',
    // Auth and role gating.
    '/admin',
    '/admin/users',
    '/cms/articles',
    '/members/downloads',
    '/login',
    '/members/login',
    '/auth/reset-password',
    // Rate-limited and role-gated API surface.
    '/api/auth/session',
    '/api/upload',
    '/api/admin/data/publish',
    '/api/members/grid-export',
    // Public pages: bot blocking, the /articles legacy redirect, session refresh.
    '/',
    '/articles',
    '/articles/some-published-slug',
    '/categories/energy-policy-regulators',
    '/grid-explorer',
    '/grid-explorer/2026-07-08',
    // The outreach exclusions are prefix-exact: neighbours keep matching.
    '/r',
    '/reports',
    '/research/some-slug',
    '/api/other',
    '/api/o',
    '/api/organizations',
  ];

  for (const p of MUST_MATCH) {
    it(`matches ${p}`, () => expect(matches(p)).toBe(true));
  }
});

describe('middleware does not run on things that carry no decision', () => {
  const MUST_NOT_MATCH = [
    '/_next/static/chunks/main-abc123.js',
    '/_next/image',
    '/__nextjs_font/geist-latin.woff2',
    '/images/esb-logo.png',
    '/api/cron/publish-scheduled',
    // Newly excluded by extension.
    '/fonts/inter.woff2',
    '/icon.png',
    '/apple-icon.png',
    '/og-image.png',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/news-sitemap.xml',
    '/grid-sitemap.xml',
    '/feed.xml',
    '/manifest.webmanifest',
    '/macro-charts/generation.svg',
    '/pdf/annual-report.pdf',
    '/googlef7ae5454de989a56.html'.replace('.html', '.txt'),
    // Outreach open pixel and click redirect: public, cookie-free, and out of
    // reach of the bot guard (see the matcher comment in middleware.ts).
    '/api/o/AbCdEfGhIjKlMnOpQrSt_-',
    '/api/o/AbCdEfGhIjKlMnOpQrSt_-.gif',
    '/r/AbCdEfGhIjKlMnOpQrSt_-',
  ];

  for (const p of MUST_NOT_MATCH) {
    it(`skips ${p}`, () => expect(matches(p)).toBe(false));
  }
});

describe('the extension exclusion cannot reach the gated archive', () => {
  it('does not list json', () => {
    // A `.json` here would take `/data/**` and `/api/data/**` out of the gate
    // and publish the whole archive. This is the single assertion in this file
    // that must never be relaxed.
    const extensionGroup = MATCHER.slice(MATCHER.indexOf('\\.('));
    expect(extensionGroup).not.toMatch(/\bjson\b/);
  });

  it('anchors extensions at the end of the path', () => {
    // Without the `$`, a slug containing a dot would fall out of the gate.
    expect(MATCHER).toMatch(/\)\$\)/);
    expect(matches('/articles/berc-raises-lpg-price-to-tk-1-585.and-more')).toBe(true);
  });

  it('keeps gating a data file whose directory looks static', () => {
    expect(matches('/data/images/2021-04-13.json')).toBe(true);
  });
});
