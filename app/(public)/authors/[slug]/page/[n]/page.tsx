import { notFound } from 'next/navigation';
import {
  AuthorProfileFrame,
  allAuthorSlugs,
  authorPageCount,
  resolveAuthor,
} from '@/components/news/AuthorProfileFrame';

export const revalidate = 600;

/**
 * Page N of an author's archive, a real URL with its own canonical — the same
 * shape /articles/page/[n] has used since the `?page=` query string was
 * retired. Page 1 is /authors/{slug} itself, so this route starts at 2.
 */

export async function generateStaticParams() {
  const slugs = await allAuthorSlugs();
  const out: { slug: string; n: string }[] = [];
  for (const slug of slugs) {
    const author = await resolveAuthor(slug);
    if (!author) continue;
    const pages = await authorPageCount(author);
    for (let n = 2; n <= pages; n += 1) out.push({ slug, n: String(n) });
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  const author = await resolveAuthor(slug);
  if (!author) return { title: 'Author not found' };

  return {
    title: `${author.name} — Page ${n}`,
    description: author.bio ?? `Articles written by ${author.name}, page ${n}.`,
    alternates: { canonical: `/authors/${slug}/page/${n}` },
  };
}

export default async function AuthorPageN({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;

  const page = Number.parseInt(n, 10);
  // Page 1 has its own URL; serving it here too would be a duplicate.
  if (!Number.isInteger(page) || page < 2) notFound();

  const author = await resolveAuthor(slug);
  if (!author) notFound();

  if (page > (await authorPageCount(author))) notFound();

  return <AuthorProfileFrame author={author} slug={slug} page={page} />;
}
