/** Client-safe homepage defaults — no Prisma/Node imports */

/**
 * `marketPulse` used to end with "New 8.95 Tk/kWh bulk tariff in effect". It was
 * removed on 2026-09-05 because no instrument supports it and the shape of the
 * claim is wrong twice over.
 *
 * There is no single national bulk tariff to quote. BERC Reconsideration Order
 * 2026/01 (4 Jun 2026), Appendix-ka, fixes it per utility AND per voltage: 33 kV
 * runs 7.1530 for BREB's PBSs, 8.3225 for NESCO, 8.5325 for WZPDCL, 9.4115 for
 * BPDB's own zones and 10.0950 for DPDC and DESCO. And 8.95 matched none of the
 * candidates anyway -- not the 8.39 carried two files away in
 * `lib/data/companies/berc.ts`, which is itself the 3 June weighted average that
 * lived for one day before the 4 June reconsideration cut the bulk rates.
 *
 * The three commodity claims that remain in this string are also hand-written and
 * uncited, and they are the same class of specimen data that was deleted from
 * `LiveMarketTicker` for being presented as market data while being neither
 * derived nor published. They are left standing only because this edit was scoped
 * to the tariff defect; see TARIFF_EVIDENCE_SPRINT_2026-09-05.md §E.
 */
export const HOMEPAGE_DEFAULTS = {
  marketPulse:
    'LNG spot firming • Solar module prices -2.1% WoW • BDT volatility impacting IPP margins • Coal API2 steady at $102',
  snapshotLabel: 'Live • BPDB • PGCB • SREDA • Petrobangla',
  professionalsCta: {
    label: 'MEMBER ACCESS',
    title: 'Save articles & magazine issues, download data, comment, and unlock in-depth analysis.',
    primaryLabel: 'Member sign in',
    primaryHref: '/members/login',
    secondaryLabel: 'Create account',
    secondaryHref: '/members/login',
  },
  magazineCtaTemplate: 'Read {month} {year} Issue',
};

export type CarouselItem = {
  slug: string;
  title: string;
  shortTitle?: string | null;
  excerpt: string;
  imageUrl: string;
  author: string;
  readTime: number;
  category: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  heroMeta?: any;
  /** Publication time, ISO. Same field every other article card renders. */
  date?: string;
};