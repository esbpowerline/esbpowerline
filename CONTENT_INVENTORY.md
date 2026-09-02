# Grid Explorer Content Inventory — 2026-09-01

Every user-visible string and displayed field in `/grid-explorer`, its supporting components,
the commodities ticker and the homepage snapshot, produced read-only by the
`grid-explorer-audit` skill. The redesign skill checks its work against this list: anything
here that is absent from the redesigned page has been dropped, and dropping is not allowed
silently.

Format: `id | current text | type | file:line`.
- `id` is a stable dotted key (`ge.<area>.<element>`); it is an inventory handle, not a code symbol.
- `current text` is verbatim; `{placeholders}` mark interpolated values. Where a component
  renders a family of near-identical strings (a KPI tooltip's rows, a table's column heads), one
  row lists them separated by ` · ` with the line range that contains them.
- `type` ∈ heading · label · metric · unit · tooltip · disclaimer · footnote · chip · button ·
  control · option · subtab · tab · legend · axis · link · empty-state · error · page.
- `file:line` is relative to the repo root. A bare filename (e.g. `GasTab.tsx:183`) resolves
  under `components/news/power-grid/`; `page.tsx` resolves to `app/(public)/grid-explorer/page.tsx`.

Coverage: `app/(public)/grid-explorer/page.tsx`, `components/news/PowerGridExplorer*.tsx`,
`components/news/PowerGridChartUI.tsx`, every file under `components/news/power-grid/`
(including `petrobangla-archive/`, `petrobangla-live/`, `renewables/`), `components/news/LiveMarketTicker.tsx`,
`components/news/PublicMarketStrip.tsx`, `components/home/HomeSnapshotPanel.tsx` and the i18n
strings they consume. Files with no user-visible text are noted in place.

---

## Page — app/(public)/grid-explorer/page.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.page.meta.title | Bangladesh Power Grid Explorer — daily generation, demand & gas data | page | page.tsx:32, 62 |
| ge.page.meta.description | Daily generation, demand, load shedding, fuel mix, gas supply and cross-border imports for Bangladesh's national grid — 4,500+ days from the official PGCB and Petrobangla daily reports, with every figure traced to its source. | page | page.tsx:33-34 |
| ge.page.meta.og.description | Every day of Bangladesh's grid since 2013, from the official PGCB and Petrobangla reports: generation, demand, load shedding, fuel mix, gas supply and imports. | page | page.tsx:63-64 |
| ge.page.meta.twitter | Bangladesh Power Grid Explorer · Daily generation, demand, load shedding and gas supply for Bangladesh's national grid, from the official daily reports. | page | page.tsx:68-70 |
| ge.views | Generation & cost — Half-hourly fuel mix and the day's production cost by fuel · Gas & LNG supply — Field-by-field gas production and where it was allocated · Cross-border imports — The four interconnectors with India and Nepal, hour by hour · Regional grid — Zone-wise demand, load shedding and the NLDC outage log · Renewables — Solar, wind and hydro output against installed capacity · Power stations — Every station's output, installed capacity and utilisation · Technical information — Transmission lines, substations and grid infrastructure · Macro trends — Gas reserves, budgets, monthly archives and long-run indicators | link | page.tsx:76-83 |
| ge.header | Interactive Data • Power Sector · Power Grid Explorer · Planning and indicative data for Bangladesh's electricity system — generation, transmission, demand & projects. | heading | page.tsx:217-223 |
| ge.views-nav | Every view in the explorer · {label} — {blurb} | heading | page.tsx:258-263 |
| ge.errorboundary | Grid Explorer failed to load · A chart or data module encountered an error. Retry or refresh the page. · Retry | error | PowerGridExplorerErrorBoundary.tsx:32-43 |

## Shared primitives — shared.tsx · GridDataTable.tsx · ChartDataTable.tsx · svgChart.tsx · GridDayWindows.tsx · GridExplorerUI.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.project-status | PDPP Approved · PDPP Submitted · Feasibility Study · Pipeline · N/A · (~{n} Crore {suffix}) | chip | shared.tsx:187-262 |
| ge.datatable.empty-default | No rows match the current filters. | empty-state | GridDataTable.tsx:70 |
| ge.chartdatatable.unpublished | not published | empty-state | ChartDataTable.tsx:70 |
| ge.svgchart.provmark | P / D | tooltip | svgChart.tsx:130 |
| ge.daywindows | PGCB · Energy day · Petrobangla · Gas day · What "{isoDate}" covers (— each agency measures a different 24 hours) · Nothing held for this day. · A {unit} would run {window}; no figures on this page come from {publisher}. · {unit}: · printed as {label} · filed by {publisher} under {filedAs} · {sourceFile} · What this day's reports do not cover · {tab} — {reason} · All times {BST} (Bangladesh Standard Time). A record is shown on the calendar day its window opens … not differenced anywhere on this page. | label | GridDayWindows.tsx:49-224 |
| ge.badges | Daily · Live · Archive · Monthly · since {year} | chip | GridExplorerUI.tsx:25-53 |
| ge.provenance.tags | Published — stated in an official publication (any government body or agency) and reproduced here unchanged. Not audited or verified by ESB PowerLine. · Derived — calculated by ESB PowerLine from published figures. The source does not state this number. · Published figure / Derived figure · P / D | tooltip | GridExplorerUI.tsx:87-131 |
| ge.pager | Showing {from}–{to} of {total} {noun} · Show · per page · First page « · Previous page ‹ · … · Next page › · Last page » · Table pages | control | GridExplorerUI.tsx:224-268 |
| ge.sourcefooter | Source: {source} · & · Reporting Date: {date} · Read from: | footnote | GridExplorerUI.tsx:304-943 |
| ge.explain | What is being shown? · Analytical Insight: | button | GridExplorerUI.tsx:365-401 |
| ge.kpistrip | Show fewer · Show {n} more · level · {pct}% · vs {days}-day avg ({baseline}{unit}) · Loading the day's figures… · File · From | control | GridExplorerUI.tsx:522-839 |

## Overview KPI strip — OverviewKpiStrip.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.overview.kpi.gen | Peak Supply · {MW} MW · forecast {v} · outturn ±{gap} MW · Supply Briefing · Evening Peak Gen: · Day Peak Gen: · 24-Hour Average: · Total Energy Gen: (not published for this day) · Max Peak Gen: · Min Base Gen: · PGCB's same-morning forecast: · As published by PGCB. Not audited. · PGCB Daily Report · P1 sheet · Date: {date} | label | OverviewKpiStrip.tsx:76-289 |
| ge.overview.kpi.demand | Peak Demand · Demand Briefing · Evening Peak Demand: · Day Peak Demand: · Max System Temp: · PGCB's same-morning forecast: · As published by PGCB. Not audited. | label | OverviewKpiStrip.tsx:299-354 |
| ge.overview.kpi.shed | Peak Deficit · Shortfall Briefing · At the evening peak: · Share of peak demand: · Energy unserved (day): (not published for this day) · That, averaged over 24h: · The headline is peak demand less peak generation at the same hour. PGCB's own unserved-energy figure is the day's total … not expected to match. · P1 sheet — demand, generation and unserved energy | label | OverviewKpiStrip.tsx:379-435 |
| ge.overview.kpi.capacity | Capacity Idle · {v} MW unused at peak · Fleet Utilisation · Installed (stations listed): · Running at evening peak: · Idle at that moment: · Stations counted: · Without a stated rating: {n} station(s) · Renewables registered: {v} MWp · ~{pct}% of national · Both sides of this ratio are the plant sheet's own columns … idle capacity, not spare capacity that could have run. · Station-wise generation sheet · This day's report carries no station-wise sheet, so there is no installed rating to measure the peak against. The demand, supply and shedding figures beside it are unaffected. | label | OverviewKpiStrip.tsx:448-523 |
| ge.overview.kpi.gas | Gas Supply · {v} MMCFD / — MMCFD · Gas Supply Briefing · Total Gas Supply: · Imported LNG: · Chevron IOC Supply: · Tullow IOC Supply: · State Field Output: · Total Condensate: · As published by Petrobangla. Not audited. · Petrobangla has not published the production and distribution tables for this gas day yet. PGCB grid figures above are unaffected. · Petrobangla Daily Gas Intake/Offtake Report · I. Production · Gas day: {window} | label | OverviewKpiStrip.tsx:534-591 |
| ge.overview.kpi.cost | Cost of Power · {v} Tk/kWh · Fuel & Import Bills · Avg production cost: (not published for this day) · Fuel bill for the day: · Bill ÷ generation: · Gas generation cost: · HFO generation cost: · Cross-border imports: · The headline is the average production cost PGCB prints. The per-fuel rates below it are not published tariffs … Fuel and import bills only: capacity payments, debt service and O&M appear nowhere on this report … Restates BPDB fuel economics. Not audited. · P1 sheet — production-cost block | label | OverviewKpiStrip.tsx:606-672 |

