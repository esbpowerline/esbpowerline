/**
 * BPDB's annual accounts, broken out by cost head.
 *
 * The daily PGCB report prices a unit of electricity by fuel burnt that day.
 * That is the right number for a day and the wrong number for a year: it
 * carries no capacity payment, no depreciation, no debt service, and imports
 * carry no fuel line at all -- which is why the daily table makes imported
 * power look like the cheapest thing on the grid at around 6 Tk/kWh. BPDB's
 * own accounts say it cost 8.85 Tk/kWh in FY 2022-23, and that power bought
 * from private producers cost 18.32.
 *
 * Every figure below is Published: BPDB printed it, in its own annual report,
 * in the Comparative Statement of Budget and Achievement (the Achievement
 * column -- what was spent, not what was budgeted). The `derived` block is the
 * only arithmetic ESB PowerLine performs, and each entry carries the published
 * numerator and denominator it was computed from so the division can be
 * checked by hand.
 *
 * Extracted by scripts/bpdb_annual_costheads.py and scripts/bpdb_annual_extract.py.
 * Two engines read every figure independently -- PyMuPDF by column geometry,
 * pdfplumber by requiring BPDB's own Performance-over-Budget column to
 * reconcile -- and a figure ships only where they agree, or where BPDB's
 * printed total settles the disagreement. In every year the twelve cost heads
 * sum to the printed Total Operating Expenses to within one paisa.
 *
 * COVERAGE STOPS AT FY 2022-23. BPDB lists FY 2023-24 and FY 2024-25 on its
 * annual-reports page with no file attached, and every report before FY
 * 2016-17 is a page scan with no text layer. Neither gap is filled by
 * inference. Do not present this as current-year data.
 *
 * Amounts are Crore BDT throughout. The older reports print Lac Taka and the
 * unit is read off each page and converted (1 Crore = 100 Lac) rather than
 * assumed -- getting that wrong is a factor-of-100 error.
 *
 * Generated file. Re-run the scripts rather than editing by hand.
 */

export type BpdbCostGroup = 'own-fuel' | 'purchase' | 'fixed' | 'network';

export interface BpdbCostHead {
  key: string;
  label: string;
  group: BpdbCostGroup;
  /** As printed in the Achievement column, normalised to Crore BDT. */
  crore: number;
  /** Present where the two engines disagreed and BPDB's printed total decided it. */
  resolvedBy?: string;
}

/** A figure BPDB itself printed as a per-unit cost. Published, not derived. */
export interface BpdbPublishedRate {
  value: number;
  source: string;
  url?: string;
}

/** ESB PowerLine's own division, shown with both published inputs. */
export interface BpdbDerivedRate {
  value: number;
  numeratorCrore: number;
  denominatorMkwh: number;
}

export interface BpdbAnnualAccounts {
  fy: string;
  heads: BpdbCostHead[];
  totalOperatingExpensesCrore: number;
  subsidyCrore?: number;
  energySalesCrore?: number;
  source: {
    file: string;
    url?: string;
    statement: string;
    /** What the page itself said the figures were in, before conversion. */
    printedUnit: string;
  };
  /** Net energy generation by who generated it, from Key Statistics. */
  generationMkwh: Record<string, number>;
  bulkSalesMkwh?: number;
  published: Record<string, BpdbPublishedRate>;
  derived: Record<string, BpdbDerivedRate>;
}

/**
 * Why there is no per-unit cost for BPDB's own generation here.
 *
 * The three fuel heads are what BPDB burnt in its own plants. The nearest
 * published denominator, "Net energy generation - Public Sector", counts
 * APSCL, EGCB, NWPGCL, RPCL and BRPL as well, which BPDB buys from rather
 * than runs. Dividing one by the other gives about 2.2 Tk/kWh for FY 2022-23
 * against the 4.63 BPDB prints itself, because the denominator is roughly
 * twice what it should be. BPDB's own published figure is used instead, and
 * this derivation is deliberately absent.
 */
