/**
 * Print what the Telegram channel would post right now, from real data, through
 * the site's own formatter. Reads the production database; writes nothing and
 * sends nothing — it is the "let's see a preview" step before switching a feed on.
 *
 *   npx tsx --env-file=.env.local --conditions react-server scripts/telegram-preview.ts
 *
 * Four posts: the newest stored NLDC hour, the newest PGCB day, the latest
 * published article, and the most recent real hour that crossed the load-shed
 * alert level — a past crossing rather than an invented figure, because an alert
 * preview must carry numbers NLDC actually posted.
 *
 * The daily summary cannot go through buildDailySummaryPayload: its latest-date
 * lookup runs inside unstable_cache, which throws "incrementalCache missing"
 * outside Next. The same two sources are read directly instead — the newer of
 * the newest live GRID_DAILY release and the shipped catalog, release payload
 * before static file — and mapped field for field as grid/daily.ts does. If that
 * file's mapping changes, change this one with it.
 */
import fs from 'node:fs';
import prisma from '@/lib/prisma';
import { readNewestHour } from '@/lib/notifications/grid/snapshot';
import { DAILY_SUMMARY_MAX_AGE_DAYS } from '@/lib/notifications/grid/daily';
import { dhakaDateKey } from '@/lib/notifications/time';
import {
  renderArticle,
  renderDailySummary,
  renderGridAlert,
  renderGridHourly,
  type RenderedMessage,
} from '@/lib/notifications/telegram/format';
import type { PayloadFor } from '@/lib/notifications/types';

const SITE = 'https://esbpowerline.com';
const LOAD_SHED_ALERT_MW = 3000; // DEFAULT_RUNTIME_CONFIG.loadShedAlertMw

const plain = (html: string) =>
  html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function show(label: string, m: RenderedMessage, note?: string) {
  console.log(`\n===== ${label} (${m.visibleLength} chars)${note ? ` — ${note}` : ''}`);
  console.log(plain(m.html));
  for (const b of m.buttons) console.log(`[ ${b.text} ] -> ${b.url}`);
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function latestDaily(now: Date): Promise<{ payload: PayloadFor<'DAILY_GRID_SUMMARY'>; source: string } | null> {
  const rel = await prisma.dataRelease.findFirst({
    where: { feed: 'GRID_DAILY', revokedAt: null },
    orderBy: { key: 'desc' },
    select: { key: true },
  });
  const catalog = JSON.parse(fs.readFileSync('lib/available-dates.json', 'utf8'));
  const dates: string[] = Array.isArray(catalog) ? catalog : (catalog.dates ?? catalog.availableDates ?? []);
  const latest = [rel?.key, dates.slice().sort().at(-1)].filter(Boolean).sort().at(-1);
  if (!latest) return null;
  const ageDays = Math.round((Date.parse(`${dhakaDateKey(now)}T00:00:00Z`) - Date.parse(`${latest}T00:00:00Z`)) / 86_400_000);
  if (ageDays > DAILY_SUMMARY_MAX_AGE_DAYS) return null;

  const release = await prisma.dataRelease.findUnique({
    where: { feed_key: { feed: 'GRID_DAILY', key: latest } },
    select: { payload: true, revokedAt: true },
  });
  const fromRelease = Boolean(release && !release.revokedAt);
  const data: any = fromRelease ? release!.payload : JSON.parse(fs.readFileSync(`public/data/daily/${latest}.json`, 'utf8'));
  const s = data.systemStats ?? {};
  const payload: PayloadFor<'DAILY_GRID_SUMMARY'> = {
    energyDay: latest,
    eveningPeakDemandMw: num(s.eveningPeakDemand),
    eveningPeakGenMw: num(s.eveningPeakGen),
    eveningPeakTime: s.peakTimes?.eveningPeakGen ?? null,
    dayPeakGenMw: num(s.dayPeakGen),
    maxGenMw: num(s.maxGen),
    energyGenGwh: num(s.totalEnergyGen),
    energyUnservedGwh: num(s.totalEnergyUnserved),
    fuelMix: (data.generationData ?? [])
      .map((g: { name: string; gen: unknown }) => ({ name: g.name, gwh: num(g.gen) }))
      .filter((g: { name: string; gwh: number | null }): g is { name: string; gwh: number } => Boolean(g.name) && g.gwh !== null && g.gwh > 0),
    sourceFile: data.sourceFiles?.pgcb ?? null,
  };
  if (payload.eveningPeakDemandMw === null && payload.eveningPeakGenMw === null && payload.energyGenGwh === null) return null;
  return { payload, source: fromRelease ? 'DataRelease' : 'static file' };
}

async function main() {
  const now = new Date();

  const hour = await readNewestHour();
  if (hour) show('Hourly grid update', renderGridHourly(hour, { siteUrl: SITE }));
  else console.log('\n(no stored NLDC hour)');

  const daily = await latestDaily(now);
  if (daily) {
    show('Daily summary', renderDailySummary(daily.payload, { siteUrl: SITE }), `energy day ${daily.payload.energyDay}, from the ${daily.source}`);
  } else {
    console.log(`\n(no PGCB day within ${DAILY_SUMMARY_MAX_AGE_DAYS} days — the daily summary would not post)`);
  }

  const a = await prisma.article.findFirst({
    where: { status: 'PUBLISHED', editorTrash: false, publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, excerpt: true, category: true, isBreaking: true, publishedAt: true, imageUrl: true },
  });
  if (a && a.publishedAt) {
    show(
      'News post',
      renderArticle({ ...a, publishedAt: a.publishedAt }, { siteUrl: SITE, asCaption: Boolean(a.imageUrl), now }),
      a.imageUrl ? 'posts as a photo with this caption' : undefined,
    );
  }

  const shed = await prisma.gridHourlyObservation.findFirst({
    where: { series: 'DEMAND_SUPPLY', loadShedMw: { gte: LOAD_SHED_ALERT_MW } },
    orderBy: { observedAt: 'desc' },
    select: { observedAt: true, loadShedMw: true },
  });
  if (shed && shed.loadShedMw !== null) {
    show(
      'Load-shed alert',
      renderGridAlert(
        { rule: 'HIGH_LOAD_SHED', transition: 'ENTER', observedAt: shed.observedAt.toISOString(), valueMw: shed.loadShedMw.toNumber(), thresholdMw: LOAD_SHED_ALERT_MW },
        { siteUrl: SITE },
      ),
      'the most recent real crossing, shown as an example',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
