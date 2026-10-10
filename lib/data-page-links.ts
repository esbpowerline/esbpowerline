/**
 * Data pages an article should point readers (and Google) to.
 *
 * Search Console, 2026-10-10: the September LPG price article drew 2,064
 * impressions for 8 clicks, for searches asking the current BERC price — a
 * question /lpg-price answers for every month. Nothing on the article linked
 * there, so neither the reader who landed on a stale month nor Googlebot was
 * sent to the page that stays current. Titas is the same shape: the
 * accountability record at /titas-gas was linked only from the homepage rail.
 *
 * Matched on the headline and body as whole words, so "LPG" in an LNG story's
 * aside does not count unless it is actually named.
 */
export interface DataPageLink {
  href: string;
  label: string;
  blurb: string;
}

const DATA_PAGES: readonly { test: RegExp; link: DataPageLink }[] = [
  {
    test: /\b(LPG|autogas|liquefied petroleum gas)\b/i,
    link: {
      href: '/lpg-price',
      label: 'LPG price in Bangladesh',
      blurb: 'BERC’s current price for every cylinder size, and each month’s notification since October 2025.',
    },
  },
  {
    test: /\bTitas\b/i,
    link: {
      href: '/titas-gas',
      label: 'Titas Gas — the accountability record',
      blurb: 'System loss, finances and audit findings, from Titas’s own audited accounts.',
    },
  },
];

export function dataPagesForArticle(title: string, html: string): DataPageLink[] {
  const text = `${title} ${html.replace(/<[^>]+>/g, ' ')}`;
  return DATA_PAGES.filter((d) => d.test.test(text)).map((d) => d.link);
}
