import 'server-only';

/**
 * The newsroom half of an event study.
 *
 * The data archive says what the grid did. It does not say why, and for this
 * event it never will: Petrobangla prints one aggregated "R-LNG Terminal" row
 * and names no terminal, no vessel and no fault. ESB PowerLine's own newsroom
 * does — it filed 50-odd pieces across this window, and their dates line up
 * with the archive's own inflections closely enough to be worth showing side by
 * side rather than merged.
 *
 * Side by side is the whole design. A headline is not a measurement, and this
 * module never lets one become one: coverage is returned as its own object,
 * rendered in its own column, and attributed to ESB PowerLine with a link to
 * the piece. What the reporting asserts is the reporting's to defend; what the
 * archive prints is the archive's. The page shows both and merges neither.
 *
 * Only PUBLISHED articles are returned. `getPublishedArticleBySlug`
 * (category-content.ts:217) filters on that status, so linking a DRAFT or an
 * ARCHIVED piece would hand the reader a 404 — and two of the most on-point
 * headlines in this window are ARCHIVED, which is exactly the trap.
 */

import prisma from '@/lib/prisma';
import type { CoverageItem, ExternalCoverageItem } from '@/lib/data/analysis/event-narrative';
import type { EventStudyDefinition } from '@/lib/data/analysis/event-registry';
import { eventWindow } from '@/lib/data/analysis/event-registry';

/** BST day boundaries as UTC instants — the archive's timezone, applied here too. */
function bstDayRange(range: { start: string; end: string }): { gte: Date; lte: Date } {
  return {
    gte: new Date(`${range.start}T00:00:00+06:00`),
    lte: new Date(`${range.end}T23:59:59+06:00`),
  };
}

function matchesEvent(text: string, terms: string[]): boolean {
  const haystack = text.toLowerCase();
  return terms.some((t) => haystack.includes(t.toLowerCase()));
}

/**
 * The event's coverage, in date order.
 *
 * Bengali-titled pieces are skipped for the English page for the same reason
 * `getPublishedArticleBySlug` skips them: the article route returns null for a
 * Bengali title under the English locale, so the link would 404.
 */
export type CoverageLoad =
  | { ok: true; items: CoverageItem[] }
  | { ok: false; reason: string };

export async function loadEventCoverage(def: EventStudyDefinition): Promise<CoverageLoad> {
  const { start, end } = eventWindow(def);
  let rows: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
  }>;
  const read = () =>
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        editorTrash: false,
        publishedAt: bstDayRange({ start, end }),
      },
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: 'asc' },
    });
  try {
    // One retry, because the observed fault is a transient connection timeout
    // under concurrent render rather than a bad query. If it fails twice the
    // page says so instead of pretending the newsroom filed nothing.
    try {
      rows = await read();
    } catch {
      rows = await read();
    }
  } catch (err) {
    /*
      Fail soft, but SAY SO. The first version returned [] here, and one request
      in three hit a Prisma connection timeout in dev: the page then rendered
      "0 ESB PowerLine articles" in the masthead and "No coverage filed on this
      date" on all 45 rows. That is a false statement about the newsroom's
      record, produced by an infrastructure fault — the same shape as the NLDC
      fallback that published 0 MW of load shed on a day with 2,222, and the
      reason live-grid.server.ts now reaches across to nothing rather than
      substituting. A read that failed is not a day that was quiet.
    */
    return { ok: false, reason: err instanceof Error ? err.message : 'coverage read failed' };
  }

  const out: CoverageItem[] = [];
  for (const r of rows) {
    if (!r.publishedAt) continue;
    if (/[ঀ-৿]/.test(r.title)) continue;
    const haystack = `${r.title} ${r.excerpt ?? ''}`;
    if (!matchesEvent(haystack, def.coverageTerms)) continue;
    // Anchor to the BST calendar day, so a piece filed at 23:30 Dhaka sits on
    // the day it was filed rather than sliding to the next UTC date.
    const bst = new Date(r.publishedAt.getTime() + 6 * 3_600_000);
    out.push({
      date: bst.toISOString().slice(0, 10),
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
    });
  }
  return { ok: true, items: out };
}

/**
 * External media coverage, from the committed evidence file.
 *
 * Stored as evidence rather than typed into a component for the same reason the
 * tariff work keeps `evidence/tariff/manifest.json`: a hand-typed table inside a
 * component is exactly the pattern this repo has had to delete twice
 * (`globalVsDomesticRaw`, the yearly commodities rows). Here every item carries
 * its outlet, its URL, the date it reports on and the basis for that date, so
 * the placement can be checked rather than trusted.
 *
 * Absence is not fatal: a missing or malformed file costs the page its external
 * column and nothing else.
 */
export async function loadExternalCoverage(
  def: EventStudyDefinition,
): Promise<ExternalCoverageItem[]> {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(
      process.cwd(),
      'evidence',
      'events',
      def.slug,
      'external-coverage.json',
    );
    const parsed = JSON.parse(await fs.readFile(file, 'utf8')) as {
      items?: Array<Partial<ExternalCoverageItem>>;
    };
    return (parsed.items ?? [])
      .filter((i): i is ExternalCoverageItem =>
        Boolean(i.outlet && i.headline && i.url && typeof i.dateBasis === 'string'))
      .map((i) => ({ ...i, reportsOn: i.reportsOn ?? null }));
  } catch {
    return [];
  }
}
