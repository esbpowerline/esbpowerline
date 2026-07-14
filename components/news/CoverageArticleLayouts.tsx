import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import type { PublicArticleCard } from '@/lib/category-types';
import type { CoverageLayoutId } from '@/lib/coverage-types';
import { heroImageStyle } from '@/lib/hero-image';
import { resolveDisplayTitle } from '@/lib/editorial-limits';
import { ArticleCard } from './ArticleCard';
import { formatArticleDate, formatArticleHoverDate } from '@/lib/utils';
import { ModernTooltip } from '@/components/shared/ModernTooltip';

type ArticleProps = {
  article: PublicArticleCard;
  layout: CoverageLayoutId;
};

function MetaRow({ article }: { article: PublicArticleCard }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
      <span>
        {formatArticleDate(article.date).replace('Published on ', '')}
      </span>
      {article.readTime ? (
        <>
          <span className="opacity-45">·</span>
          <span>{article.readTime} min</span>
        </>
      ) : null}
    </div>
  );
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="category-pill">{category}</span>
  );
}

function HeroLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--hero group block h-full">
      <div className="relative overflow-hidden rounded-t-2xl">
        <Image
          src={article.imageUrl ?? ''}
          alt={article.title}
          width={640}
          height={360}
          
          className="coverage-card__hero-image"
          style={heroImageStyle(article.heroMeta)}
          priority
        />
        <span className="absolute top-4 left-4">
          <CategoryPill category={article.category} />
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-display text-xl font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors sm:text-2xl">
          {displayTitle}
        </h3>
        {article.excerpt && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-4">{article.excerpt}</p>
        )}
        <MetaRow article={article} />
      </div>
    </Link>
  );
}

function HorizontalLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--horizontal group flex h-full gap-4 p-4">
      <div className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 120, height: 88 }}>
        <Image
          src={article.imageUrl ?? ''}
          alt={article.title}
          fill
          
          className="coverage-card__thumb object-cover"
          style={heroImageStyle(article.heroMeta)}
        />
      </div>
      <div className="min-w-0 flex flex-1 flex-col justify-center">
        <CategoryPill category={article.category} />
        <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
        {article.excerpt && <p className="mt-2 text-[13px] text-muted-foreground line-clamp-2">{article.excerpt}</p>}
        <MetaRow article={article} />
      </div>
    </Link>
  );
}

function CompactLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--compact group block h-full p-4">
      <div className="relative overflow-hidden rounded-xl" style={{ width: '100%', height: 200 }}>
        <Image
          src={article.imageUrl ?? ''}
          alt={article.title}
          fill
          
          className="coverage-card__compact-image object-cover"
          style={heroImageStyle(article.heroMeta)}
        />
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
      <MetaRow article={article} />
    </Link>
  );
}

function OverlayLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--overlay group relative block h-full min-h-[220px] overflow-hidden rounded-2xl">
      <Image
        src={article.imageUrl ?? ''}
        alt={article.title}
        fill
        
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        style={heroImageStyle(article.heroMeta)}
        sizes="(max-width: 768px) 100vw, 400px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <CategoryPill category={article.category} />
        <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
        <MetaRow article={article} />
      </div>
    </Link>
  );
}

function HeadlineLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--headline group flex h-full gap-3 p-4">
      <div className="min-w-0 flex-1">
        <CategoryPill category={article.category} />
        <h3 className="mt-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
        <MetaRow article={article} />
      </div>
      <div className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: 88, height: 88 }}>
        <Image
          src={article.imageUrl ?? ''}
          alt={article.title}
          fill
          
          className="coverage-card__headline-thumb object-cover"
          style={heroImageStyle(article.heroMeta)}
        />
      </div>
    </Link>
  );
}

function SplitLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--split group grid h-full gap-0 overflow-hidden sm:grid-cols-2">
      <div className="relative h-full min-h-[180px] w-full">
        <Image
          src={article.imageUrl ?? ''}
          alt={article.title}
          fill
          
          className="object-cover"
          style={heroImageStyle(article.heroMeta)}
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
      <div className="flex flex-col justify-center p-5">
        <CategoryPill category={article.category} />
        <h3 className="mt-2 font-display text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
          {displayTitle}
        </h3>
        {article.excerpt && <p className="mt-2 text-[13px] text-muted-foreground line-clamp-3">{article.excerpt}</p>}
        <MetaRow article={article} />
      </div>
    </Link>
  );
}

function EditorialLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--editorial group flex h-full gap-3 border-l-4 border-primary p-4 pl-5">
      <div className="min-w-0 flex-1">
        <p className="section-category-label text-primary/80">{article.category}</p>
        <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
        {article.excerpt && <p className="mt-2 text-[13px] italic leading-relaxed text-muted-foreground line-clamp-3">{article.excerpt}</p>}
        <MetaRow article={article} />
      </div>
    </Link>
  );
}

function BannerLayout({ article }: { article: PublicArticleCard }) {
  const displayTitle = resolveDisplayTitle(article.title, article.shortTitle);
  return (
    <Link href={`/articles/${article.slug}`} className="coverage-card coverage-card--banner group relative block h-full min-h-[160px] overflow-hidden rounded-2xl">
      <Image
        src={article.imageUrl ?? ''}
        alt={article.title}
        fill
        
        className="object-cover opacity-35 transition-opacity group-hover:opacity-45"
        style={heroImageStyle(article.heroMeta)}
        sizes="(max-width: 768px) 100vw, 800px"
      />
      <div className="relative flex h-full flex-col justify-center bg-background/75 p-4 backdrop-blur-[2px]">
        <CategoryPill category={article.category} />
        <h3 className="mt-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{displayTitle}</h3>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Read story <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function CoverageArticle({ article, layout }: ArticleProps) {
  switch (layout) {
    case 'hero':
      return <HeroLayout article={article} />;
    case 'horizontal':
      return <HorizontalLayout article={article} />;
    case 'compact':
      return <CompactLayout article={article} />;
    case 'overlay':
      return <OverlayLayout article={article} />;
    case 'headline':
      return <HeadlineLayout article={article} />;
    case 'split':
      return <SplitLayout article={article} />;
    case 'editorial':
      return <EditorialLayout article={article} />;
    case 'banner':
      return <BannerLayout article={article} />;
    case 'standard':
    default:
      return (
        <ArticleCard
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
          heroMeta={article.heroMeta}
        />
      );
  }
}