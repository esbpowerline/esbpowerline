import { ArticlesIndexFrame } from '@/components/news/ArticlesIndexFrame';

export const revalidate = 300;

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
