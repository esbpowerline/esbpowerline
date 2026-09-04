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
