import 'server-only';

/**
 * Bot commands, answered in private chats only.
 *
 * Every grid answer is built from the same readers and formatter as the
 * channel's bulletins, so /grid and a posted GRID UPDATE cannot disagree, and
 * every one says which hour it describes. Nothing here scrapes the site.
 *
 * Administrator commands are authorised by numeric Telegram user id
 * (TELEGRAM_ADMIN_USER_IDS) and only in a private chat. A non-admin who tries
 * one gets the same answer as for a command that does not exist, and the
 * attempt is logged with their id.
 *
 * Deliberately absent: /broadcast. A compromised admin Telegram account must
 * not be able to post to the public channel; editorial content goes through
 * the CMS, where it is reviewed and recorded.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { checkRateLimit } from '@/lib/rate-limit';
import { isEnglishTitle, scheduleDelivery } from '@/lib/notifications/articles';
import { getRuntimeConfig, updateRuntimeConfig, type RuntimeConfig, type TelegramEnv } from '@/lib/notifications/config';
import { emitEvent } from '@/lib/notifications/events';
import { readGeneration, readNewestHour } from '@/lib/notifications/grid/snapshot';
import { logNotification } from '@/lib/notifications/log';
import { requeueDelivery } from '@/lib/notifications/queue';
import { getNotificationStatus } from '@/lib/notifications/status';
import { sendMessage, type InlineButton } from '@/lib/notifications/telegram/client';
import { articleUrl, esc, mw, renderGridHourly, withUtm } from '@/lib/notifications/telegram/format';
import { DHAKA_ZONE_LABEL, dhakaDateKey, dhakaDateTime, dhakaDay, dhakaTime } from '@/lib/notifications/time';

export interface CommandReply {
  html: string;
  buttons: InlineButton[];
}

export interface IncomingCommand {
  chatId: string;
  chatType: string;
  userId: string | null;
  text: string;
}

const PUBLIC_COMMANDS = new Set(['start', 'help', 'latest', 'grid', 'generation', 'today']);
const ADMIN_COMMANDS = new Set(['status', 'pause', 'resume', 'retry', 'test']);

const RATE_LIMIT = { count: 20, windowMs: 60_000 };
const HOUR_MS = 3_600_000;

type Decimalish = { toNumber(): number } | null;
const num = (d: Decimalish): number | null => (d === null ? null : d.toNumber());

/** "/grid", "/grid@ESBPowerLineBot", "/retry abc123" → name and arguments. */
export function parseCommand(text: string): { name: string; args: string[] } | null {
  const m = /^\/([a-z_]{1,32})(?:@[A-Za-z0-9_]{3,64})?(?:\s+([\s\S]*))?$/i.exec(text.trim());
  if (!m) return null;
  return { name: m[1].toLowerCase(), args: (m[2] ?? '').split(/\s+/).filter(Boolean) };
}

export function isAdmin(env: Pick<TelegramEnv, 'adminUserIds'>, userId: string | null): boolean {
  return userId !== null && env.adminUserIds.has(userId);
}

const siteButton = (text: string, path: string): InlineButton => ({
  text,
  url: withUtm(`${SITE_URL.replace(/\/$/, '')}${path}`, 'bot_command'),
});

function unknownReply(): CommandReply {
  return { html: 'Unknown command. Send /help for the list.', buttons: [] };
}

