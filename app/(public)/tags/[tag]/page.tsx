import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleCard } from '@/components/news/ArticleCard';
import { getPublishedArticlesByTag, getPublicTagCounts } from '@/lib/category-content';

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return {
    title: `#${tag} | ESB PowerLine`,
    description: `Articles tagged with #${tag} in Bangladesh power & energy news.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const articles = await getPublishedArticlesByTag(tag);

  if (articles.length === 0) notFound();

  return (
    <div className="container py-8">
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