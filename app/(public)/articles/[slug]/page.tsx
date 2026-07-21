import { getServerSiteLocale } from '@/lib/locale-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatExactDate, formatArticleDate, formatArticleHoverDate, formatNumber, slugify, extractKeywords } from '@/lib/utils';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { heroImageStyle } from '@/lib/hero-image';
import { ArticleCard } from '@/components/news/ArticleCard';
import {
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from '@/lib/category-content';
import { ArticleViewTracker } from '@/components/analytics/ArticleViewTracker';
import { auth } from '@/lib/auth';
import { can, type Role } from '@/lib/constants';
import { getArticleComments, getArticleSavedState } from '@/lib/actions/members';
import { SaveArticleButton } from '@/components/members/SaveArticleButton';
import { ArticleCommentSection } from '@/components/members/ArticleCommentSection';
import { ArticleAuthorSticky } from '@/components/shared/ArticleAuthorSticky';
import { NoImage } from '@/components/shared/NoImage';
import { safeJsonLd } from '@/lib/json-ld';
import { hasArticleImage, normalizeArticleImageUrl } from '@/lib/article-image';
import { sanitizeArticleHtml } from '@/lib/sanitize-article-html';
import { ShareArticleMenu } from '@/components/shared/ShareArticleMenu';
import prisma from '@/lib/prisma';

export const revalidate = 600;



export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getServerSiteLocale();
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) return { title: 'Article not found | ESB PowerLine' };

  return {
    title: `${article.title} | ESB PowerLine`,
    description: article.excerpt,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: normalizeArticleImageUrl(article.imageUrl) ?? '' }],
      type: 'article',
      publishedTime: article.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [normalizeArticleImageUrl(article.imageUrl) ?? ''],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getServerSiteLocale();
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) notFound();

  const [related, session, comments, saved] = await Promise.all([
    getRelatedPublishedArticles(slug, article.category, article.tags, 3, locale),
    auth(),
    getArticleComments(article.id),
    getArticleSavedState(article.id),
  ]);

  const role = session?.user?.role as Role | undefined;
  const signedIn = !!session?.user?.id;
  const canPostComment = signedIn && can(role, 'comment.create');
  const staffComment = can(role, 'comment.moderate_any');

  const paragraphs = article.content.split('</p>');
  const middleIndex = Math.floor(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, middleIndex).join('</p>') + (middleIndex > 0 ? '</p>' : '');
  const secondHalf = paragraphs.slice(middleIndex).join('</p>');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: normalizeArticleImageUrl(article.imageUrl) ?? '',
    datePublished: article.date,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ESB PowerLine',
    },
  };

  return (
    <div className="container py-10 max-w-3xl article-page--with-sticky-author fluid-article-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <ArticleViewTracker articleId={article.id} />
      <Link href="/articles" className="text-sm text-primary hover:underline">← Back to news</Link>

      <header className="article-header">
        <div className="article-category-wrap flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">{article.category}</span>
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
            <Link href={`/authors/${slugify(article.author)}`} className="article-meta-avatar rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground uppercase shadow-sm hover:ring-2 hover:ring-primary transition-all shrink-0">
              {article.author.substring(0, 2)}
            </Link>
            <div className="article-meta-text flex flex-col min-w-0">
              <div className="article-meta-author">
                <Link href={`/authors/${slugify(article.author)}`} className="hover:text-primary transition-colors">
                  {article.author}
                </Link>
                {article.collaborators && article.collaborators.length > 0 && (
                  <>
                    <span className="text-xs font-normal text-muted-foreground">with:</span>
                    <Link
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
            <ShareArticleMenu title={article.title} slug={slug} />
            <SaveArticleButton
              articleId={article.id}
              articleSlug={slug}
              initialSaved={saved}
              signedIn={signedIn}
            />
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
                sizes="(max-width: 768px) 100vw, 800px"
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



      <div className="article-body mt-8 text-lg md:text-xl leading-relaxed pb-safe">
        <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(firstHalf) }} />

        {/* In-Article Ad Space */}
        {paragraphs.length > 3 && (
          <div className="article-body-ad-block my-12" suppressHydrationWarning>
            <Link href="/advertising" className="rounded-2xl overflow-hidden relative group block" suppressHydrationWarning>
              <Image src="/images/promotions/008.png" alt="Advertisement" width={2136} height={420} className="w-full h-auto object-cover" suppressHydrationWarning />
            </Link>
          </div>
        )}

        <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(secondHalf) }} />
      </div>

      {(() => {
        const displayTags = article.tags && article.tags.length > 0
          ? article.tags
          : extractKeywords(article.title, article.content);
        if (displayTags.length === 0) return null;
        return (
          <div className="mt-10 pt-6 border-t border-border/30">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block mb-3">Trending Keywords</span>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((t: string) => (
                <Link key={t} href={`/tags/${t}`} className="tag">#{t}</Link>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="mt-10">
        <ArticleCommentSection
          articleId={article.id}
          articleSlug={slug}
          canPostComment={canPostComment}
          staffComment={staffComment}
          initialComments={comments.map((c) => ({
            id: c.id,
            authorName: c.authorName,
            content: c.content,
            createdAt: c.createdAt,
          }))}
        />
      </div>

      <div className="mt-10">
        <h3 className="font-semibold mb-4">Related stories</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {related.map((r) => (
            <ArticleCard
              key={r.id}
              id={r.slug}
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

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
    </div>
  );
}