import Link from 'next/link';
import { Suspense, cache } from 'react';
import { User, Twitter, Linkedin, Mail } from 'lucide-react';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { ArticleCard } from '@/components/news/ArticleCard';
import { normalizeArticleImageUrl } from '@/lib/article-image';
import { safeJsonLd } from '@/lib/json-ld';
import { ORGANIZATION_ID, SITE_URL } from '@/lib/seo';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { getServerSiteLocale } from '@/lib/locale-server';

/**
 * The author profile, shared by /authors/[slug] and /authors/[slug]/page/[n].
 *
 * It used to live entirely in the page, which read `searchParams.page` for
 * pagination — and reading searchParams opts a route out of static rendering
 * altogether. So every author page view was a full server render plus its
 * queries, no matter that the content changes only when somebody publishes.
 * The build table said `ƒ /authors/[slug]` while `/articles/page/[n]` beside it
 * said `●`, having already solved the same problem with a path segment.
 *
 * Page 1 is `/authors/{slug}`; page N is `/authors/{slug}/page/{N}`, exactly
 * mirroring `/articles` and `/articles/page/[n]`. The old `?page=` form is
 * 308-redirected in middleware, so nothing that is already linked breaks.
 */

export const AUTHOR_PAGE_SIZE = 20;

/** The desk is not a row in `User`; it is the byline articles carry when
 *  `postAsNewsDesk` is set. It has a profile page anyway. */
export const NEWS_DESK_SLUG = 'esb-news-desk';

const NEWS_DESK = {
  id: NEWS_DESK_SLUG,
  name: 'ESB News Desk',
  bio: 'The official editorial desk of ESB PowerLine, delivering authoritative, breaking, and in-depth energy sector news in Bangladesh.',
  avatar: null as string | null,
  email: 'desk@esbpowerline.com',
};

/**
 * One user scan per request, shared by generateMetadata and the page. The
 * lookup is by slugified name, which SQL cannot express, so the (small) staff
 * table is read once and matched here; it used to be read twice per request
 * (SEO_FIX_LOG stage 1, 2026-09-02).
 */
export const findAuthorBySlug = cache(async (slug: string) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, bio: true, avatar: true, email: true },
  });
  return users.find((u) => slugify(u.name) === slug) ?? null;
});

export type AuthorProfile = {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  email: string | null;
};

/** Resolve a slug to an author, desk included. `null` means 404. */
export async function resolveAuthor(slug: string): Promise<AuthorProfile | null> {
  if (slug === NEWS_DESK_SLUG) return NEWS_DESK;
  return findAuthorBySlug(slug);
}

/** Every author slug that has a profile page, for generateStaticParams. */
export async function allAuthorSlugs(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { name: true } });
  return [NEWS_DESK_SLUG, ...users.map((u) => slugify(u.name)).filter(Boolean)];
}

function articleFilter(author: AuthorProfile) {
  return author.id === NEWS_DESK_SLUG
    ? { status: 'PUBLISHED' as const, postAsNewsDesk: true }
    : { status: 'PUBLISHED' as const, authorId: author.id, postAsNewsDesk: false };
}

/** How many pages this author's archive runs to. At least 1. */
export async function authorPageCount(author: AuthorProfile): Promise<number> {
  const total = await prisma.article.count({ where: articleFilter(author) });
  return Math.max(1, Math.ceil(total / AUTHOR_PAGE_SIZE));
}

/** Page 1 lives at /authors/{slug}; the rest carry the segment. */
export const authorPageHref = (slug: string, page: number) =>
  page <= 1 ? `/authors/${slug}` : `/authors/${slug}/page/${page}`;

