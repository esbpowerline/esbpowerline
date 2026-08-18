import 'server-only';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import type { GridDailyData } from '@/lib/data/grid/types';

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
 * Gas totals are null, not zero, when Petrobangla has not filed the window.
 * The archive writes six explicit zero rows to mean "not published yet" (see
 * `_apply_gas_fallback`), so an all-zero table must not read as a real collapse.
 */
function gasTotal(day: GridDailyData): number | null {
  const rows = day.gasProductionData ?? [];
  if (!rows.length) return null;
  const total = rows.reduce((acc, r) => acc + (r.gas ?? 0), 0);
  return total === 0 ? null : total;
}

function gasLng(day: GridDailyData): number | null {
  const rows = day.gasProductionData ?? [];
  if (!rows.length || gasTotal(day) === null) return null;
  return rows.filter((r) => r.company.includes('RPGCL')).reduce((acc, r) => acc + (r.gas ?? 0), 0);
}

function gasDomestic(day: GridDailyData): number | null {
  const total = gasTotal(day);
  const lng = gasLng(day);
  return total === null || lng === null ? null : total - lng;
}

function distributionTotal(day: GridDailyData, key: 'power' | 'fertilizer' | 'others'): number | null {
  const rows = day.gasDistributionData ?? [];
  if (!rows.length) return null;
  const total = rows.reduce((acc, r) => acc + (r[key] ?? 0), 0);
  return total === 0 ? null : total;
}

/* ── the fixed metric set ────────────────────────────────────────────────── */

const SYSTEM_METRICS: Metric[] = [
  { id: 'system.eveningPeakDemand', section: 'system', label: 'Evening peak demand', unit: 'MW', value: ({ day: d }) => d.systemStats.eveningPeakDemand ?? null },
  { id: 'system.eveningPeakGen', section: 'system', label: 'Evening peak generation', unit: 'MW', value: ({ day: d }) => d.systemStats.eveningPeakGen ?? null },
  { id: 'system.dayPeakDemand', section: 'system', label: 'Day peak demand', unit: 'MW', value: ({ day: d }) => d.systemStats.dayPeakDemand },
  { id: 'system.dayPeakGen', section: 'system', label: 'Day peak generation', unit: 'MW', value: ({ day: d }) => d.systemStats.dayPeakGen ?? null },
  { id: 'system.maxGen', section: 'system', label: 'Maximum generation', unit: 'MW', value: ({ day: d }) => d.systemStats.maxGen },
  { id: 'system.minGen', section: 'system', label: 'Minimum generation (08:00)', unit: 'MW', value: ({ day: d }) => d.systemStats.minGen },
  { id: 'system.totalEnergyGen', section: 'system', label: 'Total energy generated', unit: 'MKWh', value: ({ day: d }) => d.systemStats.totalEnergyGen },
  { id: 'system.totalEnergyDemand', section: 'system', label: 'Total energy demand', unit: 'MKWh', value: ({ day: d }) => d.systemStats.totalEnergyDemand },
  { id: 'system.totalEnergyUnserved', section: 'system', label: 'Energy unserved', unit: 'MKWh', value: ({ day: d }) => d.systemStats.totalEnergyUnserved },
  { id: 'system.maxTemp', section: 'system', label: 'Maximum temperature', unit: '°C', value: ({ day: d }) => d.systemStats.maxTemp },
  { id: 'system.avgProductionCost', section: 'system', label: 'Average production cost', unit: 'Tk/kWh', value: ({ day: d }) => d.systemStats.avgProductionCost ?? null },
  {
    id: 'system.totalDailyCost',
    section: 'system',
    label: 'Total generation cost',
    unit: 'crore Tk',
    // Stored in taka; a crore is 1e7. Getting this wrong is how an earlier
    // sheet published a figure ten times too high.
    value: ({ day: d }) => (typeof d.systemStats.totalDailyCost === 'number' ? d.systemStats.totalDailyCost / 1e7 : null),
  },
];

const SHEDDING_METRICS: Metric[] = [
  {
    id: 'shedding.total',
    section: 'shedding',
    label: 'Total load shedding',
    unit: 'MW',
    value: ({ day: d }) => sumOrNull((d.regionalDemandData ?? []).map((r) => r.loadShed)),
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
  },
];

const GAS_METRICS: Metric[] = [
  { id: 'gas.total', section: 'gas', label: 'Total gas production', unit: 'MMCFD', value: ({ day }) => gasTotal(day) },
  { id: 'gas.domestic', section: 'gas', label: 'Domestic gas production', unit: 'MMCFD', value: ({ day }) => gasDomestic(day) },
  { id: 'gas.lng', section: 'gas', label: 'LNG (R-LNG) supply', unit: 'MMCFD', value: ({ day }) => gasLng(day) },
  { id: 'gas.toPower', section: 'gas', label: 'Gas supplied to power', unit: 'MMCFD', value: ({ day: d }) => d.systemStats.totalGasSuppliedPower || null },
  { id: 'gas.offtakePower', section: 'gas', label: 'Offtake — power', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'power') },
  { id: 'gas.offtakeFertilizer', section: 'gas', label: 'Offtake — fertiliser', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'fertilizer') },
  { id: 'gas.offtakeOthers', section: 'gas', label: 'Offtake — others', unit: 'MMCFD', value: ({ day: d }) => distributionTotal(d, 'others') },
];

