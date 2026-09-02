# Grid Explorer Audit — 2026-09-01

Read-only inventory of the ESB PowerLine repo (`authenticating` branch) and its Supabase Postgres
database, produced by the `grid-explorer-audit` skill. No code, schema, data or dependency was
changed. Every claim cites a file:line, a table, or a query run on 2026-09-01. Where something
could not be determined it says so.

Database was **reachable** (`prisma/client.ts` `createScriptPrismaClient`, session-pooler URL);
all counts below are live `count(*)`/`min`/`max` results. Traffic volumes were **not** available
(no analytics access), so egress figures in §3 are ranked hypotheses with stated assumptions.

Companion file: `CONTENT_INVENTORY.md` (every user-visible string, `id | current text | type | file:line`).

---

## Verdict in one page

**What the data supports today.** A very deep, very narrow archive. There are 4,546 published
PGCB energy days (2013-12-31 → 2026-08-31) as one JSON per day carrying system totals, a 24-hour
load curve, nine zone rows, per-fuel generation and cost, interconnector flows, an EWIC log and an
NLDC outage list; 2,309 days of a per-station sheet (installed/present capacity, day and evening
peak, energy, hourly log, next-day forecast per station); 2,000 days of a 30-minute, 17-column
energy curve; 2,308 Petrobangla gas days (2020-01 →) with per-field production and per-company
distribution; 317 PGCB monthly rollups (2013-01 → 2026-06); 9 SREDA register snapshots. Every
day names its source document, carries both publishers' observation windows, and — for gas — the
SHA-256 of the PDF that was parsed. Provenance is a real asset here, not a claim. The UI already
renders essentially all of this across nine tabs and ten Macro sub-tabs, with a P/D
(published/derived) mark on ~160 figures and a source footer on every card.

**What it does not support.** Anything spatial or topological, and anything that joins the
archive to the newsroom. The domain model shipped in migration `0014` has the right tables —
`PowerPlant` (145 rows), `GasField` (22), `Organization` (18), `Interconnector` (4) — but
`latitude`/`longitude` are `null` on all 145 plants, and `Substation`, `TransmissionLine`,
`GeneratingUnit`, `PowerProject` and `Contract` have **zero rows**. `Article` has no foreign key to
any entity; its only classification is a free-text `tags` JSON string. Nothing in the database
is recorded as a derived figure (`Observation.basis` is `REPORTED` on 327/327 rows). The
substation register the Technical tab shows (260 rows, 227 stations) lives as a literal array in
a component, not in a table. So: a map, an entity page per substation, a topology graph,
"plants near X", or "articles about this plant" are all data-acquisition projects, not UI work.

**Credibility exposures that matter more than any feature.** (1) The C/B Imports tab headline
says "Real-time import allocations" over a dated daily workbook
(`components/news/PowerGridExplorer.tsx:2496`). (2) The commodities ticker's "market open" pulse
is `useState(true)` and never changes (`components/news/LiveMarketTicker.tsx:64`); eight of its
nine items are archive figures. (3) The homepage snapshot's section-level "Live" badge renders
unconditionally from a settings string over a panel where 7 of 12 tiles are daily or
standing-register figures (`components/home/HomeSnapshotPanel.tsx:380-386,465-474`). (4) The
Macro Overview's twelve headline tiles (Installed Capacity 33,092 MW, Consumer Base 49.94
Million, …) are literals typed into `MacroTrendsTab.tsx:283-434`, sharing a hand-written
"Last Updated: Sunday, June 14, 2026 at 03:39 PM" (`:2653`) — a timestamp that will read as
current forever. (5) `lib/data/companies/bpdb.ts:9` labels `bpdbAuditedFinancials`
"(indicative, crore BDT)" in its own comment, yet those figures render with the same provenance
styling as published ones.

**The egress problem, as far as code can show it.** The public path is correctly static-first:
the browser fetches `/data/…json` from Vercel's static layer and only falls through to
`/api/data/*` when a day post-dates the last deploy or is tier-gated. That fallback route is
`force-dynamic` + `Cache-Control: private, no-store` by design (`app/api/data/[...path]/route.ts:18,41`),
so nothing through it is ever CDN-absorbed, and the largest keys in the system (gas `_index`
1.19 MB, `timeline-summary` 1.65 MB) are reachable through it. The member export can read up to
1,500 days × 17 datasets per request from Postgres (`lib/data/grid/grid-export.server.ts:91`).
The two historical Storage draws (raw full-size media grids; a HEAD-then-GET size backfill on
every library render) are **verified fixed** in this tree. What remains is Postgres row egress,
not Storage egress; if the Supabase overage was in Storage, the code no longer explains it and
the cause is elsewhere (or historical).

**Three things that would unlock the most.**
1. **Coordinates for the 145 plants and the 260-row substation register** — the columns exist,
   the rows exist, only the values are missing. Sources: PGCB's own grid map PDF (already
   embedded in the Technical tab), BPDB's plant list, SREDA's RE register. This alone makes a
   map and per-plant pages buildable.
2. **Persist the derived layer.** `Observation.basis = DERIVED` exists and is unused; every
   D-marked figure on the site is recomputed in render code. Writing them once, with the
   inputs they came from, turns "D" from a badge into a queryable audit trail.
3. **A real cache tier for `/api/data/*`.** Split the route: public-window and
   already-shipped-era keys can carry `public, s-maxage`; only tier-gated keys need
   `private, no-store`. This is the one change that addresses the egress shape structurally.

---

## 1. Data inventory

### Tables and coverage

**Database** (`prisma/schema.prisma`; counts are live on 2026-09-01):

