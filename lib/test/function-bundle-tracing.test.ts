import { describe, it, expect } from 'vitest';
import config from '@/next.config';

/**
 * The archive is in the year-on-year sheet's function bundle or it is not, and
 * nothing at build time says which.
 *
 * `/cms/yoy-sheet` reads `public/data/daily/{day}.json` off disk through
 * `loadDailyReportFromDisk`, and the path is built with a `path.join` the file
 * tracer cannot resolve — so the whole 415MB archive gets traced into every
 * function that so much as imports the loader, which once put `/api/upload` at
 * 267MB against a 250MB limit and failed a production deploy. The blanket
 * `/cms/**` exclude that fixed that took the sheet's own data with it: on the
 * deployed site every export on that page failed with the day not found, while
 * the same click on localhost worked, because there the file is simply there.
 * The bundled `archive-fallback.ts` covers 31 May to 29 June 2026 only, and the
 * days in question were shipped as static files rather than published as
 * releases, so neither backstop caught it.
 *
 * These assert the SHAPE of the config, not glob behaviour. Route-key matching
 * is done by the Turbopack tracer in Rust and cannot be reproduced here: the
 * `picomatch` call in `collect-build-traces.js` looks like the authority and is
 * not — that function does not run in a Turbopack build, which is how an
 * exclude key of `/cms!(/yoy-sheet)` came to matter (see below).
 *
 * The `/cms/**` exclude and the `/cms/yoy-sheet` include both match that route
 * and the include wins, so the sheet keeps its archive while every other CMS
 * page is spared it. That is measured from the emitted `.nft.json`, not implied
 * by anything readable here — 195MB and 4,543 daily files on the sheet, 56MB
 * and none on `/cms/media`. Only a build can re-check it.
 */

const excludes = config.outputFileTracingExcludes ?? {};
const includes = config.outputFileTracingIncludes ?? {};

describe('serverless function file tracing', () => {
  it('asks for the daily archive in the year-on-year sheet bundle', () => {
    expect(includes['/cms/yoy-sheet']).toContain('./public/data/daily/**');
    // The comparison beside the sheet reads gas from the Petrobangla day that
    // covers the energy day, which is a second archive and a separate include.
    expect(includes['/cms/yoy-sheet']).toContain('./public/data/petrobangla/daily/**');
  });

  it('uses no extglob in a route key', () => {
    // `/cms!(/yoy-sheet)` is the obvious way to hold one page out of a blanket
    // exclude, and it is a trap. Turbopack matches these keys with a Rust glob
    // engine that has no `!(...)`, so the key compiles to a pattern matching
    // NOTHING: every CMS route silently loses its exclusion, the build still
    // succeeds, and `/cms/media` goes from 78MB to 311MB with the config
    // reading as though it were correct. Measured, not assumed — a build with
    // that key traced 4,543 daily JSON files into `/cms/media`.
    for (const key of [...Object.keys(excludes), ...Object.keys(includes)]) {
      expect(key, key).not.toMatch(/[!@+?]\(/);
    }
  });

  it('still excludes the archive from the CMS routes that never read it', () => {
    expect(excludes['/cms/**']).toContain('./public/data/**/*');
    expect(excludes['/admin/**']).toContain('./public/data/**/*');
    expect(excludes['/api/upload/**']).toContain('./public/data/**/*');
  });

  it('keeps station detail and the fuel curve out of every bundle', () => {
    // Split out of the daily payload purely to stop them being traced; both are
    // fetched over HTTP by the browser and read from disk by nothing.
    expect(excludes['**']).toContain('./public/data/plants/**/*');
    expect(excludes['**']).toContain('./public/data/curves/**/*');
  });
});