function ago(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min ago` : `${h} h ago`;
}

export function helpReply(admin: boolean): CommandReply {
  const lines = [
    '<b>ESB PowerLine</b>',
    'Energy news and Bangladesh power-system data, from the official records.',
    '',
    '/latest — the latest reports',
    '/grid — the newest hour NLDC has posted',
    '/generation — generation by fuel for that hour',
    '/today — today’s posted peaks and PGCB’s forecast',
    '',
    '<i>Grid figures are NLDC’s and PGCB’s, reproduced as filed. NLDC posts its hourly report three to six hours late, so every figure says which hour it describes.</i>',
  ];
  if (admin) {
    lines.push('', '<b>Administration</b>', '/status · /pause · /resume · /retry · /test');
  }
  return { html: lines.join('\n'), buttons: [siteButton('Open ESB PowerLine', '/'), siteButton('Grid Explorer', '/grid-explorer')] };
}

async function latestReply(): Promise<CommandReply> {
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED', editorTrash: false },
    orderBy: { publishedAt: 'desc' },
    take: 12,
    select: { slug: true, title: true, category: true, publishedAt: true },
  });
  const items = rows.filter((a) => isEnglishTitle(a.title)).slice(0, 5);
  if (items.length === 0) return { html: 'No reports are published yet.', buttons: [] };
  const lines = ['<b>LATEST FROM ESB POWERLINE</b>', ''];
  for (const a of items) {
    const url = withUtm(articleUrl(SITE_URL, a.slug), 'bot_command');
    const meta = [a.category, a.publishedAt ? dhakaDay(a.publishedAt) : null].filter(Boolean).join(' · ');
    lines.push(`<a href="${esc(url)}">${esc(a.title)}</a>`);
    if (meta) lines.push(`<i>${esc(meta)}</i>`);
    lines.push('');
  }
  return { html: lines.join('\n').trim(), buttons: [siteButton('All reports', '/articles')] };
}

async function gridReply(config: RuntimeConfig, now: Date): Promise<CommandReply> {
  const snap = await readNewestHour();
  if (!snap) return { html: 'No NLDC hour is stored yet.', buttons: [] };
  const rendered = renderGridHourly(snap, { siteUrl: SITE_URL });
  const age = now.getTime() - new Date(snap.observedAt).getTime();
  const note =
    age > config.gridMaxAgeHours * HOUR_MS
      ? `<i>This is the newest hour NLDC has posted, ${esc(ago(age))} — later than its usual three to six hours.</i>`
      : `<i>Newest hour posted by NLDC, ${esc(ago(age))}.</i>`;
  return { html: `${rendered.html}\n${note}`, buttons: rendered.buttons };
}

async function generationReply(now: Date): Promise<CommandReply> {
  const row = await prisma.gridHourlyObservation.findFirst({ where: { series: 'GENERATION' }, orderBy: { observedAt: 'desc' } });
  if (!row) return { html: 'No NLDC generation hour is stored yet.', buttons: [] };
  const g = readGeneration(row);
  const at = row.observedAt;
  const head = `<b>GENERATION BY FUEL</b> · ${esc(dhakaDateTime(at))} ${DHAKA_ZONE_LABEL}`;
  if (g.generationState === 'unusable') {
    return {
      html: `${head}\n\nWithheld: NLDC’s printed total for this hour is more than 10% away from its own parts, so neither can be read as filed.`,
      buttons: [siteButton('View the grid', '/grid-explorer')],
    };
  }
  const rows: Array<[string, string]> = [
    ['Gas', mw(num(row.gasMw))],
    ['Coal', mw(num(row.coalMw))],
    ['Liquid fuel', mw(num(row.liquidMw))],
    ['Hydro', mw(num(row.hydroMw))],
    ['Solar', mw(num(row.solarMw))],
    ['Wind', mw(num(row.windMw))],
    ['Imports', mw(g.importsMw)],
    ['Total', g.generationState === 'inconsistent' ? `${mw(g.generationMw)}*` : mw(g.generationMw)],
  ];
  const width = Math.max(...rows.map(([l]) => l.length)) + 3;
  const valueWidth = Math.max(...rows.map(([, v]) => v.length));
  const table = rows.map(([l, v]) => `${l.padEnd(width)}${v.padStart(valueWidth)}`).join('\n');
  const notes = ['A dash means NLDC left the cell blank for this hour — not zero. Imports are the sum of the reported interconnectors.'];
  if (g.generationState === 'inconsistent') notes.unshift(`* As filed. The parts above sum to ${mw(g.componentSumMw)}.`);
  const age = now.getTime() - at.getTime();
  const html = [head, '', `<pre>${esc(table)}</pre>`, ...notes.map((n) => `<i>${esc(n)}</i>`), `<i>Posted by NLDC, ${esc(ago(age))}.</i>`].join('\n');
  return { html, buttons: [siteButton('View the grid', '/grid-explorer')] };
}

async function todayReply(now: Date): Promise<CommandReply> {
  const key = dhakaDateKey(now);
  const start = new Date(`${key}T00:00:00+06:00`);
  const end = new Date(start.getTime() + 24 * HOUR_MS);
  const [demandRows, genRows, board] = await Promise.all([
    prisma.gridHourlyObservation.findMany({
      where: { series: 'DEMAND_SUPPLY', observedAt: { gte: start, lt: end } },
      select: { observedAt: true, demandMw: true, loadShedMw: true },
    }),
    prisma.gridHourlyObservation.findMany({ where: { series: 'GENERATION', observedAt: { gte: start, lt: end } } }),
    // boardDate is stored as UTC midnight of the Dhaka calendar day.
    prisma.gridForecastBoard.findUnique({ where: { boardDate: new Date(`${key}T00:00:00Z`) } }),
  ]);

  const maxOf = <T>(items: T[], value: (t: T) => number | null) =>
    items.reduce<{ item: T; v: number } | null>((best, item) => {
      const v = value(item);
      return v !== null && (!best || v > best.v) ? { item, v } : best;
    }, null);
  const peakDemand = maxOf(demandRows, (r) => num(r.demandMw));
  const peakShed = maxOf(demandRows, (r) => num(r.loadShedMw));
  const peakGen = maxOf(genRows, (r) => {
    const g = readGeneration(r);
    return g.generationState === 'consistent' ? g.generationMw : null;
  });
  const newest = [...demandRows.map((r) => r.observedAt), ...genRows.map((r) => r.observedAt)].sort((a, b) => b.getTime() - a.getTime())[0];

  const at = (d: Date | undefined) => (d ? ` (${dhakaTime(d)})` : '');
  const rows: Array<[string, string]> = [
    ['Peak demand so far', `${mw(peakDemand?.v ?? null)}${at(peakDemand?.item.observedAt)}`],
    ['Peak generation so far', `${mw(peakGen?.v ?? null)}${at(peakGen?.item.observedAt)}`],
    ['Peak load shed so far', `${mw(peakShed?.v ?? null)}${at(peakShed?.item.observedAt)}`],
    ['PGCB forecast, evening', mw(num(board?.forecastEveningPeakMw ?? null))],
    ['PGCB forecast, day', mw(num(board?.forecastDayPeakMw ?? null))],
  ];
  const width = Math.max(...rows.map(([l]) => l.length)) + 3;
  const table = rows.map(([l, v]) => `${l.padEnd(width)}${v}`).join('\n');

  const lines = [`<b>TODAY</b> · ${esc(dhakaDay(now))}`, '', `<pre>${esc(table)}</pre>`];
  const yesterday = num(board?.previousEveningPeakMw ?? null);
  if (yesterday !== null) lines.push(`Yesterday’s evening peak generation: ${esc(mw(yesterday))} (PGCB).`);
  lines.push(
    newest
      ? `<i>“So far” covers the hours NLDC has posted, up to ${esc(dhakaTime(newest))}. The forecast is PGCB’s, shown as published and not graded.</i>`
      : '<i>NLDC has not posted any hour of today yet. The forecast is PGCB’s, shown as published and not graded.</i>',
  );
  return { html: lines.join('\n'), buttons: [siteButton('View the grid', '/grid-explorer')] };
}

async function adminCommand(name: string, args: string[], cmd: IncomingCommand, env: TelegramEnv, now: Date): Promise<CommandReply> {
  switch (name) {
    case 'status': {
      const s = await getNotificationStatus(now);
      const c = s.config;
      const rows: Array<[string, string]> = [
        ['Status', s.status],
        ['Sending', s.configured.enabled ? (s.configured.dryRun ? 'on (dry run)' : 'on') : 'off'],
        ['Paused', c.paused ? 'yes' : 'no'],
        ['Heartbeat', s.heartbeat ? ago(s.heartbeat.ageSeconds * 1000) : 'never'],
        ['Pending', String(s.queue.byStatus.PENDING)],
        ['Uncertain', String(s.queue.byStatus.UNCERTAIN)],
        ['Dead', String(s.queue.byStatus.DEAD)],
        ['Last sent', s.queue.lastSentAt ? dhakaDateTime(s.queue.lastSentAt) : 'never'],
      ];
      const width = Math.max(...rows.map(([l]) => l.length)) + 3;
      const features = [
        `news ${c.news ? 'on' : 'off'}`,
        `hourly ${c.gridHourly ? 'on' : 'off'}`,
        `alerts ${c.gridAlerts ? 'on' : 'off'}`,
        `daily ${c.dailySummary ? 'on' : 'off'}`,
        `commands ${c.commands ? 'on' : 'off'}`,
      ].join(' · ');
      const lines = ['<b>STATUS</b>', `<pre>${esc(rows.map(([l, v]) => `${l.padEnd(width)}${v}`).join('\n'))}</pre>`, esc(features)];
      for (const r of s.reasons.slice(0, 6)) lines.push(`<i>${esc(r)}</i>`);
      return { html: lines.join('\n'), buttons: [] };
    }
    case 'pause':
    case 'resume': {
      const paused = name === 'pause';
      const res = await updateRuntimeConfig({ paused });
      if (!res.ok) return { html: `Could not change the setting: ${esc(res.error)}`, buttons: [] };
      logNotification('config.changed', { paused, by: `telegram:${cmd.userId}` });
      if (!paused) scheduleDelivery();
      return {
        html: paused
          ? 'Paused. Nothing will be posted; queued posts wait and are not lost. Send /resume to continue.'
          : 'Resumed. Queued posts will go out now.',
        buttons: [],
      };
    }
    case 'retry': {
      const id = args[0];
      if (id) {
        const ok = await requeueDelivery(id);
        if (ok) scheduleDelivery();
        logNotification('config.changed', { retried: id, ok, by: `telegram:${cmd.userId}` });
        return { html: ok ? `Queued <code>${esc(id)}</code> again.` : `No failed, uncertain or cancelled delivery <code>${esc(id)}</code>.`, buttons: [] };
      }
      const failed = await prisma.notificationDelivery.findMany({
        where: { status: { in: ['DEAD', 'UNCERTAIN'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, status: true, lastErrorCode: true, updatedAt: true, event: { select: { type: true } } },
      });
      if (failed.length === 0) return { html: 'No failed or uncertain deliveries.', buttons: [] };
      const lines = ['<b>FAILED / UNCERTAIN</b>', ''];
      for (const f of failed) {
        lines.push(`<code>${esc(f.id)}</code> · ${esc(f.event.type)} · ${esc(f.status)}${f.lastErrorCode ? ` · ${esc(f.lastErrorCode)}` : ''} · ${esc(dhakaDateTime(f.updatedAt))}`);
      }
      lines.push('', 'Send /retry followed by an id to queue it again. For UNCERTAIN ones, check the channel first — it may already be there.');
      return { html: lines.join('\n'), buttons: [] };
    }
    case 'test': {
      if (!env.testChatId) return { html: 'TELEGRAM_TEST_CHAT_ID is not set, so there is nowhere to send a test.', buttons: [] };
      await emitEvent({
        type: 'TEST_MESSAGE',
        dedupeKey: `test:${randomUUID()}`,
        payload: { requestedBy: `Telegram user ${cmd.userId}`, note: args.join(' ').slice(0, 200) },
        destinations: ['test'],
      });
      scheduleDelivery();
      return { html: 'Queued a test message to the test destination.', buttons: [] };
    }
    default:
      return unknownReply();
  }
}

export async function handleCommand(cmd: IncomingCommand, env: TelegramEnv, now = new Date()): Promise<CommandReply | null> {
  // The public product is the channel. Commands are a private conversation;
  // in a group the bot stays silent rather than answer other people's chat.
  if (cmd.chatType !== 'private') return null;
  const parsed = parseCommand(cmd.text);
  if (!parsed) return { html: 'Send /help to see what this bot can do.', buttons: [] };

  const limited = checkRateLimit(`telegram:${cmd.userId ?? cmd.chatId}`, RATE_LIMIT.count, RATE_LIMIT.windowMs);
  if (!limited.allowed) return null;

  const admin = isAdmin(env, cmd.userId);
  logNotification('telegram.command', { command: parsed.name, userId: cmd.userId, admin });

  if (ADMIN_COMMANDS.has(parsed.name)) {
    if (!admin) {
      logNotification('telegram.unauthorized_command', { command: parsed.name, userId: cmd.userId }, 'warn');
      return unknownReply();
    }
    return adminCommand(parsed.name, parsed.args, cmd, env, now);
  }
  if (!PUBLIC_COMMANDS.has(parsed.name)) return unknownReply();

  const config = await getRuntimeConfig();
  if (!config.commands) {
    return { html: 'Bot commands are temporarily unavailable. The channel continues as normal.', buttons: [] };
  }
  switch (parsed.name) {
    case 'start':
    case 'help':
      return helpReply(admin);
    case 'latest':
      return latestReply();
    case 'grid':
      return gridReply(config, now);
    case 'generation':
      return generationReply(now);
    case 'today':
      return todayReply(now);
    default:
      return unknownReply();
  }
}

const updateSchema = z
  .object({
    update_id: z.number().int(),
    message: z
      .object({
        message_id: z.number().int(),
        from: z.object({ id: z.number().int(), is_bot: z.boolean().optional() }).passthrough().optional(),
        chat: z.object({ id: z.number().int(), type: z.string() }).passthrough(),
        text: z.string().max(4096).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Handle one webhook update. Anything that is not a text message is ignored. */
export async function handleTelegramUpdate(raw: unknown, env: TelegramEnv): Promise<void> {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return;
  const m = parsed.data.message;
  if (!m?.text || m.from?.is_bot) return;
  const reply = await handleCommand(
    { chatId: String(m.chat.id), chatType: m.chat.type, userId: m.from ? String(m.from.id) : null, text: m.text },
    env,
  );
  if (!reply || !env.botToken) return;
  const res = await sendMessage(env.botToken, String(m.chat.id), reply.html, reply.buttons);
  if (!res.ok) logNotification('telegram.api_error', { stage: 'command-reply', code: res.code, description: res.description }, 'warn');
}
