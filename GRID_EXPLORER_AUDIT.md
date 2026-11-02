# Grid Explorer Audit — 2026-10-04

Read-only. No code, schema or data was changed. Supersedes the 2026-09-03 audit, which
predated the hourly NLDC capture, the forecast board, the four-series import capture and the
tier-gating rework.

Stack as found: Next.js **16.3.0**, React **19.2.8**, App Router, Prisma **7.9.1** against
Supabase Postgres **17.6**, `@supabase/supabase-js` 2.112.2 / `@supabase/ssr` 0.12.4,
Recharts 3.10.1, Tailwind 3.4.19.

---

## Verdict in one page

**The archive is deep and the entity model is nearly empty, and almost every rejected design
idea has died on that gap.** There are 109,756 hourly grid observations going back to
2015-04-17 and 4,478 daily report payloads, all carrying real provenance. There are **zero**
rows in `Substation`, `TransmissionLine`, `GeneratingUnit`, `PowerProject` and `Contract`, and
**zero** coordinates on any of the 145 power plants. Anything shaped like a map, a network
diagram, a substation page or a plant drill-down is a data-acquisition project, not a UI
project. That has not changed since September and will not change by redesigning.

**What the data does support, today and well:** everything keyed to a day or an hour. The
hourly series carry fuel split, four interconnectors, demand/supply/load-shed, forecast-vs-
actual per interconnector, day and evening peak markers, and per-row quality flags. The daily
static archive carries station-level output for 2,385 days. This is a strong time-series
product and the Explorer currently presents it as nineteen destinations behind two navigation
layers.

**The egress premise in the audit brief is out of date and should be retired.** The brief
describes blowing through Supabase's 5 GB free allowance. The org is on Pro with a 250 GB
egress allowance and 4.2 GB in use (read 2026-09-19). More importantly, **public Grid Explorer
traffic does not touch Supabase at all** — the data is static JSON under `public/data` served
through a shared-cached Next route, and the only browser-side Supabase client on a public page
is the password-reset screen. The remaining egress question is payload size, not origin, and it
has two specific answers (below), not a systemic problem.

**The three things that would unlock the most, in order:**

1. **Coordinates on the 145 plants, and on the 260 substations.** One column pair, two
   datasets. It is the single cheapest change that moves the product from "tables of numbers"
   to anything spatial. Nothing else on any wishlist is this close.
2. **Splitting Macro Trends out of the Explorer.** It holds 14 of the ~18 charts and 10 of
   the 13 data tables behind its own ten-item sub-navigation, inside one tab of nine, and the
   date picker — the Explorer's primary control — does nothing on it. The codebase already
   says so: `DATE_INDEPENDENT = new Set(['macro','transmission'])`.
3. **Backfilling `DEMAND_SUPPLY` before it rolls off.** It starts 2026-04-22 against
   GENERATION's 2015-04-17, and NLDC retains roughly 145 days. Every day not captured is gone
   permanently. This is the only finding in this audit with a deadline.

---

## 1. Data inventory

### Tables and coverage

47 tables, 196.2 MB total. The five that matter:

| Table | Rows | Size | What it is |
|---|---|---|---|
| `GridHourlyObservation` | 109,756 | 74 MB | The hourly NLDC capture |
| `SourceDocument` | 5,897 | 49 MB | Evidence bytes — 369 MB raw, gzipped in-row (`rawGzip`) |
| `DataReleaseRevision` | 681 | 34 MB | Revision history, avg 324 KB/row |
| `DailyReport` | 4,478 | 14 MB | `date:text, data:jsonb` — one blob per day |
| `DataRelease` | 241 | 4.7 MB | Published feeds that override the static archive |

`GridHourlyObservation` coverage, by series:

| Series | From | To | Rows |
|---|---|---|---|
| `GENERATION` | 2015-04-17 | 2026-10-04 | 104,073 |
| `DEMAND_SUPPLY` | **2026-04-22** | 2026-10-04 | 4,113 |
| `INDIA_IMPORT` | **2026-09-03** | 2026-10-04 | 785 |
| `NEPAL_IMPORT` | **2026-09-03** | 2026-10-04 | 785 |

