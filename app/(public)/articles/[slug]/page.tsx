import { getServerSiteLocale } from '@/lib/locale-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatExactDate, formatArticleDate, formatArticleHoverDate, formatNumber, slugify } from '@/lib/utils';
import { suggestArticleKeywords } from '@/lib/article-keywords';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { heroImageStyle } from '@/lib/hero-image';
import { ArticleCard } from '@/components/news/ArticleCard';
import {
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from '@/lib/category-content';
import { ArticleViewTracker } from '@/components/analytics/ArticleViewTracker';
import { getArticleComments } from '@/lib/actions/members';
import { SaveArticleButton } from '@/components/members/SaveArticleButton';
import { ArticleCommentSection } from '@/components/members/ArticleCommentSection';
import { ArticleAuthorSticky } from '@/components/shared/ArticleAuthorSticky';
import { NoImage } from '@/components/shared/NoImage';
import { safeJsonLd } from '@/lib/json-ld';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { linkPolicyMentions, policiesMentioned } from '@/lib/policy-links';
import { dataPagesForArticle } from '@/lib/data-page-links';
import { POLICIES } from '@/lib/data/policy/policies';
import { gridViewForCategory } from '@/lib/grid-explorer-views';
import { cleanDescription, ORGANIZATION_ID, shareImageUrl, SITE_URL } from '@/lib/seo';
import { hasArticleImage, normalizeArticleImageUrl } from '@/lib/article-image';
import { sanitizeArticleHtml } from '@/lib/sanitize-article-html';
import { splitBodyForAd, stripAdSlotMarkers } from '@/lib/article-ad-split';
import { ShareArticleMenu } from '@/components/shared/ShareArticleMenu';
import { ArticleImageZoom } from '@/components/news/ArticleImageZoom';
import { ArticleTextSize } from '@/components/news/ArticleTextSize';
import { QuickEditButton } from '@/components/editor/QuickEditButton';
import prisma from '@/lib/prisma';

export const revalidate = 600;

/**
 * Prerender the newest published English articles at build time; the rest
 * render on first request and are then cached for `revalidate` seconds like
 * any ISR page. Before this no article route was prerendered at all
 * (prerender-manifest: 0 article entries), so Googlebot's first fetch of any
 * article was always a cold render.
 */
export async function generateStaticParams() {
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, title: true },
    orderBy: { publishedAt: 'desc' },
    take: 240,
  });
  return rows
    .filter((r) => !/[ঀ-৿]/.test(r.title))
    .slice(0, 200)
    .map((r) => ({ slug: r.slug }));
}



