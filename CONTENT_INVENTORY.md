# Grid Explorer — Content Inventory

Generated 2026-10-04 by the grid-explorer-audit skill. Read-only extraction.

**Method and its limits.** Strings were extracted by pattern from the 58 Grid Explorer
component files by matching JSX headings, chart card titles and subtitles, table captions
and headers, `aria-label`s, button text and uppercase label spans. **This is not complete.**
It does not capture: text built by string interpolation or a ternary, text inside `{' '}`-joined
fragments, prose paragraphs (`<p>` bodies are frequently multi-line and templated), strings held
in `lib/data/**` constants that render as copy, Recharts `name=` series labels, or any Bangla
(`locale=bn`) variant. Treat it as the spine of the inventory, not the whole of it — a redesign
must still diff the rendered page, not only this file.

| id | type | current text | file:line |
|---|---|---|---|
| GE-0001 | aria-label | Archive freshness | `components/news/PowerGridExplorer.tsx:1175` |
| GE-0002 | aria-label | Restore methodology banner | `components/news/PowerGridExplorer.tsx:1378` |
| GE-0003 | aria-label | Close date picker | `components/news/PowerGridExplorer.tsx:1419` |
| GE-0004 | aria-label | Grid reports views | `components/news/PowerGridExplorer.tsx:1548` |
| GE-0005 | aria-label | Daily Fuel and Import Cost, chart | `components/news/power-grid/DailyCostCard.tsx:96` |
| GE-0006 | aria-label | PGCB forecast generation against measured generation | `components/news/power-grid/ForecastCurveCanvas.tsx:292` |
| GE-0007 | aria-label | PGCB's forecast load curve drawn against the measured curve, megawatts by hour | `components/news/power-grid/ForecastCurveCanvas.tsx:298` |
| GE-0008 | aria-label | Which day's forecast comparison to show | `components/news/power-grid/ForecastSection.tsx:85` |
| GE-0009 | aria-label | Archive views | `components/news/power-grid/GasReserveArchiveViewTabs.tsx:22` |
| GE-0010 | aria-label | Daily gas and condensate production by company | `components/news/power-grid/GasTab.tsx:257` |
| GE-0011 | aria-label | Daily gas distribution by distributor | `components/news/power-grid/GasTab.tsx:524` |
| GE-0012 | aria-label | Chart scale | `components/news/power-grid/GenerationMixCanvas.tsx:313` |
| GE-0013 | aria-label | Generation mix. Use left and right arrow keys to step through the half hours. | `components/news/power-grid/GenerationMixCanvas.tsx:334` |
| GE-0014 | aria-label | Daily Generation Mix Snapshot, chart | `components/news/power-grid/GenerationMixCard.tsx:94` |
| GE-0015 | aria-label | Brent Crude vs. Retail Diesel, chart | `components/news/power-grid/GlobalVsDomesticCards.tsx:167` |
| GE-0016 | aria-label | Global LNG Benchmark vs. Gas Tariff, chart | `components/news/power-grid/GlobalVsDomesticCards.tsx:360` |
| GE-0017 | aria-label | Historical archive preview | `components/news/power-grid/GridArchiveTeaser.tsx:32` |
| GE-0018 | aria-label | Close locked panel | `components/news/power-grid/GridDataLockedGate.tsx:44` |
| GE-0019 | aria-label | Table pages | `components/news/power-grid/GridExplorerUI.tsx:254` |
| GE-0020 | aria-label | First page | `components/news/power-grid/GridExplorerUI.tsx:256` |
| GE-0021 | aria-label | Previous page | `components/news/power-grid/GridExplorerUI.tsx:258` |
| GE-0022 | aria-label | Next page | `components/news/power-grid/GridExplorerUI.tsx:275` |
| GE-0023 | aria-label | Last page | `components/news/power-grid/GridExplorerUI.tsx:277` |
| GE-0024 | aria-label | Interconnector transfer. Use left and right arrow keys to step through the hours. | `components/news/power-grid/InterconnectorCanvas.tsx:285` |
| GE-0025 | aria-label | Load curve. Use left and right arrow keys to step through the hours. | `components/news/power-grid/LoadCurveCanvas.tsx:467` |
| GE-0026 | aria-label | Cumulative Grid Build-out, chart | `components/news/power-grid/LongitudinalStudyCards.tsx:156` |
| GE-0027 | aria-label | Transmission Expansion Pace, chart | `components/news/power-grid/LongitudinalStudyCards.tsx:228` |
| GE-0028 | aria-label | Long-term Trajectories (Indexed), chart | `components/news/power-grid/LongitudinalStudyCards.tsx:300` |
| GE-0029 | aria-label | Network Evolution by Voltage Level, chart | `components/news/power-grid/LongitudinalStudyCards.tsx:82` |
| GE-0030 | aria-label | Global Fuel Commodity Import Costs, chart | `components/news/power-grid/MacroPricingDriverCards.tsx:141` |
| GE-0031 | aria-label | Macro Pressure Variables (2021 - 2026), chart | `components/news/power-grid/MacroPricingDriverCards.tsx:51` |
| GE-0032 | aria-label | Energy Fuel Mix, chart | `components/news/power-grid/MacroTrendsTab.tsx:1343` |
| GE-0033 | aria-label | Regional Maximum Peak Supply, chart | `components/news/power-grid/MacroTrendsTab.tsx:1486` |
| GE-0034 | aria-label | PGCB monthly peak demand and generation, chart | `components/news/power-grid/MacroTrendsTab.tsx:1666` |
| GE-0035 | aria-label | PGCB monthly energy generation, chart | `components/news/power-grid/MacroTrendsTab.tsx:1779` |
| GE-0036 | aria-label | PGCB monthly generation by fuel, chart | `components/news/power-grid/MacroTrendsTab.tsx:1859` |
| GE-0037 | aria-label | BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart | `components/news/power-grid/MacroTrendsTab.tsx:2175` |
| GE-0038 | aria-label | Petrobangla Annual Revenue and LNG Import Costs, chart | `components/news/power-grid/MacroTrendsTab.tsx:2307` |
| GE-0039 | aria-label | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart | `components/news/power-grid/MacroTrendsTab.tsx:2479` |
| GE-0040 | aria-label | Historical System Loss Trends (TandD), chart | `components/news/power-grid/MacroTrendsTab.tsx:2671` |
| GE-0041 | aria-label | National Budget vs Capacity and Peak Generation, chart | `components/news/power-grid/MacroTrendsTab.tsx:542` |
| GE-0042 | aria-label | Historical Pricing and Tariff Comparison, chart | `components/news/power-grid/MacroTrendsTab.tsx:755` |
| GE-0043 | aria-label | Wholesale Tariff vs. Unit Production Cost, chart | `components/news/power-grid/MacroTrendsTab.tsx:862` |
| GE-0044 | aria-label | Gas Supply Transition: Domestic vs. Imported LNG, chart | `components/news/power-grid/MacroTrendsTab.tsx:967` |
| GE-0045 | aria-label | Sort stations | `components/news/power-grid/PowerStationsTab.tsx:119` |
| GE-0046 | aria-label | Renewable energy by source, monthly, chart | `components/news/power-grid/RenewablesTab.tsx:873` |
| GE-0047 | aria-label | Renewable share of generation, monthly, chart | `components/news/power-grid/RenewablesTab.tsx:918` |
| GE-0048 | aria-label | Renewable Generation Timeline, chart | `components/news/power-grid/RenewablesTab.tsx:965` |
| GE-0049 | aria-label | Gas reserve depletion and field production profile | `components/news/power-grid/ReserveTrajectoryCanvas.tsx:350` |
| GE-0050 | aria-label | Reserve depletion. Use left and right arrow keys to move through the years. | `components/news/power-grid/ReserveTrajectoryCanvas.tsx:356` |
| GE-0051 | aria-label | National grid substation registry | `components/news/power-grid/TechnicalInfoTab.tsx:1232` |
| GE-0052 | aria-label | Metric | `components/news/power-grid/TimeMachineTab.tsx:184` |
| GE-0053 | aria-label | Resolution | `components/news/power-grid/TimeMachineTab.tsx:192` |
| GE-0054 | aria-label | Filter projects | `components/news/power-grid/renewables/ProjectRegisterCard.tsx:168` |
| GE-0055 | chart-sub | System performance data logged on {systemStats.date} • | `components/news/PowerGridExplorer.tsx:2024` |
| GE-0056 | chart-sub | PGCB&rsquo;s summary block as printed: generation extremes, temperature, unserved energy and gas supplied to power • | `components/news/PowerGridExplorer.tsx:2393` |
| GE-0057 | chart-sub | Import allocations and power trade as filed for the day (Report: {systemStats.date}) • | `components/news/PowerGridExplorer.tsx:2547` |
| GE-0058 | chart-sub | Outage events as printed in the day&rsquo;s report ({systemStats.date}) • | `components/news/PowerGridExplorer.tsx:2889` |
| GE-0059 | chart-sub | Cost in Crore BDT by fuel type ({hasPublishedFuelCost ? | `components/news/power-grid/DailyCostCard.tsx:85` |
| GE-0060 | chart-sub | Energy share by fuel type (Total: {totalGenMkwhr.toFixed(1)} MKWh | `components/news/power-grid/GenerationMixCard.tsx:56` |
| GE-0061 | chart-sub | Brent Crude (USD/Bbl) vs. Domestic Retail Diesel (Tk/L) — | `components/news/power-grid/GlobalVsDomesticCards.tsx:148` |
| GE-0062 | chart-sub | Global Gas/LNG (USD/MMBtu) vs. BD Avg Tariff (Tk/CM) — | `components/news/power-grid/GlobalVsDomesticCards.tsx:341` |
| GE-0063 | chart-sub | Stacked area showing historical carrying capacity composition • | `components/news/power-grid/LongitudinalStudyCards.tsx:143` |
| GE-0064 | chart-sub | New circuit km added to the national grid per year • | `components/news/power-grid/LongitudinalStudyCards.tsx:216` |
| GE-0065 | chart-sub | Base Year FY2011 = 100 for true comparative percentage growth • | `components/news/power-grid/LongitudinalStudyCards.tsx:286` |
| GE-0066 | chart-sub | Growth trajectories of ultra-high vs high voltage transmission corridors • | `components/news/power-grid/LongitudinalStudyCards.tsx:69` |
| GE-0067 | chart-sub | Spot LNG (USD/MMBtu) vs. Import Coal (USD/Metric Ton) — | `components/news/power-grid/MacroPricingDriverCards.tsx:132` |
| GE-0068 | chart-sub | Devaluation of BDT/USD vs. National Inflation Rate (CPI %) — | `components/news/power-grid/MacroPricingDriverCards.tsx:42` |
| GE-0069 | chart-sub | Grid operational metrics charted monthly from 2013 to 2026 — the plotted values are PGCB's own | `components/news/power-grid/MacroTrendsTab.tsx:1592` |
| GE-0070 | chart-sub | Historical correlation between BDT devaluation and retail petroleum price hikes — | `components/news/power-grid/MacroTrendsTab.tsx:2064` |
| GE-0071 | chart-sub | The gap between what BPDB sells power for and what it costs to supply, against the treasury transfer that covers it — | `components/news/power-grid/MacroTrendsTab.tsx:2168` |
| GE-0072 | chart-sub | Gas sales against the LNG import bill (Crore BDT) — | `components/news/power-grid/MacroTrendsTab.tsx:2300` |
| GE-0073 | chart-sub | Global Average Solar LCOE vs. Domestic Solar Contracts (Tk/kWh) — | `components/news/power-grid/MacroTrendsTab.tsx:2470` |
| GE-0074 | chart-sub | Official key indicators of grid capacity, consumer base, transmission, and performance | `components/news/power-grid/MacroTrendsTab.tsx:2578` |
| GE-0075 | chart-sub | Long-term reduction curves in transmission, distribution, and overall system loss — | `components/news/power-grid/MacroTrendsTab.tsx:2663` |
| GE-0076 | chart-sub | Audit-verified utility-wise and overall grid system loss records — | `components/news/power-grid/MacroTrendsTab.tsx:2805` |
| GE-0077 | chart-sub | Power sector fiscal allocation (Crore BDT) plotted against installed capacity and peak generation (MW) — | `components/news/power-grid/MacroTrendsTab.tsx:529` |
| GE-0078 | chart-sub | BPDB's audited cost of supply per unit against its average bulk tariff — | `components/news/power-grid/MacroTrendsTab.tsx:671` |
| GE-0079 | chart-sub | BPDB's audited supply cost against its bulk tariff (Tk/kWh) — | `components/news/power-grid/MacroTrendsTab.tsx:853` |
| GE-0080 | chart-sub | Yearly mean of Petrobangla&rsquo;s daily reports (MMCFD) — | `components/news/power-grid/MacroTrendsTab.tsx:953` |
| GE-0081 | chart-sub | Active substations and transformer ratings as of June 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:1062` |
| GE-0082 | chart-sub | What PGCB started with, handed over from BPDB and DESA | `components/news/power-grid/TechnicalInfoTab.tsx:508` |
| GE-0083 | chart-sub | What PGCB owns and runs, as at June 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:556` |
| GE-0084 | chart-sub | How much high-voltage wire exists, by voltage class | `components/news/power-grid/TechnicalInfoTab.tsx:750` |
| GE-0085 | chart-sub | Major projects and capacities commissioned recently | `components/news/power-grid/TechnicalInfoTab.tsx:811` |
| GE-0086 | chart-sub | Comprehensive capacity aggregates across all operation nodes | `components/news/power-grid/TechnicalInfoTab.tsx:870` |
| GE-0087 | chart-title | 24-Hour Generation, Demand & Load-Shed | `components/news/PowerGridExplorer.tsx:1680` |
| GE-0088 | chart-title | Generation & Production Cost Breakdown | `components/news/PowerGridExplorer.tsx:2023` |
| GE-0089 | chart-title | Power Supply Scenario | `components/news/PowerGridExplorer.tsx:2392` |
| GE-0090 | chart-title | Cross-Border Power Imports Tracker | `components/news/PowerGridExplorer.tsx:2546` |
| GE-0091 | chart-title | Zone-wise Demand & Load-Shedding | `components/news/PowerGridExplorer.tsx:2753` |
| GE-0092 | chart-title | NLDC Outage Log | `components/news/PowerGridExplorer.tsx:2888` |
| GE-0093 | chart-title | Zone-wise Generation by Fuel | `components/news/PowerGridExplorer.tsx:2958` |
| GE-0094 | chart-title | East-West Interconnector Transfer | `components/news/PowerGridExplorer.tsx:3077` |
| GE-0095 | chart-title | Daily Fuel & Import Cost | `components/news/power-grid/DailyCostCard.tsx:81` |
| GE-0096 | chart-title | Generation Mix Through the Day | `components/news/power-grid/EnergyCurveChart.tsx:104` |
| GE-0097 | chart-title | Reserve depletion trajectory | `components/news/power-grid/GasReserveDepletionTab.tsx:185` |
| GE-0098 | chart-title | Daily Generation Mix Snapshot | `components/news/power-grid/GenerationMixCard.tsx:52` |
| GE-0099 | chart-title | Brent Crude vs. Retail Diesel | `components/news/power-grid/GlobalVsDomesticCards.tsx:147` |
| GE-0100 | chart-title | Global LNG Benchmark vs. Gas Tariff | `components/news/power-grid/GlobalVsDomesticCards.tsx:340` |
| GE-0101 | chart-title | Cumulative Grid Build-out | `components/news/power-grid/LongitudinalStudyCards.tsx:142` |
| GE-0102 | chart-title | Transmission Expansion Pace | `components/news/power-grid/LongitudinalStudyCards.tsx:215` |
| GE-0103 | chart-title | Long-term Trajectories (Indexed) | `components/news/power-grid/LongitudinalStudyCards.tsx:285` |
| GE-0104 | chart-title | Network Evolution by Voltage Level | `components/news/power-grid/LongitudinalStudyCards.tsx:68` |
| GE-0105 | chart-title | Global Fuel Commodity Import Costs | `components/news/power-grid/MacroPricingDriverCards.tsx:131` |
| GE-0106 | chart-title | Macro Pressure Variables (2021 - 2026) | `components/news/power-grid/MacroPricingDriverCards.tsx:41` |
| GE-0107 | chart-title | Energy Fuel Mix | `components/news/power-grid/MacroTrendsTab.tsx:1332` |
| GE-0108 | chart-title | Regional Maximum Peak Supply | `components/news/power-grid/MacroTrendsTab.tsx:1475` |
| GE-0109 | chart-title | PGCB 13-Year Historical Growth Trends | `components/news/power-grid/MacroTrendsTab.tsx:1591` |
| GE-0110 | chart-title | Retail Fuel & Macro Pricing Benchmarks | `components/news/power-grid/MacroTrendsTab.tsx:2063` |
| GE-0111 | chart-title | BPDB Annual Cost, Revenue & Subsidy Profile (Crore BDT) | `components/news/power-grid/MacroTrendsTab.tsx:2167` |
| GE-0112 | chart-title | Petrobangla Annual Revenue & LNG Import Costs | `components/news/power-grid/MacroTrendsTab.tsx:2299` |
| GE-0113 | chart-title | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff | `components/news/power-grid/MacroTrendsTab.tsx:2469` |
| GE-0114 | chart-title | Power Sector at a Glance | `components/news/power-grid/MacroTrendsTab.tsx:2577` |
| GE-0115 | chart-title | Historical System Loss Trends (T&D) | `components/news/power-grid/MacroTrendsTab.tsx:2662` |
| GE-0116 | chart-title | Year-wise System Loss Statistics | `components/news/power-grid/MacroTrendsTab.tsx:2804` |
| GE-0117 | chart-title | National Budget vs Capacity & Peak Generation | `components/news/power-grid/MacroTrendsTab.tsx:528` |
| GE-0118 | chart-title | Historical Pricing & Tariff Comparison | `components/news/power-grid/MacroTrendsTab.tsx:670` |
| GE-0119 | chart-title | Wholesale Tariff vs. Unit Production Cost | `components/news/power-grid/MacroTrendsTab.tsx:852` |
| GE-0120 | chart-title | Gas Supply Transition: Domestic vs. Imported LNG | `components/news/power-grid/MacroTrendsTab.tsx:952` |
| GE-0121 | chart-title | Field evidence | `components/news/power-grid/PetrobanglaMacroGasSection.tsx:72` |
| GE-0122 | chart-title | National Installed Capacity Mix | `components/news/power-grid/RenewablesTab.tsx:1374` |
| GE-0123 | chart-title | Capacity Added by Year | `components/news/power-grid/RenewablesTab.tsx:1449` |
| GE-0124 | chart-title | Energy & Carbon — Projection | `components/news/power-grid/RenewablesTab.tsx:1711` |
| GE-0125 | chart-title | Units on this page | `components/news/power-grid/RenewablesTab.tsx:1885` |
| GE-0126 | chart-title | Renewable Output by Fuel | `components/news/power-grid/RenewablesTab.tsx:682` |
| GE-0127 | chart-title | Latest Published Month | `components/news/power-grid/RenewablesTab.tsx:766` |
| GE-0128 | chart-title | Renewable Generation Timeline | `components/news/power-grid/RenewablesTab.tsx:833` |
| GE-0129 | chart-title | Substation Assets & Capacity | `components/news/power-grid/TechnicalInfoTab.tsx:1061` |
| GE-0130 | chart-title | Where PGCB Started | `components/news/power-grid/TechnicalInfoTab.tsx:507` |
| GE-0131 | chart-title | The Grid Today | `components/news/power-grid/TechnicalInfoTab.tsx:555` |
| GE-0132 | chart-title | Transmission Line as on: June, 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:749` |
| GE-0133 | chart-title | Last Five years achievement | `components/news/power-grid/TechnicalInfoTab.tsx:810` |
| GE-0134 | chart-title | Substation as on: June, 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:869` |
| GE-0135 | heading | PGCB Grid Overview Data | `components/news/PowerGridExplorer.tsx:1655` |
| GE-0136 | heading | 24-Hour Generation, Demand & Load-Shed | `components/news/PowerGridExplorer.tsx:1680` |
| GE-0137 | heading | PGCB Fuel Mix & Generation Cost Data | `components/news/PowerGridExplorer.tsx:1987` |
| GE-0138 | heading | Generation & Production Cost Breakdown | `components/news/PowerGridExplorer.tsx:2023` |
| GE-0139 | heading | Power Supply Scenario | `components/news/PowerGridExplorer.tsx:2392` |
| GE-0140 | heading | Cross-Border Power Imports Data | `components/news/PowerGridExplorer.tsx:2522` |
| GE-0141 | heading | Cross-Border Power Imports Tracker | `components/news/PowerGridExplorer.tsx:2546` |
| GE-0142 | heading | Zone-wise Demand & Load-Shedding Data | `components/news/PowerGridExplorer.tsx:2724` |
| GE-0143 | heading | Zone-wise Demand & Load-Shedding | `components/news/PowerGridExplorer.tsx:2753` |
| GE-0144 | heading | NLDC Outage Log | `components/news/PowerGridExplorer.tsx:2888` |
| GE-0145 | heading | Zone-wise Generation by Fuel | `components/news/PowerGridExplorer.tsx:2958` |
| GE-0146 | heading | East-West Interconnector Transfer | `components/news/PowerGridExplorer.tsx:3077` |
| GE-0147 | heading | Daily Production by Operator | `components/news/PowerGridExplorer.tsx:3302` |
| GE-0148 | heading | Power, Fertilizer and Others Distribution | `components/news/PowerGridExplorer.tsx:3327` |
| GE-0149 | heading | NLDC Outage Log (Yesterday) | `components/news/PowerGridExplorer.tsx:3391` |
| GE-0150 | heading | Daily Fuel & Import Cost | `components/news/power-grid/DailyCostCard.tsx:81` |
| GE-0151 | heading | Generation Mix Through the Day | `components/news/power-grid/EnergyCurveChart.tsx:104` |
| GE-0152 | heading | Sources | `components/news/power-grid/GasReserveDepletionTab.tsx:1044` |
| GE-0153 | heading | What is replacing it | `components/news/power-grid/GasReserveDepletionTab.tsx:1093` |
| GE-0154 | heading | What this panel does not answer | `components/news/power-grid/GasReserveDepletionTab.tsx:1189` |
| GE-0155 | heading | Gas Reserve Depletion | `components/news/power-grid/GasReserveDepletionTab.tsx:157` |
| GE-0156 | heading | Reserve depletion trajectory | `components/news/power-grid/GasReserveDepletionTab.tsx:185` |
| GE-0157 | heading | The back-test | `components/news/power-grid/GasReserveDepletionTab.tsx:890` |
| GE-0158 | heading | Against everyone else who has published a number | `components/news/power-grid/GasReserveDepletionTab.tsx:943` |
| GE-0159 | heading | Petrobangla Gas Production & Distribution Data | `components/news/power-grid/GasTab.tsx:183` |
| GE-0160 | heading | Petrobangla Gas & LNG Supply | `components/news/power-grid/GasTab.tsx:200` |
| GE-0161 | heading | Daily Generation Mix Snapshot | `components/news/power-grid/GenerationMixCard.tsx:52` |
| GE-0162 | heading | Brent Crude vs. Retail Diesel | `components/news/power-grid/GlobalVsDomesticCards.tsx:147` |
| GE-0163 | heading | Global LNG Benchmark vs. Gas Tariff | `components/news/power-grid/GlobalVsDomesticCards.tsx:340` |
| GE-0164 | heading | Cumulative Grid Build-out | `components/news/power-grid/LongitudinalStudyCards.tsx:142` |
| GE-0165 | heading | Transmission Expansion Pace | `components/news/power-grid/LongitudinalStudyCards.tsx:215` |
| GE-0166 | heading | Long-term Trajectories (Indexed) | `components/news/power-grid/LongitudinalStudyCards.tsx:285` |
| GE-0167 | heading | Network Evolution by Voltage Level | `components/news/power-grid/LongitudinalStudyCards.tsx:68` |
| GE-0168 | heading | Global Fuel Commodity Import Costs | `components/news/power-grid/MacroPricingDriverCards.tsx:131` |
| GE-0169 | heading | Macro Pressure Variables (2021 - 2026) | `components/news/power-grid/MacroPricingDriverCards.tsx:41` |
| GE-0170 | heading | Select Operating Period | `components/news/power-grid/MacroTrendsTab.tsx:1189` |
| GE-0171 | heading | Energy Fuel Mix | `components/news/power-grid/MacroTrendsTab.tsx:1332` |
| GE-0172 | heading | Regional Maximum Peak Supply | `components/news/power-grid/MacroTrendsTab.tsx:1475` |
| GE-0173 | heading | PGCB 13-Year Historical Growth Trends | `components/news/power-grid/MacroTrendsTab.tsx:1591` |
| GE-0174 | heading | Retail Fuel & Macro Pricing Benchmarks | `components/news/power-grid/MacroTrendsTab.tsx:2063` |
| GE-0175 | heading | BPDB Annual Cost, Revenue & Subsidy Profile (Crore BDT) | `components/news/power-grid/MacroTrendsTab.tsx:2167` |
| GE-0176 | heading | Petrobangla Annual Revenue & LNG Import Costs | `components/news/power-grid/MacroTrendsTab.tsx:2299` |
| GE-0177 | heading | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff | `components/news/power-grid/MacroTrendsTab.tsx:2469` |
| GE-0178 | heading | Power Sector at a Glance | `components/news/power-grid/MacroTrendsTab.tsx:2577` |
| GE-0179 | heading | Historical System Loss Trends (T&D) | `components/news/power-grid/MacroTrendsTab.tsx:2662` |
| GE-0180 | heading | Year-wise System Loss Statistics | `components/news/power-grid/MacroTrendsTab.tsx:2804` |
| GE-0181 | heading | Listed IPPs Receivables & Working Capital Risk | `components/news/power-grid/MacroTrendsTab.tsx:2888` |
| GE-0182 | heading | Forex Exposure & Currency Devaluation Burden | `components/news/power-grid/MacroTrendsTab.tsx:2920` |
| GE-0183 | heading | Industrial Gas Shortage & Corporate Earnings Clues | `components/news/power-grid/MacroTrendsTab.tsx:2952` |
| GE-0184 | heading | Grid Capacity Margin & Overcapacity Charges | `components/news/power-grid/MacroTrendsTab.tsx:2984` |
| GE-0185 | heading | Historical Preview Mode | `components/news/power-grid/MacroTrendsTab.tsx:434` |
| GE-0186 | heading | National Budget vs Capacity & Peak Generation | `components/news/power-grid/MacroTrendsTab.tsx:528` |
| GE-0187 | heading | Historical Pricing & Tariff Comparison | `components/news/power-grid/MacroTrendsTab.tsx:670` |
| GE-0188 | heading | Wholesale Tariff vs. Unit Production Cost | `components/news/power-grid/MacroTrendsTab.tsx:852` |
| GE-0189 | heading | Gas Supply Transition: Domestic vs. Imported LNG | `components/news/power-grid/MacroTrendsTab.tsx:952` |
| GE-0190 | heading | Field evidence | `components/news/power-grid/PetrobanglaMacroGasSection.tsx:72` |
| GE-0191 | heading | Source data note for {monthLabel} | `components/news/power-grid/PgcbMonthlyDetail.tsx:1266` |
| GE-0192 | heading | National Installed Capacity Mix | `components/news/power-grid/RenewablesTab.tsx:1374` |
| GE-0193 | heading | Capacity Added by Year | `components/news/power-grid/RenewablesTab.tsx:1449` |
| GE-0194 | heading | Energy & Carbon — Projection | `components/news/power-grid/RenewablesTab.tsx:1711` |
| GE-0195 | heading | Units on this page | `components/news/power-grid/RenewablesTab.tsx:1885` |
| GE-0196 | heading | Renewable Output by Fuel | `components/news/power-grid/RenewablesTab.tsx:682` |
| GE-0197 | heading | Latest Published Month | `components/news/power-grid/RenewablesTab.tsx:766` |
| GE-0198 | heading | Renewable Generation Timeline | `components/news/power-grid/RenewablesTab.tsx:833` |
| GE-0199 | heading | Substation Database Summary | `components/news/power-grid/TechnicalInfoTab.tsx:1004` |
| GE-0200 | heading | Substation Assets & Capacity | `components/news/power-grid/TechnicalInfoTab.tsx:1061` |
| GE-0201 | heading | Objectives | `components/news/power-grid/TechnicalInfoTab.tsx:1491` |
| GE-0202 | heading | Scope of Work | `components/news/power-grid/TechnicalInfoTab.tsx:1499` |
| GE-0203 | heading | National Grid Network Diagram | `components/news/power-grid/TechnicalInfoTab.tsx:1955` |
| GE-0204 | heading | PGCB Transmission Grid Data | `components/news/power-grid/TechnicalInfoTab.tsx:202` |
| GE-0205 | heading | Geographical Grid Map | `components/news/power-grid/TechnicalInfoTab.tsx:2025` |
| GE-0206 | heading | OPGW Fiber Network Map | `components/news/power-grid/TechnicalInfoTab.tsx:2095` |
| GE-0207 | heading | Optical Fiber Leasing | `components/news/power-grid/TechnicalInfoTab.tsx:2165` |
| GE-0208 | heading | Licensing & Leasing Agreements | `components/news/power-grid/TechnicalInfoTab.tsx:2187` |
| GE-0209 | heading | Transmission Network & Backbone Capacity | `components/news/power-grid/TechnicalInfoTab.tsx:2225` |
| GE-0210 | heading | Dark Fiber Lease Rate | `components/news/power-grid/TechnicalInfoTab.tsx:2250` |
| GE-0211 | heading | OFCL Contact Details | `components/news/power-grid/TechnicalInfoTab.tsx:2271` |
| GE-0212 | heading | Power Transmission | `components/news/power-grid/TechnicalInfoTab.tsx:413` |
| GE-0213 | heading | How power reaches you | `components/news/power-grid/TechnicalInfoTab.tsx:440` |
| GE-0214 | heading | Power Generation Plants | `components/news/power-grid/TechnicalInfoTab.tsx:449` |
| GE-0215 | heading | High-Voltage Wheeling Grid | `components/news/power-grid/TechnicalInfoTab.tsx:466` |
| GE-0216 | heading | Distribution Entities (Clients) | `components/news/power-grid/TechnicalInfoTab.tsx:483` |
| GE-0217 | heading | Where PGCB Started | `components/news/power-grid/TechnicalInfoTab.tsx:507` |
| GE-0218 | heading | The Grid Today | `components/news/power-grid/TechnicalInfoTab.tsx:555` |
| GE-0219 | heading | Then vs Now | `components/news/power-grid/TechnicalInfoTab.tsx:629` |
| GE-0220 | heading | Transmission Line as on: June, 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:749` |
| GE-0221 | heading | Last Five years achievement | `components/news/power-grid/TechnicalInfoTab.tsx:810` |
| GE-0222 | heading | Substation as on: June, 2026 | `components/news/power-grid/TechnicalInfoTab.tsx:869` |
| GE-0223 | heading | National Grid Substation Database | `components/news/power-grid/TechnicalInfoTab.tsx:988` |
| GE-0224 | heading | Time Machine | `components/news/power-grid/TimeMachineTab.tsx:175` |
| GE-0225 | label-span | Evening Peak Demand | `components/news/PowerGridExplorer.tsx:3242` |
| GE-0226 | label-span | Evening Peak Gen | `components/news/PowerGridExplorer.tsx:3246` |
| GE-0227 | label-span | Daily Generation | `components/news/PowerGridExplorer.tsx:3250` |
| GE-0228 | label-span | Avg. Generation Cost | `components/news/PowerGridExplorer.tsx:3254` |
| GE-0229 | label-span | Published Cost | `components/news/power-grid/DailyCostCard.tsx:122` |
| GE-0230 | label-span | Archive peak | `components/news/power-grid/GasReserveArchiveContext.tsx:44` |
| GE-0231 | label-span | Archive low | `components/news/power-grid/GasReserveArchiveContext.tsx:54` |
| GE-0232 | label-span | Since Jan 2020 | `components/news/power-grid/GasReserveArchiveContext.tsx:63` |
| GE-0233 | label-span | National share | `components/news/power-grid/GasTab.tsx:344` |
| GE-0234 | label-span | Total distributed | `components/news/power-grid/GasTab.tsx:597` |
| GE-0235 | label-span | Operational Mix | `components/news/power-grid/GenerationMixCard.tsx:131` |
| GE-0236 | label-span | Gas | `components/news/power-grid/GlobalVsDomesticCards.tsx:263` |
| GE-0237 | label-span | Oil | `components/news/power-grid/GlobalVsDomesticCards.tsx:75` |
| GE-0238 | label-span | Daily | `components/news/power-grid/GridReportingStandards.tsx:66` |
| GE-0239 | label-span | Register | `components/news/power-grid/GridReportingStandards.tsx:70` |
| GE-0240 | label-span | 19:30 sample | `components/news/power-grid/LoadCurveCanvas.tsx:856` |
| GE-0241 | label-span | Latest national gas | `components/news/power-grid/MacroGasSectionChrome.tsx:106` |
| GE-0242 | label-span | Bibiyana | `components/news/power-grid/MacroGasSectionChrome.tsx:140` |
| GE-0243 | label-span | Commodities | `components/news/power-grid/MacroPricingDriverCards.tsx:154` |
| GE-0244 | label-span | Economy | `components/news/power-grid/MacroPricingDriverCards.tsx:64` |
| GE-0245 | label-span | Grid Peak | `components/news/power-grid/MacroTrendsTab.tsx:1708` |
| GE-0246 | label-span | Energy Net | `components/news/power-grid/MacroTrendsTab.tsx:1824` |
| GE-0247 | label-span | Audited Financial History | `components/news/power-grid/MacroTrendsTab.tsx:2157` |
| GE-0248 | label-span | Audited Ledger | `components/news/power-grid/MacroTrendsTab.tsx:2187` |
| GE-0249 | label-span | Solar | `components/news/power-grid/MacroTrendsTab.tsx:2495` |
| GE-0250 | label-span | Target Deadline: | `components/news/power-grid/MacroTrendsTab.tsx:2642` |
| GE-0251 | label-span | Power Cell | `components/news/power-grid/MacroTrendsTab.tsx:2699` |
| GE-0252 | label-span | Deficit Gap | `components/news/power-grid/MacroTrendsTab.tsx:783` |
| GE-0253 | label-span | LNG Reliance | `components/news/power-grid/MacroTrendsTab.tsx:988` |
| GE-0254 | label-span | View as | `components/news/power-grid/PetrobanglaMacroGasSection.tsx:89` |
| GE-0255 | label-span | Grid Circle Groups | `components/news/power-grid/TechnicalInfoTab.tsx:1026` |
| GE-0256 | label-span | Density | `components/news/power-grid/TechnicalInfoTab.tsx:1205` |
| GE-0257 | label-span | Total Project Cost | `components/news/power-grid/TechnicalInfoTab.tsx:1511` |
| GE-0258 | label-span | GOB Contribution | `components/news/power-grid/TechnicalInfoTab.tsx:1515` |
| GE-0259 | label-span | Project Aid (PA) | `components/news/power-grid/TechnicalInfoTab.tsx:1519` |
| GE-0260 | label-span | PGCB Funding | `components/news/power-grid/TechnicalInfoTab.tsx:1523` |
| GE-0261 | label-span | Development Partner | `components/news/power-grid/TechnicalInfoTab.tsx:1620` |
| GE-0262 | label-span | Effective: 01.01.2026 | `components/news/power-grid/TechnicalInfoTab.tsx:2253` |
| GE-0263 | label-span | Step 1: Generation | `components/news/power-grid/TechnicalInfoTab.tsx:446` |
| GE-0264 | label-span | Step 2: Transmission | `components/news/power-grid/TechnicalInfoTab.tsx:463` |
| GE-0265 | label-span | Step 3: Distribution | `components/news/power-grid/TechnicalInfoTab.tsx:480` |
| GE-0266 | table-caption | Daily Fuel and Import Cost, chart | `components/news/power-grid/DailyCostCard.tsx:178` |
| GE-0267 | table-caption | Daily Generation Mix Snapshot, chart | `components/news/power-grid/GenerationMixCard.tsx:184` |
| GE-0268 | table-caption | Brent Crude vs. Retail Diesel, chart | `components/news/power-grid/GlobalVsDomesticCards.tsx:210` |
| GE-0269 | table-caption | Brent crude against Bangladesh retail diesel, by year | `components/news/power-grid/GlobalVsDomesticCards.tsx:223` |
| GE-0270 | table-caption | Global LNG Benchmark vs. Gas Tariff, chart | `components/news/power-grid/GlobalVsDomesticCards.tsx:403` |
| GE-0271 | table-caption | Global LNG benchmark against Bangladesh average gas tariff, by year | `components/news/power-grid/GlobalVsDomesticCards.tsx:414` |
| GE-0272 | table-caption | Transmission expansion pace: year-on-year additions, differenced here from PGCB and BPDB published totals. PGCB publishes the totals, not the additions. | `components/news/power-grid/LongitudinalStudyCards.tsx:241` |
| GE-0273 | table-caption | Long-term trajectories indexed to FY2011 = 100, calculated here from published figures. Index = (current value / FY2011 value) x 100. | `components/news/power-grid/LongitudinalStudyCards.tsx:314` |
| GE-0274 | table-caption | Global Fuel Commodity Import Costs, chart | `components/news/power-grid/MacroPricingDriverCards.tsx:187` |
| GE-0275 | table-caption | Macro Pressure Variables (2021 - 2026), chart | `components/news/power-grid/MacroPricingDriverCards.tsx:97` |
| GE-0276 | table-caption | Gas Supply Transition: Domestic vs. Imported LNG, chart | `components/news/power-grid/MacroTrendsTab.tsx:1044` |
| GE-0277 | table-caption | Regional Maximum Peak Supply, chart | `components/news/power-grid/MacroTrendsTab.tsx:1532` |
| GE-0278 | table-caption | BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart | `components/news/power-grid/MacroTrendsTab.tsx:2230` |
| GE-0279 | table-caption | Petrobangla Annual Revenue and LNG Import Costs, chart | `components/news/power-grid/MacroTrendsTab.tsx:2359` |
| GE-0280 | table-caption | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart | `components/news/power-grid/MacroTrendsTab.tsx:2542` |
| GE-0281 | table-caption | Historical System Loss Trends (TandD), chart | `components/news/power-grid/MacroTrendsTab.tsx:2777` |
| GE-0282 | table-caption | National Budget vs Capacity and Peak Generation, chart | `components/news/power-grid/MacroTrendsTab.tsx:655` |
| GE-0283 | table-caption | Historical Pricing and Tariff Comparison, chart | `components/news/power-grid/MacroTrendsTab.tsx:826` |
| GE-0284 | table-caption | Wholesale Tariff vs. Unit Production Cost, chart | `components/news/power-grid/MacroTrendsTab.tsx:912` |
| GE-0285 | table-caption | Renewable Generation Timeline, chart | `components/news/power-grid/RenewablesTab.tsx:1045` |
| GE-0286 | table-caption | Renewable energy by source, monthly, chart | `components/news/power-grid/RenewablesTab.tsx:900` |
| GE-0287 | table-caption | Renewable share of generation, monthly, chart | `components/news/power-grid/RenewablesTab.tsx:952` |
| GE-0288 | table-header | Fuel / Source | `components/news/PowerGridExplorer.tsx:2035` |
| GE-0289 | table-header | Generation (MKWh) | `components/news/PowerGridExplorer.tsx:2041` |
| GE-0290 | table-header | Generation Share | `components/news/PowerGridExplorer.tsx:2042` |
| GE-0291 | table-header | Daily Cost (Crore BDT) | `components/news/PowerGridExplorer.tsx:2043` |
| GE-0292 | table-header | Cost Share | `components/news/PowerGridExplorer.tsx:2044` |
| GE-0293 | table-header | Cost intensity | `components/news/PowerGridExplorer.tsx:2045` |
| GE-0294 | table-header | Unit Cost (Tk/kWh) | `components/news/PowerGridExplorer.tsx:2046` |
| GE-0295 | table-header | Import Source / Line | `components/news/PowerGridExplorer.tsx:2558` |
| GE-0296 | table-header | Type | `components/news/PowerGridExplorer.tsx:2561` |
| GE-0297 | table-header | Daily Energy Imported (MKWh) | `components/news/PowerGridExplorer.tsx:2565` |
| GE-0298 | table-header | Peak Hour Flow (MW) | `components/news/PowerGridExplorer.tsx:2568` |
| GE-0299 | table-header | Cost (Cr Tk) | `components/news/PowerGridExplorer.tsx:2580` |
| GE-0300 | table-header | Grid Zone | `components/news/PowerGridExplorer.tsx:2776` |
| GE-0301 | table-header | Evening Demand (MW) | `components/news/PowerGridExplorer.tsx:2777` |
| GE-0302 | table-header | Load-Shedding (MW) | `components/news/PowerGridExplorer.tsx:2778` |
| GE-0303 | table-header | Shedding Severity | `components/news/PowerGridExplorer.tsx:2779` |
| GE-0304 | table-header | Zone Total | `components/news/PowerGridExplorer.tsx:2992` |
| GE-0305 | table-header | Fuel Type | `components/news/PowerGridExplorer.tsx:3267` |
| GE-0306 | table-header | Output (MKWh) | `components/news/PowerGridExplorer.tsx:3268` |
| GE-0307 | table-header | Daily Cost (BDT) | `components/news/PowerGridExplorer.tsx:3269` |
| GE-0308 | table-header | System Share | `components/news/PowerGridExplorer.tsx:3271` |
| GE-0309 | table-header | Operator / Field | `components/news/PowerGridExplorer.tsx:3306` |
| GE-0310 | table-header | Gas (MMCFD) | `components/news/PowerGridExplorer.tsx:3307` |
| GE-0311 | table-header | Share | `components/news/PowerGridExplorer.tsx:3308` |
| GE-0312 | table-header | Distributor | `components/news/PowerGridExplorer.tsx:3331` |
| GE-0313 | table-header | Power (MMCFD) | `components/news/PowerGridExplorer.tsx:3332` |
| GE-0314 | table-header | Others (Suppl.) | `components/news/PowerGridExplorer.tsx:3333` |
| GE-0315 | table-header | Total | `components/news/PowerGridExplorer.tsx:3334` |
| GE-0316 | table-header | Demand (MW) | `components/news/PowerGridExplorer.tsx:3372` |
| GE-0317 | table-header | Shedding Share | `components/news/PowerGridExplorer.tsx:3374` |
| GE-0318 | table-header | Cost head | `components/news/power-grid/BpdbAccountsPanel.tsx:363` |
| GE-0319 | table-header | Group | `components/news/power-grid/BpdbAccountsPanel.tsx:364` |
| GE-0320 | table-header | Time | `components/news/power-grid/EnergyCurveChart.tsx:131` |
| GE-0321 | table-header | Measure | `components/news/power-grid/ForecastVsActualPanel.tsx:346` |
| GE-0322 | table-header | Year | `components/news/power-grid/GasReserveDepletionTab.tsx:1109` |
| GE-0323 | table-header | Imported share | `components/news/power-grid/GasReserveDepletionTab.tsx:1116` |
| GE-0324 | table-header | Days metered | `components/news/power-grid/GasReserveDepletionTab.tsx:1117` |
| GE-0325 | table-header | Choice | `components/news/power-grid/GasReserveDepletionTab.tsx:689` |
| GE-0326 | table-header | Output at +5 yr | `components/news/power-grid/GasReserveDepletionTab.tsx:690` |
| GE-0327 | table-header | at +10 yr | `components/news/power-grid/GasReserveDepletionTab.tsx:691` |
| GE-0328 | table-header | vs published | `components/news/power-grid/GasReserveDepletionTab.tsx:692` |
| GE-0329 | table-header | Field | `components/news/power-grid/GasReserveDepletionTab.tsx:790` |
| GE-0330 | table-header | Now | `components/news/power-grid/GasReserveDepletionTab.tsx:791` |
| GE-0331 | table-header | Booked left | `components/news/power-grid/GasReserveDepletionTab.tsx:793` |
| GE-0332 | table-header | Measured decline | `components/news/power-grid/GasReserveDepletionTab.tsx:794` |
| GE-0333 | table-header | Fit | `components/news/power-grid/GasReserveDepletionTab.tsx:795` |
| GE-0334 | table-header | 2P implies | `components/news/power-grid/GasReserveDepletionTab.tsx:796` |
| GE-0335 | table-header | Reading | `components/news/power-grid/GasReserveDepletionTab.tsx:797` |
| GE-0336 | table-header | Fiscal year | `components/news/power-grid/GasReserveDepletionTab.tsx:900` |
| GE-0337 | table-header | Petrobangla booked | `components/news/power-grid/GasReserveDepletionTab.tsx:901` |
| GE-0338 | table-header | This archive | `components/news/power-grid/GasReserveDepletionTab.tsx:902` |
| GE-0339 | table-header | Difference | `components/news/power-grid/GasReserveDepletionTab.tsx:903` |
| GE-0340 | table-header | Reserve replacement | `components/news/power-grid/GasReserveDepletionTab.tsx:904` |
| GE-0341 | table-header | Source | `components/news/power-grid/GasReserveDepletionTab.tsx:953` |
| GE-0342 | table-header | Their figure | `components/news/power-grid/GasReserveDepletionTab.tsx:954` |
| GE-0343 | table-header | This model | `components/news/power-grid/GasReserveDepletionTab.tsx:955` |
| GE-0344 | table-header | Independence | `components/news/power-grid/GasReserveDepletionTab.tsx:956` |
| GE-0345 | table-header | Hour | `components/news/power-grid/LiveForecastPanel.tsx:357` |
| GE-0346 | table-header | When | `components/news/power-grid/LiveForecastPanel.tsx:358` |
| GE-0347 | table-header | Generation MW | `components/news/power-grid/LoadCurveCanvas.tsx:869` |
| GE-0348 | table-header | Demand MW | `components/news/power-grid/LoadCurveCanvas.tsx:869` |
| GE-0349 | table-header | Load shed MW | `components/news/power-grid/LoadCurveCanvas.tsx:869` |
| GE-0350 | table-header | Retail Diesel (Tk/L) | `components/news/power-grid/MacroTrendsTab.tsx:2073` |
| GE-0351 | table-header | Retail Octane (Tk/L) | `components/news/power-grid/MacroTrendsTab.tsx:2074` |
| GE-0352 | table-header | Spot LNG (USD/MMBtu) | `components/news/power-grid/MacroTrendsTab.tsx:2075` |
| GE-0353 | table-header | Import Coal (USD/Ton) | `components/news/power-grid/MacroTrendsTab.tsx:2076` |
| GE-0354 | table-header | Exchange Rate (BDT/USD) | `components/news/power-grid/MacroTrendsTab.tsx:2077` |
| GE-0355 | table-header | Inflation Rate (CPI %) | `components/news/power-grid/MacroTrendsTab.tsx:2078` |
| GE-0356 | table-header | Fiscal Year | `components/news/power-grid/MacroTrendsTab.tsx:2255` |
| GE-0357 | table-header | Action | `components/news/power-grid/MacroTrendsTab.tsx:2393` |
| GE-0358 | table-header | BPDB | `components/news/power-grid/MacroTrendsTab.tsx:2814` |
| GE-0359 | table-header | REB | `components/news/power-grid/MacroTrendsTab.tsx:2815` |
| GE-0360 | table-header | DPDC | `components/news/power-grid/MacroTrendsTab.tsx:2816` |
| GE-0361 | table-header | DESCO | `components/news/power-grid/MacroTrendsTab.tsx:2817` |
| GE-0362 | table-header | WZPDCO | `components/news/power-grid/MacroTrendsTab.tsx:2818` |
| GE-0363 | table-header | NESCO | `components/news/power-grid/MacroTrendsTab.tsx:2819` |
| GE-0364 | table-header | Gas Field | `components/news/power-grid/PetrobanglaSectionDetail.tsx:336` |
| GE-0365 | table-header | Operator | `components/news/power-grid/PetrobanglaSectionDetail.tsx:338` |
| GE-0366 | table-header | Prod. Wells | `components/news/power-grid/PetrobanglaSectionDetail.tsx:340` |
| GE-0367 | table-header | Capacity (MMCFD) | `components/news/power-grid/PetrobanglaSectionDetail.tsx:341` |
| GE-0368 | table-header | Daily Production | `components/news/power-grid/PetrobanglaSectionDetail.tsx:342` |
| GE-0369 | table-header | Utilization | `components/news/power-grid/PetrobanglaSectionDetail.tsx:343` |
| GE-0370 | table-header | % of Grand Total | `components/news/power-grid/PetrobanglaSectionDetail.tsx:344` |
| GE-0371 | table-header | Condensate (BBLD) | `components/news/power-grid/PetrobanglaSectionDetail.tsx:348` |
| GE-0372 | table-header | Total Capacity | `components/news/power-grid/PetrobanglaSectionDetail.tsx:349` |
| GE-0373 | table-header | Total Production | `components/news/power-grid/PetrobanglaSectionDetail.tsx:350` |
| GE-0374 | table-header | Power Plant | `components/news/power-grid/PetrobanglaSectionDetail.tsx:452` |
| GE-0375 | table-header | Status | `components/news/power-grid/PetrobanglaSectionDetail.tsx:454` |
| GE-0376 | table-header | Demand | `components/news/power-grid/PetrobanglaSectionDetail.tsx:457` |
| GE-0377 | table-header | Supply | `components/news/power-grid/PetrobanglaSectionDetail.tsx:458` |
| GE-0378 | table-header | Stations | `components/news/power-grid/PowerStationsTab.tsx:675` |
| GE-0379 | table-header | Installed (MW) | `components/news/power-grid/PowerStationsTab.tsx:676` |
| GE-0380 | table-header | Evening peak (MW) | `components/news/power-grid/PowerStationsTab.tsx:677` |
| GE-0381 | table-header | Utilisation | `components/news/power-grid/PowerStationsTab.tsx:678` |
| GE-0382 | table-header | Share of output | `components/news/power-grid/PowerStationsTab.tsx:764` |
| GE-0383 | table-header | Station | `components/news/power-grid/PowerStationsTab.tsx:847` |
| GE-0384 | table-header | Fuel | `components/news/power-grid/PowerStationsTab.tsx:952` |
| GE-0385 | table-header | Quantity | `components/news/power-grid/PublishedVsDerivedTab.tsx:540` |
| GE-0386 | table-header | Terms | `components/news/power-grid/PublishedVsDerivedTab.tsx:548` |
| GE-0387 | table-header | Available (MW) | `components/news/power-grid/RenewablesTab.tsx:1131` |
| GE-0388 | table-header | Day peak (MW) | `components/news/power-grid/RenewablesTab.tsx:1132` |
| GE-0389 | table-header | Technology | `components/news/power-grid/RenewablesTab.tsx:1263` |
| GE-0390 | table-header | Installations | `components/news/power-grid/RenewablesTab.tsx:1264` |
| GE-0391 | table-header | Off-grid (MWp) | `components/news/power-grid/RenewablesTab.tsx:1265` |
| GE-0392 | table-header | On-grid (MWp) | `components/news/power-grid/RenewablesTab.tsx:1266` |
| GE-0393 | table-header | Total (MWp) | `components/news/power-grid/RenewablesTab.tsx:1267` |
| GE-0394 | table-header | Fuel / Resource | `components/news/power-grid/RenewablesTab.tsx:1386` |
| GE-0395 | table-header | Installed Capacity (MW) | `components/news/power-grid/RenewablesTab.tsx:1387` |
| GE-0396 | table-header | Organisation | `components/news/power-grid/RenewablesTab.tsx:1514` |
| GE-0397 | table-header | Check | `components/news/power-grid/RenewablesTab.tsx:1627` |
| GE-0398 | table-header | SREDA states | `components/news/power-grid/RenewablesTab.tsx:1628` |
| GE-0399 | table-header | Recomputed | `components/news/power-grid/RenewablesTab.tsx:1629` |
| GE-0400 | table-header | Installed | `components/news/power-grid/RenewablesTab.tsx:1739` |
| GE-0401 | table-header | Expected over system life | `components/news/power-grid/RenewablesTab.tsx:1740` |
| GE-0402 | table-header | Expected CO₂ avoided | `components/news/power-grid/RenewablesTab.tsx:1741` |
| GE-0403 | table-header | Expected so far | `components/news/power-grid/RenewablesTab.tsx:1742` |
| GE-0404 | table-header | Expected CO₂ so far | `components/news/power-grid/RenewablesTab.tsx:1743` |
| GE-0405 | table-header | Energy (MKWh) | `components/news/power-grid/RenewablesTab.tsx:696` |
| GE-0406 | table-header | Cost (Tk) | `components/news/power-grid/RenewablesTab.tsx:697` |
| GE-0407 | table-header | Tk/kWh | `components/news/power-grid/RenewablesTab.tsx:698` |
| GE-0408 | table-header | Rating / Type | `components/news/power-grid/TechnicalInfoTab.tsx:1070` |
| GE-0409 | table-header | Substation Name | `components/news/power-grid/TechnicalInfoTab.tsx:1253` |
| GE-0410 | table-header | Operation Zone | `components/news/power-grid/TechnicalInfoTab.tsx:1255` |
| GE-0411 | table-header | Transformer Detail | `components/news/power-grid/TechnicalInfoTab.tsx:1256` |
| GE-0412 | table-header | Ownership | `components/news/power-grid/TechnicalInfoTab.tsx:1258` |
| GE-0413 | table-header | Grid Circle | `components/news/power-grid/TechnicalInfoTab.tsx:1259` |
| GE-0414 | table-header | Infrastructure Class | `components/news/power-grid/TechnicalInfoTab.tsx:635` |
| GE-0415 | table-header | Voltage Class | `components/news/power-grid/TechnicalInfoTab.tsx:758` |
| GE-0416 | table-header | Infrastructure Item | `components/news/power-grid/TechnicalInfoTab.tsx:819` |
| GE-0417 | table-header | Verbatim Capacity / Length | `components/news/power-grid/TechnicalInfoTab.tsx:820` |
| GE-0418 | table-header | Substation / Station Class | `components/news/power-grid/TechnicalInfoTab.tsx:878` |
| GE-0419 | table-header | Count / Quantity | `components/news/power-grid/TechnicalInfoTab.tsx:879` |
| GE-0420 | table-header | Main Capacity / Rating | `components/news/power-grid/TechnicalInfoTab.tsx:880` |
| GE-0421 | table-header | Others (Quantity & Capacity) | `components/news/power-grid/TechnicalInfoTab.tsx:881` |
| GE-0422 | table-header | Project | `components/news/power-grid/renewables/ProjectRegisterCard.tsx:194` |

**422 entries** across 58 files.
