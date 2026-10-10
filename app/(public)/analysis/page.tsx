import { safeJsonLd } from '@/lib/json-ld';
import {
  eventDateline,
  eventStudiesNewestFirst,
  eventWindow,
} from '@/lib/data/analysis/event-registry';
import type { EventStudyResult } from '@/lib/data/analysis/event-study';
import { loadEventStudy } from '@/lib/data/analysis/event-study.server';
import { buildNarrative, heroShape, keyFacts, type KeyFact } from '@/lib/data/analysis/event-narrative';
import EventStudyCard from '@/components/analysis/EventStudyCard';

/**
 * The event-study index: every study in the registry, as a grid a reader can
 * pick from.
 *
 * Nothing here is typed per study. Each card is built from the registry entry
 * and the same series, shape and key facts the study's own page computes, so
 * adding a study to `EVENT_STUDIES` adds its card, and a card cannot claim a
 * figure its page does not show. The newsroom is not read: the cards carry no
 * coverage, so there is no database round-trip on this page at all.
 */

export const revalidate = 3600;

export const metadata = {
  // No site name here: the public layout's template appends " | ESB PowerLine",
  // and this string carried the name itself, so production served
  // "Event studies — ESB PowerLine | ESB PowerLine" (live check, 2026-09-19).
  // "Bangladesh" is what a reader searching for these would type.
  title: 'Event studies — Bangladesh grid and gas events, day by day',
  description:
    'Day-by-day accounts of Bangladesh’s grid and gas network during specific events, built from the official PGCB and Petrobangla records.',
  alternates: { canonical: '/analysis' },
  openGraph: {
    type: 'website',
    url: '/analysis',
    siteName: 'ESB PowerLine',
    title: 'Event studies',
    description: 'Readings of the national record around specific events, every figure from the official daily reports.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

// The two figures a card leads with. Picked by key, not label: the shedding
// fact is named for its own quantity, which differs between eras.
const CARD_FACTS: KeyFact['key'][] = ['lowest', 'worst-shed'];

export default async function AnalysisIndexPage() {
  const defs = eventStudiesNewestFirst();
  const cards = await Promise.all(
    defs.map(async (def) => {
      const study = (await loadEventStudy(def)) as EventStudyResult;
      const narrative = buildNarrative(def, study, [], ['gasNational', 'gasGen'], [], true);
      return {
        def,
        seriesLabel: study.series[def.headlineSeries].label,
        shape: heroShape(study, def.headlineSeries, def.incidentDate, 'gasRlngCapacity'),
        facts: keyFacts(def, study, narrative).filter((f) => CARD_FACTS.includes(f.key)),
      };
    }),
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Event studies',
    url: `${baseUrl}/analysis`,
    hasPart: defs.map((def) => ({
      '@type': 'AnalysisNewsArticle',
      headline: def.title,
      url: `${baseUrl}/analysis/${def.slug}`,
      temporalCoverage: `${eventWindow(def).start}/${def.endDate}`,
    })),
  };

  return (
    <main className="container container--shell py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <header className="mb-8 max-w-[68ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Analysis</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.015em] text-foreground sm:text-[2rem]">
          Event studies
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-7 text-muted-foreground">
          Each study reads the national record around one event, day by day: the gas supply,
          what reached the power sector, what generation ran instead, and the shortfall. Every
          figure is a publisher&rsquo;s own or a stated formula over them, and where the press
          named a cause it is shown beside the figures, never inside them.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
        {cards.map((c) => (
          <EventStudyCard
            key={c.def.slug}
            href={`/analysis/${c.def.slug}`}
            title={c.def.title}
            dateline={eventDateline(c.def)}
            standfirst={c.def.standfirst}
            seriesLabel={c.seriesLabel}
            shape={c.shape}
            facts={c.facts}
          />
        ))}
      </div>
    </main>
  );
}
