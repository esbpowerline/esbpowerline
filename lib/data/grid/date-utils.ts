const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_DATE_RE = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/;

const MONTH_INDEX: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

/** Validate and return YYYY-MM-DD or null. */
export function parseIsoDate(value: string): string | null {
  if (!ISO_DATE_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  // PGCB backlog range — reject corrupt catalog keys (e.g. 0202-01-02).
  if (y < 2011 || y > 2030) return null;
  return value;
}

/** Convert PGCB display date ("DD Mon YYYY") to canonical YYYY-MM-DD. */
export function legacyDateToIso(legacy: string): string | null {
  const match = legacy.trim().match(LEGACY_DATE_RE);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = MONTH_INDEX[match[2]];
  if (!month) return null;
  return parseIsoDate(`${match[3]}-${month}-${day}`);
}

/** Convert YYYY-MM-DD to PGCB display format ("D Mon YYYY"). */
export function isoDateToLegacy(iso: string): string | null {
  const parsed = parseIsoDate(iso);
  if (!parsed) return null;
  const [year, month, day] = parsed.split('-');
  const monthName = Object.entries(MONTH_INDEX).find(([, v]) => v === month)?.[0];
  if (!monthName) return null;
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

/** Normalize any supported date key to YYYY-MM-DD. */
export function normalizeDateKey(value: string): string | null {
  const iso = parseIsoDate(value);
  if (iso) return iso;
  return legacyDateToIso(value);
}

/** Build public URL path for a daily report JSON file. */
export function dailyReportPath(isoDate: string): string {
  return `/data/daily/${isoDate}.json`;
}

/**
 * Runtime twin of `dailyReportPath`, backed by the DataRelease table instead of
 * a file shipped with the build. Tried only after the static path 404s, so days
 * in the archive keep costing nothing and only days published since the last
 * deploy reach a function.
 */
export function runtimeDailyReportPath(isoDate: string): string {
  return `/api/data/daily/${isoDate}.json`;
}