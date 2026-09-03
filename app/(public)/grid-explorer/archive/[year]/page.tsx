import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArchiveCatalogue, formatArchiveDate } from '@/lib/data/grid/archive-day.server';

/**
 * One year of the archive, grouped by month — the middle rung of the crawl path
 * from `/grid-explorer/archive` down to each day.
 */

export const revalidate = 86400;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateStaticParams() {
  const catalogue = await getArchiveCatalogue();
  const years = [...new Set(catalogue.map((d) => d.slice(0, 4)))];
  return years.map((year) => ({ year }));
}

async function daysInYear(year: string): Promise<string[]> {
  if (!/^\d{4}$/.test(year)) return [];
  const catalogue = await getArchiveCatalogue();
  return catalogue.filter((d) => d.startsWith(`${year}-`));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const days = await daysInYear(year);
  if (!days.length) return { title: 'Year not found — ESB PowerLine' };

  const description = `Bangladesh power sector daily reports for ${year}: peak generation, demand, load shedding, fuel mix and gas supply for each of the ${days.length} days PGCB and Petrobangla published that year.`;

  return {
    title: `Bangladesh Power Grid ${year} — daily generation, demand & load shedding`,
    description,
    alternates: { canonical: `/grid-explorer/archive/${year}` },
    openGraph: {
      type: 'website',
      url: `/grid-explorer/archive/${year}`,
      siteName: 'ESB PowerLine',
      title: `Bangladesh Power Grid — ${year}`,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function GridArchiveYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const days = await daysInYear(year);
  if (!days.length) notFound();

  const byMonth = new Map<string, string[]>();
  for (const date of days) {
    const month = date.slice(5, 7);
    const list = byMonth.get(month) ?? [];
    list.push(date);
    byMonth.set(month, list);
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/grid-explorer" className="hover:text-foreground">Grid Explorer</Link>
        {' / '}
        <Link href="/grid-explorer/archive" className="hover:text-foreground">Archive</Link>
        {' / '}
        <span>{year}</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Bangladesh Power Grid — {year}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {days.length.toLocaleString('en-US')} daily reports from {year}. Each links to that day&rsquo;s
        headline figures: peak generation and demand, load shedding, energy unserved, generation by
        fuel and national gas production.
      </p>

      <div className="mt-8 space-y-8">
        {months.map(([month, dates]) => (
          <section key={month} aria-labelledby={`m-${month}`}>
            <h2 id={`m-${month}`} className="text-sm font-semibold uppercase tracking-[0.02em] text-muted-foreground">
              {MONTHS[Number(month) - 1]} {year}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {dates.map((date) => (
                <li key={date}>
                  <Link
                    href={`/grid-explorer/${date}`}
                    className="inline-block rounded-lg border border-border/70 bg-card px-3 py-1.5 text-sm tabular-nums transition-colors hover:border-primary/40"
                    title={formatArchiveDate(date)}
                  >
                    {date.slice(8, 10)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