Gap check over the last 45 days, walking consecutive `observedAt` with no timezone conversion:
**four gaps, each one hour**, on 2026-08-20 and 2026-09-02, on GENERATION and DEMAND_SUPPLY
only. Zero duplicate `(series, observedAt)` pairs. Integrity here is good.

### Granularity

- **Hourly: system-wide only.** `totalMw`, `gasMw`, `liquidMw`, `coalMw`, `hydroMw`, `solarMw`,
  `windMw`, four interconnector columns, `demandMw`, `supplyMw`, `loadShedMw`. No per-plant,
  per-unit or per-region breakdown at hourly resolution.
- **Daily: station-level, but in files not tables.** `public/data/plants/{date}.json`, 2,385
  files, avg 65.8 KB — every station's output, capacity and utilisation for that day.
- **Daily: regional.** Zone demand and load shedding live inside the `DailyReport` jsonb.
- **Monthly:** `public/data/pgcb-monthly/**`, 321 files, avg 98.7 KB.
- **Annual:** BPDB accounts FY 2016-17 → FY 2022-23 (`lib/data/bpdb-annual-accounts.ts`).

### Provenance metadata

Unusually strong, and it is the project's main asset:

- `GridHourlyObservation.sourceDocumentId` → `SourceDocument` (filename, `contentSha256`,
  `windowStart`/`windowEnd`, `fetchedAt`, `sourceUrl`, `ingestStatus`, `validationStatus`).
- `basis` enum — `REPORTED` on every row currently held.
- `kind` enum — `REGULAR` (100,951), `DAY_PEAK` (3,917), `EVENING_PEAK` (3,724).
- `excluded` enum — quality flags carried rather than suppressed:
  `TOTAL_DISAGREES_WITH_COMPONENTS` on 370 rows, `BREAKDOWN_ALL_ZERO` on 23.
- `parserVersion` on observations, documents and releases.
- `DataRelease.checksum`, `revokedAt`, `publishedById`; full revision history in
  `DataReleaseRevision`.

### The five questions

**1. Plant-level data — PARTIAL, and the split matters.**
`PowerPlant` holds 145 rows: `name` (145/145), `fuel` (145/145), `capacityMw` (140/145),
`organizationId` (74/145), `sourceDocumentId` (145/145). **`latitude` 0/145, `longitude` 0/145,
`commissionedOn` 0/145, `retiredOn` 0/145.** `GeneratingUnit` is **0 rows**. Per-day station
output exists, but as static JSON (`public/data/plants/`), not as queryable rows. So: a named
plant registry with fuel and capacity, yes; a plant *entity* with a history, location,
commissioning date or unit breakdown, no.

**2. Geographic data — NO.** No coordinates anywhere. `PowerPlant.latitude/longitude` are
present as columns and empty in every row. `GasField` has only `id, name, operatorId,
capacityMmcfd`. `Node.x/y` exist but are canvas positions for a diagram editor, not geography.
Substations carry a `zone` string (nine PGCB zones) and a `circle` — administrative, not
spatial.

**3. Topology — NO, with one qualification.** `Substation` **0 rows**, `TransmissionLine`
**0 rows**, `Edge` 2 rows, `Node` 4 rows (a diagram builder). `Interconnector` has 4 rows but
only `name, counterpartyCountry, capacityMw` — no endpoints. **However**, a 260-record static
substation inventory does exist at `lib/data/infrastructure/substations.ts` (244 at 230 kV, 16
at 400 kV, with transformer, capacity, owner, zone, circle), rendered by `TechnicalInfoTab`.
So: a substation *list*, yes. What connects to what — the thing a topology view needs — no,
nowhere, in any form.