const OUTAGE_METRICS: Metric[] = [
  {
    id: 'outages.count',
    section: 'outages',
    label: 'Reported outages',
    unit: 'count',
    value: ({ day: d }) => (d.dailyOutages ? d.dailyOutages.length : null),
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
function dynamicMetrics(contexts: DayContext[]): Metric[] {
  const out: Metric[] = [];

  const fuels = new Set<string>();
  const sources = new Set<string>();
  const zones = new Set<string>();
  for (const { day: d } of contexts) {
    for (const g of d.generationData ?? []) fuels.add(g.name);
    for (const i of d.borderImportsData ?? []) sources.add(i.source);
    for (const r of d.regionalDemandData ?? []) zones.add(r.zone);
  }

  for (const fuel of [...fuels].sort()) {
    out.push({
      id: `generation.${fuel}`,
      section: 'generation',
      label: fuel,
      unit: 'MKWh',
      value: ({ day: d }) => (d.generationData ?? []).find((g) => g.name === fuel)?.gen ?? null,
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
 * Read one Petrobangla archive day: the runtime release if published, else the
 * archive file — the same precedence and the same fail-soft as the member
 * export uses. Field-level gas is the one part of the Gas tab the daily grid
 * payload only carries in six-company summary form.
 *
 * `public/data/petrobangla/daily` must be traced into whatever route calls this
 * (see `outputFileTracingIncludes` in next.config.ts); plants and curves cannot
 * be read here at all, because they are excluded from every function bundle.
 */
async function loadGasArchiveDay(iso: string): Promise<GasArchiveDay | null> {
  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    const released = await getReleaseOverride('GAS_DAILY', iso);
    if (released) return released as GasArchiveDay;
  } catch {
    // Enhancement only — fall through to the file.
  }
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), 'public', 'data', 'petrobangla', 'daily', `${iso}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as GasArchiveDay;
  } catch {
    return null;
  }
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
    const { delta, pct, note } = changeOf(av, bv);
    return { section: m.section, id: m.id, label: m.label, unit: m.unit, a: av, b: bv, delta, pct, note };
  });

  const notes: string[] = [];
  if (!stA || !stB) {
    const missing = [!stA ? aDate : null, !stB ? bDate : null].filter(Boolean).join(' and ');
    notes.push(
      `Per-station figures are unavailable for ${missing} — the station detail could not be read. ` +
        `Every other section is unaffected.`,
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

export function comparisonToCsv(result: AnyComparison): string {
  const head = ['Section', 'Metric', 'Unit', result.a, result.b, 'Change', 'Change %', 'Note'];
  const lines = [head.map(csvCell).join(',')];
  for (const r of result.rows) {
    lines.push(
      [
        r.section,
        r.label,
        r.unit,
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

export function comparisonToText(
  result: AnyComparison,
  sectionLabel: (id: string) => string = (id) => SECTIONS.find((x) => x.id === id)?.label ?? id,
): string {
  const width = { label: 34, unit: 10, val: 14 };
  const lines: string[] = [
    'ESB POWER LINE — GRID COMPARISON',
    `${result.a}  vs  ${result.b}`,
    '='.repeat(96),
    '',
    'Metric'.padEnd(width.label) +
      'Unit'.padEnd(width.unit) +
      result.a.padStart(width.val) +
      result.b.padStart(width.val) +
      'Change'.padStart(width.val) +
      'Change %'.padStart(12),
    '-'.repeat(96),
  ];

  let current: string | null = null;
  for (const r of result.rows) {
    if (r.section !== current) {
      current = r.section;
      lines.push('', sectionLabel(current).toUpperCase());
    }
    lines.push(
      r.label.slice(0, width.label - 1).padEnd(width.label) +
        r.unit.padEnd(width.unit) +
        (r.a === null ? '—' : num(r.a)).padStart(width.val) +
        (r.b === null ? '—' : num(r.b)).padStart(width.val) +
        (r.delta === null ? '—' : (r.delta >= 0 ? '+' : '') + num(r.delta)).padStart(width.val) +
        (r.pct === null ? '—' : `${r.pct >= 0 ? '▲' : '▼'} ${Math.abs(r.pct).toFixed(1)}%`).padStart(12),
    );
  }

  const unpublished = result.rows.filter((r) => r.note).length;
  lines.push(
    '',
    '-'.repeat(96),
    'Source: PGCB daily report and Petrobangla daily gas report.',
    '— means the figure was not published for that day; it is never treated as zero.',
  );
  if (unpublished) lines.push(`${unpublished} row(s) could not be compared for that reason.`);
  for (const note of result.notes) lines.push(note);

  return lines.join('\n') + '\n';
}

export function comparisonToJson(result: AnyComparison): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: 'PGCB daily report; Petrobangla daily gas report',
      compared: { a: result.a, b: result.b },
      note: 'null means the figure was not published for that day, never zero.',
      rows: result.rows,
    },
    null,
    2,
  );
}
