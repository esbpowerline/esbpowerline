/**
 * Every Telegram message ESB sends is composed here, and only here.
 *
 * House style: one restrained kicker in capitals, the headline in bold, a
 * factual standfirst, then provenance in italics. No emoji, no exclamation, no
 * hashtags. Figures sit in a <pre> block so they align like a table.
 *
 * Telegram's HTML mode is used rather than MarkdownV2 because its escaping is
 * three characters (& < >), not eighteen, and an editor's headline is the
 * least trusted input in the system. `esc` is applied to every value that did
 * not originate in this file.
 *
 * Length limits are Telegram's, measured on visible text after the markup is
 * parsed: 1,024 for a photo caption, 4,096 for a message. The standfirst is
 * the only part that gives way, and it is cut on a word boundary.
 *
 * Pure: no IO, no clock except the instants passed in. The processor, the
 * commands and the tests all call these functions.
 */

import { createHash } from 'node:crypto';
import type { InlineButton } from '@/lib/notifications/telegram/client';
import type { PayloadFor } from '@/lib/notifications/types';
import { DHAKA_ZONE_LABEL, dhakaDateKey, dhakaDateTime, dhakaTime, formatIsoDay } from '@/lib/notifications/time';

export const CAPTION_LIMIT = 1024;
export const TEXT_LIMIT = 4096;

export type Campaign = 'instant_news' | 'grid_hourly' | 'grid_alert' | 'daily_summary' | 'bot_command';

export interface RenderedMessage {
  html: string;
  /** Visible length after Telegram parses the markup. */
  visibleLength: number;
  buttons: InlineButton[];
}

export function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Visible length of our own HTML: tags removed, the three entities counted once. */
export function visibleLength(html: string): number {
  return html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot);/g, '_').length;
}

