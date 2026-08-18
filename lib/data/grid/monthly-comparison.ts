import 'server-only';
import type { ComparisonRow } from '@/lib/data/grid/comparison';

/**
 * Compare any two PGCB monthly reports.
 *
 * The daily engine next door compares energy days; this compares months, which
 * are a different document with a different vocabulary — monthly reports carry
 * substation max loads, interruption counts and unserved energy that no daily
 * report publishes. Rows come out in the same shape, so the same serialisers
 * and the same table render both.
 *
 * The same rule governs it: **null is not zero.** PGCB's monthly layouts differ
 * by era — a figure absent from one month's sheets is absent, not nil — so
 * every metric is discovered from the months being compared rather than
 * hardcoded, and a metric only one month publishes compares against null.
 */

export type MonthlySectionId =
  | 'system'
  | 'fuel'
  | 'regional'
  | 'reliability'
  | 'zones'
  | 'substations'
  | 'interruptions';

export const MONTHLY_SECTIONS: ReadonlyArray<{
  id: MonthlySectionId;
  label: string;
  description: string;
}> = [
  { id: 'system', label: 'System', description: 'Peaks, generation and the shedding extremes' },
  { id: 'fuel', label: 'Generation by fuel', description: 'The month’s energy by fuel' },
  { id: 'regional', label: 'Regional supply', description: 'Supply by zone at the system peak' },
  { id: 'reliability', label: 'Reliability', description: 'Unserved energy and outage counts' },
  { id: 'zones', label: 'East / West', description: 'Zone totals at the system peak' },
  { id: 'substations', label: 'Substation max load', description: 'Every substation PGCB lists' },
  { id: 'interruptions', label: 'Interruptions', description: 'Per-substation interruptions and unserved energy' },
];

/* ── the monthly document, only as far as we read it ─────────────────────── */

type Keyed = Record<string, { value?: number | null } | undefined>;

export type MonthlyRecord = {
  date_key?: string;
  month?: string;
  year?: number;
  max_evening_peak_gen?: number | null;
  max_evening_peak_demand?: number | null;
  total_net_generation?: number | null;
  generation_by_fuel?: Record<string, number | null>;
  regional_supply?: Record<string, number | null>;
  detail?: {
    system?: { keyed?: Keyed };
    area_supply_at_system_peak?: { zone_totals?: Record<string, number | null> };
    tripping_outage?: { total?: { current?: Record<string, number | null> } };
    unserved_energy?: { total?: { current?: Record<string, number | null> } };
    substation_max_load?: Array<{ substation?: string; load_mw?: number | null }>;
    interruptions?: Array<{ substation?: string; interruptions?: number | null; unserved_mwh?: number | null }>;
    area_max_load?: Array<{ area?: string; load_mw?: number | null }>;
  };
};

const MONTH_RE = /^(201[1-9]|202[0-9])-(0[1-9]|1[0-2])$/;

/**
 * Read one month: the runtime release if published, else the archive file.
 *
 * `public/data/pgcb-monthly` is 31MB and is not excluded from function bundles
 * the way plants and curves are, but nothing traces it in either — so on the
 * deployed site this resolves through the release layer, and on the operator's
 * machine it reads the file. `compareMonths` says so when a month cannot be
 * read, rather than presenting an empty comparison.
 */
