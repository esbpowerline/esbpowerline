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
import { getCategoryAccentColor } from '@/lib/category-icons';
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
  // Narrow cards (home featured row, phones' 2-up) cannot fit
  // "September 24, 2026 at 2:00 PM" beside the read time; they show this
  // instead (container query on .article-card). Fixed zone, so SSR == client.
  const shortDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Dhaka' })
    : '';

  const hasBadge = Boolean(isPinned || isFeatured || isBreaking);
  const showKicker = !hideCategory || hasBadge;

  return (
    <Link prefetch={false} href={`/articles/${id}`} className={`article-card group ${isFeatured ? 'is-featured' : ''}`}>
      {/* The frame is the banner's own shape (16:9, --banner-ratio). It used to be
          a fixed h-48, so the box changed shape with every column count and
          object-fit:cover cut the 1920x1080 news banners down to 53-78% —
          logo/date strip, footer strip and, on narrow cards, the headline
          panel (UI audit 2026-11-01). */}
      <div className="article-card__image-wrapper relative">
        {hasArticleImage(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={heroMeta?.alt ?? title}
            width={1920}
            height={1080}
            // The card is one column on phones and a third of the container on
            // desktop; without `sizes` the browser assumed full viewport width
            // and fetched the largest candidate for a 400px slot.
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="article-card__image"
            style={heroImageStyle(heroMeta)}
          />
        ) : (
          <NoImage className="article-card__image w-full" compact />
        )}
        <QuickEditButton articleId={articleId} variant="card" />
      </div>
      <div className="article-card__body p-5">
        <div>
          {/* Category and placement sit above the headline, not on the picture:
              the banners already print their own category chip and the ESB
              logo in that corner. */}
          {showKicker ? (
            <div className="article-card__kicker">
              {!hideCategory ? (
                <CategoryLabel
                  name={category}
                  className="article-card__category"
                  style={{ '--kicker': getCategoryAccentColor(category) } as React.CSSProperties}
                />
              ) : null}
              {isPinned ? <ArticlePlacementBadge type="pin" compact /> : null}
              {!isPinned && isFeatured ? <ArticlePlacementBadge type="featured" compact /> : null}
              {isBreaking ? <ArticlePlacementBadge type="breaking" compact /> : null}
            </div>
          ) : null}
          <h3 className="font-semibold tracking-[-0.015em] leading-tight group-hover:text-primary transition-colors">{displayTitle}</h3>
          {excerpt && <p className="mt-2 text-[13px] text-muted-foreground line-clamp-3 leading-snug">{excerpt.replace(/\[&hellip;\]/g, '...').replace(/&hellip;/g, '...')}</p>}
        </div>
        <div className="article-card__meta text-ui-xs text-muted-foreground">
          {date ? (
            <span className="article-card__date">
              <span className="article-card__date-long">{formatArticleDate(date).replace('Published on ', '')}</span>
              <span className="article-card__date-short">{shortDate}</span>
            </span>
          ) : null}
          {readTime ? <span className="shrink-0 whitespace-nowrap">{readTime} {t('common.min')}</span> : null}
        </div>
      </div>
    </Link>
  );
}
