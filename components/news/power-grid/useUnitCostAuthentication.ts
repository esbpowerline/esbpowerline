'use client';

/**
 * Authentication for the per-fuel unit rate shown in the Generation &
 * Production Cost Breakdown.
 *
 * No agency publishes a Tk/kWh rate. PGCB publishes a per-fuel production cost
 * in Taka and a per-fuel energy total in MKWh; the rate the page shows is the
 * quotient, which is why it carries `D`. A `D` figure is worth what its
 * evidence is worth, so this supplies the evidence.
 *
 * BPDB publishes the same two quantities independently — a different agency, a
 * different document, its own control totals — so the same rate can be derived
 * twice and compared. That is the only authentication available for a number
 * neither publisher states.
 *
 * The comparison happens here rather than in the export because the page
 * already knows the rate it is displaying; only the witness needs shipping.
 * Re-measured 2026-08-16 over every witnessed day from 2025-01-01 to
 * 2026-06-24: gas agrees on 274/274 days, coal on 274/274, imports on 273/274 —
 * the exception being 2026-04-03, where BPDB's own page overstates imported
 * energy by exactly 188.00 MKWh and PGCB's three interconnectors sum exactly to
 * its own total.
 *
 * The witness file is a periodic export and currently stops at 2026-06-24, so
 * every later day is `awaiting-witness` rather than corroborated. Rebuilding it
 * needs BPDB's daily reports for the missing span run through the acquisition
 * pipeline; until that happens the newest days on the site — the ones most
 * likely to be read — carry the weakest evidence marker.
 */

import { useEffect, useState } from 'react';

export type UnitCostStatus =
  | 'corroborated'
  | 'disagreement'
  | 'administered'
  | 'published-only'
  /**
   * The day falls after the last day this file carries a witness for.
   *
   * Distinct from `published-only`, which is a claim about BPDB — that it does
   * not publish the inputs for this fuel. Beyond the coverage cutoff we simply
   * have not looked, and saying "no second publisher states the same inputs"
   * there asserts something about BPDB we have not checked. The witness file is
   * rebuilt from BPDB's own daily reports by the acquisition pipeline, so it
   * lags whenever that has not been run.
   */
  | 'awaiting-witness';

interface Witness {
  second_publisher: string;
  second_publisher_unit_cost: number;
  second_publisher_cost_taka: number;
  second_publisher_energy_mkwh: number;
  tolerance: number;
}

interface UnitCostFile {
  note: string;
  administered_fuels: string[];
  administered_note: string;
  days: Record<string, Record<string, Witness>>;
}

export interface UnitCostFact {
  status: UnitCostStatus;
  ownUnitCost: number;
  secondPublisher: string | null;
  secondPublisherUnitCost: number | null;
  delta: number | null;
  tolerance: number | null;
  /** Last day the witness file covers — set on `awaiting-witness` only. */
  witnessThrough?: string | null;
}

let cache: UnitCostFile | null = null;
let inflight: Promise<UnitCostFile | null> | null = null;

function load(): Promise<UnitCostFile | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/data/grid-verification/unit-cost.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: UnitCostFile | null) => {
        cache = j;
        return j;
      })
      .catch(() => null);
  }
  return inflight;
}

export function useUnitCostAuthentication(isoDate: string | null | undefined) {
  const [file, setFile] = useState<UnitCostFile | null>(cache);

  useEffect(() => {
    let alive = true;
    load().then((j) => {
      if (alive) setFile(j);
    });
    return () => {
      alive = false;
    };
  }, []);

  const day = isoDate && file ? file.days[isoDate] : undefined;
  // The file is a frozen export, so its newest day is the coverage cutoff.
  const witnessThrough = file ? Object.keys(file.days).reduce((a, b) => (a > b ? a : b), '') : '';

  return {
    /** True once the file has loaded, whether or not this day has a witness. */
    loaded: !!file,
    administeredNote: file?.administered_note ?? null,
    /** Last day any witness exists for, so the page can say where cover ends. */
    witnessThrough: witnessThrough || null,
    /** True when the day on screen is past the cutoff rather than unwitnessed. */
    beyondWitnessCoverage: !!(isoDate && witnessThrough && isoDate > witnessThrough),
    /**
     * @param fuelName the app's own fuel name, e.g. "Imports"
     * @param ownUnitCost the rate the page is about to display
     */
    factFor(fuelName: string, ownUnitCost: number | null): UnitCostFact | undefined {
      if (!file || ownUnitCost == null) return undefined;
      if (file.administered_fuels.includes(fuelName)) {
        return {
          status: 'administered',
          ownUnitCost,
          secondPublisher: null,
          secondPublisherUnitCost: null,
          delta: null,
          tolerance: null,
        };
      }
      const w = day?.[fuelName];
      if (!w) {
        // Past the cutoff nothing has been checked, which is not the same as
        // having checked and found no second publisher.
        const beyond = !!(isoDate && witnessThrough && isoDate > witnessThrough);
        return {
          status: beyond ? 'awaiting-witness' : 'published-only',
          ownUnitCost,
          secondPublisher: null,
          secondPublisherUnitCost: null,
          delta: null,
          tolerance: null,
          witnessThrough: beyond ? witnessThrough : null,
        };
      }
      const delta = ownUnitCost - w.second_publisher_unit_cost;
      return {
        status: Math.abs(delta) <= w.tolerance ? 'corroborated' : 'disagreement',
        ownUnitCost,
        secondPublisher: w.second_publisher,
        secondPublisherUnitCost: w.second_publisher_unit_cost,
        delta,
        tolerance: w.tolerance,
      };
    },
  };
}
