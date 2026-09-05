import 'server-only';

/**
 * Find the Petrobangla day that actually covers an energy day.
 *
 * `public/data/petrobangla/daily` is keyed two different ways, and the filename
 * alone does not tell you which:
 *
 *   * **2,149 files are named for the day the report was FILED.** Petrobangla
 *     publishes the 08:00–08:00 window that opens on energy day E on the
 *     morning of E+1, so `2023-07-18.json` holds the window that opened on
 *     2023-07-17. Its own `report_date_label` says so: "17-18 July, 2023".
 *   * **135 files are named for the window's own START**, which is the energy
 *     day. Everything `ingest_bridge.py` writes uses this convention — see
 *     `parse_gas_archive`, "the archive is keyed by the gas-day START, which
 *     for grid energy day E is E itself".
 *
 * Reading `{iso}.json` therefore returned the PREVIOUS day's field-level
 * production for most of the archive, and the correct day for the rest. The
 * Grid Explorer's gas-field comparison was showing Bibiyana's output for the
 * 17th under a heading that said the 18th — and comparing a 2026 day, which
 * resolved correctly, against a 2023 day, which did not.
 *
 * Cross-checking the two sources on the 1,432 energy days where both carry gas:
 * mapped this way, the archive's grand total agrees with the grid file's own
 * six-company summary on 1,366 and the LNG figure on 1,430. Mapped by filename,
 * only 95 agreed. The remaining handful differ by a few MMCFD — re-parse
 * rounding, not an offset.
 *
 * So the filename is a hint and the file's own window is the answer. Nothing
 * here guesses: a candidate whose metadata does not name the energy day is not
 * used, and a day with no such candidate has no gas archive.
 *
 * The window is `gas_day_start`, not `report_date_start`. They agree on all but
 * 89 of the 2,297 documents, and where they differ it is `report_date_start`
 * that is wrong: it is lifted from the line Petrobangla prints at the top of the
 * PDF, and that line carries typos. `2025-08-01.json` heads itself 2024-08-01;
 * `2021-05-30.json` heads itself 2021-01-29. Eleven documents are off by a month
 * or more, and 76 more — nearly every month-opening report — print the
 * publication date there instead of the window's own start.
 *
 * `gas_day_start` comes from the "08:00 hrs to 08:00 hrs" line that defines the
 * report, and it holds up: every one of the 2,297 documents carries it, every
 * `gas_day_end` is exactly one day after its start, and the filename is either
 * that same day (59 documents) or the morning after it (2,238) — no third case.
 * Read that way the archive is 2,297 distinct days with no two documents
 * claiming the same one; read by `report_date_start` it collapses to 2,217 with
 * 79 collisions, and invents four days no report covers.
 */

export type PetrobanglaGasField = {
  field?: string;
  company_code?: string;
  gas_mmcfd?: number | null;
  producing_wells?: number | null;
  /** The field's printed capacity. Petrobangla prints it beside production on
   *  every row, and for the R-LNG terminal it is the figure that makes the
   *  shortfall legible: 1,100 MMCFD of capacity against 300 delivered. */
  capacity_mmcfd?: number | null;
};

export type PetrobanglaDay = {
  report?: {
    report_date_start?: string;
    report_date_end?: string;
    report_date_label?: string;
    gas_day_start?: string;
  };
  production?: {
    fields?: PetrobanglaGasField[];
    subtotals?: Array<{ company_code?: string; gas_mmcfd?: number | null }>;
    grand_total?: { gas_mmcfd?: number | null };
  };
  validation?: { reconciled?: boolean };
};

export type ResolvedPetrobanglaDay = {
  doc: PetrobanglaDay;
  /** Which key it came from, for the provenance line. */
  source: string;
  /** True when the filename differed from the window it covers. */
  filedUnderNextDay: boolean;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/**
 * The window a document says it covers, or null when it does not say.
 *
 * `gas_day_start` first — see the note at the top of this file. The printed
 * header is the fallback only, for a document old enough not to carry the
 * window at all.
 */
function windowStart(doc: PetrobanglaDay | null): string | null {
  const r = doc?.report;
  return r?.gas_day_start ?? r?.report_date_start ?? null;
}

async function readRelease(key: string): Promise<PetrobanglaDay | null> {
  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    return ((await getReleaseOverride('GAS_DAILY', key)) as PetrobanglaDay) ?? null;
  } catch {
    return null;
  }
}

async function readFile(key: string): Promise<PetrobanglaDay | null> {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), 'public', 'data', 'petrobangla', 'daily', `${key}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as PetrobanglaDay;
  } catch {
    return null;
  }
}

export async function loadPetrobanglaForEnergyDay(
  iso: string,
): Promise<ResolvedPetrobanglaDay | null> {
  if (!ISO.test(iso)) return null;

  const filed = nextDay(iso);

  // The energy-day key first: that is what the ingest writes today, and what
  // the re-parsed files use. The filing key second, for the legacy majority.
  const candidates: Array<{ key: string; filedUnderNextDay: boolean }> = [
    { key: iso, filedUnderNextDay: false },
    { key: filed, filedUnderNextDay: true },
  ];

  for (const { key, filedUnderNextDay } of candidates) {
    for (const read of [readRelease, readFile]) {
      const doc = await read(key);
      if (!doc) continue;
      const start = windowStart(doc);
      // The whole point. A document that does not name this energy day is a
      // different day's report, however it happens to be filed.
      if (start !== iso) continue;
      return { doc, source: key, filedUnderNextDay };
    }
  }

  return null;
}

/* ── the figures the archive publishes itself ────────────────────────────── */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/**
 * Total gas production, as the report prints it.
 *
 * Its own grand total, not a re-sum of the field rows. The two agree — the
 * document carries a `validation.reconciled` flag for exactly this — and where
 * they ever disagree, the printed total is what Petrobangla published.
 */
export function archiveGasTotal(doc: PetrobanglaDay): number | null {
  const total = num(doc.production?.grand_total?.gas_mmcfd);
  return total !== null && total > 0 ? total : null;
}

/** The R-LNG subtotal, which is the LNG line of the six-company summary. */
export function archiveGasLng(doc: PetrobanglaDay): number | null {
  const row = (doc.production?.subtotals ?? []).find((s) => s.company_code === 'RPGCL');
  return num(row?.gas_mmcfd);
}

/**
 * The printed capacity of the R-LNG terminal row.
 *
 * Read from the field table rather than assumed, because it is a published
 * figure like any other and the whole point of showing it is that Petrobangla
 * kept printing 1,100 while the delivered line fell to 300 — the terminal's
 * rated capacity did not change when it stopped delivering. A chart that draws
 * the delivered line alone shows a fall; one that draws it against the capacity
 * the source still claims shows the size of the hole.
 */
export function archiveGasLngCapacity(doc: PetrobanglaDay): number | null {
  const row = (doc.production?.fields ?? []).find(
    (f) => typeof f.field === 'string' && /R-?LNG/i.test(f.field),
  );
  return num(row?.capacity_mmcfd);
}