/** Cut plain text to `max` characters on a word boundary, with an ellipsis. */
export function truncatePlain(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  if (max <= 1) return '';
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  // Back to the last whole word, unless that would throw away more than half.
  return `${(space >= Math.floor(max * 0.5) ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/**
 * The canonical URL with UTM attribution appended. The page's own
 * <link rel="canonical"> is unaffected, so search engines see one URL.
 */
export function withUtm(url: string, campaign: Campaign): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'telegram');
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}

export function articleUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, '')}/articles/${encodeURIComponent(slug)}`;
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "14,338 MW" — or an em dash, never 0, when the source printed nothing. */
export function mw(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${nf.format(value)} MW`;
}

/** "+120 MW" / "−327 MW" (true minus sign). */
export function signedMw(delta: number): string {
  const rounded = Math.round(delta);
  if (rounded === 0) return 'no change';
  return `${rounded > 0 ? '+' : '−'}${nf.format(Math.abs(rounded))} MW`;
}

/* ── articles ────────────────────────────────────────────────────────────── */

export interface ArticleForMessage {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  isBreaking: boolean;
  publishedAt: Date;
}

/** A stable hash of exactly the fields a news post shows. */
export function articleContentHash(a: Pick<ArticleForMessage, 'slug' | 'title' | 'excerpt' | 'category' | 'isBreaking'>): string {
  return createHash('sha256')
    .update(JSON.stringify([a.slug, a.title.trim(), (a.excerpt ?? '').trim(), a.category ?? '', a.isBreaking]))
    .digest('hex')
    .slice(0, 32);
}

/**
 * NEWS / BREAKING.
 *
 *   NEWS
 *   Headline in bold
 *
 *   The standfirst, cut to fit.
 *
 *   Category · 20:15 BST
 *   [ Read the full report ]
 */
export function renderArticle(
  a: ArticleForMessage,
  opts: { siteUrl: string; asCaption: boolean; now: Date },
): RenderedMessage {
  const limit = opts.asCaption ? CAPTION_LIMIT : TEXT_LIMIT;
  const kicker = a.isBreaking ? 'BREAKING' : 'NEWS';
  // Today's stories carry the time; anything else carries the day as well.
  const when =
    dhakaDateKey(a.publishedAt) === dhakaDateKey(opts.now)
      ? `${dhakaTime(a.publishedAt)} ${DHAKA_ZONE_LABEL}`
      : `${dhakaDateTime(a.publishedAt)} ${DHAKA_ZONE_LABEL}`;
  const meta = [a.category?.trim(), when].filter(Boolean).join(' · ');
  const title = truncatePlain(a.title, 240);

  const head = `<b>${kicker}</b>\n<b>${esc(title)}</b>`;
  const foot = `<i>${esc(meta)}</i>`;
  const fixed = visibleLength(head) + visibleLength(foot) + 4; // two blank lines
  const room = Math.max(0, limit - fixed - 2);
  const excerpt = a.excerpt?.trim() ? truncatePlain(a.excerpt, Math.min(room, opts.asCaption ? 600 : 900)) : '';

  const html = excerpt ? `${head}\n\n${esc(excerpt)}\n\n${foot}` : `${head}\n\n${foot}`;
  return {
    html,
    visibleLength: visibleLength(html),
    buttons: [{ text: 'Read the full report', url: withUtm(articleUrl(opts.siteUrl, a.slug), 'instant_news') }],
  };
}

/** What an announced post becomes when its article is withdrawn: kept, struck, explained. */
export function renderWithdrawn(title: string): RenderedMessage {
  const html = `<b>WITHDRAWN</b>\n<s>${esc(truncatePlain(title, 240))}</s>\n\n<i>This report has been withdrawn by ESB PowerLine.</i>`;
  return { html, visibleLength: visibleLength(html), buttons: [] };
}

/* ── grid ────────────────────────────────────────────────────────────────── */

function gridButton(siteUrl: string, campaign: Campaign, path = '/grid-explorer'): InlineButton {
  return { text: 'View the grid', url: withUtm(`${siteUrl.replace(/\/$/, '')}${path}`, campaign) };
}

/** Aligned label/value rows for a <pre> block. */
function table(rows: Array<[string, string]>): string {
  const width = Math.max(...rows.map(([l]) => l.length)) + 3;
  const valueWidth = Math.max(...rows.map(([, v]) => v.length));
  return rows.map(([l, v]) => `${l.padEnd(width)}${v.padStart(valueWidth)}`).join('\n');
}

/**
 * GRID UPDATE — one NLDC hour.
 *
 * The hour is always printed as the hour it describes, never as "now": NLDC
 * posts three to six hours late, and a bulletin that implied otherwise would
 * be the homepage's unlabelled "live" dot again.
 */
export function renderGridHourly(p: PayloadFor<'GRID_HOURLY_SNAPSHOT'>, opts: { siteUrl: string }): RenderedMessage {
  const at = new Date(p.observedAt);
  const notes: string[] = [];

  let generation: string;
  if (p.generationState === 'unusable') {
    generation = 'withheld';
    notes.push('Generation is withheld: NLDC’s printed total is more than 10% away from its own parts.');
  } else if (p.generationState === 'inconsistent') {
    generation = `${mw(p.generationMw)}*`;
    notes.push(`* As filed. NLDC’s parts sum to ${mw(p.componentSumMw)}.`);
  } else {
    generation = mw(p.generationMw);
  }

  const rows: Array<[string, string]> = [
    ['Demand', mw(p.demandMw)],
    ['Generation', generation],
    ['Load shed', mw(p.loadShedMw)],
    ['Imports', mw(p.importsMw)],
  ];
  const absent = rows.filter(([, v]) => v === '—').map(([l]) => l.toLowerCase());
  if (absent.length) notes.push(`Not posted for this hour: ${absent.join(', ')}.`);

  const changes: string[] = [];
  if (p.previous) {
    if (p.demandMw !== null && p.previous.demandMw !== null) changes.push(`demand ${signedMw(p.demandMw - p.previous.demandMw)}`);
    if (p.generationState === 'consistent' && p.generationMw !== null && p.previous.generationMw !== null) {
      changes.push(`generation ${signedMw(p.generationMw - p.previous.generationMw)}`);
    }
  }

  const lines = [
    `<b>GRID UPDATE</b> · ${esc(dhakaDateTime(at))} ${DHAKA_ZONE_LABEL}`,
    '',
    `<pre>${esc(table(rows))}</pre>`,
  ];
  if (changes.length) lines.push(`On the hour before: ${esc(changes.join(', '))}.`);
  for (const n of notes) lines.push(`<i>${esc(n)}</i>`);
  lines.push(`<i>NLDC hourly report for ${esc(dhakaTime(at))}. Imports are the sum of the reported interconnectors.</i>`);

  const html = lines.join('\n');
  return { html, visibleLength: visibleLength(html), buttons: [gridButton(opts.siteUrl, 'grid_hourly')] };
}

/** GRID ALERT — a threshold crossed, escalated, or cleared. */
export function renderGridAlert(p: PayloadFor<'GRID_ALERT'>, opts: { siteUrl: string }): RenderedMessage {
  const at = new Date(p.observedAt);
  const hour = dhakaTime(at);
  let kicker = 'GRID ALERT';
  let headline: string;
  let body: string;

  if (p.rule === 'HIGH_LOAD_SHED') {
    if (p.transition === 'RECOVER') {
      kicker = 'GRID ALERT CLEARED';
      headline = `Load shedding back below ${mw(p.thresholdMw)}`;
      body = `NLDC’s hourly report for ${hour} shows ${mw(p.valueMw)} of load shed.`;
    } else if (p.transition === 'ESCALATE') {
      headline = `Load shedding rose to ${mw(p.valueMw)}`;
      body = `NLDC’s hourly report for ${hour} shows ${mw(p.valueMw)} of load shed${
        p.previousMw !== null && p.previousMw !== undefined ? `, up from ${mw(p.previousMw)} at the last alert` : ''
      }.`;
    } else {
      headline = `Load shedding reached ${mw(p.valueMw)}`;
      body = `NLDC’s hourly report for ${hour} shows ${mw(p.valueMw)} of load shed, above the ${mw(p.thresholdMw)} alert level.`;
    }
  } else {
    const drop = p.previousMw !== null && p.previousMw !== undefined ? p.previousMw - p.valueMw : null;
    headline = drop !== null ? `Generation fell ${mw(drop)} in one hour` : 'Generation fell sharply in one hour';
    body = `NLDC’s hourly report shows ${mw(p.valueMw)} at ${hour}${
      p.previousMw !== null && p.previousMw !== undefined ? `, down from ${mw(p.previousMw)} an hour earlier` : ''
    }.`;
  }

  const html = [
    `<b>${kicker}</b> · ${esc(dhakaDateTime(at))} ${DHAKA_ZONE_LABEL}`,
    `<b>${esc(headline)}</b>`,
    '',
    esc(body),
    '',
    '<i>Source: NLDC hourly report, as posted. Figures are reproduced as filed.</i>',
  ].join('\n');
  return { html, visibleLength: visibleLength(html), buttons: [gridButton(opts.siteUrl, 'grid_alert')] };
}

/** DAILY SUMMARY — one PGCB energy day, as printed. */
export function renderDailySummary(p: PayloadFor<'DAILY_GRID_SUMMARY'>, opts: { siteUrl: string }): RenderedMessage {
  const rows: Array<[string, string]> = [
    ['Evening peak demand', mw(p.eveningPeakDemandMw)],
    ['Evening peak generation', mw(p.eveningPeakGenMw)],
    ['Maximum generation', mw(p.maxGenMw)],
    ['Energy generated', p.energyGenGwh === null ? '—' : `${nf1.format(p.energyGenGwh)} GWh`],
    ['Energy not served', p.energyUnservedGwh === null ? '—' : `${nf1.format(p.energyUnservedGwh)} GWh`],
  ];
  const lines = [`<b>DAILY SUMMARY</b> · ${esc(formatIsoDay(p.energyDay))}`, '', `<pre>${esc(table(rows))}</pre>`];

  const total = p.fuelMix.reduce((s, f) => s + (f.gwh > 0 ? f.gwh : 0), 0);
  if (total > 0) {
    const shares = p.fuelMix
      .filter((f) => f.gwh > 0)
      .sort((a, b) => b.gwh - a.gwh)
      .map((f) => ({ name: f.name, pct: Math.round((f.gwh / total) * 100) }))
      .filter((f) => f.pct >= 1);
    // Lower-case the words for prose, never the fuel codes: PGCB's "HFO" and "HSD"
    // printed as "hfo 15%, hsd 2%" in the first preview (2026-09-14) and read as typos.
    const fuel = (name: string) => (/^[A-Z]{2,}$/.test(name) ? name : name.toLowerCase());
    lines.push(`Generation mix: ${esc(shares.map((s) => `${fuel(s.name)} ${s.pct}%`).join(', '))}.`);
  }
  if (p.eveningPeakTime) lines.push(`Evening peak at ${esc(p.eveningPeakTime)}.`);
  if (p.energyUnservedGwh === null) lines.push('<i>PGCB’s report for this day prints no energy-not-served figure.</i>');
  lines.push(
    `<i>Source: PGCB daily report${p.sourceFile ? `, ${esc(p.sourceFile)}` : ''}. Mix shares are ESB’s arithmetic on PGCB’s fuel figures.</i>`,
  );
  const html = lines.join('\n');
  return { html, visibleLength: visibleLength(html), buttons: [gridButton(opts.siteUrl, 'daily_summary')] };
}

export function renderTest(p: PayloadFor<'TEST_MESSAGE'>, now: Date): RenderedMessage {
  const html = [
    '<b>TEST</b>',
    `<b>ESB PowerLine notification test</b>`,
    '',
    esc(p.note || 'If you can read this, the bot can post to this destination.'),
    '',
    `<i>Requested by ${esc(p.requestedBy)} · ${esc(dhakaDateTime(now))} ${DHAKA_ZONE_LABEL}</i>`,
  ].join('\n');
  return { html, visibleLength: visibleLength(html), buttons: [] };
}
