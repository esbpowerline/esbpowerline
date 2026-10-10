import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { safeJsonLd } from '@/lib/json-ld';
import {
  loadArchiveDaySummary,
  getArchiveCatalogue,
  describeDay,
  formatArchiveDate,
  type ArchiveDaySummary,
} from '@/lib/data/grid/archive-day.server';
import { parseIsoDate } from '@/lib/data/grid/date-utils';
import { isIndexedArchiveDay, isSettledArchiveDay } from '@/lib/data/grid/archive-indexing';
import { ORGANIZATION_ID, cleanDescription } from '@/lib/seo';

/**
 * One indexable page per archive day.
 *
 * Before this route the entire 4,548-day archive answered to `/grid-explorer`
 * with the date in client state, so a search for the grid's figures on a given
 * day in 2019 had no document on this site to return. See
 * `lib/data/grid/archive-day.server.ts` for what is deliberately public here
 * and what stays with the archive plans.
 */

// Archive days do not change. A correction arrives as a DataRelease, which the
// loader reads ahead of the static file, so a day's page picks it up on the
// next revalidation rather than needing a deploy.
export const revalidate = 86400;

// 4,548 pages is far more than is worth building on every deploy, and most are
// crawled rarely. The recent window is prerendered because it is what readers
// and Googlebot actually hit; everything older renders on first request and is
// then cached at the edge for a day.

const PRERENDER_DAYS = 60;

export async function generateStaticParams() {
  const catalogue = await getArchiveCatalogue();
  return catalogue.slice(-PRERENDER_DAYS).map((date) => ({ date }));
}

