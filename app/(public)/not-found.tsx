import Link from 'next/link';

/**
 * A branded 404 with somewhere to go. Unknown slugs — the 33 Bengali-titled
 * articles the server rejects, retired stories, old WordPress paths that no
 * rule maps — used to land on Next's unstyled default with no links at all
 * (SEO_FIX_LOG stage 5). Still a real 404: the status code is Next's.
 *
 * It reads nothing, and that is the point.
 *
 * This page used to render three trending articles. A `not-found` belongs to
 * its route group's segment tree, so its data requirement becomes the floor for
 * every sibling route — and trending is ordered by `views`, which every article
 * read increments and which therefore cannot be tag-invalidated, so it carries a
 * real 30-minute timer rather than a backstop. The result was that /about, a
 * page with no articles on it at all, regenerated every 30 minutes instead of
 * the day it asks for, and so did /categories, /contact, /tags, /titas-gas and
 * all 26 energy-policy pages. Three cards on a page nobody means to visit were
 * setting the refresh rate of the static half of the site.
 *
 * So: keep it synchronous and keep it dependency-free. If this page ever needs
 * to show real content again, that content has to come from somewhere with no
 * time-based revalidate, or the floor comes back with it.
 */

const DESTINATIONS = [
  { href: '/', label: 'Front page', hint: 'Today’s coverage and the daily grid snapshot' },
  { href: '/articles', label: 'Latest news', hint: 'Everything published, newest first' },
  { href: '/categories', label: 'Categories', hint: 'Policy, tariffs, renewables, gas and the grid' },
  { href: '/grid-explorer', label: 'Grid Explorer', hint: 'PGCB, Petrobangla and SREDA, day by day' },
  { href: '/search', label: 'Search', hint: 'Find a story by headline or keyword' },
] as const;

export default function NotFound() {
  return (
    <div className="container container--shell py-16">
      <p className="section-kicker text-rose-600/80 dark:text-rose-400/90 mb-2">404</p>
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">This page is not here</h1>
      <p className="text-muted-foreground mt-3 max-w-prose">
        The address may be from the old site, the story may have been withdrawn, or the link was mistyped.
        The newsroom, the categories and the Grid Explorer are all one click away.
      </p>

      <nav aria-label="Where to go instead" className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="card p-5 group hover:border-primary/50 transition-colors duration-200"
          >
            <div className="font-semibold text-base group-hover:text-primary transition-colors">{d.label}</div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{d.hint}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
