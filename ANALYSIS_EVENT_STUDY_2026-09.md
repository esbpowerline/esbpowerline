# Event study: the R-LNG shortfall — build report

**2026-09-05.** The first Analysis surface: an event study of the July–August 2026 gas
shortfall, built in four phases (evidence → module → page → this report). Companion:
`PHASE1_EVENT_STUDY_FINDINGS.md` — the read-only evidence pass that every design decision
below cites.

---

## 1. What was built

| file | what it is |
|---|---|
| `PHASE1_EVENT_STUDY_FINDINGS.md` | the archive interrogation: series, shift dates, gaps, verification findings |
| `lib/data/analysis/event-study.ts` | the pure engine — series registry, coverage, baseline deltas, `comparable()`-checked card grouping. No IO, no React |
| `lib/data/analysis/event-study.server.ts` | the loader — reads days through `loadDailyReportFromDisk` and `loadPetrobanglaForEnergyDay` (release precedence and the gas-window check stay in their one home each), plus the verbatim outage quotes |
| `lib/test/event-study.test.ts` | 15 Vitest tests (see §4) |
| `components/analysis/gas-crisis/EventStudyChart.tsx` | one card's chart; `connectNulls={false}`; colours from `chart-palette` only |
| `components/analysis/gas-crisis/HourlyShedPanel.tsx` | NLDC hourly shed via `/api/grid/history/series`; renders the tier restriction instead of routing around it |
| `app/(public)/analysis/gas-crisis-2026/page.tsx` | the page: SSR, `AnalysisNewsArticle` + breadcrumb JSON-LD, delta tiles, five chain cards, quoted outage rows, hourly panel, methodology block |
| `components/shared/PublicNavbar.tsx`, `lib/i18n/messages.ts` | an "Analysis" hub link (en + bn), active-state on `/analysis` |

The route is its own chunk (App Router per-route splitting); nothing imports
`PowerGridExplorer.tsx` or any tab component — only the shared `GridExplorerUI` primitives
(`GridCardFooter`, `GridProvenanceTag`), which is what tabs themselves do. Nothing under
`public/data`, `middleware.ts`, tier gating or ingestion was touched.

## 2. What the archive could support — and the framing it forced

**Supported, and shipped:** the full daily chain 2026-06-21 → 2026-08-31 with zero missing
files — Petrobangla national gas + R-LNG (gas-day anchored under L1), PGCB gas-to-power,
fuel-wise generation, demand, unserved, cost, and the complete NLDC hourly layer (2,299
rows/series, no thin days, no null shed). One window is unresolvable inside that: energy day
**2026-06-21** has no gas document whose window starts on it (the file named for it covers the
06-20 window — the file-keying flip boundary), so every Petrobangla series carries 29/30
baseline days and the page's formula line says so. The system caught this on its own — the
loader refused the mis-windowed file exactly as designed.

**Not supported, and therefore not on the page:**

1. **"FSRU outage" as a fact.** No document in the archive names one. Petrobangla prints a
   single aggregated "R-LNG Terminal" row, capacity 1,100 MMCFD unchanged all window. The page
   is titled and framed on what the documents show — an R-LNG supply collapse — and its header
   comment says so for the next editor. If Hamim wants the FSRU attribution it needs a source
   document (a Petrobangla/RPGCL notice, a BERC filing, press release) archived first.
2. **A causal claim of any kind.** June 2026 falsifies "gas fell ⇒ shedding began" from inside
   the archive (62.3 GWh unserved on 06-28 at full gas). The chain is a reading order; the
   methodology block says so explicitly.
3. **A gas-shortage outage *count*.** Most "gas" strings in the outage log are SF6 breaker gas.
   The page quotes the three plant rows whose reasons name the gas supply (Sirajganj ×2 07-22,
   JERA Meghnaghat 07-23, Unique Meghnaghat 08-14), verbatim, with a `reasonMustMatch` guard so
   a republished day drops a row rather than misquoting it.
4. **PGCB monthly context** — 2026-07/08 monthly files are not yet in the archive.

