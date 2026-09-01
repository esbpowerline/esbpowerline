import type { GridDailyData } from '@/lib/data/grid/types';
import { parseIsoDate, type DailyLoadResult } from '@/lib/data/grid/daily-loader-core';
import { warnIfInvalidDailyReport } from '@/lib/data/grid/validate-daily-report';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';

export type { DailyLoadResult, DailyLoadSource } from '@/lib/data/grid/daily-loader-core';

/**
 * Map an HTTP-ish status to a load result, using the bundled archive fallback
 * for missing files/network failures.
 *
 * The fallback module is 975 KB of generated code and the happy path (release
 * or file found) never reads it, so it is imported only on the branch that
 * needs it — that is why this function is async. Be precise about what this
 * buys: file tracing follows dynamic imports too, so the module still ships in
 * the function bundle; what is saved is parsing and evaluating 975 KB of JS on
 * every cold start that never touches the fallback. Removing it from the
 * bundle entirely is the archive-out-of-git decision (docs/archive-out-of-git.md).
 */
export async function resolveDailyLoadFromStatus(
  isoDate: string,
  httpStatus: number | null,
  data?: GridDailyData,
): Promise<DailyLoadResult> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  if (httpStatus !== null && httpStatus >= 200 && httpStatus < 300 && data) {
    warnIfInvalidDailyReport(data, parsed);
    return { ok: true, data, source: 'network' };
  }

  if (shouldUseArchiveFallback(httpStatus)) {
    const { getArchiveFallback } = await import('@/lib/data/grid/archive-fallback');
    const fallback = getArchiveFallback(parsed);
    if (fallback) {
      return { ok: true, data: fallback, source: 'archive' };
    }
    if (httpStatus === 404) {
      return { ok: false, error: `Daily report not found for ${parsed}`, status: 404 };
    }
    return { ok: false, error: 'Network error while loading daily report' };
  }

  if (httpStatus === 403) {
    return { ok: false, error: 'tier_locked', status: 403 };
  }

  const status = httpStatus ?? 0;
  return { ok: false, error: `HTTP ${status}`, status };
}

/**
 * Server-side read of one daily report: a runtime release if the day has been
 * published, otherwise public/data/daily (Node fs).
 */
export async function loadDailyReportFromDisk(isoDate: string): Promise<DailyLoadResult> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  // Release first, not file first. A correction to a day that already shipped
  // has a static file, so an ENOENT-only fallback would never reach it and the
  // stale day would be served forever. This is the schema's rule: a release
  // always wins over a static file of the same key. `getReleaseOverride` fails
  // soft to null, so a database outage just falls through to the file below.
  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    const released = await getReleaseOverride('GRID_DAILY', parsed);
    if (released) {
      const result = await resolveDailyLoadFromStatus(isoDate, 200, released as GridDailyData);
      if (result.ok && result.source === 'network') {
        return { ok: true, data: result.data, source: 'disk' };
      }
      return result;
    }
  } catch {
    // Never let the enhancement break the read path it enhances.
  }

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'daily', `${parsed}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw) as GridDailyData;
    const result = await resolveDailyLoadFromStatus(isoDate, 200, data);
    if (result.ok && result.source === 'network') {
      return { ok: true, data: result.data, source: 'disk' };
    }
    return result;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as NodeJS.ErrnoException).code) : '';
    const status = code === 'ENOENT' ? 404 : null;

    // Backstop for the check above: the key list is cached, so a day published
    // seconds ago on another instance can still be missing from it while the
    // file is missing too. Only ENOENT is retried — a malformed file should
    // surface as an error, not be masked by a release that may not exist.
    if (status === 404) {
      const { getReleasePayload } = await import('@/lib/data/releases.server');
      const payload = await getReleasePayload('GRID_DAILY', parsed);
      if (payload) {
        return { ok: true, data: payload as GridDailyData, source: 'disk' };
      }
    }

    return resolveDailyLoadFromStatus(isoDate, status);
  }
}