| Model | Schema | Rows | Notes |
|---|---|---:|---|
| `User` | 16-41 | 6 | |
| `Article` | 61-109 | 165 | `publishedAt` 2024-11-14 → 2026-08-30, 64 distinct days; PUBLISHED 161 / DRAFT 2 / ARCHIVED 2 |
| `ArticleView` | 112-124 | 1,322 | 2026-06-26 → 2026-09-01 |
| `Category` | 138-149 | 10 | |
| `Revision` | 190-200 | 119 | article revisions |
| `Media` | 205-217 | 213 | |
| `SavedItem` / `MemberDownload` / `MemberGridSubscription` | 238-276 | 2 / 18 / 1 | |
| `MagazineIssue` | 301-311 | 3 | |
| `Node` / `Edge` | 316-369 | 4 / 2 | org-chart diagram (Ministry→BERC, BPDB→PGCB), not electrical topology |
| `AuditLog` | 380-388 | 80 | |
| `SiteSetting` | 411-415 | 18 | |
| `EditorialNotice`, `Comment`, `Ad`, `Profile`, `Tag`, `TickerItem`, `Notification`, `Bookmark`, `ArticleHistory` | various | **0** | declared, empty |
| `ContactMessage` | 495-504 | **table does not exist** (42P01) | no migration 0001–0015 creates it, yet `app/api/contact/route.ts:54` calls `prisma.contactMessage.create` — the contact form fails at runtime |
| `DataDraft` | 539-558 | 0 | transient by design |
| `DataRelease` | 561-581 | 65 | 13 feeds; see below |
| `DataReleaseRevision` | 596-618 | 74 | PUBLISH 57 (2026-08-21→09-01), CORRECT 9, REVOKE 8 |
| `Organization` | 678-690 | 18 | OWNER 8, OPERATOR 6, UTILITY 2, REGULATOR 1, GOVERNMENT 1 |
| `PowerPlant` | 692-715 | 145 | GAS 57, HFO 54, SOLAR 17, COAL 8, HSD 6, WIND 2, HYDRO 1; `capacityMw` on 140; `organizationId` on 74; `sourceDocumentId` on 145; **lat/long on 0** |
| `GeneratingUnit` | 717-728 | **0** | |
| `Substation` | 730-739 | **0** | |
| `TransmissionLine` | 741-754 | **0** | |
| `Interconnector` | 756-761 | 4 | |
| `GasField` | 765-774 | 22 | |
| `PowerProject` / `Contract` | 776-800 | **0** / **0** | |
| `SourceDocument` | 804-819 | 2 | one PGCB workbook, one Petrobangla PDF, both with `contentSha256` + window |
| `Observation` | 824-841 | 327 | `present_capacity` 143, `installed_capacity` 140, `production_capacity` 22, `gas_production` 22 — **all `basis = REPORTED`** |

`DataRelease` by feed: GRID_DAILY 16 (2026-07-31→08-31, 3 revoked) · GAS_DAILY 15 (3 revoked) ·
GRID_CURVE 13 (2026-08-19→08-31) · GRID_PLANTS 13 · SREDA_DAILY 2 · six singleton feeds
(GAS_INDEX, GAS_LIVE_WEEK, GAS_TIMELINE, PGCB_MONTHLY_SERIES, GAS_RESERVE_MODEL,
GAS_RESERVE_SENSITIVITY). The curve/plants feeds start 19 days after daily/gas — the
"published only the headline feed" gap `AUDIT-INVENTORY.md:449` describes, since closed.

**Static archive** (`public/data/`, shipped with the deploy; a release always wins over a
static file of the same key — `lib/data/releases.server.ts`):

| Dir | Files | First | Last | Month buckets | Gaps |
|---|---:|---|---|---:|---|
| `daily/` | 4,546 | 2013-12-31 | 2026-08-31 | 153 | thin months: 2016-01 (20), 2017-02 (24) |
| `curves/` | 2,000 | 2014-01 | 2026-08 | 143 | starts a month after `daily/` |
| `plants/` | 2,309 | 2014-01 | 2026-08 | 142 | |
| `petrobangla/daily/` | 2,308 | 2020-01 | 2026-08 | 80 | six years shorter than PGCB |
| `pgcb-monthly/` | 317 | 2013-01 | 2026-06 | — | paired `-events.json` |
| `sreda/daily/` | 9 | 2026-06-29 | 2026-09-01 | — | irregular register, not daily |
| `grid-verification/` | 158 | 2014-01 | 2026-08 | — | plus `_gaps`, `_index`, `no-source-days` (6 declared), `duplicate-suspect-days` (6 pairs), `unit-cost` |

`lib/available-dates.json` = 4,546 entries, equal to `daily/`. It is compiled into the bundle
and lags any day published after the last deploy (the runtime catalog
`getRuntimeLatestDate()` is the one to read on any path that must see new days).

### Granularity

