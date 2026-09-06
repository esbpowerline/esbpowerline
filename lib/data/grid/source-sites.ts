/**
 * Where each agency the snapshot credits actually publishes.
 *
 * The panel names its sources in a footer, which asks the reader to take our
 * word for it. These turn that line into something checkable: click PGCB and
 * you land on the page the figures were read off, so a visitor can hold the
 * tile and the source side by side. That is the whole point of an archive that
 * refuses to print a number nobody published — it should be easy to catch us
 * if we ever do.
 *
 * Every URL here returned 200 when checked on 2026-09-07. Two traps found in
 * that check, both worth keeping: **`www.pgcb.gov.bd` and
 * `www.petrobangla.org.bd` do not resolve** — only the bare hosts do. A `www.`
 * added later "for tidiness" would silently break the link.
 *
 * Where an agency has a page carrying the actual series, that page wins over
 * the corporate homepage: NLDC points at the hourly generation table itself,
 * which is where ten of the twelve tiles come from.
 *
 * An agency with no entry renders as plain text, exactly as before. Guessing a
 * URL would be inventing a citation, which is the written-down failure this
 * codebase is most careful about.
 */

/** Keyed by the agency name lowercased and trimmed, in both scripts. */
const SOURCE_SITES: Readonly<Record<string, string>> = {
  // The hourly generation table — the source for ten of the twelve tiles.
  nldc: 'https://erp.powergrid.gov.bd/w/generations/view_generations',
  'এনএলডিসি': 'https://erp.powergrid.gov.bd/w/generations/view_generations',

  pgcb: 'https://pgcb.gov.bd',
  'পিজিসিবি': 'https://pgcb.gov.bd',

  petrobangla: 'https://petrobangla.org.bd',
  'পেট্রোবাংলা': 'https://petrobangla.org.bd',

  bpdb: 'https://www.bpdb.gov.bd',
  'বিপিডিবি': 'https://www.bpdb.gov.bd',

  sreda: 'https://sreda.gov.bd',
  'এসআরইডিএ': 'https://sreda.gov.bd',

  // The Energy and Mineral Resources Division's dashboard, which serves
  // Petrobangla's daily gas and condensate report.
  emrd: 'https://www.emrddashboard.gov.bd/daily-report',
};

/** The official page for an agency credit, or undefined if we do not know one. */
export function sourceSiteFor(agency: string): string | undefined {
  return SOURCE_SITES[agency.trim().toLowerCase()];
}

/** Exported for the test that pins every credited agency to a real link. */
export const KNOWN_SOURCE_AGENCIES = Object.keys(SOURCE_SITES);
