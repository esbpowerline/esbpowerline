import 'server-only';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import type { GridDailyData } from '@/lib/data/grid/types';
import {
  archiveGasTotal as archiveTotalOf,
  archiveGasLng as archiveLngOf,
} from '@/lib/data/grid/petrobangla-day.server';
import {
  metricLabel,
  sectionLabel as sectionLabelI18n,
  strings,
  toBnDigits,
  unitLabel,
  type Lang,
} from '@/lib/data/grid/comparison-i18n';

/**
 * Compare any two energy days across anything the Grid Explorer publishes.
 *
 * The year-on-year sheet in `yoy-comparison.ts` stays exactly as it is — it is
 * a published format with fixed rows, fixed widths and Bengali numerals, and it
 * is not this. This is the general engine: pick two dates, pick which sections
 * you care about, get every figure side by side.
 *
 * The rule that shapes the whole file: **null is not zero.** The archive is
 * emphatic about it — "zero generation is a claim the report never made", "a
 * null here means unpublished, never that". So a metric that a day does not
 * publish compares as `null` with a stated reason, never as 0, and never
 * produces a percentage. A comparison that quietly turned "PGCB printed
 * nothing" into "-100%" would manufacture a headline out of a gap in a report.
 */

export type SectionId =
  | 'system'
  | 'shedding'
  | 'gas'
  | 'gasFields'
  | 'stations'
  | 'generation'
  | 'imports'
  | 'regional'
  | 'outages';

/**
 * Everything one day of the comparison can read.
 *
 * The grid payload and the Petrobangla archive day are separate files with
 * separate publishing schedules, so a metric has to be able to say which of the
 * two it needs — and to return null when that source is missing without the
 * other one masking it.
 */
export type DayContext = {
  iso: string;
  day: GridDailyData;
  gasArchive: GasArchiveDay | null;
  stations: StationDay | null;
};

export type Metric = {
  id: string;
  section: SectionId;
  label: string;
  unit: string;
  value: (ctx: DayContext) => number | null;
  /**
   * For a metric that is a SUM over a variable set of rows: how many rows the
   * day actually published.
   *
   * Without this a total is a number with no denominator. 2016-09-01 lists six
   * zones and 2014-12-02 lists one; both produce a figure the table calls
   * "Total load shedding", and set beside a nine-zone day the difference reads
   * as a collapse or a surge when most of it is simply the missing zones. Ten
   * days in the archive are like that. `compareDates` refuses to subtract two
   * totals taken over different sets, and says why.
   */
  basis?: (ctx: DayContext) => number;
  /** What the basis counts, for the sentence: "summed over 6 zones". */
  basisNoun?: string;
};

/** One field's row of the Petrobangla archive day. */
export type GasField = { field?: string; gas_mmcfd?: number | null; producing_wells?: number | null };
export type GasArchiveDay = { production?: { fields?: GasField[] } };

/** One station's row of the per-day station detail. */
export type Station = { name?: string; eveningPeakMw?: number | null; dayPeakMw?: number | null };
export type StationDay = { plants?: Station[] };

