/**
 * What a figure on the Grid Explorer is actually a measurement OF.
 *
 * Every publisher this site reproduces defines "a day" differently, and until
 * this module existed the explorer had one date picker whose value was silently
 * adopted by all of them. That is the root of every alignment complaint:
 *
 *   PGCB      energy day D, 00:00 -> 24:00, published in a workbook FILED as D+1
 *   Petrobangla  gas day, 08:00 on D -> 08:00 on D+1, in a PDF NAMED for D+1
 *   SREDA     a standing register — a stock as of a date, not an interval at all
 *
 * Petrobangla is the one that caused the confusion, so state its case plainly:
 * the PDF never claims a single date. It prints a range ("16-17 Aug, 2026") and
 * a period ("8.00 to 8.00"). The single date exists only in the FILENAME, which
 * is a filing convention and not a claim about the measurement. So the question
 * "do we key on the uploaded date or the data inside" has no answer as posed —
 * the answer is to key on neither and carry the interval.
 *
 * ── The anchor rule (L1) ──────────────────────────────────────────────────
 * A record anchors to the calendar day containing its START instant.
 *
 * Applied to Petrobangla that means energy day D shows the gas window opening
 * at 08:00 on D. This is not an arbitrary pick:
 *
 *   1. It is what the archive has always done. Verified end to end against the
 *      stored figures — 2020-01-11 shows 3168.1 MMCFD, which is the 11->12 Jan
 *      window; 2024-07-31 shows 2634.0, the 31 Jul -> 1 Aug window; 2026-08-16
 *      shows 2275.7, the 16->17 Aug window. The FILE NAMING flipped at
 *      2026-06-22 (end-keyed before, start-keyed after); the semantics never did.
 *   2. It is the only choice that is electrically honest. The evening peak —
 *      18:00-21:00, the single most important instant in the dataset — falls
 *      INSIDE the 08:00(D) -> 08:00(D+1) window. Anchoring on the window's end
 *      would put day D's peak alongside gas that stopped being measured at
 *      08:00 that morning, ten hours before the peak it is meant to explain.
 *   3. Petrobangla's own printed label leads with the start date.
 *
 * The rule is stated here once and rendered in the UI rather than assumed, so a
 * reader never has to reverse-engineer it from the numbers.
 *
 * ── Alignment class (L2) ──────────────────────────────────────────────────
 * Knowing the interval is not enough to place two figures side by side. A peak
 * measured at one instant and a rate averaged over 24 hours are different kinds
 * of quantity, and the explorer has put them in one row before: the KPI strip
 * once headlined a 24-hour mean next to an instantaneous peak, and readers
 * subtracted them. `AlignmentClass` makes that mistake checkable instead of
 * remembered — see `comparable()`.
 *
 * All instants are Bangladesh Standard Time, UTC+06:00, with no DST. Both
 * publishers report in local clock time and neither states a zone; BST is the
 * project's stated assumption and is applied uniformly rather than per-source.
 */

export const BST_UTC_OFFSET_MINUTES = 6 * 60;
export const BST_OFFSET_LABEL = 'UTC+06:00';

/** Which body published the figure. Attribution, not a fetch location. */
export type GridPublisher = 'PGCB' | 'Petrobangla' | 'BPDB' | 'SREDA' | 'ESB PowerLine';

/**
 * What kind of quantity a figure is. This governs whether two numbers may be
 * placed side by side, subtracted, or plotted on one axis.
 *
 *  instant        a reading at one moment          — evening peak 14,200 MW at 20:00
 *  interval-mean  a rate averaged over the window  — 2,275.6 MMCFD over 08:00-08:00
 *  interval-total an amount accumulated over it    — 361.36 MKWh across the day
 *  stock          a standing quantity as of a date — 1,504 MWp installed solar
 *  forecast       a projection for a FUTURE window — tomorrow's probable max gen
 */
export type AlignmentClass =
  | 'instant'
  | 'interval-mean'
  | 'interval-total'
  | 'stock'
  | 'forecast';

export const ALIGNMENT_LABEL: Record<AlignmentClass, string> = {
  instant: 'Point reading',
  'interval-mean': 'Averaged over the window',
  'interval-total': 'Accumulated over the window',
  stock: 'Standing total',
  forecast: 'Projection',
};

export const ALIGNMENT_SHORT: Record<AlignmentClass, string> = {
  instant: 'point',
  'interval-mean': 'avg',
  'interval-total': 'total',
  stock: 'stock',
  forecast: 'fcst',
};

/**
 * L0 — the observation itself. `start`/`end` are ISO-8601 with the BST offset,
 * so they survive JSON and are unambiguous without a companion timezone field.
 *
 * `end` is null for a `stock`, which has an as-of instant and no duration.
 */
