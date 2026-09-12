export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  iconImageUrl?: string | null;
  order: number;
  articleCount?: number;
};

export type PublicArticleCard = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string | null;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  /** Lifetime reads. */
  views: number;
  /**
   * Reads in the trailing seven days, from the ArticleView ledger. Set only by
   * the trending query, and printed under its own label — never in place of
   * `views`, which is a different quantity.
   */
  weekViews?: number;
  imageUrl: string;
  heroMeta?: any;
  isFeatured?: boolean;
  isBreaking?: boolean;
  isPinned?: boolean;
  isTrending?: boolean;
};