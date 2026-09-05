/**
 * The eight `?tab=` views of the Grid Explorer, in one place: the page lists
 * them as crawlable links, and articles use them to point at the data view
 * that backs a story (SEO_FIX_LOG stage 6).
 */
export const GRID_EXPLORER_VIEWS: { tab: string; label: string; blurb: string }[] = [
  { tab: 'gen', label: 'Generation & cost', blurb: 'Half-hourly fuel mix and the day’s production cost by fuel' },
  { tab: 'gas', label: 'Gas & LNG supply', blurb: 'Field-by-field gas production and where it was allocated' },
  { tab: 'imports', label: 'Cross-border imports', blurb: 'The four interconnectors with India and Nepal, hour by hour' },
  { tab: 'regional', label: 'Regional grid', blurb: 'Zone-wise demand, load shedding and the NLDC outage log' },
  { tab: 'renewables', label: 'Renewables', blurb: 'Solar, wind and hydro output against installed capacity' },
  { tab: 'plants', label: 'Power stations', blurb: 'Every station’s output, installed capacity and utilisation' },
  { tab: 'transmission', label: 'Technical information', blurb: 'Transmission lines, substations and grid infrastructure' },
  { tab: 'macro', label: 'Macro trends', blurb: 'Gas reserves, budgets, monthly archives and long-run indicators' },
  { tab: 'timemachine', label: 'Time Machine', blurb: 'Eleven years of NLDC’s hourly archive, hour by hour' },
];

/**
 * Which explorer view supports a story, by the article's category slug. Only
 * categories with a genuinely matching data view are listed; the policy and
 * regulators category points at the policy library instead, and a category
 * with no counterpart gets no link rather than a loose one.
 */
export const GRID_VIEW_FOR_CATEGORY: Record<string, string> = {
  'power-generation': 'gen',
  'fossil-fuels-commodities': 'gas',
  'renewables-nuclear': 'renewables',
  'grid-transmission': 'transmission',
  'distribution-utilities': 'regional',
  'international-cross-border': 'imports',
  'market-finance-subsidies': 'macro',
  'consumers-tariffs': 'macro',
  'environment-efficiency': 'renewables',
};

export function gridViewForCategory(categorySlug: string) {
  const tab = GRID_VIEW_FOR_CATEGORY[categorySlug];
  return tab ? GRID_EXPLORER_VIEWS.find((v) => v.tab === tab) ?? null : null;
}