| Series | Resolution | Per-entity? | Where |
|---|---|---|---|
| `systemStats` | daily, system-wide (peaks, energy, cost, gas-to-power) | — | `daily/{date}.json` |
| `hourlyLoadData` | hourly (usually 25 rows: 24 h + a 19:30 sample), system-wide | — | same |
| `zoneGenerationData` / `regionalDemandData` | daily, 9 named PGCB zones, per-fuel / demand+shed | zone label only | same |
| `generationData` | daily, per fuel (gen, cost, unit cost) | fuel | same |
| `borderImportsData` | daily, per interconnector (energy, peak) | line | same |
| `ewicData` | half-hourly, 3 corridors, MW+MVAr | corridor | same |
| `dailyOutages` | event list, free-text | — | same |
| `curves/` | 30-minute, 17 fuel/source columns | fuel | `curves/{date}.json` |
| `plants/` | daily per station + hourly per station (`genlog`) + next-day per-station forecast | **station** | `plants/{date}.json` |
| `petrobangla/daily/` | gas day 08:00→08:00, per field (wells, capacity, gas, condensate) and per company/plant distribution | **field, plant** | `petrobangla/daily/{date}.json` |
| `pgcb-monthly/` | monthly: peaks, generation by fuel/owner, zone shed heatmap, circle reliability, per-substation peak/voltage/transformer/interruption tables, FGMO list, outage log | substation (monthly only) | `pgcb-monthly/{YYYY-MM}.json` |
| SREDA | standing register (stock as of date) | tech type | `sreda/daily/{date}.json` |

The important consequence: **per-station and per-field daily data exists; per-substation data
exists only monthly; nothing is per-unit, and nothing is located in space.**

### Provenance metadata

| Mechanism | Where | What it proves |
|---|---|---|
| `sourceFiles.{pgcb,petrobangla}` | every `daily/*.json` | which filed document each publisher's figures came from |
| `observationWindows.{pgcb,petrobangla}` | every `daily/*.json` | start/end/filedAs/sourceFile per publisher — the L1 anchor rule from `lib/data/grid/observation-window.ts` |
| `meta.content_sha256` | every `petrobangla/daily/*.json` | hash of the PDF bytes parsed — what makes `verify:source` non-circular |
| `DataRelease.checksum`, `parserVersion` | `schema.prisma:566,569` | unchanged-reparse detection; values seen `ingest_bridge/1`, `publish-local-cli/1` |
| `DataReleaseRevision.{kind,checksum,previousChecksum,reason}` | `schema.prisma:605-610` | append-only publish/correct/revoke history (74 rows) |
| `SourceDocument.{contentSha256,windowStart,windowEnd}` | `schema.prisma:804-819` | first-class document rows — only 2 exist |
| `PowerPlant.sourceDocumentId` | `schema.prisma:703` | 145/145 populated |
| `Observation.basis` REPORTED/DERIVED | `schema.prisma:673-676,834` | the storage-level derived flag — **never set to DERIVED** |
| `GridProvenanceTag` P/D | `components/news/power-grid/GridExplorerUI.tsx:110` | the render-level derived flag, ~160 uses (note: §2 sub-report searched only `lib/` and reported it missing; it lives in `components/`) |
| `verification/source-ledger.json` | repo root, 4.1 MB | per-day `verify:source` verdicts; 274 day entries, all `MATCH` in sample, `parserVersion 2.0.0-reconstructed`, `hash: null`, `gasVerified: false` on the sampled entries |
| `verify:data` run today | — | **0 ERROR / 789 WARN / 6,764 INFO** — WARN is source self-disagreement by doctrine (hourly-balance 605, zone-demand 98, archive-self 61, gas-vs-archive 12, zone-zero 7, shed-coverage 3, zero-gas 2, provenance-agreement 1) |

### The five questions