**Absences carried, not filled:** the twelve June days with no workbook hourly sheet (null
unserved/demand) are why the baseline starts 06-21; if a series misses days, the card prints
"X filed N of M days" and the chart breaks. Source self-disagreements in the window
(hourly-balance identity breaks up to 169 MW, the 06-20 gas PDF total-vs-rows 3.3 MMCFD, NLDC
vs workbook hourly shed) are reported in the methodology block, repaired nowhere.

## 3. Two decisions Hamim should ratify

1. **Daily headline series over tier-locked days are rendered publicly.** The per-day archive
   pages (`archive-day.server.ts`) already publish these headline figures publicly for every
   day — this page adds a curated 72-day editorial view of the same altitude (plus the R-LNG
   subtotal and P1 gas-to-power cell, which are headline-level lines of gated files). No
   per-plant, per-zone, hourly-curve or gas-field detail is exposed. If that still reads as a
   leak, the page can go behind the member tier with one `canAccessPath` entry — say the word.
2. **The hourly panel honours the plan window.** It uses the tier-clamped
   `/api/grid/history/series` and shows the restriction in the API's own words, so a visitor
   sees the recent slice and a labelled restriction, not a blank. The alternative — serving the
   window's hours from the page server-side — would be the split-data unlock the gate's history
   warns about, so it was not done.

## 4. Test results

`npx vitest run lib/test/event-study.test.ts` — **15/15 pass**. Full suite: **66 files,
681 tests, all passing**. `tsc --noEmit` clean; `npm run lint` 0 errors (pre-existing warnings
elsewhere, none in the new files).

Doctrine tests included: a real null day (2026-06-02) yields null points, null means, null
delta and a `Figure` awaiting PGCB — never 0; a mean over {10, null} is 10, not 5; a card
pairing MMCFD with GWh throws; a card pairing Petrobangla's 08:00→08:00 with PGCB's
00:00→24:00 throws (16/24-hour overlap); the break-day figures (621.6 / 858.41 / 121.2)
round-trip from the real archive; the JERA quote must equal `"due to gas shortage."` verbatim.

## 5. What a second event study needs (making this a template)

The engine is already event-agnostic: `buildEventStudy(days, window, baseline)` takes any
ranges, and `loadGasCrisisStudy(window, baseline)` is parameterised — the crisis constants are
two exported `DateRange`s. To do this again for a different window (a cold-wave demand event,
a cyclone, an interconnector trip):

1. **A Phase-1 pass first, always.** The evidence decides the framing (this study's title
   changed because of it). Reuse `scratchpad/phase1_scan.py`'s approach: scan the window,
   find the break per series, search every text field for the assumed cause, list the gaps.
2. **Series registry additions** if the event needs other quantities (imports, zone demand):
   one entry in `EVENT_STUDY_SERIES` with publisher/unit/alignment/provenance and a `pick`;
   the card grouping is then `comparable()`-checked automatically. Zone-level anything stops
   at PGCB's nine zones — the ground-truth ceiling stands.
3. **A per-event curated quote list** (`GAS_SUPPLY_OUTAGE_KEYS`-style) — the one part that is
   irreducibly editorial and must be re-read from the log, never regexed into a series.
4. **A route** `app/(public)/analysis/<event>/page.tsx` reusing the same two client
   components; the chart and hourly panel take props, not constants.
5. **Worth building when a second study exists:** an `/analysis` index page (the breadcrumb
   deliberately claims two levels today because no index exists), and lifting the per-page
   hero/methodology into a shared layout. Premature now.

## 6. Known limits / follow-ups

- **Not visually inspected.** The page compiles, type-checks and is test-covered, but I have
  not seen it rendered — same caveat the strategic audit gives its §C. Open
  `/analysis/gas-crisis-2026` in dev and look, especially at mobile widths and dark mode.
- The navbar hub now has four links; `public-nav-bar__hub-link--analysis` has no bespoke
  accent CSS yet (base hub styling applies). Cosmetic.
- The delta tiles show window-vs-baseline means; a reader may want the per-leg means
  (Jul 21–Aug 5 vs Aug 6–14) — the engine supports any ranges if that is wanted.
- `avgCost` is in the registry (marked D, formula stated) but not charted; the cost card shows
  the published total instead. Deliberate: one derived series fewer on a first analysis page.
