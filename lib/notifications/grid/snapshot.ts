import 'server-only';

/**
 * The newest NLDC hour ESB has stored, read from the database the Pi writes.
 *
 * Why the database and not the live NLDC fetch the homepage uses: a bulletin
 * or an alert is a published statement, and it must be reproducible. The
 * stored row is the one the archive keeps, with its integrity flags and the
 * source document behind it; a fresh fetch could say something the archive
 * never recorded. The cost is up to an hour of extra lag (the Pi captures at
 * :17), small against NLDC's own three to six.
 *
 * Doctrine, applied here rather than trusted downstream:
 *  - null is not zero: a column NLDC left blank stays null to the message.
 *  - the generation total goes through the homepage's integrity rule, and a
 *    row the database already set aside (`excluded`) is withheld outright.
 *  - "the hour before" is exactly one hour earlier, or it is absent.
 */

import type { GridHourlyObservation } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generationRowIntegrity, reportedPartsMw } from '@/lib/data/grid/live-row-integrity';
import type { GenerationState, PayloadFor } from '@/lib/notifications/types';

const HOUR_MS = 3_600_000;

type Decimalish = { toNumber(): number } | null;
const num = (d: Decimalish): number | null => (d === null ? null : d.toNumber());

export interface GenerationReading {
  generationMw: number | null;
  generationState: GenerationState;
  componentSumMw: number | null;
  importsMw: number | null;
}

/** Judge one GENERATION row exactly as the homepage does, plus the archive's own flag. */
export function readGeneration(row: GridHourlyObservation | null): GenerationReading {
  if (!row || row.totalMw === null) {
    return { generationMw: null, generationState: 'absent', componentSumMw: null, importsMw: null };
  }
  const interconnectors = [row.bheramaraMw, row.tripuraMw, row.adaniMw, row.nepalMw].map(num).filter((v): v is number => v !== null);
  const importsMw = interconnectors.length ? interconnectors.reduce((a, b) => a + b, 0) : null;
  const latest = {
    totalMw: num(row.totalMw) as number,
    byFuel: {
      gasMw: num(row.gasMw),
      liquidMw: num(row.liquidMw),
      coalMw: num(row.coalMw),
      hydroMw: num(row.hydroMw),
      solarMw: num(row.solarMw),
      windMw: num(row.windMw),
    },
    imports: { totalMw: importsMw },
  };
  const parts = reportedPartsMw(latest);
  const reconciles = parts === null ? true : Math.abs(latest.totalMw - parts) <= 1;
  const integrity = generationRowIntegrity({ latest, reconciles, componentSumMw: parts });
  const state: GenerationState =
    row.excluded === 'TOTAL_DISAGREES_WITH_COMPONENTS' ? 'unusable' : integrity.state === 'consistent' ? 'consistent' : integrity.state;
  return { generationMw: latest.totalMw, generationState: state, componentSumMw: parts, importsMw };
}

async function hourRow(series: 'GENERATION' | 'DEMAND_SUPPLY', at: Date) {
  return prisma.gridHourlyObservation.findUnique({ where: { series_observedAt: { series, observedAt: at } } });
}

/** The newest stored hour as a bulletin payload, or null if nothing is stored. */
export async function readNewestHour(): Promise<PayloadFor<'GRID_HOURLY_SNAPSHOT'> | null> {
  const gen = await prisma.gridHourlyObservation.findFirst({
    where: { series: 'GENERATION' },
    orderBy: { observedAt: 'desc' },
  });
  if (!gen) return null;
  const at = gen.observedAt;
  const before = new Date(at.getTime() - HOUR_MS);
  const [demand, prevGen, prevDemand] = await Promise.all([
    hourRow('DEMAND_SUPPLY', at),
    hourRow('GENERATION', before),
    hourRow('DEMAND_SUPPLY', before),
  ]);
  const now = readGeneration(gen);
  const prev = readGeneration(prevGen);
  const previous =
    prevGen || prevDemand
      ? {
          observedAt: before.toISOString(),
          demandMw: num(prevDemand?.demandMw ?? null),
          // A previous total is only compared when it was itself consistent.
          generationMw: prev.generationState === 'consistent' ? prev.generationMw : null,
        }
      : null;
  return {
    observedAt: at.toISOString(),
    demandMw: num(demand?.demandMw ?? null),
    supplyMw: num(demand?.supplyMw ?? null),
    loadShedMw: num(demand?.loadShedMw ?? null),
    generationMw: now.generationMw,
    generationState: now.generationState,
    componentSumMw: now.componentSumMw,
    importsMw: now.importsMw,
    previous,
  };
}

export interface LoadShedHour {
  observedAt: Date;
  loadShedMw: number | null;
}

/** DEMAND_SUPPLY hours after `after`, oldest first — the alert evaluator walks every one. */
export async function loadShedHoursSince(after: Date, limit = 48): Promise<LoadShedHour[]> {
  const rows = await prisma.gridHourlyObservation.findMany({
    where: { series: 'DEMAND_SUPPLY', observedAt: { gt: after } },
    orderBy: { observedAt: 'asc' },
    take: limit,
    select: { observedAt: true, loadShedMw: true },
  });
  return rows.map((r) => ({ observedAt: r.observedAt, loadShedMw: num(r.loadShedMw) }));
}

export interface GenerationHour {
  observedAt: Date;
  generationMw: number | null;
  consistent: boolean;
}

/** GENERATION hours after `after` (plus the one before, for the first drop), oldest first. */
export async function generationHoursSince(after: Date, limit = 48): Promise<GenerationHour[]> {
  const rows = await prisma.gridHourlyObservation.findMany({
    where: { series: 'GENERATION', observedAt: { gte: new Date(after.getTime() - HOUR_MS) } },
    orderBy: { observedAt: 'asc' },
    take: limit + 1,
  });
  return rows.map((r) => {
    const g = readGeneration(r);
    return { observedAt: r.observedAt, generationMw: g.generationMw, consistent: g.generationState === 'consistent' };
  });
}
