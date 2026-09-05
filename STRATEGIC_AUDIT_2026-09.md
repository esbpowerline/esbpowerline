# ESB PowerLine — Strategic Product & Architecture Audit

**Date:** 2026-09-04 · **Branch:** `authenticating` · **Method:** repository inspection, live database queries, production HTTP probes, local dev-server measurement.

Every figure below was verified in this session unless marked *(inherited from the 2026-09-01 audit)*. Where I could not verify something, it says so rather than guessing.

**Scope limit, stated up front:** no browser automation was available in this session, so §C is based on measured page weight, DOM size, breakpoint coverage and code reading — **not** on looking at the running UI. Treat §C as an informed structural read, not a visual verdict. It is the one section that needs your eyes before you act on it.

---

## A. EXECUTIVE VERDICT

### YES, BUT MUCH NARROWER — and the reason is the opposite of what the thesis assumes.

The thesis says the moat should be *"historical data + live data + structured entities + relationships + provenance + consumer data + journalism + algorithms."*

Eight things. **You already have world-class versions of two of them, and approximately zero of five.**

| moat component | actual state |
|---|---|
| historical data | **4,549 energy days, 2013-12-31 → 2026-09-03.** Real, deep, unreproducible. |
| provenance | **Every day names its source document; gas PDFs carry a SHA-256.** Genuinely rare. |
| live data | One NLDC scrape, 10-min cache. Was silently broken until tonight. |
| structured entities | 145 plants, **0 coordinates**. 0 substations, 0 units, 0 projects, 0 contracts. |
| relationships | **None.** `Article` has no foreign key to any entity; classification is a free-text JSON tag. |
| consumer data | **6 users.** No bills, no meters, no OCR, no mobile app. |
| algorithms | A reserve-depletion model and a forecast comparison. No prediction stack. |
| journalism→data | 167 articles, no extraction pipeline. The flywheel is a diagram. |

**The strategic error in the thesis is that it proposes to buy breadth when your defensible asset is depth.**

Here is the sentence that should drive the next twelve months:

> **PGCB and Petrobangla do not serve their own back catalogue. Anything older than roughly ten days is not retrievable from the publisher. ESB has 4,549 days of it, normalised, cross-checked and source-cited. If ESB stopped today, nobody — not a funded competitor, not the government — could reconstruct 2014–2026 from source.**

That is the moat. It already exists. It is barely mentioned in the thesis.

Everything else in the vision — the knowledge graph, the map, the asset dossiers, the tender lifecycle — is built from **currently-published** material that a funded competitor could scrape starting tomorrow and catch up on within a year. Those are not moats. They are features with a data-entry bill attached.

So the verdict is:

1. **Protect and extend the archive first.** It is the only thing you own that cannot be bought. It is also more fragile than you think (see §N and the Pi dependency).
2. **Build the one consumer wedge nobody else can** — tariff-slab intelligence joined to grid context — and refuse the rest of My Energy until it earns its place. Live research (§E2) found that **no app in Bangladesh joins consumption to tariff slabs or to grid conditions**, and that DESCO's open API hands you the consumer's tariff category for free. The archive supplies the half nobody has.
3. **Split the graph in two, and refuse only the expensive half.** Live research (§E3) corrected me here: **plants and transmission lines are an import, not an acquisition** — OpenStreetMap already holds ~95% of PGCB's network and coordinates for 191 plants, and GEM/Wikidata supply a licence-clean plant table. Do that. But **substations, generating units, projects, contracts and the tender→asset lifecycle remain 0 rows with no importable source**, and those are a hiring problem, not an engineering one. Refuse them in 2026.
4. **Do not build a mobile app this year.** With 6 users, an app is a distribution answer to a demand question nobody has asked yet.

A qualified yes. The vision's *direction* is right. Its *sequencing* would bankrupt the thing that makes ESB special.

---

## B. WHAT ESB ALREADY HAS

### Production-grade — genuinely strong, do not touch

**The archive and its doctrine.** 4,549 PGCB energy days; 2,308 Petrobangla gas days; 2,000 half-hourly energy curves; 2,309 per-station days; 317 monthly rollups. Each day carries its source document, both publishers' observation windows, and for gas the SHA-256 of the parsed PDF.

**The data doctrine in `CLAUDE.md`** is the most valuable non-code asset in the repository. "`null` is not zero", "absent is absent — never substitute a neighbouring quantity", "report the source's inconsistency, never silently repair it". Each rule cites the incident that produced it, with figures and dates. Most data companies never write this down. It is why the archive is trustworthy and why an auditor can check your work.

**Two-layer verification.** `verify:data` (self-consistency, 4,549 days, currently **0 ERROR** / 791 WARN / 6,765 INFO) and `verify:source` (refetch, reparse, diff against the publisher, with an audit ledger committed to git). The second is rare even in well-funded data teams. It is the only reason tonight's outage-cause defect was findable at all.

**The tier gate.** Now default-closed in both dimensions, with regression tests driven by real directory listings rather than hand-written rosters. Verified against production: every dated feed 403s on a locked day. Three prior leaks are recorded in comments.

**Ingestion autonomy.** A Raspberry Pi runs a per-publisher watcher every 15 minutes with a lock, clock guard, disk guard, live-site verification, atomic downloads and Telegram alerting. Proven end-to-end tonight: a deliberately deleted day was detected, re-fetched from PGCB's ERP, reparsed and republished **byte-identical** in 64 seconds.

**Test suite.** 63 test files, 439 tests, and — unusually — several are *doctrine* tests rather than unit tests (`chart-palette-discipline`, `comparison-polarity`, `component-size`, `daily-data-gating`).

### Promising — real but incomplete

**The release/revision system.** `DataRelease` + `DataReleaseRevision` with `PUBLISH`/`CORRECT`/`REVOKE`/`RESTORE` and full payload per revision. 79 releases, 144 revisions. This is a proper publishing substrate. Currently used for ~90 recent days only.

**The `Figure` type** (`lib/data/grid/figure.ts`) — a value that cannot be read without deciding what absence means, and cannot be absent without naming who owes it. This is the correct primitive for the entire platform and is currently used in one place.

**P/D provenance marks** on ~160 figures. The idea is right; the execution is inconsistent (I fixed one mislabelled figure tonight and found two more).

### Prototype — looks finished, is not

**The domain model** (migration `0014`). Correct table shapes, almost no rows. 145 plants with zero coordinates; `Substation`, `TransmissionLine`, `GeneratingUnit`, `PowerProject`, `Contract` all empty. `Observation.basis` is `REPORTED` on 327/327 rows — the derived/reported distinction the schema supports is not being recorded.

**The "maps".** "Geographical Grid Map" and "OPGW Fiber Network Map" are links to `/pdf/geo_map.pdf`. There is **no map library in the dependency tree**. Any map-first navigation starts from zero.

### Technical debt — fix or delete

**Hardcoded headline figures.** `MacroTrendsTab.tsx:286` renders `"33,092 MW"` installed capacity and `:364` `"49.94 Million"` consumer base as string literals, styled identically to sourced figures. This directly violates your own doctrine and is the single most credibility-damaging thing in the codebase.

**`bpdbAuditedFinancials`** (`lib/data/companies/bpdb.ts:9`) is labelled *"indicative"* in its own comment and rendered with the same provenance styling as published figures.

**Component size.** `PowerGridExplorer.tsx` is 3,449 lines; `MacroTrendsTab.tsx` 3,017; `TechnicalInfoTab.tsx` 2,334. **29,115 lines** across the explorer. This is the main obstacle to any redesign or code-sharing with an app.

**Homepage HTML weight: 738 KB** of server-rendered HTML before JS or CSS.

### Dead end

`lib/data/macro/fuel-prices.ts` — `globalVsDomesticRaw`, a hand-typed table of global vs domestic prices from 1975, with derived BDT conversions. No source, no provenance, and it feeds rendered comparisons. Delete or source it.

---

## C. GRID EXPLORER UX VERDICT *(structural, not visual — see scope limit)*

**What is excellent.** The information architecture is genuinely good: eight tabs mapped to real publisher datasets, each with a one-line blurb, plus `GRID_VIEW_FOR_CATEGORY` linking article categories to the matching data view — that is a real editorial/data connection and it is more than most outlets manage. Empty states say what the *source* does or does not publish for that era rather than "no data". Per-day tab availability is derived from the day's own payload. These are sophisticated choices.

**What is measurably heavy.** 738 KB of HTML on the homepage (950 `<div>`s) and 278 KB on `/grid-explorer`. TTFB is fine locally (130–180 ms) but that payload is the mobile experience in Bangladesh, on Bangladeshi bandwidth.

**What looks generic from the code.** The card-grid-with-gradient pattern recurs heavily: `bg-gradient-to-r from-teal-500/5 via-primary/5 to-transparent`, `rounded-2xl`, `animate-pulse` on decorative icons. `MapPin` with `animate-pulse` next to a **static PDF link** is exactly the "meaningful motion, not decorative motion" violation your own §39 warns against — motion implying liveness over a document.

**What is underdeveloped.** Breakpoint coverage is `md:` ×176, `sm:` ×96, `lg:` ×51, and **no `xl:`/`2xl:` at all** — the design tops out around 1024 px and does not use a large desktop. For a data product whose core value is dense time-series comparison, that is backwards: the widest screens are where this content should shine.

**What should be removed.** The hardcoded Macro Overview tiles. The `globalVsDomestic` table. The `animate-pulse` on non-live elements.

**Can the current design support the proposed future?** For more tabs and charts, yes. For **map-first navigation, entity dossiers and drill-down hierarchy — no.** Not because the styling is wrong, but because a 3,449-line tab-switching component with no routing per entity and no map library is the wrong substrate. That is a rebuild, and it should not be attempted until there is entity data worth navigating.

**Verdict:** this is an unusually well-thought-through *dashboard*, not yet a *product surface*. Its weakness is not aesthetics; it is that 29,115 lines of component code encode a tab-and-card model that the proposed future does not fit.

---

## D. FEATURE FEASIBILITY MATRIX

Scores /10. Difficulty and Maintenance: **higher = worse**.

