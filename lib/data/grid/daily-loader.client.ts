import type { GridDailyData } from '@/lib/data/grid/types';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';
import {
  dailyReportPath,
  parseIsoDate,
  type DailyLoadResult,
} from '@/lib/data/grid/daily-loader-core';
import { runtimeDailyReportPath } from '@/lib/data/grid/date-utils';
import { getCachedDailyReport, setCachedDailyReport } from '@/lib/data/grid/daily-cache';
import { warnIfInvalidDailyReport } from '@/lib/data/grid/validate-daily-report';
import { isPathPublished } from '@/lib/data/runtime-data.client';

export type { DailyLoadResult, DailyLoadSource } from '@/lib/data/grid/daily-loader-core';

// The bundled archive fallback is server-only now. Importing it here shipped
// a 1 MB chunk of 31 full days to every browser — days 65–96 old, well outside
// the visitor window and outside the member one, readable by anyone who
// opened the chunk (audit finding, 2026-08-08). A day the network cannot
// produce is reported missing; the server prefetch still uses the fallback
// where it is allowed to.

/**
 * A day published after the last deploy, served from the DataRelease table.
 * Returns null for anything not published so the caller drops through to the
 * bundled archive fallback unchanged.
 */
async function loadRuntimeRelease(isoDate: string): Promise<GridDailyData | null> {
  try {
    const res = await fetch(runtimeDailyReportPath(isoDate), { cache: 'default' });
    if (!res.ok) return null;
    return (await res.json()) as GridDailyData;
  } catch {
    return null;
  }
}

/** Client-side fetch of a daily PGCB report JSON. */
export async function fetchDailyReport(
  isoDate: string,
  opts?: { refresh?: boolean },
): Promise<DailyLoadResult> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  if (!opts?.refresh) {
    const cached = getCachedDailyReport(parsed);
    if (cached) {
      return { ok: true, data: cached, source: 'network' };
    }
  }

  // A day the manifest lists as released has no static file in this build —
  // fetching the static path first guarantees a 404 in the console before the
  // fallback lands. Ask the manifest and go straight to the release. Every
  // failure below still drops through to the static/archive path unchanged.
  try {
    if (await isPathPublished(`daily/${parsed}.json`)) {
      const runtime = await loadRuntimeRelease(parsed);
      if (runtime) {
        warnIfInvalidDailyReport(runtime, parsed);
        setCachedDailyReport(parsed, runtime);
        return { ok: true, data: runtime, source: 'network' };
      }
    }
  } catch {
    /* manifest unreachable — degrade to the static-first flow below */
  }

  try {
    const res = await fetch(dailyReportPath(parsed), { cache: 'default' });
    if (!res.ok) {
      if (shouldUseArchiveFallback(res.status)) {
        // Not in the shipped archive — it may have been published since the last
        // deploy. Only a 404 gets here, so a tier denial (403) is never retried.
        const runtime = await loadRuntimeRelease(parsed);
        if (runtime) {
          warnIfInvalidDailyReport(runtime, parsed);
          setCachedDailyReport(parsed, runtime);
          return { ok: true, data: runtime, source: 'network' };
        }
        return { ok: false, error: `Daily report not found for ${parsed}`, status: 404 };
      }
      if (res.status === 403) {
        return { ok: false, error: 'tier_locked', status: 403 };
      }
      return { ok: false, error: `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as GridDailyData;
    warnIfInvalidDailyReport(data, parsed);
    setCachedDailyReport(parsed, data);
    return { ok: true, data, source: 'network' };
  } catch {
    return { ok: false, error: 'Network error while loading daily report' };
  }
}