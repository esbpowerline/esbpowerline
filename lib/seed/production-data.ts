import { CATEGORIES, CATEGORY_DETAILS } from '@/lib/constants';
import { HOMEPAGE_DEFAULTS } from '@/lib/homepage-defaults';
import { slugify } from '@/lib/utils';

/** Idempotent production category rows — no demo articles or users. */
export function productionCategoryRows() {
  return CATEGORIES.map((name, order) => {
    const meta = CATEGORY_DETAILS[name];
    return {
      name,
      slug: slugify(name),
      description: meta.description,
      color: meta.color,
      icon: meta.icon,
      order,
    };
  });
}

/** Site settings for a fresh production database (managed carousel, empty coverage slots). */
export function productionSiteSettings() {
  return [
    {
      key: 'site',
      value: { name: 'ESB PowerLine', tagline: "Bangladesh's premier energy news portal" },
    },
    {
      key: 'seo',
      value: {
        metaTitle: 'ESB PowerLine — Bangladesh Energy News',
        metaDescription:
          'Authoritative coverage of power generation, renewables, policy, and grid infrastructure.',
      },
    },
    {
      key: 'hero',
      value: {
        title: 'Bangladesh Energy Intelligence',
        subtitle: 'Real-time news, data, and analysis for the power sector',
        imageUrl: '',
      },
    },
    {
      key: 'homepage',
      value: {
        carouselMode: 'managed',
        marketPulse: HOMEPAGE_DEFAULTS.marketPulse,
        snapshotLabel: HOMEPAGE_DEFAULTS.snapshotLabel,
        professionalsCta: HOMEPAGE_DEFAULTS.professionalsCta,
      },
    },
    {
      key: 'ticker',
      value: [
        { id: 'lng', name: 'LNG (Spot)', value: 11.85, unit: '/mmbtu', change: 1.4, prefix: '$' },
        { id: 'coal', name: 'Coal (API2)', value: 102.5, unit: '/t', change: -0.8, prefix: '$' },
        { id: 'fx', name: 'USD/BDT', value: 117.65, unit: '', change: 0.12, prefix: '৳' },
        { id: 'solar', name: 'Solar Module', value: 0.118, unit: '/W', change: -2.1, prefix: '$' },
        { id: 'tariff', name: 'Bulk Tariff', value: 8.95, unit: 'Tk/kWh', change: 0.0, prefix: '' },
        { id: 'gas', name: 'Petrobangla Gas', value: 2686, unit: 'MMcfd', change: 2.9, prefix: '' },
      ],
    },
    {
      key: 'snapshot',
      value: [
        { label: 'Current Demand', value: 16956, unit: 'MW', icon: 'Activity', color: '#ef4444' },
        { label: 'Peak Generation', value: 16030, unit: 'MW', icon: 'Zap', color: '#3b82f6' },
        { label: 'Peak Today', value: 16956, unit: 'MW', icon: 'TrendingUp', color: '#3b82f6' },
        { label: 'Daily Generation', value: 361.5, unit: 'GWh', isDecimal: true, icon: 'TrendingUp', color: '#3b82f6' },
        { label: 'Load Shedding', value: 926, unit: 'MW', icon: 'Activity', color: '#ef4444' },
        { label: 'Energy Unserved', value: 2.14, unit: 'GWh', isDecimal: true, icon: 'Gauge', color: '#ef4444' },
        { label: 'Fuel Cost', value: 6.5, unit: 'Tk/kWh', isDecimal: true, icon: 'Gauge', color: '#f59e0b' },
        { label: 'Gas Supply', value: 2686, unit: 'MMcfd', icon: 'Flame', color: '#8b5cf6' },
        { label: 'Coal Generation', value: 129.2, unit: 'GWh', isDecimal: true, icon: 'Flame', color: '#8b5cf6' },
        { label: 'Grid Import', value: 2570, unit: 'MW', icon: 'Cable', color: '#06b6d4' },
      ],
    },
    {
      key: 'snapshotDate',
      value: '2026-07-15',
    },
    {
      key: 'interviews',
      value: [],
    },
    {
      key: 'gridMix',
      value: [
        { name: 'Gas (CCGT + GT)', value: 52, mw: 14780 },
        { name: 'Coal', value: 18, mw: 5110 },
        { name: 'HFO / Diesel', value: 12, mw: 3410 },
        { name: 'Hydro', value: 2, mw: 570 },
        { name: 'Solar + Wind', value: 5, mw: 1420 },
        { name: 'Imports', value: 8, mw: 2270 },
        { name: 'Nuclear (Rooppur-1)', value: 3, mw: 850 },
      ],
    },
    {
      key: 'gridLines',
      value: [],
    },
    {
      key: 'gridProjects',
      value: [],
    },
    {
      key: 'coverage',
      value: [
        { id: 'slot-1', layout: 'hero', articleSlug: '' },
        { id: 'slot-2', layout: 'headline', articleSlug: '' },
        { id: 'slot-3', layout: 'compact', articleSlug: '' },
        { id: 'slot-4', layout: 'horizontal', articleSlug: '' },
        { id: 'slot-5', layout: 'overlay', articleSlug: '' },
        { id: 'slot-6', layout: 'standard', articleSlug: '' },
        { id: 'slot-7', layout: 'split', articleSlug: '' },
        { id: 'slot-8', layout: 'editorial', articleSlug: '' },
        { id: 'slot-9', layout: 'banner', articleSlug: '' },
      ],
    },
  ] as const;
}

export function productionDashboardStats() {
  return [
    { statName: 'Total Installed Capacity', value: 28420, unit: 'MW', source: 'BPDB', lastVerified: '2026-06-13' },
    { statName: 'Current Generation', value: 16030, unit: 'MW', source: 'NLDC', lastVerified: '2026-07-15' },
    { statName: 'Renewable Share', value: 4.8, unit: '%', source: 'SREDA', lastVerified: '2026-06-10' },
    { statName: 'System Loss', value: 7.6, unit: '%', source: 'BPDB', lastVerified: '2026-06-01' },
    { statName: 'Peak Demand (Est.)', value: 16956, unit: 'MW', source: 'PGCB', lastVerified: '2026-07-15' },
  ];
}