| Feature | Value | Uniq | Data | Diff | Maint | Strat | Verdict |
|---|---|---|---|---|---|---|---|
| **Time travel** (drag a date, see grid state) | 9 | 9 | **10** | 3 | 2 | 9 | **BUILD NOW** |
| **Tariff impact simulator** (BERC change → your bill) | 9 | 9 | 6 | 4 | 4 | 10 | **BUILD NOW** |
| **Versioned tariff engine** | 7 | 6 | 7 | 5 | 4 | 10 | **BUILD NOW** |
| Data-quality console (§55) | 6 | 3 | 10 | 3 | 2 | 9 | **BUILD NOW** |
| Provenance UI on every figure | 7 | 9 | 9 | 3 | 2 | 9 | **BUILD NOW** |
| Manual bill entry + history vault | 6 | 4 | 8 | 3 | 3 | 7 | **BUILD NOW** |
| Energy timeline (§42) | 7 | 8 | 7 | 4 | 3 | 7 | BUILD LATER |
| Bill OCR — **postpaid BREB/BPDB only** | 7 | 6 | 5 | 8 | **9** | 5 | BUILD LATER *(narrowed — §E2)* |
| Bill OCR — prepaid DESCO/NESCO | 2 | 2 | 8 | 8 | 9 | 2 | **DO NOT BUILD** *(API already returns it)* |
| Monthly bill forecast | 7 | 5 | 6 | 5 | 5 | 6 | BUILD LATER |
| Bill anomaly detection | 8 | 6 | 6 | 4 | 4 | 7 | BUILD LATER |
| Appliance calculator | 4 | 2 | 9 | 2 | 2 | 3 | BUILD LATER |
| **Plant dossiers** *(corrected — §E3)* | 8 | 5 ⬇ | **8** ⬆ | 5 | 5 | 7 | **BUILD LATER** (was RESEARCH) |
| **Map of plants + lines** *(corrected — §E3)* | 8 | **4** ⬇ | **8** ⬆ | 5 | 5 | 6 | **BUILD LATER** (was RESEARCH) |
| Explain-the-grid AI over evidence | 8 | 9 | 5 | 7 | 7 | 8 | RESEARCH |
| Knowledge graph / asset lifecycle | 7 | 8 | 3 | 9 | 8 | 7 | RESEARCH |
| **Ember cross-check of monthly rollups** | 6 | 8 | **10** | 2 | 2 | 8 | **BUILD NOW (new — §E3)** |
| **DESCO/NESCO balance + consumption adapter** | 8 | 3 | **8** ⬆ | 4 | 7 | 7 | **BUILD (corrected — see §E2)** |
| **Slab-proximity alert** ("40 kWh from the next slab") | 9 | **10** | 8 | 4 | 4 | 9 | **BUILD NOW (new — see §E2)** |
| DPDC / BPDB / BREB adapters | 5 | 3 | **1** | 9 | **10** | 4 | **DO NOT BUILD** |
| Feeder-level load-shed prediction | 9 | 8 | **1** | 9 | 8 | 5 | **DO NOT BUILD** |
| Crowdsourced outage reports | 5 | 4 | 3 | 6 | 8 | 4 | **DO NOT BUILD (yet)** |
| Payments / recharge | 3 | 1 | 3 | 9 | **10** | 2 | **DO NOT BUILD** |
| Generic tender portal | 2 | 1 | 4 | 6 | 7 | 2 | **DO NOT BUILD** |
| Solar/net-metering advisor | 5 | 5 | 3 | 6 | 5 | 5 | BUILD LATER |
| IPS/backup runtime | 3 | 3 | 8 | 2 | 2 | 2 | DO NOT BUILD |

**The pattern:** every "BUILD NOW" is something the existing archive already supports. Every "DO NOT BUILD" depends on data ESB does not have and cannot reliably get.

---

## E. DATA AVAILABILITY MATRIX

| Need | Current ESB source | Frequency | History | Geo resolution | Reliability | Concern |
|---|---|---|---|---|---|---|
| National generation/demand | PGCB daily workbook | daily | **4,549 d** | national | high | publisher back-catalogue unavailable |
| Half-hourly fuel mix | `curves/` | daily | **2,000 d** | national | high | — |
| Per-station output | `plants/` | daily | **2,309 d** | station (no coords) | high | — |
| Live hourly demand | NLDC ERP scrape | hourly | none stored | national | **medium** | broken 12 days undetected; **no snapshot retained** |
| Gas production | Petrobangla PDF | daily | **2,308 d** | field | high | hashed ✓ |
| **Load shedding** | PGCB zone rows | daily | 4,549 d | **9 zones** | medium | **this is the ceiling** |
| Outage events | NLDC log | daily | 119,642 rows | substation *name* | medium | free text; 41k rows lack `full_desc` |
| Tariffs | hand-typed yearly table | yearly | ~12 pts | national | **low** | **no source documents archived** |
| Plant coordinates | — | — | **none** | — | — | acquisition project |
| Substations/lines | PDF only | — | **0 rows** | — | — | acquisition project |
| **DESCO/NESCO meter data** | **open unauth API** *(§E2)* | daily (24 h ceiling) | arbitrary range | per meter | **medium** | undocumented, EOL stack, may close |
| DPDC / BPDB / BREB meter data | — | — | — | — | — | authenticated portals only |
| Bills (postpaid) | — | — | none | — | — | needs OCR or manual entry |
| Weather | — | — | none | — | — | acquirable (BMD/open APIs) |

### The single most important row

**Load shedding resolution is nine zones.** Not districts, not feeders, not utilities. Every consumer-facing outage feature in the thesis — "your area's load-shedding this month", "outage risk in the next 3 hours", "your distribution utility's metrics" — is bounded by that. You can honestly say *"Khulna zone recorded 8.4 h of load shedding"*. You cannot say *"your area"* and mean anything finer, and §13's own discipline forbids pretending otherwise.

### The second most important row

**The live layer stores nothing.** `getLiveGridSnapshot` caches for 10 minutes and discards. Every hourly NLDC reading ESB has ever fetched is gone. **This is the cheapest high-value fix in the entire audit**: persisting that scrape starts accumulating an hourly national dataset that nobody else in Bangladesh is keeping, at a cost of roughly one table and one cron entry. Twelve months from now that is another irreplaceable asset. Today it is thrown away every ten minutes.

### The third

**Tariffs have no archived source documents.** The thesis's best consumer idea (personal tariff impact) rests on a hand-typed yearly table with no citations, against a BPC regime that has priced **monthly since 2024**. The tariff engine is not primarily a code project — it is a document-archaeology project.

---

## E2. COMPETITIVE LANDSCAPE (researched live, 2026-09-04)

Play Store figures scraped from live listings; API behaviour probed directly on the same day.

### The finding that changes the plan

**DESCO operates a completely open, unauthenticated JSON API.**

```
GET https://prepaid.desco.org.bd/api/tkdes/customer/getBalance?accountNo=<n>
→ 200 application/json — no key, no login, no session
```

Sibling endpoints return recharge history (with VAT split), daily consumption, monthly consumption, and — critically — **`getCustomerInfo` returns the consumer's tariff category and sanctioned load.**

