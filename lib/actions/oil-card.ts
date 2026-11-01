'use server';

import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { buildCoverage, type ArchiveCoverage } from '@/lib/data/grid/archive-coverage';
import {
  buildOilCardModel,
  cardableDays,
  dhakaToday,
  settlementHistoryCsv,
  type OilCardModel,
} from '@/lib/data/oil/oil-card';
import { minusDays, type SeriesId, type Settlement } from '@/lib/data/oil/futures';
import { FIRST_FUEL_CARD_DAY } from '@/lib/data/tariff/administered-prices';

/**
 * The fuel-price card's data, for the CMS. Same gate as the year-on-year
 * sheet (`article.create`): editors need it, and it publishes nothing.
 *
 * World prices come from OilFuturesSettlement, which the Pi fills once a day —
 * never from Yahoo at request time, so a card re-made for a missed day prints
 * what was settled then, and Vercel never depends on a feed that refuses
 * cloud servers.
 */
async function requireCmsUser() {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, 'article.create')) {
    throw new Error('Unauthorized');
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Everything from 45 days before the first card day: enough for its month baseline. */
async function loadSettlements(): Promise<Settlement[]> {
  const from = minusDays(FIRST_FUEL_CARD_DAY, 45);
  const rows = await prisma.oilFuturesSettlement.findMany({
    where: { tradeDate: { gte: new Date(`${from}T00:00:00Z`) }, source: 'yahoo-chart' },
    select: { series: true, contract: true, tradeDate: true, settle: true, front: true },
  });
  return rows.map((r) => ({
    series: r.series as SeriesId,
    contract: r.contract,
    day: r.tradeDate.toISOString().slice(0, 10),
    settle: Number(r.settle),
    front: r.front,
  }));
}

export type OilCalendar = { coverage: ArchiveCoverage; today: string; latest: string | null };

/** The days a complete card can be made for, as the shared calendar reads them. */
export async function getOilCalendar(): Promise<OilCalendar> {
  await requireCmsUser();
  const today = dhakaToday();
  const days = cardableDays(await loadSettlements(), today);
  return { coverage: buildCoverage(days), today, latest: days.at(-1) ?? null };
}

/** The card for `day` (default: today in Dhaka). A future day is refused. */
export async function getOilCard(day?: string): Promise<OilCardModel> {
  await requireCmsUser();
  const today = dhakaToday();
  const d = day && ISO.test(day) ? day : today;
  if (d > today) throw new Error('A card cannot be made for a day that has not begun.');
  if (d < FIRST_FUEL_CARD_DAY) throw new Error(`Cards start on ${FIRST_FUEL_CARD_DAY}, the first day an archived EMRD instrument fixes the pump prices.`);
  return buildOilCardModel(await loadSettlements(), { day: d });
}

/** Front-month settlements for a range, as CSV. */
export async function getOilHistoryCsv(from: string, to: string): Promise<string> {
  await requireCmsUser();
  if (!ISO.test(from) || !ISO.test(to) || from > to) throw new Error('Choose a first day on or before the last.');
  return settlementHistoryCsv(await loadSettlements(), from, to);
}
