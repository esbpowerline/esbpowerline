import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TIER_GATED_DAILY_DIRS,
  isProtectedDataJsonPath,
  canonicalDataPath,
  dataPathIsoDate,
} from '@/lib/data/grid/daily-access';

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
    ]) {
      expect(isProtectedDataJsonPath(p)).toBe(true);
    }
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
});
