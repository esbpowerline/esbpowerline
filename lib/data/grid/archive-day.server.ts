import 'server-only';
import { cache } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { availableDates } from '@/lib/data/grid/available-dates';
import { getRuntimeOnlyDates } from '@/lib/data/grid/available-dates.server';
import {
  buildHomeSnapshotFromDaily,
  type HomeSnapshotStat,
} from '@/lib/data/grid/home-snapshot-core';
import { parseIsoDate } from '@/lib/data/grid/date-utils';

/**
 * One archive day, as a page a search engine can read.
 *
 * The whole 4,548-day archive addressed a single URL until now: `/grid-explorer`
 * with the date held in client state. Google had one page to rank for twelve
 * years of national figures, so a search for what the grid did on a particular
 * day in 2019 could not reach this site — there was no document to return. That
 * is what this module exists to fix.
 *
 * What it deliberately does NOT do is widen access. The summary below is the
 * same twelve headline figures the homepage already publishes for the latest
 * day, and nothing else: no hourly curve, no per-station detail, no zone
 * breakdown, no gas field table. Those remain the archive plans' product and
 * stay behind `grid-tier-access.ts`. The public page is the index entry and the
 * sales pitch for the day, not the day itself.
 *
 * Every figure comes from `buildHomeSnapshotFromDaily`, reused rather than
 * recomputed. That is not just economy: it means the data doctrine — absent is
 * absent, null is never zero, name the publisher who owes the number — is
 * enforced in exactly one place, and a page added later cannot quietly adopt a
 * softer rule about what a missing figure means.
 */

/** The live-only tiles. Meaningless on a day that closed years ago.
 *
 * All three are hourly figures off NLDC's own pages, so `buildHomeSnapshotFromDaily`
 * emits them as `awaiting('NLDC')` — correct on the homepage, where the live
 * overlay fills them, and noise on an archive page that will never have a live
 * feed. Supply and Generation joined the set when they replaced the two peak
 * tiles: the peaks are still published, just not through here. */
const LIVE_ONLY_LABELS = new Set([
  'Current Demand',
  'Current Supply',
  'Current Generation',
  // PGCB's forecast board is a today/yesterday page. It says nothing about a
  // day that closed years ago, so these two would be permanent dashes here.
  'Forecast Demand',
  'Yesterday Peak Gen',
  // Fuel columns NLDC prints hourly; the workbook has no equivalent row.
  'Liquid Fuel',
  'Hydro',
]);

export interface ArchiveFuelRow {
  name: string;
  /** Daily energy in GWh, exactly as the fuel table published it. */
  gen: number;
  /** Share of the summed published rows — a proportion for the bar, not a
   *  figure PGCB stated. Never presented as one. */
  share: number;
  color: string;
}

export interface ArchiveDaySummary {
  date: string;
  stats: HomeSnapshotStat[];
  /**
   * The day's peaks, for the prose.
   *
   * Read straight off `systemStats` rather than looked up by label in `stats`,
   * which is what `describeDay` used to do. That coupling was invisible and
   * fragile: the homepage's tile list is a layout contract that changes for
   * layout reasons, and when `Peak Generation` and `Peak Demand` were replaced
   * by hourly tiles this page would have quietly dropped its opening sentence
   * with nothing failing. A daily page should read the daily figures.
   */
  peaks: { generationMw: number | null; demandMw: number | null };
  fuels: ArchiveFuelRow[];
  /** Total of the published fuel rows, for the bar denominator only. */
  fuelTotalGwh: number | null;
  /** The documents this day cites, so the page can name its own sources. */
  sources: { pgcb?: string; petrobangla?: string };
  previous: string | null;
  next: string | null;
}

function fuelRows(data: GridDailyData): { fuels: ArchiveFuelRow[]; total: number | null } {
  const rows = data.generationData ?? [];
  if (!rows.length) return { fuels: [], total: null };
  const total = rows.reduce((acc, r) => acc + (r.gen ?? 0), 0);
  if (!(total > 0)) return { fuels: [], total: null };
  const fuels = rows
    .filter((r) => (r.gen ?? 0) > 0)
    .map((r) => ({
      name: r.name,
      gen: r.gen,
      share: r.gen / total,
      color: r.color,
    }))
    .sort((a, b) => b.gen - a.gen);
  return { fuels, total };
}

/**
 * The full date catalogue, build-time plus anything released since the last
 * deploy. `availableDates` alone is compiled into the bundle and would leave a
 * day published this morning with no page and no neighbours.
 */
export const getArchiveCatalogue = cache(async (): Promise<string[]> => {
  const runtimeOnly = await getRuntimeOnlyDates().catch(() => [] as string[]);
  if (!runtimeOnly.length) return availableDates;
  return [...new Set([...availableDates, ...runtimeOnly])].sort();
});

