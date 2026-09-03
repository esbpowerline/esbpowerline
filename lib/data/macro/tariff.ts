import { bercBulkTariffHistory } from '@/lib/data/companies/berc';

/** Wholesale tariff vs unit production cost (Tk/kWh). */
export const macroTariffData = [
  { year: 'Mar 2010', cost: 2.68, tariff: 2.37 },
  { year: 'Feb 2011', cost: 4.20, tariff: 2.61 },
  { year: 'Dec 2011', cost: 4.20, tariff: 2.89 },
  { year: 'Feb 2012', cost: 5.40, tariff: 3.36 },
  { year: 'Sep 2012', cost: 5.85, tariff: 4.02 },
  { year: 'Sep 2015', cost: 5.50, tariff: 4.90 },
  { year: 'Mar 2020', cost: 5.91, tariff: 5.17 },
  { year: 'Dec 2022', cost: 8.50, tariff: 6.20 },
  { year: 'Jan 2023', cost: 11.33, tariff: 6.70 },
  { year: 'Feb 2024', cost: 12.10, tariff: 7.04 },
  { year: 'Jun 2026', cost: 12.91, tariff: 8.39 },
] as const;

export { bercBulkTariffHistory };