export const SECTIONS: ReadonlyArray<{ id: SectionId; label: string; description: string }> = [
  { id: 'system', label: 'System', description: 'Peaks, energy, temperature and cost' },
  { id: 'shedding', label: 'Load shedding', description: 'Shortfall, by total and by hour' },
  { id: 'gas', label: 'Gas', description: 'Production, LNG split and offtake' },
  { id: 'gasFields', label: 'Gas fields', description: 'Field-by-field production, from the Petrobangla archive' },
  { id: 'stations', label: 'Power stations', description: 'Evening peak per station, from the station detail' },
  { id: 'generation', label: 'Generation by fuel', description: 'Every fuel PGCB prints' },
  { id: 'imports', label: 'Cross-border', description: 'Each interconnector' },
  { id: 'regional', label: 'Regional demand', description: 'Zone demand and shedding' },
  { id: 'outages', label: 'Outages', description: 'Reported plant outages' },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Sum that stays null when there is nothing published to sum. */
function sumOrNull(values: Array<number | null | undefined>): number | null {
  const present = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

/**
 * A quantity that cannot physically be zero, so a stored zero means unpublished.
 *
 * This is not a theory. 2018-01-15 records `avgProductionCost: 0` and
 * `totalDailyCost: 246033559` in the same object — the record contradicts
 * itself, and the only reading is that the per-unit cost was never captured.
 * 2014-07-28 stores both cost fields as 0 on a day that generated 120.25
 * million kWh at a 6,448 MW evening peak. The grid does not run for free.
 *
 * 46 days carry a zero average production cost and five a zero total. Read as
 * a measurement, each one produces "Average production cost fell 100%" against
 * any ordinary day — a headline manufactured out of a gap in a report, which is
 * the one thing this engine exists not to do.
 *
 * Deliberately narrow. Load shedding, unserved energy, outage counts and
 * generation by fuel can all be a true zero — the monthly reports carry 206
 * genuine zeroes for wind and solar in years when the country had neither — so
 * none of them goes through here.
 */
function positiveOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Gas totals are null, not zero, when Petrobangla has not filed the window.
 * The archive writes six explicit zero rows to mean "not published yet" (see
 * `_apply_gas_fallback`), so an all-zero table must not read as a real collapse.
 */
function summaryTotal(day: GridDailyData): number | null {
  const rows = day.gasProductionData ?? [];
  if (!rows.length) return null;
  const total = rows.reduce((acc, r) => acc + (r.gas ?? 0), 0);
  return total === 0 ? null : total;
}

function summaryLng(day: GridDailyData): number | null {
  const rows = day.gasProductionData ?? [];
  if (!rows.length || summaryTotal(day) === null) return null;
  return rows.filter((r) => r.company.includes('RPGCL')).reduce((acc, r) => acc + (r.gas ?? 0), 0);
}

/**
 * The day's gas production, from whichever source published it.
 *
 * The grid file carries a six-company summary, and on 3,048 days it is six
 * zeroes — the archive's way of saying the window had not been filed when the
 * grid day was written. On 765 of those days the Petrobangla report for that
 * exact window IS in the archive, reconciled and complete, and the panel was
 * showing a dash beside it.
 *
 * So the summary is preferred where it exists, and the Petrobangla document's
 * own printed grand total is used where it does not. Not a re-sum of anything:
 * the two agree on 1,366 of the 1,432 days that carry both, and where they
 * differ it is by a fraction of a percent.
 */
function gasTotal(ctx: DayContext): number | null {
  const fromSummary = summaryTotal(ctx.day);
  if (fromSummary !== null) return fromSummary;
  return ctx.gasArchive ? archiveTotalOf(ctx.gasArchive) : null;
}

function gasLng(ctx: DayContext): number | null {
  const fromSummary = summaryLng(ctx.day);
  if (fromSummary !== null) return fromSummary;
  // Only alongside a total from the same source; an LNG figure without the
  // total it belongs to cannot produce the domestic split below.
  if (summaryTotal(ctx.day) !== null || !ctx.gasArchive) return null;
  return archiveLngOf(ctx.gasArchive);
}

function gasDomestic(ctx: DayContext): number | null {
  const total = gasTotal(ctx);
  const lng = gasLng(ctx);
  return total === null || lng === null ? null : total - lng;
}

/** Whether a day's gas figures came from the Petrobangla report, not the grid file. */
function gasFromArchive(ctx: DayContext): boolean {
  return summaryTotal(ctx.day) === null && ctx.gasArchive !== null && gasTotal(ctx) !== null;
}

function distributionTotal(day: GridDailyData, key: 'power' | 'fertilizer' | 'others'): number | null {
  const rows = day.gasDistributionData ?? [];
  if (!rows.length) return null;
  const total = rows.reduce((acc, r) => acc + (r[key] ?? 0), 0);
  return total === 0 ? null : total;
}

/* ── the fixed metric set ────────────────────────────────────────────────── */

const SYSTEM_METRICS: Metric[] = [
  // Peaks, energy and cost all go through `positiveOrNull`: a grid with a
  // published report did not peak at 0 MW, generate 0 kWh or cost 0 taka, so a
  // zero in any of them is a figure the report did not carry. See the note on
  // that helper for the two records that prove it.
  { id: 'system.eveningPeakDemand', section: 'system', label: 'Evening peak demand', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.eveningPeakDemand) },
  { id: 'system.eveningPeakGen', section: 'system', label: 'Evening peak generation', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.eveningPeakGen) },
  { id: 'system.dayPeakDemand', section: 'system', label: 'Day peak demand', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.dayPeakDemand) },
  { id: 'system.dayPeakGen', section: 'system', label: 'Day peak generation', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.dayPeakGen) },
  { id: 'system.maxGen', section: 'system', label: 'Maximum generation', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.maxGen) },
  { id: 'system.minGen', section: 'system', label: 'Minimum generation (08:00)', unit: 'MW', value: ({ day: d }) => positiveOrNull(d.systemStats.minGen) },
  { id: 'system.totalEnergyGen', section: 'system', label: 'Total energy generated', unit: 'MKWh', value: ({ day: d }) => positiveOrNull(d.systemStats.totalEnergyGen) },
  { id: 'system.totalEnergyDemand', section: 'system', label: 'Total energy demand', unit: 'MKWh', value: ({ day: d }) => positiveOrNull(d.systemStats.totalEnergyDemand) },
  // NOT positive-only: a day with nothing unserved is a real and good day, and
  // the archive publishes it as 0.
  { id: 'system.totalEnergyUnserved', section: 'system', label: 'Energy unserved', unit: 'MKWh', value: ({ day: d }) => d.systemStats.totalEnergyUnserved ?? null },
  { id: 'system.maxTemp', section: 'system', label: 'Maximum temperature', unit: '°C', value: ({ day: d }) => d.systemStats.maxTemp },
  { id: 'system.avgProductionCost', section: 'system', label: 'Average production cost', unit: 'Tk/kWh', value: ({ day: d }) => positiveOrNull(d.systemStats.avgProductionCost) },
  {
    id: 'system.totalDailyCost',
    section: 'system',
    label: 'Total generation cost',
    unit: 'crore BDT',
    // Stored in taka; a crore is 1e7. Getting this wrong is how an earlier
    // sheet published a figure ten times too high.
    value: ({ day: d }) => {
      const taka = positiveOrNull(d.systemStats.totalDailyCost);
      return taka === null ? null : taka / 1e7;
    },
  },
];