export async function isArchiveDate(iso: string): Promise<boolean> {
  const parsed = parseIsoDate(iso);
  if (!parsed) return false;
  const catalogue = await getArchiveCatalogue();
  return catalogue.includes(parsed);
}

/** 12 August 2024 — the form a reader and a search result both want. */
export function formatArchiveDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function statValue(stats: HomeSnapshotStat[], label: string): HomeSnapshotStat | null {
  const found = stats.find((s) => s.label === label);
  return found && found.value !== null ? found : null;
}

function number(stat: HomeSnapshotStat): string {
  const v = stat.value as number;
  return stat.isDecimal ? v.toFixed(2) : v.toLocaleString('en-US');
}

/**
 * Two or three sentences stating what the day's figures were.
 *
 * This is the page's substance for a crawler — a grid of numbers in a table is
 * far weaker in a search result than a sentence that names the country, the
 * date and the quantity. Only figures the report actually carried are named;
 * a clause about a missing figure is simply not written, rather than written
 * with a zero or a hedge in it.
 */
export function describeDay(summary: ArchiveDaySummary): string {
  const readable = formatArchiveDate(summary.date);
  const parts: string[] = [];

  const peakGen = summary.peaks.generationMw;
  const peakDemand = summary.peaks.demandMw;
  if (peakGen && peakDemand) {
    parts.push(
      `Bangladesh's national grid reached a peak generation of ${peakGen.toLocaleString('en-US')} MW against a peak demand of ${peakDemand.toLocaleString('en-US')} MW on ${readable}.`,
    );
  } else if (peakGen) {
    parts.push(
      `Bangladesh's national grid reached a peak generation of ${peakGen.toLocaleString('en-US')} MW on ${readable}.`,
    );
  } else {
    parts.push(`PGCB's daily report for Bangladesh's national grid on ${readable}.`);
  }

  const shed = statValue(summary.stats, 'Load Shedding');
  if (shed) {
    parts.push(
      (shed.value as number) > 0
        ? `Load shedding peaked at ${number(shed)} MW.`
        : 'PGCB recorded no load shedding at the peak hour.',
    );
  }

  const top = summary.fuels[0];
  if (top && summary.fuelTotalGwh) {
    parts.push(
      `${top.name} supplied the largest share of generation at ${top.gen.toLocaleString('en-US')} GWh.`,
    );
  }

  const gas = statValue(summary.stats, 'Gas Supply');
  if (gas) {
    parts.push(`National gas production stood at ${number(gas)} MMcfd.`);
  }

  return parts.join(' ');
}

export const loadArchiveDaySummary = cache(
  async (iso: string): Promise<ArchiveDaySummary | null> => {
    const parsed = parseIsoDate(iso);
    if (!parsed) return null;

    const catalogue = await getArchiveCatalogue();
    const index = catalogue.indexOf(parsed);
    if (index === -1) return null;

    const result = await loadDailyReportFromDisk(parsed);
    if (!result.ok) return null;
    const data = result.data;

    // The SREDA register is a stock as of a date, not a daily filing, and it is
    // not read here — so the two renewable tiles resolve to `awaiting('SREDA')`
    // and print a dash rather than claiming the country had no renewable
    // capacity on this day.
    const stats = buildHomeSnapshotFromDaily(data).filter(
      (stat) => !LIVE_ONLY_LABELS.has(stat.label),
    );

    const { fuels, total } = fuelRows(data);

    const sysStats = data.systemStats;
    const peakGenerationMw = Math.max(sysStats.eveningPeakGen ?? 0, sysStats.dayPeakGen ?? 0);
    const peakDemandMw = Math.max(sysStats.eveningPeakDemand ?? 0, sysStats.dayPeakDemand ?? 0);

    return {
      date: parsed,
      stats,
      peaks: {
        // `> 0`, not `!= null`: a day PGCB filed with both peaks empty reads 0
        // through the maxima above, and a sentence claiming a peak of 0 MW is
        // one no report has made.
        generationMw: peakGenerationMw > 0 ? Math.round(peakGenerationMw) : null,
        demandMw: peakDemandMw > 0 ? Math.round(peakDemandMw) : null,
      },
      fuels,
      fuelTotalGwh: total,
      sources: {
        pgcb: data.sourceFiles?.pgcb ?? undefined,
        petrobangla: data.sourceFiles?.petrobangla ?? undefined,
      },
      previous: index > 0 ? catalogue[index - 1] : null,
      next: index < catalogue.length - 1 ? catalogue[index + 1] : null,
    };
  },
);