**4. Article ↔ entity linkage — NO.** `Article.tags` is a jsonb column and the `Tag` table has
**0 rows**. There is no foreign key from `Article` to `PowerPlant`, `GasField`, `Organization`
or any data entity. Contextual links between news and data would have to be built from nothing.

**5. Derived vs reported — YES, recorded in three places.** The `basis` enum on
`GridHourlyObservation` and `Observation`; the `P`/`D` provenance tags rendered throughout the
UI (`GridProvenanceTag`); and `BpdbDerivedRate`, which carries its published numerator and
denominator so the division can be checked by hand.

---

## 2. What the UI renders today

Nine visible tabs (`PowerGridExplorer.tsx:980-994`) plus an unlisted `timemachine`. Weight is
very unevenly distributed:

| Tab | Charts | Data tables | Cards | Lines |
|---|---|---|---|---|
| **Macro Trends** | **14** | **10** | **14** | 3,017 |
| Renewables | 3 | 3 | 11 | 1,932 |
| Technical Information | 0 | 0 | 6 | 2,334 |
| Power Stations | 0 | 0 | 5 | 1,064 |
| Gas & LNG Supply | 0 | 0 | 2 | 699 |
| Gas Reserve Depletion | 0 | 0 | 1 | 1,212 |
| Explorer shell | 1 | 0 | 8 | 3,484 |

Macro Trends alone carries **nine sub-tabs** (`overview`, `monthly`, `reserves`, `pricing`,
`global`, `budget`, `reports`, `insights`, `verification`) plus a Sector Glance view — a second
navigation layer inside one tab of nine. 29,740 lines of component code in total.

Element → source for the primary readouts:

| Element | Component | Source |
|---|---|---|
| 6 Overview KPI cards | `OverviewKpiStrip.tsx` (779 ln) | `DailyReport.data` jsonb via `/api/data/daily/{date}.json` |
| Live snapshot figures | `LiveForecastPanel.tsx` | `/api/data/live-grid` → `GridHourlyObservation` |
| Forecast board tiles | `live-grid.server.ts` | `GridForecastBoard` (27 rows) |
| Station table | `PowerStationsTab.tsx` | `public/data/plants/{date}.json` |
| Gas production/distribution | `GasTab.tsx` | `public/data/petrobangla/daily/{date}.json` |
| Substation inventory | `TechnicalInfoTab.tsx:19` | **static TS constant**, 260 records |
| Infrastructure projects | `TechnicalInfoTab.tsx:22` | **static TS constants**, 51/13/7 records |
| BPDB accounts | `MacroTrendsTab.tsx`, `BpdbAccountsPanel.tsx` | `lib/data/bpdb-annual-accounts.ts` |

**As-of and attribution: good.** Nearly every card carries a `GridCardFooter` naming the
source document, the reporting period and "Not independently audited". Absent figures print a
dash and name who owes them rather than showing zero.

**Nothing misrepresents daily data as live.** The hourly capture genuinely runs hourly, and
the one tile that could overclaim — Gas Supply — reads "awaiting Petrobangla · last filed
2,591.1 MMCFD on 2 Oct". This is handled correctly and is not a risk area.

**Hardcoded or unsourced values presented as data** — the real content risk, carried over from
a separate sweep the same day:

| File | Issue |
|---|---|
| `lib/data/macro/fuel-prices.ts` | 1975–2026 commodity series, **no source named**, rendered with `P` tags that the legend attributes to the World Bank/OPEC/IRENA/JKM. Placeholder zeros (`bdCoal: 0.0` to 1995, `bdSolar: 0.0` to 2010); `bdSolar: 15.77` repeated for 2024 and 2026 |
| `lib/data/macro/economics.ts` | `macroEconomicData` — exchange rate, inflation, spot LNG, import coal uncited (already tracked in CLAUDE.md open-work 5) |
| `lib/data/macro/budget.ts` | No header, no source. Figures look like genuine MoF budget headlines |
| `lib/data/macro/infrastructure.ts` | No source; `distribution_km` of 278,000/280,000 is suspiciously round |
| `lib/data/macro/system-loss.ts` | 303 lines, no source mentions |
| `lib/data/infrastructure/substations.ts` | 2,613 lines, no source mentions |