const SHEDDING_METRICS: Metric[] = [
  {
    id: 'shedding.total',
    section: 'shedding',
    label: 'Total load shedding',
    unit: 'MW',
    value: ({ day: d }) => sumOrNull((d.regionalDemandData ?? []).map((r) => r.loadShed)),
    basis: ({ day: d }) =>
      (d.regionalDemandData ?? []).filter((r) => typeof r.loadShed === 'number').length,
    basisNoun: 'zones',
  },
  {
    // Its own row, because a total without its denominator is not a total. The
    // archive runs 9 zones on 3,855 days, none on 669 and something else on 10.
    id: 'shedding.zonesReporting',
    section: 'shedding',
    label: 'Zones reporting shedding',
    unit: 'count',
    value: ({ day: d }) => {
      const rows = (d.regionalDemandData ?? []).filter((r) => typeof r.loadShed === 'number');
      return rows.length ? rows.length : null;
    },
  },
  {
    id: 'shedding.peakHour',
    section: 'shedding',
    label: 'Worst hour shedding',
    unit: 'MW',
    value: ({ day: d }) => {
      const shed = (d.hourlyLoadData ?? []).map((h) => h.loadShed).filter((v): v is number => typeof v === 'number');
      return shed.length ? Math.max(...shed) : null;
    },
    // The worst of six published hours is not the worst of the day. Every day
    // in the archive currently publishes all or none, but the guard costs
    // nothing and the claim in the label is absolute.
    basis: ({ day: d }) =>
      (d.hourlyLoadData ?? []).filter((h) => typeof h.loadShed === 'number').length,
    basisNoun: 'hours',
  },
  {
    id: 'shedding.hoursAffected',
    section: 'shedding',
    label: 'Hours with shedding',
    unit: 'hours',
    value: ({ day: d }) => {
      const rows = (d.hourlyLoadData ?? []).filter((h) => typeof h.loadShed === 'number');
      // No published hourly shedding at all is unknown, not "zero hours".
      return rows.length ? rows.filter((h) => (h.loadShed as number) > 0).length : null;
    },
    basis: ({ day: d }) =>
      (d.hourlyLoadData ?? []).filter((h) => typeof h.loadShed === 'number').length,
    basisNoun: 'hours',
  },
];

/** How many company rows a day's offtake table carries, for the basis check. */
const distRows = ({ day: d }: DayContext) => (d.gasDistributionData ?? []).length;

const GAS_METRICS: Metric[] = [
  // No `basis` on these three any more: the figure may now come from the
  // Petrobangla grand total, which is a printed total rather than a sum of the
  // six summary rows, and counting those rows would describe the wrong thing.
  { id: 'gas.total', section: 'gas', label: 'Total gas production', unit: 'MMCFD', value: gasTotal },
  { id: 'gas.domestic', section: 'gas', label: 'Domestic gas production', unit: 'MMCFD', value: gasDomestic },
  { id: 'gas.lng', section: 'gas', label: 'LNG (R-LNG) supply', unit: 'MMCFD', value: gasLng },
  // Positive-only for the same reason as the cost fields, and stated rather
  // than left to `||`, which happened to do the right thing by accident.
  { id: 'gas.toPower', section: 'gas', label: 'Gas supplied to power', unit: 'MMCFD', value: ({ day: d }) => positiveOrNull(d.systemStats.totalGasSuppliedPower) },
  { id: 'gas.offtakePower', section: 'gas', label: 'Offtake — power', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'power'), basis: distRows, basisNoun: 'companies' },
  { id: 'gas.offtakeFertilizer', section: 'gas', label: 'Offtake — fertiliser', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'fertilizer'), basis: distRows, basisNoun: 'companies' },
  { id: 'gas.offtakeOthers', section: 'gas', label: 'Offtake — others', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'others'), basis: distRows, basisNoun: 'companies' },
];

