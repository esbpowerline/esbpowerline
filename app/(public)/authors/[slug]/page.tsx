import { notFound } from 'next/navigation';
import {
  AuthorProfileFrame,
  allAuthorSlugs,
  resolveAuthor,
  NEWS_DESK_SLUG,
} from '@/components/news/AuthorProfileFrame';

export const revalidate = 600;

/**
 * Page 1 of an author's archive.
 *
 * This route used to read `searchParams.page`, which opts a page out of static
 * rendering entirely — so the build reported `ƒ /authors/[slug]` and every view
 * was a full server render with its queries, for content that only changes when
 * somebody publishes. Pagination now lives at /authors/[slug]/page/[n], the same
 * shape /articles/page/[n] has used since the SEO fix, and middleware
 * 308-redirects the old `?page=` form.
 */

export async function generateStaticParams() {
  const slugs = await allAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === NEWS_DESK_SLUG) {
    return {
      title: 'ESB News Desk',
      description: 'The official editorial desk of ESB PowerLine, delivering authoritative, breaking, and in-depth energy sector news in Bangladesh.',
      alternates: { canonical: `/authors/${NEWS_DESK_SLUG}` },
    };
  }

  const user = await resolveAuthor(slug);
  if (!user) return { title: 'Author not found' };

  return {
    title: `${user.name}`,
    description: user.bio ?? `Articles written by ${user.name}`,
    alternates: { canonical: `/authors/${slug}` },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await resolveAuthor(slug);
  if (!author) notFound();

  return <AuthorProfileFrame author={author} slug={slug} page={1} />;
}
