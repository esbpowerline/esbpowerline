/**
 * The article desk's filters, and honest counts for them.
 *
 * Every filter dropdown carries a number next to each option. Those numbers
 * were counted against the whole list, ignoring whatever else was filtered —
 * so with the status set to Draft, the author menu still claimed a writer had
 * 40 stories and clicking gave you 3. A count beside an option is a promise
 * about what choosing it produces, and that one was not kept.
 *
 * It also meant every "All …" option showed the same grand total, which is
 * how this was noticed: four dropdowns all reading 217 beside a counter
 * already reading 217.
 *
 * Counting a facet against all the OTHER active filters is the standard fix,
 * and the one that makes the promise true.
 */

export type FilterableArticle = {
  title: string;
  slug: string;
  category: string;
  status: string;
  authorId?: string;
  authorName?: string;
  isFeatured?: boolean;
  isPinned?: boolean;
  isBreaking?: boolean;
};

export type FilterDimension = 'query' | 'status' | 'category' | 'author' | 'flag';

export type ArticleFilterState = {
  query: string;
  status: string;
  category: string;
  author: string;
  flag: string;
};

export const ALL = 'ALL';

export const EMPTY_FILTERS: ArticleFilterState = {
  query: '',
  status: ALL,
  category: ALL,
  author: ALL,
  flag: ALL,
};

function matchesDimension(
  article: FilterableArticle,
  state: ArticleFilterState,
  dimension: FilterDimension,
): boolean {
  switch (dimension) {
    case 'query': {
      const q = state.query.trim().toLowerCase();
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.slug.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q) ||
        (article.authorName ?? '').toLowerCase().includes(q)
      );
    }
    case 'status':
      return state.status === ALL || article.status === state.status;
    case 'category':
      return state.category === ALL || article.category === state.category;
    case 'author':
      return state.author === ALL || article.authorId === state.author;
    case 'flag':
      if (state.flag === ALL) return true;
      if (state.flag === 'featured') return Boolean(article.isFeatured);
      if (state.flag === 'pinned') return Boolean(article.isPinned);
      if (state.flag === 'breaking') return Boolean(article.isBreaking);
      // An unknown flag matches nothing rather than everything: a filter that
      // silently stops filtering is worse than one that visibly returns none.
      return false;
  }
}

const DIMENSIONS: FilterDimension[] = ['query', 'status', 'category', 'author', 'flag'];

/** Rows passing every filter. */
export function applyFilters<T extends FilterableArticle>(
  articles: readonly T[],
  state: ArticleFilterState,
): T[] {
  return articles.filter((a) => DIMENSIONS.every((d) => matchesDimension(a, state, d)));
}

/**
 * Rows passing every filter except one — the set a facet counts against.
 *
 * Excluding the dimension's own filter is what makes the numbers usable: with
 * Status held at Draft, the status menu must still show how many Published
 * there are, or you could never switch to them.
 */
export function rowsForFacet<T extends FilterableArticle>(
  articles: readonly T[],
  state: ArticleFilterState,
  except: FilterDimension,
): T[] {
  return articles.filter((a) =>
    DIMENSIONS.every((d) => d === except || matchesDimension(a, state, d)),
  );
}

/** How many of `rows` carry each value of `key`. */
export function countBy<T>(rows: readonly T[], key: (row: T) => string | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** Flag counts for the one menu whose options are not a column's values. */
export function countFlags(rows: readonly FilterableArticle[]) {
  let featured = 0;
  let pinned = 0;
  let breaking = 0;
  for (const row of rows) {
    if (row.isFeatured) featured += 1;
    if (row.isPinned) pinned += 1;
    if (row.isBreaking) breaking += 1;
  }
  return { featured, pinned, breaking };
}