const OUTAGE_METRICS: Metric[] = [
  {
    id: 'outages.count',
    section: 'outages',
    label: 'Reported outages',
    unit: 'count',
    /**
     * An empty list is unknown, not zero.
     *
     * Four days carry `dailyOutages: []`, and three of them are visibly thin
     * parses — 2014-01-03 and 2014-07-01 have no regional table and no hourly
     * curve either, and 2017-11-29 also stores a zero production cost. The
     * archive's smallest real figure is one outage. Publishing "0 reported
     * outages" against a day with 26 would print a 100% fall that PGCB never
     * reported; withholding it says only that we do not know, which is true.
     */
    value: ({ day: d }) => (d.dailyOutages?.length ? d.dailyOutages.length : null),
  },
];

export const FIXED_METRICS: Metric[] = [
  ...SYSTEM_METRICS,
  ...SHEDDING_METRICS,
  ...GAS_METRICS,
  ...OUTAGE_METRICS,
];

/* ── per-category metrics, discovered from the days themselves ───────────── */

/**
 * Fuels, interconnectors and zones are not a fixed list — PGCB's layouts differ
 * by era, and a fuel absent from a layout is absent, not zero. So these metrics
 * are built from the union of what the two days actually carry, and a category
 * present in only one of them compares against null rather than 0.
 */
/**
 * The same fuel under two spellings, mapped to one.
 *
 * PGCB prints "HSD (Diesel)" on 2,495 days and "HSD" on 348, and no day carries
 * both — they are the same high-speed diesel under two layouts. The eras
 * overlap (the short spelling runs 2025-01-01 to 2026-08-19, the long one to
 * 2026-06-29), so an ordinary 2025-vs-2026 comparison straddles them.
 *
 * Keyed on the raw name, that produced two rows: "HSD (Diesel)" with a figure
 * on one day and nothing on the other, and "HSD" the other way round. The table
 * read as diesel generation stopping dead and an unrelated fuel appearing in
 * its place — a story invented entirely by a change of label.
 *
 * Only synonyms with that evidence behind them belong here. Two names that
 * ever appear on the same day are two different things, and aliasing them
 * would merge real figures.
 */
const FUEL_ALIASES: Record<string, string> = {
  HSD: 'HSD (Diesel)',
};

const canonicalFuel = (name: string): string => FUEL_ALIASES[name] ?? name;

function dynamicMetrics(contexts: DayContext[]): Metric[] {
  const out: Metric[] = [];

  const fuels = new Set<string>();
  const sources = new Set<string>();
  const zones = new Set<string>();
  for (const { day: d } of contexts) {
    for (const g of d.generationData ?? []) fuels.add(canonicalFuel(g.name));
    for (const i of d.borderImportsData ?? []) sources.add(i.source);
    for (const r of d.regionalDemandData ?? []) zones.add(r.zone);
  }

  for (const fuel of [...fuels].sort()) {
    out.push({
      id: `generation.${fuel}`,
      section: 'generation',
      label: fuel,
      unit: 'MKWh',
      value: ({ day: d }) =>
        (d.generationData ?? []).find((g) => canonicalFuel(g.name) === fuel)?.gen ?? null,
    });
  }

  for (const source of [...sources].sort()) {
    out.push({
      id: `imports.${source}`,
      section: 'imports',
      label: source,
      unit: 'MKWh',
      value: ({ day: d }) => (d.borderImportsData ?? []).find((i) => i.source === source)?.energy ?? null,
    });
  }

  for (const zone of [...zones].sort()) {
    out.push({
      id: `regional.${zone}.demand`,
      section: 'regional',
      label: `${zone} — demand`,
      unit: 'MW',
      value: ({ day: d }) => (d.regionalDemandData ?? []).find((r) => r.zone === zone)?.demand ?? null,
    });
    out.push({
      id: `regional.${zone}.loadShed`,
      section: 'regional',
      label: `${zone} — load shed`,
      unit: 'MW',
      value: ({ day: d }) => (d.regionalDemandData ?? []).find((r) => r.zone === zone)?.loadShed ?? null,
    });
  }

  return out;
}

