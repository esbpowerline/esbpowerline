import 'server-only';
import { availableDates as bundledDates } from '@/lib/data/grid/available-dates';
import { getPublishedKeys } from '@/lib/data/releases.server';

const ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;

/**
 * The catalog the site should actually offer: days shipped with the last deploy
 * (bundled, build-time) plus days published at runtime since.
 *
 * The synchronous `availableDates` export stays as-is and remains correct for
 * the static archive — middleware runs on the edge and the Grid Explorer is a
 * client component, so neither can await a database. Those read the bundled
 * list and receive the runtime additions from the server instead.
 */
export async function getRuntimeAvailableDates(): Promise<string[]> {
  const published = await getPublishedKeys('GRID_DAILY');
  if (published.length === 0) return bundledDates;

  const merged = new Set(bundledDates);
  for (const key of published) {
    if (ISO_DATE_RE.test(key)) merged.add(key);
  }
  return [...merged].sort();
}

export async function getRuntimeLatestDate(): Promise<string | null> {
  const dates = await getRuntimeAvailableDates();
  return dates.length > 0 ? dates[dates.length - 1] : null;
}

/** Dates that exist only as runtime releases — i.e. not in the static archive. */
export async function getRuntimeOnlyDates(): Promise<string[]> {
  const published = await getPublishedKeys('GRID_DAILY');
  if (published.length === 0) return [];
  const bundled = new Set(bundledDates);
  return published.filter((key) => ISO_DATE_RE.test(key) && !bundled.has(key)).sort();
}
