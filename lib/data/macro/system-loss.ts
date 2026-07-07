export interface SystemLossRecord {
  fiscal_year: string;
  bpdb: number;
  reb: number;
  dpdc: number;
  desco: number;
  wzpdco: number | null;
  nesco: number | null;
  distribution: number;
  transmission: number;
  total_td: number;
}

export const systemLossData: SystemLossRecord[] = [
  {
    fiscal_year: "2024-25",
    bpdb: 6.68,
    reb: 8.51,
    dpdc: 5.60,
    desco: 5.48,
    wzpdco: 7.26,
    nesco: 7.72,
    distribution: 7.38,
    transmission: 3.04,
    total_td: 10.13
  },
  {
    fiscal_year: "2023-24",
    bpdb: 7.23,
    reb: 8.01,
    dpdc: 6.04,
    desco: 5.57,
    wzpdco: 7.38,
    nesco: 8.58,
    distribution: 7.25,
    transmission: 3.13,
    total_td: 10.06
  },
  {
    fiscal_year: "2022-23",
    bpdb: 7.92,
    reb: 8.56,
    dpdc: 5.71,
    desco: 5.72,
    wzpdco: 7.33,
    nesco: 9.51,
    distribution: 7.65,
    transmission: 3.07,
    total_td: 10.33
  },
  {
    fiscal_year: "2021-22",
    bpdb: 8.10,
    reb: 9.00,
    dpdc: 6.13,
    desco: 5.62,
    wzpdco: 7.44,
    nesco: 9.92,
    distribution: 7.74,
    transmission: 2.89,
    total_td: 10.41
  },
  {
    fiscal_year: "2020-21",
    bpdb: 8.50,
    reb: 9.67,
    dpdc: 6.77,
    desco: 5.58,
    wzpdco: 7.88,
    nesco: 10.49,
    distribution: 8.48,
    transmission: 3.05,
    total_td: 11.11
  },
  {
    fiscal_year: "2019-20",
    bpdb: 8.99,
    reb: 9.90,
    dpdc: 6.67,
    desco: 6.32,
    wzpdco: 8.27,
    nesco: 10.62,
    distribution: 8.73,
    transmission: 2.91,
    total_td: 11.23
  },
  {
    fiscal_year: "2018-19",
    bpdb: 9.12,
    reb: 10.87,
    dpdc: 7.37,
    desco: 7.11,
    wzpdco: 8.83,
    nesco: 10.52,
    distribution: 9.35,
    transmission: 3.10,
    total_td: 11.96
  },
  {
    fiscal_year: "2017-18",
    bpdb: 9.89,
    reb: 11.06,
    dpdc: 7.49,
    desco: 7.14,
    wzpdco: 9.24,
    nesco: 11.32,
    distribution: 9.60,
    transmission: 2.75,
    total_td: 11.87
  },
  {
    fiscal_year: "2016-17",
    bpdb: 10.92,
    reb: 11.38,
    dpdc: 8.48,
    desco: 7.24,
    wzpdco: 9.57,
    nesco: 11.06,
    distribution: 9.98,
    transmission: 2.67,
    total_td: 12.19
  },
  {
    fiscal_year: "2015-16",
    bpdb: 10.66,
    reb: 12.36,
    dpdc: 9.18,
    desco: 8.03,
    wzpdco: 9.98,
    nesco: null,
    distribution: 10.96,
    transmission: 2.63,
    total_td: 13.10
  },
  {
    fiscal_year: "2014-15",
    bpdb: 11.17,
    reb: 12.92,
    dpdc: 9.46,
    desco: 8.34,
    wzpdco: 10.28,
    nesco: null,
    distribution: 11.36,
    transmission: 2.76,
    total_td: 13.55
  },
  {
    fiscal_year: "2013-14",
    bpdb: 11.89,
    reb: 13.72,
    dpdc: 8.99,
    desco: 8.43,
    wzpdco: 10.97,
    nesco: null,
    distribution: 11.96,
    transmission: 2.74,
    total_td: 14.13
  },
  {
    fiscal_year: "2012-13",
    bpdb: 11.95,
    reb: 13.89,
    dpdc: 9.07,
    desco: 8.44,
    wzpdco: 11.38,
    nesco: null,
    distribution: 12.03,
    transmission: 2.94,
    total_td: 14.36
  },
  {
    fiscal_year: "2011-12",
    bpdb: 12.15,
    reb: 13.99,
    dpdc: 9.87,
    desco: 8.52,
    wzpdco: 11.66,
    nesco: null,
    distribution: 12.26,
    transmission: 2.96,
    total_td: 14.61
  },
  {
    fiscal_year: "2010-11",
    bpdb: 13.06,
    reb: 14.13,
    dpdc: 11.95,
    desco: 8.79,
    wzpdco: 11.67,
    nesco: null,
    distribution: 12.75,
    transmission: 2.66,
    total_td: 14.73
  },
  {
    fiscal_year: "2009-10",
    bpdb: 13.11,
    reb: 14.81,
    dpdc: 13.38,
    desco: 8.86,
    wzpdco: 11.73,
    nesco: null,
    distribution: 13.49,
    transmission: 3.08,
    total_td: 15.73
  },
  {
    fiscal_year: "2008-09",
    bpdb: 13.58,
    reb: 13.97,
    dpdc: 18.25,
    desco: 9.79,
    wzpdco: 12.22,
    nesco: null,
    distribution: 14.33,
    transmission: 3.06,
    total_td: 16.85
  },
  {
    fiscal_year: "2007-08",
    bpdb: 14.39,
    reb: 14.73,
    dpdc: 18.44,
    desco: 10.91,
    wzpdco: 13.04,
    nesco: null,
    distribution: 15.56,
    transmission: 3.51,
    total_td: 18.45
  },
  {
    fiscal_year: "2006-07",
    bpdb: 16.58,
    reb: 12.38,
    dpdc: 20.44,
    desco: 13.44,
    wzpdco: 14.72,
    nesco: null,
    distribution: 16.26,
    transmission: 3.15,
    total_td: 20.25
  },
  {
    fiscal_year: "2005-06",
    bpdb: 19.06,
    reb: 12.98,
    dpdc: 20.13,
    desco: 16.20,
    wzpdco: 16.21,
    nesco: null,
    distribution: 16.53,
    transmission: 3.44,
    total_td: 21.25
  },
  {
    fiscal_year: "2004-05",
    bpdb: 20.00,
    reb: 13.78,
    dpdc: 21.94,
    desco: 16.64,
    wzpdco: 19.04,
    nesco: null,
    distribution: 17.83,
    transmission: 3.42,
    total_td: 22.79
  },
  {
    fiscal_year: "2003-04",
    bpdb: 21.33,
    reb: 15.60,
    dpdc: 25.62,
    desco: 19.24,
    wzpdco: 22.72,
    nesco: null,
    distribution: 20.04,
    transmission: 3.48,
    total_td: 24.49
  },
  {
    fiscal_year: "2002-03",
    bpdb: 22.35,
    reb: 17.33,
    dpdc: 27.97,
    desco: 21.06,
    wzpdco: null,
    nesco: null,
    distribution: 21.64,
    transmission: 3.79,
    total_td: 25.69
  },
  {
    fiscal_year: "2001-02",
    bpdb: 24.50,
    reb: 16.61,
    dpdc: 29.71,
    desco: 26.66,
    wzpdco: null,
    nesco: null,
    distribution: 23.92,
    transmission: 4.05,
    total_td: 27.97
  }
];