/* ── comparison ──────────────────────────────────────────────────────────── */

export type ComparisonRow = {
  section: SectionId;
  id: string;
  label: string;
  unit: string;
  a: number | null;
  b: number | null;
  delta: number | null;
  /** Null when a percentage would be meaningless: unpublished, or a zero base. */
  pct: number | null;
  note?: string;
};

export type ComparisonResult =
  | {
      ok: true;
      a: string;
      b: string;
      rows: ComparisonRow[];
      sections: SectionId[];
      /** Anything the reader needs told about the comparison as a whole. */
      notes: string[];
    }
  | { ok: false; error: string };

/**
 * "6 zones", "1 zone" — the note is a sentence a reader has to trust, and
 * "sums 1 zones" is the kind of thing that makes them stop trusting it.
 */
export function countOf(n: number, noun = 'rows'): string {
  const one = noun.endsWith('ies') ? `${noun.slice(0, -3)}y` : noun.replace(/s$/, '');
  return `${n} ${n === 1 ? one : noun}`;
}

function changeOf(a: number | null, b: number | null): { delta: number | null; pct: number | null; note?: string } {
  if (a === null && b === null) return { delta: null, pct: null, note: 'neither day publishes this' };
  if (a === null) return { delta: null, pct: null, note: 'not published on the first day' };
  if (b === null) return { delta: null, pct: null, note: 'not published on the second day' };
  const delta = b - a;
  // A percentage against zero is infinite, not "100%".
  return { delta, pct: a === 0 ? null : (delta / a) * 100, note: a === 0 ? 'no percentage — the base is zero' : undefined };
}

async function loadDay(iso: string): Promise<GridDailyData | null> {
  const res = await loadDailyReportFromDisk(iso);
  return res.ok ? res.data : null;
}

/**
 * Read the Petrobangla day that covers this energy day.
 *
 * It used to read `{iso}.json` directly, which is wrong for 2,149 of the 2,297
 * files: Petrobangla files the 08:00–08:00 window that opens on E on the
 * morning of E+1, so that file holds the PREVIOUS day's production. The
 * resolver checks each candidate's own `report_date_start` instead. See
 * `petrobangla-day.server.ts` for the evidence.
 *
 * `public/data/petrobangla/daily` must be traced into whatever route calls this
 * (see `outputFileTracingIncludes` in next.config.ts); plants and curves cannot
 * be read here at all, because they are excluded from every function bundle.
 */
async function loadGasArchiveDay(iso: string): Promise<GasArchiveDay | null> {
  const { loadPetrobanglaForEnergyDay } = await import('@/lib/data/grid/petrobangla-day.server');
  const found = await loadPetrobanglaForEnergyDay(iso);
  return (found?.doc as GasArchiveDay) ?? null;
}

/**
 * Read one day's station detail.
 *
 * `public/data/plants` is excluded from EVERY function bundle in next.config.ts
 * — the directory is 151MB and the config records a deploy already hitting the
 * 250MB function limit — so this succeeds on the operator's machine and for any
 * day published as a release, and returns null on the deployed site. The caller
 * says so out loud rather than letting 149 stations read as zero.
 */
