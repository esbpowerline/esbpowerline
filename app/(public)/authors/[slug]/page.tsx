import { getServerSiteLocale } from '@/lib/locale-server';
import { notFound } from 'next/navigation';
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

export const revalidate = 600;

/**
 * One user scan per request, shared by generateMetadata and the page. The
 * lookup is by slugified name, which SQL cannot express, so the (small) staff
 * table is read once and matched here; it used to be read twice per request
 * (SEO_FIX_LOG stage 1, 2026-09-02).
 */
const findAuthorBySlug = cache(async (slug: string) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, bio: true, avatar: true, email: true },
  });
  return users.find((u) => slugify(u.name) === slug) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'esb-news-desk') {
    return {
      title: 'ESB News Desk',
      description: 'The official editorial desk of ESB PowerLine, delivering authoritative, breaking, and in-depth energy sector news in Bangladesh.',
      alternates: { canonical: '/authors/esb-news-desk' },
    };
  }

  const user = await findAuthorBySlug(slug);

  if (!user) return { title: 'Author not found' };

  return {
    title: `${user.name}`,
    description: user.bio ?? `Articles written by ${user.name}`,
    alternates: { canonical: `/authors/${slug}` },
  };
}

async function AuthorArticles({ 
  author, 
  locale, 
  page 
}: { 
  author: { id: string; name: string }; 
  locale: string; 
  page: number;
}) {
  const take = 20;
  const skip = (page - 1) * take;

  const whereClause = author.id === 'esb-news-desk' 
    ? { status: 'PUBLISHED' as const, postAsNewsDesk: true }
    : { status: 'PUBLISHED' as const, authorId: author.id, postAsNewsDesk: false };

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
    prisma.article.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / take);

  // Map to PublicArticleCard format
  const mappedArticles = articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .map(a => {
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
                <Link href={`?page=${page - 1}`} className="btn border border-border px-4 py-2 rounded-full hover:bg-muted transition-colors">
                  Previous
                </Link>
              )}
              <span className="py-2 text-sm text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`?page=${page + 1}`} className="btn border border-border px-4 py-2 rounded-full hover:bg-muted transition-colors">
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
          <p className="text-muted-foreground">This author hasn't published any articles yet.</p>
        </div>
      )}
    </div>
  );
}

export default async function AuthorPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getServerSiteLocale();
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || '1'));
  
  let author;

  if (slug === 'esb-news-desk') {
    author = {
      id: 'esb-news-desk',
      name: 'ESB News Desk',
      bio: 'The official editorial desk of ESB PowerLine, delivering authoritative, breaking, and in-depth energy sector news in Bangladesh.',
      avatar: null,
      email: 'desk@esbpowerline.com',
    };
  } else {
    author = await findAuthorBySlug(slug);

    if (!author) notFound();
  }

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
            {author.email && (
              <a href={`mailto:${author.email}`} className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
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
        <AuthorArticles author={author as { id: string, name: string }} locale={locale} page={page} />
      </Suspense>
    </div>
  );
}