---

## 3. Routes, payloads and caching

### Fetch classification

33 API routes. Public data paths:

| Route | Mode | Cache |
|---|---|---|
| `/api/data/[...path]` | server, cached | `public, max-age=0, s-maxage=600, stale-while-revalidate=3600` |
| `/api/data/live-grid` | server, cached | `public, s-maxage=180, stale-while-revalidate=600` |
| `/api/data-manifest` | server, cached | `public, s-maxage=30, stale-while-revalidate=120` |
| `/api/grid/history/series` | server, cached | `public, max-age=0, s-maxage=600, stale-while-revalidate=86400` |
| `/api/grid/history/bounds` | server, cached | same |
| `/api/market/dse` | server, cached | `revalidate = 60` |
| `/api/analytics` | server, uncached | `force-dynamic`, write path |

All are `force-dynamic` but set shared-cache headers deliberately — the comments in
`data/[...path]/route.ts:38-55` and `live-grid/route.ts:24-37` record why, including that
Vercel consumes `s-maxage` at the edge and strips it from the client response.

**Client-side direct-to-Supabase fetches on public pages: one**, `ResetPasswordScreen.tsx`.
Public Explorer traffic never reaches Supabase from the browser.

### Estimated egress ranking

`public/data` is **421 MB across 12,287 files**:

| Directory | Files | Size | Avg/file |
|---|---|---|---|
| `plants/` | 2,385 | 156 MB | 65.8 KB |
| `petrobangla/` | 2,352 | 114 MB | 49.0 KB |
| `daily/` | 4,579 | 73 MB | 14.1 KB |
| `pgcb-monthly/` | 321 | 31 MB | 98.7 KB |
| `grid-verification/` | 158 | 28 MB | 179.7 KB |
| `curves/` | 2,442 | 21 MB | 5.8 KB |

A reader opening one day and touching every daily tab pulls **131 KB** (daily 36.7 KB + plants
87.8 KB + curves 5.9 KB + forecast 3.8 KB). That is reasonable.

### Top offenders

1. **`petrobangla/timeline-summary.json` — 1.54 MB, one file.** Loaded for the gas timeline.
   Twelve times the entire daily payload, in a single request.
2. **`petrobangla/_index.json` — 1.12 MB.** The archive index, pulled by `loadArchive.ts:56`.
   Together with the above, **2.66 MB** for two files that back a handful of charts.
3. **`plants/{date}.json` — 65.8 KB average, 156 MB on disk.** Not pathological per request,
   but it is two-thirds of a day's payload and the largest directory by total size; any view
   that walks multiple days multiplies it directly.

Honourable mention: `petrobangla/_live_week.json` at 352 KB, and `grid-verification/` at
179.7 KB average — the largest average file size in the archive.

These are payload-shape problems with specific fixes (field projection, pagination, splitting
the index), not an architecture problem. The caching layer in front of them is already correct.

---

## 4. Buildable vs blocked

### Buildable now

- Anything hourly: fuel-mix stacks, demand vs supply vs load-shed, interconnector flows,
  forecast-vs-actual per interconnector, peak markers. Eleven years deep on GENERATION.
- Day comparison, day-over-day and year-over-year, on any daily figure.
- Station-level league tables, utilisation and fuel rankings for any single archived day.
- Zone-level demand and load shedding.
- A substation inventory view filtered by voltage, zone, owner and circle (260 records, static).
- Any annual finance view over FY 2016-17 → FY 2022-23.
- Quality-flag surfacing — 393 rows already carry `excluded` reasons and nothing renders them.

### Buildable with modest work

- **Plant entity pages** — needs `commissionedOn` and owner backfilled (74/145 have an owner
  today) and the per-day station JSON indexed by plant rather than by date. Days of work, no
  new data source.
