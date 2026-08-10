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
 * Measured across the first half of 2026, the two derivations agree on gas and
 * coal on every day both agencies published, and on imports on all but one —
 * 2026-04-03, where BPDB's own page overstates imported energy by exactly
 * 188.00 MKWh and PGCB's three interconnectors sum exactly to its own total.
 */

import { useEffect, useState } from 'react';

export type UnitCostStatus =
  | 'corroborated'
  | 'disagreement'
  | 'administered'
  | 'published-only';

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

  return {
    /** True once the file has loaded, whether or not this day has a witness. */
    loaded: !!file,
    administeredNote: file?.administered_note ?? null,
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
        return {
          status: 'published-only',
          ownUnitCost,
          secondPublisher: null,
          secondPublisherUnitCost: null,
          delta: null,
          tolerance: null,
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
