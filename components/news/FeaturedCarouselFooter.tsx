import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatArticleDate } from '@/lib/utils';

export type FeaturedCarouselFooterLabels = {
  readStory: string;
  browseAll: string;
  minRead: string;
};

export function FeaturedCarouselFooter({
  slug,
  labels,
  transport,
  date,
}: {
  slug: string;
  labels: FeaturedCarouselFooterLabels;
  transport: ReactNode;
  date?: string;
}) {
  return (
    <div className="featured-hero__footer">
      <Link
        href={`/articles/${slug}`}
        className="btn btn-primary featured-hero__read-btn gap-2 px-7 py-3 text-[15px] shrink-0"
      >
        {labels.readStory} <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/articles"
        className="btn btn-secondary featured-hero__browse-btn gap-2 px-6 py-3 text-[15px] shrink-0"
      >
        {labels.browseAll}
      </Link>
      <p className="featured-hero__byline-text shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {labels.minRead}
      </p>
      {date ? (
        // Absolute, not "2h ago": the homepage is statically regenerated, so a
        // relative string would be frozen at build time in the cached HTML and
        // would also mismatch between the server render and hydration. This is
        // the same treatment ArticleCard and HomeTrendingSection give a card date.
        <p className="featured-hero__timestamp shrink-0 text-xs font-semibold uppercase tracking-wider">
          {formatArticleDate(date).replace('Published on ', '')}
        </p>
      ) : null}
      {transport}
    </div>
  );
}