export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getServerSiteLocale();
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) return { title: 'Article not found', robots: { index: false } };

  // <title> is the search title, not the headline: the editor's metaTitle when
  // one was written (a field stored on every article and rendered nowhere
  // until stage 5), else the short title, else the headline. No site-name
  // suffix — it cost ~15 of the ~60 visible characters on 121 of 161 titles.
  // The <h1> below stays the editorial headline.
  const searchTitle = article.metaTitle ?? article.shortTitle ?? article.title;
  const description = cleanDescription(article.metaDescription ?? article.excerpt);
  const image = shareImageUrl(normalizeArticleImageUrl(article.imageUrl));
  const tags = article.tags?.length ? article.tags : undefined;

  return {
    title: { absolute: searchTitle },
    description,
    ...(tags ? { keywords: tags } : {}),
    alternates: {
      canonical: `/articles/${encodeURIComponent(article.slug)}`,
    },
    openGraph: {
      title: searchTitle,
      description,
      url: `/articles/${encodeURIComponent(article.slug)}`,
      images: [{ url: image, width: 1200, alt: article.heroImage?.alt ?? article.title }],
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.contentModifiedAt,
      authors: [`${SITE_URL}/authors/${slugify(article.author)}`],
      section: article.category,
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: searchTitle,
      description,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getServerSiteLocale();
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) notFound();

  // No session read here, on purpose. `auth()` reads cookies, which makes the
  // whole route dynamic: every one of the 842 article views in the week to
  // 2026-09-02 was a cold function render with its own Supabase Auth,
  // profiles and article reads, and `revalidate = 600` above never applied.
  // The session-dependent pieces — the save button, the comment form's
  // permissions, the quick-edit shortcut — resolve their own state in the
  // browser after hydration (SEO_FIX_LOG stage 1).
  const [related, comments] = await Promise.all([
    getRelatedPublishedArticles(slug, article.category, article.tags, 4, locale),
    getArticleComments(article.id),
  ]);

  // Shared with the CMS preview so the editor sees the slot where it lands.
  const adSplit = splitBodyForAd(article.content);
  // On the fallback path the marker is still in the body and would render as a
  // stray empty div, so it is stripped whether or not it placed the slot.
  const firstHalf = adSplit?.first ?? stripAdSlotMarkers(article.content);
  const secondHalf = adSplit?.second ?? '';

  const siteUrl = SITE_URL;
  const heroImage = normalizeArticleImageUrl(article.imageUrl);
  const keywords = article.tags?.length ? article.tags : suggestArticleKeywords(article.title, article.content);

  // Every field here has a real source on the row; the ones that do not
  // (image dimensions, a licence) are left out rather than guessed.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/articles/${article.slug}` },
    // Google ignores headlines over 110 characters.
    headline: article.title.slice(0, 110),
    description: cleanDescription(article.metaDescription ?? article.excerpt),
    // An empty `image` invalidates the whole block — omit it instead. Served
    // through the site's optimizer, not the storage origin (see shareImageUrl).
    ...(heroImage ? { image: [shareImageUrl(heroImage)] } : {}),
    datePublished: article.date,
    // The body's last revision, never the row's updatedAt (see
    // PublicArticleDetail.contentModifiedAt): a dateModified that moves when an
    // editor pins a story is a freshness signal the page has not earned.
    dateModified: article.contentModifiedAt,
    author: {
      '@type': 'Person',
      name: article.author,
      url: `${siteUrl}/authors/${slugify(article.author)}`,
    },
    // The organisation declared once in the root layout, by id — not a second,
    // competing publisher entity.
    publisher: { '@id': ORGANIZATION_ID },
    articleSection: article.category,
    inLanguage: 'en',
    // The paywall gates member features, never the article body.
    isAccessibleForFree: true,
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
  };

  return (
    <div className="article-page-root container py-10 max-w-3xl article-page--with-sticky-author fluid-article-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <ArticleViewTracker articleId={article.id} />
      {/* Click a picture in the BODY to enlarge it where it sits. Scoped to
          `.article-body`: the featured image is the story's own frame, sized
          and cropped deliberately, and is not something to open. */}
      <ArticleImageZoom rootSelector=".article-body" />
      {/* Home → News → <category> → this story, visible and as BreadcrumbList. */}
      <Breadcrumbs
        crumbs={[
          { name: 'News', path: '/articles' },
          { name: article.category, path: `/categories/${slugify(article.category)}` },
          { name: article.title.slice(0, 110) },
        ]}
      />
      <Link prefetch={false} href="/articles" className="text-sm text-primary hover:underline">← Back to news</Link>

      <header className="article-header">
        <div className="article-category-wrap flex items-center gap-2">
          {/* A link, not a span: no article linked to its own category hub (stage 5). */}
          <Link prefetch={false} href={`/categories/${slugify(article.category)}`} className="text-sm font-bold uppercase tracking-widest text-primary hover:underline">{article.category}</Link>
        </div>
        <h1 className="font-display font-extrabold tracking-tight leading-[1.05] text-foreground">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-muted-foreground leading-snug font-light article-excerpt">
            {article.excerpt.replace(/\[&hellip;\]/g, '...').replace(/&hellip;/g, '...')}
          </p>
        )}
        
        <div className="article-meta-row">
          <div className="article-meta-left-group">
            <Link prefetch={false} href={`/authors/${slugify(article.author)}`} className="article-meta-avatar rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground uppercase shadow-sm hover:ring-2 hover:ring-primary transition-all shrink-0">
              {article.author.substring(0, 2)}
            </Link>
            <div className="article-meta-text flex flex-col min-w-0">
              <div className="article-meta-author">
                <Link prefetch={false} href={`/authors/${slugify(article.author)}`} className="hover:text-primary transition-colors">
                  {article.author}
                </Link>
                {article.collaborators && article.collaborators.length > 0 && (
                  <>
                    <span className="text-xs font-normal text-muted-foreground">with:</span>
                    <Link
                      prefetch={false}
                      href={`/authors/${slugify(article.collaborators[0].name)}`}
                      className="hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                    >
                      {article.collaborators[0].name}
                    </Link>
                    {article.collaborators.length > 1 && (
                      <span
                        className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground cursor-help"
                        title={article.collaborators.slice(1).map((c) => c.name).join(', ')}
                      >
                        +{article.collaborators.length - 1}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="article-meta-subline">
                <div className="article-meta-date-wrapper">
                  <ModernTooltip 
                    label={formatArticleHoverDate(article.date)}
                    variant="member"
                    alwaysShow
                    side="bottom"
                  >
                    <span className="article-meta-date article-meta-details cursor-help hover:text-foreground transition-colors">
                      {formatArticleDate(article.date)}
                    </span>
                  </ModernTooltip>
                </div>
                <span className="article-meta-separator article-meta-mobile-hide">•</span>
                <div className="article-meta-stats-wrapper">
                  <span className="article-meta-read-time article-meta-details">{article.readTime} min read</span>
                  <span className="article-meta-separator">•</span>
                  <span className="article-meta-views-count article-meta-details">{formatNumber(article.views)} views</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="article-meta-actions flex items-center gap-2">
            <QuickEditButton articleId={article.id} variant="inline" />
            <ShareArticleMenu title={article.title} slug={slug} />
            <SaveArticleButton articleId={article.id} articleSlug={slug} />
          </div>
        </div>
      </header>

      <figure>
        <div className="image-container-with-credit rounded-xl w-full aspect-video border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
          {hasArticleImage(article.imageUrl) ? (
            <>
              <Image
                src={normalizeArticleImageUrl(article.imageUrl)!}
                alt={article.heroImage?.alt ?? article.title}
                fill
                priority
                
                style={heroImageStyle(article.heroImage)}
                // .container (globals.css) is declared after @tailwind utilities, so it
                // overrides max-w-3xl — the real column is up to 1224px, not 768px.
                // Declaring 800px made the browser pick an 828w candidate for a 1224px
                // box and upscale it.
                sizes="(max-width: 1023px) 100vw, 1224px"
              />
              {article.imageCredit && (
                <span className="image-credit-overlay">
                  Photo: {article.imageCredit}
                </span>
              )}
            </>
          ) : (
            <NoImage className="absolute inset-0 h-full w-full" />
          )}
        </div>
        {article.heroImage?.caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">{article.heroImage.caption}</figcaption>
        )}
      </figure>

      {/* Reading tools, on the threshold between the hero and the story —
          the point where a reader decides to settle in, and the last moment
          the choice is worth offering before they are already reading. */}
      <div className="article-reading-tools">
        <ArticleTextSize />
      </div>



      <div className="article-body mt-8 text-lg md:text-xl leading-relaxed pb-safe">
        {/* Policy mentions are linked AFTER sanitising, on the sanitised
            output, so the link markup is ours and never the editor's. The
            first mention of each named act, plan or regulator links to its
            page in the policy library (stage 6). */}
        <div dangerouslySetInnerHTML={{ __html: linkPolicyMentions(sanitizeArticleHtml(firstHalf)) }} />

        {/* In-article ad slot.

            The creative is 1600x150 — 10.67:1, the shape a full-column banner
            needs — so it spans the column at its own proportions and needs no
            height cap or contain-fit. The previous placeholder was a 712x140
            slot drawn at 3x, which this block stretched to 1230x242: 270px
            with margins, 30% of the viewport for one placeholder. Width and
            height are the file's real dimensions so the browser reserves the
            right box and the ad cannot shift the copy as it loads, and
            `sizes` lets it scale with the column on any screen. */}
        {adSplit && (
          <div className="article-body-ad-block my-10" suppressHydrationWarning>
            <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block" suppressHydrationWarning>
              <Image
                src="/images/promotions/in-news-ad.jpeg"
                alt="Advertisement"
                width={1600}
                height={150}
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1232px"
                className="h-auto w-full"
                suppressHydrationWarning
              />
            </Link>
          </div>
        )}

        <div dangerouslySetInnerHTML={{ __html: linkPolicyMentions(sanitizeArticleHtml(secondHalf)) }} />
      </div>

      {/* The data view that backs this kind of story, and the policy pages it
          names. Both are derived: the view from the article's category, the
          policies from the register's names found in the body. A story whose
          category has no data view, or names no policy, shows neither. */}
      {(() => {
        const view = gridViewForCategory(slugify(article.category));
        const mentioned = policiesMentioned(article.content)
          .map((s) => POLICIES.find((p) => p.slug === s))
          .filter((p): p is (typeof POLICIES)[number] => Boolean(p))
          .slice(0, 4);
        const dataPages = dataPagesForArticle(article.title, article.content);
        if (!view && mentioned.length === 0 && dataPages.length === 0) return null;
        return (
          <aside className="article-context mt-10 grid gap-4 sm:grid-cols-2" aria-label="Related data and policy">
            {view && (
              <Link prefetch={false} href={`/grid-explorer?tab=${view.tab}`} className="article-context__card block rounded-2xl border border-border/60 bg-muted/20 p-4 hover:border-primary/40 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Data behind this story</span>
                <span className="mt-1 block font-semibold text-foreground">Grid Explorer — {view.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{view.blurb}, from the official PGCB and Petrobangla daily reports.</span>
              </Link>
            )}
            {dataPages.map((d) => (
              <Link key={d.href} prefetch={false} href={d.href} className="article-context__card block rounded-2xl border border-border/60 bg-muted/20 p-4 hover:border-primary/40 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Data behind this story</span>
                <span className="mt-1 block font-semibold text-foreground">{d.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{d.blurb}</span>
              </Link>
            ))}
            {mentioned.length > 0 && (
              <div className="article-context__card rounded-2xl border border-border/60 bg-muted/20 p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Policy referenced</span>
                <ul className="mt-1 space-y-1.5">
                  {mentioned.map((p) => (
                    <li key={p.slug}>
                      <Link prefetch={false} href={`/energy-policy/${p.slug}`} className="font-semibold text-foreground hover:text-primary">{p.title}</Link>
                      <span className="block text-xs text-muted-foreground">{p.authority} · {p.year} · {p.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        );
      })()}

      {(() => {
        // Stored tags link to their tag page. Keywords extracted from the body
        // (the fallback for the 89 untagged articles) are shown but NOT linked:
        // a tag page only lists articles whose stored `tags` contain the word,
        // so /tags/<keyword> answered 404 for every one of them — 225 dead
        // internal links across the site in the 2026-09-02 crawl, plus 378
        // near-empty noindex tag pages Google was spending crawl on
        // (SEO_FIX_LOG stage 2).
        const stored = article.tags && article.tags.length > 0;
        const displayTags = stored ? article.tags : suggestArticleKeywords(article.title, article.content);
        if (displayTags.length === 0) return null;
        return (
          <div className="mt-10 pt-6 border-t border-border/30">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block mb-3">Trending Keywords</span>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((t: string) =>
                stored ? (
                  <Link prefetch={false} key={t} href={`/tags/${encodeURIComponent(t)}`} className="tag">#{t}</Link>
                ) : (
                  <span key={t} className="tag">#{t}</span>
                ),
              )}
            </div>
          </div>
        );
      })()}

      <div className="mt-10">
        <ArticleCommentSection
          articleId={article.id}
          articleSlug={slug}
          initialComments={comments.map((c) => ({
            id: c.id,
            authorName: c.authorName,
            content: c.content,
            createdAt: c.createdAt,
          }))}
        />
      </div>

      <div className="mt-10">
        {/* h2, not h3: the page's heading order skipped a level (Lighthouse). */}
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="font-semibold text-lg">Related stories</h2>
          <Link prefetch={false} href={`/categories/${slugify(article.category)}`} className="text-sm text-primary hover:underline">
            More in {article.category} →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {related.map((r) => (
            <ArticleCard
              key={r.id}
              id={r.slug}
              articleId={r.id}
              title={r.title}
              shortTitle={r.shortTitle}
              excerpt={r.excerpt}
              category={r.category}
              imageUrl={r.imageUrl}
              author={r.author}
              date={r.date}
              readTime={r.readTime}
              views={r.views}
            />
          ))}
        </div>
      </div>

    </div>
  );
}