async function loadStationDay(iso: string): Promise<StationDay | null> {
  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    const released = await getReleaseOverride('GRID_PLANTS', iso);
    if (released) return released as StationDay;
  } catch {
    // Enhancement only.
  }
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), 'public', 'data', 'plants', `${iso}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as StationDay;
  } catch {
    return null;
  }
}

/**
 * Per-station metrics, from the union of stations the days name.
 *
 * A station absent from one day's report compares against null: plants are
 * commissioned, retired and omitted, and "not listed" is not "generated 0 MW".
 */
function stationMetrics(contexts: DayContext[]): Metric[] {
  const names = new Set<string>();
  for (const { stations } of contexts) {
    for (const st of stations?.plants ?? []) if (st.name) names.add(st.name);
  }
  if (!names.size) return [];

  return [...names].sort().map((name) => ({
    id: `stations.${name}`,
    section: 'stations' as SectionId,
    label: name,
    unit: 'MW',
    value: ({ stations }: DayContext) => {
      const row = (stations?.plants ?? []).find((st) => st.name === name);
      return typeof row?.eveningPeakMw === 'number' ? row.eveningPeakMw : null;
    },
  }));
}

/**
 * Field-level metrics, built from the union of fields the two days name.
 *
 * Petrobangla's field list changes as fields come on and off production, so a
 * field present in one day and absent from the other compares against null —
 * "this report does not list it" — rather than zero, which would read as a
 * field that produced nothing.
 */
function gasFieldMetrics(contexts: DayContext[]): Metric[] {
  const names = new Set<string>();
  for (const { gasArchive } of contexts) {
    for (const f of gasArchive?.production?.fields ?? []) if (f.field) names.add(f.field);
  }
  if (!names.size) return [];

  return [...names].sort().map((field) => ({
    id: `gasFields.${field}`,
    section: 'gasFields' as SectionId,
    label: field,
    unit: 'MMCFD',
    value: ({ gasArchive }: DayContext) => {
      const row = (gasArchive?.production?.fields ?? []).find((f) => f.field === field);
      return typeof row?.gas_mmcfd === 'number' ? row.gas_mmcfd : null;
    },
  }));
}

export async function compareDates(
  aDate: string,
  bDate: string,
  opts?: { sections?: SectionId[]; metricIds?: string[] },
): Promise<ComparisonResult> {
  const [a, b, gasA, gasB, stA, stB] = await Promise.all([
    loadDay(aDate),
    loadDay(bDate),
    loadGasArchiveDay(aDate),
    loadGasArchiveDay(bDate),
    loadStationDay(aDate),
    loadStationDay(bDate),
  ]);
  if (!a) return { ok: false, error: `No archived day for ${aDate}` };
  if (!b) return { ok: false, error: `No archived day for ${bDate}` };

  const ctxA: DayContext = { iso: aDate, day: a, gasArchive: gasA, stations: stA };
  const ctxB: DayContext = { iso: bDate, day: b, gasArchive: gasB, stations: stB };

  const all = [
    ...FIXED_METRICS,
    ...dynamicMetrics([ctxA, ctxB]),
    ...gasFieldMetrics([ctxA, ctxB]),
    ...stationMetrics([ctxA, ctxB]),
  ];
  const wanted = all.filter((m) => {
    if (opts?.metricIds?.length) return opts.metricIds.includes(m.id);
    if (opts?.sections?.length) return opts.sections.includes(m.section);
    return true;
  });

  const rows: ComparisonRow[] = wanted.map((m) => {
    const av = m.value(ctxA);
    const bv = m.value(ctxB);
    const change = changeOf(av, bv);

    /**
     * A total summed over six zones is not comparable with one summed over
     * nine, however real both numbers are. Ten days in the archive publish a
     * short regional table — 2016-09-01 lists six zones, 2014-12-02 lists one —
     * and subtracting those from a full day attributes the missing zones to a
     * change in the grid.
     *
     * Both figures still show, because both are what that day published. What
     * is withheld is the arithmetic between them, which nobody reported.
     */
    let { delta, pct, note } = change;
    if (m.basis && av !== null && bv !== null) {
      const na = m.basis(ctxA);
      const nb = m.basis(ctxB);
      if (na !== nb) {
        delta = null;
        pct = null;
        note =
          `not like for like — ${aDate} sums ${countOf(na, m.basisNoun)}, ` +
          `${bDate} sums ${countOf(nb, m.basisNoun)}`;
      }
    }

    return { section: m.section, id: m.id, label: m.label, unit: m.unit, a: av, b: bv, delta, pct, note };
  });

  const notes: string[] = [];

  // A section the editor asked for that came back with nothing. Without this
  // the section simply vanishes from the table, which reads as "nothing
  // happened in it" rather than "neither day publishes it".
  const asked = opts?.metricIds?.length
    ? []
    : (opts?.sections?.length ? opts.sections : SECTIONS.map((x) => x.id));
  const produced = new Set(rows.map((r) => r.section));
  // Gas fields and power stations have their own notes below, naming the file
  // that could not be read; listing them here as well says the same thing
  // twice and less precisely.
  const emptyAsked = asked.filter(
    (id) => !produced.has(id) && id !== 'gasFields' && id !== 'stations',
  );
  if (emptyAsked.length) {
    const labels = emptyAsked.map((id) => SECTIONS.find((x) => x.id === id)?.label ?? id);
    notes.push(
      `Nothing to compare in: ${labels.join(', ')} — neither ${aDate} nor ${bDate} carries ` +
        `${emptyAsked.length === 1 ? 'that section' : 'those sections'}.`,
    );
  }

  if (!stA || !stB) {
    const missing = [!stA ? aDate : null, !stB ? bDate : null].filter(Boolean).join(' and ');
    notes.push(
      `Per-station figures are unavailable for ${missing} — the station detail could not be read. ` +
        `Every other section is unaffected.`,
    );
  }
  // Where the figures came from. The two sources agree closely, but a reader
  // checking a number against the PGCB workbook needs to know when it is not
  // in there — the grid file left that day's gas summary blank and the figure
  // is Petrobangla's own printed total.
  const viaArchive = [gasFromArchive(ctxA) ? aDate : null, gasFromArchive(ctxB) ? bDate : null]
    .filter((x): x is string => Boolean(x));
  if (viaArchive.length) {
    notes.push(
      `Gas production for ${viaArchive.join(' and ')} is read from the Petrobangla daily report — ` +
        `the grid file carries no gas summary for ${viaArchive.length === 1 ? 'that day' : 'those days'}.`,
    );
  }

  if (!gasA || !gasB) {
    // Field-level gas comes from the Petrobangla archive day, a separate file
    // from the grid payload. It is NOT traced into deployed function bundles:
    // that directory is 109MB and the config already records a deploy hitting
    // the 250MB function limit. So the section is available on the operator's
    // machine and for any day published as a release, and absent otherwise —
    // said out loud here, because a silently missing section reads as "these
    // fields produced nothing".
    const missing = [!gasA ? aDate : null, !gasB ? bDate : null].filter(Boolean).join(' and ');
    notes.push(
      `Field-by-field gas is unavailable for ${missing} — the Petrobangla archive day could not be read. ` +
        `Every other section is unaffected.`,
    );
  }

  return {
    ok: true,
    a: aDate,
    b: bDate,
    rows,
    sections: [...new Set(rows.map((r) => r.section))],
    notes,
  };
}

/** One metric across many days — the shape a spreadsheet wants. */
export async function seriesForDates(
  dates: string[],
  metricIds?: string[],
): Promise<{ dates: string[]; metrics: Array<{ id: string; label: string; unit: string; values: Array<number | null> }> }> {
  const [days, archives, stations] = await Promise.all([
    Promise.all(dates.map(loadDay)),
    Promise.all(dates.map(loadGasArchiveDay)),
    Promise.all(dates.map(loadStationDay)),
  ]);
  const contexts: Array<DayContext | null> = dates.map((iso, i) => {
    const day = days[i];
    return day ? { iso, day, gasArchive: archives[i], stations: stations[i] } : null;
  });
  const present = contexts.filter((c): c is DayContext => Boolean(c));
  const all = [
    ...FIXED_METRICS,
    ...dynamicMetrics(present),
    ...gasFieldMetrics(present),
    ...stationMetrics(present),
  ];
  const wanted = metricIds?.length ? all.filter((m) => metricIds.includes(m.id)) : all;

  return {
    dates,
    metrics: wanted.map((m) => ({
      id: m.id,
      label: m.label,
      unit: m.unit,
      values: contexts.map((c) => (c ? m.value(c) : null)),
    })),
  };
}

/* ── serialisers ─────────────────────────────────────────────────────────── */

const num = (v: number | null, dp = 2): string =>
  v === null ? '' : Number.isInteger(v) ? String(v) : v.toFixed(dp);

/** Blank, not 0 — an empty cell is how a spreadsheet says "no figure". */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The shape the serialisers actually need.
 *
 * Daily and monthly comparisons produce the same rows against different section
 * vocabularies, so the writers take this rather than the daily result type —
 * one CSV writer, one text writer, one JSON writer, whichever period is being
 * compared.
 */
export type AnyComparison = {
  a: string;
  b: string;
  rows: ReadonlyArray<Omit<ComparisonRow, 'section'> & { section: string }>;
  notes: string[];
};

/**
 * The comparison as a spreadsheet.
 *
 * The labels follow the output language, the numbers never do: a cell holding
 * Bengali numerals is text to Excel, not a number, and a column of it cannot be
 * summed, charted or sorted. The point of the .csv is that something else can
 * compute with it.
 */
export function comparisonToCsv(
  result: AnyComparison,
  sectionName: (id: string) => string = (id) => SECTIONS.find((x) => x.id === id)?.label ?? id,
  lang: Lang = 'en',
): string {
  const t = strings(lang);
  const head = [
    lang === 'bn' ? 'বিভাগ' : 'Section',
    t.metric,
    t.unit,
    result.a,
    result.b,
    t.change,
    t.changePct,
    t.note,
  ];
  const lines = [head.map(csvCell).join(',')];
  for (const r of result.rows) {
    lines.push(
      [
        sectionLabelI18n(r.section, sectionName(r.section), lang),
        metricLabel(r.id, r.label, lang),
        unitLabel(r.unit, lang),
        num(r.a),
        num(r.b),
        num(r.delta),
        r.pct === null ? '' : r.pct.toFixed(1),
        r.note ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}

export function seriesToCsv(series: Awaited<ReturnType<typeof seriesForDates>>): string {
  const lines = [['Metric', 'Unit', ...series.dates].map(csvCell).join(',')];
  for (const m of series.metrics) {
    lines.push([m.label, m.unit, ...m.values.map((v) => num(v))].map(csvCell).join(','));
  }
  return lines.join('\n') + '\n';
}

/**
 * The comparison as the plain-text block the panel previews and exports.
 *
 * `lang` is the language of the OUTPUT, not of the CMS: it swaps the headings,
 * the fixed metric names, the units and the numerals, and leaves everything the
 * archive supplies — station, field and substation names — as printed.
 *
 * Columns are padded by code point rather than by UTF-16 unit. Bengali sits in
 * the BMP so the two agree today, but the padding is what holds this format
 * together and it should not depend on that staying true.
 */
export function comparisonToText(
  result: AnyComparison,
  sectionLabel: (id: string) => string = (id) => SECTIONS.find((x) => x.id === id)?.label ?? id,
  lang: Lang = 'en',
): string {
  const width = { label: 34, unit: 10, val: 14 };
  const t = strings(lang);
  const loc = (v: string) => (lang === 'bn' ? toBnDigits(v) : v);

  const padEndCp = (v: string, w: number) => {
    const n = [...v].length;
    return n >= w ? v : v + ' '.repeat(w - n);
  };
  const padStartCp = (v: string, w: number) => {
    const n = [...v].length;
    return n >= w ? v : ' '.repeat(w - n) + v;
  };
  const clipCp = (v: string, w: number) => [...v].slice(0, w).join('');

  const lines: string[] = [
    t.docTitle,
    `${result.a}  vs  ${result.b}`,
    '='.repeat(96),
    '',
    padEndCp(t.metric, width.label) +
      padEndCp(t.unit, width.unit) +
      padStartCp(result.a, width.val) +
      padStartCp(result.b, width.val) +
      padStartCp(t.change, width.val) +
      padStartCp(t.changePct, 12),
    '-'.repeat(96),
  ];

  let current: string | null = null;
  for (const r of result.rows) {
    if (r.section !== current) {
      current = r.section;
      lines.push('', sectionLabel2(current, sectionLabel, lang).toUpperCase());
    }
    lines.push(
      padEndCp(clipCp(metricLabel(r.id, r.label, lang), width.label - 1), width.label) +
        padEndCp(unitLabel(r.unit, lang), width.unit) +
        padStartCp(r.a === null ? '—' : loc(num(r.a)), width.val) +
        padStartCp(r.b === null ? '—' : loc(num(r.b)), width.val) +
        padStartCp(
          r.delta === null ? '—' : (r.delta >= 0 ? '+' : '') + loc(num(r.delta)),
          width.val,
        ) +
        padStartCp(
          r.pct === null ? '—' : `${r.pct >= 0 ? '▲' : '▼'} ${loc(Math.abs(r.pct).toFixed(1))}%`,
          12,
        ),
    );
  }

  const unpublished = result.rows.filter((r) => r.note).length;
  lines.push('', '-'.repeat(96), t.docSource, t.docDashRule);
  if (unpublished) {
    lines.push(
      lang === 'bn'
        ? `${toBnDigits(String(unpublished))} টি সারি এ কারণে তুলনা করা যায়নি।`
        : `${unpublished} row(s) could not be compared for that reason.`,
    );
  }
  // Engine warnings are printed as they came: they are prose about this
  // particular pair of days, not labels, and translating them by hand here
  // would put a second copy of that wording out of reach of the engine.
  for (const note of result.notes) lines.push(note);

  return lines.join('\n') + '\n';
}

/** The section heading, translated when the id has a Bengali name. */
function sectionLabel2(id: string, english: (id: string) => string, lang: Lang): string {
  return sectionLabelI18n(id, english(id), lang);
}

/**
 * The comparison as JSON.
 *
 * `label` follows the output language; `id`, the keys and the numbers do not.
 * A consumer keys off the id, and renaming the keys per language would make the
 * two exports different formats rather than one format in two languages.
 */
export function comparisonToJson(result: AnyComparison, lang: Lang = 'en'): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: 'PGCB daily report; Petrobangla daily gas report',
      language: lang,
      compared: { a: result.a, b: result.b },
      note: 'null means the figure was not published for that day, never zero.',
      rows: result.rows.map((r) => ({
        ...r,
        label: metricLabel(r.id, r.label, lang),
        unit: unitLabel(r.unit, lang),
      })),
    },
    null,
    2,
  );
}
