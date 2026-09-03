import Link from 'next/link';
import { getTrendingPublishedArticles } from '@/lib/category-content';
import { ArticleCard } from '@/components/news/ArticleCard';

/**
 * A branded 404 with somewhere to go. Unknown slugs — the 33 Bengali-titled
 * articles the server rejects, retired stories, old WordPress paths that no
 * rule maps — used to land on Next's unstyled default with no links at all
 * (SEO_FIX_LOG stage 5). Still a real 404: the status code is Next's.
 */
export default async function NotFound() {
  const trending = await getTrendingPublishedArticles(3, 'en').catch(() => []);
  return (
    <div className="container container--shell py-16">
      <p className="section-kicker text-rose-600/80 dark:text-rose-400/90 mb-2">404</p>
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">This page is not here</h1>
      <p className="text-muted-foreground mt-3 max-w-prose">
        The address may be from the old site, the story may have been withdrawn, or the link was mistyped.
        The newsroom, the categories and the Grid Explorer are all one click away.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/articles" className="btn btn-primary px-5">Latest news</Link>
        <Link href="/categories" className="btn btn-outline px-5">Categories</Link>
        <Link href="/grid-explorer" className="btn btn-outline px-5">Grid Explorer</Link>
        <Link href="/energy-policy" className="btn btn-outline px-5">Energy policy</Link>
      </div>
      {trending.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Most read right now</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {trending.map((a) => (
              <ArticleCard
                key={a.id}
                id={a.slug}
                articleId={a.id}
                title={a.title}
                shortTitle={a.shortTitle}
                excerpt={a.excerpt}
                category={a.category}
                imageUrl={a.imageUrl}
                author={a.author}
                date={a.date}
                readTime={a.readTime}
                views={a.views}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
