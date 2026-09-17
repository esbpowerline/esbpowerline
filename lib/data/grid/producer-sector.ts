/**
 * Ownership sector of a power station, from the producer code PGCB prints on it.
 *
 * PGCB publishes no ownership column. What it prints is a producer code per
 * station row — "PDB", "APSCL", "IPP", "QRPP", "SIPP, REB" — and every sector
 * shown on the site is read off that code by the table below. That makes every
 * count built on it derived (D), never published: the code is PGCB's, the
 * sector is ours.
 *
 * Joint ventures are their own sector rather than being forced into one side.
 * BCPCL (Payra, with China's CMC), RNPL (Patuakhali, RPCL with NORINCO),
 * SNWPGCL (Sirajganj Unit-4, NWPGCL with Sembcorp) and NTPC&BPDB (Rampal,
 * BIFPCL) are part state and part foreign, and calling them either
 * "Government" or "Private" would be a claim about control that the code does
 * not make. BPDB-RPCL (Kodda, Sreepur) is two state bodies and counts as
 * Government.
 *
 * The code is read as printed, never corrected from the station's name. PGCB
 * filed Rampal under "NTPC&BPDB" in 2022 and under "PDB" by 2026, so on a
 * current day Rampal counts as Government. Re-filing it here would be
 * overriding the publisher.
 *
 * Anything the table does not know — including the blank producer cells and
 * the stray "100" the 2014 sheets carry in that column — is `unclassified`
 * and is counted as such, never folded into a neighbour.
 */

export type ProducerSector = 'government' | 'private' | 'joint-venture' | 'import' | 'unclassified';

export const SECTOR_LABEL: Record<ProducerSector, string> = {
  government: 'Government-owned',
  private: 'Private',
  'joint-venture': 'Joint venture',
  import: 'Cross-border import',
  unclassified: 'Not classified',
};

/** Normalised producer code (upper case, letters, digits and & only) → sector. */
const SECTOR_BY_CODE: Record<string, ProducerSector> = {
  // State utility and its generation companies.
  PDB: 'government',
  BPDB: 'government',
  SBUPDB: 'government',
  APSCL: 'government',
  EGCB: 'government',
  NWPGCL: 'government',
  NWZPGCL: 'government',
  RPCL: 'government',
  CPGCL: 'government',
  BPDBRPCL: 'government',
  PDBRPCL: 'government',

  // Private producers, by contract type or by name.
  IPP: 'private',
  QRPP: 'private',
  QRPP3YRS: 'private',
  RPP: 'private',
  RPP3YRS: 'private',
  RPP15YRS: 'private',
  SIPP: 'private',
  SIPPREB: 'private',
  SIPPPDB: 'private',
  CIPPREB: 'private',
  // "No Electricity No Payment" — a rental contract type, privately owned.
  NENP: 'private',
  BPCL: 'private',
  SSPOWER: 'private',
  UNITEDGROUP: 'private',
  TEKNAFSOLARTECHENERGYLTD: 'private',

  // State and foreign partners together.
  BCPCL: 'joint-venture',
  RNPL: 'joint-venture',
  SNWPGCL: 'joint-venture',
  IPPSNWPGCL: 'joint-venture',
  'NTPC&BPDB': 'joint-venture',

  // Power bought across the border.
  IMPORT: 'import',
  IMPORTEDPOWER: 'import',
  INDIA: 'import',
};

export function normaliseProducerCode(code: string | null | undefined): string {
  return (code ?? '').toUpperCase().replace(/[^A-Z0-9&]/g, '');
}

export function producerSector(code: string | null | undefined): ProducerSector {
  return SECTOR_BY_CODE[normaliseProducerCode(code)] ?? 'unclassified';
}

export const SECTOR_ORDER: ProducerSector[] = ['government', 'private', 'joint-venture', 'import', 'unclassified'];

/** Station count per sector, in display order. */
export function countBySector(producers: (string | null | undefined)[]): { sector: ProducerSector; count: number }[] {
  const counts = new Map<ProducerSector, number>();
  for (const code of producers) {
    const sector = producerSector(code);
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }
  return SECTOR_ORDER.map((sector) => ({ sector, count: counts.get(sector) ?? 0 }));
}
