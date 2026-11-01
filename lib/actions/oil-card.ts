'use server';

import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { buildOilCardModel, type OilCardModel } from '@/lib/data/oil/oil-card';
import type { SeriesId, Settlement } from '@/lib/data/oil/futures';
import { minusMonth } from '@/lib/data/oil/futures';

/**
 * The fuel-price card's data, for the CMS. Same gate as the year-on-year
 * sheet (`article.create`): editors need it, and it publishes nothing.
 *
 * World prices come from OilFuturesSettlement, which the Pi fills once a day —
 * never from Yahoo at request time, so a card re-downloaded later prints the
 * same figures and Vercel never depends on a feed that refuses cloud servers.
 */
export async function getOilCard(): Promise<OilCardModel> {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, 'article.create')) {
    throw new Error('Unauthorized');
  }

  const now = new Date();
  // Six weeks back covers the month baseline with a long weekend to spare.
  const from = minusMonth(minusMonth(now.toISOString().slice(0, 10)));
  const rows = await prisma.oilFuturesSettlement.findMany({
    where: { tradeDate: { gte: new Date(`${from}T00:00:00Z`) }, source: 'yahoo-chart' },
    select: { series: true, contract: true, tradeDate: true, settle: true, front: true },
  });
  const settlements: Settlement[] = rows.map((r) => ({
    series: r.series as SeriesId,
    contract: r.contract,
    day: r.tradeDate.toISOString().slice(0, 10),
    settle: Number(r.settle),
    front: r.front,
  }));
  return buildOilCardModel(settlements, now);
}