I had scored "prepaid meter balance" as data-availability 2/10 and marked the utility-adapter layer DO NOT BUILD. **For DESCO and NESCO that was wrong**, and §D below is corrected. The caveats are real but they are engineering caveats, not blockers: it is undocumented (DESCO's own FAQ never mentions it), runs on an EOL `Apache/2.4.6 / CentOS` stack, leaks PII (an account number alone returns name, address and tariff category), and is one security review away from being closed. **DPDC, BPDB and BREB remain non-viable** — authenticated portals only, and the graveyard of 404'd third-party DPDC apps is the empirical proof.

### The gap, stated plainly

**No app in Bangladesh — official or independent — connects consumption to tariff slabs, or consumption to grid conditions. Not one.**

The three pieces exist separately and nobody has joined them:

| piece | who has it | traction |
|---|---|---|
| consumption/balance | DESCO, PrepaidPro, Prepaid Meter BD, WZPDCL | 500K+ / 5K+ / 50K+ / 50K+ |
| tariff slabs | *BD Electricity Bill Calculator* — offline, 2024 PDFs, **no meter link** | **100+ installs** |
| grid conditions | *Bijli Pulse* — crowdsourced only, **no official grid data** | **500+ installs** |

DESCO hands you the tariff category for free on the wire, and nobody uses it. A user asked PrepaidPro for exactly this on 2026-07-03 — *"it will surely help in this tier based pricing structure"* — and it has not shipped.

**ESB holds the half nobody has.** Bijli Pulse is attempting load-shedding intelligence with zero official data at a moment when load shedding is running 8–9 hours/day. ESB has 4,549 days of PGCB zone-level shedding, generation and deficit. That is the asymmetry.

### The market's #1 complaint is a doctrine problem you have already solved

Four of six official apps sit at **2.0–2.9★**. The dominant complaint, in 2026, is *stale balance presented as current*:

> *"Today is July 3rd, but the app is still showing the old balance from May 31st."* — DESCO, 500K installs, 2.9★

DESCO's own FAQ admits a **24-hour** upstream ceiling. The apps do not disclose the reading timestamp, so users read a stale figure as live. **That is precisely the failure `CLAUDE.md` forbids: printing a number without saying when it was measured.** Your freshness taxonomy (§40 of the brief) and provenance discipline are not overhead here — they are the differentiator, in the one place every incumbent fails.

### Traction ceiling

| app | installs | rating | last update |
|---|---|---|---|
| DESCO (official) | 500K+ | 2.9 | Aug 2026 |
| DPDC Smart Meter | 100K+ | **2.1** | Nov 2025 |
| NESCO (official) | 100K+ | 2.5 | May 2026 |
| BREB পল্লীবিদ্যুৎ সেবা | 50K+ | **2.0** | **Oct 2024 — abandoned** |
| WZPDCL (rebuilt 2026) | 50K+ | **4.0** | Jul 2026 |
| PrepaidPro (independent) | 5K+ | **4.1** | Jun 2026 |

~1.3M installs across the official category at roughly 2.5★. Independents top out at 50K. **The two best-rated products are the two most recently rebuilt** — the market rewards competence and has seen very little of it.

### Refinements this forces

- **OCR is an empty niche, but its value is inverted from the brief's assumption.** For prepaid DESCO/NESCO users the API already returns structured data — OCR adds nothing. OCR's value is highest for **postpaid BREB and BPDB** consumers, whose official apps are abandoned (2.0★, Oct 2024) or absent entirely. That is a much narrower and more defensible target than "scan any bill".
- **No BPDB consumer app exists on Play** that the researcher could find. BPDB routes prepaid through third-party vending (GP, Robi, bKash).
- **iOS is almost entirely unserved** — no App Store listing found for DPDC, NESCO, BREB, WZPDCL or any independent app. Medium confidence; not exhaustively searched.
- **"BidyutBD" could not be found on either store.** Your brief names it; I could not confirm it exists. Do not plan against it without a link.

---

## E3. DATA SOURCE LANDSCAPE (researched live, 2026-09-04)

### The map is an import job, not an acquisition project — I was wrong

I scored map-first navigation and entity dossiers at 1–2/10 for data availability on the basis that ESB has 0 coordinates and 0 substations. That was true of *ESB*. It is not true of the world.

Live Overpass query against OpenStreetMap, 2026-09-04, benchmarked against PGCB's own published figures:

| layer | OSM holds | official benchmark | coverage |
|---|---|---|---|
| transmission lines | 932 ways, **17,845 circuit-km** | PGCB: 18,816 circuit-km | **~95%** |
| substations | 374 (181 tagged ≥132 kV) | PGCB: 259 grid substations | ~70%+ |
| power plants | **191, all with coordinates**, 24,013 MW | BPDB: 137 plants / 29,593 MW | ~81% of capacity |
| towers | 70,693 | — | dense enough to trace routes |

**The hard part is the licence, not the data.** OSM is **ODbL 1.0 share-alike**. Rendering a map from it is a Produced Work (attribution only). *Ingesting it into ESB's entity database and enriching it creates a Derivative Database that must itself be released under ODbL if distributed.* For a company whose commercial plan is selling structured data, that is a strategic decision, not a footnote.

**The clean route exists:** take the *plant* table from **Global Energy Monitor (CC BY 4.0** — unit-level, exact lat/lon with an accuracy flag, full ownership chains, Integrated Power release Aug 2026) plus **Wikidata (CC0** — 91 Bangladesh stations, 86 with coordinates), and render *lines* from OSM as a Produced Work without ingesting them. 73 OSM plants already carry a `wikidata` tag, so the two reconcile cheaply.

**And the genuine gap:** GEM has **no electricity-transmission tracker** — its 25 datasets cover only gas pipelines. Nobody publishes a normalised, cited Bangladesh grid-asset dataset. That is a real hole ESB could fill, and it is adjacent to what ESB already does.

### The finding that most strengthens the archive case

**PGCB's own hourly demand/load-shed page retains roughly 140 days** (3,371 rows). Its generation page goes back ~2,035 pages; the demand page does not.

So the recommendation to persist the live scrape is not a nice-to-have — **PGCB itself does not keep this series.** Start storing it and within a year ESB holds the only long-run hourly demand-and-shedding record in Bangladesh. Today it is discarded every ten minutes.

Related: **Ember's monthly Bangladesh data is sourced from PGCB** — a monthly aggregate of the very documents ESB parses daily. ESB is already *upstream* of an international platform in resolution and latency, and does not seem to know it.

### No Bangladeshi government source publishes machine-readable data. None.

| source | format | API |
|---|---|---|
| EMRD Dashboard | HTML / PDF | no |
| SREDA NDRE (1,850.04 MW register) | HTML | no |
| BPDB daily generation (686 pages) | **PDF/GIF** | no |
| PGCB ERP hourly | HTML | no |
| Petrobangla daily (2,350 reports) | **PDF** | no |
| BBS Statistical Yearbook | PDF | no |
| data.gov.bd | **CKAN API removed; content frozen 2018** | no |

**ESB's parsers *are* the machine-readable layer for Bangladeshi energy data.** That reframes the API business from "expose our data" to "be the only structured source that exists".

Operational notes worth acting on: `energy.gov.bd` does not resolve; **use apex domains, never `www.`** — `www.sreda.gov.bd`, `www.pgcb.gov.bd`, `www.petrobangla.org.bd` all have incomplete TLS chains (consistent with `live-grid.server.ts` already disabling chain verification for that host).

### Competitor pricing — direct anchors for ESB Intelligence

| vendor | Bangladesh coverage | price |
|---|---|---|
| **GlobalData** | project-level, 170,000+ plants | **$1,495 single / $2,990 enterprise** per country report |
| **Enerdata** Power Plant Tracker | explicitly lists Bangladesh, plant-level **with GPS** | **€1,190** country report; DB on quote |
| S&P Global WEPP | unit level, no BD count published | quote only |
| Wood Mackenzie Lens | **Bangladesh not named** in coverage | quote only |
| **WRI Global Power Plant DB** | **57 rows, unmaintained since 2021** | free |

Two things follow. People **do** pay four figures for a Bangladesh power dataset, so §O's Intelligence tier is not speculative. And the free option everyone reaches for first is five years stale with a third of the fleet — which is the gap ESB's daily archive already fills.

### Tenders: no API, but a clean scrape target

**There is no e-GP API and no OCDS.** The advertised RSS feeds (`/RSS/DailyTender.xml` etc.) all 404. Bangladesh is absent from the Open Contracting Data Registry. CPTU is now BPPA (Act 32 of 2023).

The practical targets are buyer-side boards — free, no auth, no JS, no captcha: **`misc.bpdb.gov.bd/tender`** (cleanest, paginated, predictable PDF paths), plus EGCB, RPCL, NWPGCL on the shared National Portal template. The World Bank `procnotices` API is free, keyless, JSON, CC BY 4.0 and returns 580 Bangladesh-power hits back to 2005.

**Doctrine warning:** every buyer board lists only *currently-open* notices and silently drops closed ones. An archive built from polling them will have holes wherever a poll was missed — and per CLAUDE.md those must be recorded as absent, never inferred.

### Licence hierarchy for anything you redistribute

| source | licence | safe to ingest & republish? |
|---|---|---|
| **Wikidata** | CC0 | **yes, unconditionally** |
| **Ember** | CC BY 4.0 | **yes, with credit** |
| **Global Energy Monitor** | CC BY 4.0 *(solar rows from TransitionZero are **BY-NC**)* | yes, with credit |
| World Bank procnotices | CC BY 4.0 | yes |
| **OpenStreetMap** | **ODbL 1.0 share-alike** | render yes; **ingest = derivative database** |
| **IRENA** | "© All Rights Reserved", terms read non-commercial | **no — get written permission** |
| **IEA** | non-CC by default; *free* datasets are **CC BY-NC-SA** | **no — NC is incompatible with a commercial site** |

IEA is the weakest fit of all: paywalled where it is detailed, and non-commercial where it is free.

### Ember is a free external cross-check on ESB's own archive — and nobody is using it

Ember's **monthly** Bangladesh series is built from **PGCB** — the same documents ESB parses daily — and is CC BY 4.0 behind a free, keyless-signup REST API with no enforced rate limits. That makes it the one independent check available on the archive's monthly rollups. Under rule 4, a disagreement is **reportable, not repairable** — but right now it is not even being looked at.

Two traps if it is ever ingested:

- **Ember's *annual* series comes from EIA, not PGCB.** An Ember annual total will not reconcile with the sum of ESB's own days, and that is not an error in either.
- **Ember publishes `0`, not `null`, for Bangladesh wind and bioenergy.** Importing that CSV would import a claim that those technologies generated nothing — precisely the charter violation `CLAUDE.md` opens with. Any Ember ingest needs a null-mapping pass at the boundary.

### Three tests only the Pi can run

`eprocure.gov.bd` tender search returns zero rows, `erp.pgcb.gov.bd/w/tenders/public` 403s, and `geodash.gov.bd` (which publishes a `geonode:power_line` layer with government provenance) times out — **all from a non-Bangladeshi IP.** The Pi sits on a Bangladeshi connection and already reaches PGCB's ERP fine. These three probes cost minutes and would each change the plan.

---

## F. ARCHITECTURE GAP ANALYSIS

| Layer | Current | Required for the vision | Gap |
|---|---|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind, Recharts. 29k lines of explorer components | component library, per-entity routes, map | **large** — needs decomposition first |
| Maps/GIS | **nothing** (PDF links) | tiles, geometry, spatial queries | **total** |
| API | 27 route handlers, 24 server-action files; static-first `/data/**` + `/api/data` twin | versioned public API, keys, quotas | **large** |
| Database | Postgres/Prisma; deep JSON archive + thin entity tables | temporal entities, relationships, PII isolation | **medium-large** |
| Ingestion | Pi watcher + Python parsers; **excellent** | same, plus source registry + raw snapshots | **small** ✓ |
| Source registry | implicit in code | explicit table with adapter/health/licence | **medium** |
| Jobs/queues | cron on a Pi | **no queue at all** | **medium** (fine until OCR) |
| Auth | Supabase, roles, tiers, middleware gate | + consumer accounts, consent, deletion | **medium** |
| Privacy | one RLS migration (`0018`) | schema separation, encryption, retention, audit | **large** |
| Observability | **none** — no Sentry, no OTel, no metrics | ingestion/parse/forecast monitoring | **total** |
| Caching | CDN + `unstable_cache`; well-reasoned | same | **none** ✓ |
| Analytics | Vercel Web Analytics | product funnels | small |
| Mobile | **nothing** | PWA at most | deliberate |

**Two gaps are total: observability and GIS.** Of these, **observability is urgent and GIS is not.** Tonight proved it: a publisher changed one HTML cell, the demand half of the live layer went dark, the test suite stayed green, and nobody knew for up to twelve days. That is not a monitoring nicety — it is the failure mode that quietly destroys a data platform's credibility.

---

## G. DATA-MODEL PROPOSAL (conceptual)

**Survives unchanged:** `DataRelease`, `DataReleaseRevision`, `DataFeed`, `Article`, `User`, roles/tiers, the JSON day archive.

**Needs to exist:**

```
source                     ← the missing keystone
  id, publisher, kind, url, licence, auth_required,
  adapter, cadence_expected, last_success_at, health

snapshot                   ← raw bytes, immutable
  source_id, retrieved_at, content_sha256, storage_url, parser_version

observation                ← already exists; needs to be USED
  entity_id, metric, value, unit,
  observed_at, effective_from, effective_to, published_at, retrieved_at,
  basis (REPORTED | DERIVED | ESTIMATED), source_id, confidence
```

The critical fix is **`basis`**: 327/327 rows say `REPORTED`. The P/D distinction the UI already renders is not recorded in the database. Until it is, "derived" is a front-end styling choice rather than a data property — which is how `avgProductionCost` came to be marked `P` for months.

**Temporal rule:** every entity attribute that can change (plant capacity, tariff rate, project status, ownership) must be a row with `effective_from`/`effective_to`, never an updated column. The thesis is right about this and the current schema does not do it.

**Do not adopt Neo4j.** Your relationship count will be in the thousands, not billions. Postgres with an explicit `relationship(from_entity, type, to_entity, valid_from, valid_to, source_id)` table answers every query in §25 and costs nothing to operate.

**Do not adopt PostGIS yet.** With 0 coordinates, there is no spatial query to justify it. When plants have points, `latitude`/`longitude` columns plus a client-side map serve every query in the thesis. Adopt PostGIS when you need "substations within 20 km of this line", not before.

### PII separation (non-negotiable if My Energy proceeds)

Consumer data must live in a **separate schema with its own credentials** — `consumer.bill`, `consumer.meter`, `consumer.account` — with no foreign key from the public energy schema into it, and no application code path that joins them. The join belongs in the application layer, per-request, under the user's own session. This is what limits a breach to one domain.

---

## H. STANDALONE APP DECISION

**Recommendation: PWA. Do not build a native app in the next twelve months.**

The repo argues this by itself:

- **No React Native, Expo, Capacitor or Tauri** in 63 dependencies. A native app is a greenfield project, not a port.
- **29,115 lines** of explorer components are deeply Tailwind/DOM-coupled. Recharts is SVG/DOM. **Essentially none of this is reusable in React Native.** "Share the components" is not available to you.
- **6 users.** An app-store presence is a distribution solution to a problem you have not yet demonstrated.
- The features that genuinely need native — camera OCR, push, background sync — are all in the *later* half of the roadmap, and modern PWAs cover camera capture and push adequately for a first proof.

**What is worth extracting into shared packages regardless** (because it is good architecture, not because of mobile): `@esb/tariff-engine`, `@esb/energy-utils` (including `gwhToAvgMw`), `@esb/data-model` types, and `@esb/figure` (the `Figure` primitive). These are pure TypeScript, testable, and would be reusable by *any* future client.

**Revisit native when** — and only when — a PWA has demonstrated retained weekly users in the thousands and the blocker is genuinely a platform capability.

---

## I. PRODUCT INFORMATION ARCHITECTURE

**Recommend Option C**, but staged — and for a reason the thesis does not state: Grid Explorer and My Energy have *opposite* trust models. Grid Explorer's credibility comes from publishing only what a source stated. My Energy's usefulness requires estimates, forecasts and OCR guesses. **Mixing them in one surface risks the estimates contaminating the archive's authority.** Keep them visibly separate.

```
esbpowerline.com          Journalism (unchanged)
  /grid-explorer          Public national data — the credibility engine
  /grid-explorer/[date]   Day permalinks (4,549 SEO pages, already shipped)
  /my-energy              Consumer, logged in, visibly separate chrome
  /intelligence           Professional (later; may be a different domain)
```

Navigation should stay **flat and dataset-shaped** (the current eight tabs are good) until entity data exists to justify the `BANGLADESH → ZONE → DISTRICT → ASSET` drill-down. That hierarchy is the right end state and today would be a menu leading to empty pages.

---

## J. 12-MONTH ROADMAP

I have deliberately not given developer-day estimates; I cannot justify them.

### Phase 1 (months 1–2) — Stop the bleeding, keep the asset
**Objective:** the archive cannot silently rot.
- Persist the live NLDC scrape *(cheapest high-value item in this audit)*
- Observability: ingestion latency, parse row counts, expected-publication-missed, alerting
- The data-quality console from §55
- Delete or source every hardcoded figure (`MacroTrendsTab`, `bpdb`, `fuel-prices`)
- Apply the outage backfill; finish the P/D audit
- Merge tonight's four fixes to `main`
**Risk:** low. **Value:** protects everything else.

### Phase 2 (months 2–4) — Provenance as the signature
**Objective:** make the thing you are best at *visible*.
- `source` + `snapshot` tables; populate `Observation.basis` honestly
- Provenance UI on every figure (source / observed / fetched / status / method)
- Time travel — drag a date, watch the grid change. **Fully supported by existing data.**
**Risk:** low. This is the "wow" that costs no new data.

### Phase 3 (months 4–7) — The tariff spine
**Objective:** the one consumer feature only ESB can do well.
- Archive BERC orders and BPC notifications as documents, versioned
- Versioned tariff engine with golden tests reproducing historical bills
- Manual bill entry + history vault
- Tariff impact simulator, embedded in tariff articles
**Risk:** medium — document archaeology is the hard part, not the code.

### Phase 4 (months 7–10) — Consumer proof, on a PWA
- Accounts, PII-separated schema, consent/export/delete
- **DESCO adapter behind an interface** — balance, daily/monthly consumption, recharge history, tariff category. **Every figure stamped with its reading time**, which is the thing all six incumbents fail to do
- **Slab-proximity alerting** — the differentiated wedge; needs the Phase 3 tariff engine
- Anomaly detection and bill explanation
- OCR only if postpaid BREB/BPDB demand shows up
**Kill gate before starting:** see §P.

### Phase 5 (months 10–12) — Entities, by import only
*(Revised after §E3 — this is cheaper than I first thought.)*
- Import plant identity + coordinates from **GEM (CC BY) + Wikidata (CC0)**, reconciled against the 145 existing rows. Keeps the plant table free of ODbL.
- Render transmission lines from **OSM as a Produced Work** (attribution only) — do **not** ingest them into the entity DB unless you accept ODbL share-alike on it.
- Plant dossiers joined to the archive you already have: generation history, outage history, fuel, utilisation.
- Energy timeline.
**Explicitly not in year one:** substations as entities, generating units, projects, contracts, the tender→asset lifecycle, the full graph, native apps, payments, DPDC/BPDB/BREB integrations, outage prediction below zone level.

### Cheap and immediate, out of phase
Three probes only the Pi can run (§E3): `eprocure.gov.bd` tender search, `erp.pgcb.gov.bd/w/tenders/public`, and `geodash.gov.bd`. All blocked from non-Bangladeshi IPs; all would change the plan if they work. Minutes of work, run them in week one.

---

## K. TOP 10 TO BUILD

1. **Persist the live scrape** — starts an irreplaceable hourly dataset today
2. **Observability + data-quality console** — without it everything else decays silently
3. **Provenance UI** — turns your best property into a visible product feature
4. **Time travel** — the signature interaction, zero new data required
5. **Versioned tariff engine** — the spine of every consumer feature
6. **Tariff impact simulator** — the news↔utility bridge, genuinely differentiated
7. **Slab-proximity alert** — *"you are 40 kWh from the ৳15.01 slab"*. Highest uniqueness score in the matrix: **nobody in the market does it**, DESCO's API returns the tariff category free, and a PrepaidPro user requested exactly this in July 2026
8. **DESCO/NESCO adapter** — behind an interface, with the freshness stamp incumbents omit
9. **`source`/`snapshot` registry** — makes ingestion auditable and extensible
10. **Honest figure purge** — remove every unsourced number

*(Dropped from the pre-research list: manual bill entry as a standalone item — for DESCO/NESCO the API supersedes it. Keep it only as the fallback path for postpaid BREB/BPDB users.)*

## L. TOP 10 NOT TO BUILD

1. **Feeder-level load-shedding prediction** — 9-zone ground truth cannot support it
2. **DPDC / BPDB / BREB integrations** — authenticated portals; the 404 graveyard of third-party DPDC apps is the evidence *(note: this is narrower than my pre-research verdict — DESCO/NESCO are viable, see §E2)*
3. **Payments** — regulatory and fraud exposure with no strategic gain
4. **OCR for prepaid users** — the API already returns structured data; OCR there is motion without value
5. **Neo4j / Kafka / Kubernetes / microservices** — no query or scale justifies them
6. **PostGIS** — with 0 coordinates there is nothing to query
7. **Native mobile apps** — no reusable code, no user base
8. **Generic tender portal** — horizontal competitors already own it
9. **Crowdsourced outage reporting** — abuse surface with no user base to make it work
10. **An AI chat that answers from anything but structured evidence**

---

## M. COMPETITIVE MOAT

> *If a well-funded competitor copied the visible UI in six months, what would they still not have?*

**Real moats:**

1. **The back catalogue.** 2013–2026, normalised and source-cited, from documents the publishers no longer serve. **Unbuyable and unbuildable.** Strongest asset by a distance.
2. **The verification apparatus.** `verify:source` refetches and re-diffs against publishers with a committed ledger. A competitor can copy charts; reproducing the confidence that the charts are *right* takes years of the same discipline.
3. **The doctrine.** The written rules and the incidents behind them. This is institutional knowledge, and it is why ESB catches errors competitors would ship.

**Weak / wishful:**

4. **Entity graph** — **weaker than I first scored it, not stronger.** §E3 shows the plant-and-line layer is an OpenStreetMap import: a competitor could stand it up in a **week**, not a year. Building it is worth doing because it makes the archive navigable — but it defends nothing.
5. **Consumer dataset** — 6 users. Not a moat, an aspiration.
6. **Prediction quality** — cannot exceed 9-zone ground truth.
7. **Newsroom** — real but not compounding unless articles produce structured data, which today they do not.
8. **Distribution** — not yet established.

**The uncomfortable conclusion:** your three real moats all come from the *archive and its discipline*, and the thesis proposes to spend the next year on things that are not moats. Invert that.

**What the competitive research adds.** A funded competitor copying the UI would still lack the archive — and the research shows the market has no substitute for it. *Bijli Pulse* is attempting load-shedding intelligence from crowdsourced taps alone because official grid data is not available to it. ESB has 4,549 days of zone-level shedding, generation and deficit. Any competitor entering the consumer space either builds that archive from scratch (impossible — publishers do not serve the back catalogue) or ships the same blind guessing everyone else ships.

There is also a **fourth moat the research revealed that I had not scored: credibility as a product feature.** The dominant complaint across 1.3M installs at ~2.5★ is stale data presented as current. ESB's freshness taxonomy and provenance discipline are already written down and already enforced in code. Every incumbent fails at exactly the thing ESB is constitutionally organised around. That is not a small advantage in a market this badly served.

---

## N. SECURITY / PRIVACY

Today ESB holds public data plus 6 staff accounts. Threat model: defacement, paywall bypass, scraping. All are addressed — the gate is default-closed, rate limiting is in place, middleware fails open by design.

My Energy changes the category entirely: meter numbers, account numbers, addresses, consumption patterns, bill images. **Consumption data reveals occupancy** — when a household is empty, when someone is ill, when a business is failing. In Bangladesh that is a physical-safety consideration, not only a compliance one.

Required before a single real bill is stored:

- Separate schema + separate credentials; **no FK from public data into consumer data**
- Encryption at rest for identifiers; never log meter/account numbers
- Bill images: process and discard. Do not retain raw images because storage is cheap — they contain name, address and account number in one artifact
- Consent, export, deletion, retention limits, audit log of every access
- Aggregation floor (k ≥ 50 households and a geographic minimum) before any consumer signal reaches Grid Explorer

**Additional exposure found tonight, unrelated to consumers:** the Pi holds a production `DATABASE_URL` and a repo deploy key on a home connection. It commits only data paths by convention — worth enforcing mechanically. And `meta.source_pdf` in ~2,300 gas files publishes a machine-local filesystem path.

---

## O. MONETISATION RANKING

1. **ESB Intelligence (professional subscriptions)** — the archive's natural buyer: consultancies, IPPs, banks, development agencies, researchers. Highest willingness to pay, smallest build. **Price discovery now exists (§E3):** GlobalData sells a Bangladesh power report at **$1,495–$2,990**, Enerdata at **€1,190**. People pay four figures for this. The free alternative everyone tries first — WRI's Global Power Plant Database — is **unmaintained since 2021 with 57 Bangladesh rows**.
2. **Data/API licensing** — same asset, different packaging. Very high margin once the API exists.
3. **Research/data licensing to institutions** — universities and development organisations pay for exactly this shape of historical data.
4. **Consumer premium** — expect low conversion; design assuming it is a distribution and credibility play, not revenue.
5. **Utility partnerships / B2B analytics** — plausible later, long sales cycles.
6. **Advertising** — funds journalism, does not fund a data platform.
7. **Payments** — not a business for ESB.

**The ladder in §46 is rational.** The correction is that Intelligence should come *before* the consumer app in revenue expectations, and the consumer app should be justified on distribution and trust, not on subscriptions.

---

## P. KILL CRITERIA

Write these down now, before sunk cost sets in.

**Tariff engine** — kill if BERC/BPC source documents for the last 5 years cannot be assembled within 8 weeks. Without documents it is a hand-typed table again, and the whole point was to stop doing that.

**Bill OCR** — kill if >20% of fields need manual correction after 200 real bills, or median confirmation time exceeds 45 seconds. Below that bar, manual entry is better and cheaper.

**Consumer retention** — kill if <25% of users who import a bill return within 30 days, and <10% import a second. That means the vault is a novelty, not a habit.

**Load-shed forecasting** — do not launch unless a probabilistic model beats the naïve baseline ("same hour last week") on Brier score by ≥15% over 90 days at **zone** level. Never publish at finer resolution than the ground truth.

**DESCO adapter** — kill on first sustained breakage: more than two unplanned maintenance events in 90 days means it is a treadmill, not a product. Design for its death from day one — it is undocumented and unauthenticated, so the day DESCO adds a key is the day it stops. **The adapter must be the only thing that breaks**, and the app must degrade to manual entry rather than to a blank screen.

**Slab-proximity alerting** — kill if fewer than 30% of users who connect a meter enable the alert, or if alert-triggered sessions do not exceed one per user per month. It is the differentiated wedge; if it does not create a return loop, the whole consumer thesis is weaker than it looks.

**Professional tier** — kill if fewer than 5 organisations pay within 6 months of launch. That is a market signal, not an execution problem.

**Entity graph** — kill if, after 3 months, coordinates and substations still require manual entry at a rate implying >12 months to reach usable coverage.

**Overall platform** — if 12 months from now the archive has *not* grown in depth or reliability while all this was built, the strategy failed regardless of how many features shipped. **The archive is the product.**

---

## Appendix — what I verified tonight

Four real defects found, fixed, tested and pushed:

1. **NLDC demand parser dead.** A responsive time cell (`13:00:00` + `13:00` in one `<td>`) defeated an anchored regex; every demand row dropped. Homepage showed "Current Demand — awaiting NLDC" while the page published 13,847 MW. Fallbacks then substituted generation for demand, and `Math.max(0, ...[])` published **0 MW load shed on a day with 2,222 MW**. Suite stayed green on a stale fixture: 51 rows from the fixture, 0 from the live page.
2. **Outage causes wrong.** Marker precedence by list order meant `"Due to Maintenance Work for High Temperature"` published as `"for High Temperature"` — the archive naming a cause the source did not give. ~1,748 rows across 1,233 days.
3. **`avgProductionCost` marked `P`** when derived, contradicting `types.ts:42`.
4. **Three Petrobangla aggregates ungated** — served cross-origin with no Referer while siblings 403'd.

Baselines: `verify:data` **0 ERROR**; 439 tests passing; lint 0 errors; `tsc` clean.

---
---

# PART II — PRESERVATION (2026-09-05)

Written after building and running the NLDC hourly persistence layer, probing the three
Bangladesh-only endpoints, and re-measuring the OpenStreetMap claim. Sections here supersede
Part I wherever they disagree; every disagreement is called out in §Y.

---

## Q. THE BACKFILL — WHAT WAS RECOVERED

Run 2026-09-05 from a Bangladeshi connection. Both NLDC pages walked to exhaustion.

### Generation by fuel + interconnector

| | |
|---|---|
| earliest observation | **2015-04-17T12:30:00Z** |
| latest observation | 2026-09-04T17:00:00Z |
| **unique observations** | **103,331** |
| calendar days covered | **4,139 of 4,159 in span — 99.5%** |
| days absent | 20 (0.5%) |
| off-hour (:30) readings | 4,619 |

### Demand / supply / load-shed

| | |
|---|---|
| earliest observation | **2026-04-22T19:00:00Z** |
| latest observation | 2026-09-04T17:00:00Z |
| **unique observations** | **3,371** |
| calendar days covered | 136 of 136 in span — **100%** |
| off-hour (:30) readings | 135 |

### Field-level coverage

Row presence is not field presence. Measured per column, per series:

| series | field | non-null | of rows |
|---|---|---|---|
| generation | totalMw, gasMw, liquidMw, coalMw, hydroMw, solarMw, windMw | 103,331 | **100.0%** |
| generation | bheramaraMw, tripuraMw, adaniMw, nepalMw | 103,331 | **100.0%** |
| generation | **loadShedMw** | **0** | **0.0% — never printed** |
| demand | **demandMw** | 3,371 | **100.0%** |
| demand | **supplyMw** | 3,371 | **100.0%** |
| demand | **loadShedMw** | 3,371 | **100.0%** |

`loadShedMw` on the generation series is **0.0% and that is correct** — NLDC ships that column
commented out in the current layout. It is stored `null`, never `0`, which is the distinction the
wide table exists to preserve. Load shedding is carried entirely by the demand series, which is the
one with a 145-day retention window.

### Largest missing intervals

| series | gap | hours |
|---|---|---|
| generation | 2017-01-18 05:00 .. 2017-02-08 19:00 | **517** |
| generation | 2017-12-15 14:00 .. 2017-12-16 17:00 | 26 |
| generation | 2015-04-25 15:00 .. 2015-04-26 16:00 | 24 |
| generation | 2015-04-17 18:00 .. 2015-04-18 18:00 | 23 |
| demand | three gaps, 2026-05-11 / 08-20 / 09-02 | **1 each** |

The 517-hour gap in early 2017 is a three-week hole in NLDC's own record, not a fetch failure — the
pages either side parsed cleanly. It is recorded as absent, not interpolated.

### Evidence stored

**3,489 source documents · 231.0 MB as served → 26.3 MB gzipped (11%).**

Every page that produced a row is retained whole, with its SHA-256 and the URL it came from, so any
figure here can be re-derived years from now without refetching a page PGCB may no longer serve.

---

## R. SOURCE-QUALITY ANOMALIES FOUND DURING THE BACKFILL

Four, all counted rather than swallowed, and none repaired.

### 1. Repeated hours within a single page

NLDC prints the same hour twice inside one page. Postgres refuses a multi-row upsert that touches
the same conflict target twice (`ON CONFLICT DO UPDATE command cannot affect row a second time`),
which is how this surfaced — at page 275 of the generation walk.

**Canonicalisation rule, deterministic and stated:** collapse to the **last occurrence** in page
order, and increment a counter reported at the end of the run. Last-wins because the parsers return
rows sorted by timestamp, so the later row is the later-printed value; where the two are identical
(the common case) the choice is immaterial. The page holding both is stored whole, so the discarded
duplicate remains recoverable.

### 2. Impossible years

Seven rows carried years **0008, 0021, 0024, 0050, 0080, 0090, 0093** — 7 in ~103,000 (0.007%).
They parse cleanly because the cell genuinely holds four digits; they are simply not years.

**Rule:** a row is canonical only if its instant falls within `[2010-01-01, now + 2 days]`. Anything
outside is **excluded and counted — never repaired, and nothing guessed about the intended year**.
The seven were removed by `scripts/prune-implausible-hours.ts`, which reports each one with the id
of the source document retained for it.

### 3. NLDC is not strictly hourly

**4,619 generation rows and 135 demand rows fall on `:30`**, and the distribution is unmistakable:
365 per year in every full year (2019: 359, 2020: 365, 2021: 364, 2022: 364, 2023: 365, 2024: 365,
2025: 365). That is **one extra reading per day** — the evening-peak stamp, posted off the hour.

This initially produced a **negative** gap figure (−3,533 hours, −3.5%) because the coverage metric
assumed a strictly hourly denominator. The metric now measures **calendar days**, and the off-hour
count is reported explicitly rather than hidden. No data was wrong; the *measurement* was.

### 4. A three-week hole in NLDC's own record

2017-01-18 → 2017-02-08, 517 consecutive hours absent, with clean pages either side. Recorded as
absent. Not interpolated, not carried forward.

---

---

---

## S. DATA ARCHITECTURE: EVIDENCE → CANONICAL → DERIVED

| layer | means | models today |
|---|---|---|
| **EVIDENCE** | bytes as the publisher served them, immutable, never edited | `SourceDocument` (+`rawGzip`, `contentSha256`, `fetchedAt`, `sourceUrl`) · the PGCB workbook store on the Pi · gas PDFs |
| **CANONICAL** | what the source *said*, normalised, one row per fact, no interpretation | `GridHourlyObservation` · `Observation` · `public/data/**` day files · `DataRelease` payloads |
| **DERIVED** | anything ESB computed | `avgProductionCost` · `unitCost` · reserve model · forecast comparison · archive-fallback |

### Boundary violations found

**1. `public/data/**` straddles CANONICAL and DERIVED, and the schema does not say which is which.**
A day file carries both what PGCB printed (`totalDailyCost`) and what ESB computed
(`avgProductionCost` = cost ÷ generation). Nothing in the JSON marks the difference; the
distinction lives only in a TypeScript comment and a UI badge. That is precisely how
`avgProductionCost` came to be rendered `P` for months (fixed 2026-09-04) — the fact that it was
derived was never stored anywhere a renderer could read.

**2. `Observation.basis` is the right mechanism and is unused.** 327/327 rows say `REPORTED`.
The column that would have prevented violation 1 exists and nobody writes `DERIVED` to it.

**3. DERIVED values are written back into CANONICAL files.** `backfill_daily_extremes`,
`backfill_border_imports` and the forecast anchoring all write computed figures into the same
day JSON as reported ones. Not wrong in itself — the archive is the delivery format — but it
means **the day file cannot answer "did PGCB say this?"** without consulting code.

**4. EVIDENCE was absent for the live layer entirely** until today. That is what this work fixed.

**The rule going forward:** a value may move EVIDENCE → CANONICAL → DERIVED and never backwards.
Nothing in CANONICAL may be computed from another CANONICAL row without being marked `DERIVED`.
`GridHourlyObservation.basis` defaults to `REPORTED` and every row the ingester writes is
genuinely reported — the first table in the platform where that is true by construction.

---

## T. `GridHourlyObservation` — WHERE THE WIDE TABLE STOPS

The wide shape is justified for one reason, and it is not performance: `Observation.value` is
`Decimal NOT NULL`, so in the tall model absence can only be a missing row — which makes "NLDC
printed a blank cell" and "we never fetched this hour" the same fact. Nullable columns on a
present row separate them. That is charter rule 1, and it is the whole argument.

**A metric belongs in this table only if all five hold:**

1. It is published on **the same row, at the same instant**, by one of the two NLDC pages.
2. It is **dense** — present for essentially every hour, not occasional.
3. Its absence is **meaningful** (a blank cell is a fact about the source).
4. The column set is **closed and small** — it changes only when PGCB changes the page layout.
5. It is **REPORTED**, never computed.

**The stop rule.** The moment any of these is false — a metric present for some hours only, a
per-plant or per-zone breakdown, a third publisher's series, or anything ESB calculates — it goes
to the generic time-series model (`Observation`, extended to allow a null value with an explicit
absence reason), **not** a new column here.

Concretely: **this table must never exceed the figure columns the two NLDC pages actually print.**
If PGCB re-enables the generation page's commented-out deficit and load-shed columns, that is a
legitimate addition. If someone proposes per-plant hourly output, per-zone hourly demand, weather,
frequency, or a computed reserve margin — those are `Observation` rows or their own table. A
hundred-column table is not prevented by good intentions; it is prevented by this paragraph and by
the fact that adding a column requires a migration someone must justify in review.

---

## U. `rawGzip` IN POSTGRES — WHEN IT STOPS BEING RIGHT

**Measured, not estimated:** 98.2 MB as served → **11.3 MB stored gzipped (12%)**. HTML compresses
extremely well.

**Why Postgres is right today.** The evidence is captured by the nightly `pg_dump` that already
runs on the Pi; it is transactionally consistent with the rows derived from it; there is no second
system to authenticate against or keep in sync; and a `SourceDocument` row is useless without its
bytes. At ~11 MB the entire NLDC back-catalogue costs less than a single day of the gas archive.

**The crossover.** Object storage wins when any one of these becomes true:

| trigger | threshold | why it matters |
|---|---|---|
| total evidence size | **> ~2 GB** | `pg_dump` is kept 14 deep; 2 GB becomes 28 GB on a card with ~10 GB free |
| single payload size | **> ~5 MB** | PDFs and workbooks, not HTML — TOAST overhead and dump duration |
| read pattern | evidence served to users | Postgres egress is the expensive kind; a CDN in front of object storage is not |
| write rate | > ~50 MB/day sustained | the Pi's nightly dump window starts to matter |

**Projection.** The ongoing poll adds two pages per tick, ~140 KB served → ~17 KB stored. At the
watcher's cadence that is roughly **6–12 MB/year**. The one-off backfill is the bulk of the total.
Postgres therefore remains correct for this source for **years**, and the trigger that fires first
will not be NLDC — it will be the day ESB stores gas PDFs or PGCB workbooks as evidence, each
100×–1000× larger per document.

**Recommendation: do not refactor now.** Add the size check to the nightly job so the crossover
announces itself instead of being discovered when a `pg_dump` fails.

---

## V. THE THREE BANGLADESH PROBES — RESULTS

Run from the Pi's Bangladeshi connection. Two negative answers and one genuine correction.

### GeoDASH — dead, not blocked

```
getent hosts geodash.gov.bd  ->  NO DNS RECORD
https/http, apex and www     ->  all fail to connect, from Bangladesh
```

The domain **does not resolve**. Part I recorded a timeout from abroad and flagged a possible
geo-block worth retrying locally; it is not a geo-block. GeoDASH **cannot be an authoritative
geometry source for any ESB asset, because it no longer exists.** The `geonode:power_line` layer
referenced in secondary sources is unreachable. Treat every published description of GeoDASH as
historical. Question closed.

### PGCB procurement — forbidden, and empty

| endpoint | from Bangladesh |
|---|---|
| `erp.pgcb.gov.bd/w/tenders/public` | **403** |
| `erp.powergrid.gov.bd/w/tenders/public` | **500** |
| `pgcb.gov.bd/site/view/tenders` → `/pages/tenders/` | **200** |

The ERP tender endpoint is genuinely forbidden, not geo-fenced. The public portal works and
renders a proper table (নং · Title · Publish Date · শিরোনাম · দরপত্র নং · দরপত্রের ধরণ) with
**zero rows**: *"কোনো তথ্য পাওয়া যায়নি।"* PGCB is publishing no tenders on its own portal today.

### e-GP — accessible, and NOT ingestible

The one that changed with location. From Bangladesh the site serves content where it returned
nothing from abroad, and the full public search suite loads: `AllTenders.jsp`,
`StdTenderSearch.jsp`, `SearchNOA.jsp` (eContracts — the tender→award link), `SearchAPP.jsp`,
`SearcheCMS.jsp`, `DebarmentRpt.jsp`, `SearchTenderOffline.jsp`, `SearchAwardedContractOffline.jsp`.

The form contract is rich and exactly what an ingester would want:

```
keyword · refNo · tenderId · pubDtFrm/pubDtTo · closeDtFrm/closeDtTo
procNature (Goods|Works|Service|Physical Services) · procType (NCT|ICT) · procMethod
cpvCat · office · txtdepartment · cmbSearchTab (eTenders|APP|eContracts|eExperience)
pageNo · size
```

`navigateSearch()` is trivial — it sets `form.action` by tab and submits. **No CAPTCHA, no CSRF
token, no JS-computed payload.**

**But every submission lands on a login page.** Tested with a live session cookie and correct referer:

| path | result |
|---|---|
| `POST StdTenderSearch.jsp` | **User Login** |
| `GET StdTenderSearch.jsp?h=t` | **User Login** |
| `POST AllTenders.jsp` + date range + `search` | search form returned, **no results table** |
| `GET SearchTenderOffline.jsp` | search form returned, **no results table** |

**Verdict: e-GP is NOT ingestible.** The forms are public; the records are not. Retrieval would
require an authenticated account, which is a terms question before it is a technical one, and
nothing should be automated against a login until that is answered deliberately. **Stable
identifiers, historical depth, pagination and tender→NOA linkage all appear to exist behind that
gate — none is confirmed, because I never retrieved a record.**

Practical alternatives remain the buyer-side boards (`misc.bpdb.gov.bd/tender`, EGCB, RPCL,
NWPGCL) and the World Bank `procnotices` API — with the standing caveat that buyer boards list
only currently-open notices, so an archive built by polling them has holes wherever a poll was
missed, and those must be recorded as absent rather than inferred.

---

## W. OSM TRANSMISSION COVERAGE — METHODOLOGY, AND A CORRECTION

Part I reported *"~95% of PGCB's transmission network (17,845 of 18,816 circuit-km)"*. **That
figure does not survive scrutiny and is withdrawn.**

### Method

Overpass, area-filtered to Bangladesh (`ISO3166-1=BD`, admin_level 2) rather than a bounding box,
so Indian border spill is excluded. `way["power"="line"]`, `out tags geom`. OSM base timestamp
**2026-09-04T18:23:36Z**. 932 ways with geometry.

- **Length** — haversine between consecutive nodes, summed per way. Ways are summed directly, so
  membership in a route relation cannot double-count.
- **Circuits** — `circuit-km = Σ (way length × circuits)`. Where `circuits` is absent the
  multiplier falls back to the count of distinct voltages on the way, else **1** — the
  conservative choice.
- **Voltage** — classified by the maximum value in a `;`-separated `voltage` tag.
- **Duplicates** — ways sharing a rounded (start, end, node-count) signature.

### Results

| measure | value |
|---|---|
| **route / corridor km** | **9,519** |
| **circuit-km (conservative)** | **11,025** |
| PGCB published benchmark | 18,816 circuit-km |
| ways with a `circuits` tag | **59 of 932 — 6%** |
| circuits multiplier distribution | 1 → 884 ways · 2 → 43 · 4 → 5 |
| ways with no `voltage` tag | 97 |
| possible duplicate geometries | 5 |

| max voltage | route km | circuit km |
|---|---|---|
| 400 kV | 1,976 | 2,527 |
| 230 kV | 2,591 | 3,187 |
| 132 kV | 4,755 | 5,114 |
| 500 kV | 21 | 21 |

### What can and cannot be said

**Circuit-km coverage cannot responsibly be stated as a single number.** Only 6% of ways declare a
circuit count. The honest range:

- **Lower bound ≈ 11,025 circuit-km → 59%** of PGCB's 18,816, if every untagged way is single-circuit.
- **Upper bound ≈ 19,000 circuit-km → ~100%**, if essentially every untagged 132 kV+ way is double-circuit.

The earlier 17,845 sits near that upper bound and implies a blanket double-circuit assumption
across 94% of untagged ways. Nothing in the data supports it.

**Corridor coverage is the defensible measure, and even it carries a caveat:** 9,519 route-km of
mapped corridor, against which PGCB publishes no route-km benchmark — and where two parallel
circuits are mapped as two ways, this figure counts the corridor twice.

**Consequence:** OSM is good enough to *draw* Bangladesh's transmission network and badly
under-specified to *quantify* it. It is a rendering source, not a measurement source. The Part I
conclusion that the map is an import rather than an acquisition still stands; what changes is that
**no ESB surface may print an OSM-derived circuit-km total as a fact.**

---

## X. ODbL — WHAT IS ACTUALLY DERIVATIVE

Not a legal opinion. This is the architecture decision the licence forces, and where a lawyer
should be asked.

### The two shapes

**Shape A — Produced Work only (recommended).** OSM geometry is fetched at render time or held in
a tile/GeoJSON cache that is *not* joined to ESB's entity tables, and is used to draw a picture.
The map is a **Produced Work**: attribution required, share-alike **not** triggered on ESB's
database.

**Shape B — geometry ingested into `TransmissionLine` and enriched** with ESB attributes (voltage
confirmed against PGCB, outage history, ownership, asset IDs). This creates a **Derivative
Database**. If ESB then makes it publicly available — and serving it through an API or an export
almost certainly counts — that derivative database must be offered under ODbL. For a company whose
commercial plan is selling structured data, that is *the* decision, and it cannot be undone once
shipped.

### What lands where

| layer | source | licence state |
|---|---|---|
| line geometry | OSM | **ODbL-controlled** — keep isolated |
| substation points | OSM | ODbL-controlled |
| plant identity + coordinates | **GEM (CC BY 4.0) + Wikidata (CC0)** | **clean** — attribution only |
| plant/zone operational history | PGCB workbooks, ESB-parsed | **ESB proprietary** |
| hourly grid series | NLDC, ESB-parsed | **ESB proprietary** |
| tariffs, gas, SREDA | official documents, ESB-parsed | **ESB proprietary** |

**Collective vs Derivative.** Keeping OSM geometry in its own store, unmodified, and *displaying*
ESB data beside it is closer to a **Collective Database** — components remain separable and
share-alike does not reach ESB's tables. Merging OSM geometry into an ESB entity row, or attaching
ESB-derived attributes to an OSM-derived record, moves it to **Derivative**. The boundary is
whether OSM-sourced data is *combined with* or merely *displayed alongside* ESB's.

**Attribution is required either way:** "© OpenStreetMap contributors", visible on any surface
rendering the geometry, with the ODbL named for the data.

### Flag for actual legal review

1. Whether an ESB **API** serving map geometry constitutes "publicly using" a derivative database.
2. Whether **tile caching** OSM-derived geometry on ESB infrastructure remains a Produced Work.
3. The **GEM solar exception** — rows sourced from TransitionZero's Solar Asset Mapper are
   **CC BY-NC 4.0**, incompatible with commercial republication. If GEM's solar tracker is
   imported, those rows must be filtered or separately licensed.
4. **IRENA** carries "© All Rights Reserved" with terms that read non-commercial. Nothing from
   IRENA should be republished before someone reads those terms in a browser.

**Recommendation: Shape A.** Render from OSM, source the plant table from GEM + Wikidata, keep the
entity database clean of ODbL. It costs nothing today and preserves every commercial option.

---

## Y. CORRECTIONS TO THIS AUDIT

The standard applied is the one ESB Intelligence would have to meet.

### 1. "No Bangladeshi government source publishes machine-readable data. None."

**Withdrawn — the absolute is false.** DESCO, a state-owned distribution company under the Power
Division, serves a JSON API returning balance, customer info, tariff category, recharge history
and daily/monthly consumption, unauthenticated (§E2). Part I asserted the absolute in §E3 while
documenting the counter-example in §E2 — the two sections contradicted each other.

**Replacement:**

> Of the Bangladeshi government **energy-statistics publishers** ESB depends on — PGCB,
> Petrobangla, BPDB, SREDA, EMRD, BBS — **none publishes a machine-readable feed or documented API
> for its statistical output.** All ship HTML, PDF or images, and `data.gov.bd`'s CKAN API has been
> removed with its content frozen since 2018. Machine-readable government endpoints do exist at the
> **consumer-service** layer (DESCO's prepaid API), but not for national energy statistics.

That is the claim that survives, and it is the one that matters: ESB's parsers are the
machine-readable layer **for the statistical corpus** — the corpus the archive is built on.

### 2. WRI Global Power Plant Database "unmaintained since 2021"

**Not verified to the required standard, and softened.** The claim came from a research summary
quoting the repository README ("not currently maintained by WRI… no planned updates as of early
2022") with a final release of v1.3.0 (2021-06-02). I did **not** independently open the dataset's
current metadata, and the requirement is right that a landing page can carry a later revision date
than its README.

**Replacement:** the last release evidenced is **v1.3.0, June 2021**, with a README disclaiming
maintenance; Bangladesh coverage is ~57 rows against a fleet of 137 plants. Whether WRI has since
revised the metadata is **unconfirmed**. The operative point is unchanged — Bangladesh coverage is
a fraction of the fleet — but the wording should read "last evidenced release June 2021; current
maintenance status unconfirmed."

### 3. OSM "~95% of PGCB's transmission network"

**Withdrawn, replaced by §W** — a 59%–100% range on circuit-km, with 9,519 route-km as the
defensible corridor figure.

### 4. "PGCB retains roughly 140 days" of hourly data

**Half right, and the wrong half matters.** True of the **demand/supply/load-shed** page (~145
days). The **generation** page paginates back to **2015-04-17**. Part I applied the retention
figure to the hourly series generally. §Z treats them as different asset classes in consequence.

---

## Z. ESB DATA ASSET REGISTER

Three classifications drive everything below.

- **RECOVERABLE** — could a competitor starting later reconstruct the *history*? `NO` means the
  publisher does not serve the past and no third party mirrors it.
- **EPHEMERAL** — does the publisher overwrite or delete? A **stock** (a register showing "as of
  now") is maximally ephemeral: yesterday's state is simply gone. A **flow** with a rolling window
  is next. A permanent document archive is not ephemeral.
- **TRANSFORMATION COST** — how hard is it to reproduce ESB's canonical dataset *given* the raw
  source? This is where years of parser quirk-knowledge live, and it is the moat component people
  consistently underrate.

### The register

| # | Asset | Publisher | Temporal | Geographic | Source retention | ESB retention | Struct. | Provenance | Licence | Ingest difficulty | Fragility | Replacement | **RECOV.** | **EPHEM.** | **TRANSF. COST** | Strat /10 | Urgency /10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **NLDC hourly demand / supply / load-shed** | PGCB ERP | hourly | national | **~145 days, rolling** | **from 2026-04-22, growing** | HTML→canonical | high (hash + raw) | none asserted | medium | **high** | none | **NO** | **rolling window** | **medium** | 10 | **10** |
| 2 | **NLDC hourly generation by fuel + imports** | PGCB ERP | hourly | national | back to 2015-04-17 | **from 2015, growing** | HTML→canonical | high (hash + raw) | none asserted | medium | **high** | none | **partly** | truncatable | **medium** | 10 | **9** |
| 3 | **PGCB daily energy workbook** | PGCB | daily | national + 9 zones + station | **index ~10 d; documents by id: full** | **4,549 days (2013→)** | XLSX→canonical | very high | none asserted | **very high** | medium | none | **YES — via id walk** | **index ROLLING, documents LONG-LIVED** | **very high** | 10 | 6 ⬇ |
| 4 | **Petrobangla daily gas report** | Petrobangla | daily (08→08) | field + company | **paginates to 2020-01-12** | **2,308 days** | PDF→canonical | very high (SHA-256) | none asserted | **very high** | medium | none | **YES — to 2020-01** | **LONG-LIVED** | **very high** | 9 | 5 ⬇ |
| 5 | **SREDA renewable register (NDRE)** | SREDA | **stock, live** | project | **current state only** | 9 snapshots | HTML→canonical | medium | none asserted | low | medium | none | **NO** | **stock — overwrites** | low | 8 | **9** |
| 6 | **SREDA net-metering statistics** | SREDA | monthly | utility | ~12 months shown | none | HTML | medium | none asserted | low | medium | none | **NO** | **rolling** | low | 7 | **8** |
| 7 | **BERC tariff orders** | BERC | irregular | national | gazette archive | **none — hand-typed table** | PDF | **currently none** | public document | medium | low | gazette | mostly yes | no | **high** | 9 | **9** |
| 8 | **BPC fuel price notifications** | BPC / MoPEMR | **monthly since 2024** | national | site archive | **none — yearly table** | PDF/HTML | **currently none** | public document | medium | medium | press | mostly yes | partial | medium | 8 | **8** |
| 9 | **BPDB daily generation report** | BPDB | daily | plant | **686 pages** | none | **PDF/GIF** | n/a | none asserted | **high** (image) | medium | none | partly | paginated archive | **very high** | 8 | 7 |
| 10 | **Buyer tender boards** (BPDB, EGCB, RPCL, NWPGCL) |各 | irregular | national | **open notices only** | none | HTML+PDF | n/a | none asserted | low | high | e-GP (gated) | **NO** | **closed notices vanish** | low | 6 | **8** |
| 11 | **PGCB monthly report** | PGCB | monthly | national + substation | site archive | **317 months** | XLSX→canonical | high | none asserted | high | low | none | partly | no | high | 7 | 5 |
| 12 | **PGCB substation / line register** | PGCB | as-published | asset | current page only | in-component array | HTML/PDF | low | none asserted | medium | medium | OSM (ODbL) | **NO** | **stock** | medium | 7 | 7 |
| 13 | **DESCO prepaid consumer API** | DESCO | daily (24 h lag) | **per meter** | arbitrary date range | none | **JSON** | high | **undocumented** | **low** | **very high** | none | per-user | account-scoped | low | 7 | 5 |
| 14 | **Ember monthly Bangladesh** | Ember | monthly | national | full archive | none | CSV/API | high | **CC BY 4.0** | **very low** | very low | own archive | **YES** | no | very low | 5 | 3 |
| 15 | **IRENA capacity by technology** | IRENA | annual | national | full archive | none | PxWeb API | high | **© all rights reserved** | low | low | SREDA | **YES** | no | very low | 4 | 2 |
| 16 | **GEM plant trackers** | Global Energy Monitor | ~biannual releases | **unit + coords** | current release only | none | XLSX | high | **CC BY 4.0** (solar rows BY-NC) | low | low | Wikidata | **release vintages: NO** | supersedes | low | 7 | 6 |
| 17 | **OSM power infrastructure** | OSM | continuous | geometry | **full history** | none | Overpass | medium | **ODbL** | low | very low | — | **YES** | no | low | 6 | 2 |
| 18 | **BBS Statistical Yearbook energy ch.** | BBS | annual | national | back-issues online | none | PDF | medium | public document | medium | low | — | **YES** | no | medium | 4 | 3 |
| 19 | **Bangladesh Bank USD/BDT reference rate** | BB | daily | national | archive published | none | HTML | high | public | low | low | — | mostly yes | daily page overwrites | low | 5 | 5 |
| 20 | **World Bank procurement notices** | World Bank | continuous | project | full archive | none | **JSON API** | high | **CC BY 4.0** | **very low** | very low | — | **YES** | no | very low | 4 | 2 |

### The ten a 2030 competitor could never reconstruct

Ranked by the question asked: *if ESB starts preserving in September 2026 and a competitor starts
in September 2030, what exactly is permanently beyond their reach?*

**Revised after the decay measurements in §AA** — two entries I had placed high turned out to be
recoverable, and are demoted accordingly. Reporting that is the point of measuring.

1. **NLDC hourly demand / supply / load-shed, 2026-04 → 2030.** The window is ~145 days. A 2030
   entrant gets 2030 onward and **nothing before**. Four years of hourly national demand and load
   shedding — across the period Bangladesh was running 8–9 hour shortfalls — would exist in exactly
   one place. This is the single most valuable thing ESB can do this year, and it began today.
2. **SREDA's renewable register, snapshot by snapshot.** It is a *stock*, not a flow: the page shows
   what exists now. Every historical state that is not captured is gone forever. A competitor in
   2030 can see 2030's register and can never see how it got there — which project slipped, which
   capacity was revised down, when a plant actually energised.
3. **Closed tender notices from buyer boards.** They list only open notices. Every procurement that
   closed unrecorded is unrecoverable from those boards, and e-GP's archive is behind a login.
4. **NLDC hourly generation before whenever PGCB next truncates it.** Deep today (2015), served by
   the same application whose sibling page keeps 145 days. It is one configuration change from
   becoming asset #1.
5. **PGCB's id→energy-day index.** Corrected after measurement (§AA): the *documents* are
   recoverable — id 200 still serves a workbook — but PGCB's listing shows ~10 days, so without the
   id map those 4,549 workbooks are addressable and unfindable. The map, not the archive, is the
   scarce object.
6. **The transformation, for both PGCB and Petrobangla.** Also corrected: the raw material for both
   is obtainable in 2030. What is not is years of era-specific layout handling, EWIC quirks and
   zone-rounding tolerances — plus, for gas, the SHA-256 binding each figure to the PDF it came
   from, which cannot be retrofitted onto a later re-download.
7. **The BERC/BPC tariff timeline as it applied.** Gazettes persist, but the reconstruction — which
   rate was in force on which date, for which category, reproducing a historical bill exactly — is
   expensive archaeology that compounds the longer it is deferred. Every month that passes adds a
   month nobody has assembled.
8. **BPDB's daily generation reports as images.** 686 pages of PDF/GIF. Recoverable while the
   archive stands; the OCR/parse effort is the moat, and the archive is one site migration from
   vanishing.
9. **ESB's own correction history.** `DataReleaseRevision` records what was published, when it was
   found wrong, and what replaced it. No competitor can reconstruct ESB's mistakes — and for an
   archive that sells trustworthiness, the audit trail *is* part of the product.
10. **The fetched-vs-observed lag series.** Because `fetchedAt` is stored separately from
    `observedAt`, ESB accumulates a record of *how late each publisher actually was*. Nobody else is
    measuring Bangladeshi publisher latency, and it cannot be reconstructed after the fact.

**The pattern worth naming:** every item on this list is valuable because of **when it was captured**,
not because of how cleverly it was processed. That is the opposite of where the four-product thesis
proposed to spend the year.

---

## AA. SOURCE DECAY / RETENTION — MEASURED

Every row below was probed directly on 2026-09-04/05 from the Pi's Bangladeshi connection. Where
a figure could not be established it says so rather than being inferred.

| Source | Oldest accessible | Newest | Retention window | Rolls off? | URL stability | Overwritten in place? | Reconstructable elsewhere? | **CLASS** |
|---|---|---|---|---|---|---|---|---|
| **NLDC demand / supply / load-shed** | ~2026-04-22 (page 68 last with data) | today | **~145 days** | **YES** | page numbers, contents shift | no — rows fall out | **no** | **ROLLING** |
| **NLDC generation** | **2015-04-17** (page ~2036) | today | **~11.4 years** | not observed | page numbers, contents shift | no | no | **LONG-LIVED** |
| **PGCB daily workbook — index page** | ~10 days | today | **~10 days** | **YES** | — | no | yes, via ID walk | **ROLLING** |
| **PGCB daily workbook — documents** | id 200 still served | id 5121 | **full ID space, with gaps** | **no** | **stable by numeric ID** | no | no | **LONG-LIVED** |
| **Petrobangla daily gas listing** | **2020-01-12** (page ~235) | 2026-09-03 | **~6.6 years** | not observed | Oracle objectstorage UUIDs — opaque but stable | no | no | **LONG-LIVED** |
| **SREDA NDRE register** | current state only | "Last Update: 2026-09-03 21:48:25" | **none** | n/a | stable URL, changing content | **YES** | **no** | **OVERWRITTEN** |
| **SREDA net-metering statistics** | ~12 months displayed | current month | ~1 year | **YES** | stable URL | **YES** | no | **OVERWRITTEN** |
| **BPDB daily generation archive** | 686 pages deep | today | **years** | no | paginated | no | no | **LONG-LIVED** |
| **Buyer tender boards** (BPDB/EGCB/RPCL/NWPGCL) | open notices only | today | **until each closes** | **YES** | per-tender PDF path | no — the row is removed | **no** | **EPHEMERAL** |
| **e-GP** | behind login | — | — | — | — | — | — | **UNKNOWN** |
| **GeoDASH** | — | — | — | — | **no DNS record** | — | — | **GONE** |
| **BERC / BPC notifications** | gazette archive | current | years | no | site paths | no | yes (gazette) | **LONG-LIVED** |
| **Ember / IRENA / World Bank / OSM** | full history | current | full | no | stable | no | **yes** | **PERMANENT** |

### The phenomenon worth naming: PGCB's index rolls off while its documents do not

You asked specifically whether historical documents disappear while index pages remain. **PGCB is
the exact inverse, and it is the more dangerous shape.**

Its listing page shows roughly ten days. Its *documents* remain addressable indefinitely — id 200
still returns a valid 282 KB workbook today. So the archive has not been deleted; it has become
**unfindable**. Anyone without the id→energy-day mapping sees a ten-day window and concludes the
history is gone. That is exactly the conclusion recorded in this project's own notes
("upstream archives are gone… anything older than ~10 days is not browsable") — **and it is wrong**,
which is worth correcting because it changes the recoverability of ESB's largest asset.

**The consequence is that `ERP_BY_ENERGY` — the id→date map in `daily_extractor/config.py`, plus
`probe_erp_for_energy`'s ability to extend it — is itself an archival asset.** It is the index PGCB
stopped publishing. Losing it would not lose the documents, but it would make 4,549 of them
unfindable without re-walking thousands of ids. It should be treated as evidence and backed up
accordingly, not as a config constant.

### What this changes in the ranking

Measuring decay rather than assuming it moved three assets:

- **PGCB daily workbooks: recoverable after all.** Down-weighted for urgency, because a competitor
  *could* walk the ID space. The moat there is the **transformation** — era-specific layouts, EWIC
  quirks, zone-rounding tolerances — not the raw bytes.
- **Petrobangla gas: recoverable to 2020-01.** Also down-weighted. ESB's 2,308 days are roughly
  co-extensive with what Petrobangla still serves, so the raw material is obtainable; again the
  moat is the parse, plus the SHA-256 provenance that cannot be retrofitted.
- **SREDA: up-weighted to the top tier.** Confirmed `OVERWRITTEN` — a single page carrying a live
  timestamp. Every state not captured is gone permanently, and it is the cheapest thing in the
  register to preserve.

**The rule the user proposed is right and the measurements bear it out:** decay beats commercial
value in ranking. Petrobangla gas has higher immediate commercial value than SREDA's register, and
SREDA should still be archived first — because gas can be re-fetched in 2030 and the register
cannot.

### Revised urgency tiers

**Tier 1 — losing data every day, unrecoverable:**
NLDC demand/load-shed (ROLLING 145 d) · SREDA register (OVERWRITTEN) · SREDA net-metering
(OVERWRITTEN) · closed tender notices (EPHEMERAL)

**Tier 2 — recoverable today, fragile tomorrow:**
NLDC generation (LONG-LIVED but same platform as Tier 1) · PGCB workbook documents (LONG-LIVED but
**index already rolled off** — depends on ESB's own id map) · BPDB daily generation (LONG-LIVED,
un-ingested)

**Tier 3 — recoverable, blocked on ESB's own work rather than decay:**
BERC tariff orders · BPC monthly notifications · Bangladesh Bank rates

**Tier 4 — permanent at source, no urgency:**
Ember · IRENA · World Bank · OSM · BBS · GEM current releases (though GEM *release vintages* are
themselves overwritten, so archiving each release as it lands is cheap insurance)

---

# THE ESB ARCHIVAL PRIORITY LIST

Twenty external streams ranked by **urgency to begin preserving**. Urgency is driven by measured
decay (§AA) *before* commercial value, exactly as instructed: a stream that overwrites itself
outranks a more valuable stream the publisher archives properly, because only one of them is
losing data while you read this.

Storage assumes the evidence layer (raw bytes gzipped) plus canonical rows. NLDC compresses to
**11%** of served size, measured.

---

### 1. NLDC hourly demand / supply / load-shed — **IMPLEMENTED 2026-09-05**
The only hourly record of Bangladeshi electricity *shortfall*, and the most politically salient
number in the sector. · PGCB ERP · hourly · **ESB from 2026-04-22, growing** ·
**Decay: ROLLING ~145 days** · **Recoverability: NONE** · normalisation medium · commercial value
very high · archive every 15 min · **~2 MB/yr** · licence risk low · **DONE.**

### 2. SREDA renewable register (NDRE) — **NOT STARTED — highest unstarted urgency**
A **stock**, not a flow: one page, live timestamp ("Last Update: 2026-09-03 21:48:25"). Every prior
state is gone the moment it changes. A 2030 competitor can see 2030's register and can never see
how it got there — which projects slipped, which capacities were revised, when plants actually
energised. · SREDA · continuous · **9 accidental snapshots** · **Decay: OVERWRITTEN** ·
**Recoverability: NONE** · normalisation low · value high · **weekly** · **~5 MB/yr** · low ·
**NOT STARTED.**

### 3. SREDA net-metering statistics — **NOT STARTED**
Monthly distributed-solar uptake by utility; the only public series tracking it. Rolling display,
overwritten. · SREDA · monthly · none · **Decay: OVERWRITTEN** · **Recoverability: poor** · low ·
medium · **monthly** · ~2 MB/yr · low · **NOT STARTED.**

### 4. Closed tender notices (BPDB, EGCB, RPCL, NWPGCL) — **NOT STARTED**
Boards list **only currently-open** notices; a closed notice is removed, and e-GP's archive is
behind a login (§V). Every procurement closing unrecorded is a permanently lost data point about
the sector's capital pipeline. · various · irregular · none · **Decay: EPHEMERAL** ·
**Recoverability: NONE** · low · medium · **daily poll** · ~50 MB/yr · low · **NOT STARTED.**

### 5. NLDC hourly generation by fuel + interconnector — **IMPLEMENTED 2026-09-05**
Hourly fuel mix and cross-border imports; the demand series is meaningless without it. Deep today,
but served by the same application whose sibling page keeps 145 days — one config change from
becoming item 1. · PGCB ERP · hourly · **2015-04-17 → present** · **Decay: LONG-LIVED (truncatable)**
· recoverability partial now, none after truncation · medium · very high · every 15 min ·
**~2 MB/yr** · low · **DONE.**

### 6. PGCB's ERP id → energy-day map — **PARTIAL, and under-protected**
Not a document — an **index**. PGCB's listing rolls off at ~10 days while the documents stay
addressable by numeric id forever (§AA). Without the mapping, 4,549 workbooks are reachable but
unfindable. This map lives in `daily_extractor/config.py` as a constant and should be treated as
evidence. · derived by ESB · continuous · in-repo · **Decay: the index has ALREADY rolled off at
source** · **Recoverability: only by re-walking thousands of ids** · low · **very high** ·
**every poll** · <1 MB/yr · none · **PARTIAL — promote to a table and back it up.**

### 7. BERC tariff orders — **NOT STARTED — blocks the consumer thesis**
The versioned tariff engine is the spine of every consumer feature; today ESB has a hand-typed
yearly table with no cited document. Gazettes persist, so this is recoverable — but the
reconstruction cost compounds monthly and everything else waits on it. · BERC · irregular · none ·
**Decay: LONG-LIVED** · recoverable · **normalisation high** · **very high** · on publication ·
~20 MB/yr · low · **NOT STARTED.**

### 8. BPC monthly fuel price notifications — **NOT STARTED**
BPC moved to a **monthly automatic formula in 2024**; ESB's yearly table is wrong by construction
between revisions. · BPC / MoPEMR · monthly · none · **Decay: LONG-LIVED** · mostly recoverable ·
medium · high · **monthly** · ~5 MB/yr · low · **NOT STARTED.**

### 9. GEM tracker release vintages — **NOT STARTED**
The current release is always available; **superseded releases are not**. Archiving each release as
it lands preserves the history of what the reference dataset believed — cheap insurance, and the
only way to answer "when did GEM learn this plant existed?" · GEM · ~biannual · none ·
**Decay: OVERWRITTEN per release** · current yes / vintages no · low · high · **each release** ·
~50 MB/yr · **CC BY 4.0, but solar rows are BY-NC — filter** · **NOT STARTED.**

### 10. PGCB substation & transmission register — **NOT STARTED**
A stock published as a current-state page; ESB's copy is a literal array inside a React component.
Underpins every asset-dossier ambition. · PGCB · as-published · in-component only ·
**Decay: OVERWRITTEN (stock)** · poor · medium · high · **monthly** · ~1 MB/yr · low ·
**NOT STARTED.**

### 11. PGCB daily energy workbook — **OPERATIONAL** *(down-weighted after measurement)*
4,549 days, the archive everything hangs off. **Down-weighted for urgency because the documents
turn out to be recoverable** — id 200 still serves a valid workbook. The moat is the
*transformation*, not the bytes: era-specific layouts, EWIC quirks, zone-rounding tolerances. ·
PGCB · daily · **2013-12-31 →** · **Decay: LONG-LIVED (documents) / ROLLING (index)** ·
**recoverable via id walk** · **transformation very high** · very high · 4×/day + watcher ·
~150 MB/yr · low · **OPERATIONAL.**

### 12. Petrobangla daily gas report — **OPERATIONAL** *(down-weighted after measurement)*
2,308 days with SHA-256 per PDF. Listing paginates back to **2020-01-12**, so ESB's holdings are
roughly co-extensive with what Petrobangla still serves — the raw material is obtainable. The moat
is the parse plus provenance that cannot be retrofitted. · Petrobangla · daily ·
**Decay: LONG-LIVED (~6.6 yr)** · recoverable · **transformation very high** · high ·
4×/day + watcher · ~365 MB/yr · low · **OPERATIONAL.**

### 13. BPDB daily generation report — **NOT STARTED**
Plant-level daily generation from the generation utility — the dimension PGCB's workbook covers
least well. **686-page archive** standing today. · BPDB · daily · none · **Decay: LONG-LIVED** ·
partial · **very high (PDF/GIF → OCR)** · high · **daily** · ~180 MB/yr · low · **NOT STARTED.**

### 14. Bangladesh Bank USD/BDT reference rate — **NOT STARTED**
Every fuel-import and LNG cost figure is meaningless without the rate that applied *on that date*.
ESB hard-codes a yearly table. · Bangladesh Bank · daily · none ·
**Decay: daily page overwrites; archive published** · mostly recoverable · low · medium ·
**daily** · <1 MB/yr · low · **NOT STARTED.**

### 15. PGCB monthly report — **OPERATIONAL**
317 months, substation-level detail; source keeps an archive. · PGCB · monthly ·
**Decay: LONG-LIVED** · partial · high · high · monthly · ~30 MB/yr · low · **OPERATIONAL.**

### 16. DESCO prepaid consumer API — **NOT STARTED, correctly**
Per-meter consumption and tariff category. Highest fragility in the register: undocumented, EOL
stack, leaks PII, one security review from closure. Archivable only per consenting user, and doing
so makes ESB a processor of personal data (§N). · DESCO · daily (24 h lag) ·
**Decay: per-account, arbitrary range** · n/a · low · medium · **only with consent** · depends ·
**high — undocumented endpoint + PII** · **NOT STARTED.**

### 17. Ember monthly Bangladesh — **NOT STARTED (low urgency, real utility)**
Not for the data — ESB is upstream of it — but as a **free external cross-check** on ESB's monthly
rollups under rule 4. · Ember · monthly · **Decay: PERMANENT** · fully recoverable · very low ·
medium (as verification) · monthly · <1 MB/yr · **CC BY 4.0** · **NOT STARTED.**
**Trap:** Ember publishes `0`, not null, for Bangladesh wind and bioenergy. Ingesting it without a
null-mapping pass imports a claim the charter forbids.

### 18. BBS Statistical Yearbook, energy chapter — **NOT STARTED**
Annual, back-issues online. · BBS · annual · **Decay: PERMANENT** · yes · medium · low · annual ·
~50 MB/yr · low · **NOT STARTED.**

### 19. OSM power infrastructure — **NOT STARTED (no urgency)**
Full history preserved by OSM itself; nothing is lost by waiting. Value is rendering, not
measurement (§W). · OSM · continuous · **Decay: PERMANENT** · fully recoverable · low · medium ·
quarterly · ~20 MB/yr · **ODbL share-alike — see §X** · **NOT STARTED.**

### 20. IRENA capacity / World Bank procurement — **NOT STARTED**
Both fully archived at source, both annual-or-slower in usefulness here. · IRENA / World Bank ·
**Decay: PERMANENT** · yes · very low · low · annual / weekly · ~10 MB/yr ·
**IRENA © all rights reserved — do not republish unchecked; World Bank CC BY 4.0** ·
**NOT STARTED.**

---

## What the decay-weighted ranking says

**Items 1–6 are the year, and four of them are not started.** Every one is losing data now (1–5) or
protecting an index the publisher has already stopped serving (6). Together they are **under
70 MB/year** and need no new architecture — the pattern built for items 1 and 5 covers all of them.

**Measuring decay demoted the two assets I had ranked highest.** PGCB workbooks and Petrobangla gas
both turned out to be *recoverable*: PGCB serves old documents by id, Petrobangla paginates to
2020. Their moat is the transformation and the provenance, not scarcity of the raw material. That
is a weaker moat than "nobody else can obtain this" — and it is better to know it.

**The sharpest correction:** this project's own notes record that upstream archives are gone beyond
~10 days. For the *index* that is true. For the *documents* it is not, and the difference is
`ERP_BY_ENERGY` — a map in a config file that is doing more strategic work than anything in the
four-product thesis.

**The one-line version:** the assets worth most are the ones nobody can go back and get, they are
almost always the cheapest to store, and three of the four in that category are still not started.