1. **Plant-level data — yes.** `PowerPlant`, 145 rows (`schema.prisma:692-715`): name, fuel,
   capacityMw (140), organizationId (74), commissionedOn/retiredOn columns present,
   sourceDocumentId (145). `Observation` holds 283 plant rows (present + installed capacity,
   one document's window, 2026-08-05→06). Static: `plants/{date}.json` × 2,309 days with
   per-station capacity, peaks, energy, remarks, hourly log and next-day forecast.
   `GeneratingUnit` exists with 0 rows — nothing is per-unit.
2. **Geographic data — no.** `PowerPlant.latitude/longitude` (`schema.prisma:701-702`) and
   `Substation.latitude/longitude` (`:734-735`) exist; **0 of 145 plants have a value, and
   `Substation` has 0 rows.** Zones (`regionalDemandData`, `zoneGenerationData`) are nine PGCB
   operational labels, not coordinates or administrative boundaries. The Technical tab's
   substation register (260 rows, `TechnicalInfoTab.tsx` substation section) carries an
   "Operation Zone" and "Grid Circle" label per row, no location.
3. **Topology — no data; schema only.** `Substation` 0, `TransmissionLine` 0. `Interconnector`
   4 rows (corridor names). `Node`/`Edge` (4/2) are an organisational chart. The PGCB grid
   network diagram is embedded as a PDF (`TechnicalInfoTab.tsx:1955-2006`), not as data.
4. **Entity-to-article linkage — no.** `Article` (`schema.prisma:61-109`) has no FK to
   `PowerPlant`, `Organization`, `GasField` or `Node`; `tags` is a free-form JSON string
   (76/165 articles non-null). No `entityId`/`entityType` reference exists outside the
   diagram code. Articles and the domain model are unconnected.
5. **Derived vs reported — recorded at render time only.** `Observation.basis` is the
   storage flag and is `REPORTED` on 327/327 rows. Every derived figure on the site (unit
   rates, shares, severities, totals, `gwhToAvgMw`) is computed in components and marked with
   `GridProvenanceTag kind="D"` in JSX; the computation is not persisted anywhere. The
   Published vs Derived sub-tab (`PublishedVsDerivedTab.tsx`) reads ledger scalars, not a
   stored derived layer.

---

## 2. What the UI renders today

Route: `app/(public)/grid-explorer/page.tsx` (`revalidate = 300`, line 19) → client shell
`components/news/PowerGridExplorer.tsx` (3,486 lines) + `components/news/power-grid/**`.
Nine tabs (`PowerGridExplorer.tsx:969-984`): Overview, Regional Grid, Gas & LNG Supply,
Generation & Cost, Power Stations, C/B Imports, Renewables, Macro Trends, Technical Information.
Macro Trends has ten sub-tabs (`MacroTrendsTab.tsx:127-129,459-469`). Per-day tab availability
is derived from the day's own payload (`lib/data/grid/tab-availability.ts:52-116`); Renewables,
Technical and Macro are date-independent (`:50`). Empty tabs state what the source does not
publish for that era, never "no data" (`:99`).

Element → source map (representative row per family; P/D marks and `GridSourceFiles` footers
repeat per row):

| Element | Component | Feed | Key / column | As-of shown | Source shown |
|---|---|---|---|---|---|
| Overview KPI strip (Peak Supply, Peak Demand, Peak Deficit, Capacity Idle, Gas Supply, Cost of Power) | `power-grid/OverviewKpiStrip.tsx:21-52,210-672` | static `daily/{date}.json` → `/api/data` fallback | `systemStats.*`, `generationData`, `gasProductionData`, plants sheet | yes, tooltip date + sheet name | yes, P/D per tile |
| Forecast hint on peak tiles | `OverviewKpiStrip.tsx:57-80` | day's own `forecast` | `GridForecast` | implicit | signed difference only (doctrine 6) |
| Today against Forecast (live) | `power-grid/LiveForecastPanel.tsx:205-234` | `/api/data/live-grid` + `forward-forecast.ts` | NLDC hourly page | yes ("issued at HH:MM") | yes — genuinely live |
| 24-Hour Load Curve | `PowerGridExplorer.tsx:1632-1874`, `LoadCurveCanvas.tsx` | daily | `hourlyLoadData` | report date | P4 sheet footer |
| Generation & cost table | `PowerGridExplorer.tsx:1975-2318` | daily | `generationData[]` | report date | P1 + BPDB cross-check badges (`UnitCostBadge.tsx`) |
| Daily Fuel & Import Cost | `DailyCostCard.tsx` | daily | `generationData[].cost` | report date | yes |
| Gas & LNG tables, KPI strip | `GasTab.tsx`, `PetrobanglaGasKpiStrip.tsx` | daily (+ Petrobangla archive/live-week feeds) | `gasProductionData`, `gasDistributionData` | **gas-window label**, not PGCB date | yes |
| Petrobangla archive views (timeline, fields, power gap, sectors, compare) | `petrobangla-archive/*.tsx` | `GAS_INDEX`, `GAS_TIMELINE`, per-day gas files | field/company rows | gas-day + "nearest to grid date" | yes |
| Live week | `petrobangla-live/*.tsx` | `GAS_LIVE_WEEK` | 7–1,095-day window | "Latest official data: {date}" | yes |
| C/B Imports | `PowerGridExplorer.tsx:2495-2631`, `InterconnectorCanvas.tsx` | daily | `borderImportsData` | report date, **but headed "Real-time"** | yes |
| Regional (zone table, outage log, zone-wise generation, EWIC) | `PowerGridExplorer.tsx:2689-3099` | daily | `regionalDemandData`, `dailyOutages`, `zoneGenerationData`, `ewicData` | report date | yes, incl. BPDB-fallback footnote |
| Power Stations | `PowerStationsTab.tsx`, `TabKpiStrips.tsx:639-756` | `plants/{date}.json` on demand | per-station rows | report date | yes |
| Renewables | `RenewablesTab.tsx` | `sreda/daily/{date}.json` — **not keyed to the date picker** | SREDA register | SREDA's own last-update | `SourceProvenanceNote` |
| Technical Information | `TechnicalInfoTab.tsx` | **literal arrays in the component** (transmission tables, 260-row substation register, projects, OPGW leasing) + 3 embedded PDFs | none | mixed — "as at" dates on some cards; "Last Updated: Sunday, May 24, 2026 at 02:12 PM" literal at `:990` |
| Macro Overview 12 tiles + 7.35% loss tile | `MacroTrendsTab.tsx:283-434, 2583-2650` | **literal array** | hand-typed strings | mostly none; shared literal "Last Updated: Sunday, June 14, 2026 at 03:39 PM" (`:2653`), a second literal "Wednesday, Sep 17, 2025 at 06:01 PM" (`:2665`) | one shared footer |
| PGCB Monthly Archives | `PgcbMonthlyDetail.tsx`, `usePgcbMonthly.ts` | `pgcb-monthly/*.json` on demand | monthly record | month key | yes, P/D per panel |
| Gas Reserve Depletion | `GasReserveDepletionTab.tsx`, `ReserveTrajectoryCanvas.tsx` | `lib/data/macro/reserveModel.ts` (built by `scripts/build_reserve_model.py`) + `reserveBenchmarks.ts` | model | `as_of` on anchor | yes, per benchmark row |
| Pricing & Drivers, Global vs Domestic, Budget & Infra, Annual Reports, Sector Glance | `MacroPricingDriverCards.tsx`, `GlobalVsDomesticCards.tsx`, `MacroTrendsTab.tsx` | `lib/data/macro/{economics,fuel-prices,budget,infrastructure,system-loss,tariff,gas}.ts`, `lib/data/companies/bpdb.ts` | **static literal arrays with no per-row source field** | year only | JSX footer only |
| BPDB Annual Accounts | `BpdbAccountsPanel.tsx` | `lib/data/companies/bpdb*.ts` | FY rows | FY | yes, extraction method documented in copy |
| Published vs Derived | `PublishedVsDerivedTab.tsx` | `getLedgerSummaries()` | ledger | per day | this *is* the audit surface |
| Homepage snapshot (fixed 2×6) | `components/home/HomeSnapshotPanel.tsx:146-291` | `getLatestHomeSnapshot()` + `/api/data/live-grid` overlay on 5 tiles | `systemStats`, `generationData`, SREDA | dual "Hourly / Daily" stamp | per-tile dot tooltip |
| Commodities ticker | `components/news/LiveMarketTicker.tsx:126-155`, `lib/data/live-ticker.server.ts:39-129` | daily archive + static macro + one live USD/BDT fetch (6 h cache) | `avgProductionCost`, per-fuel `unitCost`, `eveningPeakGen`, gas grand total, tariff | **none on the strip** | none inline |
| Exports (PDF/DOCX/CSV) | `lib/data/grid/grid-export*.ts` | per-day static or release | 17 datasets | footer per figure | yes |

**Presented as live when it is not** (credibility risks, in order of severity):

1. `components/news/PowerGridExplorer.tsx:2496` — "Real-time import allocations and daily
   power trade (Report: {date})". Daily workbook, manual ingest.
2. `components/news/LiveMarketTicker.tsx:64` — `const [marketOpen] = useState(true)`, never
   reassigned; drives the green `animate-ping` at `:185,207`. Only USD/BDT is fetched live.
3. `components/home/HomeSnapshotPanel.tsx:380-386,465-474` — section "Live" badge rendered from
   `snapshotLabel` (`lib/homepage-defaults.ts:6`, default `'Live • BPDB • PGCB • SREDA • Petrobangla'`)
   regardless of whether `useLiveGrid()` returned anything; 7 of 12 tiles cannot be live.
4. `app/(public)/grid-explorer/page.tsx:216` — perpetual `animate-pulse` Activity icon beside
   "Interactive Data • Power Sector". No "live" word, but it reads as a heartbeat.
5. Dev-only: `HomeSnapshotPanel.tsx:164-191` jitters four tiles by `Math.random()*120` MW every
   24 s when `NODE_ENV !== 'production'` (`lib/telemetry-mode.ts:2-4`). Gated off in
   production; present in the bundle.
6. Not misleading: `LiveForecastPanel.tsx:217-234` and `/api/data/live-grid` are real
   (10-minute cache over NLDC's hourly page) and say so.

**Hardcoded / mocked / seeded values that look like data:**

- `MacroTrendsTab.tsx:283-434` — twelve `glanceIndicators` literals: Installed Capacity
  "33,092 MW", Peak Generation "17,201 MW" ("Recorded on May 20, 2026"), Active Power Plants
  "137 Plants", Import Capacity "2,696 MW", Transmission Lines "18,152 ckt km", Substation
  Capacity "91,242 MVA", Distribution Lines "658,563 km", Consumer Base "49.94 Million",
  Electricity Access "100.0%", Per Capita Gen. "661 kWh", Irrigation Pumps "498,000", ADP
  Allocation "18,409.52 Cr". Seven carry no date. Note the Substation Capacity tile (91,242 MVA)
  disagrees with the Technical tab's own PGCB table (91,512 MVA, `TechnicalInfoTab.tsx:1084-1126`).
- `MacroTrendsTab.tsx:2618-2645` — Distribution System Loss Target "7.35%".
- `MacroTrendsTab.tsx:2653` and `:2665` — two literal "Last Updated" timestamps.
- `MacroTrendsTab.tsx:2920-2976` — Insights cards: "+43.70% (84.90 to 122.00)",
  "~73.2% of supply", "1.8 Crore BDT / Tk-devaluation", "30.33% (~1,150 MMCFD short)",
  "55% - 70%", "-300 to -450 bps" — the tab's own caveat (`:2873-2879`) admits these are
  "estimates … drawn from sector reporting".
- `lib/data/macro/{budget,economics,fuel-prices,gas,infrastructure,system-loss,tariff}.ts` —
  literal arrays, no per-row source/URL (contrast `longitudinal-study.ts`, `reserveBenchmarks.ts`,
  which do cite per row).
- `lib/data/companies/bpdb.ts:9` — "(indicative, crore BDT)"; `:25-28` `bpdbSnapshotDefaults`
  `generationCapacityMw: '28420'`, `snapshotDate: '2026-06-29'` (the 28420 figure was already
  the subject of a detector/backfill fix — see `MEMORY.md`).
- `lib/data/companies/sreda.ts:1-17` — documented build-time fallback with its own refresh date
  and URL; the well-behaved exception.
- `TechnicalInfoTab.tsx` — transmission-line tables, 260-row substation register ("April 2026
  collection … now trails the summary tables above by 2,357 MVA", `:1033-1050`), 13 ongoing /
  7 upcoming / 51 completed projects, OPGW leasing figures — all literals in the component,
  with honest "as at" footers on most cards.
- `prisma/seed.ts:424-427` — `kpiValue` strings for the organogram; rendered only by
  `components/news/GridTopologyMap.tsx:58-59`, which `PowerGridExplorer.tsx:86-87` imports
  via `next/dynamic` but **never renders** (no `<GridTopologyMap` in `app/` or `components/`).
  Dead import.
- `lib/homepage-defaults.ts:4-6` — `marketPulse` default string ("LNG spot firming • Solar
  module prices -2.1% WoW …") is fabricated commentary; admin-editable, duplicated in
  `prisma/seed.ts:448`. Renders on the homepage strip, not in Grid Explorer.
- `?? 0` — 535 hits under `components/news/power-grid/`; sampled ones are fold accumulators or
  guarded by `> 0`/`!= null` before display. Not exhaustively checked; not a clean bill.

---

## 3. Routes, payloads and caching

Sizes measured on disk 2026-09-01. DB payloads approximated by their static twin.

| Route | Reads | Bounded | Size | Cache |
|---|---|---|---|---|
| `app/api/data/[...path]/route.ts` | `DataRelease.payload` (whole JSON, `select {payload, revokedAt}`) | one key | daily ≈ 35 KB; gas `_index` 1.19 MB; `timeline-summary` 1.65 MB | `force-dynamic` (`:18`), `Cache-Control: private, no-store` (`:41`) — never CDN-absorbed |
| `app/api/data/live-grid/route.ts` | NLDC page parse | latest | small | `force-dynamic`; 10-min shared cache inside |
| `app/api/data-manifest/route.ts` | `findMany({select:{feed,key}})` | all keys | small | `public, s-maxage=30, swr=120` (`:59-61`) — the one DB route that is edge-cacheable |
| `app/api/members/grid-export/route.ts` | per-day static or `getReleaseOverride` × up to **1,500 days** (`grid-export.server.ts:91`) × up to 17 datasets | tier `daysBack` + 1,500 cap | up to ~52 MB source JSON parsed per request | `force-dynamic`, `maxDuration = 60` (`:30-33`), rate-limited |
| `app/api/media-proxy/route.ts` | `fetch()` full remote image, `arrayBuffer()` (`:51`), re-serve | one image | image-sized | `public, max-age=31536000, immutable` (`:56`) — but every cold miss is Supabase→function→client, i.e. **doubled bytes** |
| `app/api/cms/yoy-archive/route.ts` | local network drive | — | — | refuses on Vercel (`:29-34`); not egress |
| `app/api/analytics`, `auth/*`, `contact`, `members/recent-downloads`, health | small DB writes/reads | per request | small | `force-dynamic` |
| `app/(public)/page.tsx` | `getLatestHomeSnapshot()` — **disk read**, not Supabase | latest day | 36 KB → 12 tiles | `revalidate = 180` (`:49`), React `cache()` |
| `app/(public)/grid-explorer/page.tsx` | server shell; data fetched client-side | selected day | — | `revalidate = 300` (`:19`) |
| article/category/tag/author pages | Prisma `Article` selects | paginated | text rows | `revalidate` 300–86,400 |

### Fetch classification

- **Client → Supabase directly:** none for content. Only `components/auth/ResetPasswordScreen.tsx`
  creates a browser client, for auth.
- **Client → our API, static-first:** `lib/data/grid/daily-loader.client.ts:27,70`,
  `lib/data/runtime-data.client.ts:85,95,100` — fetch `/data/…json` (`cache: 'default'`) first,
  fall through to `/api/data/…` (`cache: 'no-store'`) only on 404 (post-deploy days, tier-gated
  keys). Correct shape; but every fallback lands on `private, no-store`.
- **Server-side, uncached:** `/api/data/[...path]`; `/api/data-manifest` in its degraded branch.
- **Server-side, cached:** `lib/data/releases.server.ts:102-142` — `unstable_cache`, 60 s dev /
  600 s prod or `RELEASE_CACHE_SECONDS`, tagged and invalidated on publish. Caches the
  **Postgres read**, not the HTTP response: a hit still re-serialises the full payload to every
  client.
- **Static:** `public/data/**` from Vercel's static layer — the bulk of normal traffic for any
  day older than the last deploy. Vercel bandwidth, not Supabase egress.

**Storage egress:** `next/image` is on (`next.config.ts:194-214`), so article/homepage hero
images are fetched from Supabase once per (image, size) and then Vercel-cached.
`lib/media-thumbnail.ts:23-54` routes the CMS/admin media grids through Supabase's
`render/image` at 320/1200 px — **verified in use** at `MediaUpload.tsx:218,619,920` and
`MediaPicker.tsx:83`, with no bypassing `<img src=` left in those files. The HEAD-then-GET size
backfill on every library render (`lib/actions/media.ts:41-63`) is closed; the remaining backfill
(`:65-85`) only `statSync`s local files. No `storage.from(...).download(...)` exists under
`lib/**`. The two historical Storage draws are therefore fixed in this tree.

### Estimated egress ranking

Assumptions (unverifiable here): homepage 3,000 views/day; Grid Explorer 500/day, ~10 % falling
through to `/api/data`; articles 5,000/day with one hero; media library 50/day; exports 20/day
averaging 90 days.

| # | Path | Arithmetic | Est./month | Type |
|---|---|---|---|---|
| 1 | `/api/data/*` fallback | 500 × 10 % × ~200 KB × 30 | ~300 MB | Postgres rows, never cached |
| 2 | `grid-export` | 20 × 90 × 35 KB × 30 = ~1.9 GB at the cap; ~100–300 MB at the assumed average | 0.1–1.9 GB | Postgres rows; user-controlled range up to 1,500 days |
| 3 | hero images via `next/image` | 5,000 × 5 % cold × 150 KB × 30 | ~1.1 GB | Storage → Vercel optimiser, then cached |
| 4 | `media-proxy` | 50 × 5 × 20 % × 200 KB × 30 | ~300 MB | doubled bytes per miss |
| 5 | `/api/data-manifest` | keys only, 30 s edge cache | ~50 MB raw, ≈0 after CDN | Postgres rows |

### Top offenders

1. **`app/api/data/[...path]/route.ts:18,41`** — `force-dynamic` + `private, no-store` on every
   key, including public-window and already-shipped-era keys that need no privacy. Nothing
   through it is ever CDN-absorbed, and the 1.2–1.65 MB gas index keys are reachable through it.
2. **`lib/data/grid/grid-export.server.ts:91`** — `MAX_EXPORT_DATES = 1500`, one full payload per
   day per dataset from Postgres (`releases.server.ts:29-35`), throttled only by `maxDuration`
   and the rate limiter. The cap is 15× the plausible average export and is user-chosen.
3. **`app/api/media-proxy/route.ts:39-58`** — buffer-and-resend is the only design in the
   inventory that doubles egress for the same bytes; small today, grows with use.

`lib/data/grid/archive-fallback.ts` (1,071,175 bytes, imported by both loaders and
`PowerGridExplorer.tsx`) is **bundle size, not egress** — it inflates function cold start and
client JS, not Supabase billing (`lib/test/function-bundle-tracing.test.ts` exists for exactly
this). Net: the code explains Postgres-row egress, not Storage egress. If Supabase attributed
the 5 GB to Storage, the cause is either historical (the two fixed draws) or outside this tree.

---

## 4. Buildable vs blocked

### Buildable now (the data fully supports it)

- Per-station pages and comparisons across 2,309 days: capacity, peaks, energy, hourly log,
  remarks, next-day forecast (`plants/{date}.json`; `PowerPlant` 145 rows for identity).
- Per-gas-field pages across 2,308 gas days: wells, capacity, production, condensate, share
  (`petrobangla/daily/*.json`; `GasField` 22 rows).
- Zone-level daily series (nine zones): demand, shed, severity, per-fuel generation — as
  labelled series, not maps.
- Interconnector and EWIC corridor series (daily and half-hourly).
- Monthly substation tables (peak load, voltage, transformer loading, interruptions) from
  `pgcb-monthly/*.json` — per substation, per month, as tables.
- Forecast-vs-outturn as a signed difference, per day and per station.
- Long-run macro series already in `lib/data/macro/*` (with the sourcing caveat in §2).
- A provenance/verification surface per day: source document, window, hash, verdict, revision
  history (`DataReleaseRevision`, `source-ledger.json`).
- Exports of any of the above (already registered as 17 datasets).

### Buildable with modest work

- **Substation entity pages** — the 260-row register exists as a literal in
  `TechnicalInfoTab.tsx`; moving it into `Substation` (0 rows today) is a migration-free
  seed (the table exists). Joining it to the monthly per-substation tables needs a name
  reconciliation pass (PGCB spells stations inconsistently across sheets).
- **Persisted derived layer** — write the D-marked figures as `Observation.basis = DERIVED`
  with their input observation ids; the enum and table exist, no rows do.
- **Organisation pages** — `Organization` has 18 rows and 74/145 plants link to one; the
  other 71 need an owner assigned.
- **Article ↔ entity linkage** — needs a join table or FK on `Article` and a tagging pass over
  165 articles; small in data, real in editorial effort.
- **Macro source citations** — add a `source`/`url` per row to the seven `lib/data/macro/*.ts`
  arrays that lack one, following `longitudinal-study.ts`'s existing pattern.
- **Honest freshness stamps** — replace the three literal "Last Updated" strings and the
  ticker's constant `marketOpen` with values computed from the data they describe.
- **Cache split on `/api/data/*`** — public-window and shipped-era keys can be
  `public, s-maxage`; only tier-gated keys need `private, no-store`.

### Blocked pending data acquisition

- **Any map** (plants, substations, zones, outages) — requires coordinates. 0/145 plants and
  0 substations have them. Sources: PGCB's geographical grid map (embedded as PDF at
  `TechnicalInfoTab.tsx:2025-2076`, would need digitising), BPDB's plant list, SREDA's RE
  register (has upazila/district), OpenStreetMap power tags.
- **Transmission topology** (what connects to what, voltage levels, line lengths per circuit) —
  `TransmissionLine` has 0 rows; the network diagram exists only as a PDF
  (`TechnicalInfoTab.tsx:1955-2006`). Source: PGCB's line register / annual report tables
  (partly transcribed as literals in the Technical tab, without endpoints).
- **Per-unit data** — `GeneratingUnit` 0 rows; PGCB's daily sheets are per station, not per
  unit. Source: BPDB's plant/unit list or PGCB's Genlog if it ever carries unit rows.
- **Live system frequency / SCADA telemetry** — nothing in the ingest chain carries it; NLDC's
  hourly page (already scraped for `live-grid`) does not publish frequency.
- **Project and contract entities** — `PowerProject`/`Contract` 0 rows; the Technical tab's
  71 project cards are literals with partner/cost/duration but no structured source. Source:
  PGCB's project pages (13 ongoing reconciled on 13 Aug 2026 per the tab's own footer), BPDB
  PPA lists.
- **Consumer/distribution-side data** (the Macro tiles' "49.94 Million" consumers, "658,563 km"
  lines) — no series behind them; Power Division monthly bulletins would be the source.

---

## 5. Risks and fragile areas

- **Paywall gate list.** `lib/data/grid/daily-access.ts:62`
  `TIER_GATED_DAILY_DIRS = ['daily','plants','curves','forecast']`; its comment (`:39-59`)
  records the list missing `curves` (1,979 subscriber-only days served anonymously, fixed in
  `4f6138786`) and later `forecast`. Petrobangla files use a separate regex (`:71-72`) with a
  45-day public window (`middleware.ts:210-217`) vs 7 days for PGCB. Do not touch without the
  regression test.
- **Beyond-the-catalog dates are public by construction** (`middleware.ts:229-243`,
  `isBeyondShippedArchive`) — safe only while the build-time catalog is never *ahead* of reality.
- **Middleware fails open** on limiter error (`middleware.ts:166-172`) and skips limiting
  entirely when `UPSTASH_REDIS_REST_URL` is unset (`:32-44`). Deliberate; keep the shape.
- **`/api/admin` and `/api/cms` were absent** from `PROXY_PROTECTED_API_PREFIXES` until fixed
  (`lib/api/protected-routes.ts:6-26`); every handler had its own guard, so a near-miss.
- **Env naming.** Three names for the anon/publishable key
  (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, bare
  `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`), resolved in `utils/supabase/env.ts`; five DB
  URL names (`DATABASE_URL` ×30, `POSTGRES_PRISMA_URL` ×9, `POSTGRES_URL_NON_POOLING` ×4,
  `POSTGRES_URL` ×3, `DIRECT_URL` ×3); four "site URL" names. `.env.example`'s documented
  `ESB_YOY_ARCHIVE_DIR` default does not match the code default
  (`lib/data/yoy-archive.ts:13`, a `W:\` path that no longer exists on this machine).
- **`ContactMessage` table missing** while `app/api/contact/route.ts:54` writes to it — the
  public contact form errors today.
- **`package.json:5`** still says "Next.js 15"; `:93` pins 16.3.0.
- **Ingest.** Python chain (`scripts/run_daily_ingest.py`, `ingest_bridge.py`,
  `daily_extractor/`) owns every number; `lib/cron/energy-ingest.ts:10,247` still targets
  `https://www.pgcb.gov.bd/reports/…` with no TLS handling (self-signed cert) — latent because
  `/api/cron/ingest` is disabled on Vercel and absent from `vercel.json`'s cron list. Publish
  gate `lib/data/verify-gate.server.ts` blocks only on ERROR. `run_daily_ingest.py` can report
  all steps green while curve/plants publish nothing — read its `artifacts` line.
- **Integrity tracking.** `verify:data` 0 ERROR / 789 WARN / 6,764 INFO today; `source-ledger`
  274 days; `no-source-days.json` 6; `duplicate-suspect-days.json` 6 pairs; `unit-cost.json`
  BPDB witness export ends 2026-06-24 (`PowerGridExplorer.tsx:2259`). Sampled ledger entries
  carry `hash: null` and `gasVerified: false` — i.e. the PGCB workbook hash and gas fidelity
  were not part of those verdicts.
- **Implying live data** — the five items in §2. The ticker and the homepage badge are the
  ones a reader sees first.
- **Hardcoded figures disagreeing with each other** — Macro tile 91,242 MVA vs Technical tab
  91,512 MVA; three literal timestamps.
- **Literal HTML entities render on screen** — two Recharts legend strings are plain JS strings
  containing `&amp;`, so the page shows the raw entity text: "Gen &amp;amp; Purchase Cost"
  (`MacroTrendsTab.tsx:2221,2236`) and "Total T&amp;amp;D Loss" (`MacroTrendsTab.tsx:2767`).
- **Mobile.** No Grid-Explorer-specific phone breakpoint; the nearest is
  `@media (max-width: 40rem)` in `app/globals.css:5999-6015`. `MEMORY.md` records phases 3–4 of
  the mobile overhaul as not done.
- **Dead or orphaned.** `legacy-static/` and `report15/` (no references); `BdStockTicker.tsx`
  (never rendered); `GridTopologyMap` (imported, never rendered); `GridAccessPaywall.tsx`
  (deprecated re-export); `scratch/` root holds ~77 loose debug artifacts. `lib/ensure-demo-accounts.ts`
  is **in use** (`app/members/login/actions.ts:7`) — not dead.
- **Bundle.** `archive-fallback.ts` at 1.05 MB is imported by the client loader and the explorer
  shell; auto-generated, do not hand-edit.

---

## 6. Open questions for the user

1. **Which bucket was the 5 GB in?** Supabase reports Storage egress and Database egress
   separately. The code as it stands explains only Postgres-row egress (`/api/data/*`,
   `grid-export`); if the overage was Storage, it predates the media-grid and size-backfill
   fixes and the current tree cannot reproduce it. A screenshot of the usage page settles this.
2. **Actual request volumes** for `/api/data/*`, `/api/members/grid-export` and the media
   proxy — the ranking in §3 assumed them. Vercel analytics or Supabase's per-endpoint logs
   would replace the assumptions.
3. **Is any map wanted?** If yes, which source for coordinates is acceptable — PGCB's own map
   digitised, BPDB's list, SREDA's register, OSM — and who verifies them? This is the single
   largest acquisition and it gates every spatial feature.
4. **Should the 260-row substation register and the 71 project cards move from
   `TechnicalInfoTab.tsx` into `Substation`/`PowerProject`?** They are already transcribed;
   the question is whether they become data with a source row each, or stay as page copy.
5. **The Macro Overview tiles and Insights cards** — keep as editorial figures with an explicit
   "editor-entered, as of <date>" stamp, move them to `SiteSetting`/admin-managed values, or
   drop the ones with no series behind them?
6. **`bpdbAuditedFinancials` "(indicative)"** — are these transcribed from BPDB's audited
   accounts (then the comment is wrong) or estimated (then they should not carry a P mark)?
7. **`ContactMessage`** — was the table dropped deliberately (and the form meant to be
   removed), or is a migration missing?
8. **Renewables tab scope** — it reads SREDA's register independent of the date picker; is the
   intended behaviour "the register as of the selected day" (needs 4,500 snapshots that do not
   exist) or "the latest register, clearly labelled as such"?
9. **Archive-out-of-git and AUTHOR-publish decisions** (`MEMORY.md`) remain open and affect
   how much of `public/data` a redesign can assume is on disk at request time.
