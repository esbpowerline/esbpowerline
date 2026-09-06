import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleCard } from '@/components/news/ArticleCard';
import { getCategoryBySlug, getPublishedArticlesByCategory } from '@/lib/category-content';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import { createTranslator } from '@/lib/i18n/messages';
import { getServerSiteLocale } from '@/lib/locale-server';
import { categoryIconWrapStyle, categoryTextStyle } from '@/lib/category-icons';
import { CategoryIconDisplay } from '@/components/category/CategoryIconDisplay';
import prisma from '@/lib/prisma';
import { safeJsonLd } from '@/lib/json-ld';
import { articleListJsonLd, cleanDescription } from '@/lib/seo';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const revalidate = 600;



interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerSiteLocale();
  const category = await getCategoryBySlug(slug);
  const localized = category
    ? localizeCategoryFields(locale, category)
    : { name: slug, description: null };
  // "Power Generation" alone is a 16-character title; the country and the
  // count are what a searcher scanning results needs (stage 5).
  const count = category?.articleCount ?? 0;
  const description =
    localized.description && localized.description.length >= 60
      ? localized.description
      : `${localized.name} news and analysis for Bangladesh's power and energy sector${
          count ? ` — ${count} published stories` : ''
        }${localized.description ? `: ${localized.description}` : '.'}`;
  return {
    title: `${localized.name} News — Bangladesh Power Sector`,
    description: cleanDescription(description),
    alternates: {
      canonical: `/categories/${slug}`,
    },
    openGraph: {
      title: `${localized.name} — ESB PowerLine`,
      description: cleanDescription(description),
      url: `/categories/${slug}`,
      // A page-level openGraph replaces the layout's whole block, image included.
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    // A category with nothing published renders a "no articles yet" page,
    // which Search Console reports as a soft 404 (two of them, 2026-09-02).
    // Keep it out of the index until it has something to index; the page
    // itself stays reachable and the sitemap already omits it (Stage 3).
    ...(category && (category.articleCount ?? 0) === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Ten categories, all prerendered. Without this the route was on-demand only
 * (ƒ in the build table) and production served every category view as a cold
 * render with `private, no-store` — 391 of them in the week to 2026-09-02
 * (SEO_FIX_LOG stage 1). Articles still revalidate every `revalidate` seconds.
 */
export async function generateStaticParams() {
  const rows = await prisma.category.findMany({ select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const localized = localizeCategoryFields(locale, category);
  const articles = await getPublishedArticlesByCategory(category.name, locale);

  return (
    <div className="container container--shell py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleListJsonLd(`${localized.name} — ESB PowerLine`, articles.map((a) => a.slug))) }}
      />
      <Breadcrumbs crumbs={[{ name: 'Categories', path: '/categories' }, { name: localized.name }]} />
      <div className="mb-6">
        <Link prefetch={false} href="/categories" className="inline-flex items-center text-sm text-primary">
          {t('categories.allCategories')}
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="p-2 rounded bg-muted text-primary"
            style={categoryIconWrapStyle(category.color) ?? (category.color ? { color: category.color } : undefined)}
          >
            <CategoryIconDisplay
              icon={category.icon}
              iconImageUrl={category.iconImageUrl}
              name={localized.name}
              size={20}
              className="h-5 w-5"
              style={categoryTextStyle(category.color)}
            />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">{localized.name}</h1>
        </div>
        <p className="text-muted-foreground mt-1.5">
          {localized.description ?? t('categories.latestAnalysis')}
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">{t('categories.noPublished')}</p>
      ) : (
        <div className="articles-grid">
          {articles.map((article, i) => (
            <ArticleCard
              key={article.id}
              priority={i < 2}
              id={article.slug}
              title={article.title}
              shortTitle={article.shortTitle}
              excerpt={article.excerpt}
              category={article.category}
              imageUrl={article.imageUrl}
              author={article.author}
              date={article.date}
              readTime={article.readTime}
              views={article.views}
            />
          ))}
        </div>
      )}
    </div>
  );
}