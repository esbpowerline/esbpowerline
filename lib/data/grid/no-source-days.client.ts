/**
 * `public/data/grid-verification/no-source-days.json`, fetched once per page.
 *
 * The explorer read this in a mount effect, so every remount (a tab whose
 * panel re-keys the tree, React strict mode in dev) sent the request again -
 * seen twice on production loads of the Imports and Technical tabs. The
 * promise is shared for the life of the page; a failed read is dropped so the
 * next caller may retry, and the notice simply does not appear meanwhile.
 */
const URL_PATH = '/data/grid-verification/no-source-days.json';

let pending: Promise<string[] | null> | null = null;

export function loadNoSourceDays(): Promise<string[] | null> {
  if (!pending) {
    pending = fetch(URL_PATH)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (Array.isArray(j?.days) ? (j.days as string[]) : null))
      .catch(() => null)
      .then((days) => {
        if (!days) pending = null;
        return days;
      });
  }
  return pending;
}

/** Test hook. */
export function resetNoSourceDaysCache(): void {
  pending = null;
}