async function loadMonth(key: string): Promise<MonthlyRecord | null> {
  if (!MONTH_RE.test(key)) return null;

  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    const released = await getReleaseOverride('PGCB_MONTHLY', key);
    if (released) return released as MonthlyRecord;
  } catch {
    // Enhancement only — fall through to the file.
  }

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), 'public', 'data', 'pgcb-monthly', `${key}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as MonthlyRecord;
  } catch {
    return null;
  }
}

/* ── metrics ─────────────────────────────────────────────────────────────── */

type MonthlyMetric = {
  id: string;
  section: MonthlySectionId;
  label: string;
  unit: string;
  value: (m: MonthlyRecord) => number | null;
};

const numberOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/**
 * PGCB's own field names carry their unit as a suffix, so read it off rather
 * than maintaining a parallel table that can drift from the data.
 */
function unitFromKey(key: string): string {
  if (/_mwh$/.test(key)) return 'MWh';
  if (/_mkwh$/.test(key)) return 'MKWh';
  if (/_mw$/.test(key)) return 'MW';
  if (/_pct$/.test(key)) return '%';
  // `days_load_shed_evening` and friends are counts of days; everything else
  // without a recognised suffix gets no unit rather than an invented one.
  if (/^days_/.test(key)) return 'days';
  return '';
}

function humanise(key: string): string {
  const withoutUnit = key.replace(/_(mwh|mkwh|mw|pct)$/, '');
  const words = withoutUnit.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function fixedMetrics(): MonthlyMetric[] {
  return [
    {
      id: 'system.maxEveningPeakGen',
      section: 'system',
      label: 'Maximum evening peak generation',
      unit: 'MW',
      value: (m) => numberOrNull(m.max_evening_peak_gen),
    },
    {
      id: 'system.maxEveningPeakDemand',
      section: 'system',
      label: 'Maximum evening peak demand',
      unit: 'MW',
      value: (m) => numberOrNull(m.max_evening_peak_demand),
    },
    {
      id: 'system.totalNetGeneration',
      section: 'system',
      label: 'Total net generation',
      unit: 'MKWh',
      value: (m) => numberOrNull(m.total_net_generation),
    },
    {
      id: 'fuel.total',
      section: 'fuel',
      label: 'Generation by fuel — sum of the split',
      unit: 'MKWh',
      // Deliberately its own row rather than compared against net generation.
      // The split includes the import row while "total net generation" does
      // not, and the residual between them is small in recent months but not
      // constant across PGCB's earlier layouts — so the two are shown side by
      // side and no relationship is asserted.
      value: (m) => {
        const fuels = m.generation_by_fuel;
        if (!fuels) return null;
        const values = Object.values(fuels).filter((v): v is number => typeof v === 'number');
        return values.length ? values.reduce((a, b) => a + b, 0) : null;
      },
    },
  ];
}

/** Everything keyed by a name the months themselves supply. */
function dynamicMetrics(months: MonthlyRecord[]): MonthlyMetric[] {
  const out: MonthlyMetric[] = [];
  const union = (pick: (m: MonthlyRecord) => Record<string, unknown> | undefined): string[] => {
    const keys = new Set<string>();
    for (const m of months) for (const k of Object.keys(pick(m) ?? {})) keys.add(k);
    return [...keys].sort();
  };

  for (const key of union((m) => m.detail?.system?.keyed)) {
    out.push({
      id: `system.${key}`,
      section: 'system',
      label: humanise(key),
      unit: unitFromKey(key),
      value: (m) => numberOrNull(m.detail?.system?.keyed?.[key]?.value),
    });
  }

  for (const fuel of union((m) => m.generation_by_fuel)) {
    out.push({
      id: `fuel.${fuel}`,
      section: 'fuel',
      label: humanise(fuel),
      unit: 'MKWh',
      value: (m) => numberOrNull(m.generation_by_fuel?.[fuel]),
    });
  }

  for (const zone of union((m) => m.regional_supply)) {
    out.push({
      id: `regional.${zone}`,
      section: 'regional',
      label: humanise(zone),
      unit: 'MW',
      value: (m) => numberOrNull(m.regional_supply?.[zone]),
    });
  }

  for (const zone of union((m) => m.detail?.area_supply_at_system_peak?.zone_totals)) {
    out.push({
      id: `zones.${zone}`,
      section: 'zones',
      label: `${humanise(zone)} zone at system peak`,
      unit: 'MW',
      value: (m) => numberOrNull(m.detail?.area_supply_at_system_peak?.zone_totals?.[zone]),
    });
  }

  for (const kind of union((m) => m.detail?.unserved_energy?.total?.current)) {
    if (kind === 'circle') continue;
    out.push({
      id: `reliability.unserved.${kind}`,
      section: 'reliability',
      label: `Unserved energy — ${humanise(kind).toLowerCase()}`,
      unit: 'MWh',
      value: (m) => numberOrNull(m.detail?.unserved_energy?.total?.current?.[kind]),
    });
  }

  for (const kind of union((m) => m.detail?.tripping_outage?.total?.current)) {
    if (kind === 'circle') continue;
    out.push({
      id: `reliability.outage.${kind}`,
      section: 'reliability',
      label: `Outages — ${humanise(kind).toLowerCase()}`,
      unit: 'count',
      value: (m) => numberOrNull(m.detail?.tripping_outage?.total?.current?.[kind]),
    });
  }

  // Substations and interruptions are lists keyed by name, not objects.
  const substations = new Set<string>();
  for (const m of months) {
    for (const s of m.detail?.substation_max_load ?? []) if (s.substation) substations.add(s.substation);
  }
  for (const name of [...substations].sort()) {
    out.push({
      id: `substations.${name}`,
      section: 'substations',
      label: name,
      unit: 'MW',
      value: (m) =>
        numberOrNull((m.detail?.substation_max_load ?? []).find((s) => s.substation === name)?.load_mw),
    });
  }

  const interrupted = new Set<string>();
  for (const m of months) {
    for (const s of m.detail?.interruptions ?? []) if (s.substation) interrupted.add(s.substation);
  }
  for (const name of [...interrupted].sort()) {
    out.push({
      id: `interruptions.${name}.count`,
      section: 'interruptions',
      label: `${name} — interruptions`,
      unit: 'count',
      value: (m) =>
        numberOrNull((m.detail?.interruptions ?? []).find((s) => s.substation === name)?.interruptions),
    });
    out.push({
      id: `interruptions.${name}.unserved`,
      section: 'interruptions',
      label: `${name} — unserved`,
      unit: 'MWh',
      value: (m) =>
        numberOrNull((m.detail?.interruptions ?? []).find((s) => s.substation === name)?.unserved_mwh),
    });
  }

  return out;
}

/* ── comparison ──────────────────────────────────────────────────────────── */

export type MonthlyComparisonResult =
  | { ok: true; a: string; b: string; rows: ComparisonRow[]; sections: string[]; notes: string[] }
  | { ok: false; error: string };

function changeOf(a: number | null, b: number | null) {
  if (a === null && b === null) return { delta: null, pct: null, note: 'neither month publishes this' };
  if (a === null) return { delta: null, pct: null, note: 'not published in the first month' };
  if (b === null) return { delta: null, pct: null, note: 'not published in the second month' };
  const delta = b - a;
  return {
    delta,
    pct: a === 0 ? null : (delta / a) * 100,
    note: a === 0 ? 'no percentage — the base is zero' : undefined,
  };
}

export async function compareMonths(
  aKey: string,
  bKey: string,
  opts?: { sections?: string[]; metricIds?: string[] },
): Promise<MonthlyComparisonResult> {
  if (!MONTH_RE.test(aKey) || !MONTH_RE.test(bKey)) {
    return { ok: false, error: 'Months must be YYYY-MM' };
  }

  const [a, b] = await Promise.all([loadMonth(aKey), loadMonth(bKey)]);
  if (!a) return { ok: false, error: `No monthly report for ${aKey}` };
  if (!b) return { ok: false, error: `No monthly report for ${bKey}` };

  const all = [...fixedMetrics(), ...dynamicMetrics([a, b])];
  const wanted = all.filter((m) => {
    if (opts?.metricIds?.length) return opts.metricIds.includes(m.id);
    if (opts?.sections?.length) return opts.sections.includes(m.section);
    return true;
  });

  // Group by section before serialising. The text writer starts a new heading
  // whenever the section changes, so an interleaved order (a fixed `fuel`
  // metric sitting between two `system` ones) printed SYSTEM twice with a
  // GENERATION BY FUEL block wedged in between.
  const order = new Map(MONTHLY_SECTIONS.map((s, i) => [s.id as string, i]));
  wanted.sort((x, y) => (order.get(x.section) ?? 99) - (order.get(y.section) ?? 99));

  const rows = wanted.map((m) => {
    const av = m.value(a);
    const bv = m.value(b);
    const { delta, pct, note } = changeOf(av, bv);
    return {
      section: m.section,
      id: m.id,
      label: m.label,
      unit: m.unit,
      a: av,
      b: bv,
      delta,
      pct,
      note,
    } as ComparisonRow;
  });

  // PGCB's monthly sheets vary by era; a whole section can be missing from an
  // older report. Saying which is missing beats an empty section that reads as
  // "nothing happened that month".
  const notes: string[] = [];
  const emptySections = MONTHLY_SECTIONS.filter(
    (s) => wanted.some((m) => m.section === s.id) === false && !opts?.metricIds?.length,
  ).map((s) => s.label);
  if (emptySections.length) {
    notes.push(`Neither report carries: ${emptySections.join(', ')}.`);
  }

  return {
    ok: true,
    a: aKey,
    b: bKey,
    rows,
    sections: [...new Set(rows.map((r) => r.section))],
    notes,
  };
}

/** One metric across many months — the shape a spreadsheet wants. */
export async function seriesForMonths(
  months: string[],
  metricIds?: string[],
): Promise<{
  dates: string[];
  metrics: Array<{ id: string; label: string; unit: string; values: Array<number | null> }>;
  missing: string[];
}> {
  const records = await Promise.all(months.map(loadMonth));
  const present = records.filter((r): r is MonthlyRecord => Boolean(r));
  const all = [...fixedMetrics(), ...dynamicMetrics(present)];
  const wanted = metricIds?.length ? all.filter((m) => metricIds.includes(m.id)) : all;

  return {
    dates: months,
    metrics: wanted.map((m) => ({
      id: m.id,
      label: m.label,
      unit: m.unit,
      values: records.map((r) => (r ? m.value(r) : null)),
    })),
    missing: months.filter((_, i) => !records[i]),
  };
}

/**
 * Every month that can be compared, newest first.
 *
 * The union of what is on disk and what has been published at runtime. The
 * directory read is the whole list on the operator's machine, but nothing
 * traces `public/data/pgcb-monthly` into a deployed function bundle, so there
 * the readdir returns nothing and the published keys are the entire answer —
 * without the union the deployed picker would offer no months at all.
 */
export async function availableMonths(): Promise<string[]> {
  const months = new Set<string>();

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = path.join(process.cwd(), 'public', 'data', 'pgcb-monthly');
    for (const file of await fs.readdir(dir)) {
      if (/^\d{4}-\d{2}\.json$/.test(file)) months.add(file.replace('.json', ''));
    }
  } catch {
    // Not readable here; the published keys below may still supply months.
  }

  try {
    const { getPublishedKeys } = await import('@/lib/data/releases.server');
    for (const key of await getPublishedKeys('PGCB_MONTHLY')) months.add(key);
  } catch {
    // Fails soft, like every release read.
  }

  return [...months].sort().reverse();
}
