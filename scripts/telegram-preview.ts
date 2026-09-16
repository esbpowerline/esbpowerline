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

export async function latestDaily(now: Date): Promise<{ payload: PayloadFor<'DAILY_GRID_SUMMARY'>; source: string } | null> {
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

/**
 * --send <chat> posts the news, daily and hourly messages to one chat through the
 * Bot API, exactly as rendered: HTML parse mode, the inline button, the article's
 * image as a photo when it has an absolute URL (text if Telegram refuses it). For
 * a staging channel or an admin's private chat — never the public channel, which
 * belongs to the production queue and its dedupe. The token comes from
 * --token-file or TELEGRAM_BOT_TOKEN and is never printed. The past-alert example
 * is preview-only: an old alert in a real chat reads as a current one.
 */
function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

type Outgoing = { label: string; message: RenderedMessage; photoUrl?: string | null };

async function send(chatId: string, token: string, items: Outgoing[]) {
  const call = async (method: string, body: Record<string, unknown>) => {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((e: Error) => ({ json: async () => ({ ok: false, description: e.message.replace(token, '<TOKEN>') }) }));
    return (await r.json()) as { ok: boolean; description?: string; result?: { message_id: number } };
  };
  for (const it of items) {
    const reply_markup = it.message.buttons.length
      ? { inline_keyboard: [it.message.buttons.map((b) => ({ text: b.text, url: b.url }))] }
      : undefined;
    let res = it.photoUrl
      ? await call('sendPhoto', { chat_id: chatId, photo: it.photoUrl, caption: it.message.html, parse_mode: 'HTML', reply_markup })
      : null;
    if (!res || !res.ok) {
      if (res) console.log(`  ${it.label}: photo refused (${res.description}); sending as text`);
      res = await call('sendMessage', {
        chat_id: chatId,
        text: it.message.html,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup,
      });
    }
    console.log(`sent ${it.label}: ${res.ok ? `message ${res.result?.message_id}` : `FAILED — ${res.description}`}`);
    await new Promise((r) => setTimeout(r, 1200));
  }
}

async function main() {
  const now = new Date();
  const outgoing: Outgoing[] = [];

  const a = await prisma.article.findFirst({
    where: { status: 'PUBLISHED', editorTrash: false, publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, excerpt: true, category: true, isBreaking: true, publishedAt: true, imageUrl: true },
  });
  if (a && a.publishedAt) {
    const photoUrl = a.imageUrl && /^https?:\/\//.test(a.imageUrl) ? a.imageUrl : null;
    const m = renderArticle({ ...a, publishedAt: a.publishedAt }, { siteUrl: SITE, asCaption: Boolean(photoUrl), now });
    show('News post', m, photoUrl ? 'posts as a photo with this caption' : undefined);
    outgoing.push({ label: 'news', message: m, photoUrl });
  }

  const daily = await latestDaily(now);
  if (daily) {
    const m = renderDailySummary(daily.payload, { siteUrl: SITE });
    show('Daily summary', m, `energy day ${daily.payload.energyDay}, from the ${daily.source}`);
    outgoing.push({ label: `daily summary ${daily.payload.energyDay}`, message: m });
  } else {
    console.log(`\n(no PGCB day within ${DAILY_SUMMARY_MAX_AGE_DAYS} days — the daily summary would not post)`);
  }

  const hour = await readNewestHour();
  if (hour) {
    const m = renderGridHourly(hour, { siteUrl: SITE });
    show('Hourly grid update', m);
    outgoing.push({ label: `hourly ${hour.observedAt}`, message: m });
  } else {
    console.log('\n(no stored NLDC hour)');
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

  const chat = arg('--send');
  if (chat) {
    if (chat.toLowerCase() === '@esbpowerline') {
      throw new Error('refusing to send to the public channel: it is fed by the production queue, which dedupes what it has posted');
    }
    const tokenFile = arg('--token-file');
    const token = tokenFile ? fs.readFileSync(tokenFile, 'utf8').trim() : process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) throw new Error('--send needs --token-file <path> or TELEGRAM_BOT_TOKEN');
    console.log(`\nsending ${outgoing.length} posts to ${chat}`);
    await send(chat, token, outgoing);
  }
}

// Run only when invoked directly: other scripts import latestDaily, and an import
// must not print a preview — or send one.
if (/telegram-preview\.ts$/.test(process.argv[1] ?? '')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
