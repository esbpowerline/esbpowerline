import type { Metadata } from 'next';
import Link from 'next/link';
import { getArchiveCatalogue } from '@/lib/data/grid/archive-day.server';

/**
 * The archive's front door.
 *
 * A sitemap alone is a weak discovery signal: Google crawls what the site
 * links to, and 4,548 day pages reachable from nothing would read as orphans.
 * This page and its year children give every day a real path from
 * `/grid-explorer`, three clicks deep at most.
 */

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Bangladesh Power Grid Archive — every daily report since 2013',
  description:
    'Browse twelve years of Bangladesh power sector daily reports: generation, demand, load shedding, fuel mix and gas supply for every day PGCB and Petrobangla published, from 2013 to today.',
  alternates: { canonical: '/grid-explorer/archive' },
  openGraph: {
    type: 'website',
    url: '/grid-explorer/archive',
    siteName: 'ESB PowerLine',
    title: 'Bangladesh Power Grid Archive',
    description:
      'Every daily PGCB and Petrobangla report since 2013, one page per day.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default async function GridArchiveIndexPage() {
  const catalogue = await getArchiveCatalogue();

  const byYear = new Map<string, number>();
  for (const date of catalogue) {
    const year = date.slice(0, 4);
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }
  const years = [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const first = catalogue[0];
  const last = catalogue[catalogue.length - 1];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/grid-explorer" className="hover:text-foreground">Grid Explorer</Link>
        {' / '}
        <span>Archive</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Bangladesh Power Grid Archive
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Every daily report published by the Power Grid Company of Bangladesh and Petrobangla that
        this archive holds — {catalogue.length.toLocaleString('en-US')} days
        {first && last ? `, from ${first} to ${last}` : ''}. Each day has its own page carrying the
        headline figures for that date: peak generation and demand, load shedding, energy unserved,
        generation by fuel and national gas production.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {years.map(([year, count]) => (
          <li key={year}>
            <Link
              href={`/grid-explorer/archive/${year}`}
              className="block rounded-xl border border-border/70 bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <span className="text-lg font-semibold">{year}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {count.toLocaleString('en-US')} {count === 1 ? 'day' : 'days'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
