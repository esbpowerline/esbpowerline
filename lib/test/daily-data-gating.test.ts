import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TIER_GATED_DAILY_DIRS,
  isProtectedDataJsonPath,
  canonicalDataPath,
  dataPathIsoDate,
} from '@/lib/data/grid/daily-access';
import { resolveDataTarget } from '@/lib/data/feed-paths';

/**
 * The tier gate in middleware.ts only runs for paths this predicate claims.
 * A day's data that gets split into a new directory and is not registered here
 * is served to anyone, with the bot and same-origin checks skipped as well —
 * which is what happened to `curves` (1,979 locked days) after it was split out
 * of the daily payload the same way `plants` had been.
 */

describe('tier-gated daily data paths', () => {
  it.each([...TIER_GATED_DAILY_DIRS])('gates /data/%s/{date}.json', (dir) => {
    expect(isProtectedDataJsonPath(`/data/${dir}/2021-04-13.json`)).toBe(true);
  });

  it('gates the Petrobangla daily archive and its catalogs', () => {
    for (const p of [
      '/data/petrobangla/daily/2026-08-14.json',
      '/data/petrobangla/_index.json',
      '/data/petrobangla/_live_week.json',
      '/data/petrobangla/timeline-summary.json',
      // Added later than the three above and left off the roster until
      // 2026-09-04, when production served all three with no Referer while
      // timeline-summary.json beside them answered 403.
      '/data/petrobangla/reserve-model.json',
      '/data/petrobangla/reserve-sensitivity.json',
      '/data/petrobangla/reserves-published.json',
    ]) {
      expect(isProtectedDataJsonPath(p)).toBe(true);
    }
  });

  /**
   * Default-closed, and checked against the directory as it actually is. Every
   * aggregate under petrobangla/ is derived from the gated per-day archive, so
   * a roster of filenames is the wrong shape: it goes stale silently, and the
   * only symptom is that a file nobody re-listed is readable by anyone. This
   * fails on the next artifact split out of that directory rather than on the
   * next time someone thinks to look.
   */
  it('gates every aggregate that exists under public/data/petrobangla', () => {
    const dir = path.join(process.cwd(), 'public', 'data', 'petrobangla');
    const aggregates = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => e.name);

    expect(aggregates.length).toBeGreaterThan(0);
    const ungated = aggregates.filter(
      (name) => !isProtectedDataJsonPath(`/data/petrobangla/${name}`),
    );
    expect(ungated).toEqual([]);
  });

  it('gates the /api/data twin exactly as the static path', () => {
    for (const dir of TIER_GATED_DAILY_DIRS) {
      expect(isProtectedDataJsonPath(`/api/data/${dir}/2021-04-13.json`)).toBe(true);
      expect(canonicalDataPath(`/api/data/${dir}/2021-04-13.json`)).toBe(
        `/data/${dir}/2021-04-13.json`,
      );
    }
  });

  it('reads the date back from every gated dated path, static and API alike', () => {
    for (const dir of [...TIER_GATED_DAILY_DIRS, 'petrobangla/daily']) {
      expect(dataPathIsoDate(`/data/${dir}/2021-04-13.json`)).toBe('2021-04-13');
      expect(dataPathIsoDate(`/api/data/${dir}/2021-04-13.json`)).toBe('2021-04-13');
    }
  });

  it('ignores unrelated and malformed paths', () => {
    for (const p of [
      '/data/daily/index.json',
      '/data/daily/2021-04-13.json.bak',
      '/data/pgcb-monthly/2021-04.json',
      '/articles/some-slug',
      '/data/curves/not-a-date.json',
    ]) {
      expect(isProtectedDataJsonPath(p)).toBe(false);
    }
  });

  /**
   * The regression test proper: anything under public/data that is one JSON file
   * per ISO day is a day's data and must be gated. This fails the moment a new
   * per-day directory is added without registering it, instead of silently
   * publishing it.
   */
  it('gates every per-day directory that exists under public/data', () => {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const perDayDirs = fs
      .readdirSync(dataDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .filter((e) => {
        const names = fs.readdirSync(path.join(dataDir, e.name)).slice(0, 50);
        const dated = names.filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n));
        return dated.length > 0 && dated.length >= names.length / 2;
      })
      .map((e) => e.name);

    expect(perDayDirs.length).toBeGreaterThan(0);
    const ungated = perDayDirs.filter(
      (dir) => !isProtectedDataJsonPath(`/data/${dir}/2021-04-13.json`),
    );
    expect(ungated).toEqual([]);
  });

  /**
   * The /api/data/[...path] route resolves a request to a feed via
   * resolveDataTarget, while middleware gates it via isProtectedDataJsonPath.
   * If the two canonicalise a path differently, a request middleware never
   * gated can still resolve and serve tier-locked data. That happened: the
   * resolver stripped a leading `data/`/`api/data/` that middleware's regex did
   * not, so `/api/data/data/daily/X.json` bypassed the gate. These must resolve
   * to null so the route 404s them instead of serving history to anyone.
   */
  it('refuses doubled or prefixed data paths that would slip past the middleware gate', () => {
    for (const p of [
      'data/daily/2014-01-01.json',
      'api/data/daily/2014-01-01.json',
      'data/curves/2014-01-01.json',
      'data/petrobangla/daily/2014-01-01.json',
      '/data/daily/2014-01-01.json',
    ]) {
      expect(resolveDataTarget(p)).toBeNull();
    }
    // The legitimate relative forms the route and client actually pass still resolve.
    expect(resolveDataTarget('daily/2014-01-01.json')?.feed).toBe('GRID_DAILY');
    expect(resolveDataTarget('curves/2014-01-01.json')?.feed).toBe('GRID_CURVE');
  });
});
