/** Macroeconomic indicators affecting power sector costs. */
export const macroEconomicData = [
  { year: '2010', exchangeRate: 69.50, inflation: 8.13, spotLng: 0.0, importCoal: 0.0, retailDiesel: 44.0, retailOctane: 77.0 },
  { year: '2012', exchangeRate: 81.80, inflation: 8.69, spotLng: 0.0, importCoal: 0.0, retailDiesel: 61.0, retailOctane: 94.0 },
  { year: '2014', exchangeRate: 77.60, inflation: 7.35, spotLng: 0.0, importCoal: 0.0, retailDiesel: 68.0, retailOctane: 99.0 },
  { year: '2016', exchangeRate: 78.40, inflation: 5.92, spotLng: 0.0, importCoal: 0.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2018', exchangeRate: 83.90, inflation: 5.78, spotLng: 8.2, importCoal: 85.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2020', exchangeRate: 84.90, inflation: 5.65, spotLng: 6.4, importCoal: 70.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2021', exchangeRate: 84.80, inflation: 5.56, spotLng: 10.2, importCoal: 90.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2022', exchangeRate: 93.50, inflation: 6.15, spotLng: 35.4, importCoal: 280.0, retailDiesel: 80.0, retailOctane: 130.0 },
  { year: '2023', exchangeRate: 109.20, inflation: 9.02, spotLng: 14.5, importCoal: 140.0, retailDiesel: 109.0, retailOctane: 130.0 },
  { year: '2024', exchangeRate: 117.50, inflation: 9.73, spotLng: 12.5, importCoal: 115.0, retailDiesel: 106.75, retailOctane: 131.0 },
  { year: '2026', exchangeRate: 122.00, inflation: 10.45, spotLng: 11.8, importCoal: 105.0, retailDiesel: 105.50, retailOctane: 125.0 },
] as const;

export const petrobanglaAuditedFinancials = [
  { year: 'FY 10', revenue: 6200, lngCost: 0, netProfit: 350 },
  { year: 'FY 12', revenue: 8400, lngCost: 0, netProfit: 450 },
  { year: 'FY 14', revenue: 12500, lngCost: 0, netProfit: 600 },
  { year: 'FY 16', revenue: 16400, lngCost: 0, netProfit: 800 },
  { year: 'FY 17', revenue: 4593, lngCost: 6602, netProfit: -1874 },
  { year: 'FY 18', revenue: 4825, lngCost: 6857, netProfit: -1825 },
  { year: 'FY 20', revenue: 23400, lngCost: 14800, netProfit: 850 },
  { year: 'FY 21', revenue: 25600, lngCost: 17200, netProfit: 600 },
  { year: 'FY 22', revenue: 28100, lngCost: 32800, netProfit: -1900 },
  { year: 'FY 23', revenue: 34500, lngCost: 41200, netProfit: -3400 },
  { year: 'FY 24', revenue: 38900, lngCost: 45500, netProfit: -2800 },
  { year: 'FY 26', revenue: 44200, lngCost: 48900, netProfit: -1200 },
] as const;