async function AuthorArticles({
  author,
  slug,
  locale,
  page,
}: {
  author: AuthorProfile;
  slug: string;
  locale: string;
  page: number;
}) {
  const take = AUTHOR_PAGE_SIZE;
  const skip = (page - 1) * take;
  const whereClause = articleFilter(author);

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      include: { author: { select: { name: true } } },
      // The mapper below reads fifteen scalars and never the body; without
      // this, twenty full article bodies (and their Bengali twins) crossed the
      // wire per page and were discarded (SEO_FIX_LOG stage 1, 2026-09-02).
      omit: { content: true, contentBn: true },
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / take);

  const mappedArticles = articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[ঀ-৿]/.test(a.title);
      } else {
        return !/[ঀ-৿]/.test(a.title);
      }
    })
    .map((a) => {
      const title = locale === 'bn' && a.titleBn ? a.titleBn : a.title;
      const excerpt = locale === 'bn' && a.excerptBn ? a.excerptBn : (a.excerpt ?? '');
      return {
        id: a.id,
        slug: a.slug,
        title: title,
        shortTitle: a.shortTitle,
        excerpt: excerpt,
        category: a.category,
        author: a.postAsNewsDesk ? 'ESB News Desk' : (a.author?.name ?? 'ESB PowerLine'),
        date: (a.publishedAt ?? a.createdAt).toISOString(),
        readTime: a.readTime,
        views: a.views,
        imageUrl: normalizeArticleImageUrl(a.imageUrl) ?? '',
        heroMeta: (a.seo as any)?.heroImage,
        isFeatured: a.isFeatured,
        isBreaking: a.isBreaking,
        isPinned: a.isPinned,
      };
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <h2 className="text-2xl font-bold tracking-tight">Latest from {author.name.split(' ')[0]}</h2>
        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">{totalCount} articles</span>
      </div>

      {mappedArticles.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappedArticles.map((a) => (
              <ArticleCard
                key={a.id}
                id={a.slug}
                title={a.title}
                shortTitle={a.shortTitle}
                excerpt={a.excerpt}
                category={a.category}
                imageUrl={a.imageUrl}
                author={a.author}
                date={a.date}
                readTime={a.readTime}
                views={a.views}
                heroMeta={a.heroMeta}
                isFeatured={a.isFeatured}
              />
            ))}
          </div>
          {totalPages > 1 && totalCount > 0 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              {page > 1 && (
                <Link
                  href={authorPageHref(slug, page - 1)}
                  className="btn border border-border px-4 py-2 rounded-full hover:bg-muted transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="py-2 text-sm text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={authorPageHref(slug, page + 1)}
                  className="btn border border-border px-4 py-2 rounded-full hover:bg-muted transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
          <p className="text-muted-foreground">This author hasn&apos;t published any articles yet.</p>
        </div>
      )}
    </div>
  );
}

export async function AuthorProfileFrame({
  author,
  slug,
  page,
}: {
  author: AuthorProfile;
  slug: string;
  page: number;
}) {
  const locale = await getServerSiteLocale();

  // `User.email` is the staff account's sign-in address, not a published
  // contact. Rendering it as a mailto put a personal Gmail — and therefore
  // half of a working CMS credential — in the public HTML of an author page,
  // where it is also trivially harvested. Only an address on the site's own
  // domain is a role address someone chose to publish; anything else is
  // withheld and the button simply does not render.
  const contactEmail =
    author.email && /@([a-z0-9-]+\.)*esbpowerline\.com$/i.test(author.email)
      ? author.email
      : null;

  // ProfilePage over a Person, from the fields the page already shows. No
  // sameAs: the author rows carry no profile links.
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: author.name,
      url: `${SITE_URL}/authors/${slug}`,
      ...(author.bio ? { description: author.bio } : {}),
      worksFor: { '@id': ORGANIZATION_ID },
    },
  };

  return (
    <div className="container py-12 max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileJsonLd) }} />
      <Breadcrumbs crumbs={[{ name: 'News', path: '/articles' }, { name: author.name }]} />
      <div className="flex flex-col md:flex-row gap-8 items-start mb-16 bg-muted/30 p-8 rounded-3xl border border-border/50">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-3xl md:text-5xl shrink-0 overflow-hidden border border-primary/20">
          {author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatar} alt={author.name} width={128} height={128} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            author.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">{author.name}</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            {author.bio || `Staff writer at ESB PowerLine.`}
          </p>
          <div className="flex items-center gap-3">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            )}
            <button className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
              <Twitter className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
              <Linkedin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">Loading articles...</div>}>
        <AuthorArticles author={author} slug={slug} locale={locale} page={page} />
      </Suspense>
    </div>
  );
}