export interface ObservationWindow {
  publisher: GridPublisher;
  /** Inclusive start instant, e.g. "2026-08-16T08:00:00+06:00". */
  start: string;
  /** Exclusive end instant, or null for a stock. */
  end: string | null;
  /** The calendar day this anchors to under the L1 rule (day containing start). */
  anchorDay: string;
  /** How the publisher itself labels this window, verbatim where one is printed. */
  publishedLabel?: string;
  /** The document, named as the publisher names it, so a reader can request it. */
  sourceFile?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "2026-08-16" + 8 -> "2026-08-16T08:00:00+06:00". Hour may exceed 23 to roll over. */
export function bstInstant(isoDay: string, hour: number): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d) + hour * 3_600_000;
  const dt = new Date(base);
  return (
    `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:00+06:00`
  );
}

/** The calendar day of an instant produced by `bstInstant` — the L1 anchor. */
export function anchorDayOf(instant: string): string {
  return instant.slice(0, 10);
}

/** Add days to an ISO day. Negative shifts backwards. */
export function shiftDay(isoDay: string, days: number): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * PGCB's energy day: midnight to midnight on the day being reported.
 *
 * The workbook is FILED under D+1 — "Daily Report 17-08-2026.xlsx" reports on
 * 16 August — which is why `filedAs` is carried separately. A reader looking
 * for the source asks PGCB for the filing name, not the energy day.
 */
export function pgcbEnergyDay(isoDay: string, sourceFile?: string): ObservationWindow {
  return {
    publisher: 'PGCB',
    start: bstInstant(isoDay, 0),
    end: bstInstant(isoDay, 24),
    anchorDay: isoDay,
    publishedLabel: isoDay,
    sourceFile,
  };
}

/** The date PGCB files an energy day's workbook under. */
export function pgcbFiledAs(isoDay: string): string {
  return shiftDay(isoDay, 1);
}

/**
 * Petrobangla's gas day: 08:00 on the anchor day to 08:00 the next.
 *
 * `publishedLabel` should be the PDF's own printed range where the archive
 * holds it ("16-17 Aug, 2026"); the fallback below reconstructs the same shape
 * so a day whose label was never captured still shows a range rather than a
 * bare date the source never claimed.
 */
export function petrobanglaGasDay(
  isoDay: string,
  opts: { publishedLabel?: string; sourceFile?: string } = {},
): ObservationWindow {
  return {
    publisher: 'Petrobangla',
    start: bstInstant(isoDay, 8),
    end: bstInstant(isoDay, 32),
    anchorDay: isoDay,
    publishedLabel: opts.publishedLabel ?? defaultGasDayLabel(isoDay),
    sourceFile: opts.sourceFile,
  };
}

/** The date Petrobangla names a gas-day PDF for — the morning the window closes. */
export function petrobanglaFiledAs(isoDay: string): string {
  return shiftDay(isoDay, 1);
}

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "16-17 Aug, 2026" — the shape Petrobangla prints. */
function defaultGasDayLabel(isoDay: string): string {
  const next = shiftDay(isoDay, 1);
  const [, m1, d1] = isoDay.split('-');
  const [y2, m2, d2] = next.split('-');
  const left = m1 === m2 ? d1 : `${d1} ${MONTH_ABBR[Number(m1) - 1]}`;
  return `${left}-${d2} ${MONTH_ABBR[Number(m2) - 1]}, ${y2}`;
}

/** SREDA's register and anything else that is a level rather than a flow. */
export function standingRegister(
  publisher: GridPublisher,
  asOfDay: string,
  sourceFile?: string,
): ObservationWindow {
  return {
    publisher,
    start: bstInstant(asOfDay, 0),
    end: null,
    anchorDay: asOfDay,
    publishedLabel: `as of ${asOfDay}`,
    sourceFile,
  };
}

/**
 * PGCB's next-day projection, from the block below the "Forecast" divider on
 * the Forecast sheet. It anchors to D+1 because that is the day it describes —
 * the workbook reporting on 16 August projects the 17th.
 */
export function pgcbForecastDay(reportedDay: string, sourceFile?: string): ObservationWindow {
  const target = shiftDay(reportedDay, 1);
  return {
    publisher: 'PGCB',
    start: bstInstant(target, 0),
    end: bstInstant(target, 24),
    anchorDay: target,
    publishedLabel: `projected for ${target}`,
    sourceFile,
  };
}

/** "16 Aug 08:00 → 17 Aug 08:00 (UTC+06:00)". The line a reader should see. */
export function formatWindow(w: ObservationWindow, opts: { offset?: boolean } = {}): string {
  const offset = opts.offset === false ? '' : ` (${BST_OFFSET_LABEL})`;
  if (!w.end) return `as of ${formatInstant(w.start)}${offset}`;
  return `${formatInstant(w.start)} → ${formatInstant(w.end)}${offset}`;
}

function formatInstant(instant: string): string {
  const [day, time] = instant.split('T');
  const [, m, d] = day.split('-');
  return `${Number(d)} ${MONTH_ABBR[Number(m) - 1]} ${time.slice(0, 5)}`;
}

