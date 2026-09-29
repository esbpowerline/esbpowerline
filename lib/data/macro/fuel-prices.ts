const historicalExchangeRates: Record<string, number> = {
  '1975': 12.50,
  '1980': 16.50,
  '1985': 28.00,
  '1990': 35.00,
  '1995': 40.20,
  '2000': 52.10,
  '2005': 64.30,
  '2010': 69.50,
  '2012': 81.80,
  '2014': 77.60,
  '2015': 78.00,
  '2016': 78.40,
  '2018': 83.90,
  '2020': 84.90,
  '2021': 84.80,
  '2022': 93.50,
  '2023': 109.20,
  '2024': 117.50,
  '2026': 122.00,
};

const globalVsDomesticRaw = [
  { year: '1975', globalOil: 11.5, bdDiesel: 1.5, globalCoal: 25.0, bdCoal: 0.0, globalGas: 0.5, bdGas: 0.2, globalSolar: 100.0, bdSolar: 0.0 },
  { year: '1980', globalOil: 36.8, bdDiesel: 4.5, globalCoal: 35.0, bdCoal: 0.0, globalGas: 1.5, bdGas: 0.5, globalSolar: 80.0, bdSolar: 0.0 },
  { year: '1985', globalOil: 27.5, bdDiesel: 8.0, globalCoal: 40.0, bdCoal: 0.0, globalGas: 2.0, bdGas: 0.8, globalSolar: 55.0, bdSolar: 0.0 },
  { year: '1990', globalOil: 23.7, bdDiesel: 11.0, globalCoal: 38.0, bdCoal: 0.0, globalGas: 1.8, bdGas: 1.2, globalSolar: 35.0, bdSolar: 0.0 },
  { year: '1995', globalOil: 17.0, bdDiesel: 12.5, globalCoal: 35.0, bdCoal: 0.0, globalGas: 1.5, bdGas: 1.5, globalSolar: 22.0, bdSolar: 0.0 },
  { year: '2000', globalOil: 28.5, bdDiesel: 15.5, globalCoal: 30.0, bdCoal: 18.0, globalGas: 3.5, bdGas: 2.1, globalSolar: 15.0, bdSolar: 0.0 },
  { year: '2005', globalOil: 54.5, bdDiesel: 28.0, globalCoal: 50.0, bdCoal: 35.0, globalGas: 6.0, bdGas: 3.4, globalSolar: 9.5, bdSolar: 0.0 },
  { year: '2010', globalOil: 79.5, bdDiesel: 44.0, globalCoal: 95.0, bdCoal: 75.0, globalGas: 4.5, bdGas: 4.8, globalSolar: 26.0, bdSolar: 0.0 },
  { year: '2015', globalOil: 52.3, bdDiesel: 65.0, globalCoal: 60.0, bdCoal: 68.0, globalGas: 2.6, bdGas: 6.2, globalSolar: 9.6, bdSolar: 16.0 },
  { year: '2020', globalOil: 41.8, bdDiesel: 65.0, globalCoal: 70.0, bdCoal: 82.0, globalGas: 2.1, bdGas: 9.7, globalSolar: 4.8, bdSolar: 12.0 },
  { year: '2022', globalOil: 99.0, bdDiesel: 80.0, globalCoal: 280.0, bdCoal: 220.0, globalGas: 34.0, bdGas: 11.9, globalSolar: 4.3, bdSolar: 15.0 },
  { year: '2024', globalOil: 82.5, bdDiesel: 106.75, globalCoal: 115.0, bdCoal: 110.0, globalGas: 12.5, bdGas: 14.5, globalSolar: 3.6, bdSolar: 15.77 },
  { year: '2026', globalOil: 78.0, bdDiesel: 135.00, globalCoal: 105.0, bdCoal: 100.0, globalGas: 11.8, bdGas: 16.8, globalSolar: 3.1, bdSolar: 15.77 },
];

/** Global commodity prices vs Bangladesh domestic retail (BDT-adjusted where noted). */
export const globalVsDomesticData = globalVsDomesticRaw.map((d) => {
  const exRate = historicalExchangeRates[d.year] || 122.0;
  return {
    ...d,
    globalSolarBdt: (d.globalSolar * exRate) / 100,
    globalGasBdt: (d.globalGas * exRate) / 28.3,
    globalOilBdt: (d.globalOil * exRate) / 158.987,
  };
});

export { historicalExchangeRates };