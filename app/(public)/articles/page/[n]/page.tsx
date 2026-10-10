import { notFound } from 'next/navigation';
import { getPublishedArticlesForPublic } from '@/lib/category-content';
import { ARTICLES_PER_PAGE } from '@/components/news/ArticlesIndex';
import { ArticlesIndexFrame, ARTICLES_INDEX_LIMIT } from '@/components/news/ArticlesIndexFrame';

// Publishing revalidates /articles directly; the window is a safety net for
// pagination and view-ordered lists. 900s cuts ISR writes 3x versus 300s.
export const revalidate = 900;

/**
 * Page N of the news index, a real URL with its own canonical. Replaces the
 * `?page=N` query string, which was cumulative and canonicalised away
 * (SEO_FIX_LOG stage 4). Page 1 is `/articles` itself.
 */
async function pageCount(): Promise<number> {
  const articles = await getPublishedArticlesForPublic(ARTICLES_INDEX_LIMIT, 'en');
  return Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE));
}

export async function generateStaticParams() {
  const total = await pageCount();
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return {
    title: `Latest News — Page ${n}`,
    description: `Bangladesh power and energy sector news, page ${n}.`,
    alternates: { canonical: `/articles/page/${n}` },
  };
}

export default async function ArticlesPageN({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const page = Number.parseInt(n, 10);
  if (!Number.isInteger(page) || page < 2) notFound();
  if (page > (await pageCount())) notFound();
  return <ArticlesIndexFrame page={page} sort="latest" />;
}