async function summaryFor(dateParam: string): Promise<ArchiveDaySummary | null> {
  const iso = parseIsoDate(dateParam);
  if (!iso) return null;
  return loadArchiveDaySummary(iso);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const summary = await summaryFor(date);
  if (!summary) return { title: 'Day not found — ESB PowerLine' };

  const readable = formatArchiveDate(summary.date);
  // The on-page summary below keeps every clause; the snippet is cut at a
  // sentence or word boundary to what Google shows.
  const description = cleanDescription(describeDay(summary));
  const catalogue = await getArchiveCatalogue();

  return {
    title: `Bangladesh Power Grid on ${readable} — generation, demand & load shedding`,
    description,
    alternates: { canonical: `/grid-explorer/${summary.date}` },
    // Outside the recent window: reachable, followed, not asked to be indexed.
    // Why, with the Search Console figures, in archive-indexing.ts.
    ...(isIndexedArchiveDay(summary.date, catalogue.at(-1))
      ? {}
      : { robots: { index: false, follow: true } }),
    openGraph: {
      type: 'article',
      url: `/grid-explorer/${summary.date}`,
      siteName: 'ESB PowerLine',
      title: `Bangladesh Power Grid — ${readable}`,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bangladesh Power Grid — ${readable}`,
      description,
    },
  };
}

function Tile({
  label,
  value,
  unit,
  isDecimal,
  awaiting,
  settled,
}: {
  label: string;
  value: number | null;
  unit: string;
  isDecimal?: boolean;
  awaiting?: string;
  /** Past the window in which a publisher still files: nothing is coming. */
  settled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-muted-foreground">
        {label}
      </p>
      {value === null ? (
        <>
          {/* A dash, never a zero. "0 MW" for energy unserved would assert that
              no load was shed; the dash plus the publisher's name says only
              that nobody filed the figure. */}
          <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
          {awaiting && (
            <p className="text-[11px] text-muted-foreground/80">
              {settled ? `no ${awaiting} figure held` : `awaiting ${awaiting}`}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {isDecimal ? value.toFixed(2) : value.toLocaleString('en-US')}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
        </p>
      )}
    </div>
  );
}

export default async function ArchiveDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const summary = await summaryFor(date);
  if (!summary) notFound();

  const readable = formatArchiveDate(summary.date);
  const description = describeDay(summary);
  const year = summary.date.slice(0, 4);
  const settled = isSettledArchiveDay(summary.date, (await getArchiveCatalogue()).at(-1));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

  // Dataset rather than Article: this page is a day of measurements, and the
  // publishers are named so the citation trail a reader can follow is the same
  // one a machine reads.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Bangladesh power grid daily report — ${readable}`,
    description,
    url: `${baseUrl}/grid-explorer/${summary.date}`,
    temporalCoverage: summary.date,
    isAccessibleForFree: true,
    license: 'https://esbpowerline.com/about',
    creator: {
      '@type': 'Organization',
      name: 'Power Grid Company of Bangladesh (PGCB)',
    },
    // By id, not a second inline Organization: the root layout declares the
    // NewsMediaOrganization once, and every other page's publisher points at
    // it. Two entities with the same name and no link between them is how a
    // publisher fails to resolve in the structured-data report.
    publisher: { '@id': ORGANIZATION_ID },
    spatialCoverage: { '@type': 'Place', name: 'Bangladesh' },
    variableMeasured: summary.stats
      .filter((s) => s.value !== null)
      .map((s) => ({
        '@type': 'PropertyValue',
        name: s.label,
        value: s.value,
        unitText: s.unit,
      })),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Grid Explorer', item: `${baseUrl}/grid-explorer` },
      { '@type': 'ListItem', position: 2, name: 'Archive', item: `${baseUrl}/grid-explorer/archive` },
      { '@type': 'ListItem', position: 3, name: year, item: `${baseUrl}/grid-explorer/archive/${year}` },
      { '@type': 'ListItem', position: 4, name: readable, item: `${baseUrl}/grid-explorer/${summary.date}` },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />

      <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link prefetch={false} href="/grid-explorer" className="hover:text-foreground">Grid Explorer</Link>
        {' / '}
        <Link prefetch={false} href="/grid-explorer/archive" className="hover:text-foreground">Archive</Link>
        {' / '}
        <Link prefetch={false} href={`/grid-explorer/archive/${year}`} className="hover:text-foreground">{year}</Link>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Bangladesh Power Grid — {readable}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>

      <section className="mt-8" aria-labelledby="figures">
        <h2 id="figures" className="text-sm font-semibold uppercase tracking-[0.02em] text-muted-foreground">
          Headline figures
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {summary.stats.map((stat) => (
            <Tile key={stat.label} {...stat} settled={settled} />
          ))}
        </div>
      </section>

      {summary.fuels.length > 0 && (
        <section className="mt-8" aria-labelledby="fuel-mix">
          <h2 id="fuel-mix" className="text-sm font-semibold uppercase tracking-[0.02em] text-muted-foreground">
            Generation by fuel
          </h2>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">
              Electricity generated by fuel type on {readable}, in gigawatt-hours
            </caption>
            <thead>
              <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">Fuel</th>
                <th scope="col" className="py-2 text-right font-medium">GWh</th>
                <th scope="col" className="py-2 pl-4 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {summary.fuels.map((fuel) => (
                <tr key={fuel.name} className="border-b border-border/40">
                  <td className="py-2">{fuel.name}</td>
                  <td className="py-2 text-right tabular-nums">{fuel.gen.toLocaleString('en-US')}</td>
                  <td className="w-1/2 py-2 pl-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.max(fuel.share * 100, 1)}%`, background: fuel.color }}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {(fuel.share * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Share is each fuel&rsquo;s proportion of the published rows above, not a figure PGCB stated.
          </p>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-border/70 bg-muted/30 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4" strokeWidth={2} aria-hidden />
          The rest of this day
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The hourly demand and generation curve, per-station output, zone-by-zone demand and load
          shedding, the gas field table and cross-border imports for {readable} are part of the Grid
          Archive.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            prefetch={false}
            href={`/grid-explorer?date=${summary.date}`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open in Grid Explorer
          </Link>
          <Link
            prefetch={false}
            href="/members/subscription"
            rel="nofollow"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold"
          >
            See archive plans
          </Link>
        </div>
      </section>

      {(summary.sources.pgcb || summary.sources.petrobangla) && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.02em] text-muted-foreground">
            Source documents
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {summary.sources.pgcb && <li>PGCB — {summary.sources.pgcb}</li>}
            {summary.sources.petrobangla && <li>Petrobangla — {summary.sources.petrobangla}</li>}
          </ul>
        </section>
      )}

      {/* Neighbour links are how a crawler walks twelve years of archive from
          any entry point, and how a reader follows a story across days. */}
      <nav className="mt-10 flex items-center justify-between border-t border-border/70 pt-5 text-sm">
        {summary.previous ? (
          <Link prefetch={false} href={`/grid-explorer/${summary.previous}`} className="flex items-center gap-2 hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {formatArchiveDate(summary.previous)}
          </Link>
        ) : (
          <span />
        )}
        {summary.next ? (
          <Link prefetch={false} href={`/grid-explorer/${summary.next}`} className="flex items-center gap-2 hover:text-primary">
            {formatArchiveDate(summary.next)}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
