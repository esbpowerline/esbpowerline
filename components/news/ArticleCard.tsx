'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatExactDate, formatArticleDate, formatArticleHoverDate } from '@/lib/utils';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { ArticlePlacementBadge } from '@/components/shared/ArticlePlacementBadge';
import { CategoryLabel } from '@/components/i18n/CategoryLabel';
import { NoImage } from '@/components/shared/NoImage';
import { hasArticleImage } from '@/lib/article-image';
import { useLocale } from '@/components/shared/LocaleProvider';
import { heroImageStyle } from '@/lib/hero-image';
import { resolveDisplayTitle } from '@/lib/editorial-limits';
import { QuickEditButton } from '@/components/editor/QuickEditButton';

interface ArticleCardProps {
  id: string;
  /** Database id of the article — enables the staff quick-edit shortcut to the CMS. */
  articleId?: string;
  title: string;
  shortTitle?: string | null;
  excerpt?: string | null;
  category: string;
  imageUrl?: string | null;
  author?: string;
  date?: string | Date;
  views?: number;
  readTime?: number;
  isFeatured?: boolean;
  isBreaking?: boolean;
  isPinned?: boolean;
  heroMeta?: any;
  hideCategory?: boolean;
  /**
   * True for the first card or two of a listing: the card image is the page's
   * largest paint on category and index pages, and without this it was
   * discovered late — 690 ms of resource delay on the category page's LCP
   * (Lighthouse, 2026-09-02, SEO_FIX_LOG stage 7).
   */
  priority?: boolean;
}

export function ArticleCard({
  id,
  articleId,
  title,
  shortTitle,
  excerpt,
  category,
  imageUrl,
  author,
  date,
  views,
  readTime,
  isFeatured,
  isBreaking,
  isPinned,
  heroMeta,
  hideCategory = false,
  priority = false,
}: ArticleCardProps) {
  const { locale, t } = useLocale();
  const timeAgo = date ? formatExactDate(date) : '';
  const displayTitle = resolveDisplayTitle(title, shortTitle);

  return (
    <Link prefetch={false} href={`/articles/${id}`} className={`article-card group ${isFeatured ? 'is-featured' : ''}`}>
      <div className="article-card__image-wrapper relative">
        {hasArticleImage(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={heroMeta?.alt ?? title}
            width={500}
            height={192}
            // The card is one column on phones and a third of the container on
            // desktop; without `sizes` the browser assumed full viewport width
            // and fetched the largest candidate for a 400px slot.
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="article-card__image"
            style={heroImageStyle(heroMeta)}
          />
        ) : (
          <NoImage className="article-card__image h-48 w-full" compact />
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1">
          {!hideCategory && <CategoryLabel name={category} className="category-pill" />}
          {isPinned ? <ArticlePlacementBadge type="pin" compact /> : null}
          {!isPinned && isFeatured ? <ArticlePlacementBadge type="featured" compact /> : null}
          {isBreaking ? <ArticlePlacementBadge type="breaking" compact /> : null}
        </div>
        <QuickEditButton articleId={articleId} variant="card" />
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold tracking-[-0.015em] leading-tight group-hover:text-primary transition-colors">{displayTitle}</h3>
          {excerpt && <p className="mt-2.5 text-[13px] text-muted-foreground line-clamp-3 leading-snug">{excerpt.replace(/\[&hellip;\]/g, '...').replace(/&hellip;/g, '...')}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between text-ui-xs text-muted-foreground pt-1">
          {date ? (
            <span>
              {formatArticleDate(date).replace('Published on ', '')}
            </span>
          ) : null}
          {readTime ? <span>{readTime} {t('common.min')}</span> : null}
        </div>
      </div>
    </Link>
  );
}