- **Hourly archive beyond the current windows** — `DEMAND_SUPPLY` and both import series can be
  backfilled from NLDC's retention window now, and only now.
- **Substations as rows** — move the 260 static records into the empty `Substation` table so
  they can be joined and filtered server-side.

### Blocked pending data acquisition

- **Any map.** Needs coordinates for 145 plants and 260 substations. They exist nowhere in this
  repo. Source would be PGCB/BPDB asset registers, or manual geocoding from names and zones.
- **Any network or topology diagram.** Needs line endpoints, voltage and connectivity.
  `TransmissionLine` is empty and no file carries the relationships. `macro/infrastructure.ts`
  has circuit-km totals only.
- **Unit-level analysis.** `GeneratingUnit` is empty; the source reports are station-level.
- **News ↔ data cross-linking.** No linkage exists in any form; `Tag` is empty.
- **Live system frequency, or anything sub-hourly in real time.** The capture is hourly and the
  publishers are hourly at best.

---

## 5. Risks and fragile areas

- **Tier gating is default-closed and tested** — `middleware.ts:266-317` with
  `isDateAllowedForTier`, and `TIER_GATED_DAILY_DIRS` at `lib/data/grid/daily-access.ts:63`
  matched against the real directory listing rather than a hand-written roster. The header
  comment records the path-prefix bypass that two disagreeing canonicalisers once opened. Treat
  as load-bearing; do not refactor casually.
- **Supabase key naming is inconsistent but currently safe.** `utils/supabase/env.ts:4-5`
  prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
  `lib/env-guard.ts:16` requires `ANON_KEY` only. An environment set up with the publishable
  key alone would pass the client and fail the guard.
- **`DEMAND_SUPPLY` has a hard deadline.** NLDC retains ~145 days and nobody else in Bangladesh
  keeps this page. Days before 2026-04-22 are already unrecoverable.
- **Unsourced constants rendered with `P` tags** — see the table in §2. `fuel-prices.ts` is the
  sharpest: the strongest provenance claim on the weakest evidence.
- **Two parallel realities for infrastructure.** `Substation` (0 rows) and
  `substations.ts` (260 records) both exist. Likewise `TransmissionLine` (0) and
  `macro/infrastructure.ts`. A schema that describes data the project does not hold invites
  designs built on the schema.
- **`MacroTrendsTab.tsx` is at its size ceiling** — 3,017 lines against a 3,018 budget enforced
  by `component-size.test.ts`, which instructs extraction rather than raising the number.
- **`DataReleaseRevision` averages 324 KB a row** and is 34 MB for 681 rows — the fastest
  growing table per row written.
- Database growth is **faster than documented**: 172 MB on 2026-09-19, 196.2 MB on 2026-10-04 —
  24 MB in 15 days, against a documented ~130 MB/year. Harmless against a 100 GB allowance, but
  the figure in CLAUDE.md is stale.

---

## 6. Open questions for the user

1. **Are plant and substation coordinates obtainable?** This single answer decides whether
   anything spatial is ever on the roadmap. If PGCB/BPDB will not release them, say so once and
   every map proposal can be closed permanently.
2. **Should `DEMAND_SUPPLY` and the import series be backfilled now?** It is the only
   time-limited item in this audit. Yes or no this week, not this quarter.
3. **Does Macro Trends belong inside Grid Explorer at all?** The data says no — different
   cadence, different alignment class, its own navigation, inert date picker. Confirming or
   rejecting this shapes everything downstream.
4. **What is the status of `fuel-prices.ts`?** Either it has a source nobody recorded, or it is
   filled in. It is currently rendered as published international-body data.
5. **Should the empty entity tables be dropped or filled?** Keeping `Substation`,
   `TransmissionLine`, `GeneratingUnit`, `PowerProject` and `Contract` empty-but-defined is what
   keeps producing designs for data that does not exist.
6. **Is `plants/{date}.json` at 65.8 KB acceptable**, or should the station payload be split so
   the table can page?