/** Whole hours a window covers, or null for a stock. */
export function windowHours(w: ObservationWindow): number | null {
  if (!w.end) return null;
  return Math.round((Date.parse(w.end) - Date.parse(w.start)) / 3_600_000);
}

/** True when two windows describe exactly the same span of time. */
export function sameWindow(a: ObservationWindow, b: ObservationWindow): boolean {
  return a.start === b.start && a.end === b.end;
}

/** Hours of overlap between two windows. 0 when they do not intersect. */
export function overlapHours(a: ObservationWindow, b: ObservationWindow): number {
  if (!a.end || !b.end) return 0;
  const lo = Math.max(Date.parse(a.start), Date.parse(b.start));
  const hi = Math.min(Date.parse(a.end), Date.parse(b.end));
  return hi <= lo ? 0 : Math.round((hi - lo) / 3_600_000);
}

export interface ComparabilityVerdict {
  /** Whether the two figures may be shown as a like-for-like pair. */
  ok: boolean;
  /** Why not, in the words the UI should use. Empty when ok. */
  reason: string;
}

/**
 * Whether two figures can honestly be compared — subtracted, ratioed, or drawn
 * on one axis.
 *
 * This encodes the mistake the explorer has already made once and the one it
 * still makes: a 24-hour mean beside an instantaneous peak, and Petrobangla's
 * 08:00-08:00 gas rate beside PGCB's 20:00 peak. Both pass a naive "same date"
 * test and neither is a valid pair.
 */
export function comparable(
  a: { window: ObservationWindow; alignment: AlignmentClass },
  b: { window: ObservationWindow; alignment: AlignmentClass },
): ComparabilityVerdict {
  if (a.alignment === 'forecast' || b.alignment === 'forecast') {
    if (a.alignment !== b.alignment) {
      return {
        ok: false,
        reason: 'One figure is a projection and the other a measurement.',
      };
    }
  }
  if (a.alignment === 'stock' || b.alignment === 'stock') {
    if (a.alignment !== b.alignment) {
      return {
        ok: false,
        reason: 'A standing total is a level; the other figure is a flow over time.',
      };
    }
    return { ok: true, reason: '' };
  }
  if (a.alignment !== b.alignment) {
    return {
      ok: false,
      reason:
        a.alignment === 'instant' || b.alignment === 'instant'
          ? 'A point reading cannot be set against a figure averaged or accumulated over a window.'
          : 'A rate and an accumulated amount are different quantities.',
    };
  }
  if (a.alignment === 'instant') {
    // Two instants are comparable when both are inside one another's windows;
    // the windows themselves need not match, since an instant is a moment.
    return { ok: true, reason: '' };
  }
  if (sameWindow(a.window, b.window)) return { ok: true, reason: '' };
  const shared = overlapHours(a.window, b.window);
  const span = windowHours(a.window) ?? 24;
  return {
    ok: false,
    reason:
      shared === 0
        ? `The two windows do not overlap (${a.window.publisher} vs ${b.window.publisher}).`
        : `The windows overlap for only ${shared} of ${span} hours ` +
          `(${a.window.publisher} ${formatWindow(a.window, { offset: false })} vs ` +
          `${b.window.publisher} ${formatWindow(b.window, { offset: false })}).`,
  };
}

/**
 * The per-source date strip for a chosen day: what each publisher's "day"
 * actually is, and which document states it. This is what the explorer header
 * should render instead of one bare date adopted by every tab.
 */
export interface DayProvenanceRow {
  publisher: GridPublisher;
  /** "Energy day", "Gas day", "Register" — the publisher's own unit of time. */
  unit: string;
  window: ObservationWindow;
  /** The date the publisher files this document under, where it differs. */
  filedAs?: string;
  /** Present when the archive holds no document for this day. */
  missing?: boolean;
}

export function dayProvenance(
  isoDay: string,
  opts: {
    pgcbFile?: string | null;
    petrobanglaFile?: string | null;
    petrobanglaLabel?: string | null;
    hasGas?: boolean;
  } = {},
): DayProvenanceRow[] {
  const rows: DayProvenanceRow[] = [
    {
      publisher: 'PGCB',
      unit: 'Energy day',
      window: pgcbEnergyDay(isoDay, opts.pgcbFile ?? undefined),
      filedAs: pgcbFiledAs(isoDay),
      missing: !opts.pgcbFile,
    },
  ];
  rows.push({
    publisher: 'Petrobangla',
    unit: 'Gas day',
    window: petrobanglaGasDay(isoDay, {
      publishedLabel: opts.petrobanglaLabel ?? undefined,
      sourceFile: opts.petrobanglaFile ?? undefined,
    }),
    filedAs: petrobanglaFiledAs(isoDay),
    missing: !opts.hasGas,
  });
  return rows;
}
