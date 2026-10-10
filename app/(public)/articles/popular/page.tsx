import { ArticlesIndexFrame } from '@/components/news/ArticlesIndexFrame';

// Publishing revalidates /articles directly; the window is a safety net for
// pagination and view-ordered lists. 900s cuts ISR writes 3x versus 300s.
export const revalidate = 900;

/**
 * The "most read" order as its own page, replacing the `?sort=views` query
 * string (SEO_FIX_LOG stage 4). One page: the point of this view is the top
 * of the list, not a second archive.
 */
export const metadata = {
  title: 'Most Read',
  description: 'The most-read power and energy sector stories on ESB PowerLine.',
  alternates: { canonical: '/articles/popular' },
};

export default async function PopularArticlesPage() {
  return <ArticlesIndexFrame page={1} sort="popular" />;
}