## Tab KPI strips — TabKpiStrips.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gen.kpi | Energy Generated (Energy Briefing: Headline total: · Sum of the fuel rows: · Energy demanded: · The headline is P1's own total …) · Largest Source ({pct}% of the day's energy; Fuel Mix Briefing) · Fuel Bill (Cost Briefing: Fuel & import bill: · Avg production cost: · Fuel and imports only …) · Costliest Fuel Run (Unit Rate Briefing: These are not published tariffs … Fuels the report does not price are left out entirely rather than shown at zero.) | label | TabKpiStrips.tsx:117-256 |
| ge.imports.kpi | Imported Energy (Import Briefing: Imports, fuel-mix row: · Sum of the interconnectors: · PGCB prints imports twice …) · Largest Link (Interconnector Briefing: {peak} MW peak · {energy} MKWh; Each link's peak flow is PGCB's own figure. They are listed rather than added …) · Share of Generation (of {v} MKWh generated; Dependence Briefing) · Import Bill (Import Cost Briefing: Cost of imported power: · Implied rate: · The bill is published. The implied rate is that bill over the imported energy …) | label | TabKpiStrips.tsx:301-425 |
| ge.regional.kpi | Zones Reporting (at the evening peak; Coverage Briefing) · Load Shed, All Zones (Shedding Briefing: Summed across zones: · Grid-wide severity: …) · Worst-hit Zone ({pct}% of its demand unserved; Severity Briefing) · Zones Unaffected ({n} of {total}; every zone shed load; 0 MW shed; Every zone in this day's table shed some load.) | label | TabKpiStrips.tsx:464-585 |
| ge.stations.kpi | Stations Listed (Fleet Briefing: Rows on the sheet: · With a stated rating: · With a peak reading: …) · Generating at Peak (of {n} read; Dispatch Briefing: Recorded above zero: · Recorded at zero: · Not read this day: …) · Installed, Listed (across {n} stations; Capacity Briefing) · Stood Still ({pct}% of stations read; Idle Stations; no rating; {v} MW idle; … Idle is not the same as available.) | label | TabKpiStrips.tsx:639-756 |

## Chart UI — PowerGridChartUI.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.chart.ui | Chart legend · N/A · Capacity · Share · Mix index · Installed · Of total · Grid demand · {gw} GW equivalent · Share · MW · Load factor {pct}% · Live telemetry | label | PowerGridChartUI.tsx:268-763 |
| ge.chart.axis-units | k · Cr · MW · k MW · ckm · k ckm · Tk · % · Jan '{yy} · Jul '{yy} | axis | PowerGridChartUI.tsx:172-262 |

## Explorer shell — components/news/PowerGridExplorer.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.badge.backlog | Latest · {n} Day(s) Ago · {n} Month(s) Ago · {n} Years Ago · Archive | chip | PowerGridExplorer.tsx:288-338 |
| ge.tabs | Overview · Regional Grid · Gas & LNG Supply · Generation & Cost · Power Stations · C/B Imports · Renewables · Macro Trends · Technical Information · aria "Grid reports views" · — not published for this day · Not published for this day. | tab | PowerGridExplorer.tsx:970-983, 1128, 1510-1541 |
| ge.freshness-note | Archive freshness · Archive is {n} days behind · {note} | heading | PowerGridExplorer.tsx:1161-1168 |
| ge.status.no-source | No published source has been found for {date} · No daily report for this date is held here, and PGCB's published archive index carries no entry for it … Nothing has been assumed, reconstructed or carried over from a neighbouring day to fill the gap. | error | PowerGridExplorer.tsx:1315-1317 |
| ge.status.header | Grid Status Overview · Active reporting date: · Latest · Restore methodology banner · Restore Methodology Banner | heading | PowerGridExplorer.tsx:1335-1379 |
| ge.date-dock | Choose a reporting date · Close date picker · Done · Latest · Year (Year:) · Month (Month:) · Day (Day:) | control | PowerGridExplorer.tsx:1392-1463 |
| ge.loading | Loading Grid Data... | label | PowerGridExplorer.tsx:1556 |
| ge.empty.report | Report file not loaded yet · Report has not been released for this day yet · The {date} PGCB daily report is in our catalog but could not be fetched — it may still be syncing to the site mirror. Petrobangla field data may load separately below. · The daily grid status report and Petrobangla production telemetry for {date} have not been finalized or published by PGCB/NLDC. · View latest report ({date}) · Latest Available Report: · Date: {date} · Peak Gen: {v} MW / Demand: {v} MW / Energy: {v} MKWh | empty-state | PowerGridExplorer.tsx:1569-1596 |
| ge.empty.pre-2013 | PGCB Grid Overview Data · No official records are available for the selected date. PGCB data tracking officially started on December 31, 2013. · Official Backlog Start Date: December 31, 2013 (repeated for gen/imports/regional tabs) | empty-state | PowerGridExplorer.tsx:1610-1615, 1939-1944, 2471-2476, 2671-2676 |
| ge.load-curve | 24-Hour System Load Curve · three subtitle variants (Date: {date}) · NLDC SCADA Curve · No load curve published for this day · PGCB's report for {date} does not include the half-hourly NLDC load-curve sheet. Daily totals and peaks above are unaffected. · The band between the two curves is demand the grid did not meet … | heading | PowerGridExplorer.tsx:1632-1697 |
| ge.load-curve.glossary | What is being shown? · Everything on this chart comes from one sheet … Most days carry 25 readings, not 24 … · Generation (…) · Demand (… across all 3,600 hourly rows of 2026 it equals generation + 1.045 × load shed …) · Unmet demand (…) · Load shed, by hour (… / Nothing to show: this report states no load shedding in any hour of this day …) · 19:30 sample (…) | legend | PowerGridExplorer.tsx:1738-1833 |
| ge.load-curve.insights | Operational Insights · Load was shed in {n} of the {m} published hours, worst at {time} Hr with {v} MW unserved — around {v} MWh across the day … / No load shedding was recorded in any published hour of this day. · At the evening peak ({time} Hr) PGCB reported demand of {v} MW against {v} MW of load shedding. / This report does not publish an evening-peak demand or load-shedding figure. | metric | PowerGridExplorer.tsx:1840-1862 |
| ge.load-curve.footer | Source: PGCB Daily Report — P4 sheet, hourly generation, demand and load-shed columns · Hourly figures as published; hour counts and day totals are ours. Not independently audited. · Reporting Period: 24-Hour SCADA Log (Date: {date}) | footnote | PowerGridExplorer.tsx:1871-1874 |
| ge.fuelmix.table | Generation & Production Cost Breakdown · System performance data logged on {date} • {coverage} · Swipe horizontally to see all columns · Fuel / Source · Generation (MKWh) · Generation Share · Daily Cost (Crore BDT) · Cost Share · Cost intensity · Unit Cost (Tk/KWh) · Total System / Average · Fuel rows sum {v} vs {v} MKWh published by PGCB · agrees / differs by {delta} · {cs}% of cost for {gs}% of energy | label | PowerGridExplorer.tsx:1975-2097 |
| ge.fuelmix.allin | What this table cannot see: about {pct}% of the real bill. · PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost … · Fuel only, today (Tk/kWh — the table above) · BPDB all-in (Tk/kWh — {year}, annual) · Not in this table (Tk/kWh of non-fuel cost) · The two are different periods … understating it by roughly a third. | heading | PowerGridExplorer.tsx:2142-2176 |
| ge.fuelmix.notcomparable | These rates are not comparable to each other, and do not rank the options. · Each is a fuel or purchase cost divided by the energy that fuel produced … · Solar and wind burn no fuel. (…) · Hydro is not free. (…) · Imports cannot simply be increased. (…) · The columns that do compare fairly are the two beside each other: Generation Share against Cost Share … | heading | PowerGridExplorer.tsx:2195-2225 |
| ge.fuelmix.howarrived | How the unit cost is arrived at. No agency publishes a Tk/KWh rate … · Why the columns may not divide exactly. … Wind shows 0.31 MKWh against an actual 0.30624 … · badge explanations: corroborated (… gas agrees on 274 of 274 days, coal on 274 of 274, imports on 273 of 274 — the exception being 2026-04-03 …) · administered (… PGCB prints Wind at 14.7100 Tk/KWh unchanged, and Hydro at 0.1000 except for 2026-06-30 to 07-15, when it stepped to 3.8100 and back …) · disagreement · published-only · awaiting-witness | heading | PowerGridExplorer.tsx:2233-2294 |
| ge.fuelmix.footer | Source: PGCB Daily Report — P1 sheet, generation and production cost as published · Unit rate corroborated against BPDB Daily Reports. Not audited. · Reporting Date: {date} | footnote | PowerGridExplorer.tsx:2315-2318 |
| ge.milestones | Daily Operational Milestones · Key metrics on system margin, load shedding demand, and gas-to-power allocations • {coverage} · Load-Shedding & Demand (Peak Demand: · Peak Generation: · Unserved Energy:) · Daily System Margins (Max Generation: · Min Generation: · Max Temp:) · Gas-to-Power (Gas Supplied: · Gas Cost: · Gas Unit Cost:) · Source: PGCB Daily Report — P1 sheet and the reported-day Forecast block; Nepal from the En-Curve stack · As published by PGCB. Not audited. · Reporting Period: System Summary (Date: {date}) | heading | PowerGridExplorer.tsx:2341-2438 |
| ge.imports | Cross-Border Power Imports Tracker · Real-time import allocations and daily power trade (Report: {date}) • {coverage} · Import Source / Line · Type · Daily Energy Imported (MKWh) · Peak Capacity Served (MW) · Cost (Cr Tk) — all lines · from curve (tooltip: PGCB does not list this line in its production-cost interconnector block …) · PGCB publishes one import cost covering all interconnectors, not a figure per line · Total Grid Imports · National aggregate · Why cost is shown once, and no rate at all: … · The cost above covers the {v} MKWh the fuel table reports, which differs from the {v} MKWh these lines add up to … · The lines: Adani Cross-Border Interconnector (Godda Coal Power) … HVDC Bheramara … · Source: PGCB Daily Report — P1 sheet, import stats block; Nepal from the En-Curve stack · As published. Not independently audited. · Reporting Period: Daily Interconnector Flow (Date: {date}) | heading | PowerGridExplorer.tsx:2495-2631 |
| ge.regional | Zone-wise Demand & Load-Shedding · SCADA readings at the evening peak hour {source} reports for the day — {time} hr • {coverage} · Grid Zone · Evening Demand (MW) · Load-Shedding (MW) · Shedding Severity · Clean (0%) · Entire Grid Total · {pct}% grid-wide · footnotes (This day is BPDB's table, not PGCB's. … / On this day the demand figure is reconstructed as area served + load-shed … a derived stand-in, not the published cell … / Demand and load-shed are PGCB's own zone table, verified cell-for-cell against the source workbooks across 2025 and 2026 …) · How severity is calculated (…) · Source: BPDB Daily Generation Report — zone table / PGCB Daily Report — P1 sheet, zone-wise demand and load-shed table · Reporting Period: Evening Peak Load (Date: {date}) | heading | PowerGridExplorer.tsx:2689-2824 |
| ge.outage | NLDC Daily Outage Log · Major event log of yesterday's grid outages • {coverage} · time, description, lost load (P) · split into asset and cause (D) · no load stated · Source: PGCB Daily Report — P1 sheet, NLDC daily outage log · Asset and cause are cut from PGCB's single event description; the wording is theirs. · Reporting Period: 24-Hour Logs (Date: {date}) | heading | PowerGridExplorer.tsx:2833-2887 |
| ge.zonegen | Zone-wise Generation by Fuel · Energy generated inside each zone across the full day, in MKWh • {v} MKWh national · P1 · Grid Zone · Zone Total · Zone total · No output · National Total · Every figure on this card is published (… A dash means the fuel has no column on this day's sheet; a zero means the zone generated none. Figures under 0.01 MKWh are shown as '<0.01' …) · Source: PGCB Daily Report — P1 sheet, zone-wise generation summary · Reporting Period: Full day (Date: {date}) | heading | PowerGridExplorer.tsx:2903-3006 |
| ge.ewic | East-West Interconnector Transfer · Hourly flow across the three corridors joining the western and eastern grids • {v} MKWh transferred · {pct}% of national generation · exceeds the day's national generation — see the reconciliation note · flowing west to east / east to west · peak {v} MW at {time} · EWIC · Positive MW is flow from West to East; negative is East to West. Every reading in the archive so far has been positive … · Metered energy by circuit · Reconciliation note · Source: PGCB Daily Report — EWIC sheet, East-West Interconnector Log · Flows and circuit energy as published. The energy column is headed "MkWHr" and printed in kWh; converted here, not restated. · Reporting Date: {date} | heading | PowerGridExplorer.tsx:3022-3099 |
| ge.footer | Data Reporting Standards & Attributions · Report Period: · All data scraped from verified official daily publications. · No Petrobangla gas report is held for this day. · Backlog Reactivity & Updates · Daily — Data updates daily, fully reactive to daily backlog selections. · Monthly — Data updates monthly (SREDA installed capacity is static/monthly …). · Source Directories: PGCB/NLDC Operations · Petrobangla Reports · SREDA Database · BPC Pricing · Sources: BPDB, PGCB, SREDA, BERC, Petrobangla. Figures are indicative and editor-managed unless noted. Member downloads are logged for reference. | heading | PowerGridExplorer.tsx:3149-3206 |
| ge.print | Bangladesh Energy Sector Briefing · National Power Grid Audit Report · Comprehensive grid performance analytics, fuel audits, and asset directories. · ESB PowerLine Intelligence · Classification: Member Executive Briefing · Generated: {date} · KPIs Evening Peak Demand / Evening Peak Gen / Daily Generation / Avg. Generation Cost · 1. Daily Generation Mix & Fuel Audits (Fuel Type · Output (MKWh) · Daily Cost (BDT) · Unit Cost (Tk/KWh) · System Share · Total System) · 2. Gas Distribution & LNG Supply (Daily Production by Operator: Operator / Field · Gas (MMCFD) · Share; Power and Industry Distribution: Distributor · Power (MMCFD) · Industry / Other · Total) · 3. Regional Grid Performance & Outage Logs (Zone-wise Demand & Load-Shedding — {BPDB/PGCB} published · (demand derived) · Grid Zone · Demand (MW) · Load-Shedding (MW) · Shedding Share; NLDC Outage Log (Yesterday)) · Data Methodology & Reconciliation Guide (Estimated Net Fuel Cost (KPI Card) … Net System Cost = Total Net Energy Generated (MKWh) × Avg Production Cost (Tk/KWh) × 10,000,000 · ※ Excludes auxiliary consumption (~8-10%) and transmission losses (~3%). · Gross Production Cost Breakdown (Charts) … · Why do the values differ? … on July 24, 2024, Gross Generation was 345.90 MKWh …) · Report Document ID: ESB-AUDIT-2026-Q2 · © 2026 ESB PowerLine Services. All rights reserved. Generated on secure member access session. | heading | PowerGridExplorer.tsx:3228-3482 |
## Ticker — components/news/LiveMarketTicker.tsx

id | current text | type | file:line
---|---|---|---
ticker.item.value-unit | `{item.unit}` (rendered after numeric value, e.g. "mmbtu") | unit | components/news/LiveMarketTicker.tsx:135
ticker.item.delta-arrow-up | `▲` | chip | components/news/LiveMarketTicker.tsx:148
ticker.item.delta-arrow-down | `▼` | chip | components/news/LiveMarketTicker.tsx:148
ticker.item.delta-pct | `{Math.abs(change)}%` | chip | components/news/LiveMarketTicker.tsx:149
ticker.item.separator | `•` (decorative divider between items) | chip | components/news/LiveMarketTicker.tsx:152
ticker.label.commodities-mobile | `COMMODITIES` | label | components/news/LiveMarketTicker.tsx:181
ticker.label.commodities-desktop | `{t('ticker.commodities')}` (label variant) | label | components/news/LiveMarketTicker.tsx:182
ticker.label.commodities-default | `{t('ticker.commodities')}` (default variant) | label | components/news/LiveMarketTicker.tsx:204
market-strip.none | (no literal text — wraps LiveMarketTicker `variant="embedded"`) | — | components/news/PublicMarketStrip.tsx:23-36

## Homepage snapshot — components/home/HomeSnapshotPanel.tsx

id | current text | type | file:line
---|---|---|---
snapshot.tile.tooltip.live-en | `NLDC hourly · as of {liveWhen}` | tooltip | components/home/HomeSnapshotPanel.tsx:208
snapshot.tile.tooltip.live-bn | `এনএলডিসি ঘণ্টাভিত্তিক · {liveWhen} পর্যন্ত` | tooltip | components/home/HomeSnapshotPanel.tsx:207
snapshot.tile.tooltip.awaiting-en | `{awaiting} has not published this day yet` | tooltip | components/home/HomeSnapshotPanel.tsx:212
snapshot.tile.tooltip.awaiting-bn | `{awaiting} এখনও এই দিনের হিসাব প্রকাশ করেনি` | tooltip | components/home/HomeSnapshotPanel.tsx:211
snapshot.tile.tooltip.simulated | `{t('energy.simulated')}` (simulateLive on) | tooltip | components/home/HomeSnapshotPanel.tsx:230
snapshot.tile.tooltip.indicative | `{t('energy.indicative')}` (default status-dot tooltip) | tooltip | components/home/HomeSnapshotPanel.tsx:230
snapshot.tile.label.short-replace-generation | abbreviation rule `Generation` → `GEN` | label | components/home/HomeSnapshotPanel.tsx:217
snapshot.tile.label.short-replace-power | abbreviation rule `Power` → `PWR` | label | components/home/HomeSnapshotPanel.tsx:218
snapshot.tile.label.short-replace-frequency | abbreviation rule `Frequency` → `FREQ` | label | components/home/HomeSnapshotPanel.tsx:219
snapshot.tile.label.short-replace-power-upper | abbreviation rule `POWER` → `PWR` | label | components/home/HomeSnapshotPanel.tsx:220
snapshot.tile.value.dash | `—` (null/unpublished value) | empty-state | components/home/HomeSnapshotPanel.tsx:266
snapshot.tile.unit.awaiting-en | `awaiting` | label | components/home/HomeSnapshotPanel.tsx:285
snapshot.tile.unit.awaiting-bn | `অপেক্ষমাণ` | label | components/home/HomeSnapshotPanel.tsx:284
snapshot.segment.title | `{t('home.systemSnapshot')}` | heading | components/home/HomeSnapshotPanel.tsx:346
snapshot.segment.kicker-en | `Grid telemetry` | label | components/home/HomeSnapshotPanel.tsx:356
snapshot.segment.kicker-bn | `গ্রিড পরিসংখ্যান` | label | components/home/HomeSnapshotPanel.tsx:356
snapshot.segment.meta.hourly-prefix-en | `Hourly ` | label | components/home/HomeSnapshotPanel.tsx:366
snapshot.segment.meta.hourly-prefix-bn | `ঘণ্টাভিত্তিক ` | label | components/home/HomeSnapshotPanel.tsx:366
snapshot.segment.meta.daily-prefix-en | `Daily ` | label | components/home/HomeSnapshotPanel.tsx:370
snapshot.segment.meta.daily-prefix-bn | `দৈনিক ` | label | components/home/HomeSnapshotPanel.tsx:370
snapshot.segment.meta.updated-prefix-en | `Updated ` | label | components/home/HomeSnapshotPanel.tsx:376
snapshot.segment.meta.updated-prefix-bn | `আপডেট ` | label | components/home/HomeSnapshotPanel.tsx:376
snapshot.segment.sources-separator | `•` (between agency names in footer) | chip | components/home/HomeSnapshotPanel.tsx:405
snapshot.rail.title | `{t('home.systemSnapshot')}` | heading | components/home/HomeSnapshotPanel.tsx:461
snapshot.rail.updated-label-en | `UPDATED: ` | label | components/home/HomeSnapshotPanel.tsx:466
snapshot.rail.updated-label-bn | `আপডেট: ` | label | components/home/HomeSnapshotPanel.tsx:466
snapshot.rail.data-label-en | `DATA:` | label | components/home/HomeSnapshotPanel.tsx:486
snapshot.rail.data-label-bn | `তথ্য সূত্র:` | label | components/home/HomeSnapshotPanel.tsx:486

Note: `liveWord` (e.g. "LIVE") and agency names (PGCB, SREDA …) at lines 315, 385, 400-409, 436, 473 are derived at runtime by splitting `snapshotLabel` / `SNAPSHOT_LABEL_BN` on `•`.

## Snapshot tiles — lib/data/grid/home-snapshot-core.ts (the fixed 2×6 layout contract)

id | current text | type | file:line
---|---|---|---
snapshot.unit.power | `MW` (`POWER_UNIT`, 8 of 12 tiles) | unit | lib/data/grid/home-snapshot-core.ts:15
snapshot.tile.current-demand.label | `Current Demand` | label | lib/data/grid/home-snapshot-core.ts:47, 185
snapshot.tile.current-demand.awaiting | `NLDC` (always awaiting — no daily-report source) | label | lib/data/grid/home-snapshot-core.ts:185
snapshot.tile.peak-generation.label | `Peak Generation` | label | lib/data/grid/home-snapshot-core.ts:48, 186
snapshot.tile.peak-today.label | `Peak Today` | label | lib/data/grid/home-snapshot-core.ts:49, 187
snapshot.tile.daily-generation.label | `Daily Generation` | label | lib/data/grid/home-snapshot-core.ts:50, 195
snapshot.tile.daily-generation.awaiting | `PGCB` (totalEnergyGen null) | label | lib/data/grid/home-snapshot-core.ts:162, 195
snapshot.tile.load-shedding.label | `Load Shedding` | label | lib/data/grid/home-snapshot-core.ts:51, 196
snapshot.tile.load-shedding.awaiting | `PGCB` | label | lib/data/grid/home-snapshot-core.ts:112, 196
snapshot.tile.energy-unserved.label | `Energy Unserved` | label | lib/data/grid/home-snapshot-core.ts:52, 200
snapshot.tile.energy-unserved.awaiting | `PGCB` | label | lib/data/grid/home-snapshot-core.ts:163, 200
snapshot.tile.fuel-cost.label | `Fuel Cost` | label | lib/data/grid/home-snapshot-core.ts:53, 201
snapshot.tile.fuel-cost.unit | `Tk/kWh` | unit | lib/data/grid/home-snapshot-core.ts:201
snapshot.tile.fuel-cost.awaiting | `PGCB` | label | lib/data/grid/home-snapshot-core.ts:164, 201
snapshot.tile.gas-supply.label | `Gas Supply` | label | lib/data/grid/home-snapshot-core.ts:54, 205
snapshot.tile.gas-supply.unit | `MMcfd` | unit | lib/data/grid/home-snapshot-core.ts:205
snapshot.tile.gas-supply.awaiting | `Petrobangla` (no gasProductionData rows, or sum 0) | label | lib/data/grid/home-snapshot-core.ts:65, 67, 205
snapshot.tile.coal-generation.label | `Coal Generation` | label | lib/data/grid/home-snapshot-core.ts:55, 206
snapshot.tile.coal-generation.awaiting | `PGCB` (no Coal row) | label | lib/data/grid/home-snapshot-core.ts:120, 206
snapshot.tile.grid-import.label | `Grid Import` | label | lib/data/grid/home-snapshot-core.ts:56, 207
snapshot.tile.grid-import.awaiting | `PGCB` (no borderImportsData rows) | label | lib/data/grid/home-snapshot-core.ts:127, 207
snapshot.tile.re-installed.label | `RE Installed` | label | lib/data/grid/home-snapshot-core.ts:57, 133, 221
snapshot.tile.re-installed.awaiting | `SREDA` | label | lib/data/grid/home-snapshot-core.ts:133, 221
snapshot.tile.re-grid-share.label | `RE Grid Share` | label | lib/data/grid/home-snapshot-core.ts:58, 138, 222
snapshot.tile.re-grid-share.unit | `%` | unit | lib/data/grid/home-snapshot-core.ts:140, 222
snapshot.tile.re-grid-share.awaiting | `SREDA` | label | lib/data/grid/home-snapshot-core.ts:138, 222

## i18n — lib/i18n/homepage-copy.ts

id | current text | type | file:line
---|---|---|---
ticker.item.lng.bn | `এলএনজি (স্পট)` | label | lib/i18n/homepage-copy.ts:5
ticker.item.coal.bn | `কয়লা (API২)` | label | lib/i18n/homepage-copy.ts:6
ticker.item.fx.bn | `ডলার/টাকা` | label | lib/i18n/homepage-copy.ts:7
ticker.item.solar.bn | `সোলার মডিউল` | label | lib/i18n/homepage-copy.ts:8
ticker.item.tariff.bn | `বাল্ক ট্যারিফ` | label | lib/i18n/homepage-copy.ts:9
ticker.item.gas.bn | `পেট্রোবাংলা গ্যাস` | label | lib/i18n/homepage-copy.ts:10
energy-stat.generation-capacity.bn | `উৎপাদন ক্ষমতা` ("Generation Capacity") | label | lib/i18n/homepage-copy.ts:14
energy-stat.current-demand.bn | `বর্তমান চাহিদা` | label | lib/i18n/homepage-copy.ts:15
energy-stat.renewable-share.bn | `নবায়নযোগ্য অংশ` | label | lib/i18n/homepage-copy.ts:16
energy-stat.re-installed.bn | `নবায়নযোগ্য স্থাপিত` | label | lib/i18n/homepage-copy.ts:17
energy-stat.re-grid-share.bn | `নবায়নযোগ্য গ্রিড অংশ` | label | lib/i18n/homepage-copy.ts:18
energy-stat.system-loss.bn | `সিস্টেম লস` | label | lib/i18n/homepage-copy.ts:19
energy-stat.gas-supply.bn | `গ্যাস সরবরাহ` | label | lib/i18n/homepage-copy.ts:20
energy-stat.peak-today.bn | `আজকের পিক` | label | lib/i18n/homepage-copy.ts:21
energy-stat.peak-generation.bn | `পিক উৎপাদন` | label | lib/i18n/homepage-copy.ts:22
energy-stat.energy-unserved.bn | `অপূরণীয় বিদ্যুৎ` | label | lib/i18n/homepage-copy.ts:23
energy-stat.grid-import.bn | `গ্রিড আমদানি` | label | lib/i18n/homepage-copy.ts:24
energy-stat.india-grid-import.bn | `ভারত থেকে আমদানি` | label | lib/i18n/homepage-copy.ts:25
energy-stat.solar-installed.bn | `সোলার স্থাপিত` | label | lib/i18n/homepage-copy.ts:26
energy-stat.daily-generation.bn | `দৈনিক উৎপাদন` | label | lib/i18n/homepage-copy.ts:27
energy-stat.load-shedding.bn | `লোড শেডিং` | label | lib/i18n/homepage-copy.ts:28
energy-stat.coal-generation.bn | `কয়লা বিদ্যুৎ` | label | lib/i18n/homepage-copy.ts:29
energy-stat.grid-frequency.bn | `গ্রিড ফ্রিকোয়েন্সি` | label | lib/i18n/homepage-copy.ts:30
energy-stat.fuel-cost.bn | `জ্বালানি খরচ` | label | lib/i18n/homepage-copy.ts:31
energy-stat.liquid-fuel-gen.bn | `তরল জ্বালানি বিদ্যুৎ` | label | lib/i18n/homepage-copy.ts:32
energy-stat.hydro-power.bn | `হাইড্রো বিদ্যুৎ` | label | lib/i18n/homepage-copy.ts:33
professionals-cta.label.bn | `সদস্য সুবিধা` | chip | lib/i18n/homepage-copy.ts:37
professionals-cta.title.bn | `সংবাদ ও ম্যাগাজিন সংরক্ষণ, তথ্য ডাউনলোড, মতামত ও গভীর বিশ্লেষণে প্রবেশ করুন।` | heading | lib/i18n/homepage-copy.ts:38
professionals-cta.primary-label.bn | `গ্রিড তথ্য দেখুন` | button | lib/i18n/homepage-copy.ts:39
professionals-cta.secondary-label.bn | `সদস্য প্রবেশ` | button | lib/i18n/homepage-copy.ts:40
snapshot.label.bn | `লাইভ • বিপিডিবি • পিজিসিবি • এসআরইডিএ • পেট্রোবাংলা` | label | lib/i18n/homepage-copy.ts:43
market-pulse.bn | `এলএনজি স্পট দাম বাড়ছে • সোলার মডিউল -২.১% সাপ্তাহিক • ডলার/টাকা ওঠানামায় আইপিপি মার্জিনে চাপ • কয়লা API২ $১০২ এ স্থির • ৮.৯৫ টাকা/ইউনিট বাল্ক ট্যারিফ কার্যকর` | ticker | lib/i18n/homepage-copy.ts:46

## i18n — lib/i18n/messages.ts (keys consumed by the surfaces above)

id | current text | type | file:line
---|---|---|---
messages.home.system-snapshot.en | `System Snapshot` | heading | lib/i18n/messages.ts:206
messages.home.system-snapshot.bn | `বিদ্যুৎ পরিস্থিতি` | heading | lib/i18n/messages.ts:389
messages.ticker.commodities.en | `Commodities` | label | lib/i18n/messages.ts:289
messages.ticker.commodities.bn | `পণ্যসমূহ` | label | lib/i18n/messages.ts:472
messages.energy.simulated.en | `Simulated telemetry (dev)` | tooltip | lib/i18n/messages.ts:333
messages.energy.simulated.bn | `পরীক্ষামূলক তথ্য (ডেভ)` | tooltip | lib/i18n/messages.ts:516
messages.energy.indicative.en | `Indicative snapshot` | tooltip | lib/i18n/messages.ts:334
messages.energy.indicative.bn | `আনুমানিক তথ্য` | tooltip | lib/i18n/messages.ts:517
# Grid Explorer content inventory — part: gap tabs (Renewables, Power Stations, Forecast, canvases, Published vs Derived, Macro price cards, Longitudinal study)

Conventions as in the sibling part files: `{placeholders}` for interpolations; ` · ` joins short sibling fragments rendered as one visual unit; disclaimers and footnotes are quoted in full. Purely technical strings (class names, keys, console text) are omitted.

## RenewablesTab — components/news/power-grid/RenewablesTab.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.renewables.kpi.generation.label | Renewable Generation | label | components/news/power-grid/RenewablesTab.tsx:521 |
| ge.renewables.kpi.generation.value | {n} MKWh · — MKWh | metric | components/news/power-grid/RenewablesTab.tsx:522 |
| ge.renewables.kpi.generation.hint | PGCB daily report · {isoDate} | label | components/news/power-grid/RenewablesTab.tsx:523 |
| ge.renewables.kpi.generation.tooltip.title | Renewable Output | tooltip | components/news/power-grid/RenewablesTab.tsx:527 |
| ge.renewables.kpi.generation.tooltip.rows | {fuel}: {n} MKWh · Renewable total: {n} MKWh · All fuels: {n} MKWh | tooltip | components/news/power-grid/RenewablesTab.tsx:533-549 |
| ge.renewables.kpi.generation.tooltip.audit | PGCB publishes each fuel's energy; the renewable total is our sum of Solar, Hydro and Wind. Not audited. | tooltip | components/news/power-grid/RenewablesTab.tsx:551-554 |
| ge.renewables.kpi.generation.tooltip.ref | PGCB Daily Report · En-Curve sheet — per-fuel hourly energy · Date: {isoDate} | tooltip | components/news/power-grid/RenewablesTab.tsx:555 |
| ge.renewables.kpi.share.label | Share of Generation | label | components/news/power-grid/RenewablesTab.tsx:562 |
| ge.renewables.kpi.share.hint | of all energy generated that day | label | components/news/power-grid/RenewablesTab.tsx:564 |
| ge.renewables.kpi.share.tooltip.title | Renewable Share | tooltip | components/news/power-grid/RenewablesTab.tsx:568 |
| ge.renewables.kpi.share.tooltip.rows | Renewable: {n} MKWh · Total generated: {n} MKWh | tooltip | components/news/power-grid/RenewablesTab.tsx:574-579 |
| ge.renewables.kpi.share.tooltip.audit | A quotient of two figures PGCB publishes. PGCB does not state this percentage. | tooltip | components/news/power-grid/RenewablesTab.tsx:580-582 |
| ge.renewables.kpi.plants.label | Renewable Plants Online | label | components/news/power-grid/RenewablesTab.tsx:590 |
| ge.renewables.kpi.plants.hint | {n} MW available capacity · per-station detail not published | label | components/news/power-grid/RenewablesTab.tsx:592-596 |
| ge.renewables.kpi.plants.tooltip.title | Renewable Fleet | tooltip | components/news/power-grid/RenewablesTab.tsx:600 |
| ge.renewables.kpi.plants.tooltip.rows | Installed: {n} MW · Available today: {n} MW · Sum of day peaks: {n} MW · Sum of evening peaks: {n} MW | tooltip | components/news/power-grid/RenewablesTab.tsx:606-624 |
| ge.renewables.kpi.plants.tooltip.audit | Station rows as PGCB publishes them. Totals are our sums of those rows. | tooltip | components/news/power-grid/RenewablesTab.tsx:626-628 |
| ge.renewables.kpi.capacity.label | Installed Capacity | label | components/news/power-grid/RenewablesTab.tsx:636 |
| ge.renewables.kpi.capacity.value | {n} MWp · — | metric | components/news/power-grid/RenewablesTab.tsx:637 |
| ge.renewables.kpi.capacity.hint | SREDA register · {date} · SREDA register | label | components/news/power-grid/RenewablesTab.tsx:638 |
| ge.renewables.kpi.capacity.tooltip.title | SREDA Capacity Register | tooltip | components/news/power-grid/RenewablesTab.tsx:643 |
| ge.renewables.kpi.capacity.tooltip.rows | {source}: {n} MWp · SREDA total: {n} MWp | tooltip | components/news/power-grid/RenewablesTab.tsx:649-662 |
| ge.renewables.kpi.capacity.tooltip.audit | MWp is peak DC capacity, not the MW used for grid capacity — the two are not interchangeable and are never combined here. | tooltip | components/news/power-grid/RenewablesTab.tsx:663-666 |
| ge.renewables.kpi.capacity.tooltip.ref | SREDA NDRE · Updated: {date} | tooltip | components/news/power-grid/RenewablesTab.tsx:667-671 |
| ge.renewables.daily.heading | Renewable Output by Fuel | heading | components/news/power-grid/RenewablesTab.tsx:682 |
| ge.renewables.daily.sub | PGCB daily report · {isoDate} | label | components/news/power-grid/RenewablesTab.tsx:683-685 |
| ge.renewables.daily.headers | Fuel · Energy (MKWh) · Cost (Tk) · Tk/kWh | label | components/news/power-grid/RenewablesTab.tsx:695-698 |
| ge.renewables.daily.flat-chip | flat | chip | components/news/power-grid/RenewablesTab.tsx:723 |
| ge.renewables.daily.flat-chip.tooltip | Administered rate — the publisher applies a fixed Tk/kWh to this fuel rather than reporting an observed cost, so it should not be read as a daily measurement. | tooltip | components/news/power-grid/RenewablesTab.tsx:721 |
| ge.renewables.daily.total-row | Renewable total | label | components/news/power-grid/RenewablesTab.tsx:731 |
| ge.renewables.daily.footnote | Hydro and Wind carry a **flat** mark because PGCB applies a fixed rate to them — 0.1000 and 14.7100 Tk/kWh on essentially every day of 2026 — rather than reporting a measured cost. A rate no agency prints is derived either way. | footnote | components/news/power-grid/RenewablesTab.tsx:739-744 |
| ge.renewables.daily.empty | PGCB published no fuel-wise generation for this date. | empty-state | components/news/power-grid/RenewablesTab.tsx:747 |
| ge.renewables.daily.footer | Source: PGCB Daily Generation Report · Reported day: {isoDate} | footnote | components/news/power-grid/RenewablesTab.tsx:750-758 |
| ge.renewables.month.heading | Latest Published Month | heading | components/news/power-grid/RenewablesTab.tsx:766 |
| ge.renewables.month.sub | {month label} · PGCB monthly report | label | components/news/power-grid/RenewablesTab.tsx:767-769 |
| ge.renewables.month.tiles | {fuel} · MKWh · Share of generation · {pct}% · {renewable} of {total} MKWh | metric | components/news/power-grid/RenewablesTab.tsx:781-804 |
| ge.renewables.month.footnote | Each figure is from that month's own PGCB report. The share is our quotient of the three against the month's published total net generation — PGCB does not state a renewable percentage. | footnote | components/news/power-grid/RenewablesTab.tsx:806-810 |
| ge.renewables.month.empty | PGCB monthly reports could not be loaded. | empty-state | components/news/power-grid/RenewablesTab.tsx:813 |
| ge.renewables.month.footer | Source: PGCB Monthly Report · {month label} | footnote | components/news/power-grid/RenewablesTab.tsx:816-824 |
| ge.renewables.timeline.heading | Renewable Generation Timeline | heading | components/news/power-grid/RenewablesTab.tsx:833 |
| ge.renewables.timeline.sub | Every month PGCB has published — energy by Solar, Hydro and Wind, with renewables as a share of all generation | label | components/news/power-grid/RenewablesTab.tsx:834-837 |
| ge.renewables.timeline.legend | Hydro · Wind · Solar · Share of generation (P/P/P/D) | legend | components/news/power-grid/RenewablesTab.tsx:389-397 |
| ge.renewables.timeline.tooltip | {fuel} {n} MKWh · Renewable total {n} MKWh · All generation {n} MKWh · Share {pct}% / — | tooltip | components/news/power-grid/RenewablesTab.tsx:463-498 |
| ge.renewables.timeline.caption.energy | Energy by source (MKWh) | axis | components/news/power-grid/RenewablesTab.tsx:870 |
| ge.renewables.timeline.caption.share | Renewables as a share of all generation (%) | axis | components/news/power-grid/RenewablesTab.tsx:912-915 |
| ge.renewables.timeline.aria | Renewable energy by source, monthly, chart · Renewable share of generation, monthly, chart · Renewable Generation Timeline, chart | label | components/news/power-grid/RenewablesTab.tsx:873, 918, 965 |
| ge.renewables.timeline.datatable | Month (header) · Hydro/Wind/Solar (MKWh) · Share of generation (%) | label | components/news/power-grid/RenewablesTab.tsx:899-909, 951-959, 1044-1055 |
| ge.renewables.timeline.stats | {n} months published, {first} – {last} · First {solar/wind/hydro} generation: {month} | metric | components/news/power-grid/RenewablesTab.tsx:1058-1071 |
| ge.renewables.timeline.axis-note | Left axis is monthly energy in MKWh, stacked; right axis is renewables as a share of all generation that month. Gaps in the line are months PGCB has not published — nothing is interpolated across them. | footnote | components/news/power-grid/RenewablesTab.tsx:1072-1076 |
| ge.renewables.timeline.empty | PGCB monthly reports could not be loaded, so no timeline is shown. | empty-state | components/news/power-grid/RenewablesTab.tsx:1079 |
| ge.renewables.timeline.footer | Source: PGCB Monthly Reports · {n} months · through {month label} | footnote | components/news/power-grid/RenewablesTab.tsx:1082-1094 |
| ge.renewables.stations.heading | Renewable Power Stations · {n} stations | heading | components/news/power-grid/RenewablesTab.tsx:1102-1105 |
| ge.renewables.stations.sub | Every renewable station PGCB lists for this day, with its own output | label | components/news/power-grid/RenewablesTab.tsx:1106-1108 |
| ge.renewables.stations.loading | Loading station detail… | empty-state | components/news/power-grid/RenewablesTab.tsx:1113 |
| ge.renewables.stations.headers | Station · Fuel · Producer · Installed (MW) · Available (MW) · Day peak (MW) · Evening peak (MW) · Energy (MKWh) | label | components/news/power-grid/RenewablesTab.tsx:1119-1134 |
| ge.renewables.stations.total-row | {n} stations | label | components/news/power-grid/RenewablesTab.tsx:1160-1163 |
| ge.renewables.stations.empty | PGCB published no per-station table for {isoDate / this date}, or the day's workbook did not reconcile against its own totals. Nothing from a neighbouring day is shown in its place. | empty-state | components/news/power-grid/RenewablesTab.tsx:1176-1181 |
| ge.renewables.stations.recon.heading | Stations reconciled against PGCB's own fuel totals | label | components/news/power-grid/RenewablesTab.tsx:1185-1192 |
| ge.renewables.stations.recon.rows | {fuel} — {n} station{s} sum · {computed} vs {published} MKWh published · agrees / differs by {delta} | metric | components/news/power-grid/RenewablesTab.tsx:1194-1208 |
| ge.renewables.stations.recon.note | The station table and the fuel table are different pages of the same PGCB report, so each fuel's stations should sum to its published energy. Band is half of the last digit PGCB prints, once per figure summed. | footnote | components/news/power-grid/RenewablesTab.tsx:1210-1214 |
| ge.renewables.stations.solar-note | Solar stations report a day peak and no evening peak, because the evening peak is measured after sunset. A zero there is a real reading, not a gap. | footnote | components/news/power-grid/RenewablesTab.tsx:1218-1221 |
| ge.renewables.stations.footer | Source: PGCB Daily Report — station table · Reported day: {isoDate} | footnote | components/news/power-grid/RenewablesTab.tsx:1223-1231 |
| ge.renewables.sreda.unavailable | SREDA register unavailable · No SREDA snapshot could be loaded. Nothing is shown rather than figures from an earlier date under today's heading. | empty-state | components/news/power-grid/RenewablesTab.tsx:1236-1239 |
| ge.renewables.tech.heading | Installed Capacity by Technology · {n} technologies | heading | components/news/power-grid/RenewablesTab.tsx:1246-1251 |
| ge.renewables.tech.sub | SREDA National Database of Renewable Energy — as published {lastUpdate} | label | components/news/power-grid/RenewablesTab.tsx:1252-1254 |
| ge.renewables.tech.headers | Technology · Installations · Off-grid (MWp) · On-grid (MWp) · Total (MWp) | label | components/news/power-grid/RenewablesTab.tsx:1263-1267 |
| ge.renewables.tech.group-count | {n} technology / {n} technologies | label | components/news/power-grid/RenewablesTab.tsx:1301-1303 |
| ge.renewables.tech.total-row | SREDA published total | label | components/news/power-grid/RenewablesTab.tsx:1329 |
| ge.renewables.tech.empty | SREDA's technology-wise page could not be read for this snapshot. | empty-state | components/news/power-grid/RenewablesTab.tsx:1342-1344 |
| ge.renewables.tech.footnote | **Installations** is a count, not a capacity: 6,037,583 solar home systems sit beside 14 solar parks, so the columns cannot be ranked against each other. **MWp** is peak DC capacity as SREDA reports it — not the MW used above for grid capacity and output. Each source row sums the SREDA-published technology rows beneath it — click a source to expand or collapse them. | footnote | components/news/power-grid/RenewablesTab.tsx:1347-1355 |
| ge.renewables.tech.footer | Source: SREDA NDRE — Technology wise Generation · SREDA last update: {lastUpdate} | footnote | components/news/power-grid/RenewablesTab.tsx:1357-1365 |
| ge.renewables.mix.heading | National Installed Capacity Mix | heading | components/news/power-grid/RenewablesTab.tsx:1374 |
| ge.renewables.mix.sub | Every fuel SREDA counts towards national capacity, renewables among them | label | components/news/power-grid/RenewablesTab.tsx:1375-1377 |
| ge.renewables.mix.headers | Fuel / Resource · Installed Capacity (MW) · Share | label | components/news/power-grid/RenewablesTab.tsx:1386-1388 |
| ge.renewables.mix.total-row | SREDA published total | label | components/news/power-grid/RenewablesTab.tsx:1403 |
| ge.renewables.mix.empty | SREDA's generation-mix page could not be read for this snapshot. | empty-state | components/news/power-grid/RenewablesTab.tsx:1423-1425 |
| ge.renewables.mix.footnote | This page states renewable capacity in **MW**; the technology page states the same quantity in **MWp**. SREDA uses both labels for it, and the two figures differ slightly — the reconciliation below reports that rather than picking one. | footnote | components/news/power-grid/RenewablesTab.tsx:1428-1432 |
| ge.renewables.mix.footer | Source: SREDA NDRE — Electricity Generation Mix · SREDA last update: {lastUpdate} | footnote | components/news/power-grid/RenewablesTab.tsx:1434-1442 |
| ge.renewables.yearwise.heading | Capacity Added by Year | heading | components/news/power-grid/RenewablesTab.tsx:1449 |
| ge.renewables.yearwise.sub | When SREDA records each block of capacity as having come on | label | components/news/power-grid/RenewablesTab.tsx:1450-1452 |
| ge.renewables.yearwise.empty | SREDA's year-wise pages could not be read for this snapshot. | empty-state | components/news/power-grid/RenewablesTab.tsx:1464-1466 |
| ge.renewables.yearwise.footer | Source: SREDA NDRE — Year wise Generation · SREDA last update: {lastUpdate} | footnote | components/news/power-grid/RenewablesTab.tsx:1469-1477 |
| ge.renewables.orgs.heading | {table.category} | heading | components/news/power-grid/RenewablesTab.tsx:1499 |
| ge.renewables.orgs.sub | By implementing organisation, as attributed by SREDA | label | components/news/power-grid/RenewablesTab.tsx:1505-1507 |
| ge.renewables.orgs.headers | Organisation · Units · Capacity | label | components/news/power-grid/RenewablesTab.tsx:1514-1522 |
| ge.renewables.orgs.fullnames | Bangladesh Power Development Board · North-West Power Generation Company Limited · Electricity Generation Company of Bangladesh · Bangladesh Rural Electrification Board · West Zone Power Distribution Company Limited · Dhaka Electric Supply Company Limited · Northern Electric Supply Company Limited · Dhaka Power Distribution Company Limited · Infrastructure Development Company Limited · Bangladesh Agricultural Development Corporation · Barind Multipurpose Development Authority · Rural Development Academy · Department of Agricultural Extension · Bangladesh Academy for Rural Development · Bangladesh Agricultural Research Institute · Bangladesh Rice Research Institute | label | components/news/power-grid/RenewablesTab.tsx:139-156, 1530-1534 |
| ge.renewables.orgs.total-row | Total | label | components/news/power-grid/RenewablesTab.tsx:1544 |
| ge.renewables.orgs.footer | Source: SREDA NDRE | footnote | components/news/power-grid/RenewablesTab.tsx:1559-1565 |
| ge.renewables.recon.heading | Reconciliation of SREDA's own totals · {a} agree · {b} differ | heading | components/news/power-grid/RenewablesTab.tsx:1581-1586 |
| ge.renewables.recon.sub | Each published total recomputed from the rows above it, and compared where two SREDA pages state the same quantity | label | components/news/power-grid/RenewablesTab.tsx:1587-1590 |
| ge.renewables.recon.status | Showing all {n} checks · Showing the {n} that differ · Every check agrees | label | components/news/power-grid/RenewablesTab.tsx:1599-1605 |
| ge.renewables.recon.toggle | Show only differences · Show all {n} checks | button | components/news/power-grid/RenewablesTab.tsx:1611-1619 |
| ge.renewables.recon.headers | Check · SREDA states · Recomputed · Difference · Band · Result | label | components/news/power-grid/RenewablesTab.tsx:1627-1643 |
| ge.renewables.recon.verdict | agrees · differs | chip | components/news/power-grid/RenewablesTab.tsx:1665 |
| ge.renewables.recon.empty | No reconciliation available for this snapshot. | empty-state | components/news/power-grid/RenewablesTab.tsx:1675 |
| ge.renewables.recon.footnote | The band is half of the last digit SREDA prints, once per figure summed — derived from how the source states its numbers, not chosen. {n} check{s} differ — two SREDA pages state a different figure for the same quantity on the same day. Both are shown as published. Neither has been adjusted to match the other, and no third figure has been invented to reconcile them. | footnote | components/news/power-grid/RenewablesTab.tsx:1678-1692 |
| ge.renewables.recon.footer | Source: SREDA NDRE · Recomputed by ESB PowerLine from SREDA's published rows | footnote | components/news/power-grid/RenewablesTab.tsx:1694-1702 |
| ge.renewables.carbon.heading | Energy & Carbon — Projection | heading | components/news/power-grid/RenewablesTab.tsx:1711 |
| ge.renewables.carbon.sub | Modelled projections published by SREDA, not metered generation | label | components/news/power-grid/RenewablesTab.tsx:1712-1714 |
| ge.renewables.carbon.disclaimer | **These are estimates, including the "so far" column.** SREDA heads both of its column groups "Expected Energy Generation" — the figures are modelled from installed capacity and elapsed time, not measured at a meter. SREDA publishes neither the yield assumption nor the emission factor behind them, so they cannot be checked, and they are reproduced verbatim rather than recalculated. The metered renewable output is in the PGCB cards above. | disclaimer | components/news/power-grid/RenewablesTab.tsx:1718-1725 |
| ge.renewables.carbon.headers | Technology · Installed · Expected over system life · Expected CO₂ avoided · Expected so far · Expected CO₂ so far | label | components/news/power-grid/RenewablesTab.tsx:1738-1743 |
| ge.renewables.carbon.footer | Source: SREDA NDRE — Energy Generation and Carbon Savings · SREDA last update: {lastUpdate} | footnote | components/news/power-grid/RenewablesTab.tsx:1767-1775 |
| ge.renewables.glossary.heading | Units on this page · What each abbreviation means, in plain terms | heading | components/news/power-grid/RenewablesTab.tsx:1885-1888 |
| ge.renewables.glossary.groups | Power — how much at one moment · Energy — how much over a period · Carbon · Other terms | label | components/news/power-grid/RenewablesTab.tsx:1797, 1817, 1844, 1859 |
| ge.renewables.glossary.mw | MW — Megawatt. A rate, not an amount — how much electricity is flowing right now. One megawatt is a million watts, roughly the draw of a few hundred homes. | footnote | components/news/power-grid/RenewablesTab.tsx:1799-1803 |
| ge.renewables.glossary.mwp | MWp — Megawatt-peak. The most a solar array can produce under standard test conditions — full sun, cool panel. Real output is lower nearly all the time, so MWp and MW are not the same measure and are never added together here. | footnote | components/news/power-grid/RenewablesTab.tsx:1804-1808 |
| ge.renewables.glossary.kwp | kWp — Kilowatt-peak. One thousandth of a MWp. SREDA prints small installations this way in the same column as large ones, so 292.08 kWp sits beside 43.47 MWp and means far less. | footnote | components/news/power-grid/RenewablesTab.tsx:1809-1813 |
| ge.renewables.glossary.kwh | kWh — Kilowatt-hour — one bar of an electric heater running for an hour. Every unit below is a multiple of it. | footnote | components/news/power-grid/RenewablesTab.tsx:1819-1823 |
| ge.renewables.glossary.mwh | MWh — Megawatt-hour. One thousand kWh. SREDA uses it for its smallest categories. | footnote | components/news/power-grid/RenewablesTab.tsx:1824-1827 |
| ge.renewables.glossary.mkwh | MKWh — Million kilowatt-hours — the unit PGCB uses for a day or a month of generation. Same size as a GWh. | footnote | components/news/power-grid/RenewablesTab.tsx:1828-1832 |
| ge.renewables.glossary.gwh | GWh — Gigawatt-hour. One thousand MWh, and equal to one MKWh. | footnote | components/news/power-grid/RenewablesTab.tsx:1833-1836 |
| ge.renewables.glossary.twh | TWh — Terawatt-hour. One thousand GWh — about a month and a half of Bangladesh's entire electricity generation. | footnote | components/news/power-grid/RenewablesTab.tsx:1837-1841 |
| ge.renewables.glossary.tco2 | tCO₂ — Tonnes of carbon dioxide. Here it means emissions SREDA calculates were avoided by generating with renewables instead of fossil fuel. | footnote | components/news/power-grid/RenewablesTab.tsx:1846-1851 |
| ge.renewables.glossary.ktco2 | k tCO₂ · M tCO₂ — Thousand and million tonnes of CO₂. SREDA abbreviates them this way in its own table. | footnote | components/news/power-grid/RenewablesTab.tsx:1852-1855 |
| ge.renewables.glossary.grid | On-grid · Off-grid — On-grid feeds the national network. Off-grid serves its own site only — a solar home system, an irrigation pump — and never reaches the grid, so it does not appear in PGCB's generation figures. | footnote | components/news/power-grid/RenewablesTab.tsx:1861-1865 |
| ge.renewables.glossary.tkkwh | Tk/kWh — Taka per kilowatt-hour: what a unit of electricity cost to produce. No agency publishes this rate; it is cost divided by energy, which is why it is marked D. | footnote | components/news/power-grid/RenewablesTab.tsx:1866-1870 |
| ge.renewables.glossary.installations | Installations — A count of separate systems, not capacity. Six million solar home systems and fourteen solar parks are both counts, and the two columns cannot be compared. | footnote | components/news/power-grid/RenewablesTab.tsx:1871-1875 |
| ge.renewables.glossary.marks | **Where the marks go.** Every column that states something about a row carries P or D. The first column of each table is the row's own name — the station, technology, organisation, project or year it describes — and is left unmarked, because it identifies the row rather than asserting a figure about it. Chart series carry the mark in the legend. | footnote | components/news/power-grid/RenewablesTab.tsx:1912-1919 |
| ge.renewables.glossary.footer | P a figure the named agency publishes, reproduced unchanged · D a figure we calculated from published figures · Definitions by ESB PowerLine | footnote | components/news/power-grid/RenewablesTab.tsx:1921-1927 |

## Renewables shared — components/news/power-grid/renewables/shared.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.renewables.shared.showmore | Show fewer · Show all {total} {noun} ({hidden} more) | button | components/news/power-grid/renewables/shared.tsx:94-101 |

(Status names in `STATUS_STYLE` — Completed & Running, Implementation Ongoing, Under Maintenance, Under Planning, Obsolete System/Plant, Rejected from Planning/Implementation — are SREDA's own published values rendered as chips via ProjectRegisterCard; keyed there.)

## ProjectRegisterCard — components/news/power-grid/renewables/ProjectRegisterCard.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.renewables.register.heading | Renewable Project Register · {n} projects | heading | components/news/power-grid/renewables/ProjectRegisterCard.tsx:97-100 |
| ge.renewables.register.sub | Each project SREDA lists, with the agency that built it, how it was financed and where it stands | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:101-104 |
| ge.renewables.register.tech-tabs | {technology} {count} | subtab | components/news/power-grid/renewables/ProjectRegisterCard.tsx:109-125 |
| ge.renewables.register.status-filter | All statuses · {status name} {count} | control | components/news/power-grid/renewables/ProjectRegisterCard.tsx:131-161 |
| ge.renewables.register.status-chips | Completed & Running · Implementation Ongoing · Under Maintenance · Under Planning · Obsolete System/Plant · Rejected from Planning/Implementation | chip | components/news/power-grid/renewables/shared.tsx:27-35; ProjectRegisterCard.tsx:252-257 |
| ge.renewables.register.filter.placeholder | Filter project, location, agency | control | components/news/power-grid/renewables/ProjectRegisterCard.tsx:167 |
| ge.renewables.register.filter.aria | Filter projects | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:168 |
| ge.renewables.register.filter.count | Showing {visible} of {total} projects. | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:174-176 |
| ge.renewables.register.filter.clear | Clear filters | button | components/news/power-grid/renewables/ProjectRegisterCard.tsx:185 |
| ge.renewables.register.headers | Project · Capacity · Location · Agency · Financing · Completion · Status | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:194-219 |
| ge.renewables.register.row-sub | SREDA ID {sid} · {technology} | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:226-228 |
| ge.renewables.register.empty | No projects match this filter. | empty-state | components/news/power-grid/renewables/ProjectRegisterCard.tsx:260-265 |
| ge.renewables.register.recon.heading | Reconciled against SREDA's own figures | label | components/news/power-grid/renewables/ProjectRegisterCard.tsx:281-288 |
| ge.renewables.register.recon.count | Projects listed here · {computed} vs {published} in SREDA's "System" headline · agrees / differs | metric | components/news/power-grid/renewables/ProjectRegisterCard.tsx:290-304 |
| ge.renewables.register.recon.capacity | All {n} projects sum · {computed} vs {published} headline · agrees / differs by {delta} | metric | components/news/power-grid/renewables/ProjectRegisterCard.tsx:306-320 |
| ge.renewables.register.recon.running | {n} running project{s} sum · {computed} vs {installed} MWp installed · agrees / differs by {delta} | metric | components/news/power-grid/renewables/ProjectRegisterCard.tsx:322-336 |
| ge.renewables.register.note.running | **Only "Completed & Running" projects are installed capacity.** The register lists every life stage — planning, construction, maintenance, retired, and applications rejected — and that capacity is never added to the totals elsewhere on this page. {technology} lists {n} projects of which {m} is/are running. | footnote | components/news/power-grid/renewables/ProjectRegisterCard.tsx:341-344 |
| ge.renewables.register.note.completion | The **Completion** column is SREDA's commercial operation date. It is achieved only for a running project; on any other status it is a date SREDA records against the project, and can be in the past while the project is still under planning. It is shown as printed. | footnote | components/news/power-grid/renewables/ProjectRegisterCard.tsx:345-350 |
| ge.renewables.register.note.pagination | The register is paginated at {pageSize} projects a page; this view is a single page / all {n} pages were read, and the count above is checked against SREDA's own headline. | footnote | components/news/power-grid/renewables/ProjectRegisterCard.tsx:351-355 |
| ge.renewables.register.footer | Source: SREDA NDRE — RE Large Projects · SREDA last update: {lastUpdate} | footnote | components/news/power-grid/renewables/ProjectRegisterCard.tsx:358-371 |

## YearAttributionNote — components/news/power-grid/renewables/YearAttributionNote.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.renewables.yearnote.heading | What the year column means | heading | components/news/power-grid/renewables/YearAttributionNote.tsx:58-62 |
| ge.renewables.yearnote.backfill | SREDA began operating on 22 May 2014, so it did not record any of this as it happened before that date. {n} MW — {pct}% of the capacity in these two tables — is dated to a year the agency predates, reconstructed from other bodies' records rather than registered at the time. It shows. | disclaimer | components/news/power-grid/renewables/YearAttributionNote.tsx:64-70 |
| ge.renewables.yearnote.kaptai | The 230 MW booked to **1988** is Kaptai, the country's only hydro station and the largest single row here. Its five units came on in three tranches — 2 × 40 MW in 1962, 1 × 50 MW in 1982 and 2 × 50 MW in 1988 — so 100 MW belongs to the year shown and the other 130 MW arrived up to 26 years earlier. The capacity is right and matches SREDA's own hydro total; only the dating is wrong. | disclaimer | components/news/power-grid/renewables/YearAttributionNote.tsx:72-78 |
| ge.renewables.yearnote.wind | The 60 MW Cox's Bazar wind farm is reported both as entering commercial operation on 12 October 2023 and as reaching full output on 8 March 2024, so whichever year it sits in is a choice between two published dates rather than a settled fact. | disclaimer | components/news/power-grid/renewables/YearAttributionNote.tsx:80-84 |
| ge.renewables.yearnote.sources | Rows are left exactly as SREDA prints them. Sources for this note: SREDA, on its own founding; Banglapedia, Karnafuli Hydropower Station; Energy Transition BD, Karnaphuli 230 MW; The Business Standard, first commercial wind plant. Retrieved 18 August 2026. | footnote | components/news/power-grid/renewables/YearAttributionNote.tsx:27-44, 86-97 |

## YearWiseTable — components/news/power-grid/renewables/YearWiseTable.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.renewables.yeartable.heading | {table.category} · {n} years | heading | components/news/power-grid/renewables/YearWiseTable.tsx:28-33 |
| ge.renewables.yeartable.headers | Year · Installations · Capacity | label | components/news/power-grid/renewables/YearWiseTable.tsx:37-49 |
| ge.renewables.yeartable.asprinted-chip | as printed | chip | components/news/power-grid/renewables/YearWiseTable.tsx:61 |
| ge.renewables.yeartable.asprinted-tooltip | SREDA's year column carries this value as printed. It is not a usable year, and the row is left exactly as published rather than reassigned to a date. | tooltip | components/news/power-grid/renewables/YearWiseTable.tsx:59 |
| ge.renewables.yeartable.total-row | Total | label | components/news/power-grid/renewables/YearWiseTable.tsx:83-85 |
| ge.renewables.yeartable.malformed-note | {n} row{s} in SREDA's year column ({values}) is not a usable year / are not usable years. Their capacity is counted in SREDA's own total, so the rows are kept as printed rather than dropped or dated. | footnote | components/news/power-grid/renewables/YearWiseTable.tsx:101-112 |

## PowerStationsTab — components/news/power-grid/PowerStationsTab.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.stations.sort.aria | Sort stations | label | components/news/power-grid/PowerStationsTab.tsx:119 |
| ge.stations.sort.prefix | Sort | control | components/news/power-grid/PowerStationsTab.tsx:128 |
| ge.stations.sort.options | Evening peak · Day peak · Installed MW · Station name | option | components/news/power-grid/PowerStationsTab.tsx:170-175 |
| ge.stations.absent.title | No per-station detail published for {date} | empty-state | components/news/power-grid/PowerStationsTab.tsx:410-412 |
| ge.stations.absent.body | PGCB began including the station-level generation log with its 2025 reports. Earlier days publish system and zone totals only, which are shown on the other tabs. | empty-state | components/news/power-grid/PowerStationsTab.tsx:413-416 |
| ge.stations.table.heading | Power Station Output · {n} stations | heading | components/news/power-grid/PowerStationsTab.tsx:431-434 |
| ge.stations.table.sub | Capacity and actual output at both peaks, as published for {date} | label | components/news/power-grid/PowerStationsTab.tsx:435-437 |
| ge.stations.filter.placeholder | Filter station, fuel, producer | control | components/news/power-grid/PowerStationsTab.tsx:445 |
| ge.stations.table.headers | Station · Fuel · Producer · Installed (MW) · Present (MW) · Day peak (MW) · Evening peak (MW) · Day's energy (MWh) | label | components/news/power-grid/PowerStationsTab.tsx:457-470 |
| ge.stations.table.total-row | All stations | label | components/news/power-grid/PowerStationsTab.tsx:495-497 |
| ge.stations.table.recon | Station totals reconcile with the system figures for this day: {n} MW at day peak against a published {n} MW, and {n} MW at evening peak against {n} MW, and {n} MKWh of energy against a published {n} MKWh. This day's figures come from the report's per-station table, which publishes the evening peak and the day's energy but no day peak. | footnote | components/news/power-grid/PowerStationsTab.tsx:521-546 |
| ge.stations.footer | Source: PGCB Daily Report — {label: P2 sheet, per-station and per-unit table / GenLog sheet, per-station generation log} · Reported day: {isoDate} | footnote | components/news/power-grid/PowerStationsTab.tsx:230-258, 548, 637, 721, 788 |
| ge.stations.fuel.heading | Fleet Utilisation by Fuel · {n} fuels | heading | components/news/power-grid/PowerStationsTab.tsx:559-562 |
| ge.stations.fuel.sub | Evening-peak output against installed capacity, summed from the station rows above | label | components/news/power-grid/PowerStationsTab.tsx:563-565 |
| ge.stations.fuel.headers | Fuel · Stations · Installed (MW) · Evening peak (MW) · Utilisation | label | components/news/power-grid/PowerStationsTab.tsx:572-581 |
| ge.stations.fuel.solar-chip | after sunset | chip | components/news/power-grid/PowerStationsTab.tsx:600 |
| ge.stations.fuel.solar-tooltip | The evening peak is measured after sunset, so a solar station's zero is a real reading — not idle capacity. No evening-peak utilisation is shown for Solar. | tooltip | components/news/power-grid/PowerStationsTab.tsx:595-597 |
| ge.stations.fuel.total-row | All fuels | label | components/news/power-grid/PowerStationsTab.tsx:616-618 |
| ge.stations.fuel.footnote | PGCB publishes each station's capacity and output but no fuel-wise roll-up — every figure here is our sum or quotient of the rows above. Solar stations report a day peak and no evening peak, because the evening peak is measured after sunset. A zero there is a real reading, not a gap, so Solar carries no evening-peak utilisation. | footnote | components/news/power-grid/PowerStationsTab.tsx:630-635 |
| ge.stations.producer.heading | Producer Split · {n} groups | heading | components/news/power-grid/PowerStationsTab.tsx:645-648 |
| ge.stations.producer.sub | PDB, IPPs and the generation companies — share of the fleet's evening-peak output | label | components/news/power-grid/PowerStationsTab.tsx:649-651 |
| ge.stations.producer.headers | Producer · Stations · Installed (MW) · Evening peak (MW) · Share of output | label | components/news/power-grid/PowerStationsTab.tsx:658-667 |
| ge.stations.producer.other | Other producers ({n}) · Not stated | label | components/news/power-grid/PowerStationsTab.tsx:196, 352 |
| ge.stations.producer.total-row | All producers | label | components/news/power-grid/PowerStationsTab.tsx:699-701 |
| ge.stations.producer.footnote | Producer labels are exactly as PGCB prints them on each station row; the sums and shares are ours, computed over the fleet's summed evening-peak output. PGCB publishes no producer-wise total. | footnote | components/news/power-grid/PowerStationsTab.tsx:715-719 |
| ge.stations.genlog.heading | Hourly Station Log · {n} stations | heading | components/news/power-grid/PowerStationsTab.tsx:732-735 |
| ge.stations.genlog.sub | Output every hour for each station, from the NLDC generation log — filtered by your search above | label | components/news/power-grid/PowerStationsTab.tsx:736-739 |
| ge.stations.genlog.headers | Station · {hour columns} · National Grid Total | label | components/news/power-grid/PowerStationsTab.tsx:749-777 |
| ge.stations.derating.heading | Expected Station Derating · {n} of {total} | heading | components/news/power-grid/PowerStationsTab.tsx:797-800 |
| ge.stations.derating.sub | What PGCB expected each station to be able to offer, against what it expected to be able to take — from the projection issued for this day | label | components/news/power-grid/PowerStationsTab.tsx:801-805 |
| ge.stations.derating.summary | Forecast available at evening peak {n} MW · Effective available {n} MW · Held back {n} MW | metric | components/news/power-grid/PowerStationsTab.tsx:815-837 |
| ge.stations.derating.headers | Station · Fuel · Forecast avail. · Effective avail. · Actual · PGCB's reason | label | components/news/power-grid/PowerStationsTab.tsx:850-865 |
| ge.stations.derating.what | Beside each station's actuals, PGCB's daily report prints two projections for the following day: what the station is expected to be able to offer, and what PGCB expects to actually be able to take from it. Only stations where the second is lower are listed here, largest gap first, with PGCB's own remark naming the constraint. The **Actual** column is that station's measured output at the evening peak, so the anticipated constraint can be read against what happened. | disclaimer | components/news/power-grid/PowerStationsTab.tsx:916-927 |
| ge.stations.derating.insight | The two availability sums are not a forecast of system output and are not differenced into one headline here — they sit below both the report's own summary forecast and the day's actual peak. What the per-station view does show is *which fuel* the expected constraint sits in: a day where the derating is concentrated in coal reads very differently from one where it is spread across gas, and no other figure in this archive separates the two. | disclaimer | components/news/power-grid/PowerStationsTab.tsx:928-937 |
| ge.stations.derating.footer | Source: PGCB Daily Report — the Forecast sheet's per-station availability columns, in the report for {issuedOn} · As published by PGCB. Not audited. · Reporting Period: Projection for {targetDay} | footnote | components/news/power-grid/PowerStationsTab.tsx:940-959 |

## ForecastSection — components/news/power-grid/ForecastSection.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.forecast.switch.aria | Which day's forecast comparison to show | label | components/news/power-grid/ForecastSection.tsx:84 |
| ge.forecast.switch.options | {day label} live · {day label} audited | control | components/news/power-grid/ForecastSection.tsx:71-111 |

## ForecastVsActualPanel — components/news/power-grid/ForecastVsActualPanel.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.forecast.settled.heading | Forecast against Outturn | heading | components/news/power-grid/ForecastVsActualPanel.tsx:293-296 |
| ge.forecast.settled.sub | PGCB's projection for {targetDay} issued at {clock} that morning — roughly {n} hours before the evening peak, not a day ahead. / carried by the report for energy day {issuedOn}; this layout prints no generation time, so the lead is unknown. | label | components/news/power-grid/ForecastVsActualPanel.tsx:302-320 |
| ge.forecast.settled.chip | Forecast | chip | components/news/power-grid/ForecastVsActualPanel.tsx:323 |
| ge.forecast.settled.headers | Measure · Forecast · Actual · Difference | label | components/news/power-grid/ForecastVsActualPanel.tsx:339-351 |
| ge.forecast.settled.measures | Peak generation, evening · Peak demand, evening · Peak demand, day · Peak demand (undifferentiated) · Total energy generated · Maximum temperature, Dhaka (units: MW · MKWh · °C) | metric | components/news/power-grid/ForecastVsActualPanel.tsx:230-279 |
| ge.forecast.settled.note.undiff | The 2014 layout forecast a single peak demand without naming day or evening; the actual shown is the evening peak. | footnote | components/news/power-grid/ForecastVsActualPanel.tsx:262 |
| ge.forecast.settled.note.temp | Published on the 2025 layout only. | footnote | components/news/power-grid/ForecastVsActualPanel.tsx:277 |
| ge.forecast.settled.shed.heading | Load shedding expected at the evening peak | label | components/news/power-grid/ForecastVsActualPanel.tsx:396-398 |
| ge.forecast.settled.shed.unread | The area breakdown on this report did not reconcile against its own stated total, so it is not shown. The total below is PGCB's own. | disclaimer | components/news/power-grid/ForecastVsActualPanel.tsx:400-403 |
| ge.forecast.settled.shed.zones | {zone} {n} MW | metric | components/news/power-grid/ForecastVsActualPanel.tsx:405-414 |
| ge.forecast.settled.shed.none | None forecast in any of the nine areas. | empty-state | components/news/power-grid/ForecastVsActualPanel.tsx:416-418 |
| ge.forecast.settled.shed.totals | Forecast total {n} MW · reserve expected at generation end {n} MW · shortage expected at generation end {n} MW | metric | components/news/power-grid/ForecastVsActualPanel.tsx:420-448 |
| ge.forecast.settled.curve.heading | Forecast curve against the measured one | heading | components/news/power-grid/ForecastVsActualPanel.tsx:456-458 |
| ge.forecast.settled.curve.sub | Mean absolute miss {n} MW across {m} forecast hours · widest at {time} ({±n} MW) | metric | components/news/power-grid/ForecastVsActualPanel.tsx:459-477 |
| ge.forecast.settled.workbooks.heading | Where each column comes from — one workbook carries two days | label | components/news/power-grid/ForecastVsActualPanel.tsx:511-513 |
| ge.forecast.settled.workbooks.rows | {workbook} · generated ~{clock} on {day} / filed on {day} · actuals for {day} · projection for {day} · → the Forecast column above · → the Actual column above · The next morning's report | label | components/news/power-grid/ForecastVsActualPanel.tsx:514-533 |
| ge.forecast.settled.what | PGCB publishes two days in every daily report: the reported day's actuals and a projection for the next. This card sets that projection against what the grid then did. The projection is issued at about 10:00 on the morning of the day it describes, so hours marked **past** in the curve had already happened when it was written — they are published figures rather than predictions, and are excluded from the mean miss above. | disclaimer | components/news/power-grid/ForecastVsActualPanel.tsx:537-545 |
| ge.forecast.settled.insight | A miss is shown as a signed difference and nothing more. PGCB forecasts a system it does not fully control — a plant trips, gas runs short, weather moves — so a gap is not in itself a failure of forecasting, and this page does not grade it as one. What the series does support is a question no single day answers: whether the misses lean consistently one way, and whether that lean shifts with the season or the fuel mix. | disclaimer | components/news/power-grid/ForecastVsActualPanel.tsx:547-555 |
| ge.forecast.settled.footer | Source: PGCB Daily Report — the "Forecast Scenario" block / the next-day block of the Forecast sheet in the report for {issuedOn} · As published by PGCB. Not audited. · Workbook acquired from PGCB's ERP portal · Read from a pre-converted text copy — no workbook is held for this day · Reporting Period: Projection for {targetDay}, issued {clock} that day | footnote | components/news/power-grid/ForecastVsActualPanel.tsx:558-592 |

## LiveForecastPanel — components/news/power-grid/LiveForecastPanel.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.forecast.live.heading | Today against Forecast | heading | components/news/power-grid/LiveForecastPanel.tsx:212-215 |
| ge.forecast.live.sub | PGCB's projection for {day} issued at {clock} this morning, against the {n} hours NLDC has posted since. The day is not over and this is not the archive: these figures are replaced by the audited workbook tomorrow. | label | components/news/power-grid/LiveForecastPanel.tsx:216-231 |
| ge.forecast.live.chip | Live | chip | components/news/power-grid/LiveForecastPanel.tsx:234 |
| ge.forecast.live.stat.now.label | Right now · {hour} · Right now · This day has ended | label | components/news/power-grid/LiveForecastPanel.tsx:244-250 |
| ge.forecast.live.stat.now.foot | Dhaka is into {hour} of the following day; the audited workbook follows this morning · NLDC posted {n} MW against {n} forecast · PGCB forecast {n} MW; this hour is not posted yet · waiting for the clock | label | components/news/power-grid/LiveForecastPanel.tsx:253-261 |
| ge.forecast.live.stat.now.value | complete · {±n} MW · not posted yet · — | metric | components/news/power-grid/LiveForecastPanel.tsx:263-276 |
| ge.forecast.live.stat.newest | Newest posted hour · {hour} · {n} forecast, {n} posted · {±n} MW | metric | components/news/power-grid/LiveForecastPanel.tsx:278-289 |
| ge.forecast.live.stat.mean | Mean gap so far · across {n} hours forecast ahead of the clock · {±n} MW | metric | components/news/power-grid/LiveForecastPanel.tsx:290-297 |
| ge.forecast.live.stat.progress | Day so far · {n} of {m} hours in · {k} predate the {clock} stamp, so they are recorded, not forecast · every posted hour was forecast ahead of the clock | metric | components/news/power-grid/LiveForecastPanel.tsx:298-313 |
| ge.forecast.live.table.headers | Hour · When · Forecast gen · Posted gen · Difference · Demand gap | label | components/news/power-grid/LiveForecastPanel.tsx:356-371 |
| ge.forecast.live.table.when | happening now · still to come · before the forecast was filed · posted · due, not posted yet | label | components/news/power-grid/LiveForecastPanel.tsx:390-403 |
| ge.forecast.live.table.absent | awaiting · not posted | empty-state | components/news/power-grid/LiveForecastPanel.tsx:414-422 |
| ge.forecast.live.what | PGCB files a projection for the coming day inside the workbook it publishes each morning — hour by hour generation, demand and load shed. NLDC separately posts what the grid actually did, an hour at a time, on the same portal. This card holds the two against each other while the day is still running, matching only hours that belong to {day}. An hour PGCB projected but NLDC has not yet posted is left blank rather than filled with a zero. | disclaimer | components/news/power-grid/LiveForecastPanel.tsx:437-447 |
| ge.forecast.live.insight | Hours before the {clock} stamp had already happened when the report was generated. They are drawn dashed and unshaded, and kept out of the mean and the widest gap: PGCB published them, but they were never predictions. Everything after it is reported as a signed difference and left there — positive means the grid generated more than was projected for that hour, negative less. Nothing is scored, because PGCB projects a system it does not fully control. The audited figures arrive with tomorrow's workbook and may differ from the hourly page. | disclaimer | components/news/power-grid/LiveForecastPanel.tsx:448-458 |
| ge.forecast.live.footer | PGCB {workbook} · NLDC hourly generation & demand pages · Reporting Period: Projection for {day} | footnote | components/news/power-grid/LiveForecastPanel.tsx:461-469 |

## ForecastCurveCanvas — components/news/power-grid/ForecastCurveCanvas.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.forecast.curve.aria | PGCB forecast generation against measured generation · PGCB's forecast load curve drawn against the measured curve, megawatts by hour | label | components/news/power-grid/ForecastCurveCanvas.tsx:292, 298 |
| ge.forecast.curve.issue-split | already happened · forecast from {clock} | legend | components/news/power-grid/ForecastCurveCanvas.tsx:388-393 |
| ge.forecast.curve.now | now | legend | components/news/power-grid/ForecastCurveCanvas.tsx:442-451 |
| ge.forecast.curve.peak | evening peak | legend | components/news/power-grid/ForecastCurveCanvas.tsx:472-481 |
| ge.forecast.curve.strip-label | miss | axis | components/news/power-grid/ForecastCurveCanvas.tsx:486-488 |
| ge.forecast.curve.hour-ticks | 00:00 … 24:00 (6-hour step) | axis | components/news/power-grid/ForecastCurveCanvas.tsx:530-541 |
| ge.forecast.curve.readout | {time} · already happened · Forecast {n} MW / — · Measured {n} MW / — · Miss {±n} MW | tooltip | components/news/power-grid/ForecastCurveCanvas.tsx:574-605 |
| ge.forecast.curve.key | Forecast · Measured · Grid fell short of forecast · Grid beat forecast · Still ahead of now · 18:30 / 19:30 half-hour reading · Hover for any hour | legend | components/news/power-grid/ForecastCurveCanvas.tsx:609-643 |

## GenerationMixCard — components/news/power-grid/GenerationMixCard.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.mixcard.heading | Daily Generation Mix Snapshot | heading | components/news/power-grid/GenerationMixCard.tsx:52 |
| ge.mixcard.sub | Energy share by fuel type (Total: {n} MKWh) • {coverage label} | label | components/news/power-grid/GenerationMixCard.tsx:56 |
| ge.mixcard.chip | Fuel Type | chip | components/news/power-grid/GenerationMixCard.tsx:59 |
| ge.mixcard.empty | No generation data · No fuel mix recorded for this reporting date. | empty-state | components/news/power-grid/GenerationMixCard.tsx:89-92 |
| ge.mixcard.aria | Daily Generation Mix Snapshot, chart | label | components/news/power-grid/GenerationMixCard.tsx:94, 184 |
| ge.mixcard.tooltip | {fuel} Share · Operational Mix · Energy Output: {n} MKWh · System Share: {pct}% | tooltip | components/news/power-grid/GenerationMixCard.tsx:128-142 |
| ge.mixcard.tooltip.formula | Share = this fuel's published energy ÷ the sum of the published fuel rows, calculated here. | tooltip | components/news/power-grid/GenerationMixCard.tsx:145-147 |
| ge.mixcard.tooltip.source | Source: PGCB Daily Operations Report, zone-wise generation summary · Reproduced as published. Not audited by ESB PowerLine. | tooltip | components/news/power-grid/GenerationMixCard.tsx:148-151 |
| ge.mixcard.donut-centre | {total} · MKWh Gen | metric | components/news/power-grid/GenerationMixCard.tsx:157-178 |
| ge.mixcard.legend | {fuel} {pct}% {n} MKWh | legend | components/news/power-grid/GenerationMixCard.tsx:197-215 |
| ge.mixcard.legend-key | Share (D) · Energy (P) | legend | components/news/power-grid/GenerationMixCard.tsx:220-224 |
| ge.mixcard.footer | Source: PGCB Daily Report — P1 sheet, zone-wise generation summary · Per-fuel energy as published; total and shares are ours. Not independently audited. · Reporting Date: {date} | footnote | components/news/power-grid/GenerationMixCard.tsx:229-234 |

## EnergyCurveChart — components/news/power-grid/EnergyCurveChart.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.energycurve.heading | Generation Mix Through the Day | heading | components/news/power-grid/EnergyCurveChart.tsx:104 |
| ge.energycurve.sub | Every half hour, by fuel, as published in the NLDC daily energy curve (Date: {reportDate}) | label | components/news/power-grid/EnergyCurveChart.tsx:105-107 |
| ge.energycurve.toggle | Show chart · Show table | button | components/news/power-grid/EnergyCurveChart.tsx:120 |
| ge.energycurve.table.headers | Time · {fuel group columns} · Total | label | components/news/power-grid/EnergyCurveChart.tsx:130-141 |
| ge.energycurve.what | PGCB logs national generation every half hour and splits it by fuel. The bands stack to the system total, so the height of the whole is the load curve and the height of each band is what that fuel was carrying at that moment. The report separates public from private plant and names each import line individually; those are grouped here into the same eight fuels used elsewhere on this page, and the underlying split is in the tooltip. | disclaimer | components/news/power-grid/EnergyCurveChart.tsx:206-215 |
| ge.energycurve.insight | Reading it: generation peaked at {time} Hr with {n} MW across {n} fuel{s}. Bands that carried nothing all day are left out rather than drawn flat. | disclaimer | components/news/power-grid/EnergyCurveChart.tsx:206, 216-227 |
| ge.energycurve.footer | Source: PGCB Daily Report — En-Curve sheet, half-hourly generation by fuel · As published. Not independently audited. · Reporting Date: {reportDate} | footnote | components/news/power-grid/EnergyCurveChart.tsx:230-235 |

## GenerationMixCanvas — components/news/power-grid/GenerationMixCanvas.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.genmix.mode.aria | Chart scale | label | components/news/power-grid/GenerationMixCanvas.tsx:312 |
| ge.genmix.mode.options | Megawatts · Share of mix | control | components/news/power-grid/GenerationMixCanvas.tsx:313-320 |
| ge.genmix.shortage-toggle | Show unserved load above the stack | control | components/news/power-grid/GenerationMixCanvas.tsx:322-325 |
| ge.genmix.canvas.aria | Generation mix by fuel on {reportDate} · Generation mix. Use left and right arrow keys to step through the half hours. | label | components/news/power-grid/GenerationMixCanvas.tsx:310, 333 |
| ge.genmix.axis.unit | % · MW · {pct}% ticks / {k} ticks · 00:00 … (3-hour step) | axis | components/news/power-grid/GenerationMixCanvas.tsx:347-359, 390-396 |
| ge.genmix.band-names | {fuel group name, drawn in-band} | legend | components/news/power-grid/GenerationMixCanvas.tsx:376-388 |
| ge.genmix.readout | {time} · {n} MW · pinned · {fuel} {n} {pct}% · {part label} {n} · Unserved load {n} {pct}% | tooltip | components/news/power-grid/GenerationMixCanvas.tsx:415-457 |
| ge.genmix.readout.foot | Shares are each fuel against the half-hour total | tooltip | components/news/power-grid/GenerationMixCanvas.tsx:460-463 |
| ge.genmix.caption | Stacked in dispatch order — always-on plant at the foot, last-resort plant at the top. Hover or use arrow keys · click to pin. | footnote | components/news/power-grid/GenerationMixCanvas.tsx:468-473 |

## LoadCurveCanvas — components/news/power-grid/LoadCurveCanvas.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.loadcurve.aria | 24-hour system load curve for {reportDate} · Load curve. Use left and right arrow keys to step through the hours. | label | components/news/power-grid/LoadCurveCanvas.tsx:457, 463 |
| ge.loadcurve.axis | MW · {12k / 12.5k} value ticks · SHED · peak {n} MW · 00:00 … (3-hour step) | axis | components/news/power-grid/LoadCurveCanvas.tsx:542, 514-521, 595-602, 654-660 |
| ge.loadcurve.flags | Evening peak · Day peak | legend | components/news/power-grid/LoadCurveCanvas.tsx:400-401, 557-565 |
| ge.loadcurve.readout.tags | {time} · half-hour sample · Evening peak / Day peak / Day minimum · pinned | tooltip | components/news/power-grid/LoadCurveCanvas.tsx:692-703, 420-422 |
| ge.loadcurve.readout.met | {pct}% of demand met | tooltip | components/news/power-grid/LoadCurveCanvas.tsx:721-728 |
| ge.loadcurve.readout.rows | Demand {n} MW / — · Generation {n} MW / — · Load shed {n} MW / not published / none · Unmet {n} MW ({pct}% of demand) · Share of day peak {pct}% (peak {n} MW) | tooltip | components/news/power-grid/LoadCurveCanvas.tsx:730-770 |
| ge.loadcurve.key.generation | Generation · peak {n} MW · {time} | legend | components/news/power-grid/LoadCurveCanvas.tsx:785-797 |
| ge.loadcurve.key.demand | Demand · peak {n} MW · {time} | legend | components/news/power-grid/LoadCurveCanvas.tsx:800-813 |
| ge.loadcurve.key.unmet | Unmet demand · widest {n} MW · {time} | legend | components/news/power-grid/LoadCurveCanvas.tsx:815-828 |
| ge.loadcurve.key.shed | Load shed, by hour · not published · none reported all day · worst {n} MW · {time} | legend | components/news/power-grid/LoadCurveCanvas.tsx:830-847 |
| ge.loadcurve.key.halfhour | 19:30 sample · PGCB's extra half-hour reading | legend | components/news/power-grid/LoadCurveCanvas.tsx:849-855 |
| ge.loadcurve.hint | Hover or use arrow keys to read an hour · click to pin | control | components/news/power-grid/LoadCurveCanvas.tsx:857-859 |
| ge.loadcurve.sr-table | Hourly generation, demand and load shedding on {reportDate} · Hour · Generation MW · Demand MW · Load shed MW · not published | label | components/news/power-grid/LoadCurveCanvas.tsx:863-878 |
| ge.loadcurve.sr-summary | Load was shed in {n} of {m} published hours, worst at {time / an unpublished hour} with {n} MW unserved. | label | components/news/power-grid/LoadCurveCanvas.tsx:879-883 |

## InterconnectorCanvas — components/news/power-grid/InterconnectorCanvas.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.interconnector.aria | East-West interconnector transfer on {reportDate} · Interconnector transfer. Use left and right arrow keys to step through the hours. | label | components/news/power-grid/InterconnectorCanvas.tsx:276, 282 |
| ge.interconnector.axis | MW · {k} value ticks · 00:00 … (3-hour step) | axis | components/news/power-grid/InterconnectorCanvas.tsx:331-337, 435-446 |
| ge.interconnector.band-labels | {corridor name, drawn in-band with P mark} | legend | components/news/power-grid/InterconnectorCanvas.tsx:376-393 |
| ge.interconnector.peak-pill | peak {n} MW · {time} | legend | components/news/power-grid/InterconnectorCanvas.tsx:405-432 |
| ge.interconnector.readout | {time} · {n} MW · pinned · {corridor} {n} / — · {pct}% / — | tooltip | components/news/power-grid/InterconnectorCanvas.tsx:462-501 |
| ge.interconnector.caption | Corridors stacked, so the top edge is the whole crossing. Each corridor is PGCB's own column (P); adding them is ours (D). The travelling dots mark the direction of the crossing, west to east — a cue, not a figure: their speed is the same on every corridor and every day. Hover or use arrow keys · click to pin. | footnote | components/news/power-grid/InterconnectorCanvas.tsx:505-511 |

## PublishedVsDerivedTab — components/news/power-grid/PublishedVsDerivedTab.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.pvd.error | Verification data is not available. {error} | error | components/news/power-grid/PublishedVsDerivedTab.tsx:217-226 |
| ge.pvd.coverage.ok | **Checked through {month}.** Current with the newest day the explorer carries ({date}). Last run {date}. | label | components/news/power-grid/PublishedVsDerivedTab.tsx:256-268 |
| ge.pvd.coverage.behind | **Checked through {month}.** The explorer now carries data to {date}, which is past that — so the most recent days on this site have **not been through these checks yet**. Last run {date}. | disclaimer | components/news/power-grid/PublishedVsDerivedTab.tsx:256-268 |
| ge.pvd.kpi.recomputed | Published totals recomputed · {n} · {n} days, {m} months | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:272-278 |
| ge.pvd.kpi.reproduced | Reproduced from source rows · {pct}% · {n} exact, {m} within printing precision | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:279-286 |
| ge.pvd.kpi.defects | Source defects found · {n} · published figure kept as published | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:287-294 |
| ge.pvd.kpi.crossagency | PGCB = BPDB peak · {a}/{b} · two agencies, two formats, same day | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:295-301 |
| ge.pvd.kpi.dual | Read twice, agreed · {n} · days confirmed by two independent engines · {m} withheld | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:302-311 |
| ge.pvd.howto | How to read this · P {index.provenance.P} · D {index.provenance.D} · {index.method} · {index.dual_method} | disclaimer | components/news/power-grid/PublishedVsDerivedTab.tsx:315-329 |
| ge.pvd.monthpicker.tooltip | Dual-parse gated: every day read twice by independent engines, {n} day{s} withheld | tooltip | components/news/power-grid/PublishedVsDerivedTab.tsx:350-352 |
| ge.pvd.daystrip.heading | {month} — operating days | heading | components/news/power-grid/PublishedVsDerivedTab.tsx:379-382 |
| ge.pvd.daystrip.stats | {n} P/D pairs · {m} beyond rounding · {k} defects | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:383-386 |
| ge.pvd.daystrip.tooltip | {date} — {n} pairs, {m} defects | tooltip | components/news/power-grid/PublishedVsDerivedTab.tsx:400 |
| ge.pvd.dual.gate | Dual-parse gated · {monthData.dual.note} | label | components/news/power-grid/PublishedVsDerivedTab.tsx:419-423 |
| ge.pvd.dual.withheld | {date} withheld — engines disagreed on {n} figure{s} ({sources}) · {source} · {figure}: {a} vs {b} — {why} | disclaimer | components/news/power-grid/PublishedVsDerivedTab.tsx:424-443 |
| ge.pvd.day.agency-counts | {agency label} {n} · {m} defect | metric | components/news/power-grid/PublishedVsDerivedTab.tsx:458-465 |
| ge.pvd.day.coverage | Petrobangla page coverage: {n} of {n} words assigned to a named block — nothing on the page is unaccounted for. | footnote | components/news/power-grid/PublishedVsDerivedTab.tsx:467-476 |
| ge.pvd.defect.labels | Present capacity printed above installed capacity · National Grid Total column lags one row · National Grid Total cell holds a corrupt value · Headline figure disagrees with its own plant table · Sub-total carried forward from the previous day | label | components/news/power-grid/PublishedVsDerivedTab.tsx:125-131, 484-486 |
| ge.pvd.defect.corroborated | Corroborated by: {source} | footnote | components/news/power-grid/PublishedVsDerivedTab.tsx:489-493 |
| ge.pvd.filters | All · {agency label} · Hide pairs that agree exactly | control | components/news/power-grid/PublishedVsDerivedTab.tsx:500-524 |
| ge.pvd.omitted-note | {n} of this day's {m} pairs agree to the last printed digit and are counted but not listed individually — the itemised rows below are every disagreement, every pair inside the rounding band, and every geometry-independent check. | footnote | components/news/power-grid/PublishedVsDerivedTab.tsx:526-534 |
| ge.pvd.table.headers | Quantity · Published · Derived · Δ · Terms · Status | label | components/news/power-grid/PublishedVsDerivedTab.tsx:539-550 |
| ge.pvd.status-pills | Exact · Rounding · Defect | chip | components/news/power-grid/PublishedVsDerivedTab.tsx:136-148 |
| ge.pvd.independent-chip | INDEPENDENT | chip | components/news/power-grid/PublishedVsDerivedTab.tsx:557-564 |
| ge.pvd.independent-tooltip | The two sides come from different parts of the document, so this check can fail for reasons other than arithmetic. | tooltip | components/news/power-grid/PublishedVsDerivedTab.tsx:560 |
| ge.pvd.table.empty | Every pair on this day agrees exactly. Untick the filter to see all {n}. | empty-state | components/news/power-grid/PublishedVsDerivedTab.tsx:584-590 |
| ge.pvd.what | Each row is one figure the agency prints (P) beside our recomputation of it from the itemised rows the same document prints above that total (D). Rows marked **INDEPENDENT** compare two different parts of the document — or two different agencies — rather than a total against its own components, so they can catch an error that internally consistent arithmetic cannot. | disclaimer | components/news/power-grid/PublishedVsDerivedTab.tsx:596-606 |
| ge.pvd.insight | A published total that its own rows reproduce is corroborated. Where the two disagree by more than the source's printing precision allows, the published figure is left exactly as published and the disagreement is recorded — this pipeline never edits a source. | disclaimer | components/news/power-grid/PublishedVsDerivedTab.tsx:607-614 |
| ge.pvd.footer | Source: Petrobangla, PGCB (NLDC) and BPDB daily operational reports as published. · Audited by: no third party — these are arithmetic checks against the documents themselves. · Generated {date} | footnote | components/news/power-grid/PublishedVsDerivedTab.tsx:617-623 |

## GlobalVsDomesticCards — components/news/power-grid/GlobalVsDomesticCards.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.brent.heading | Brent Crude vs. Retail Diesel | heading | components/news/power-grid/GlobalVsDomesticCards.tsx:147 |
| ge.macro.brent.sub | Brent Crude (USD/Bbl) vs. Domestic Retail Diesel (Tk/L) — Tracked since 1975 | label | components/news/power-grid/GlobalVsDomesticCards.tsx:148 |
| ge.macro.brent.chip | Petroleum | chip | components/news/power-grid/GlobalVsDomesticCards.tsx:151 |
| ge.macro.brent.tooltip.title | Benchmark Oil Price ({year}) · Oil | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:74-76 |
| ge.macro.brent.tooltip.rows | Brent Crude: ${n} / Bbl · Exchange Rate: {n} Tk/$ · Brent Cost (Tk/L equivalent): {n} Tk/L · BD Retail Diesel: {n} Tk/L · Margin / Subsidy Gap: +{n} Tk/L (Premium) / {n} Tk/L (Subsidized) | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:78-100 |
| ge.macro.brent.tooltip.formula | Formula: (Brent USD * Exchange Rate) / 158.987 L | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:101-103 |
| ge.macro.brent.tooltip.source | Series from: OPEC Bulletin, World Bank Pink Sheet, BPC · Ref: BPC Pricing Gazettes | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:104-107 |
| ge.macro.brent.captions | Brent Crude ($/bbl) · BD Retail Diesel (Tk/L) | axis | components/news/power-grid/GlobalVsDomesticCards.tsx:161-164, 178-181 |
| ge.macro.brent.axes | ${n} / {n} Tk tick formats · axis labels "Brent Crude ($/bbl)" · "Retail Diesel (Tk/L)" | axis | components/news/power-grid/GlobalVsDomesticCards.tsx:170, 187, 201-202 |
| ge.macro.brent.series | Brent Crude ($/bbl) · BD Retail Diesel (Tk/L) | legend | components/news/power-grid/GlobalVsDomesticCards.tsx:172, 189, 205-206 |
| ge.macro.brent.aria | Brent Crude vs. Retail Diesel, chart | label | components/news/power-grid/GlobalVsDomesticCards.tsx:167, 184, 198 |
| ge.macro.brent.datatable | Brent crude against Bangladesh retail diesel, by year · Year · Brent crude (USD per barrel) · BD retail diesel (Tk per litre) | label | components/news/power-grid/GlobalVsDomesticCards.tsx:209-217, 222-230 |
| ge.macro.brent.footer | Source: OPEC Bulletin Historical Spot Prices & BPC Official Pricing Gazettes · As published. Not independently audited. · Reporting Period: Global Comparison (1975 - 2026) | footnote | components/news/power-grid/GlobalVsDomesticCards.tsx:233-237 |
| ge.macro.lng.heading | Global LNG Benchmark vs. Gas Tariff | heading | components/news/power-grid/GlobalVsDomesticCards.tsx:340 |
| ge.macro.lng.sub | Global Gas/LNG (USD/MMBtu) vs. BD Avg Tariff (Tk/CM) — Tracked since 2010 | label | components/news/power-grid/GlobalVsDomesticCards.tsx:341 |
| ge.macro.lng.chip | Natural Gas | chip | components/news/power-grid/GlobalVsDomesticCards.tsx:344 |
| ge.macro.lng.tooltip.title | Benchmark Gas Price ({year}) · Gas | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:262-264 |
| ge.macro.lng.tooltip.rows | Global LNG (US/JKM): ${n} / MMBtu · Exchange Rate: {n} Tk/$ · Global Gas (Tk/CM equivalent): {n} Tk/CM · BD Avg Gas Tariff: {n} Tk/CM · Subsidization Gap: +{n} Tk/CM / {n} Tk/CM (Subsidized) | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:266-288 |
| ge.macro.lng.tooltip.formula | Formula: (Global LNG USD * Exchange Rate) / 28.3 CM | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:289-291 |
| ge.macro.lng.tooltip.source | Series from: World Bank Pink Sheet, JKM Index, Petrobangla · Ref: Petrobangla Audited Reports | tooltip | components/news/power-grid/GlobalVsDomesticCards.tsx:292-295 |
| ge.macro.lng.captions | Global LNG ($/MMBtu) · BD Avg Gas Tariff (Tk/CM) | axis | components/news/power-grid/GlobalVsDomesticCards.tsx:354-357, 371-374 |
| ge.macro.lng.axes | ${n} / {n} Tk tick formats · axis labels "Global LNG ($/MMBtu)" · "BD Avg Gas Tariff (Tk/CM)" | axis | components/news/power-grid/GlobalVsDomesticCards.tsx:363, 380, 394-395 |
| ge.macro.lng.series | Global LNG ($/MMBtu) · BD Avg Gas Tariff (Tk/CM) | legend | components/news/power-grid/GlobalVsDomesticCards.tsx:365, 382, 398-399 |
| ge.macro.lng.aria | Global LNG Benchmark vs. Gas Tariff, chart | label | components/news/power-grid/GlobalVsDomesticCards.tsx:360, 377, 391 |
| ge.macro.lng.datatable | Global LNG benchmark against Bangladesh average gas tariff, by year · Year · Global LNG (USD per MMBtu) · BD average gas tariff (Tk per cubic metre) | label | components/news/power-grid/GlobalVsDomesticCards.tsx:402-410, 413-421 |
| ge.macro.lng.footer | Source: World Bank Pink Sheets & Petrobangla Annual Reports · As published. Not independently audited. · Reporting Period: Global Comparison (2010 - 2026) | footnote | components/news/power-grid/GlobalVsDomesticCards.tsx:424-428 |

## LongitudinalStudy — components/news/power-grid/LongitudinalStudy.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.study.tooltip.frame | {label / Data Point} · {title} · {series name} {value} {unit} / N/A | tooltip | components/news/power-grid/LongitudinalStudy.tsx:151-173 |
| ge.study.tooltip.source | Source: {source} · As published. Not independently audited. | tooltip | components/news/power-grid/LongitudinalStudy.tsx:179-190 |
| ge.study.tooltip.titles | Voltage Evolution · Cumulative Capacity · Annual Physical Additions · Growth Index (FY11=100) | tooltip | components/news/power-grid/LongitudinalStudy.tsx:208, 219, 231, 242 |
| ge.study.tooltip.calculations | Stack: 132kV + 230kV + 400kV total circuit kilometers · Transmission Added = Total ckm (Current Year) - Total ckm (Previous Year) \| Gen Capacity Added = Installed MW (Current) - Installed MW (Previous) · Index = (Current Value / FY2011 Value) * 100 | tooltip | components/news/power-grid/LongitudinalStudy.tsx:221, 232, 244 |
| ge.study.tooltip.sources | PGCB System Statistics Division · PGCB System Planning Maps · PGCB & BPDB Progress Reports · Ministry of Finance Budget Briefs & PGCB / BPDB Reports | tooltip | components/news/power-grid/LongitudinalStudy.tsx:210, 222, 233, 245 |

## LongitudinalStudyCards — components/news/power-grid/LongitudinalStudyCards.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.study.voltage.heading | Network Evolution by Voltage Level | heading | components/news/power-grid/LongitudinalStudyCards.tsx:68 |
| ge.study.voltage.sub | Growth trajectories of ultra-high vs high voltage transmission corridors • Tracked since FY 2011 | label | components/news/power-grid/LongitudinalStudyCards.tsx:69 |
| ge.study.voltage.chip | Voltage Mix | chip | components/news/power-grid/LongitudinalStudyCards.tsx:72 |
| ge.study.voltage.legend | 400kV Ultra-High · 230kV Corridor · 132kV Corridor | legend | components/news/power-grid/LongitudinalStudyCards.tsx:76-80, 87-89 |
| ge.study.voltage.aria | Network Evolution by Voltage Level, chart | label | components/news/power-grid/LongitudinalStudyCards.tsx:82 |
| ge.study.voltage.datatable | Network evolution by voltage level: transmission circuit kilometers per fiscal year. The 400/230/132 kV split is PGCB-published for six of these years and apportioned from the published total for the rest. · Fiscal year · (ckm series) | label | components/news/power-grid/LongitudinalStudyCards.tsx:94-104 |
| ge.study.voltage.what | **400kV (Ultra-High Voltage Backbone):** The backbone transmission lines built to import electricity (e.g., cross-border interconnections) and evacuate power from mega-generation stations (e.g., Payra, Rampal, Rooppur). This was zero prior to FY2014. · **230kV Corridor:** Regional transmission corridors linking major generation hubs to city gate stations. · **132kV Corridor:** Municipal transmission corridors delivering power to distribution grids. It remains the largest network by total physical length. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:108-116 |
| ge.study.voltage.insight | The rapid growth of 400kV lines since 2014 reflects a major structural shift toward mega-capacity corridors to handle bulk coal power plants and cross-border imports. However, the slower expansion of regional 132kV networks creates local distribution bottlenecks, preventing generated power from efficiently reaching rural and industrial endpoints. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:117-122 |
| ge.study.voltage.footer | Source: PGCB Annual Progress Reports · Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout. · Reporting Period: FY 2011 - FY 2025 | footnote | components/news/power-grid/LongitudinalStudyCards.tsx:125-129 |
| ge.study.buildout.heading | Cumulative Grid Build-out | heading | components/news/power-grid/LongitudinalStudyCards.tsx:142 |
| ge.study.buildout.sub | Stacked area showing historical carrying capacity composition • Tracked since FY 2011 | label | components/news/power-grid/LongitudinalStudyCards.tsx:143 |
| ge.study.buildout.chip | Grid Composition | chip | components/news/power-grid/LongitudinalStudyCards.tsx:146 |
| ge.study.buildout.legend | 132kV Base · 230kV Main · 400kV Ultra | legend | components/news/power-grid/LongitudinalStudyCards.tsx:150-154, 161-163 |
| ge.study.buildout.aria | Cumulative Grid Build-out, chart | label | components/news/power-grid/LongitudinalStudyCards.tsx:156 |
| ge.study.buildout.datatable | Cumulative grid build-out: transmission circuit kilometers by voltage band per fiscal year. The 400/230/132 kV split is PGCB-published for six of these years and apportioned from the published total for the rest. · Fiscal year · (ckm series) | label | components/news/power-grid/LongitudinalStudyCards.tsx:168-178 |
| ge.study.buildout.what | **132kV Base Grid:** The regional transmission standard, delivering power to municipal substations. It remains the largest network by total physical length, starting from ~6,000 ckm in 2011. · **230kV Main Grid:** The primary inter-district transmission highway carrying medium loads between cities. · **400kV Ultra Backbone:** The modern bulk evacuation channels built since FY2014 to transport energy from remote mega power hubs and cross-border imports. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:181-189 |
| ge.study.buildout.insight | Although the total carrying capacity has nearly doubled (from 8,396 ckm in 2011 to 15,688 ckm in 2025), the grid remains structurally fragile. The high-capacity **400kV Ultra Backbone** accounts for only ~20% of the total network. Over 50% of power transport is still dependent on the older, lower-voltage **132kV Base Grid**. This reliance on low-voltage transmission over long distances leads to high technical system losses, line overloads, and localized grid instability when major power plants trip. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:190-195 |
| ge.study.buildout.footer | Source: PGCB Transmission System Studies · Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout. · Reporting Period: FY 2011 - FY 2025 | footnote | components/news/power-grid/LongitudinalStudyCards.tsx:198-202 |
| ge.study.pace.heading | Transmission Expansion Pace | heading | components/news/power-grid/LongitudinalStudyCards.tsx:215 |
| ge.study.pace.sub | New circuit km added to the national grid per year • Tracked since FY 2011 | label | components/news/power-grid/LongitudinalStudyCards.tsx:216 |
| ge.study.pace.chip | Expansion Rate | chip | components/news/power-grid/LongitudinalStudyCards.tsx:219 |
| ge.study.pace.legend | Grid Lines Added (D) · Gen Cap. Added (D) | legend | components/news/power-grid/LongitudinalStudyCards.tsx:223-226, 234-235 |
| ge.study.pace.aria | Transmission Expansion Pace, chart | label | components/news/power-grid/LongitudinalStudyCards.tsx:228 |
| ge.study.pace.datatable | Transmission expansion pace: year-on-year additions, differenced here from PGCB and BPDB published totals. PGCB publishes the totals, not the additions. · Fiscal year · Grid Lines Added (ckm) · Gen Cap. Added (MW) | label | components/news/power-grid/LongitudinalStudyCards.tsx:240-249 |
| ge.study.pace.what | **Grid Lines Added (ckm):** Represents the net circuit-kilometers of transmission lines commissioned by PGCB in each fiscal year. · **Gen Capacity Added (MW):** Represents the net generation capacity added to the national grid in megawatts each fiscal year. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:253-259 |
| ge.study.pace.insight | Comparing grid additions with generation additions exposes a massive decoupling. In peak years (e.g. FY2019 and FY2023), generation additions surged by 2,000+ MW while grid expansion remained cyclical and volatile. This structural delay forces the grid to bottleneck, stranding generation surplus at remote power hubs (like Payra and Rampal) because the corresponding transmission lines are not completed in time. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:260-265 |
| ge.study.pace.footer | Source: PGCB Project Audit Summaries · Differenced here from PGCB's published totals. PGCB publishes the totals, not the year-on-year additions. · Reporting Period: FY 2012 - FY 2025 | footnote | components/news/power-grid/LongitudinalStudyCards.tsx:268-272 |
| ge.study.index.heading | Long-term Trajectories (Indexed) | heading | components/news/power-grid/LongitudinalStudyCards.tsx:285 |
| ge.study.index.sub | Base Year FY2011 = 100 for true comparative percentage growth • Tracked since FY 2011 | label | components/news/power-grid/LongitudinalStudyCards.tsx:286 |
| ge.study.index.chip | Index Baseline | chip | components/news/power-grid/LongitudinalStudyCards.tsx:289 |
| ge.study.index.legend | Budget Index (D) · Gen. Cap. Index (D) · Peak Demand Index (D) · Transmission Index (D) | legend | components/news/power-grid/LongitudinalStudyCards.tsx:293-298, 305-308 |
| ge.study.index.aria | Long-term Trajectories (Indexed), chart | label | components/news/power-grid/LongitudinalStudyCards.tsx:300 |
| ge.study.index.datatable | Long-term trajectories indexed to FY2011 = 100, calculated here from published figures. Index = (current value / FY2011 value) x 100. · Fiscal year · (index % series) | label | components/news/power-grid/LongitudinalStudyCards.tsx:313-324 |
| ge.study.index.what | **Structural Decoupling in the Power Sector** — This chart indexes all metrics to **FY2011 = 100** to compare their relative growth rates. It highlights a critical structural decoupling in Bangladesh's energy infrastructure: **Fiscal Allocation:** The Power Division budget has skyrocketed by **594.8%**, representing massive capital injection. **Installed Generation:** Total generation capacity has increased by **380.0%**, leading to substantial generation surplus. **Peak Demand:** Peak load utilized by the grid grew by **337.1%**, demonstrating solid consumption demand. **Transmission Lines:** The transmission network has lagged far behind, expanding by only **186.8%**. This gap explains why Bangladesh experiences load shedding and grid vulnerability despite having surplus generation capacity. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:327-342 |
| ge.study.index.insight | The indexed trajectories expose a severe mismatch in asset prioritization. While the fiscal budget grew 6-fold (594.8%) and generation capacity expanded by 380.0% (closely matching peak demand growth at 337.1%), the transmission network only expanded by 186.8%. This massive divergence indicates that capital allocation was heavily diverted toward paying capacity charges for underutilized private generators and fuel import subsidies, rather than building the necessary grid infrastructure to evacuate and distribute power safely. | disclaimer | components/news/power-grid/LongitudinalStudyCards.tsx:343-348 |
| ge.study.index.footer | Source: MOF Budget Briefs & BPDB/PGCB Statistics · As published. Not independently audited. · Reporting Period: FY 2011 - FY 2025 Baseline Study | footnote | components/news/power-grid/LongitudinalStudyCards.tsx:351-355 |

## Files with locations resolved by Glob

GridLngTariffCard and GridBrentDieselCard live inside `components/news/power-grid/GlobalVsDomesticCards.tsx` (no standalone files). LiveForecastPanel, ForecastVsActualPanel, ForecastCurveCanvas and GenerationMixCanvas are standalone files under `components/news/power-grid/` and are inventoried above. No named file was missing.
## Gas tab — components/news/power-grid/GasTab.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.tab.pre2020.heading | Petrobangla Gas Production & Distribution Data | heading | GasTab.tsx:183 |
| ge.gas.tab.pre2020.body | No official records are available for the selected date. Petrobangla gas production tracking officially started on January 12, 2020. | empty-state | GasTab.tsx:185 |
| ge.gas.tab.pre2020.footnote | Official Backlog Start Date: January 12, 2020 | footnote | GasTab.tsx:187 |
| ge.gas.tab.nodata.heading | Petrobangla Gas & LNG Supply | heading | GasTab.tsx:200 |
| ge.gas.tab.nodata.body | PGCB grid data is available for this date, but Petrobangla production and distribution tables are missing from the daily record. Re-run the official ingest when Petrobangla reports are online. | empty-state | GasTab.tsx:202 |
| ge.gas.tab.reportCaption | Report: {report_date_label} — 8:00 AM → 8:00 AM gas day, archived under its start date / end date / file date ({gasDay}) • nearest report to your selected date | label | GasTab.tsx:161-171 |
| ge.gas.tab.production.heading | Daily Gas & Condensate Production | heading | GasTab.tsx:232 |
| ge.gas.tab.production.sub | Petrobangla Production & Marketing Division Report • {coverageLabel} · Click a company for per-field detail | label | GasTab.tsx:236-238 |
| ge.gas.tab.production.list.ariaLabel | Daily gas and condensate production by company | label | GasTab.tsx:257 |
| ge.gas.tab.production.cols | Field / Company Operator · Gas Produced (MMCFD) · Condensate Produced (BBL) · National Gas Share | label | GasTab.tsx:282-292 |
| ge.gas.tab.production.row.figures | Gas (MMCFD) · Condensate (BBL) · National share · — | label | GasTab.tsx:335-356 |
| ge.gas.tab.production.total | Grand Total Production · Gas (MMCFD) · Condensate (BBL) · National share 100.0% | label | GasTab.tsx:385-394 |
| ge.gas.tab.reconcile | Company rows sum · {sum} vs {grand} MMCFD published by Petrobangla · agrees / differs by {±delta} | metric | GasTab.tsx:419-432 |
| ge.gas.tab.reconcile.footnote | Petrobangla's own grand total is the figure to trust here. The company rows above are summed from the report's per-field lines by the grid parser, and on this day that sum does not reproduce the total the same report prints. | footnote | GasTab.tsx:438-441 |
| ge.gas.tab.production.explain.what1 | This table displays the daily gas volume (MMCFD) and associated condensate liquids (BBL) produced by local gas fields and foreign operators (Chevron, Tullow), alongside imported liquefied natural gas (LNG) regasified into the grid. | disclaimer | GasTab.tsx:450 |
| ge.gas.tab.production.explain.what2 | Analytical Insight: Chevron (operating the Bibiyana field) remains the dominant producer … highlights the urgency of expanding national exploration or gas import capacity. | disclaimer | GasTab.tsx:451 |
| ge.gas.tab.production.explain.what3 | How Petrobangla calculates this: Each report covers an 8:00 AM → 8:00 AM "gas day" and is dated by the morning it closes … so summing that printed column can drift a few tenths from the official subtotal. | disclaimer | GasTab.tsx:452 |
| ge.gas.tab.production.footer | Source: Petrobangla Production Reports · As published. Not independently audited. · Reporting Period: Daily Field Snapshot (Date: {gasReportDate}) | footnote | GasTab.tsx:459-465 |
| ge.gas.tab.distribution.heading | Sectorwise Gas Distribution | heading | GasTab.tsx:474 |
| ge.gas.tab.distribution.sub | Allocated supply (MMCFD) across regional gas distributors • {coverageLabel} · Click a distributor for per-plant detail | label | GasTab.tsx:478-480 |
| ge.gas.tab.distribution.list.ariaLabel | Daily gas distribution by distributor | label | GasTab.tsx:499 |
| ge.gas.tab.distribution.cols | Distributor · Power Grid Supply · Fertilizer Supply · Industrial / Others · Total Gas Distributed | label | GasTab.tsx:504-518 |
| ge.gas.tab.distribution.row.figures | Power grid · Fertilizer · Industrial / others · Total distributed | label | GasTab.tsx:562-568 |
| ge.gas.tab.distribution.total | National Total Supply · Power grid · Fertilizer · Industrial / others · Total distributed | label | GasTab.tsx:602-608 |
| ge.gas.tab.distribution.explain.what1 | This table tracks the distribution of natural gas across different sectors (power grid generators, fertilizer plants, and industrial/domestic consumers) by regional distribution utilities. | disclaimer | GasTab.tsx:619 |
| ge.gas.tab.distribution.explain.what2 | Analytical Insight: Natural gas distribution is heavily skewed toward the power sector and industrial customers. Titas Gas (TGTDCL) remains the largest distributor by volume … | disclaimer | GasTab.tsx:620 |
| ge.gas.tab.distribution.explain.what3 | How Petrobangla calculates this: In the per-plant detail, "demand" is each plant's nominal gas requirement at full output and "supply" is the metered delivery … the True Power-Gas Gap KPI above is measured against that adjusted demand, not the raw plant total. | disclaimer | GasTab.tsx:621 |
| ge.gas.tab.footnote.glossary | Gas Sector Acronyms & Units Footnote: MMCFD · BBL (Barrel of Oil) · LNG (Liquefied Natural Gas) · BGFCL / SGFL / BAPEX · TGTDCL / BGDCL / KGDCL · RPGCL (+ definitions) | footnote | GasTab.tsx:628-653 |
| ge.gas.tab.distribution.footer | Source: Petrobangla Distribution Reports · As published. Not independently audited. · Reporting Period: Daily Distribution Allocation (Date: {gasReportDate}) | footnote | GasTab.tsx:660-666 |

## Gas tab shared — GasTabShared.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.shared.footnote.glossary | Gas Sector Acronyms & Units: MMCFD · BBL · LNG · BGFCL / SGFL / BAPEX · TGTDCL / BGDCL / KGDCL · RPGCL (+ definitions, duplicates GasTab.tsx:628-653) | footnote | GasTabShared.tsx:50-75 |
| ge.gas.shared.layerpills | Daily Snapshot · Live Week · Field Archive | subtab | GasTabShared.tsx:83-85 |
| ge.gas.shared.hero.title.macro | Field Production Archive & Depletion Evidence | heading | GasTabShared.tsx:112 |
| ge.gas.shared.hero.title.gas | Gas & LNG Intelligence Stack | heading | GasTabShared.tsx:112 |
| ge.gas.shared.hero.sub.macro | Verified Petrobangla daily reports — rolling live week plus 2,000+ day archive — showing how domestic output, LNG imports, and power-sector rationing evolve as recoverable reserves shrink toward 2033–2040 exhaustion scenarios above. Reporting window: 8:00 AM → 8:00 AM gas-day · Grid report {date} | disclaimer | GasTabShared.tsx:117-119 |
| ge.gas.shared.hero.sub.gas | Three official Petrobangla layers — PGCB daily tables, rolling 7-day live week, and a 2,000+ day field archive — unified under the grid date selector above. Reporting window: 8:00 AM → 8:00 AM gas-day · Grid report {date} | disclaimer | GasTabShared.tsx:123-125 |
| ge.gas.shared.hero.audienceMode.label | Audience mode | label | GasTabShared.tsx:134 |
| ge.gas.shared.hero.note.macro | Tcf reserve forecasts above are basin-level estimates; this archive is day-by-day proof of declining field output and rising LNG dependency. Official reports from {link}. | disclaimer | GasTabShared.tsx:159-161 |
| ge.gas.shared.hero.note.gas | PGCB grid totals and Petrobangla field totals use different reporting layers. Daily tables mirror the PGCB daily record; Live Week and Archive are authoritative for field, plant, and sector detail from {link}. | disclaimer | GasTabShared.tsx:163-165 |

## GasReserveArchiveContext.tsx · GasReserveArchiveViewTabs.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archctx.pill | Grid date {gridDate} / Nearest gas-day {archiveDate} · Synced | chip | GasReserveArchiveContext.tsx:35-36 |
| ge.gas.archctx.peak | Archive peak · {n} MMCFD · {date} | metric | GasReserveArchiveContext.tsx:44-46 |
| ge.gas.archctx.low | Archive low · {n} MMCFD · {date} | metric | GasReserveArchiveContext.tsx:54-56 |
| ge.gas.archctx.decline | Since Jan 2020 · −{pct}% · National output | metric | GasReserveArchiveContext.tsx:63-65 |
| ge.gas.archtabs.ariaLabel | Archive views | label | GasReserveArchiveViewTabs.tsx:22 |
| ge.gas.archtabs.items | National Timeline (Timeline) · Field Lifelines (Fields) · Power Gas Gap (Power) · Who Gets Gas (Sectors) · Compare Days (Compare) | subtab | GasReserveArchiveViewTabs.tsx:8-12 |

## Gas reserve depletion — GasReserveDepletionTab.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.reserve.hero.eyebrow | Macro reserves | label | GasReserveDepletionTab.tsx:156 |
| ge.gas.reserve.hero.title | Gas Reserve Depletion | heading | GasReserveDepletionTab.tsx:157 |
| ge.gas.reserve.hero.sub.loaded | Once a year Petrobangla says how much gas is left in each field. Every morning it says how much came out. Put the two together, field by field, and you can watch the country's gas run down in real time — {archive_days} daily reports against the reserve statement of {as_of}. | disclaimer | GasReserveDepletionTab.tsx:161-165 |
| ge.gas.reserve.hero.sub.loading | Domestic recoverable gas is finite, and both halves of that — how much is left, and how fast it is leaving — are published. | disclaimer | GasReserveDepletionTab.tsx:167 |
| ge.gas.reserve.hero.chip.risk | Structural risk | chip | GasReserveDepletionTab.tsx:172 |
| ge.gas.reserve.metrics | Left in producing fields (Tcf) · Reserve replacement (%) · Output halves by · New gas needed to hold flat (Tcf) — with hints ("{Tcf} Tcf booked on {date}, less {BCF} BCF metered since"; "of what was produced was added back, latest full year. Below 100% an operator is living off its balance sheet"; "{rate} → {rate5yr} MMCFD in five years, if the booked reserve is right"; "over ten years — {x}× what is left in Bibiyana") | metric | GasReserveDepletionTab.tsx:293-326 |
| ge.gas.reserve.chart.head | Reserve depletion trajectory · Production stacked by field, history and forecast, with what is left above it · {pct}% of today's output is the six fields named | heading | GasReserveDepletionTab.tsx:185-189 |
| ge.gas.reserve.legend | Measured — published reserve, metered production · Reserve left if the booked 2P holds · Reserve left if the measured decline holds · Straight-line answer (for contrast) | legend | GasReserveDepletionTab.tsx:208-214 |
| ge.gas.reserve.chart.failed | The reserve model could not be loaded. Nothing is shown rather than a trajectory built from something else. | error | GasReserveDepletionTab.tsx:224-226 |
| ge.gas.reserve.footer | Source: Petrobangla — {table}, pp. {pages}; daily gas reports {yr}–present · Petrobangla / Archive ({count} daily gas reports) · Reserve and production figures as published; the balance, the fits and every projection are ours. Not independently audited, and not put to Petrobangla for comment. · Model as of {date} · sources retrieved {RETRIEVED} | footnote | GasReserveDepletionTab.tsx:237-262 |
| ge.gas.reserve.ladder | This panel — what is left, and for how long · National Timeline — what has actually happened · Field evidence — what happened this week (+ bodies) | heading | GasReserveDepletionTab.tsx:374-398 |
| ge.gas.reserve.confidence | Add up the daily reports and you get Petrobangla's own annual production figure back to within {pct}%, and the Hydrocarbon Unit's separately published total to within 0.10%. Nothing in this model is tuned to make that happen. · See the checks → | disclaimer | GasReserveDepletionTab.tsx:415-421 |
| ge.gas.reserve.howtoread | If the booked 2P holds · If the measured decline holds · The straight-line answer (+ bodies with {rate}/{bcf}/{years} interpolations) | label | GasReserveDepletionTab.tsx:433-460 |
| ge.gas.reserve.evidence.views | Method (the documents, the decline law, and what is deliberately left out) · Field by field (all 20 producing fields, each measured against what it has booked) · Checks & comparisons (the back-test, and how this lands against everyone else's numbers) | subtab | GasReserveDepletionTab.tsx:471-482 |
| ge.gas.reserve.evidence.intro | Everything behind the chart — what went in, what each field is doing, and how this compares with every other published figure. | label | GasReserveDepletionTab.tsx:504-507 |
| ge.gas.reserve.method.steps | What goes in · The pattern: Arps exponential decline (q(t) = q₀ · e⁻ᴰ·ᵗ) · Why there are two answers (D_required = q₀ × 365.25 ÷ remaining reserve) · What is chosen, and what it is worth · Not modelled (incl. "demand — this is a supply projection …") | heading | GasReserveDepletionTab.tsx:567-659 |
| ge.gas.reserve.sens.table | Choice · Output at +5 yr · at +10 yr · vs published · Published model (36-month window · R² 0.5 · exponential (Arps b=0) · 1 MMCFD floor) · foot: "Across every variation output at +10 years runs {lo}–{hi} MMCFD …" | label | GasReserveDepletionTab.tsx:689-731 |
| ge.gas.reserve.verdicts | past its booking · no usable fit · — · booking needs a steeper fall · falling faster than booked · consistent | label | GasReserveDepletionTab.tsx:739-745 |
| ge.gas.reserve.concentration | How concentrated this is · {field}, share of national output {pct}% · Top three fields {pct}% · {field} at today's rate {years} yr · Fields carrying the other half {n} | metric | GasReserveDepletionTab.tsx:755-767 |
| ge.gas.reserve.fields.intro | Two numbers describe every field here, and they come from different places … almost all of it sits in one field. | label | GasReserveDepletionTab.tsx:778-782 |
| ge.gas.reserve.fields.table.cols | Field · Now (MMCFD) · Share · Booked left (BCF) · Measured decline (%/yr) · Fit (R²) · 2P implies (%/yr) · Reading · suspended · nil · flat/rising · unfittable · — | label | GasReserveDepletionTab.tsx:790-823 |
| ge.gas.reserve.fields.foot | {mmcfd} MMCFD is produced from fields booked at nil remaining reserve. Habiganj is the bulk of it … excluded from the reserve balance, where nothing published supports a figure. | footnote | GasReserveDepletionTab.tsx:838-846 |
| ge.gas.reserve.checks.backtest | The back-test (lead + cols Fiscal year · Petrobangla booked · This archive · Difference · Reserve replacement + note on reserve replacement ratio) | heading | GasReserveDepletionTab.tsx:890-939 |
| ge.gas.reserve.checks.compare | Against everyone else who has published a number (lead + cols Source · Their figure · This model · Independence; chips same source / separate publication / independent method with notes; footnote "The reserve-life figures in circulation — eight years, ten, twelve — all divide a stock by today's rate …") | heading | GasReserveDepletionTab.tsx:943-1000 |
| ge.gas.reserve.sources | Sources · Everything this panel rests on, and whether we opened it ourselves. External sources retrieved {RETRIEVED}. (+ per-citation roles) | heading | GasReserveDepletionTab.tsx:1025-1067 |
| ge.gas.reserve.replacement | What is replacing it (lead with {n} MMCFD interpolations; cols Year · Domestic (MMCFD) · Imported (RLNG) (MMCFD) · Imported share · Days metered; note "And the hole still to fill: {lo}–{hi} MMCFD by year ten …") | heading | GasReserveDepletionTab.tsx:1093-1147 |
| ge.gas.reserve.limits | What this panel does not answer (lead) · Q/A ×6: What will the replacement cost? · What if new gas is found? · Can they not just drill more wells? · Why 2P and not proved reserves? · What does it mean for power cuts or tariffs? · Has Petrobangla been asked to comment? | heading | GasReserveDepletionTab.tsx:1162-1201 |

## ReserveTrajectoryCanvas.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.rtraj.ariaLabel.figure | Gas reserve depletion and field production profile | label | ReserveTrajectoryCanvas.tsx:350 |
| ge.gas.rtraj.ariaLabel.canvas | Reserve depletion. Use left and right arrow keys to move through the years. | label | ReserveTrajectoryCanvas.tsx:356 |
| ge.gas.rtraj.axis | Tcf left · MMCFD · {t/1000}k | axis | ReserveTrajectoryCanvas.tsx:415-427 |
| ge.gas.rtraj.divider | projected → · ← measured | label | ReserveTrajectoryCanvas.tsx:465-469 |
| ge.gas.rtraj.plotnotes | Petrobangla states this once a year — the archive holds it from 2023 · every booked BCF produced · {year} · {n} MMCFD to replace by {year} · Metered every day since 2020 · {month}: −{pct}% for one month, back by {month} · output halved · {year} | footnote | ReserveTrajectoryCanvas.tsx:505-557 |
| ge.gas.rtraj.readout | {n} MMCFD · pinned · {Tcf} Tcf left if the booked 2P holds · {Tcf} Tcf if the measured decline does · Petrobangla daily gas report, field by field | metric | ReserveTrajectoryCanvas.tsx:587-614 |
## Gas · Petrobangla archive — PetrobanglaArchivePanel.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archive.panel.loading-index | Loading field archive index… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:135 |
| ge.gas.archive.panel.error | Archive unavailable: {error ?? 'missing data'} | error | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:144 |
| ge.gas.archive.panel.no-archive | No archive for {selectedDate}. Coverage starts {ARCHIVE_START_DATE} — use the date selector above. | empty-state | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:153 |
| ge.gas.archive.panel.anchors.label | Verified anchors: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:171 |
| ge.gas.archive.panel.anchors.peak | Peak {peakAnchor.gas.toFixed(1)} MMCFD ({peakAnchor.date}) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:171 |
| ge.gas.archive.panel.anchors.low | · Low {timeline.low.gas.toFixed(1)} MMCFD ({timeline.low.date}) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:173 |
| ge.gas.archive.panel.anchors.baseline | · Jan 2020 {ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD → Jun 2026 {ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD ({ARCHIVE_INSIGHTS.nationalDecline.pct}%). | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:175 |
| ge.gas.archive.panel.kpi-row.eyebrow | Petrobangla Gas Analytics | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:215 |
| ge.gas.archive.panel.kpi-row.since | since 2020 | chip | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:219 |
| ge.gas.archive.panel.kpi-row.loading | Loading archive index… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:238 |
| ge.gas.archive.panel.sync-line.synced | Synced to grid date {selectedDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:246 |
| ge.gas.archive.panel.sync-line.nearest | Showing gas-day {archiveDate} (nearest to {selectedDate}) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:247 |
| ge.gas.archive.panel.sync-line.window | · 8:00 AM → 8:00 AM | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:248 |
| ge.gas.archive.panel.view.timeline.loading | Loading national timeline… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:282 |
| ge.gas.archive.panel.view.fields.loading | Loading field lifelines… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:307 |
| ge.gas.archive.panel.view.power-gap.loading | Loading power gap view… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:333 |
| ge.gas.archive.panel.view.sectors.loading | Loading sector distribution… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:357 |
| ge.gas.archive.panel.explanation.what | Full Petrobangla archive with field-level production, plant intake/offtake, sector allocation, and national timeline since January 2020. Five story views — timeline, field lifelines, power gas gap, sector distribution, and day compare — all keyed to the grid date selector. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:378 |
| ge.gas.archive.panel.explanation.insight | National gas fell from {jan2020Baseline.gas} MMCFD (Jan 2020) to ~{jun2026Latest.gas} MMCFD ({jun2026Latest.date}), a {nationalDecline.pct}% decline while LNG share expanded. Power-sector fulfillment collapsed from {from}% to {to}%, signalling structural rationing. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:379 |
| ge.gas.archive.panel.footer.source | {PetrobanglaOfficialSourceLink} · {coverageDays} verified gas-days | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:384 |
| ge.gas.archive.panel.footer.attribution | As published. Not independently audited. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:387 |
| ge.gas.archive.panel.footer.reporting-period | Archive gas-day {archiveDate} · through {latestArchiveDate} | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:388 |
| ge.gas.archive.panel.head.title | Petrobangla Daily Archive | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:403 |
| ge.gas.archive.panel.head.sub | Field & plant-level official reports · {coverageDays} gas-days through {latestArchiveDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:407-408 |
| ge.gas.archive.panel.head.grid-report | · Grid report {systemStatsDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchivePanel.tsx:409 |

## Gas · archive shared chrome — PetrobanglaArchiveShared.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archive.shared.official-link.label | {PETROBANGLA_OFFICIAL_LABEL} | link | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:33 |
| ge.gas.archive.shared.range-toolbar.aria | Timeline range | control | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:62 |
| ge.gas.archive.shared.range-toolbar.all | All | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:75 |
| ge.gas.archive.shared.range-toolbar.preset | {p} | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:75 |
| ge.gas.archive.shared.range-toolbar.ma-toggle | 7-day MA | control | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:90 |
| ge.gas.archive.shared.audience-toggle.simple | Simple | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:141 |
| ge.gas.archive.shared.audience-toggle.analyst | Analyst | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:142 |
| ge.gas.archive.shared.audience-toggle.investor | Investor | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:143 |
| ge.gas.archive.shared.audience-toggle.researcher | Researcher | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:144 |
| ge.gas.archive.shared.audience-toggle.aria | Audience mode | control | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:147 |
| ge.gas.archive.shared.chart-footer.caption-label | What is being shown? | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:199 |
| ge.gas.archive.shared.chart-footer.source | Source: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:206 |
| ge.gas.archive.shared.chart-footer.report-end | · report end {date} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:208 |
| ge.gas.archive.shared.chart-footer.day-count | · {dayCount} days | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:209 |
| ge.gas.archive.shared.chart-footer.raw-json | Raw JSON | link | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:219 |
| ge.gas.archive.shared.chart-footer.raw-json-embedded | Raw JSON · {date} | link | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:231-232 |
| ge.gas.archive.shared.date-grid-picker.year-placeholder | Year | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:409 |
| ge.gas.archive.shared.date-grid-picker.year-prefix | Year: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:414 |
| ge.gas.archive.shared.date-grid-picker.month-placeholder | Month | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:427 |
| ge.gas.archive.shared.date-grid-picker.month-prefix | Month: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:432 |
| ge.gas.archive.shared.date-grid-picker.day-placeholder | Day | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:445 |
| ge.gas.archive.shared.date-grid-picker.day-prefix | Day: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:450 |
| ge.gas.archive.shared.sync-notice.controlled-by | Controlled by grid backlog selector · gas-day {archiveDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:490-492 |
| ge.gas.archive.shared.sync-notice.synced | (synced) | chip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:494 |
| ge.gas.archive.shared.sync-notice.nearest | (nearest to {gridDate}) | chip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:496-497 |
| ge.gas.archive.shared.sync-notice.archive-ends | · Archive ends {latestArchiveDate} | chip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveShared.tsx:503 |

## Gas · day compare — PetrobanglaArchiveCompare.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archive.compare.mode-hint.simple | Interactive side-by-side gas comparison — national total, power fulfillment, and top fields. Hover a row to sync highlight. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:26 |
| ge.gas.archive.compare.mode-hint.analyst | Full analyst mode: hover fields to compare inline deltas, filter by field name, and use YoY or DoD presets. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:27 |
| ge.gas.archive.compare.mode-hint.investor | Risk dashboard: watch power fulfillment, LNG import share, and Bibiyana concentration shift over time. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:28 |
| ge.gas.archive.compare.mode-hint.researcher | Validation reconciliation status, copy-to-markdown exports, and raw telemetry field delta tracking. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:29 |
| ge.gas.archive.compare.year-picker.placeholder | Select Year | option | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:114 |
| ge.gas.archive.compare.year-picker.prefix | Year: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:119 |
| ge.gas.archive.compare.year-picker.hint | Matches month and day of Later Date | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:128 |
| ge.gas.archive.compare.year-picker.label | Earlier Year | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:322 |
| ge.gas.archive.compare.copy-md.title | # Petrobangla Archive Comparison | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:254 |
| ge.gas.archive.compare.copy-md.header | Metric / {leftDate} / {rightDate} / Δ | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:256 |
| ge.gas.archive.compare.copy-md.row-national-gas | National gas (MMCFD) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:258 |
| ge.gas.archive.compare.copy-md.row-power-fulfillment | Power fulfillment (% / pp) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:259 |
| ge.gas.archive.compare.copy-md.row-lng-share | LNG share (% / pp) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:260 |
| ge.gas.archive.compare.copy-md.row-bibiyana | Bibiyana (MMCFD) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:261 |
| ge.gas.archive.compare.copy-md.row-active-wells | Active wells | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:262 |
| ge.gas.archive.compare.copy-md.sources | Sources: /data/petrobangla/daily/{leftDate}.json · /data/petrobangla/daily/{rightDate}.json | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:264 |
| ge.gas.archive.compare.head.title-compact | Compare days | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:287 |
| ge.gas.archive.compare.head.sub-compact | Pick any two gas-days · right date follows grid selector | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:288 |
| ge.gas.archive.compare.head.copy-btn-compact | Copy | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:296 |
| ge.gas.archive.compare.head.title-full | Compare Any Two Days | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:303 |
| ge.gas.archive.compare.head.sub-full | Right date follows grid selector · pick any two days to compare | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:304 |
| ge.gas.archive.compare.head.copy-btn-full | Copy summary | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:312 |
| ge.gas.archive.compare.toolbar.later-date-label | Later date | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:332 |
| ge.gas.archive.compare.toolbar.later-date-hint | Synced to grid date selector | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:336 |
| ge.gas.archive.compare.toolbar.arrow-title | Compare direction | tooltip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:328 |
| ge.gas.archive.compare.preset.sample | Sample (2 Years Ago vs grid) | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:355 |
| ge.gas.archive.compare.preset.jan2020 | Jan 2020 vs grid | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:370 |
| ge.gas.archive.compare.preset.baseline | Baseline vs grid | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:384 |
| ge.gas.archive.compare.preset.yoy | YoY (1 Year Ago) | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:399 |
| ge.gas.archive.compare.preset.dod | DoD (Prev Day) | button | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:415 |
| ge.gas.archive.compare.loading | Reconciling comparative day metrics… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:425 |
| ge.gas.archive.compare.locked.selected-date | comparison for {leftDate} vs {rightDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:434 |
| ge.gas.archive.compare.empty-state | No comparative data loaded for the selected dates. | empty-state | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:451 |
| ge.gas.archive.compare.search.placeholder | Search production fields (e.g. Bibiyana, Titas)... | control | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:465 |
| ge.gas.archive.compare.movers.title | Top field movers | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:497 |
| ge.gas.archive.compare.movers.chip | {m.field}: {±delta} MMCFD | chip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:512-514 |
| ge.gas.archive.compare.delta-strip.title | {leftDate} → {rightDate} | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:592 |
| ge.gas.archive.compare.delta-strip.national-gas | National gas · MMCFD | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:554-556 |
| ge.gas.archive.compare.delta-strip.power-fulfillment | Power fulfillment · pp | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:560-562 |
| ge.gas.archive.compare.delta-strip.lng-share | LNG share · pp | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:568-570 |
| ge.gas.archive.compare.delta-strip.bibiyana | Bibiyana output · MMCFD | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:574-576 |
| ge.gas.archive.compare.delta-strip.wells | Active wells · wells | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:580-582 |
| ge.gas.archive.compare.panel.stat.national-gas | National gas | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:686 |
| ge.gas.archive.compare.panel.stat.fulfillment | Fulfillment | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:687 |
| ge.gas.archive.compare.panel.stat.lng-share | LNG share | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:688 |
| ge.gas.archive.compare.panel.delta.unit | MMCFD | unit | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:678 |
| ge.gas.archive.compare.panel.table.field-header | Field | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:704 |
| ge.gas.archive.compare.panel.table.gas-header | Gas MMCFD | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:706 |
| ge.gas.archive.compare.panel.researcher.reconciled | Reconciled: Yes / No | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:761 |
| ge.gas.archive.compare.panel.researcher.wells-label | Wells: | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveCompare.tsx:762 |

## Gas · KPI strip — PetrobanglaArchiveKpiStrip.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archive.kpi.stress.label | Supply stress | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:84 |
| ge.gas.archive.kpi.stress.loading | Loading field detail… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:89 |
| ge.gas.archive.kpi.stress.status | Moderate / Elevated / Severe | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:72 |
| ge.gas.archive.kpi.stress.tooltip.rows | Stress score · Power fulfillment · Domestic share · LNG import share · Bibiyana / domestic · Vs archive peak ({pct}% of {peakGas}) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:94-111 |
| ge.gas.archive.kpi.stress.tooltip.weights | Weights: power gap 30% · domestic 25% · LNG 20% · Bibiyana 30% · vs peak 10% | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:116 |
| ge.gas.archive.kpi.stress.tooltip.source | Petrobangla Daily Gas Intake/Offtake Report · I. Production — grand total | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:118 |
| ge.gas.archive.kpi.total.label | National gas | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:125 |
| ge.gas.archive.kpi.total.baseline-delta | Δ baseline {±value} MMCFD | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:128-131 |
| ge.gas.archive.kpi.total.tooltip.rows | Grand total · Vs {ARCHIVE_BASELINE_DATE} · Vs same day last year · Vs peak ({peakDate}) · Jan 2020 baseline | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:135-159 |
| ge.gas.archive.kpi.total.tooltip.sync-line | Synced to grid date {gridDate} / Nearest gas-day to {gridDate} | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:162 |
| ge.gas.archive.kpi.total.tooltip.source-part | I. Production | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:164 |
| ge.gas.archive.kpi.power.label | Power fulfillment | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:171 |
| ge.gas.archive.kpi.power.loading | Loading plant allocation… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:177 |
| ge.gas.archive.kpi.power.subtext | Plants got {powerSupply} of {powerDemand} MMCFD | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:178 |
| ge.gas.archive.kpi.power.tooltip.rows | Fulfillment rate · Plants received · Plants requested · Unmet demand · Jan 2020 benchmark · Collapse since 2020 (−{value} pts) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:183-200 |
| ge.gas.archive.kpi.power.tooltip.footer | Sector allocation from Petrobangla distribution summary · II. Distribution | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:204-206 |
| ge.gas.archive.kpi.lng.label | LNG share | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:213 |
| ge.gas.archive.kpi.lng.loading | Loading production mix… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:216 |
| ge.gas.archive.kpi.lng.subtext | {value} MMCFD imported | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:216 |
| ge.gas.archive.kpi.lng.tooltip.rows | Imported LNG (RPGCL) · Share of national mix · Domestic fields · Domestic share · LNG ramp since 2020 ({from} → {to} MMCFD (+{pct}%)) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:221-233 |
| ge.gas.archive.kpi.lng.tooltip.footer | RPGCL terminals · regasified LNG counted separately from own-field gas · I. Production — RPGCL (R-LNG) rows | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:237-239 |
| ge.gas.archive.kpi.domestic.label | Domestic output | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:246 |
| ge.gas.archive.kpi.domestic.subtext | Own gas, excluding imports | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:249 |
| ge.gas.archive.kpi.domestic.tooltip.rows | Own-field production · Vs Jan 2020 domestic · Bibiyana field · Bibiyana share ({pct}% of domestic) · National decline ({pct}% since 2020) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:254-271 |
| ge.gas.archive.kpi.domestic.tooltip.footer | All fields except RPGCL/LNG import terminals · I. Production — field rows | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:274-276 |
| ge.gas.archive.kpi.wells.label | Active wells | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:283 |
| ge.gas.archive.kpi.wells.loading | Loading well counts… | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:288 |
| ge.gas.archive.kpi.wells.subtext | Bibiyana {value} ({pct}% domestic) | metric | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:289 |
| ge.gas.archive.kpi.wells.tooltip.rows | Producing wells · Bibiyana output · Bibiyana decline ({from} → {to} MMCFD) · Bibiyana wells ({wells} active) · Concentration risk ({pct}% of domestic from one field) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:295-311 |
| ge.gas.archive.kpi.wells.tooltip.footer | Fewer producing wells + falling field rates = structural depletion pressure · I. Production — producing-wells column | footnote | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveKpiStrip.tsx:317-319 |

## Gas · national timeline — PetrobanglaArchiveNationalTimeline.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.archive.timeline.legend.domestic | Domestic gas | legend | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:73 |
| ge.gas.archive.timeline.legend.lng | Imported LNG | legend | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:74 |
| ge.gas.archive.timeline.legend.total | Grand total | legend | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:75 |
| ge.gas.archive.timeline.legend.ma | 7-day MA | legend | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:78 |
| ge.gas.archive.timeline.chart.aria-label | National Gas Timeline, chart | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:96 |
| ge.gas.archive.timeline.chart.loading | Loading national timeline... | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:204 |
| ge.gas.archive.timeline.tooltip.rows | Domestic gas · Imported LNG · Grand total · 7-day MA — each `{value} MMCFD` | tooltip | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:120-150 |
| ge.gas.archive.timeline.data-table.caption | National Gas Timeline — domestic gas vs imported LNG and grand total, by day | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:211 |
| ge.gas.archive.timeline.data-table.category-header | Date | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:212 |
| ge.gas.archive.timeline.data-table.series | Domestic gas · Imported LNG · Grand total · 7-day MA (MMCFD) | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:215-219 |
| ge.gas.archive.timeline.compact.title | National Timeline | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:238 |
| ge.gas.archive.timeline.compact.subtitle | {ok_days} verified days — domestic vs LNG | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:239 |
| ge.gas.archive.timeline.full.title | National Gas Timeline (2020—today) | heading | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:256 |
| ge.gas.archive.timeline.full.sub | Domestic fields vs imported LNG · {ok_days} verified days | label | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:258-259 |
| ge.gas.archive.timeline.full.insight | Domestic fields vs imported LNG — LNG rising while domestic output falls is the long-term pattern. | disclaimer | components/news/power-grid/petrobangla-archive/PetrobanglaArchiveNationalTimeline.tsx:264 |
## Gas · live window — components/news/power-grid/petrobangla-live/

(`pbLiveShared.tsx` has no literal text — re-exports `LiveBadge` from `../GasTabShared`. `LiveBadge`, `GridSinceBadge` and `GridProvenanceTag` render text defined in GasTabShared.tsx / GridExplorerUI.tsx.)

### pbLiveDayCompare.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.daycompare.heading | Day-over-Day (within week) | heading | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:33 |
| ge.gas.live.daycompare.vs | vs | label | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:47 |
| ge.gas.live.daycompare.latest2.button | Latest 2 days | button | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:67 |
| ge.gas.live.daycompare.select.option | {e.date_label} / {e.date_label} · {e.date} | option | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:43, 54 |
| ge.gas.live.daycompare.national-gas-delta | National gas Δ · MMCFD | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:72 |
| ge.gas.live.daycompare.lng-delta | LNG Δ · MMCFD | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:73 |
| ge.gas.live.daycompare.bibiyana-delta | Bibiyana Δ · MMCFD | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:74 |
| ge.gas.live.daycompare.fulfillment-delta | Fulfillment Δ · pp | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:75 |
| ge.gas.live.daycompare.delta-card.value | {±value}{pp} | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:83 |
| ge.gas.live.daycompare.topmovers.chip | {m.field}: {±delta} | metric | components/news/power-grid/petrobangla-live/pbLiveDayCompare.tsx:94 |

### pbLiveKpiStrip.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.kpistrip.avg-gas.label | {labelPrefix} Avg Gas | label | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:73 |
| ge.gas.live.kpistrip.avg-gas.hint | {daysCount}-day official average MMCFD | metric | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:80 |
| ge.gas.live.kpistrip.power-fulfillment.label | {labelPrefix} Power Fulfillment (%) | label | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:90-96 |
| ge.gas.live.kpistrip.power-fulfillment.hint | Average supply vs demand over period | metric | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:98 |
| ge.gas.live.kpistrip.lng-share.label | {labelPrefix} LNG Share (%) | label | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:106-112 |
| ge.gas.live.kpistrip.lng-share.hint | Average imported LNG share over period | metric | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:113 |
| ge.gas.live.kpistrip.volatility.label | {labelPrefix} Volatility | label | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:121 |
| ge.gas.live.kpistrip.volatility.hint | Max/Min spread across period | metric | components/news/power-grid/petrobangla-live/pbLiveKpiStrip.tsx:128 |

### pbLivePlantStress.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.plantstress.heading | Plant Stress List | heading | components/news/power-grid/petrobangla-live/pbLivePlantStress.tsx:15 |
| ge.gas.live.plantstress.subtitle | Stations that asked for gas and got little or none — load-shedding in official numbers. | label | components/news/power-grid/petrobangla-live/pbLivePlantStress.tsx:18 |
| ge.gas.live.plantstress.table.headers | Plant · DISCO · Demand · Supply · Gap | label | components/news/power-grid/petrobangla-live/pbLivePlantStress.tsx:24-28 |
| ge.gas.live.plantstress.table.plant-name | {p.name} (cell + title) | metric | components/news/power-grid/petrobangla-live/pbLivePlantStress.tsx:34 |

### pbLiveTimeline.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.timeline.tooltip.rows | National gas · Power demand · Power supply (each `{value} MMCFD`) · Fulfillment `{value}%` | tooltip | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:55-83 |
| ge.gas.live.timeline.tooltip.grid-date-highlighted | Grid date highlighted | label | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:87 |
| ge.gas.live.timeline.heading | {dayCount}-day timeline | heading | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:145 |
| ge.gas.live.timeline.chart.aria-label | {dayCount}-day timeline, chart | tooltip | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:158 |
| ge.gas.live.timeline.datatable.caption | {dayCount}-day timeline: national gas, power demand and power supply, by gas day | label | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:199 |
| ge.gas.live.timeline.datatable.category-header | Gas day | label | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:200 |
| ge.gas.live.timeline.datatable.series | National gas · Power demand · Power supply (MMCFD) | label | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:203-205 |
| ge.gas.live.timeline.legend | National gas · Power demand · Power supply | legend | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:211-213 |
| ge.gas.live.timeline.footnote.compact | National supply, power demand, and allocation. | footnote | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:220 |
| ge.gas.live.timeline.footnote.full | Supply, power demand, and allocation — {dayCount} gas-days. | footnote | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:221 |
| ge.gas.live.timeline.chip.grid-date-highlighted | Grid date highlighted | chip | components/news/power-grid/petrobangla-live/pbLiveTimeline.tsx:225 |

### pbLiveFieldSnapshot.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.fieldsnapshot.heading | Daily Field Snapshot | heading | components/news/power-grid/petrobangla-live/pbLiveFieldSnapshot.tsx:29 |
| ge.gas.live.fieldsnapshot.table.headers | Field · Wells · Gas MMCFD · 7d · Capacity · % Total | label | components/news/power-grid/petrobangla-live/pbLiveFieldSnapshot.tsx:35-40 |
| ge.gas.live.fieldsnapshot.sparkline.aria-label | {f.field} gas production, 7-day sparkline, chart | tooltip | components/news/power-grid/petrobangla-live/pbLiveFieldSnapshot.tsx:59 |
| ge.gas.live.fieldsnapshot.sparkline.datatable.caption | {f.field} gas production, MMCFD, over the live week | label | components/news/power-grid/petrobangla-live/pbLiveFieldSnapshot.tsx:71 |
| ge.gas.live.fieldsnapshot.sparkline.datatable | Day · Gas (MMCFD) | label | components/news/power-grid/petrobangla-live/pbLiveFieldSnapshot.tsx:72-75 |

### PetrobanglaLiveWeekPanel.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.live.panel.loading.recent | Loading recent gas-days… | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:155 |
| ge.gas.live.panel.loading.timeline | Loading national timeline… | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:155, 265 |
| ge.gas.live.panel.empty-state.unavailable | Live week data unavailable. Run sync_petrobangla_live.py to refresh. | empty-state | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:164 |
| ge.gas.live.panel.empty-state.timeline-unavailable | Timeline data unavailable. | empty-state | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:172 |
| ge.gas.live.panel.range-period-label | Week ending / Month ending / 6-month period ending / Year ending / 3-year period ending / Archive period ending | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:187-196 |
| ge.gas.live.panel.label-prefix | 7-Day / 30-Day / 6-Month / 1-Year / 3-Year / All-Time | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:200-209 |
| ge.gas.live.panel.week-insight.unified | {rangePeriodLabel} {date}: {avg} MMCFD average · {pct}% power fulfillment · {pct}% LNG · Bibiyana {value} MMCFD. | metric | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:214 |
| ge.gas.live.panel.week-insight.full | {rangePeriodLabel} {date}: National gas averaged ~{avg} MMCFD with {swing} MMCFD daily swing. Power plants demanded ~{demand} MMCFD but received ~{supply} — {pct}% fulfillment. LNG supplied ~{pct}% of all gas. Bibiyana held at ~{value} MMCFD on {wells} wells. | metric | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:215 |
| ge.gas.live.panel.latest-label | Latest: {date} ({label}) | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:234 |
| ge.gas.live.panel.outside-range-notice | Grid date {selectedDate} is outside this range — see Daily archive below. | disclaimer | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:241 |
| ge.gas.live.panel.loading-window | Loading {rangeDays}-day window… | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:259 |
| ge.gas.live.panel.researcher.file-link | {entry.json_file} | link | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:305-310 |
| ge.gas.live.panel.pgcb-vs-petrobangla | PGCB vs Petrobangla: {x} MMCFD (grid) · {y} MMCFD (fields) — different reporting layers. | metric | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:327-333 |
| ge.gas.live.panel.explanation.what.archive | Full archive of official Petrobangla gas-days: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare. | disclaimer | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:343 |
| ge.gas.live.panel.explanation.what.rolling | Rolling {rangeDays}-day official Petrobangla gas-days window: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare. | disclaimer | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:344 |
| ge.gas.live.panel.explanation.insight | Short-term volatility in this window often precedes rationing decisions. When power fulfillment drops while LNG share rises, the system is leaning on expensive imports without fully covering electricity-sector demand — a pattern visible across the 2024–2026 archive. | disclaimer | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:346 |
| ge.gas.live.panel.source-footer | daily gas intake/offtake reports · As published. Not independently audited. · {rangePeriodLabel} {latestDate} · gas-day 8:00 AM → 8:00 AM | footnote | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:351-355 |
| ge.gas.live.panel.card.heading | Rolling Gas-Day Window | heading | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:370 |
| ge.gas.live.panel.card.latest-official-data | Latest official data: {date} ({label}) | label | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:374 |
| ge.gas.live.panel.toolbar.aria-label | Live window | control | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:395 |
| ge.gas.live.panel.toolbar.range-button | {opt.label} (from LIVE_WEEK_RANGE_OPTIONS in lib/data/petrobangla/getLiveWeek) | option | components/news/power-grid/petrobangla-live/PetrobanglaLiveWeekPanel.tsx:408 |
## Petrobangla bootstrap / KPI strip / macro gas section / section detail / chrome

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.bootstrap.errors | Failed to load Petrobangla archive · Failed to load live gas-days · Failed to load national timeline · Failed to load gas-day window · usePetrobanglaBootstrap must be used within PetrobanglaBootstrapProvider | error | PetrobanglaBootstrap.tsx:65,79,103,123,165 |
| ge.gas.kpistrip.pipeline.labels | Ashuganj–Bakhrabad 1 (AB1): · Ashuganj–Bakhrabad 2 (AB2): · Bakhrabad–Brahmanbaria (BB): · Valve Station 3 (VS3): · Ashuganj–Monohardi (AM): · Bakhrabad–Demra (BD): | label | PetrobanglaGasKpiStrip.tsx:27-32 |
| ge.gas.kpistrip.product.labels | NGL Feed: (BBLD) · LPG: (Kg) · Petrol (MS): (BBLD) · Octane: (BBLD) · Kerosene: (BBLD) · Diesel: (BBLD) · HSD: (BBLD) | label | PetrobanglaGasKpiStrip.tsx:36-42 |
| ge.gas.kpistrip.diversity | True Power-Gas Gap · {n} MMCFD · tooltip "Diversity-Adjusted Demand": Raw plant demand: · Diversity factor: × {factor} · Realistic demand: · Actual supply: · Coverage: {pct}% · Fertilizer (adj / supplied): · Petrobangla's own diversity factor discounts simultaneous peak demand · Petrobangla Daily Gas Intake/Offtake Report · I. Production · Gas-day: {gasDay} | metric | PetrobanglaGasKpiStrip.tsx:131-179 |
| ge.gas.kpistrip.refinery | Refinery Output · {n} BBLD MS · {n} Kg LPG · tooltip "RPGCL Fractionation Output" · Condensate & NGL fractionated into liquid fuels at RPGCL/SGFL plants | metric | PetrobanglaGasKpiStrip.tsx:194-222 |
| ge.gas.kpistrip.pipeline | N-S Trunkline Flow · {n} MMCFD · tooltip "North-South Pipeline Deliveries" · GTCL trunkline segment deliveries from the NS-RA metering section | metric | PetrobanglaGasKpiStrip.tsx:240-263 |
| ge.gas.macro.head | Field evidence · Official Petrobangla daily reports — field, plant, and sector detail behind the reserve curve. · {coverageDays} days since Jan 2020 · Gas-day 8:00 AM–8:00 AM · Grid {date} · View as | heading | PetrobanglaMacroGasSection.tsx:72-89 |
| ge.gas.macro.range-titles | Rolling week · Rolling month · Rolling six months · Rolling year · Rolling three years · Full timeline | label | PetrobanglaMacroGasSection.tsx:45-49 |
| ge.gas.macro.range-descs | Last 7 gas-days · Last 30 gas-days · Last 180 gas-days · Last 365 gas-days · Last 1,095 gas-days · Full archive timeline | label | PetrobanglaMacroGasSection.tsx:54-59 |
| ge.gas.macro.subtitles | {rangeDesc} — national supply vs power plant allocation · {rangeLabel} volatility — power fulfillment and LNG share drive fuel-cost risk · Rolling window with raw JSON links — {rangeLabel} preset view · Rolling gas-days ({rangeLabel}) — sparklines, plant stress, and day-over-day compare | label | PetrobanglaMacroGasSection.tsx:103-108 |
| ge.gas.macro.footer | As published. Not independently audited. · Field archive · grid date {selectedDate} | footnote | PetrobanglaMacroGasSection.tsx:140-141 |
| ge.gas.macro.note | Seven-day live window plus full archive from January 2020. Use the date selector above to inspect any gas-day — field output, plant allocation, and sector splits. • Tracked since Jan 2020 · Domestic output is declining, LNG is filling the gap, and power plants receive about {pct}% (fallback: well under half) of the gas they ask for, averaged over the last 30 gas-days — the pattern the reserve depletion curve projects forward. | label | PetrobanglaMacroGasSection.tsx:170-173 |
| ge.gas.detail.production | chips Fields · Wells · Capacity (MMCFD) · Gas (MMCFD) · Utilization; cols Gas Field · Operator · Prod. Wells · Capacity (MMCFD) · Daily Production · Utilization · % of Grand Total · Gas (MMCFD) · Condensate (BBLD) · Total Capacity · Total Production; row Sub-Total | label | PetrobanglaSectionDetail.tsx:326-385 |
| ge.gas.detail.distribution | chips Plants · Online · Power Demand (MMCFD) · Power Supply (MMCFD) · Coverage · Total (MMCFD); cols Power Plant · Gas (MMCFD) · Status · Demand · Supply; rows Shut down · {pct}% met · Power Sub-Total · Fertilizer ({company}) · Industrial / Others & Supplementary · Company Total · — | label | PetrobanglaSectionDetail.tsx:441-537 |
| ge.gas.chrome.stats | Latest national gas · Week average / {labelPrefix} average (MMCFD · to {date}) · Power fulfillment ({pct}%; avg over {n} days / {supply} of {demand} MMCFD) · LNG share (imported gas in mix) · Bibiyana ({n} wells active) | label | MacroGasSectionChrome.tsx:106-142 |
| ge.gas.chrome.banner.chips | Grid date {gridDate} · synced / Gas-day {archiveDate} · Peak {n} MMCFD · {date} · Low {n} MMCFD · {date} · {pct}% since Jan 2020 | chip | MacroGasSectionChrome.tsx:174-188 |

## Pricing driver cards — MacroPricingDriverCards.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.pricing.pressure.title | Macro Pressure Variables (2021 - 2026) · Devaluation of BDT/USD vs. National Inflation Rate (CPI %) — Tracked since 2021 · Macro Factors | heading | MacroPricingDriverCards.tsx:41-45 |
| ge.gas.pricing.pressure.chart | aria "Macro Pressure Variables (2021 - 2026), chart" · axes {v} Tk / {v}% · tooltip Macro Variables {year} · Economy · Exchange Rate: {v} BDT/USD · Inflation Rate (CPI): {v}% · Source Data: Weighted Average Interbank Exchange Rate & Consumer Price Index · Source: Bangladesh Bank & BBS Databases · As published. Not independently audited. | tooltip | MacroPricingDriverCards.tsx:51-81 |
| ge.gas.pricing.pressure.legend | USD Exchange Rate (BDT) · Inflation Rate (%) (also the data-table series) | legend | MacroPricingDriverCards.tsx:88-102 |
| ge.gas.pricing.pressure.note | What is being shown? · This chart shows the year-on-year weighted average interbank exchange rate (BDT per USD) plotted against the national CPI inflation rate since 2021. · Analytical Insight: The rapid rise in the exchange rate (from ~85 Tk in 2021 to 122 Tk in 2026) shows a severe depreciation (~43%) of the BDT … | label | MacroPricingDriverCards.tsx:108-110 |
| ge.gas.pricing.pressure.footer | Source: Bangladesh Bank Interbank Weighted Average Statistics & BBS Inflation Database · As published. Not independently audited. · Reporting Period: Macro-Economic Tracker (2010 - 2026) | footnote | MacroPricingDriverCards.tsx:115-117 |
| ge.gas.pricing.fuelimport.title | Global Fuel Commodity Import Costs · Spot LNG (USD/MMBtu) vs. Import Coal (USD/Metric Ton) — Tracked since 2021 · Import Costs | heading | MacroPricingDriverCards.tsx:131-135 |
| ge.gas.pricing.fuelimport.chart | aria "Global Fuel Commodity Import Costs, chart" · axes {v} $/MMBtu / {v} $/t · tooltip Fuel Import Cost {year} · Commodities · Spot LNG (R-LNG): ${v} / MMBtu · Imported Coal (CIF): ${v} / Ton · Indices: Platts JKM Spot Gas LNG & Newcastle Thermal Coal Price Index · Source: Petrobangla LNG Division / BPDB Coal Purchase audits · As published. Not independently audited. | tooltip | MacroPricingDriverCards.tsx:141-171 |
| ge.gas.pricing.fuelimport.legend | Spot LNG (USD/MMBtu) · Import Coal (USD/Ton) | legend | MacroPricingDriverCards.tsx:178-192 |
| ge.gas.pricing.fuelimport.note | What is being shown? · This chart compares global Spot LNG prices (USD/MMBtu, left axis) against Newcastle imported coal prices (USD/Ton, right axis) from 2021 to 2026. · Analytical Insight: The charts capture the extreme volatility of spot LNG compared to imported coal … | label | MacroPricingDriverCards.tsx:198-200 |
| ge.gas.pricing.fuelimport.footer | Source: OPEC Bulletin Daily Spot Prices & Platts JKM LNG Assessments / BPC Accounts · As published. Not independently audited. · Reporting Period: Global Indexes (2010 - 2026) | footnote | MacroPricingDriverCards.tsx:205-207 |

## MacroTrendsTab.tsx — gas-related portions (non-gas sub-tabs inventoried separately)

| id | current text | type | file:line |
|---|---|---|---|
| ge.gas.macrotrends.subtab.reserves | Gas Reserve Depletion | subtab | MacroTrendsTab.tsx:457 |
| ge.gas.macrotrends.provenance-note.exception | On Global vs. Domestic the world benchmark series come from international bodies and commodity indexes — the World Bank, OPEC, IRENA and the JKM gas index — rather than from any government. | disclaimer | MacroTrendsTab.tsx:507-511 |
| ge.gas.macrotrends.lng.card | Gas Supply Transition: Domestic vs. Imported LNG · Historical shift towards imported liquefied natural gas (MMCFD) — Tracked since 2000 · LNG Reliance · legend Domestic gas / Imported LNG · aria "Gas Supply Transition: Domestic vs. Imported LNG, chart" · axis MMCFD | heading | MacroTrendsTab.tsx:952-972 |
| ge.gas.macrotrends.lng.tooltip | Gas Supply {year} · LNG Reliance · Domestic Fields: {v} MMCFD ({pct}% D) · Imported LNG (R-LNG): {v} MMCFD ({pct}% D) · Total Grid Supply: {v} MMCFD · Calculation: LNG Reliance % = (LNG / Total Supply) * 100 · Source: Petrobangla Annual Reports · As published. Not independently audited. | tooltip | MacroTrendsTab.tsx:987-1009 |
| ge.gas.macrotrends.lng.series | Domestic Gas (MMCFD) · Imported LNG (MMCFD) | legend | MacroTrendsTab.tsx:1015-1049 |
| ge.gas.macrotrends.lng.note | What is being shown? · This chart shows the volume (MMCFD) of natural gas supplied to the grid from local fields versus imported Liquefied Natural Gas (LNG) since 2018. · Analytical Insight: The visual depicts a major structural dependency shift … | label | MacroTrendsTab.tsx:1027-1029 |
| ge.gas.macrotrends.lng.footer | Source: Petrobangla Audited Balance Sheets & Daily MIS Reports · Domestic and LNG volumes are Petrobangla's. The total and the two share percentages are ours, summed and divided from those volumes. Not independently audited. · Reporting Period: Historical Reserves Log (2018 - 2026) | footnote | MacroTrendsTab.tsx:1034-1040 |
| ge.gas.macrotrends.reserves-card | Petrobangla Natural Gas Reserves · 7.63 Tcf Remaining · Of the original 29.74 Tcf recoverable gas reserves, 22.11 Tcf has already been extracted. This is the audited balance at 1 January 2026. The Gas Reserve Depletion panel carries it forward day by day … | metric | MacroTrendsTab.tsx:1057-1065 |
| ge.gas.macrotrends.section-footer | Source: Petrobangla Hydrocarbon Unit & BPDB Annual Financials · Reserve and capacity-charge figures are as the audits state them. The subsidy card is ours: the Tk 4.52 gap is Tk 12.91 generation cost less Tk 8.39 bulk tariff … Not independently audited. · Reporting Period: Macro Analysis (2026 Audit Reports) | disclaimer | MacroTrendsTab.tsx:1092-1101 |
| ge.gas.macrotrends.pricing.exchange-sensitivity | Exchange Rate Sensitivity: Imported energy commodities (Spot LNG, Coal, Heavy Fuel Oil) are denominated in US Dollars (USD). Therefore, the exchange rate of the Bangladesh Taka (BDT) is a direct multiplier on the domestic cost of power generation. | disclaimer | MacroTrendsTab.tsx:2046 |
| ge.gas.macrotrends.reports.toggles | Petrobangla Gas Audited Statements · BPDB Power Audited Statements · Audited Financial History | control | MacroTrendsTab.tsx:2142-2157 |
| ge.gas.macrotrends.reports.petrobangla.chart | Petrobangla Annual Revenue & LNG Import Costs · Audited historical financials illustrating LNG import cost burden (Crore BDT) — Tracked since 2010 · tooltip Petrobangla {year} Financials · Audited Ledger · Gas Sales Revenue: {v} Crore BDT · LNG Import Payments: {v} Crore BDT · Net Profit / Net Loss {v} Crore BDT · Formula: Net Income/Loss = Operating Revenue - Operational & LNG Import Costs · Source: Petrobangla Audited Balance Sheets · legend Gas Sales Revenue / LNG Import Cost / Net Income / Loss | heading | MacroTrendsTab.tsx:2299-2365 |
| ge.gas.macrotrends.reports.petrobangla.table | Fiscal Year · Gas Sales Revenue (Crore BDT) · LNG Import Costs (Crore BDT) · Net Profit / Loss (Crore BDT) · Action · View Full Report · N/A · Source: Petrobangla Audited Financial Accounts · Reporting Period: Audited Accounts Summary (FY 2010 - FY 2026) | label | MacroTrendsTab.tsx:2371-2425 |
| ge.gas.macrotrends.global.benchmark-note | Global Benchmark Comparison: Energy cost volatility in Bangladesh is structurally linked to global commodity indexes. This dashboard tracks global benchmark pricing (Brent Crude, World Bank Gas/JKM indexes, and IRENA Solar LCOE) against domestic retail tariffs since 1975 … | disclaimer | MacroTrendsTab.tsx:2438 |
| ge.gas.macrotrends.insights.advisory-note | Analyst & Investor Advisory: This advisory panel integrates audited financial statements, central bank weighted exchange rate data, and Petrobangla production filings … | disclaimer | MacroTrendsTab.tsx:2870 |
| ge.gas.macrotrends.insights.d-tag-caveat | Read the D tags on this tab more cautiously than elsewhere … Several numbers here are estimates — ranges and approximations drawn from sector reporting rather than computed from a single stated source. They carry D because they are ours, not because the arithmetic can be retraced. | disclaimer | MacroTrendsTab.tsx:2873-2879 |
| ge.gas.macrotrends.insights.forex-card | Forex Exposure & Currency Devaluation Burden · Macro-economic impact on national fuel imports · 6-Year Devaluation Trend (BDT/USD): +43.70% (84.90 to 122.00) · Dollar-Denominated Gas Reliance: ~73.2% of supply (IOCs + LNG) · Est. Daily Currency Surcharge: 1.8 Crore BDT / Tk-devaluation · Analytical Insight … · Source: Bangladesh Bank Exchange Stats · Rates as published by Bangladesh Bank. Not independently verified. · Reporting Date: Jun 2026 | metric | MacroTrendsTab.tsx:2920-2944 |
| ge.gas.macrotrends.insights.gas-card | Industrial Gas Shortage & Corporate Earnings Clues · Earnings impact on listed steel, cement, and textile mills · National Gas Deficit: 30.33% (~1,150 MMCFD short) · Industrial Zone Plant Utilization: 55% - 70% (Pressure drop below 2 psi) · Operating Margin Impact (bps): -300 to -450 bps · Analytical Insight … · Source: Petrobangla Bulletins · As published. Not independently audited. · Reporting Date: Jun 2026 | metric | MacroTrendsTab.tsx:2952-2976 |
# Content inventory — Part 05 (gap fill): TechnicalInfoTab (lines 1–953) + MacroTrendsTab non-gas sub-tabs

All paths relative to repo root. Interpolations shown as `{placeholders}`. Gas items already inventoried elsewhere (reserves sub-tab, LNG transition card, Petrobangla reserves card, overview section footer 1092–1101, Petrobangla half of Annual Reports, forex/industrial-gas insights cards, D-tag caveat, advisory note) are omitted.

## Scope A — components/news/power-grid/TechnicalInfoTab.tsx, lines 1–953

| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.pre-2014.title | PGCB Transmission Grid Data | empty-state | components/news/power-grid/TechnicalInfoTab.tsx:202 |
| ge.technical.pre-2014.body | No official records are available for the selected date. PGCB transmission outages and substation tracking officially started on December 31, 2013. | empty-state | components/news/power-grid/TechnicalInfoTab.tsx:204 |
| ge.technical.pre-2014.backlog | Official Backlog Start Date: December 31, 2013 | empty-state | components/news/power-grid/TechnicalInfoTab.tsx:207 |
| ge.technical.nav.mobile-label | Select Section | label | components/news/power-grid/TechnicalInfoTab.tsx:216 |
| ge.technical.nav.group.infrastructure | Grid Infrastructure | heading | components/news/power-grid/TechnicalInfoTab.tsx:241, 299 |
| ge.technical.nav.transmission | Power Transmission | subtab | components/news/power-grid/TechnicalInfoTab.tsx:243, 302 |
| ge.technical.nav.lines | Transmission Line Information | subtab | components/news/power-grid/TechnicalInfoTab.tsx:244, 303 |
| ge.technical.nav.substations | Substation Information | subtab | components/news/power-grid/TechnicalInfoTab.tsx:245, 304 |
| ge.technical.nav.group.projects | Grid Projects | heading | components/news/power-grid/TechnicalInfoTab.tsx:249, 308 |
| ge.technical.nav.projects-ongoing | Ongoing Projects | subtab | components/news/power-grid/TechnicalInfoTab.tsx:251, 311 |
| ge.technical.nav.projects-upcoming | Upcoming Projects | subtab | components/news/power-grid/TechnicalInfoTab.tsx:252, 312 |
| ge.technical.nav.completed-projects | Completed Projects | subtab | components/news/power-grid/TechnicalInfoTab.tsx:253, 313 |
| ge.technical.nav.group.maps | Maps & Diagrams | heading | components/news/power-grid/TechnicalInfoTab.tsx:257, 317 |
| ge.technical.nav.grid-net | National Grid Network Diagram | subtab | components/news/power-grid/TechnicalInfoTab.tsx:259, 320 |
| ge.technical.nav.geo-map | Geographical Grid Map | subtab | components/news/power-grid/TechnicalInfoTab.tsx:260, 321 |
| ge.technical.nav.group.opgw | Optical Fiber (OPGW) | heading | components/news/power-grid/TechnicalInfoTab.tsx:264, 325 |
| ge.technical.nav.opgw-map | OPGW Fiber Network Map | subtab | components/news/power-grid/TechnicalInfoTab.tsx:266, 328 |
| ge.technical.nav.opgw-lease | Optical Fiber Leasing | subtab | components/news/power-grid/TechnicalInfoTab.tsx:267, 329 |
| ge.technical.sidebar.title | Technical Information | heading | components/news/power-grid/TechnicalInfoTab.tsx:290 |
| ge.technical.sidebar.sub | Power Grid Infrastructure & Projects | label | components/news/power-grid/TechnicalInfoTab.tsx:293 |
| ge.technical.provenance.note | What P and D mean here. {P} marks a figure PGCB states in its own publication, quoted as written. {D} marks one computed here — on this tab that is only ever a count of the records held or a total summed from the rows shown, never an estimate. These are standing infrastructure figures, not daily readings: they carry the date PGCB states for them and do not change with the reporting date selected above. | disclaimer | components/news/power-grid/TechnicalInfoTab.tsx:388-395 |
| ge.technical.transmission.title | Power Transmission | heading | components/news/power-grid/TechnicalInfoTab.tsx:413 |
| ge.technical.transmission.chip | Core Grid Function | chip | components/news/power-grid/TechnicalInfoTab.tsx:415 |
| ge.technical.transmission.intro | PGCB does not generate electricity and does not sell it to you. It owns the wires in between: it collects power from the stations that make it and carries it to the companies that deliver it to homes and businesses. It earns a fee per unit carried — a toll for use of the road, not a price for the goods — and the regulator, BERC, sets that fee rather than PGCB. | label | components/news/power-grid/TechnicalInfoTab.tsx:419-424 |
| ge.technical.transmission.quote-toggle | PGCB's exact wording | control | components/news/power-grid/TechnicalInfoTab.tsx:429 |
| ge.technical.transmission.quote | The main operating function of Power Grid is wheeling of energy from BPDB power stations and Generation Companies to Distribution entities utilizing transmission network. Power Grid gets its energy wheeling charge from its clients(distribution entities) at the rate fixed by Bangladesh Electricity Regulatory Commission (BERC). | footnote | components/news/power-grid/TechnicalInfoTab.tsx:432 |
| ge.technical.transmission.flow.title | How power reaches you | heading | components/news/power-grid/TechnicalInfoTab.tsx:440 |
| ge.technical.transmission.flow.step1.chip | Step 1: Generation | chip | components/news/power-grid/TechnicalInfoTab.tsx:446 |
| ge.technical.transmission.flow.step1.title | Power Generation Plants | heading | components/news/power-grid/TechnicalInfoTab.tsx:449 |
| ge.technical.transmission.flow.step1.body | Power stations burn gas or coal, or catch sun and wind, and make electricity. State-owned and private plants both feed the same grid. | label | components/news/power-grid/TechnicalInfoTab.tsx:451 |
| ge.technical.transmission.flow.step1.foot | Gas, coal, furnace oil, solar, and imported power | footnote | components/news/power-grid/TechnicalInfoTab.tsx:455 |
| ge.technical.transmission.flow.step2.chip | Step 2: Transmission | chip | components/news/power-grid/TechnicalInfoTab.tsx:463 |
| ge.technical.transmission.flow.step2.title | High-Voltage Wheeling Grid | heading | components/news/power-grid/TechnicalInfoTab.tsx:466 |
| ge.technical.transmission.flow.step2.body | This is PGCB. It raises the voltage to 400,000, 230,000 or 132,000 volts so the power can cross the country without most of it being lost as heat along the way. | label | components/news/power-grid/TechnicalInfoTab.tsx:468 |
| ge.technical.transmission.flow.step2.foot | The toll PGCB charges is set by the regulator | footnote | components/news/power-grid/TechnicalInfoTab.tsx:472 |
| ge.technical.transmission.flow.step3.chip | Step 3: Distribution | chip | components/news/power-grid/TechnicalInfoTab.tsx:480 |
| ge.technical.transmission.flow.step3.title | Distribution Entities (Clients) | heading | components/news/power-grid/TechnicalInfoTab.tsx:483 |
| ge.technical.transmission.flow.step3.body | The voltage is brought back down at a substation and handed to your local utility, which runs the last stretch of cable to your meter. | label | components/news/power-grid/TechnicalInfoTab.tsx:485 |
| ge.technical.transmission.flow.step3.foot | Your bill comes from one of these: DPDC, DESCO, BREB/PBS, WZPDCO, NESCO | footnote | components/news/power-grid/TechnicalInfoTab.tsx:489 |
| ge.technical.started.title | Where PGCB Started | heading | components/news/power-grid/TechnicalInfoTab.tsx:507 |
| ge.technical.started.sub | What PGCB started with, handed over from BPDB and DESA | label | components/news/power-grid/TechnicalInfoTab.tsx:508 |
| ge.technical.started.quote | "The Power Grid took over about 2497 circuit km of 230 kV lines, 4236 circuit km 27.3 circuit km (Others) of 132 kV lines, 6 nos of 230/132 kV Substation and 63 nos of 132/33 kV substations from BPDB and DESA in different phases." | footnote | components/news/power-grid/TechnicalInfoTab.tsx:514 |
| ge.technical.started.inherited-230.label | Inherited 230 kV Transmission Lines | label | components/news/power-grid/TechnicalInfoTab.tsx:519 |
| ge.technical.started.inherited-230.value | about 2497 circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:520 |
| ge.technical.started.inherited-132.label | Inherited 132 kV Transmission Lines | label | components/news/power-grid/TechnicalInfoTab.tsx:523 |
| ge.technical.started.inherited-132.value | 4236 circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:525 |
| ge.technical.started.inherited-132.others | Plus 27.3 circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:526 |
| ge.technical.started.inherited-230-132-ss.label | Inherited 230/132 kV Substations | label | components/news/power-grid/TechnicalInfoTab.tsx:530 |
| ge.technical.started.inherited-230-132-ss.value | 6 nos | metric | components/news/power-grid/TechnicalInfoTab.tsx:531 |
| ge.technical.started.inherited-132-33-ss.label | Inherited 132/33 kV Substations | label | components/news/power-grid/TechnicalInfoTab.tsx:534 |
| ge.technical.started.inherited-132-33-ss.value | 63 nos | metric | components/news/power-grid/TechnicalInfoTab.tsx:535 |
| ge.technical.started.footer.source | Source: Power Grid Bangladesh PLC — corporate profile | link | components/news/power-grid/TechnicalInfoTab.tsx:541 |
| ge.technical.started.footer.caveat | Quoted verbatim from PGCB's own statement. Not independently audited. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:542 |
| ge.technical.started.footer.period | Reporting Period: Takeover from BPDB & DESA | footnote | components/news/power-grid/TechnicalInfoTab.tsx:543 |
| ge.technical.today.title | The Grid Today | heading | components/news/power-grid/TechnicalInfoTab.tsx:555 |
| ge.technical.today.sub | What PGCB owns and runs, as at June 2026 | label | components/news/power-grid/TechnicalInfoTab.tsx:556 |
| ge.technical.today.body | PGCB now runs 18,816 km of high-voltage line — the long-distance wires that carry power from the plants to your city, before any local pole or street cable. It hands that power over at 259 substations, the sites that step the voltage down so it can be used. | label | components/news/power-grid/TechnicalInfoTab.tsx:562-566 |
| ge.technical.today.quote-toggle | PGCB's exact wording | control | components/news/power-grid/TechnicalInfoTab.tsx:572 |
| ge.technical.today.quote | "Transmission lines of the company up to June, 2026 are stood at 3,282 ckt km 27.8 ckt km (Others) of 400 kV lines, 5,423 circuit km 27.3 circuit km (Others) of 230 kV lines, 9,687 circuit km and 369 circuit km (Others) of 132 kV lines and 1 nos of 400 kV Station, 11 nos of 400/230kV substation, 5 nos of 400/132kV substation, 36 nos of 230/132 kV substation, 3 nos of 230/33 KV substation and 151 nos of 132/33 kV substations." | footnote | components/news/power-grid/TechnicalInfoTab.tsx:575 |
| ge.technical.today.tile-400.label | 400 kV — the motorways | label | components/news/power-grid/TechnicalInfoTab.tsx:581 |
| ge.technical.today.tile-400.value | 3,282 km | metric | components/news/power-grid/TechnicalInfoTab.tsx:582 |
| ge.technical.today.tile-400.others | Plus 27.8 km run by others | metric | components/news/power-grid/TechnicalInfoTab.tsx:583 |
| ge.technical.today.tile-230.label | 230 kV — the trunk roads | label | components/news/power-grid/TechnicalInfoTab.tsx:586 |
| ge.technical.today.tile-230.value | 5,423 km | metric | components/news/power-grid/TechnicalInfoTab.tsx:587 |
| ge.technical.today.tile-230.others | Plus 27.3 km run by others | metric | components/news/power-grid/TechnicalInfoTab.tsx:588 |
| ge.technical.today.tile-132.label | 132 kV — the main roads | label | components/news/power-grid/TechnicalInfoTab.tsx:591 |
| ge.technical.today.tile-132.value | 9,687 km | metric | components/news/power-grid/TechnicalInfoTab.tsx:592 |
| ge.technical.today.tile-132.others | Plus 369 km run by others | metric | components/news/power-grid/TechnicalInfoTab.tsx:593 |
| ge.technical.today.tile-highest.label | Highest-voltage sites | label | components/news/power-grid/TechnicalInfoTab.tsx:596 |
| ge.technical.today.tile-highest.value | 1 × 400 kV station | metric | components/news/power-grid/TechnicalInfoTab.tsx:597 |
| ge.technical.today.tile-highest.sub | 11 step 400→230 kV, 5 step 400→132 kV | metric | components/news/power-grid/TechnicalInfoTab.tsx:598 |
| ge.technical.today.tile-handover.label | Handover sites | label | components/news/power-grid/TechnicalInfoTab.tsx:601 |
| ge.technical.today.tile-handover.value | 36 step 230→132 kV | metric | components/news/power-grid/TechnicalInfoTab.tsx:602 |
| ge.technical.today.tile-handover.sub | 2 step 230→33 kV, 150 step 132→33 kV | metric | components/news/power-grid/TechnicalInfoTab.tsx:603 |
| ge.technical.today.footer.source | Source: Power Grid Bangladesh PLC — corporate profile | link | components/news/power-grid/TechnicalInfoTab.tsx:609 |
| ge.technical.today.footer.caveat | Figures read from PGCB's page by two independent parsers, which agreed on all 20 checked values. One caveat, and it is PGCB's own: the paragraph quoted above says 3 230/33 kV and 151 132/33 kV substations, while the table further down the same page says 2 and 150. The tiles follow the table, because that is the version PGCB's own totals add up to. | disclaimer | components/news/power-grid/TechnicalInfoTab.tsx:610-619 |
| ge.technical.today.footer.period | Standing as at: June 2026 | footnote | components/news/power-grid/TechnicalInfoTab.tsx:620 |
| ge.technical.then-now.title | Then vs Now | heading | components/news/power-grid/TechnicalInfoTab.tsx:629 |
| ge.technical.then-now.col.class | Infrastructure Class | label | components/news/power-grid/TechnicalInfoTab.tsx:635 |
| ge.technical.then-now.col.inherited | Inherited (Takeover from BPDB & DESA) | label | components/news/power-grid/TechnicalInfoTab.tsx:637 |
| ge.technical.then-now.col.standing | Standing (Up to June, 2026) | label | components/news/power-grid/TechnicalInfoTab.tsx:640 |
| ge.technical.then-now.row-400-lines | 400 kV Transmission Lines / — / 3,282 ckt km + Plus 27.8 ckt km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:646-648 |
| ge.technical.then-now.row-230-lines | 230 kV Transmission Lines / about 2497 circuit km / 5,423 circuit km + Plus 27.3 circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:651-653 |
| ge.technical.then-now.row-132-lines | 132 kV Transmission Lines / 4236 circuit km + Plus 27.3 circuit km (Others) / 9,687 circuit km + Plus 369 circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:656-658 |
| ge.technical.then-now.row-400-ss | 400 kV Stations / Substations / — / 1 nos of 400 kV Station; 11 nos of 400/230kV substation; 5 nos of 400/132kV substation | metric | components/news/power-grid/TechnicalInfoTab.tsx:661-667 |
| ge.technical.then-now.row-230-ss | 230 kV Substations / 6 nos of 230/132 kV Substation / 36 nos of 230/132 kV substation; 2 nos of 230/33 KV substation | metric | components/news/power-grid/TechnicalInfoTab.tsx:670-675 |
| ge.technical.then-now.row-132-33-ss | 132/33 kV Substations / 63 nos of 132/33 kV substations / 150 nos of 132/33 kV substations | metric | components/news/power-grid/TechnicalInfoTab.tsx:678-680 |
| ge.technical.then-now.footer.source | Source: Power Grid Bangladesh PLC — corporate profile | link | components/news/power-grid/TechnicalInfoTab.tsx:686 |
| ge.technical.then-now.footer.caveat | Both columns restate PGCB's own figures side by side. No growth rate or difference is computed, so every cell here is P; the "—" marks a class PGCB does not state for that period, not a zero. | disclaimer | components/news/power-grid/TechnicalInfoTab.tsx:687-691 |
| ge.technical.then-now.footer.period | Reporting Period: Takeover → June 2026 | footnote | components/news/power-grid/TechnicalInfoTab.tsx:692 |
| ge.technical.projects-callout | PGCB is building more lines and substations — the projects are listed under Grid Projects in the menu. | label | components/news/power-grid/TechnicalInfoTab.tsx:702 |
| ge.technical.glossary.title | Jargon, translated | heading | components/news/power-grid/TechnicalInfoTab.tsx:709 |
| ge.technical.glossary.kv | kV (Kilovolt) — 1,000 volts. Pushing power at high voltage is like using a wider pipe — less is wasted as heat on a long journey, which is why the grid steps voltage up to travel and back down to deliver. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:713-714 |
| ge.technical.glossary.ckt-km | ckt km (Circuit Kilometers) — Length of wire, not length of route. One tower line often carries two circuits, so a 10 km stretch of towers counts as 20 circuit km. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:717-718 |
| ge.technical.glossary.mva | MVA (Megavolt-Ampere) — The size rating of a substation — roughly how much power it can pass at once. Think of it as the width of the doorway, not how much actually walks through. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:721-722 |
| ge.technical.glossary.nos | Nos (Numbers) — Just "number of". PGCB writes "11 nos" where we would write "11". | footnote | components/news/power-grid/TechnicalInfoTab.tsx:725-726 |
| ge.technical.glossary.berc-bpdb | BERC / BPDB — BERC is the regulator that sets prices. BPDB is the state power company that generates and buys electricity. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:729-730 |
| ge.technical.lines.card1.title | Transmission Line as on: June, 2026 | heading | components/news/power-grid/TechnicalInfoTab.tsx:749 |
| ge.technical.lines.card1.sub | How much high-voltage wire exists, by voltage class | label | components/news/power-grid/TechnicalInfoTab.tsx:750 |
| ge.technical.lines.card1.col.voltage | Voltage Class | label | components/news/power-grid/TechnicalInfoTab.tsx:758 |
| ge.technical.lines.card1.col.main | Main Capacity | label | components/news/power-grid/TechnicalInfoTab.tsx:760 |
| ge.technical.lines.card1.col.others | Others | label | components/news/power-grid/TechnicalInfoTab.tsx:763 |
| ge.technical.lines.card1.row-400 | 400kV / 3,282 Circuit km / 27.8 Circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:771-774 |
| ge.technical.lines.card1.row-230 | 230kV / 5,423 Circuit km / 27.3 Circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:779-782 |
| ge.technical.lines.card1.row-132 | 132kV / 9,687 Circuit km / 369 Circuit km (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:787-790 |
| ge.technical.lines.card1.row-total | Total Line / 18,816 Circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:793-794 |
| ge.technical.lines.achievement.title | Last Five years achievement | heading | components/news/power-grid/TechnicalInfoTab.tsx:810 |
| ge.technical.lines.achievement.sub | Major projects and capacities commissioned recently | label | components/news/power-grid/TechnicalInfoTab.tsx:811 |
| ge.technical.lines.achievement.col.item | Infrastructure Item | label | components/news/power-grid/TechnicalInfoTab.tsx:819 |
| ge.technical.lines.achievement.col.capacity | Verbatim Capacity / Length | label | components/news/power-grid/TechnicalInfoTab.tsx:820 |
| ge.technical.lines.achievement.row-400-230 | 400/230kV Substation / 9 Nos. 13,100 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:825-826 |
| ge.technical.lines.achievement.row-400-132 | 400/132 kV Substation / 4 Nos. 2,990 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:829-830 |
| ge.technical.lines.achievement.row-230-132 | 230/132kV Substation / 10 Nos: 7,550 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:833-834 |
| ge.technical.lines.achievement.row-230-33 | 230/33KV Substation / 1 Nos 280 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:837-838 |
| ge.technical.lines.achievement.row-132-33 | 132/33kV Substation / 38 Nos. 7,647 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:841-842 |
| ge.technical.lines.achievement.row-400-line | 400kV Transmission Line / 2,124.77 Circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:845-846 |
| ge.technical.lines.achievement.row-230-line | 230kV Transmission Line / 1,481.94 Circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:849-850 |
| ge.technical.lines.achievement.row-132-line | 132kV Transmission Line / 1,249.874 Circuit km | metric | components/news/power-grid/TechnicalInfoTab.tsx:853-854 |
| ge.technical.lines.substation.title | Substation as on: June, 2026 | heading | components/news/power-grid/TechnicalInfoTab.tsx:869 |
| ge.technical.lines.substation.sub | Comprehensive capacity aggregates across all operation nodes | label | components/news/power-grid/TechnicalInfoTab.tsx:870 |
| ge.technical.lines.substation.col.class | Substation / Station Class | label | components/news/power-grid/TechnicalInfoTab.tsx:878 |
| ge.technical.lines.substation.col.count | Count / Quantity | label | components/news/power-grid/TechnicalInfoTab.tsx:879 |
| ge.technical.lines.substation.col.main | Main Capacity / Rating | label | components/news/power-grid/TechnicalInfoTab.tsx:880 |
| ge.technical.lines.substation.col.others | Others (Quantity & Capacity) | label | components/news/power-grid/TechnicalInfoTab.tsx:881 |
| ge.technical.lines.substation.row-hvdc | 400kV HVDC Station / 1 Nos. / 2x500MW HVDC Back to Back station / — | metric | components/news/power-grid/TechnicalInfoTab.tsx:886-889 |
| ge.technical.lines.substation.row-400-230 | 400/230kV Substation / 11 Nos. / 16,180 MVA / 3 Nos. 2730 MVA (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:892-895 |
| ge.technical.lines.substation.row-400-132 | 400/132 kV Substation / 5 Nos. / 4,590 MVA / — | metric | components/news/power-grid/TechnicalInfoTab.tsx:898-901 |
| ge.technical.lines.substation.row-230-132 | 230/132kV Substation / 36 Nos. / 24,725 MVA / 1 Nos. 250 MVA (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:904-907 |
| ge.technical.lines.substation.row-230-33 | 230/33KV Substation / 2 Nos. / 700 MVA / 4 Nos. 1,050 MVA (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:910-913 |
| ge.technical.lines.substation.row-132-33 | 132/33kV Substation / 150 Nos. / 33,627 MVA / 46 Nos. 7,661 MVA (Others) | metric | components/news/power-grid/TechnicalInfoTab.tsx:916-919 |
| ge.technical.lines.substation.row-overall | Overall Capacity / 259 Nos. / 91,512 MVA | metric | components/news/power-grid/TechnicalInfoTab.tsx:924-926 |
| ge.technical.lines.substation.row-dispatch | Dispatch Capacity at 33kV level / 36267.21 MW (Including all organizations) | metric | components/news/power-grid/TechnicalInfoTab.tsx:931-933 |
| ge.technical.lines.glossary.title | Jargon, translated | heading | components/news/power-grid/TechnicalInfoTab.tsx:946 |
| ge.technical.lines.glossary.kv | kV (Kilovolt) — 1,000 volts. Higher voltage travels further with less waste. | footnote | components/news/power-grid/TechnicalInfoTab.tsx:950-951 |

## Scope B — components/news/power-grid/MacroTrendsTab.tsx, non-gas sub-tabs

### Shared chrome (sub-tab list, preview banner, provenance note, fuel label map)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.shared.preview.title | Historical Preview Mode | heading | components/news/power-grid/MacroTrendsTab.tsx:434 |
| ge.macro.shared.preview.body | You are viewing a {activeAllowedYears}-year preview of the macro trends. {Upgrade your plan / Subscribe} to unlock the full historical backlog (you are missing {activeHiddenPercentage}% of the data spanning 15+ years). | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:436 |
| ge.macro.shared.subtab.overview | Macro Overview | subtab | components/news/power-grid/MacroTrendsTab.tsx:455 (id at 127) |
| ge.macro.shared.subtab.monthly | PGCB Monthly Archives | subtab | components/news/power-grid/MacroTrendsTab.tsx:456 |
| ge.macro.shared.subtab.reserves | Gas Reserve Depletion | subtab | components/news/power-grid/MacroTrendsTab.tsx:457 |
| ge.macro.shared.subtab.pricing | Pricing & Drivers | subtab | components/news/power-grid/MacroTrendsTab.tsx:458 |
| ge.macro.shared.subtab.global | Global vs. Domestic | subtab | components/news/power-grid/MacroTrendsTab.tsx:459 |
| ge.macro.shared.subtab.budget | National Budget & Infra | subtab | components/news/power-grid/MacroTrendsTab.tsx:460 |
| ge.macro.shared.subtab.reports | Annual Reports | subtab | components/news/power-grid/MacroTrendsTab.tsx:461 |
| ge.macro.shared.subtab.system-loss | Sector Glance & Losses | subtab | components/news/power-grid/MacroTrendsTab.tsx:462 |
| ge.macro.shared.subtab.insights | Analyst & Investor Insights | subtab | components/news/power-grid/MacroTrendsTab.tsx:463 |
| ge.macro.shared.subtab.verification | Published vs Derived | subtab | components/news/power-grid/MacroTrendsTab.tsx:464 |
| ge.macro.shared.provenance.note | What P and D mean here. {P} is a figure stated in an official publication and reproduced unchanged — from any government body, not only the energy agencies: Ministry of Finance budget lines, Power Cell loss statistics, BERC tariff orders, BPC fuel prices, Bangladesh Bank exchange rates, SREDA registries, alongside PGCB, Petrobangla and BPDB. {D} is one worked out from those: a gap between two published figures, a share of a total, a currency conversion. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:497-505 (exception sentence 506-511 inventoried elsewhere) |
| ge.macro.shared.provenance.note-tail | These are annual and multi-year series, not daily readings, so they carry the period their source covers and do not move with the date selected above. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:512-514 |
| ge.macro.shared.fuel-label.gas | Gas | label | components/news/power-grid/MacroTrendsTab.tsx:231 |
| ge.macro.shared.fuel-label.coal | Coal | label | components/news/power-grid/MacroTrendsTab.tsx:232 |
| ge.macro.shared.fuel-label.hfo | Furnace Oil (HFO) | label | components/news/power-grid/MacroTrendsTab.tsx:233 |
| ge.macro.shared.fuel-label.diesel | Diesel | label | components/news/power-grid/MacroTrendsTab.tsx:234 |
| ge.macro.shared.fuel-label.import | India Imports | label | components/news/power-grid/MacroTrendsTab.tsx:235 |
| ge.macro.shared.fuel-label.hydro | Hydro | label | components/news/power-grid/MacroTrendsTab.tsx:236 |
| ge.macro.shared.fuel-label.solar | Solar | label | components/news/power-grid/MacroTrendsTab.tsx:237 |
| ge.macro.shared.fuel-label.wind | Wind | label | components/news/power-grid/MacroTrendsTab.tsx:238 |

### Macro Overview (`overview`) — non-gas cards

(The LNG "Gas Supply Transition" card 946–1051, "Petrobangla Natural Gas Reserves" card 1056–1067 and the section footer 1091–1102 are inventoried elsewhere.)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.overview.tariff-card.title | Wholesale Tariff vs. Unit Production Cost | heading | components/news/power-grid/MacroTrendsTab.tsx:852 |
| ge.macro.overview.tariff-card.sub | Audit history showing growing BPDB cost gap (Tk/KWh) — Tracked since 2010 | label | components/news/power-grid/MacroTrendsTab.tsx:853 |
| ge.macro.overview.tariff-card.chip | Bulk Tariff Gap | chip | components/news/power-grid/MacroTrendsTab.tsx:856 |
| ge.macro.overview.tariff-card.y-axis | {v} Tk | axis | components/news/power-grid/MacroTrendsTab.tsx:865 |
| ge.macro.overview.tariff-card.tooltip.head | {year} Financials / Deficit Gap | tooltip | components/news/power-grid/MacroTrendsTab.tsx:874-875 |
| ge.macro.overview.tariff-card.tooltip.tariff | Wholesale Bulk Tariff: {tariff} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:879-880 |
| ge.macro.overview.tariff-card.tooltip.cost | Unit Production Cost: {cost} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:883-884 |
| ge.macro.overview.tariff-card.tooltip.deficit | Unit Deficit: {deficit} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:887-888 |
| ge.macro.overview.tariff-card.tooltip.calc | Calculation: Unit Deficit = Average Production Cost − Bulk Wholesale Tariff | tooltip | components/news/power-grid/MacroTrendsTab.tsx:892 |
| ge.macro.overview.tariff-card.tooltip.source | Source: BPDB Annual Audits & BERC Notifications / As published. Not independently audited. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:895-896 |
| ge.macro.overview.tariff-card.legend.tariff | Bulk Wholesale Tariff | legend | components/news/power-grid/MacroTrendsTab.tsx:903 |
| ge.macro.overview.tariff-card.legend.cost | Average Generation Cost | legend | components/news/power-grid/MacroTrendsTab.tsx:904 |
| ge.macro.overview.tariff-card.table.caption | Wholesale Tariff vs. Unit Production Cost, chart (category header: Year) | label | components/news/power-grid/MacroTrendsTab.tsx:912-913 |
| ge.macro.overview.tariff-card.note.head | What is being shown? | heading | components/news/power-grid/MacroTrendsTab.tsx:923 |
| ge.macro.overview.tariff-card.note.tariff | Bulk Wholesale Tariff: The BERC-approved rate at which BPDB sells power to distribution utilities (DESCO, DPDC, etc.). | footnote | components/news/power-grid/MacroTrendsTab.tsx:925 |
| ge.macro.overview.tariff-card.note.cost | Average Generation Cost: The total blended per-unit generation and procurement cost, including capacity charges. | footnote | components/news/power-grid/MacroTrendsTab.tsx:926 |
| ge.macro.overview.tariff-card.note.insight | Analytical Insight: The widening gap between bulk tariff and actual production cost has resulted in massive structural deficits for BPDB. This trend is highly unsustainable and highlights the critical need to either rationalize power purchase costs (by phasing out liquid fuel plants) or adjust wholesale tariffs to reduce the fiscal subsidy burden on the government. | footnote | components/news/power-grid/MacroTrendsTab.tsx:928-930 |
| ge.macro.overview.tariff-card.footer.source | Source: BPDB Annual Accounts & Audit Reports | link | components/news/power-grid/MacroTrendsTab.tsx:935 |
| ge.macro.overview.tariff-card.footer.caveat | Both the tariff and the unit cost are BPDB's own published figures. The deficit between them is ours — a subtraction, shown so the gap can be read directly rather than eyeballed off the two lines. Not independently audited. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:936-941 |
| ge.macro.overview.tariff-card.footer.period | Reporting Period: FY 2020 - FY 2026 Financial Audits | footnote | components/news/power-grid/MacroTrendsTab.tsx:942 |
| ge.macro.overview.capacity-charge.label | Capacity Charge Drag | label | components/news/power-grid/MacroTrendsTab.tsx:1070 |
| ge.macro.overview.capacity-charge.value | ~40% of Wholesale Costs | metric | components/news/power-grid/MacroTrendsTab.tsx:1072 |
| ge.macro.overview.capacity-charge.desc | Audited financial statements indicate that over 40% of BPDB's average bulk purchase rate goes directly toward paying capacity charges to idle or underutilized private IPPs. | footnote | components/news/power-grid/MacroTrendsTab.tsx:1074 |
| ge.macro.overview.subsidy.label | State Subsidy Burden | label | components/news/power-grid/MacroTrendsTab.tsx:1080 |
| ge.macro.overview.subsidy.value | ~35k-40k Crore BDT / Year | metric | components/news/power-grid/MacroTrendsTab.tsx:1082 |
| ge.macro.overview.subsidy.desc | Due to the Tk 4.52 per unit wholesale cost gap (average Tk 12.91 generation cost vs Tk 8.39 bulk tariff), the Ministry of Finance issues massive annual treasury transfers to cover the deficit. | footnote | components/news/power-grid/MacroTrendsTab.tsx:1084 |

### PGCB Monthly Archives (`monthly`)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.monthly.check-note | How these months were checked. Every headline figure is read twice from PGCB's own report — once by fixed column position, once by finding the item's label and taking the number beside it. The two share no column knowledge, so a layout change breaks one and a reworded label breaks the other. All {figuresCompared} figures agreed, none disagreed — across the {monthsWithLocalSource} of {monthsInArchive} months whose source report is held here. The remaining months are shown as published but have not been re-read this way. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:1132-1144 |
| ge.macro.monthly.picker.title | Select Operating Period | heading | components/news/power-grid/MacroTrendsTab.tsx:1189 |
| ge.macro.monthly.picker.body | PGCB Monthly Operating Data: This archive contains official, authenticated monthly reports from the Power Grid Company of Bangladesh (PGCB) from 2013 to 2026. Explore peak generation records, demand curves, fuel mix metrics, and regional maximum power flows. | label | components/news/power-grid/MacroTrendsTab.tsx:1191 |
| ge.macro.monthly.picker.year | Year (placeholder) / Year: (prefix) | control | components/news/power-grid/MacroTrendsTab.tsx:1206, 1211 |
| ge.macro.monthly.picker.month | Month (placeholder) / Month: (prefix) | control | components/news/power-grid/MacroTrendsTab.tsx:1228, 1233 |
| ge.macro.monthly.stale.head | PGCB did not refresh {a figure / these figures} for this month. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:1259-1261 |
| ge.macro.monthly.stale.item | Its {maximum evening peak generation / maximum evening peak demand} of {value} MW is stamped by PGCB with a date in {monthLabel}. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:1262-1271 |
| ge.macro.monthly.stale.tail | The figure below is what PGCB published, reproduced unchanged — but it describes the earlier month, not this one. Every other item in the report is dated correctly. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:1273-1275 |
| ge.macro.monthly.kpi.gen.label | Max Peak Generation | label | components/news/power-grid/MacroTrendsTab.tsx:1284 |
| ge.macro.monthly.kpi.tracked-since | Tracked since 2014 | chip | components/news/power-grid/MacroTrendsTab.tsx:1287, 1296, 1305, 1317, 1333, 1478 |
| ge.macro.monthly.kpi.gen.value | {max_evening_peak_gen} MW | metric | components/news/power-grid/MacroTrendsTab.tsx:1289 |
| ge.macro.monthly.kpi.gen.desc | Evening peak generation recorded | footnote | components/news/power-grid/MacroTrendsTab.tsx:1291 |
| ge.macro.monthly.kpi.demand.label | Estimated Peak Demand | label | components/news/power-grid/MacroTrendsTab.tsx:1295 |
| ge.macro.monthly.kpi.demand.value | {max_evening_peak_demand} MW | metric | components/news/power-grid/MacroTrendsTab.tsx:1298 |
| ge.macro.monthly.kpi.demand.desc | System operational peak demand | footnote | components/news/power-grid/MacroTrendsTab.tsx:1300 |
| ge.macro.monthly.kpi.deficit.label | Peak Deficit / Load Shed | label | components/news/power-grid/MacroTrendsTab.tsx:1304 |
| ge.macro.monthly.kpi.deficit.value | {demand − gen, else 0} MW | metric | components/news/power-grid/MacroTrendsTab.tsx:1306-1311 |
| ge.macro.monthly.kpi.deficit.desc | Peak capacity deficit gap | footnote | components/news/power-grid/MacroTrendsTab.tsx:1312 |
| ge.macro.monthly.kpi.energy.label | Total Net Energy | label | components/news/power-grid/MacroTrendsTab.tsx:1316 |
| ge.macro.monthly.kpi.energy.value | {total_net_generation} MKWh (superscript r) | metric | components/news/power-grid/MacroTrendsTab.tsx:1318-1321 |
| ge.macro.monthly.kpi.energy.desc | Monthly total energy generation | footnote | components/news/power-grid/MacroTrendsTab.tsx:1322 |
| ge.macro.monthly.fuel-mix.title | Energy Fuel Mix | heading | components/news/power-grid/MacroTrendsTab.tsx:1332 |
| ge.macro.monthly.fuel-mix.sub | Net generation by fuel source in {month} {year} (MKWh) | label | components/news/power-grid/MacroTrendsTab.tsx:1335 |
| ge.macro.monthly.fuel-mix.tooltip.gen | Generation: {value} MKWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1390-1391 |
| ge.macro.monthly.fuel-mix.tooltip.share | Share of Mix: {pct}% | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1394-1395 |
| ge.macro.monthly.fuel-mix.donut-center | {total} / MKWh Net | metric | components/news/power-grid/MacroTrendsTab.tsx:1412, 1422 |
| ge.macro.monthly.fuel-mix.col.fuel | Fuel Type | label | components/news/power-grid/MacroTrendsTab.tsx:1437 |
| ge.macro.monthly.fuel-mix.col.mkwh | MKWh | label | components/news/power-grid/MacroTrendsTab.tsx:1439 |
| ge.macro.monthly.fuel-mix.col.share | Share % | label | components/news/power-grid/MacroTrendsTab.tsx:1442 |
| ge.macro.monthly.fuel-mix.row-name | {Furnace Oil (HFO) / India Imports / {name}} | label | components/news/power-grid/MacroTrendsTab.tsx:1460 |
| ge.macro.monthly.regional.title | Regional Maximum Peak Supply | heading | components/news/power-grid/MacroTrendsTab.tsx:1475 |
| ge.macro.monthly.regional.sub | Substation peak loads served by grid zone in {month} {year} (MW) — Tracked since 2014 | label | components/news/power-grid/MacroTrendsTab.tsx:1476-1478 |
| ge.macro.monthly.regional.table.caption | Regional Maximum Peak Supply, chart (category header: Zone; series: Regional Maximum Peak Supply, MW) | label | components/news/power-grid/MacroTrendsTab.tsx:1532-1536 |
| ge.macro.monthly.regional.col.zone | Grid Zone | label | components/news/power-grid/MacroTrendsTab.tsx:1546 |
| ge.macro.monthly.regional.col.peak | Peak Load (MW) | label | components/news/power-grid/MacroTrendsTab.tsx:1548 |
| ge.macro.monthly.regional.col.share | Share % | label | components/news/power-grid/MacroTrendsTab.tsx:1551 |
| ge.macro.monthly.trend.title | PGCB 13-Year Historical Growth Trends | heading | components/news/power-grid/MacroTrendsTab.tsx:1591 |
| ge.macro.monthly.trend.sub | Grid operational metrics charted monthly from 2013 to 2026 — the plotted values are PGCB's own {P}, the month-on-month changes in the tooltip are ours {D} • Tracked since January 2013 | label | components/news/power-grid/MacroTrendsTab.tsx:1592 |
| ge.macro.monthly.trend.toggle.peaks | Grid Peaks (MW) | button | components/news/power-grid/MacroTrendsTab.tsx:1608 |
| ge.macro.monthly.trend.toggle.energy | Energy (MKWh) | button | components/news/power-grid/MacroTrendsTab.tsx:1620 |
| ge.macro.monthly.trend.toggle.fuels | Fuel Trends | button | components/news/power-grid/MacroTrendsTab.tsx:1632 |
| ge.macro.monthly.trend.fuel-option.gas | Gas | option | components/news/power-grid/MacroTrendsTab.tsx:1641 |
| ge.macro.monthly.trend.fuel-option.coal | Coal | option | components/news/power-grid/MacroTrendsTab.tsx:1642 |
| ge.macro.monthly.trend.fuel-option.hfo | Furnace Oil (HFO) | option | components/news/power-grid/MacroTrendsTab.tsx:1643 |
| ge.macro.monthly.trend.fuel-option.diesel | Diesel | option | components/news/power-grid/MacroTrendsTab.tsx:1644 |
| ge.macro.monthly.trend.fuel-option.import | Imports | option | components/news/power-grid/MacroTrendsTab.tsx:1645 |
| ge.macro.monthly.trend.fuel-dropdown | Select Fuel (placeholder) / Fuel: (prefix) | control | components/news/power-grid/MacroTrendsTab.tsx:1647, 1652 |
| ge.macro.monthly.trend.peaks.tooltip.head | {month} {year} / Grid Peak | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1707-1708 |
| ge.macro.monthly.trend.peaks.tooltip.gen | Max Generation: {value} MW (YoY: {±pct}%) | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1713-1721 |
| ge.macro.monthly.trend.peaks.tooltip.demand | Peak Demand: {value} MW (YoY: {±pct}%) | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1727-1735 |
| ge.macro.monthly.trend.peaks.tooltip.deficit | Deficit Gap: {value} MW / Deficit Share: {pct}% | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1741-1749 |
| ge.macro.monthly.trend.peaks.tooltip.alert-severe | ⚠️ Severe Load Shedding Alert | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1764 |
| ge.macro.monthly.trend.peaks.tooltip.alert-moderate | ⚠️ Moderate Load Shedding Alert | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1766 |
| ge.macro.monthly.trend.peaks.tooltip.alert-stable | ✅ Stable Grid Capacity | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1767 |
| ge.macro.monthly.trend.legend.demand | Estimated Peak Demand | legend | components/news/power-grid/MacroTrendsTab.tsx:1775 |
| ge.macro.monthly.trend.legend.gen | Maximum Peak Generation | legend | components/news/power-grid/MacroTrendsTab.tsx:1776 |
| ge.macro.monthly.trend.energy.y-axis | {v} MKWh | axis | components/news/power-grid/MacroTrendsTab.tsx:1796 |
| ge.macro.monthly.trend.energy.tooltip.head | {month} {year} / Energy Net | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1823-1824 |
| ge.macro.monthly.trend.energy.tooltip.total | Total Generation: {value} MKWh (YoY Growth: {±pct}%) | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1829-1837 |
| ge.macro.monthly.trend.energy.tooltip.avg | Avg continuous dispatch: {value} MW — Calculated across {days} operational days | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1843-1848 |
| ge.macro.monthly.trend.energy.legend | Total Monthly Energy Generation (MKWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:1856 |
| ge.macro.monthly.trend.fuels.y-axis | {v} MKWh | axis | components/news/power-grid/MacroTrendsTab.tsx:1876 |
| ge.macro.monthly.trend.fuels.tooltip | {fuelLabel}: {value} MKWh / YoY Growth: {±pct}% / Share of Month Mix: {pct}% / Total Month Net: {value} MKWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:1897-1927 |
| ge.macro.monthly.trend.fuels.legend | {fuelLabel} Generation Trend (MKWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:1938 |
| ge.macro.monthly.trend.table.captions | PGCB monthly peak demand and generation, chart / PGCB monthly energy generation, chart / PGCB monthly generation from {fuel}, chart (category header: Month) | label | components/news/power-grid/MacroTrendsTab.tsx:1954-1961 |
| ge.macro.monthly.trend.table.series | Estimated Peak Demand (MW); Maximum Peak Generation (MW); Total Monthly Energy Generation (MKWh); {fuel} generation (MKWh) | label | components/news/power-grid/MacroTrendsTab.tsx:1969-1974 |
| ge.macro.monthly.footer.source | Source: PGCB Monthly System Operation Reports | link | components/news/power-grid/MacroTrendsTab.tsx:1979 |
| ge.macro.monthly.footer.source-file | PGCB monthly report: {filename} | footnote | components/news/power-grid/MacroTrendsTab.tsx:1991-1993 |
| ge.macro.monthly.footer.caveat | Peaks, demand, per-fuel energy and regional peak loads are PGCB's published monthly figures. The deficit, every share percentage and the month-on-month changes are ours, worked out from those. Each figure was read twice from the source report by two independent parsers; all 247 checked agreed. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:1996-2002 |
| ge.macro.monthly.footer.period | Data Period: {first month} {first year} - {last month} {last year} ({n} Consecutive Reports) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2005-2009 |

Note: per-month detail beyond headline figures renders via `PgcbMonthlyDetail` (components/news/power-grid/PgcbMonthlyDetail.tsx, external to this file — line 2026 here); its strings are not in this file.

### Pricing & Drivers (`pricing`)

(Exchange-sensitivity note at line 2046 inventoried elsewhere; its second paragraph at 2049 was not listed there, so it is captured here.)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.pricing.devaluation-note | A 40%+ devaluation of the BDT since 2021 has automatically increased fuel costs even when global commodity prices remain constant. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:2049 |
| ge.macro.pricing.retail.title | Retail Fuel & Macro Pricing Benchmarks | heading | components/news/power-grid/MacroTrendsTab.tsx:2063 |
| ge.macro.pricing.retail.sub | Historical correlation between BDT devaluation and retail petroleum price hikes — Tracked since 2010 | label | components/news/power-grid/MacroTrendsTab.tsx:2064 |
| ge.macro.pricing.retail.col.year | Year | label | components/news/power-grid/MacroTrendsTab.tsx:2072 |
| ge.macro.pricing.retail.col.diesel | Retail Diesel (Tk/L) | label | components/news/power-grid/MacroTrendsTab.tsx:2073 |
| ge.macro.pricing.retail.col.octane | Retail Octane (Tk/L) | label | components/news/power-grid/MacroTrendsTab.tsx:2074 |
| ge.macro.pricing.retail.col.lng | Spot LNG (USD/MMBtu) | label | components/news/power-grid/MacroTrendsTab.tsx:2075 |
| ge.macro.pricing.retail.col.coal | Import Coal (USD/Ton) | label | components/news/power-grid/MacroTrendsTab.tsx:2076 |
| ge.macro.pricing.retail.col.fx | Exchange Rate (BDT/USD) | label | components/news/power-grid/MacroTrendsTab.tsx:2077 |
| ge.macro.pricing.retail.col.cpi | Inflation Rate (CPI %) | label | components/news/power-grid/MacroTrendsTab.tsx:2078 |
| ge.macro.pricing.retail.cell-units | {v} Tk / ${v} / {v}% | unit | components/news/power-grid/MacroTrendsTab.tsx:2085-2090 |
| ge.macro.pricing.retail.footer.source | Source: BPC Retail Gazettes & Bangladesh Bank Databases | link | components/news/power-grid/MacroTrendsTab.tsx:2099 |
| ge.macro.pricing.retail.footer.caveat | As published. Not independently audited. | footnote | components/news/power-grid/MacroTrendsTab.tsx:2100 |
| ge.macro.pricing.retail.footer.period | Reporting Period: Historical Macro Pricing Benchmarks (2010 - 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2101 |

Note: the two upper cards render via `MacroPressureCard` and `FuelImportCostCard` (components/news/power-grid/MacroPricingDriverCards.tsx — line 2054-2055 here); their strings are not in this file.

### Global vs. Domestic (`global`)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.global.intro | Global Benchmark Comparison: Energy cost volatility in Bangladesh is structurally linked to global commodity indexes. This dashboard tracks global benchmark pricing (Brent Crude, World Bank Gas/JKM indexes, and IRENA Solar LCOE) against domestic retail tariffs since 1975, highlighting historical subsidy periods and cost de-linkages. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:2438 |
| ge.macro.global.intro-tail | Values are converted to BDT equivalents based on historical weighted interbank exchange rates. Click citations inside tooltips to view official verified publications. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:2441 |
| ge.macro.global.solar.title | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff | heading | components/news/power-grid/MacroTrendsTab.tsx:2469 |
| ge.macro.global.solar.sub | Global Average Solar LCOE vs. Domestic Solar Contracts (Tk/KWh) — Tracked since 2015 | label | components/news/power-grid/MacroTrendsTab.tsx:2470 |
| ge.macro.global.solar.chip | Solar Energy | chip | components/news/power-grid/MacroTrendsTab.tsx:2473 |
| ge.macro.global.solar.y-axis | {v} Tk | axis | components/news/power-grid/MacroTrendsTab.tsx:2482 |
| ge.macro.global.solar.fx-fallback | Hardcoded exchange-rate fallback 122.0 Tk/$ when a year has no entry in historicalExchangeRates | metric | components/news/power-grid/MacroTrendsTab.tsx:2487 |
| ge.macro.global.solar.tooltip.head | Solar PV Benchmarks ({year}) / Solar | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2494-2495 |
| ge.macro.global.solar.tooltip.lcoe | Global Solar LCOE: {v} US Cents/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2499-2500 |
| ge.macro.global.solar.tooltip.fx | Exchange Rate: {v} Tk/$ | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2503-2504 |
| ge.macro.global.solar.tooltip.lcoe-bdt | Global Solar (Tk/KWh equivalent): {v} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2507-2508 |
| ge.macro.global.solar.tooltip.bd | BD Solar Contract Tariff: {v} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2511-2512 |
| ge.macro.global.solar.tooltip.premium | Domestic Contract Premium: {+{v} Tk/KWh (Premium) / {v} Tk/KWh} | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2515-2518 |
| ge.macro.global.solar.tooltip.formula | Formula: (Global LCOE Cents * Exchange Rate) / 100 | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2522 |
| ge.macro.global.solar.tooltip.series-from | Series from: IRENA renewable costs, SREDA solar registry, BPDB planning / Ref: SREDA Databases | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2525-2526 |
| ge.macro.global.solar.legend.global | Global Solar LCOE (Tk/KWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:2533 |
| ge.macro.global.solar.legend.bd | BD Solar Tariff (Tk/KWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:2534 |
| ge.macro.global.solar.table.caption | Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart (category header: Year) | label | components/news/power-grid/MacroTrendsTab.tsx:2542-2543 |
| ge.macro.global.solar.footer.source | Source: IRENA Renewable Cost Databases & BPDB Power Purchase Agreements (PPAs) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2553 |
| ge.macro.global.solar.footer.caveat | As published. Not independently audited. | footnote | components/news/power-grid/MacroTrendsTab.tsx:2554 |
| ge.macro.global.solar.footer.period | Reporting Period: Global Cost Comparison (2015 - 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2555 |

Note: the Brent-vs-Diesel and LNG-vs-Tariff cards render via `GridBrentDieselCard` and `GridLngTariffCard` (components/news/power-grid/GlobalVsDomesticCards.tsx — lines 2447-2460 here); their strings are not in this file.

### National Budget & Infra (`budget`)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.budget.chart.title | National Budget vs Capacity & Peak Generation | heading | components/news/power-grid/MacroTrendsTab.tsx:528 |
| ge.macro.budget.chart.sub | Power sector fiscal allocation (Crore BDT) plotted against installed capacity and peak generation (MW) — Tracked since 2011 | label | components/news/power-grid/MacroTrendsTab.tsx:529 |
| ge.macro.budget.chart.chip | FY 2011 - 2027 | chip | components/news/power-grid/MacroTrendsTab.tsx:531 |
| ge.macro.budget.chart.legend.budget | Power Budget (Cr Tk) | legend | components/news/power-grid/MacroTrendsTab.tsx:537 |
| ge.macro.budget.chart.legend.cap | Installed Cap. (MW) | legend | components/news/power-grid/MacroTrendsTab.tsx:538 |
| ge.macro.budget.chart.legend.peak | Peak Gen. (MW) | legend | components/news/power-grid/MacroTrendsTab.tsx:539 |
| ge.macro.budget.chart.y-axes | Cr (left) / MW (right) split-unit ticks | axis | components/news/power-grid/MacroTrendsTab.tsx:567, 578 |
| ge.macro.budget.chart.tooltip.head | {fiscal_year} Financials / {percentage}% of Budget | tooltip | components/news/power-grid/MacroTrendsTab.tsx:593-594 |
| ge.macro.budget.chart.tooltip.alloc-head | Fiscal Allocation | tooltip | components/news/power-grid/MacroTrendsTab.tsx:598 |
| ge.macro.budget.chart.tooltip.power-budget | Power & Energy Budget: {v} Cr Tk | tooltip | components/news/power-grid/MacroTrendsTab.tsx:600-601 |
| ge.macro.budget.chart.tooltip.total-budget | Total National Budget: {v} Cr Tk | tooltip | components/news/power-grid/MacroTrendsTab.tsx:604-605 |
| ge.macro.budget.chart.tooltip.infra-head | Grid Infrastructure | tooltip | components/news/power-grid/MacroTrendsTab.tsx:609 |
| ge.macro.budget.chart.tooltip.cap | Installed Capacity: {v} MW | tooltip | components/news/power-grid/MacroTrendsTab.tsx:611-612 |
| ge.macro.budget.chart.tooltip.peak | Peak Generation: {v} MW | tooltip | components/news/power-grid/MacroTrendsTab.tsx:615-616 |
| ge.macro.budget.chart.note.head | What is being shown? | heading | components/news/power-grid/MacroTrendsTab.tsx:631 |
| ge.macro.budget.chart.note.budget | Power Sector Budget (Crore BDT): The total fiscal allocation dedicated specifically to the Ministry of Power, Energy and Mineral Resources each fiscal year. | footnote | components/news/power-grid/MacroTrendsTab.tsx:633 |
| ge.macro.budget.chart.note.capacity | Installed Capacity vs Peak Generation (MW): The physical manifestation of those budgets—showing how much total capacity was built versus how much was actually utilized during peak hours. | footnote | components/news/power-grid/MacroTrendsTab.tsx:634 |
| ge.macro.budget.chart.note.insight | Analytical Insight: While fiscal allocation to the power sector has historically risen, the proposed FY2026-27 budget allocation dropped sharply to 17,345 Crore BDT (~1.85% of total national budget). This contraction signals a major policy pivot: the government is shifting focus away from massive capacity expansions to reviewing existing power purchase agreements (PPAs), reducing subsidies, and eliminating high capacity payments for underutilized plants. | footnote | components/news/power-grid/MacroTrendsTab.tsx:636-638 |
| ge.macro.budget.chart.footer.source | Source: Ministry of Finance & BPDB Annual Reports | link | components/news/power-grid/MacroTrendsTab.tsx:643 |
| ge.macro.budget.chart.footer.caveat | Every figure here is published — budget allocations and their share of the national budget by the Ministry of Finance, capacity and peak generation by BPDB. Nothing on this chart is computed by us; the two series are simply drawn on one pair of axes so the fiscal and physical build-out can be read together. Not independently audited. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:644-650 |
| ge.macro.budget.chart.footer.period | Data compiled from FY 2010-11 to FY 2026-27 | footnote | components/news/power-grid/MacroTrendsTab.tsx:651 |
| ge.macro.budget.chart.table.caption | National Budget vs Capacity and Peak Generation, chart (category header: Fiscal year; series: Power Budget (Cr Tk), Installed Cap. (MW), Peak Gen. (MW)) | label | components/news/power-grid/MacroTrendsTab.tsx:655-661 |
| ge.macro.budget.pricing.title | Historical Pricing & Tariff Comparison | heading | components/news/power-grid/MacroTrendsTab.tsx:670 |
| ge.macro.budget.pricing.sub | Analyze the exact BPDB weighted average bulk tariff vs average generation & procurement cost — Tracked since 2010 | label | components/news/power-grid/MacroTrendsTab.tsx:671 |
| ge.macro.budget.pricing.stat.current.label | Current Bulk: | label | components/news/power-grid/MacroTrendsTab.tsx:680 |
| ge.macro.budget.pricing.stat.current.value | {latest tariff} Tk/KWh | metric | components/news/power-grid/MacroTrendsTab.tsx:681 |
| ge.macro.budget.pricing.stat.current.tooltip | BERC Approved — The latest official wholesale bulk tariff set by the Bangladesh Energy Regulatory Commission (BERC) for utility distribution. Official Rate: {latest tariff} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:683-686 |
| ge.macro.budget.pricing.stat.baseline.label | 2010 Baseline: | label | components/news/power-grid/MacroTrendsTab.tsx:693 |
| ge.macro.budget.pricing.stat.baseline.value | {first tariff} Tk/KWh | metric | components/news/power-grid/MacroTrendsTab.tsx:694 |
| ge.macro.budget.pricing.stat.baseline.tooltip | Historical Anchor — The earliest recorded BERC bulk tariff in our dataset, establishing the historical cost baseline from March 2010. Initial Rate: {first tariff} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:696-699 |
| ge.macro.budget.pricing.stat.gen-cost.label | True Gen Cost: | label | components/news/power-grid/MacroTrendsTab.tsx:706 |
| ge.macro.budget.pricing.stat.gen-cost.value | {avgProductionCost} Tk/KWh | metric | components/news/power-grid/MacroTrendsTab.tsx:707 |
| ge.macro.budget.pricing.stat.gen-cost.tooltip | Real Production Cost — BPDB's current blended per-unit generation and procurement cost, factoring in fuel prices and IPP capacity payments. Tariff Deficit: {gap} Tk Gap | tooltip | components/news/power-grid/MacroTrendsTab.tsx:709-712 |
| ge.macro.budget.pricing.stat.tracked | Tracked since 2010 | chip | components/news/power-grid/MacroTrendsTab.tsx:722 |
| ge.macro.budget.pricing.legend.tariff | Bulk Tariff (Tk/kWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:751 |
| ge.macro.budget.pricing.legend.cost | BPDB Gen. Cost (Tk/kWh) | legend | components/news/power-grid/MacroTrendsTab.tsx:752 |
| ge.macro.budget.pricing.y-axis | {v} Tk | axis | components/news/power-grid/MacroTrendsTab.tsx:772 |
| ge.macro.budget.pricing.tooltip.head | {year} Financials / Deficit Gap | tooltip | components/news/power-grid/MacroTrendsTab.tsx:782-783 |
| ge.macro.budget.pricing.tooltip.tariff | Approved Bulk Tariff (BPDB to Utilities): {v} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:787-788 |
| ge.macro.budget.pricing.tooltip.cost | Total Generation & Procurement Cost: {v} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:791-792 |
| ge.macro.budget.pricing.tooltip.deficit | BPDB Unit Deficit / Subsidy Reqd: {v} Tk/KWh | tooltip | components/news/power-grid/MacroTrendsTab.tsx:795-796 |
| ge.macro.budget.pricing.note.head | What is being shown? | heading | components/news/power-grid/MacroTrendsTab.tsx:808 |
| ge.macro.budget.pricing.note.cost | BPDB Generation & Procurement Cost: The actual per-unit (kWh) cost incurred by BPDB. This includes the cost of fuel (gas, coal, HFO, LNG), cross-border electricity imports, operational/maintenance costs, and capacity charges paid to Independent Power Producers (IPPs) and Rental plants. | footnote | components/news/power-grid/MacroTrendsTab.tsx:810 |
| ge.macro.budget.pricing.note.tariff | Weighted Avg Bulk Tariff: The BERC-approved wholesale rate at which BPDB sells this electricity to distribution companies like DPDC, DESCO, REB, NESCO, and WZPDCL. | footnote | components/news/power-grid/MacroTrendsTab.tsx:811 |
| ge.macro.budget.pricing.note.insight | Analytical Insight: The gap between the average generation cost and the bulk wholesale tariff represents a structural deficit. Because BPDB sells power at a wholesale loss, this per-unit deficit must be directly subsidized by the Ministry of Finance to keep retail consumer prices lower. This widening deficit is unsustainable, placing a massive subsidy burden (estimated at 35k-40k Crore BDT annually) on the national treasury, highlighting that wholesale tariffs must either rise or the grid must phase out expensive IPP capacity charges to regain financial viability. | footnote | components/news/power-grid/MacroTrendsTab.tsx:813-815 |
| ge.macro.budget.pricing.footer.source | Source: BERC Tariff Orders & BPDB Annual Reports | link | components/news/power-grid/MacroTrendsTab.tsx:820 |
| ge.macro.budget.pricing.footer.caveat | As published. Not independently audited. | footnote | components/news/power-grid/MacroTrendsTab.tsx:821 |
| ge.macro.budget.pricing.footer.period | Reporting Period: FY 2010 - FY 2024 | footnote | components/news/power-grid/MacroTrendsTab.tsx:822 |
| ge.macro.budget.pricing.table.caption | Historical Pricing and Tariff Comparison, chart (category header: Year) | label | components/news/power-grid/MacroTrendsTab.tsx:826-827 |

Note: the "Comprehensive Macro-Economic Study" block renders via `LongitudinalStudyCharts` (components/news/power-grid/LongitudinalStudy.tsx — line 837 here); its strings are not in this file.

### Annual Reports (`reports`) — BPDB half + shared chrome

(Petrobangla half, 2292–2429, inventoried elsewhere.)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.reports.reconcile-note | These accounts do not reconcile against themselves. For BPDB, revenue plus subsidy minus cost should equal the stated profit or loss; it does on 4 of 11 years. FY24 is out by 8,100 crore and FY26 by 9,700 crore. The figures are shown exactly as published rather than adjusted to balance, which is why they still carry {P} — a published figure stays published even when it is wrong. Read the profit or loss line as stated, not as the other three columns imply. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:2119-2127 |
| ge.macro.reports.toggle.bpdb | BPDB Power Audited Statements | button | components/news/power-grid/MacroTrendsTab.tsx:2142 |
| ge.macro.reports.toggle.petrobangla | Petrobangla Gas Audited Statements | button | components/news/power-grid/MacroTrendsTab.tsx:2154 |
| ge.macro.reports.history-label | Audited Financial History | label | components/news/power-grid/MacroTrendsTab.tsx:2157 |
| ge.macro.reports.bpdb.chart.title | BPDB Annual Cost, Revenue & Subsidy Profile (Crore BDT) | heading | components/news/power-grid/MacroTrendsTab.tsx:2167 |
| ge.macro.reports.bpdb.chart.sub | Historical audited gap showing rising purchase costs vs treasury transfers — Tracked since 2010 | label | components/news/power-grid/MacroTrendsTab.tsx:2168 |
| ge.macro.reports.bpdb.tooltip.head | BPDB {year} Financials / Audited Ledger | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2186-2187 |
| ge.macro.reports.bpdb.tooltip.revenue | Operating Revenue: {v} Crore BDT | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2191-2192 |
| ge.macro.reports.bpdb.tooltip.cost | Gen & Purchase Cost: {v} Crore BDT | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2195-2196 |
| ge.macro.reports.bpdb.tooltip.subsidy | Government Subsidy: {v} Crore BDT | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2199-2200 |
| ge.macro.reports.bpdb.tooltip.loss | Net Profit/Loss: {v} Crore BDT | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2203-2204 |
| ge.macro.reports.bpdb.tooltip.formula | Formula: Net Profit/Loss = (Revenue + Subsidy) - Generation & Purchase Cost | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2208 |
| ge.macro.reports.bpdb.tooltip.source | Source: BPDB Annual Financial Report / As published. Not independently audited. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2211-2212 |
| ge.macro.reports.bpdb.legend.revenue | Operating Revenue | legend | components/news/power-grid/MacroTrendsTab.tsx:2219 |
| ge.macro.reports.bpdb.legend.subsidy | Govt Subsidy | legend | components/news/power-grid/MacroTrendsTab.tsx:2220 |
| ge.macro.reports.bpdb.legend.cost | Gen &amp; Purchase Cost — NOTE: this is a plain JS string, so the literal text "&amp;" renders in the legend instead of "&" (same at 2236) | legend | components/news/power-grid/MacroTrendsTab.tsx:2221 |
| ge.macro.reports.bpdb.legend.loss | Net Loss (after subsidy) | legend | components/news/power-grid/MacroTrendsTab.tsx:2222 |
| ge.macro.reports.bpdb.table.caption | BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart (category header: Year; series: Operating Revenue, Govt Subsidy, Gen &amp; Purchase Cost, Net Loss (after subsidy)) | label | components/news/power-grid/MacroTrendsTab.tsx:2230-2238 |
| ge.macro.reports.bpdb.chart.footer | Source: BPDB Annual Financial Reports / As published. Not independently audited. / Reporting Period: Audited Accounts (FY 2010 - FY 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2243-2245 |
| ge.macro.reports.bpdb.table.col.year | Fiscal Year | label | components/news/power-grid/MacroTrendsTab.tsx:2255 |
| ge.macro.reports.bpdb.table.col.revenue | Operating Revenue (Crore BDT) | label | components/news/power-grid/MacroTrendsTab.tsx:2257 |
| ge.macro.reports.bpdb.table.col.cost | Generation & Purchase Cost (Crore BDT) | label | components/news/power-grid/MacroTrendsTab.tsx:2260 |
| ge.macro.reports.bpdb.table.col.subsidy | Govt Subsidy Received (Crore BDT) | label | components/news/power-grid/MacroTrendsTab.tsx:2263 |
| ge.macro.reports.bpdb.table.col.loss | Net Profit / Loss (Crore BDT) | label | components/news/power-grid/MacroTrendsTab.tsx:2266 |
| ge.macro.reports.bpdb.table.footer | Source: BPDB Annual Financial Reports / As published. Not independently audited. / Reporting Period: Audited Financial Statements (FY 2010 - FY 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2286-2288 |

### Sector Glance & Losses (`system_loss`) — incl. the glanceIndicators array

The `glanceIndicators` array is declared at lines 283-417 and rendered inside the `system_loss` sub-tab ("Power Sector at a Glance", 2572-2655).

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.system-loss.glance.title | Power Sector at a Glance | heading | components/news/power-grid/MacroTrendsTab.tsx:2577 |
| ge.macro.system-loss.glance.sub | Official key indicators of grid capacity, consumer base, transmission, and performance | label | components/news/power-grid/MacroTrendsTab.tsx:2578 |
| ge.macro.system-loss.glance.capacity.label | Installed Capacity | label | components/news/power-grid/MacroTrendsTab.tsx:285 |
| ge.macro.system-loss.glance.capacity.value | 33,092 MW | metric | components/news/power-grid/MacroTrendsTab.tsx:286 |
| ge.macro.system-loss.glance.capacity.desc | Includes captive & renewable energy | footnote | components/news/power-grid/MacroTrendsTab.tsx:287 |
| ge.macro.system-loss.glance.capacity.tooltip-title | Official Installed Grid Capacity | tooltip | components/news/power-grid/MacroTrendsTab.tsx:290 |
| ge.macro.system-loss.glance.capacity.tooltip-desc | Total utility-scale grid-connected capacity monitored by BPDB is 26,300 MW, supplemented by 3,500 MW captive industrial plants and 3,292 MW of renewable capacity (including off-grid solar home systems and grid-tied solar). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:291 |
| ge.macro.system-loss.glance.capacity.highlight | Grid-Tied vs. Off-Grid: 85% Utility-Scale | tooltip | components/news/power-grid/MacroTrendsTab.tsx:292-293 |
| ge.macro.system-loss.glance.peak.label | Peak Generation | label | components/news/power-grid/MacroTrendsTab.tsx:296 |
| ge.macro.system-loss.glance.peak.value | 17,201 MW | metric | components/news/power-grid/MacroTrendsTab.tsx:297 |
| ge.macro.system-loss.glance.peak.desc | Recorded on May 20, 2026 | footnote | components/news/power-grid/MacroTrendsTab.tsx:299 |
| ge.macro.system-loss.glance.peak.tooltip-title | National Grid Peak Load Record | tooltip | components/news/power-grid/MacroTrendsTab.tsx:302 |
| ge.macro.system-loss.glance.peak.tooltip-desc | Verified maximum instantaneous active power generation delivered by public & private generators to the national grid during the summer peak load window. Monitored by PGCB's National Load Despatch Centre (NLDC). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:303 |
| ge.macro.system-loss.glance.peak.highlight | SCADA Verified Peak: 17,201 MW | tooltip | components/news/power-grid/MacroTrendsTab.tsx:304-305 |
| ge.macro.system-loss.glance.plants.label | Active Power Plants | label | components/news/power-grid/MacroTrendsTab.tsx:308 |
| ge.macro.system-loss.glance.plants.value | 137 Plants | metric | components/news/power-grid/MacroTrendsTab.tsx:309 |
| ge.macro.system-loss.glance.plants.desc | 0 retired/expired plants | footnote | components/news/power-grid/MacroTrendsTab.tsx:310 |
| ge.macro.system-loss.glance.plants.tooltip-title | BPDB Contracted Power Plants | tooltip | components/news/power-grid/MacroTrendsTab.tsx:313 |
| ge.macro.system-loss.glance.plants.tooltip-desc | Official count of grid-tied power stations under active Power Purchase Agreements (PPA) with the BPDB. Comprises 62 public units, 66 Independent Power Producers (IPPs), and 9 Rental/Quick Rental units. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:314 |
| ge.macro.system-loss.glance.plants.highlight | PPA Active Units: 137 Operational | tooltip | components/news/power-grid/MacroTrendsTab.tsx:315-316 |
| ge.macro.system-loss.glance.import.label | Import Capacity | label | components/news/power-grid/MacroTrendsTab.tsx:319 |
| ge.macro.system-loss.glance.import.value | 2,696 MW | metric | components/news/power-grid/MacroTrendsTab.tsx:320 |
| ge.macro.system-loss.glance.import.desc | Cross-border grid connection | footnote | components/news/power-grid/MacroTrendsTab.tsx:321 |
| ge.macro.system-loss.glance.import.tooltip-title | Cross-Border Interconnection | tooltip | components/news/power-grid/MacroTrendsTab.tsx:324 |
| ge.macro.system-loss.glance.import.tooltip-desc | Consolidated importing capability via cross-border transmission networks. Includes Bheramara HVDC (1,000 MW), Adani Power Godda link (1,496 MW), and Tripura radial link (200 MW). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:325 |
| ge.macro.system-loss.glance.import.highlight | HVDC Interconnectors: 2 Active Links | tooltip | components/news/power-grid/MacroTrendsTab.tsx:326-327 |
| ge.macro.system-loss.glance.lines.label | Transmission Lines | label | components/news/power-grid/MacroTrendsTab.tsx:330 |
| ge.macro.system-loss.glance.lines.value | 18,152 ckt km | metric | components/news/power-grid/MacroTrendsTab.tsx:331 |
| ge.macro.system-loss.glance.lines.desc | High-voltage grid network | footnote | components/news/power-grid/MacroTrendsTab.tsx:332 |
| ge.macro.system-loss.glance.lines.tooltip-title | PGCB Transmission Network Asset | tooltip | components/news/power-grid/MacroTrendsTab.tsx:335 |
| ge.macro.system-loss.glance.lines.tooltip-desc | Consolidated circuit kilometers of high-voltage transmission lines operated exclusively by PGCB: 400kV lines (approx. 2,100 ckt km), 230kV lines (approx. 4,300 ckt km), and 132kV lines (approx. 11,752 ckt km). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:336 |
| ge.macro.system-loss.glance.lines.highlight | National Grid Backbone: 100% PGCB Managed | tooltip | components/news/power-grid/MacroTrendsTab.tsx:337-338 |
| ge.macro.system-loss.glance.substation.label | Substation Capacity | label | components/news/power-grid/MacroTrendsTab.tsx:341 |
| ge.macro.system-loss.glance.substation.value | 91,242 MVA | metric | components/news/power-grid/MacroTrendsTab.tsx:342 |
| ge.macro.system-loss.glance.substation.desc | Grid substation network | footnote | components/news/power-grid/MacroTrendsTab.tsx:343 |
| ge.macro.system-loss.glance.substation.tooltip-title | Grid Transformation Capacity | tooltip | components/news/power-grid/MacroTrendsTab.tsx:346 |
| ge.macro.system-loss.glance.substation.tooltip-desc | Total installed transformer capacity across PGCB transmission grid substations. Includes 400kV, 230kV, and 132kV primary transformer ratings measured in Megavolt-Amperes (MVA). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:347 |
| ge.macro.system-loss.glance.substation.highlight | PGCB Transformer Assets: 91,242 MVA | tooltip | components/news/power-grid/MacroTrendsTab.tsx:348-349 |
| ge.macro.system-loss.glance.distribution.label | Distribution Lines | label | components/news/power-grid/MacroTrendsTab.tsx:352 |
| ge.macro.system-loss.glance.distribution.value | 658,563 km | metric | components/news/power-grid/MacroTrendsTab.tsx:353 |
| ge.macro.system-loss.glance.distribution.desc | Electrified lines (May 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:354 |
| ge.macro.system-loss.glance.distribution.tooltip-title | Distribution Network Grid Length | tooltip | components/news/power-grid/MacroTrendsTab.tsx:357 |
| ge.macro.system-loss.glance.distribution.tooltip-desc | Aggregated distribution line lengths (33kV, 11kV, and 0.4kV networks) operated by utilities. The Bangladesh Rural Electrification Board (BREB) holds the largest share with over 530,000 km of lines. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:358 |
| ge.macro.system-loss.glance.distribution.highlight | BREB Share: 80.5% of Lines | tooltip | components/news/power-grid/MacroTrendsTab.tsx:359-360 |
| ge.macro.system-loss.glance.consumers.label | Consumer Base | label | components/news/power-grid/MacroTrendsTab.tsx:363 |
| ge.macro.system-loss.glance.consumers.value | 49.94 Million | metric | components/news/power-grid/MacroTrendsTab.tsx:364 |
| ge.macro.system-loss.glance.consumers.desc | 49,941,000 links (May 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:365 |
| ge.macro.system-loss.glance.consumers.tooltip-title | Official Registered Accounts | tooltip | components/news/power-grid/MacroTrendsTab.tsx:368 |
| ge.macro.system-loss.glance.consumers.tooltip-desc | Aggregated live electricity meters across all six distribution utilities. The consumer base grew by 8.4% annually, driven by rural grid expansion under the 'Electricity for All' initiative. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:369 |
| ge.macro.system-loss.glance.consumers.highlight | Active Connections: 49,941,000 Accounts | tooltip | components/news/power-grid/MacroTrendsTab.tsx:370-371 |
| ge.macro.system-loss.glance.access.label | Electricity Access | label | components/news/power-grid/MacroTrendsTab.tsx:374 |
| ge.macro.system-loss.glance.access.value | 100.0% | metric | components/news/power-grid/MacroTrendsTab.tsx:375 |
| ge.macro.system-loss.glance.access.desc | Share of population connected | footnote | components/news/power-grid/MacroTrendsTab.tsx:376 |
| ge.macro.system-loss.glance.access.tooltip-title | National Electrification Ratio | tooltip | components/news/power-grid/MacroTrendsTab.tsx:379 |
| ge.macro.system-loss.glance.access.tooltip-desc | Official government declaration certifying universal electricity access. Accomplished through grid extensions by BREB and off-grid Solar Home Systems (SHS) deployed by IDCOL in remote island regions. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:380 |
| ge.macro.system-loss.glance.access.highlight | Off-Grid Solar Coverage: 8% of Population | tooltip | components/news/power-grid/MacroTrendsTab.tsx:381-382 |
| ge.macro.system-loss.glance.per-capita.label | Per Capita Gen. | label | components/news/power-grid/MacroTrendsTab.tsx:385 |
| ge.macro.system-loss.glance.per-capita.value | 661 kWh | metric | components/news/power-grid/MacroTrendsTab.tsx:386 |
| ge.macro.system-loss.glance.per-capita.desc | FY 2024-25, inc. captive & RE | footnote | components/news/power-grid/MacroTrendsTab.tsx:387 |
| ge.macro.system-loss.glance.per-capita.tooltip-title | Annual Per Capita Energy Metric | tooltip | components/news/power-grid/MacroTrendsTab.tsx:390 |
| ge.macro.system-loss.glance.per-capita.tooltip-desc | Calculated by dividing total annual gross generation (including captive industrial and renewable generation) by the national population estimate, serving as a primary indicator of economic productivity. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:391 |
| ge.macro.system-loss.glance.per-capita.highlight | FY 2024-25 Actual: 661 kWh / person | tooltip | components/news/power-grid/MacroTrendsTab.tsx:392-393 |
| ge.macro.system-loss.glance.irrigation.label | Irrigation Pumps | label | components/news/power-grid/MacroTrendsTab.tsx:396 |
| ge.macro.system-loss.glance.irrigation.value | 498,000 | metric | components/news/power-grid/MacroTrendsTab.tsx:397 |
| ge.macro.system-loss.glance.irrigation.desc | Agriculture connections | footnote | components/news/power-grid/MacroTrendsTab.tsx:398 |
| ge.macro.system-loss.glance.irrigation.tooltip-title | Agricultural Grid Connections | tooltip | components/news/power-grid/MacroTrendsTab.tsx:401 |
| ge.macro.system-loss.glance.irrigation.tooltip-desc | Dedicated power connections for seasonal crop watering (Boro season). Monitored under agricultural tariff subsidies to ensure food security. Peak demand occurs from February to April. | tooltip | components/news/power-grid/MacroTrendsTab.tsx:402 |
| ge.macro.system-loss.glance.irrigation.highlight | Peak Agricultural Load: Demands up to 2,500 MW | tooltip | components/news/power-grid/MacroTrendsTab.tsx:403-404 |
| ge.macro.system-loss.glance.adp.label | ADP Allocation | label | components/news/power-grid/MacroTrendsTab.tsx:407 |
| ge.macro.system-loss.glance.adp.value | 18,409.52 Cr | metric | components/news/power-grid/MacroTrendsTab.tsx:408 |
| ge.macro.system-loss.glance.adp.desc | FY 2025-26 budget | footnote | components/news/power-grid/MacroTrendsTab.tsx:409 |
| ge.macro.system-loss.glance.adp.tooltip-title | National Development Budget | tooltip | components/news/power-grid/MacroTrendsTab.tsx:412 |
| ge.macro.system-loss.glance.adp.tooltip-desc | Capital expenditure allocation under the Annual Development Programme (ADP) specifically earmarked for the Power Division. Funded by government resources and foreign development partners (JICA, ADB, WB). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:413 |
| ge.macro.system-loss.glance.adp.highlight | ADP Earmark: 18,409.52 Crore BDT | tooltip | components/news/power-grid/MacroTrendsTab.tsx:414-415 |
| ge.macro.system-loss.target.label | Distribution System Loss Target | label | components/news/power-grid/MacroTrendsTab.tsx:2622 |
| ge.macro.system-loss.target.value | 7.35% | metric | components/news/power-grid/MacroTrendsTab.tsx:2624 |
| ge.macro.system-loss.target.desc | Official FY 2025-26 performance target (evaluated up to April 2026) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2627 |
| ge.macro.system-loss.target.tooltip-title | Target Distribution Loss | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2637 |
| ge.macro.system-loss.target.tooltip-desc | The official government performance contract target for utility-level power line distribution system losses (BPDB, BREB, DPDC, DESCO, WZPDCO, NESCO). | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2640 |
| ge.macro.system-loss.target.tooltip-highlight | Target Deadline: June 2026 | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2642-2643 |
| ge.macro.system-loss.glance.footer.source | Source: Ministry of Power, Energy and Mineral Resources (Power Division) | link | components/news/power-grid/MacroTrendsTab.tsx:2652 |
| ge.macro.system-loss.glance.footer.updated | Last Updated: Sunday, June 14, 2026 at 03:39 PM | footnote | components/news/power-grid/MacroTrendsTab.tsx:2653 |
| ge.macro.system-loss.trend.title | Historical System Loss Trends (T&D) | heading | components/news/power-grid/MacroTrendsTab.tsx:2662 |
| ge.macro.system-loss.trend.sub | Long-term reduction curves in transmission, distribution, and overall system loss — Tracked since 2001 | label | components/news/power-grid/MacroTrendsTab.tsx:2663 |
| ge.macro.system-loss.trend.chip | Last Updated: Wednesday, Sep 17, 2025 at 06:01 PM | chip | components/news/power-grid/MacroTrendsTab.tsx:2665 |
| ge.macro.system-loss.trend.y-axis | {v}% (domain fixed 0-30) | axis | components/news/power-grid/MacroTrendsTab.tsx:2688-2689 |
| ge.macro.system-loss.trend.tooltip.head | FY {fiscal_year} Loss Analysis / Power Cell | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2698-2699 |
| ge.macro.system-loss.trend.tooltip.transmission | Transmission Loss: {v}% | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2707-2709 |
| ge.macro.system-loss.trend.tooltip.distribution | Distribution Loss: {v}% | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2714-2716 |
| ge.macro.system-loss.trend.tooltip.total | Total T&D Loss: {v}% | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2721-2723 |
| ge.macro.system-loss.trend.tooltip.utility-head | Utility Distribution Loss | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2729 |
| ge.macro.system-loss.trend.tooltip.utilities | BPDB: {v}% / REB: {v}% / DPDC: {v}% / DESCO: {v}% / WZPDCO: {v}% or — / NESCO: {v}% or — | tooltip | components/news/power-grid/MacroTrendsTab.tsx:2732-2753 |
| ge.macro.system-loss.trend.legend.total | Total T&amp;D Loss — NOTE: plain JS string, the literal "&amp;" renders in the legend (same pattern as 2221) | legend | components/news/power-grid/MacroTrendsTab.tsx:2767 |
| ge.macro.system-loss.trend.legend.distribution | Distribution Loss | legend | components/news/power-grid/MacroTrendsTab.tsx:2768 |
| ge.macro.system-loss.trend.legend.transmission | Transmission Loss | legend | components/news/power-grid/MacroTrendsTab.tsx:2769 |
| ge.macro.system-loss.trend.table.caption | Historical System Loss Trends (TandD), chart (category header: Fiscal year; series: Total T&D Loss, Distribution Loss, Transmission Loss) | label | components/news/power-grid/MacroTrendsTab.tsx:2777-2784 |
| ge.macro.system-loss.trend.note.head | Overview and Trends: | heading | components/news/power-grid/MacroTrendsTab.tsx:2789 |
| ge.macro.system-loss.trend.note.p1 | Bangladesh has made significant strides in upgrading its grid performance over the last two decades. The total Transmission & Distribution (T&D) system loss dropped from a peak of 27.97% in FY 2001-02 to {latest total_td}% in FY {latest fiscal_year}. | footnote | components/news/power-grid/MacroTrendsTab.tsx:2790-2792 |
| ge.macro.system-loss.trend.note.p2 | This rationalization was driven primarily by massive investments in prepaid metering, distribution substation reinforcement, and the conversion of low-voltage overhead lines to underground circuits in urban pockets. Technical transmission loss (high-voltage line resistance) has remained stable between 2.6% and 4.0% during this period. | footnote | components/news/power-grid/MacroTrendsTab.tsx:2793-2795 |
| ge.macro.system-loss.stats.title | Year-wise System Loss Statistics | heading | components/news/power-grid/MacroTrendsTab.tsx:2804 |
| ge.macro.system-loss.stats.sub | Audit-verified utility-wise and overall grid system loss records — Tracked since 2001 | label | components/news/power-grid/MacroTrendsTab.tsx:2805 |
| ge.macro.system-loss.stats.cols | FY / BPDB / REB / DPDC / DESCO / WZPDCO / NESCO / Distribution / Transmission / Total T&D | label | components/news/power-grid/MacroTrendsTab.tsx:2813-2827 |
| ge.macro.system-loss.stats.null-dash | — (shown when WZPDCO or NESCO is null) | metric | components/news/power-grid/MacroTrendsTab.tsx:2839-2840 |
| ge.macro.system-loss.stats.footer.source | Source: Power Cell, Ministry of Power, Energy and Mineral Resources | link | components/news/power-grid/MacroTrendsTab.tsx:2851 |
| ge.macro.system-loss.stats.footer.caveat | Every column is Power Cell's own published figure, the Total T&D included — it is not our sum of the two columns beside it, and would not match one: losses compound rather than add, so 7.38% distribution and 3.04% transmission give a 10.13% total, not 10.42%. | disclaimer | components/news/power-grid/MacroTrendsTab.tsx:2852-2857 |
| ge.macro.system-loss.stats.footer.period | Report Period: Year-wise Consolidated Audit (FY 2002 - FY 2025) | footnote | components/news/power-grid/MacroTrendsTab.tsx:2858 |

### Analyst & Investor Insights (`insights`) — remaining cards

(Advisory note 2870, D-tag caveat 2873-2879, Forex card 2916-2946 and Industrial Gas card 2948-2978 inventoried elsewhere.)

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.insights.ipp.title | Listed IPPs Receivables & Working Capital Risk | heading | components/news/power-grid/MacroTrendsTab.tsx:2888 |
| ge.macro.insights.ipp.sub | Analysis for Summit Power, Baraka, United Power equity holders | label | components/news/power-grid/MacroTrendsTab.tsx:2889 |
| ge.macro.insights.ipp.aging.label | BPDB Arrears Payment Aging: | label | components/news/power-grid/MacroTrendsTab.tsx:2894 |
| ge.macro.insights.ipp.aging.value | 150 - 180 Days | metric | components/news/power-grid/MacroTrendsTab.tsx:2895 |
| ge.macro.insights.ipp.arrears.label | Est. System Outstanding Arrears: | label | components/news/power-grid/MacroTrendsTab.tsx:2898 |
| ge.macro.insights.ipp.arrears.value | ~26,500 Crore BDT | metric | components/news/power-grid/MacroTrendsTab.tsx:2899 |
| ge.macro.insights.ipp.interest.label | Working Capital Interest Rate: | label | components/news/power-grid/MacroTrendsTab.tsx:2902 |
| ge.macro.insights.ipp.interest.value | 12.5% - 14.5% (Weighted Average) | metric | components/news/power-grid/MacroTrendsTab.tsx:2903 |
| ge.macro.insights.ipp.insight | Analytical Insight: Due to BPDB's treasury deficit, payment aging to private Independent Power Producers (IPPs) has inflated from 60 days to over 150 days. Listed IPPs carry heavy receivables on their balance sheets, forcing reliance on high-interest working capital loans (up to 14.5% in 2026), which compresses net profit margins and dilutes dividend payout capacity. | footnote | components/news/power-grid/MacroTrendsTab.tsx:2905-2907 |
| ge.macro.insights.ipp.footer | Source: BPDB Finance Reports / As published. Not independently audited. / Reporting Date: Jun 2026 | footnote | components/news/power-grid/MacroTrendsTab.tsx:2910-2912 |
| ge.macro.insights.capacity.title | Grid Capacity Margin & Overcapacity Charges | heading | components/news/power-grid/MacroTrendsTab.tsx:2984 |
| ge.macro.insights.capacity.sub | The operational driver of the national power subsidy | label | components/news/power-grid/MacroTrendsTab.tsx:2985 |
| ge.macro.insights.capacity.installed.label | Installed National Grid Capacity: | label | components/news/power-grid/MacroTrendsTab.tsx:2990 |
| ge.macro.insights.capacity.installed.value | 28,420 MW | metric | components/news/power-grid/MacroTrendsTab.tsx:2991 |
| ge.macro.insights.capacity.peak.label | Peak Daily Grid Load (Evening): | label | components/news/power-grid/MacroTrendsTab.tsx:2994 |
| ge.macro.insights.capacity.peak.value | 16,154.41 MW | metric | components/news/power-grid/MacroTrendsTab.tsx:2995 |
| ge.macro.insights.capacity.surplus.label | Surplus Unutilized Capacity: | label | components/news/power-grid/MacroTrendsTab.tsx:2998 |
| ge.macro.insights.capacity.surplus.value | 43.16% (12,266 MW idle) | metric | components/news/power-grid/MacroTrendsTab.tsx:2999 |
| ge.macro.insights.capacity.insight | Analytical Insight: Bangladesh operates with a surplus capacity of 43.16%. While providing base-load security, it triggers contractually binding "capacity charges" paid to idle private power plants. These structural capacity charges cost the state an estimated 1.88 Crore BDT daily, driving BPDB's 39,000 Crore BDT operating subsidy requirement. | footnote | components/news/power-grid/MacroTrendsTab.tsx:3001-3003 |
| ge.macro.insights.capacity.footer | Source: BPDB Annual Financials / As published. Not independently audited. / Reporting Date: Jun 2026 | footnote | components/news/power-grid/MacroTrendsTab.tsx:3006-3008 |

### Published vs Derived (`verification`) — host chrome

| id | current text | type | file:line |
|---|---|---|---|
| ge.macro.verification.host | No text of its own in this file — the sub-tab renders `<PublishedVsDerivedTab latestGridDay={latestDate} />` (strings live in components/news/power-grid/PublishedVsDerivedTab.tsx); the shared P/D provenance note is deliberately suppressed on this sub-tab (`macroSubTab !== 'verification'` guard at line 493) | tab | components/news/power-grid/MacroTrendsTab.tsx:2864, 493 |
## Technical Info tab (lines 954–2335) — components/news/power-grid/TechnicalInfoTab.tsx

### Glossary (transmission)
| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.glossary.circuit-km | Circuit km (ckt km) — Length of wire rather than length of route — a tower line carrying two circuits counts twice. | footnote | TechnicalInfoTab.tsx:954-955 |
| ge.technical.glossary.mva-mw | MVA / MW — Two different things that both sound like size. MVA rates what a substation can pass; MW measures power actually flowing. They cannot be added together. | footnote | TechnicalInfoTab.tsx:958-959 |
| ge.technical.glossary.hvdc-station | HVDC Station — A converter station. Bangladesh's grid and India's run out of step with each other, so power is turned into DC and back to cross between them. | footnote | TechnicalInfoTab.tsx:962-963 |
| ge.technical.glossary.others-capacity | Others Capacity — Lines and substations on the network that someone other than PGCB owns. Listed separately so PGCB's own assets are not overstated. | footnote | TechnicalInfoTab.tsx:966-967 |

### Substation database
| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.substations.header.title | National Grid Substation Database | heading | TechnicalInfoTab.tsx:988 |
| ge.technical.substations.header.updated-badge | Last Updated: Sunday, May 24, 2026 at 02:12 PM | label | TechnicalInfoTab.tsx:990 |
| ge.technical.substations.header.description | Every substation on the national grid — the sites where voltage is stepped down and power changes hands. Search or filter the list below. | label | TechnicalInfoTab.tsx:994 |
| ge.technical.substations.summary.title | Substation Database Summary | heading | TechnicalInfoTab.tsx:1004 |
| ge.technical.substations.summary.register-entries | Register Entries · {n} Rows | metric | TechnicalInfoTab.tsx:1014-1015 |
| ge.technical.substations.summary.filtered-capacity | Filtered Capacity · {n} MVA | metric | TechnicalInfoTab.tsx:1018-1019 |
| ge.technical.substations.summary.unique-zones | Unique Zones · 9 Zones | metric | TechnicalInfoTab.tsx:1022-1023 |
| ge.technical.substations.summary.grid-circle-groups | Grid Circle Groups · HVDC & Circles | metric | TechnicalInfoTab.tsx:1026-1027 |
| ge.technical.substations.summary.footer.source | Source: PGCB substation register | link | TechnicalInfoTab.tsx:1032 |
| ge.technical.substations.summary.footer.disclaimer | Each substation is listed as PGCB states it; the counts and the capacity total are ours … 260 rows cover 227 distinct stations … Filtered Capacity sums only the MVA-rated transformers … This station list is the April 2026 collection and has not been re-collected since. Summed whole it comes to 89,155 MVA, which matched PGCB's April total exactly; PGCB has since published 91,512 MVA for June, so the list now trails the summary tables above by 2,357 MVA. | disclaimer | TechnicalInfoTab.tsx:1033-1050 |
| ge.technical.substations.summary.footer.as-at | Register as at: April 2026 | footnote | TechnicalInfoTab.tsx:1051 |
| ge.technical.substations.assets-table.title | Substation Assets & Capacity — Active substations and transformer ratings as of June 2026 | heading | TechnicalInfoTab.tsx:1061-1062 |
| ge.technical.substations.assets-table.cols | Rating / Type · Quantity · Capacity (MVA) · Others Capacity | label | TechnicalInfoTab.tsx:1070-1078 |
| ge.technical.substations.assets-table.rows | 400 kV HVDC Back-to-Back (1 Station, 2x500 MW, —) · 400/230 kV (11 Nos., 16,180 MVA, 3 Nos. (2,730 MVA)) · 400/132 kV (5 Nos., 4,590 MVA, —) · 230/132 kV (36 Nos., 24,725 MVA, 1 Nos. (250 MVA)) · 230/33 kV (2 Nos., 700 MVA, 4 Nos. (1,050 MVA)) · 132/33 kV (150 Nos., 33,627 MVA, 46 Nos. (7,661 MVA)) · Overall Substation Capacity (259 Stations, 91,512 MVA) · Dispatch Capacity (33kV level) 38,733 MW | metric | TechnicalInfoTab.tsx:1084-1126 |
| ge.technical.substations.assets-table.footer.source | Source: Power Grid Bangladesh PLC — substation assets | link | TechnicalInfoTab.tsx:1132 |
| ge.technical.substations.assets-table.footer.disclaimer | Every row here is PGCB's, including the Overall line … 259 stations, matching exactly, and 91,513 MVA against the 91,512 PGCB prints — a 1 MVA difference in PGCB's own arithmetic, shown as published rather than quietly corrected. The HVDC back-to-back station sits outside the MVA total … | disclaimer | TechnicalInfoTab.tsx:1133-1142 |
| ge.technical.substations.assets-table.footer.as-at | Assets as at: June 2026 | footnote | TechnicalInfoTab.tsx:1143 |
| ge.technical.substations.filters | Filter substations · Search substation name... · All Voltage Classes · All Operation Zones · All Owners | control | TechnicalInfoTab.tsx:1155-1194 |
| ge.technical.substations.table.density | Density · comfortable / compact | control | TechnicalInfoTab.tsx:1205-1218 |
| ge.technical.substations.table.scroll-hint | Swipe horizontally to see all columns | label | TechnicalInfoTab.tsx:1224 |
| ge.technical.substations.table.empty | No substations match your filter criteria. | empty-state | TechnicalInfoTab.tsx:1231 |
| ge.technical.substations.table.aria-label | National grid substation registry | label | TechnicalInfoTab.tsx:1232 |
| ge.technical.substations.table.pager.noun | substations | label | TechnicalInfoTab.tsx:1244 |
| ge.technical.substations.table.cols | SN · Substation Name · Voltage Class · Operation Zone · Transformer Detail · Total Capacity · Ownership · Grid Circle | label | TechnicalInfoTab.tsx:1252-1259 |
| ge.technical.substations.glossary | Jargon, translated: MVA (Megavolt-Ampere) · kV (Kilovolt Class) · Transformer Code · Owner Groups (+ definitions) | footnote | TechnicalInfoTab.tsx:1304-1321 |

### Projects (ongoing / upcoming / completed)
| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.projects.header.title | Ongoing Projects / Upcoming Projects | heading | TechnicalInfoTab.tsx:1335 |
| ge.technical.projects.header.desc.ongoing | Detailed status tracking of PGCB high-voltage grid upgrades, river crossings, and transmission line projects. | label | TechnicalInfoTab.tsx:1339 |
| ge.technical.projects.header.desc.upcoming | Planned high-voltage grid expansions, battery energy storage systems (BESS), and power transmission line projects in the pipeline. | label | TechnicalInfoTab.tsx:1340 |
| ge.technical.projects.header.count-badge | {count} Projects under tracking | chip | TechnicalInfoTab.tsx:1345-1346 |
| ge.technical.projects.tabs | Ongoing Projects ({n}) · Upcoming Projects ({n}) · Completed Projects ({n}) | subtab | TechnicalInfoTab.tsx:1362-1385, 1725-1745 |
| ge.technical.projects.filters.search.placeholder | Search project name, objective, partner... | control | TechnicalInfoTab.tsx:1395 |
| ge.technical.projects.filters.partner | Partner: {All Development Partners / value}; options: EXIM Bank of India / World Bank / ADB / AIIB / JICA / EDCF / KfW / Exim Bank China (G to G) / Indian LoC / N/A | control | TechnicalInfoTab.tsx:1410-1423 |
| ge.technical.projects.card.chips | Partner: {partner} · Duration: {duration} | chip | TechnicalInfoTab.tsx:1457-1460, 1565-1568, 1809-1812 |
| ge.technical.projects.card.ongoing.progress | Physical Progress {value} · Financial Progress {value} | metric | TechnicalInfoTab.tsx:1469-1479 |
| ge.technical.projects.card.sections | Objectives · Scope of Work | heading | TechnicalInfoTab.tsx:1491-1499, 1831-1843 |
| ge.technical.projects.card.cost | Total Project Cost · GOB Contribution · Project Aid (PA) · PGCB Funding · Development Partner | label | TechnicalInfoTab.tsx:1511-1523, 1612-1620, 1855-1867 |
| ge.technical.projects.card.ongoing.footer | Project Director: {x} · Office: {x} · Mobile: {x} · Email: {x} · Source: {x} · Updated: {x} | metric | TechnicalInfoTab.tsx:1531-1547 |
| ge.technical.projects.card.upcoming.status | {statusInfo.label} · {uProj.status} · Upcoming Pipeline Project | chip | TechnicalInfoTab.tsx:1579-1629 |
| ge.technical.projects.empty-state | No {projectType} projects found matching the filters or search query. | empty-state | TechnicalInfoTab.tsx:1644 |
| ge.technical.projects.pagination | Showing {from} to {to} of {total} {projectType} projects · Page {p} of {n} | label | TechnicalInfoTab.tsx:1652-1667 |
| ge.technical.projects.footer.source | Source: PGCB project documents, cited per project on each card above | link | TechnicalInfoTab.tsx:1682 |
| ge.technical.projects.footer.disclaimer | Every project's name, partner, cost, duration and status is as the source document states it. The counts are ours … Checked against PGCB's live ongoing-projects list on 13 Aug 2026: all 13 match … PGCB publishes no upcoming-projects list on its site, so … these 7 cannot be reconciled against a live PGCB page. | disclaimer | TechnicalInfoTab.tsx:1684-1688 |
| ge.technical.completed.header | Completed Projects — Comprehensive registry of successfully completed high-voltage transmission lines, substations, and grid network infrastructure projects. · {n} Completed Projects | heading | TechnicalInfoTab.tsx:1702-1710 |
| ge.technical.completed.filters | Search completed project name, objective, scope... · Partner options: ADB / IDB / World Bank / JICA / EDCF / KfW / DANIDA / PGCB / N/A | control | TechnicalInfoTab.tsx:1755-1783 |
| ge.technical.completed.card.badges | Completed Project · Successfully Commissioned · No objectives detailed. | chip | TechnicalInfoTab.tsx:1822, 1839, 1876 |
| ge.technical.completed.empty-state | No completed projects found matching the filters or search query. | empty-state | TechnicalInfoTab.tsx:1889 |
| ge.technical.completed.footer.disclaimer | Each completed project is described as its source document states it; the count is ours. Checked against PGCB's live completed-projects list on 13 Aug 2026: 50 of these 51 appear on it … The one exception is the Western Grid Network Development Project (kfW, completed June 2022) … kept rather than dropped … | disclaimer | TechnicalInfoTab.tsx:1929-1936 |

### Grid diagrams (PDF embeds)
| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.gridnet | National Grid Network Diagram — Schematic mapping of grid interconnectivity across Bangladesh · Open PDF in New Tab · description · Diagram Key & Technical Footnote (Line Voltages / Substation Nodes / Asynchronous Interface / Document Details) | heading | TechnicalInfoTab.tsx:1955-2006 |
| ge.technical.geomap | Geographical Grid Map — Geographic layout and physical routing of national transmission lines · Open PDF in New Tab · description · Mapping & Geography Footnote (Physical Routing / River Crossings / Scale Projection / Data Sources) | heading | TechnicalInfoTab.tsx:2025-2076 |
| ge.technical.opgwmap | OPGW Fiber Network Map — National Optical Ground Wire (OPGW) telecommunication backbone network · Open PDF in New Tab · description · OPGW & Telecom Footnote (OPGW / SCADA & Telemetry / Commercial Leasing / Planning Source) | heading | TechnicalInfoTab.tsx:2095-2146 |

### Optical fiber leasing
| id | current text | type | file:line |
|---|---|---|---|
| ge.technical.opgwlease.title | Optical Fiber Leasing | heading | TechnicalInfoTab.tsx:2165 |
| ge.technical.opgwlease.intro | Power Grid Bangladesh PLC (Power Grid) is responsible to transmit high voltage power across the whole country … After 2008, Power Grid adopted new optical fiber based communication technology … | label | TechnicalInfoTab.tsx:2167 |
| ge.technical.opgwlease.intro-secondary | Till June 2026, Power Grid has installed around 11,876 km of OPGW … leased out to local telecommunication operator … | label | TechnicalInfoTab.tsx:2173 |
| ge.technical.opgwlease.licensing | Licensing & Leasing Agreements — NTTN Licensing (NOFTTN 2005 → NTTN 2014) · Partner Organizations: Total 10 (ten) … · Capacity Leased: Total 22,611.66 KM (22,611.66 x 2=45,223.33 Core-km) … till June 2026 | metric | TechnicalInfoTab.tsx:2187-2209 |
| ge.technical.opgwlease.licensing.note | Quoted as PGCB writes it, including the arithmetic: 22,611.66 × 2 is 45,223.32, not the 45,223.33 printed. The figure is left as published rather than silently corrected. | disclaimer | TechnicalInfoTab.tsx:2210-2214 |
| ge.technical.opgwlease.backbone | Transmission Network & Backbone Capacity — Dhaka – Kuakata – Benapole route … 9.6 / 13.2 Tbps backbone capacity (operational capacity: 800 Gbps) · Leased Data Capacity (Dec 2025): 200 Gbps (To International Internet Gateway (IIG) operators) | metric | TechnicalInfoTab.tsx:2225-2235 |
| ge.technical.opgwlease.pricing | Dark Fiber Lease Rate · Effective: 01.01.2026 · Tk. 5.40 / Core / Meter / Month · Monthly Recurring Charge (MRC) including Tax & excluding VAT. · Annual Increment Tk. 0.20 / Year | metric | TechnicalInfoTab.tsx:2250-2265 |
| ge.technical.opgwlease.contact | OFCL Contact Details — Superintending Engineer, Optical Fiber Commercial Leasing (OFCL) · Office Address: Level-10, Grid Bhaban, Avenue-3, Jahurul Islam City, Aftabnagar, Badda, Dhaka-1212. · Email Query: se.ofcl@pgcb.gov.bd | label | TechnicalInfoTab.tsx:2271-2283 |
| ge.technical.opgwlease.glossary | Jargon, translated: Core-km · Tbps / Gbps · NTTN / NTTN License · Dark Optical Fiber · SCADA / PLC (+ definitions) | footnote | TechnicalInfoTab.tsx:2293-2314 |
| ge.technical.opgwlease.footer | Source: Power Grid Bangladesh PLC — Optical Fiber Commercial Leasing · Fiber lengths, partner counts, backbone capacity and the lease rate are quoted as PGCB publishes them. Nothing on this page is computed here. · Stated as at: June 2026 · rate effective 01.01.2026 | disclaimer | TechnicalInfoTab.tsx:2320-2325 |
## DailyCostCard.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.dailycost.unpublished | Per-fuel cost not published for this day · PGCB's report for this date carries no production-cost breakdown by fuel. · The published day total — {v} Cr Tk. — is shown above. | heading | DailyCostCard.tsx:41-46 |
| ge.dailycost.title | Daily Fuel & Import Cost · Cost in Crore BDT by fuel type (Total: {v} Cr Tk. ) • / per-fuel split not published for this day · Cost Analysis | heading | DailyCostCard.tsx:81-88 |
| ge.dailycost.chart.aria | Daily Fuel and Import Cost, chart | label | DailyCostCard.tsx:96 |
| ge.dailycost.tooltip | {row.name} Daily Cost · Published Cost · Total Daily Cost: {cr} Crore BDT · Average Unit Rate: {v} Tk/KWh · PGCB publishes this fuel's cost and its generation. Unit rate = cost ÷ (gen × 10⁶), calculated here. · Source: PGCB daily report, "Cost of the Consumed Fuel" block · Restates BPDB fuel economics. Not audited by ESB PowerLine. | tooltip | DailyCostCard.tsx:120-143 |
| ge.dailycost.legend | Daily Cost (Cr Tk) | legend | DailyCostCard.tsx:152 |
| ge.dailycost.table | Daily Fuel and Import Cost, chart · Fuel · Daily Cost (Cr Tk) | label | DailyCostCard.tsx:178-182 |
| ge.dailycost.kpis | Avg Production Cost (Tk/KWh) · Total Gas to Power (MMCFD) | label | DailyCostCard.tsx:190-207 |
| ge.dailycost.footer | Source: PGCB Daily Report — P1 sheet, production-cost block and gas-supplied line · PGCB · Restates BPDB fuel economics. Unit rates are ours. Not independently audited. · Reporting Date: {date} | footnote | DailyCostCard.tsx:218-221 |

## UnitCostBadge.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.unitcostbadge.corroborated | 2× · Corroborated. BPDB publishes the same production cost and the same energy independently, in its own Daily Electricity Generation Report with its own control totals, and the rate derived from those figures agrees with this one. | chip | UnitCostBadge.tsx:16-21 |
| ge.unitcostbadge.disagreement | != · Two publishers state the cost and energy behind this rate and they disagree by more than their printing precision allows. Neither figure has been altered. | chip | UnitCostBadge.tsx:24-28 |
| ge.unitcostbadge.administered | flat · Administered rate, not a measurement. The publisher applies a fixed Tk/kWh to this fuel rather than reporting an observed cost … read it as a tariff in force on this day, not as what the fuel cost that day. | chip | UnitCostBadge.tsx:31-43 |
| ge.unitcostbadge.published-only | 1× · Derived from this agency's published cost and energy. No second publisher states the same inputs for this fuel, so there is no independent check. | chip | UnitCostBadge.tsx:46-50 |
| ge.unitcostbadge.awaiting-witness | 1× · Derived from this agency's published cost and energy, and not yet cross-checked. The second-publisher comparison is a periodic export from BPDB's own daily reports and this day falls after the last one loaded — so the check is outstanding, not failed … | chip | UnitCostBadge.tsx:53-59 |
| ge.unitcostbadge.detail | {secondPublisher} derives {v} Tk/kWh from its own published figures (difference {v}). · Cross-checks currently run through {witnessThrough}. | tooltip | UnitCostBadge.tsx:73-77 |

## BpdbAccountsPanel.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.bpdb.groups | Electricity BPDB bought · Fuel BPDB burnt itself · Fixed and staff costs · Network charges | label | BpdbAccountsPanel.tsx:49-52 |
| ge.bpdb.sources | Public sector · Joint venture · Private — IPP & rental · Imported from India | label | BpdbAccountsPanel.tsx:72-75 |
| ge.bpdb.heading | BPDB Annual Accounts · Annual · Purchase prices over a whole financial year, from BPDB's own published accounts — the capacity payments and contracted charges a daily fuel bill cannot show | heading | BpdbAccountsPanel.tsx:197-205 |
| ge.bpdb.control.fy | Financial year · FY | control | BpdbAccountsPanel.tsx:214-219 |
| ge.bpdb.kpis | Imports, annual ({cr} Cr ÷ {mkwh} MkWh / Not separable in FY {fy}) · IPP & rental (…) · All-in generation (BPDB's own figure, FY {fy} / Not printed for FY {fy}) · Thermal fuel only (…) · Operating expenditure (Total operating expenses, Crore BDT) · Energy sales revenue (Revenue from energy sales / Not printed …) · Government subsidy (Covers {pct}% of the shortfall / Not stated for FY {fy}) · Cost recovered in tariff (Sold at {v} against {v} Tk/kWh / Bulk tariff not printed for FY {fy}) | label | BpdbAccountsPanel.tsx:234-305 |
| ge.bpdb.opex | Operating expenditure by head · {cr} Crore BDT · Share of total · cols Cost head · Group · Crore BDT · Share · Total operating expenses · 100.0% · tooltip "The two extraction engines disagreed on this head; the figure shown is the one BPDB's {resolvedBy} supports." · aria "Reconciled against BPDB's {resolvedBy}" | heading | BpdbAccountsPanel.tsx:314-416 |
| ge.bpdb.sources.chart | Where the power came from · MkWh · MkWh · share | heading | BpdbAccountsPanel.tsx:429-453 |
| ge.bpdb.explanation.what | PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost. BPDB's audited accounts do, once a year, and this card reads FY {fy} of them … (reconciles / difference of {cr} Crore. Both figures are as published; the discrepancy is BPDB's.) … Dividing that total by the {mkwh} MkWh BPDB reports selling in bulk gives {v} Tk/kWh, against the {v} Tk/kWh BPDB prints … | disclaimer | BpdbAccountsPanel.tsx:480-521 |
| ge.bpdb.explanation.extraction | How these were extracted. BPDB publishes the accounts as a PDF, not as data. Two engines read every figure independently … A figure settled that way is marked † in the table — {n} of the {m} heads this year / , and no head this year needed it. Amounts print in Lac Taka on the older reports and Crore on the newer ones … a factor-of-100 error. | disclaimer | BpdbAccountsPanel.tsx:525-541 |
| ge.bpdb.explanation.coverage | What is not here. Coverage stops at FY {fy}. BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and every report before FY {fy} is a page scan with no text layer … {BPDB_IMPORT_CAVEAT} · {BPDB_OWN_GENERATION_NOTE} | disclaimer | BpdbAccountsPanel.tsx:544-550 |
| ge.bpdb.explanation.insight | The daily table prices imports at {v} Tk/kWh; BPDB paid {v} Tk/kWh for the same electricity across the year … · Against {v} Tk/kWh for power bought from private producers, imports were the cheaper purchase that year … · BPDB spent {cr} Crore BDT more than it earned selling energy, and a subsidy covered {pct}% of that shortfall; BPDB books other income beyond energy sales, so this is not its bottom line. · A unit cost {v} Tk/kWh to supply in bulk and sold for {v} — a shortfall of {v} Tk on every kWh, which is what the subsidy is for. | disclaimer | BpdbAccountsPanel.tsx:557-582 |
| ge.bpdb.footer | Source: … — {statement}, printed in {unit} and converted (1 Crore = 100 Lac) · As published. Not independently audited. · Reporting Period: Financial year {fy} · Series ends at FY {fy} — BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and its earlier reports are page scans with no readable text. | footnote | BpdbAccountsPanel.tsx:592-616 |

## PgcbMonthlyDetail.tsx

| id | current text | type | file:line |
|---|---|---|---|
| ge.pgcbmonthly.zones | Dhaka · Chattogram · Cumilla · Mymensingh · Sylhet · Khulna · Barishal · Rajshahi · Rangpur | label | PgcbMonthlyDetail.tsx:54-62 |
| ge.pgcbmonthly.delta | vs May · → ▲ ▼ | control | PgcbMonthlyDetail.tsx:226-247 |
| ge.pgcbmonthly.reliability | Days with load shed (evening peaks; {n} day peaks affected) · Max load shed (Peak shortfall on {when}) · Min load shed (Best evening peak, {when}) · Monthly load factor (Average load against peak demand) | label | PgcbMonthlyDetail.tsx:405-440 |
| ge.pgcbmonthly.heatmap.empty | No daily load shedding recorded. · This month's report gives a system-wide load shed of up to {n} MW but publishes no zone-by-zone breakdown. The zone rows below are blank because the figures were not reported — not because nothing was shed. Read the All zones row for what PGCB did record. · PGCB's report records no load shedding at {peak} on any day this month. | empty-state | PgcbMonthlyDetail.tsx:506-520 |
| ge.pgcbmonthly.heatmap.table | Zone · Total · tooltip {zone} · {date}: Not reported / {n} MW shed / No load shedding · No zone breakdown in this report · {zone} · month total · Summed across every {peak} this month · All zones · {n} MW generated of {n} MW demanded | label | PgcbMonthlyDetail.tsx:545-625 |
| ge.pgcbmonthly.heatmap.legend | No shedding · Less · More · worst single cell {n} MW · Worst zone this month: | legend | PgcbMonthlyDetail.tsx:650-666 |
| ge.pgcbmonthly.heatmap.explainer | How to read this. Each cell is one zone on one day, and the number is the megawatts of demand that had to be cut in that zone at that day's peak … it measures how persistently a zone was cut, not how deep the worst cut was. | disclaimer | PgcbMonthlyDetail.tsx:674-680 |
| ge.pgcbmonthly.heatmap.provenance | Every zone cell, and the All zones row, is PGCB's own published figure — that row is the system-wide load shed the report states for each day, not the zone cells added up. · The Total column and the figure in the bottom corner are ours, summed across the month … | disclaimer | PgcbMonthlyDetail.tsx:691-702 |
| ge.pgcbmonthly.owner | Generation Cos. · IPP · BPDB · Rental · REB · {pct}% of net generation · {n} last month · MKWh · glossary (MKWh — million kilowatt-hours … · Net generation — … · Generation Cos. — state-owned generators such as NWPGCL, APSCL and EGCB. · IPP — … · BPDB — … · REB / Rental — …) · BPDB station use of {n} MKWh is already deducted. · Electricity imported from India is reported separately and is not counted in these shares. · Each owner's MKWh is PGCB's own published figure. · The percentage shares and the {n} MKWh they are taken against are ours — PGCB lists the owners separately and prints no combined line. | label | PgcbMonthlyDetail.tsx:715-785 |
| ge.pgcbmonthly.circle | Grid circle · Tripping · Emergency · Scheduled · Total ({unit}) · {prevLabel} · Change · Total · glossary (Grid circle — PGCB's maintenance regions … · Unserved energy — … · Tripping — … · Emergency — … · Scheduled — …) | label | PgcbMonthlyDetail.tsx:811-840, 1410-1421 |
| ge.pgcbmonthly.areapeak | Sum at system peak (MW, all at once) · Sum of area peaks (MW, each at its own hour) · Diversity (MW never needed together ({pct}%)) · legend Drawn at the national peak / Extra at the area's own peak / bar length = the area's own maximum · MW peak · +{n} MW ({pct}%) beyond its share of the national peak · Why the parts exceed the whole … · {area} is the most out of step this month … · provenance P/D notes | label | PgcbMonthlyDetail.tsx:896-1036 |
| ge.pgcbmonthly.more | Show {n} more · {shown} of {total} | button | PgcbMonthlyDetail.tsx:1065 |
| ge.pgcbmonthly.outage | {n} individual outage events recorded this month — substation and transmission line, emergency and scheduled. Loaded separately because the log is larger than the rest of the month combined. · Load {n} outage events · Search substation, cause… · Substation · Equipment · Start · Duration · Cause · Unserved (MWh) · glossary | label | PgcbMonthlyDetail.tsx:1098-1155 |
| ge.pgcbmonthly.stale | Maximum evening peak generation · Maximum evening peak demand · Maximum generation · Maximum load shed at evening peak · Source data note for {month} · PGCB's report prints {a figure / N figures} in the "Current Month" column carrying a date from an earlier month — the previous month's number appears to have been left in the cell. The published value is shown unchanged below, but it should not be read as {month}'s own maximum. · {label} {value} — dated {printed_date} | disclaimer | PgcbMonthlyDetail.tsx:1251-1279 |
| ge.pgcbmonthly.panels | Load Shedding & Reliability (How often supply fell short in {month}, against {prev}) · Daily Load Shedding by Zone (Megawatts shed each day at {peak} peak, {month}; Evening peak / Day peak) · Generation by Owner (Net generation share, {month}) · Area Peak Load: Coincident vs Own Maximum (Two different peaks, often confused for each other) · Grid Circle Reliability (Energy that could not be delivered, by circle and cause / Count of tripping and outage incidents, by circle and cause; Unserved energy / Tripping & outage) · Substation & Asset Detail (Per-asset records published for {month}; Search substation…; tabs Peak load / Voltage / Transformers / Interruptions) · Free Governor Mode of Operation (…) · Outage Event Log (Every recorded substation and transmission outage in {month}) — all badged Monthly | heading | PgcbMonthlyDetail.tsx:1229-1720 |
| ge.pgcbmonthly.panel1.glossary | Load shedding — deliberately cutting supply … · Days with load shed — … · Max / min load shed — … · Load factor — … | label | PgcbMonthlyDetail.tsx:1300-1316 |
| ge.pgcbmonthly.panel6.tables | Peak load: Substation · Peak load (MW) · Recorded at · Voltage: Substation · Class · Rated · Max · Min · Min vs rated · ⚠ marks a minimum more than 10% below rated voltage. · Transformers: Substation · Transformer · Capacity (MVA) · Peak MW · Loading · ⚠ marks transformers loaded at 80% or above. · Interruptions: Substation · Interruptions · Duration · Unserved (MWh) · glossary | label | PgcbMonthlyDetail.tsx:1450-1651 |
| ge.pgcbmonthly.fgmo | Plants listed · Active at least one day · Capacity on FGMO (MW) · Full-month participation (plants) · Plant · Owner · Fuel · Capacity (MW) · Days on FGMO · Why this matters. Grid frequency must hold near 50 Hz … | label | PgcbMonthlyDetail.tsx:1667-1709 |

## SourceProvenanceNote.tsx · MethodologyReconciliationBanner.tsx · access gates

| id | current text | type | file:line |
|---|---|---|---|
| ge.provenance.headings | This day disagrees with its source · Unverified — identical to {partner} · Not re-checked against the source document · Verified — read by a reconstructed parser · Verified against the source document · aria "Source verification for {day}" · {summary} | heading | SourceProvenanceNote.tsx:44-61 |
| ge.methodology.toggle | Where each figure comes from · Where each figure comes from, and why two totals on this page can differ. Click to collapse. / Click to drop down. | control | MethodologyReconciliationBanner.tsx:69-73 |
| ge.methodology.marks | Every figure on this tab carries a mark. P means PGCB, Petrobangla or SREDA states the number and we reproduce it unchanged. D means we calculated it from published figures … No figure on this page is independently audited … | disclaimer | MethodologyReconciliationBanner.tsx:87-94 |
| ge.methodology.section1 | 1. Two generation totals · The Daily Generation KPI is PGCB's own headline energy figure P. The Generation Mix Snapshot total is our sum of the per-fuel rows … · Published headline = {v} MKWh · Sum of fuel rows = {v} MKWh · Unexplained residual = {±v} MKWh ({pct}%) / The two agree for this day | heading | MethodologyReconciliationBanner.tsx:100-114 |
| ge.methodology.section2 | 2. Two cost totals · The Est. Fuel Cost KPI is the Total : row PGCB prints at the foot of its production-cost block P. The Daily Fuel & Import Cost header adds up the per-fuel bars above it D. · Published total = {v} Cr BDT · Sum of fuel costs = {v} Cr BDT · Unexplained residual = {±v} Cr BDT / The two agree for this day | heading | MethodologyReconciliationBanner.tsx:122-136 |
| ge.methodology.residual | What a residual can and cannot tell you · A headline is not a sum (…) · A large residual is a defect signal (… 2019-07-28 is missing its gas and coal rows and shows a 68% gap …) · We do not attribute it (Station auxiliary use and transmission loss are real quantities, but PGCB does not publish them on this report … This banner previously named them as the cause; it no longer does …) | heading | MethodologyReconciliationBanner.tsx:144-171 |
| ge.methodology.footer | ※ This day: on {date}, the fuel-mix sum and the published headline differ by {v} MKWh ({pct}%), which this page does not attribute to a cause. / agree to {v} MKWh — there is no discrepancy to explain. · Hide Banner Completely | disclaimer | MethodologyReconciliationBanner.tsx:178-198 |
| ge.accessbanner | {earliest} → {latest} / Full archive · through {latest} · Older data locked · {statusLabel} · {shortLabel} · {accessWindow} · {upgradeLine} | chip | GridAccessBanner.tsx:34-87 |
| ge.lockedcontent.button | Upgrade to Unlock | button | GridLockedContent.tsx:67 |
| ge.lockedgate | Close locked panel · {badge} · {headline} · {subheadline} · Your access: {currentAccess} · {upgradePrompt} · Payment coming soon · bKash, cards & mobile banking checkout is being finalised. Choose a plan now — we'll notify you when billing opens. · {primaryLabel} · {secondaryLabel} · Test the Premium Features in our Interactive Demo Sandbox | heading | GridDataLockedGate.tsx:44-109 |
| ge.archiveteaser | Historical archive preview · Historical archive · {n} days of grid data — locked for you · {upgradeLine} · Preview locked date · Unlock archive | heading | GridArchiveTeaser.tsx:33-69 |

(GridAccessPaywall.tsx is a deprecated re-export; useUnitCostAuthentication.ts and sreda-icons.ts have no user-visible text.)
