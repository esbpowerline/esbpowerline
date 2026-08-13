/** Client-safe homepage defaults — no Prisma/Node imports */

export const HOMEPAGE_DEFAULTS = {
  marketPulse:
    'LNG spot firming • Solar module prices -2.1% WoW • BDT volatility impacting IPP margins • Coal API2 steady at $102 • New 8.95 Tk/kWh bulk tariff in effect',
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