import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleCard } from '@/components/news/ArticleCard';
import { getPublishedArticlesByTag, getPublicTagCounts } from '@/lib/category-content';

export const revalidate = 600;

/**
 * Prerender the busiest tags; let the rest generate on first request.
 *
 * Without a `generateStaticParams` at all, Next does not put a dynamic segment
 * in the prerender manifest — the route is server-rendered on every request,
 * which is what `ƒ /tags/[tag]` meant in the build table even though this page
 * reads no cookies, headers or searchParams and its `revalidate` looked like
 * ISR. Supplying even a small list changes the classification: the route enters
 * the manifest with blocking fallback, so **every** tag, listed or not, is
 * generated once and then cached for `revalidate`.
 *
 * Only the top slice is built, deliberately. There are 398 published tags and
 * these pages are `robots: index:false` — prerendering all of them would spend
 * 398 uncached `array_contains` queries of build time on pages search engines
 * are told to ignore. The long tail costs one render each, once.
 */
const PRERENDERED_TAGS = 40;

export async function generateStaticParams() {
  const counts = await getPublicTagCounts();
  return counts.slice(0, PRERENDERED_TAGS).map(({ tag }) => ({ tag }));
}



interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `Articles tagged with #${tag} in Bangladesh power & energy news.`,
    alternates: {
      canonical: `/tags/${encodeURIComponent(tag)}`,
    },
    // Tags are auto-extracted keywords, so most of these pages list a single
    // article and read as a thin duplicate of it. Keep them out of the index
    // but keep following through to the articles themselves.
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const articles = await getPublishedArticlesByTag(tag);

  if (articles.length === 0) notFound();

  return (
    <div className="container py-8">
      <Breadcrumbs crumbs={[{ name: 'Tags', path: '/tags' }, { name: `#${tag}` }]} />
      <div className="mb-6">
        <Link href="/tags" className="text-sm text-primary">← All tags</Link>
        <h1 className="text-4xl font-display font-bold tracking-tight mt-2">#{tag}</h1>
        <p className="text-muted-foreground">{articles.length} articles</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            id={article.slug}
            title={article.title}
            shortTitle={article.shortTitle}
            excerpt={article.excerpt}
            category={article.category}
            imageUrl={article.imageUrl}
            author={article.author}
            date={article.date}
            readTime={article.readTime}
            views={article.views}
          />
        ))}
      </div>
    </div>
  );
}