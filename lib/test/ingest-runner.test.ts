import { describe, it, expect } from 'vitest';
import { extractJsonPayload } from '@/lib/data/ingest-stdout';
import { isIsoDate, isIsoMonth, dataPathFor, resolveDataTarget } from '@/lib/data/feed-paths';

/**
 * The admin ingest surface talks to Python by reading a JSON object out of
 * stdout, and keys every publish by an ISO date. Both had defects that no test
 * would have caught, and both were invisible until an operator hit them:
 * "Run full ingest" reported failure on every successful run, and the date
 * guard was due to start rejecting every day on 1 Jan 2030.
 */

describe('extractJsonPayload', () => {
  it('reads the report `run_daily_ingest.py --json` actually prints', () => {
    // The regression: the payload ends with nested objects, so the previous
    // `lastIndexOf('{')` landed on `"artifacts":{` and JSON.parse always threw.
    const stdout = JSON.stringify({
      ok: true,
      date: '2026-08-19',
      steps: [{ step: 'extractor', ok: true, seconds: 12.3, detail: 'parsed' }],
      artifacts: { grid: true, curve: true, plants: true, gas: false },
      note: null,
    });

    expect(extractJsonPayload(stdout)).toMatchObject({
      ok: true,
      date: '2026-08-19',
      artifacts: { grid: true, gas: false },
    });
  });

  it('ignores parser chatter printed before the payload', () => {
    const stdout = [
      'reading Daily Report 20-08-2026.xlsx',
      'WARN: outage table shifted by one column',
      JSON.stringify({ ok: true, date: '2026-08-19' }),
    ].join('\n');

    expect(extractJsonPayload(stdout)).toEqual({ ok: true, date: '2026-08-19' });
  });

  it('prefers the payload over an earlier line that merely looks like JSON', () => {
    const stdout = ['{"ok": false, "error": "stale"}', '{"ok": true, "date": "2026-08-19"}'].join('\n');
    expect(extractJsonPayload(stdout)).toEqual({ ok: true, date: '2026-08-19' });
  });

  it('handles a pretty-printed payload spread over several lines', () => {
    const stdout = `some chatter\n${JSON.stringify({ ok: true, steps: [{ step: 'gas' }] }, null, 2)}`;
    expect(extractJsonPayload(stdout)).toMatchObject({ ok: true });
  });

  it('returns null when the script printed nothing usable', () => {
    expect(extractJsonPayload('Traceback (most recent call last):\n  ImportError: pandas')).toBeNull();
    expect(extractJsonPayload('')).toBeNull();
  });
});

describe('feed key dates', () => {
  it('accepts days past 2029 — the old pattern stopped at 2029-12-31', () => {
    expect(isIsoDate('2030-01-01')).toBe(true);
    expect(isIsoDate('2031-06-15')).toBe(true);
    expect(dataPathFor('GRID_DAILY', '2030-01-01')).toBe('daily/2030-01-01.json');
    expect(resolveDataTarget('daily/2030-01-01.json')).toEqual({
      feed: 'GRID_DAILY',
      key: '2030-01-01',
    });
  });

  it('rejects impossible dates the digit pattern used to wave through', () => {
    expect(isIsoDate('2026-99-99')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-00-10')).toBe(false);
    expect(dataPathFor('GRID_CURVE', '2026-02-30')).toBeNull();
  });

  it('still keeps real days and the archive floor', () => {
    expect(isIsoDate('2013-12-31')).toBe(true);
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true); // a real leap day
    expect(isIsoDate('1999-01-01')).toBe(false);
    expect(isIsoDate('not-a-date')).toBe(false);
  });

  it('validates month keys the same way', () => {
    expect(isIsoMonth('2030-07')).toBe(true);
    expect(isIsoMonth('2026-13')).toBe(false);
    expect(isIsoMonth('2026-00')).toBe(false);
    expect(dataPathFor('PGCB_MONTHLY', '2030-07')).toBe('pgcb-monthly/2030-07.json');
  });
});
