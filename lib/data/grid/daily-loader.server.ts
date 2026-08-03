import type { GridDailyData } from '@/lib/data/grid/types';
import { parseIsoDate, type DailyLoadResult } from '@/lib/data/grid/daily-loader-core';
import { getArchiveFallback } from '@/lib/data/grid/archive-fallback';
import { warnIfInvalidDailyReport } from '@/lib/data/grid/validate-daily-report';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';

export type { DailyLoadResult, DailyLoadSource } from '@/lib/data/grid/daily-loader-core';

/**
 * Map an HTTP-ish status to a load result, using the bundled archive fallback
 * for missing files/network failures. Server-only: statically pulls in the
 * large archive-fallback module (clients lazy-load it instead).
 */
export function resolveDailyLoadFromStatus(
  isoDate: string,
  httpStatus: number | null,
  data?: GridDailyData,
): DailyLoadResult {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  if (httpStatus !== null && httpStatus >= 200 && httpStatus < 300 && data) {
    warnIfInvalidDailyReport(data, parsed);
    return { ok: true, data, source: 'network' };
  }

  if (shouldUseArchiveFallback(httpStatus)) {
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

/** Server-side read from public/data/daily (Node fs). */
export async function loadDailyReportFromDisk(isoDate: string): Promise<DailyLoadResult> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'daily', `${parsed}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw) as GridDailyData;
    const result = resolveDailyLoadFromStatus(isoDate, 200, data);
    if (result.ok && result.source === 'network') {
      return { ok: true, data: result.data, source: 'disk' };
    }
    return result;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as NodeJS.ErrnoException).code) : '';
    const status = code === 'ENOENT' ? 404 : null;

    // Missing from the shipped archive — it may have been published at runtime
    // since the last deploy. Only ENOENT is retried: a malformed file should
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
