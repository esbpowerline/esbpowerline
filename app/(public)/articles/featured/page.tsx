import { ArticlesIndexFrame } from '@/components/news/ArticlesIndexFrame';

// Same window as /articles: publishing revalidates the content tag.
export const revalidate = 900;

/**
 * Featured-only view of the news index (the homepage "Browse all Featured"
 * link). A sibling route like /articles/popular rather than `?featured=1`, so
 * the page stays statically cached instead of rendering per request.
 */
export const metadata = {
  title: 'Featured',
  description: 'Featured power and energy sector stories picked by the ESB Power Line desk.',
  alternates: { canonical: '/articles/featured' },
};

export default async function FeaturedArticlesPage() {
  return <ArticlesIndexFrame page={1} sort="latest" featured />;
}
