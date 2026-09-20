import { describe, expect, it } from 'vitest';
import {
  ALL,
  EMPTY_FILTERS,
  applyFilters,
  countBy,
  countFlags,
  rowsForFacet,
  type ArticleFilterState,
  type FilterableArticle,
} from '@/lib/article-filters';

/**
 * A count beside a filter option is a promise about what choosing it gives.
 *
 * The desk counted every option against the whole list, ignoring the other
 * active filters — so with Status on Draft, the author menu still advertised
 * a writer's full total and clicking produced a handful. The visible symptom
 * was four menus all reading the same grand total beside a counter already
 * reading it, which is how it was spotted.
 */

const A = (over: Partial<FilterableArticle> & { title: string }): FilterableArticle => ({
  slug: over.title.toLowerCase().replace(/\s+/g, '-'),
  category: 'Power',
  status: 'PUBLISHED',
  ...over,
});

const ROWS: FilterableArticle[] = [
  A({ title: 'Grid one', status: 'PUBLISHED', category: 'Power', authorId: 'u1', authorName: 'Hamim' }),
  A({ title: 'Grid two', status: 'PUBLISHED', category: 'Power', authorId: 'u2', authorName: 'Yeasin' }),
  A({ title: 'Gas one', status: 'DRAFT', category: 'Gas', authorId: 'u1', authorName: 'Hamim' }),
  A({ title: 'Gas two', status: 'DRAFT', category: 'Gas', authorId: 'u1', authorName: 'Hamim', isFeatured: true }),
  A({ title: 'Policy', status: 'ARCHIVED', category: 'Policy', authorId: 'u2', authorName: 'Yeasin', isPinned: true }),
];

const withFilters = (over: Partial<ArticleFilterState>): ArticleFilterState => ({
  ...EMPTY_FILTERS,
  ...over,
});

describe('the count beside an option is what clicking it gives', () => {
  it('counts a facet against the other active filters', () => {
    const state = withFilters({ status: 'DRAFT' });
    const rows = rowsForFacet(ROWS, state, 'author');
    const counts = countBy(rows, (a) => a.authorId);
    // Hamim has three stories in total but only two drafts. The old code
    // showed three and delivered two.
    expect(counts.get('u1')).toBe(2);
    expect(counts.get('u2')).toBeUndefined();

    // And the promise holds: choosing that option returns exactly that many.
    expect(applyFilters(ROWS, withFilters({ status: 'DRAFT', author: 'u1' })).length).toBe(2);
  });

  it('holds for every option of every menu, under every single filter', () => {
    // The property, rather than one example: for each menu and each option,
    // the advertised count equals what selecting it actually returns.
    const dimensions = [
      { key: 'category' as const, values: ['Power', 'Gas', 'Policy'], of: (a: FilterableArticle) => a.category },
      { key: 'author' as const, values: ['u1', 'u2'], of: (a: FilterableArticle) => a.authorId },
      { key: 'status' as const, values: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], of: (a: FilterableArticle) => a.status },
    ];
    for (const active of dimensions) {
      for (const activeValue of active.values) {
        const state = withFilters({ [active.key]: activeValue } as Partial<ArticleFilterState>);
        for (const menu of dimensions) {
          const counts = countBy(rowsForFacet(ROWS, state, menu.key), menu.of);
          for (const option of menu.values) {
            const advertised = counts.get(option) ?? 0;
            const actual = applyFilters(
              ROWS,
              withFilters({ ...state, [menu.key]: option } as Partial<ArticleFilterState>),
            ).length;
            expect(advertised).toBe(actual);
          }
        }
      }
    }
  });

  it("does not let a menu's own filter hide the rest of its options", () => {
    // With Status on Draft, the status menu must still show the Published
    // count, or there is no way back to them.
    const counts = countBy(rowsForFacet(ROWS, withFilters({ status: 'DRAFT' }), 'status'), (a) => a.status);
    expect(counts.get('PUBLISHED')).toBe(2);
    expect(counts.get('DRAFT')).toBe(2);
  });

  it('counts flags against the other filters too', () => {
    expect(countFlags(rowsForFacet(ROWS, EMPTY_FILTERS, 'flag'))).toEqual({
      featured: 1,
      pinned: 1,
      breaking: 0,
    });
    expect(countFlags(rowsForFacet(ROWS, withFilters({ status: 'DRAFT' }), 'flag'))).toEqual({
      featured: 1,
      pinned: 0,
      breaking: 0,
    });
  });
});

describe('the "All" option', () => {
  it('counts what is left after the other filters, not the whole list', () => {
    const state = withFilters({ category: 'Gas' });
    // "All statuses" while Gas is selected means the two gas stories, not 5.
    expect(rowsForFacet(ROWS, state, 'status').length).toBe(2);
    expect(rowsForFacet(ROWS, EMPTY_FILTERS, 'status').length).toBe(ROWS.length);
  });
});

describe('the search box', () => {
  it('matches title, slug, category and author', () => {
    expect(applyFilters(ROWS, withFilters({ query: 'grid' })).length).toBe(2);
    expect(applyFilters(ROWS, withFilters({ query: 'hamim' })).length).toBe(3);
    expect(applyFilters(ROWS, withFilters({ query: 'gas' })).length).toBe(2);
    expect(applyFilters(ROWS, withFilters({ query: '  ' })).length).toBe(ROWS.length);
  });

  it('combines with the menus rather than replacing them', () => {
    expect(applyFilters(ROWS, withFilters({ query: 'hamim', status: 'DRAFT' })).length).toBe(2);
  });
});

describe('an unknown flag', () => {
  it('matches nothing rather than everything', () => {
    // A filter that silently stops filtering shows the full list under a
    // label promising a subset, which is the worse of the two failures.
    expect(applyFilters(ROWS, withFilters({ flag: 'not-a-flag' })).length).toBe(0);
    expect(applyFilters(ROWS, withFilters({ flag: ALL })).length).toBe(ROWS.length);
  });
});