export const BPDB_OWN_GENERATION_NOTE =
  "BPDB publishes its thermal fuel cost per unit directly; ESB PowerLine does " +
  "not recompute it, because the only published generation denominator " +
  "includes plants BPDB buys from rather than operates.";

/**
 * The import figure pairs "Electricity purchase from India" with "Power
 * Import". For FY 2022-23 that denominator includes the Godda (Adani) plant,
 * which came online in March 2023 and which BPDB does not separate from its
 * other Indian purchases -- so the year's import rate is a blend, not the
 * price of any one contract.
 */
export const BPDB_IMPORT_CAVEAT =
  "Import cost blends every Indian supply contract, including Godda from " +
  "March 2023; BPDB does not publish them separately.";

export const BPDB_ANNUAL_ACCOUNTS: BpdbAnnualAccounts[] = [
    {
      "fy": "2016-17",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 884.51
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 2003.14
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 612.24
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 8733.87
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 6001.41
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 2592.55
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 5340.11
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 1507.8
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 488.74
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1337.25
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 116.27
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 255.2
        }
      ],
      "totalOperatingExpensesCrore": 29873.09,
      "energySalesCrore": 27325.41,
      "source": {
        "file": "BPDB Annual Report 2016-2017.pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/7b2fab50fc25485db3713054b483d369.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Lac Taka"
      },
      "generationMkwh": {
        "PublicSector": 26597.0
      },
      "bulkSalesMkwh": 53937.0,
      "published": {
        "generationCostPerUnit": {
          "value": 5.24,
          "source": "BPDB Annual Report 2016-2017.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/7b2fab50fc25485db3713054b483d369.pdf"
        },
        "fuelCostPerUnitThermal": {
          "value": 2.76,
          "source": "BPDB Annual Report 2017-2018.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/b03f22241a3348c3a4efa7c753a7494e.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 5.7,
          "source": "BPDB Annual Report 2017-2018.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/b03f22241a3348c3a4efa7c753a7494e.pdf"
        }
      },
      "derived": {
        "systemAllInUnitCost": {
          "value": 5.54,
          "numeratorCrore": 29873.09,
          "denominatorMkwh": 53937.0
        }
      }
    },
    {
      "fy": "2017-18",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 839.45
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 4409.29
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 873.26
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 10410.59
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 6281.73
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 2812.58
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 7289.54
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 1663.87
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 752.97
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1177.77
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 117.92
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 182.92
        }
      ],
      "totalOperatingExpensesCrore": 36811.89,
      "subsidyCrore": 956.2,
      "energySalesCrore": 29741.16,
      "source": {
        "file": "BPDB Annual Report 2017-2018.pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/b03f22241a3348c3a4efa7c753a7494e.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Lac Taka"
      },
      "generationMkwh": {
        "PublicSector": 31082.0
      },
      "bulkSalesMkwh": 59221.0,
      "published": {
        "fuelCostPerUnitThermal": {
          "value": 3.4,
          "source": "BPDB Annual Report 2018-2019.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/88f4c583b05a4c2e9b6d66bbff020a32.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 6.5,
          "source": "BPDB Annual Report 2018-2019.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/88f4c583b05a4c2e9b6d66bbff020a32.pdf"
        }
      },
      "derived": {
        "systemAllInUnitCost": {
          "value": 6.22,
          "numeratorCrore": 36811.89,
          "denominatorMkwh": 59221.0
        }
      }
    },
    {
      "fy": "2018-19",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 1226.84
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 2379.93
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 642.58
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 15748.5
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 5013.62
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 3702.63
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 6839.3
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 1826.83
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 611.3,
          "resolvedBy": "printed total"
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1219.53
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 127.2
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 215.02
        }
      ],
      "totalOperatingExpensesCrore": 39553.3,
      "subsidyCrore": 7966.73,
      "energySalesCrore": 33064.03,
      "source": {
        "file": "BPDB Annual Report 2018-2019.pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/88f4c583b05a4c2e9b6d66bbff020a32.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Lac Taka"
      },
      "generationMkwh": {
        "PublicSector": 35107.0
      },
      "bulkSalesMkwh": 66547.0,
      "published": {
        "fuelCostPerUnitThermal": {
          "value": 1.95,
          "source": "BPDB Annual Report 2019-2020.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/218f3fdc40a944c6a1fd7d70bbdd231c.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 6.06,
          "source": "BPDB Annual Report 2018-2019.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/88f4c583b05a4c2e9b6d66bbff020a32.pdf"
        }
      },
      "derived": {
        "systemAllInUnitCost": {
          "value": 5.94,
          "numeratorCrore": 39553.3,
          "denominatorMkwh": 66547.0
        }
      }
    },
    {
      "fy": "2019-20",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 1746.19
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 654.74
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 1014.24
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 17518.98
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 3216.43
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 4017.13
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 6671.67
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 2307.8
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 969.77
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1420.64
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 117.55
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 231.99
        }
      ],
      "totalOperatingExpensesCrore": 39887.15,
      "subsidyCrore": 7439.44,
      "energySalesCrore": 34011.55,
      "source": {
        "file": "BPDB Annual Report 2019-2020.pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/218f3fdc40a944c6a1fd7d70bbdd231c.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Lac Taka"
      },
      "generationMkwh": {
        "PublicSector": 35316.0,
        "PrivateSector": 26750.0,
        "PowerImport": 6674.0
      },
      "bulkSalesMkwh": 67668.0,
      "published": {
        "generationCostPerUnit": {
          "value": 5.91,
          "source": "BPDB Annual Report 2020-2021.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/060d5987327f4dafbd1832b9938972fd.pdf"
        },
        "fuelCostPerUnitThermal": {
          "value": 1.64,
          "source": "BPDB Annual Report 2019-2020.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/218f3fdc40a944c6a1fd7d70bbdd231c.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 6.09,
          "source": "BPDB Annual Report 2020-2021.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/060d5987327f4dafbd1832b9938972fd.pdf"
        }
      },
      "derived": {
        "importUnitCost": {
          "value": 6.02,
          "numeratorCrore": 4017.13,
          "denominatorMkwh": 6674.0
        },
        "privateUnitCost": {
          "value": 7.75,
          "numeratorCrore": 20735.41,
          "denominatorMkwh": 26750.0
        },
        "systemAllInUnitCost": {
          "value": 5.89,
          "numeratorCrore": 39887.15,
          "denominatorMkwh": 67668.0
        }
      }
    },
    {
      "fy": "2020-21",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 1493.04
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 779.4
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 722.33
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 27737.36
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 3328.24
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 4712.91
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 6917.03
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 2386.53
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 760.66
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1244.88
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 108.68
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 243.89
        }
      ],
      "totalOperatingExpensesCrore": 50434.96,
      "subsidyCrore": 11777.91,
      "energySalesCrore": 40141.08,
      "source": {
        "file": "BPDB Annual Report 2020-2021.pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/060d5987327f4dafbd1832b9938972fd.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Lac Taka"
      },
      "generationMkwh": {
        "PublicSector": 31916.0,
        "PrivateSector": 34822.0,
        "PowerImport": 8103.0
      },
      "published": {
        "generationCostPerUnit": {
          "value": 6.61,
          "source": "BPDB Annual Report 2020-2021.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/060d5987327f4dafbd1832b9938972fd.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 6.81,
          "source": "BPDB Annual Report 2020-2021.pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/060d5987327f4dafbd1832b9938972fd.pdf"
        }
      },
      "derived": {
        "importUnitCost": {
          "value": 5.82,
          "numeratorCrore": 4712.91,
          "denominatorMkwh": 8103.0
        },
        "privateUnitCost": {
          "value": 8.92,
          "numeratorCrore": 31065.6,
          "denominatorMkwh": 34822.0
        }
      }
    },
    {
      "fy": "2022-23",
      "heads": [
        {
          "key": "fuelGas",
          "label": "Fuel cost - gas",
          "group": "own-fuel",
          "crore": 2943.52
        },
        {
          "key": "fuelOil",
          "label": "Diesel / furnace oil",
          "group": "own-fuel",
          "crore": 3419.32
        },
        {
          "key": "fuelCoal",
          "label": "Coal",
          "group": "own-fuel",
          "crore": 1413.19
        },
        {
          "key": "purchaseIpp",
          "label": "Electricity purchased from IPPs",
          "group": "purchase",
          "crore": 59022.74
        },
        {
          "key": "purchaseRental",
          "label": "Electricity purchased from rentals",
          "group": "purchase",
          "crore": 3743.85
        },
        {
          "key": "purchaseIndia",
          "label": "Electricity imported from India",
          "group": "purchase",
          "crore": 9223.41
        },
        {
          "key": "purchasePublic",
          "label": "Electricity purchased from public plants",
          "group": "purchase",
          "crore": 10788.25
        },
        {
          "key": "depreciation",
          "label": "Depreciation",
          "group": "fixed",
          "crore": 2493.49
        },
        {
          "key": "repairMaintenance",
          "label": "Repair & maintenance",
          "group": "fixed",
          "crore": 640.01
        },
        {
          "key": "personnel",
          "label": "Personnel",
          "group": "fixed",
          "crore": 1245.96
        },
        {
          "key": "officeAdmin",
          "label": "Office & administrative",
          "group": "fixed",
          "crore": 127.73
        },
        {
          "key": "wheelingCharge",
          "label": "Wheeling charge to PGCB",
          "group": "network",
          "crore": 324.8
        }
      ],
      "totalOperatingExpensesCrore": 95386.28,
      "subsidyCrore": 39534.95,
      "energySalesCrore": 50858.25,
      "source": {
        "file": "BPDB Annual Report 2022-2023(revised).pdf",
        "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/651fabb73895432c99a7f6760e1b381d.pdf",
        "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
        "printedUnit": "Crore BDT"
      },
      "generationMkwh": {
        "PublicSector": 34698.0,
        "JointVenture": 7647.0,
        "PrivateSector": 34253.0,
        "PowerImport": 10425.0,
        "SingleBuyerTotal": 87024.0
      },
      "bulkSalesMkwh": 84450.0,
      "published": {
        "generationCostPerUnit": {
          "value": 11.03,
          "source": "BPDB Annual Report 2022-2023(revised).pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/651fabb73895432c99a7f6760e1b381d.pdf"
        },
        "fuelCostPerUnitThermal": {
          "value": 4.63,
          "source": "BPDB Annual Report 2022-2023(revised).pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/651fabb73895432c99a7f6760e1b381d.pdf"
        },
        "bulkSupplyCostPerUnit": {
          "value": 11.52,
          "source": "BPDB Annual Report 2022-2023(revised).pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/651fabb73895432c99a7f6760e1b381d.pdf"
        },
        "bulkTariffPerUnit": {
          "value": 5.94,
          "source": "BPDB Annual Report 2022-2023(revised).pdf",
          "url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bpdb/2024/12/651fabb73895432c99a7f6760e1b381d.pdf"
        }
      },
      "derived": {
        "importUnitCost": {
          "value": 8.85,
          "numeratorCrore": 9223.41,
          "denominatorMkwh": 10425.0
        },
        "privateUnitCost": {
          "value": 18.32,
          "numeratorCrore": 62766.59,
          "denominatorMkwh": 34253.0
        },
        "systemAllInUnitCost": {
          "value": 11.3,
          "numeratorCrore": 95386.28,
          "denominatorMkwh": 84450.0
        }
      }
    }
  ];

export const BPDB_ACCOUNTS_LATEST_FY =
  BPDB_ANNUAL_ACCOUNTS[BPDB_ANNUAL_ACCOUNTS.length - 1].fy;
