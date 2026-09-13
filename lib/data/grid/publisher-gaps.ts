import noSourceDays from '@/public/data/grid-verification/no-source-days.json';

/**
 * Slots a publisher never issued, as distinct from slots this site lacks.
 *
 * The ingest coverage panel counted every hole in a span as "missing", which
 * read as a to-do list: on 2026-09-13 it asked an operator to find 81 grid days
 * and three monthly reports, when 67 of those days and all three months had
 * already been shown not to exist anywhere PGCB publishes. A gap the publisher
 * left is a fact about the record, not work for us, and a count that mixes the
 * two cannot tell anyone what to do next.
 *
 * Both lists are evidence, not opinion. Neither may be extended to make a
 * number go down — see the method in the declaration itself.
 */

/**
 * PGCB monthly System Operation Reports that do not exist on its ERP, each
 * with why. Found by `ingest_pgcb_monthly.py --list` walking all six listing
 * pages (CLAUDE.md, "Once a day: PGCB's monthly report").
 */
export const PGCB_MONTHS_NEVER_PUBLISHED: Readonly<Record<string, string>> = {
  '2013-02': 'uploaded to the ERP as x.php (id 195) — there is no workbook behind it',
  '2015-07': 'never listed on the ERP',
  '2015-12': 'listed as id 162, but the ERP answers 404 while both neighbouring months serve',
};

/**
 * Energy days no published PGCB source can be located for — the site's own
 * public declaration, `public/data/grid-verification/no-source-days.json`,
 * which also tells the Grid Explorer to say so on the day and tells
 * `verify:data` not to demand a citation that cannot exist.
 */
export const PGCB_DAYS_WITHOUT_SOURCE: ReadonlySet<string> = new Set<string>(noSourceDays.days);

/** Split a span's holes into the ones we lack and the ones nobody published. */
export function splitGaps(
  gaps: readonly string[],
  neverIssued: (key: string) => boolean,
): { missing: string[]; neverPublished: string[] } {
  const missing: string[] = [];
  const neverPublished: string[] = [];
  for (const key of gaps) (neverIssued(key) ? neverPublished : missing).push(key);
  return { missing, neverPublished };
}
