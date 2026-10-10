import { ArticlesIndexFrame } from '@/components/news/ArticlesIndexFrame';

// Publishing revalidates /articles directly; the window is a safety net for
// pagination and view-ordered lists. 900s cuts ISR writes 3x versus 300s.
export const revalidate = 900;

export const metadata = {
  title: 'Latest News',
  description: 'Latest power & energy sector news from Bangladesh. Filter by category, search, and read in-depth analysis.',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'Latest News',
    description: 'Bangladesh power sector updates, renewable energy, policy, projects and tenders.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default async function ArticlesPage() {
  return <ArticlesIndexFrame page={1} sort="latest" />;
}
