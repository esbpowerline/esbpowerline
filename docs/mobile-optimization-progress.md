# Grid Explorer — mobile optimization progress

Session 1 — 2026-08-15. Measurement pass. **No chart code changed yet**, by
design: the measurement inverted the brief's premise and surfaced a single
policy blocker that is the user's call.

Read `docs/mobile-optimization-brief.md` first, then this file. Re-measure the
counts before trusting them.

---

## 1. The counts, re-measured 2026-08-15

Run from the repo root with Git Bash on PATH
(`export PATH="/c/Program Files/Git/usr/bin:$PATH"`).

| Metric (brief's command) | Brief | Measured | Drift |
|---|---|---|---|
| `ResponsiveContainer` (grep -c, **lines**) | 57 | 57 | — |
| `grid-explorer-chart-area` | 23 | 23 | — |
| `--h-*` height class | 9 | 9 | — |
| `height={[0-9]` | 22 | **16** | −6 |
| `h-[NNNpx]` | 27 | **24** | −3 |
| `margin={` | 32 | 32 | — |
| `yAxisId` | 47 | 47 | — |
| `<table` | 51 | 51 | — |
| `grid-explorer-table--stack` | 4 | 4 | — |

### The 57 is a line count, not a chart count

`grep -c` counts matching *lines*. Each chart contributes an opening **and** a
closing tag, and each file contributes an import line:

```
23 opening tags + 23 closing tags + 10 import lines + 1 other = 57
```

Counting opening tags only:

```bash
grep -rFo "<ResponsiveContainer" --include=*.tsx components/news | wc -l   # 23
```

**There are 23 charts in source, not 57.** (27 render in the DOM — components
such as the reserve panels and field cards render one source container many
times.)

### The "~34 never converted" charts do not exist

21 of the 23 already sit in `grid-explorer-chart-area`. Every one of the 23 uses
`height="100%"` — **zero** inline pixel heights on a `ResponsiveContainer`:

```bash
grep -rn "ResponsiveContainer[^>]*height={[0-9]" --include=*.tsx components/news | wc -l   # 0
```

The two that are not on the primitive are both **axis-less sparklines**, which
the brief exempts:

- `petrobangla-archive/PetrobanglaArchiveFieldCards.tsx:210` — `h-10` (40px)
- `petrobangla-live/pbLiveFieldSnapshot.tsx:55` — `h-6 w-20` in a table cell

### Where the other counts actually point

- **16 `height={N}`** — none on a chart container. They are two fixed
  `<PieChart width={200} height={200}>` (lines 1743, 6729), Recharts
  `<Legend height={36}>`, and `next/image` heights.
- **24 `h-[NNNpx]`** — mostly in files with no charts at all
  (`CoverageArticleLayouts`, `MagazineFlipBook`, `GridTopologyMap`).
- **The shared margin layer already exists.** `GRID_EXPLORER_CHART_MARGIN`
  (`.default`, `.topLegend`, `.dualAxis`) covers 21 of 32 margin props, and
  `GRID_CHART_MARGIN` a further 6. Only ~5 hand-set literals remain.
- `lib/data/grid/chart-axis.ts` exists with `wholeHourTicks`, `TIME_AXIS_PROPS`
  and `axisTickStyle`.

**Consequence:** the brief's plan — build the shared layer, then convert ~34
charts — is largely already done. The remaining gap is not conversion. It is
that 22 of the 23 charts had never been *measured*.

---

## 2. Measured plot ratios at 393px

Method: the 393px iframe from the brief's appendix A2. Plot width =
`.recharts-cartesian-grid` bounding box. Card width = nearest card ancestor.
`pctOfSvg` = plot ÷ chart SVG, which isolates axis chrome from card padding.

Card is **352px** on every tab; chart SVG 300–326px.

| Tab / sub-tab | Chart | y-axes | SVG | Plot | % card | % SVG | ≥72% |
|---|---|---|---|---|---|---|---|
| overview | Daily Generation Mix (pie) | — | — | — | — | — | exempt |
| overview | Daily Fuel & Import Cost | 1 | 326 | 256 | 72.8 | 78.5 | ✅ |
| overview | 24-Hour System Load Curve | 2 | 326 | 246 | 70.0 | 75.5 | ❌ |
| gen | Generation Mix Through the Day | 1 | 326 | 258 | 73.4 | 79.1 | ✅ |
| renewables | Renewable Generation Timeline | 2 | 300 | 176 | **50.1** | 58.7 | ❌ |
| regional | East-West Interconnector Transfer | 1 | 326 | 254 | 72.2 | 77.9 | ✅ |
| macro/overview | Wholesale Tariff vs. Unit Cost | 1 | 326 | 256 | 72.8 | 78.5 | ✅ |
| macro/overview | Gas Supply Transition | 1 | 326 | 267 | 75.9 | 81.9 | ✅ |
| macro/monthly | Energy Fuel Mix (pie) | — | — | — | — | — | exempt |
| macro/monthly | Regional Maximum Peak Supply | 1 | 326 | 256 | 72.8 | 78.5 | ✅ |
| macro/monthly | PGCB 13-Year Growth Trends | 1 | 326 | 264 | 75.1 | 81.0 | ✅ |
| macro/pricing | Macro Pressure Variables | 2 | 326 | 206 | **58.6** | 63.2 | ❌ |
| macro/pricing | Global Fuel Commodity Import Costs | 2 | 326 | 206 | **58.6** | 63.2 | ❌ |
| macro/reports | BPDB Cost, Revenue & Subsidy | 1 | 326 | 256 | 72.8 | 78.5 | ✅ |
| macro/global | Brent Crude vs. Retail Diesel | 2 | 326 | 194 | **55.2** | 59.5 | ❌ |
| macro/global | Global LNG Benchmark vs. Gas Tariff | 2 | 326 | 194 | **55.2** | 59.5 | ❌ |
| macro/global | Solar LCOE vs. Bangladesh Feed-In | 1 | 326 | 264 | 75.1 | 81.0 | ✅ |
| macro/system_loss | Historical System Loss (T&D) | 1 | 326 | 272 | 77.4 | 83.4 | ✅ |
| macro/budget | National Budget vs Capacity & Peak | 2 | 323 | 213 | **60.5** | 65.9 | ❌ |
| macro/budget | Historical Pricing & Tariff | 1 | 323 | 259 | 73.6 | 80.2 | ✅ |
| macro/budget | Network Evolution by Voltage Level | 1 | 323 | 265 | 75.3 | 82.0 | ✅ |
| macro/budget | Cumulative Grid Build-out | 1 | 323 | 265 | 75.3 | 82.0 | ✅ |
| macro/budget | Transmission Expansion Pace | 2 | 323 | 213 | **60.5** | 65.9 | ❌ |
| macro/budget | Long-term Trajectories (Indexed) | 1 | 323 | 259 | 73.6 | 80.2 | ✅ |
| macro/reserves | Depletion — current rate | 2 | 293 | 237 | 67.4 | — | ❌ |
| macro/reserves | Depletion — nested panel 2 | 2 | 265 | 195 | 66.5 | — | ❌ |
| macro/reserves | Depletion — nested panel 3 | 2 | 237 | 167 | 63.0 | — | ❌ |

**Horizontal page scroll: 0px on every tab measured** (`scrollWidth −
clientWidth` at 393px). The brief's first "done" criterion already holds.

Tabs `gas`, `imports`, `transmission`, `plants` render no Recharts chart at
393px — they are table/KPI surfaces. The gas charts live under
**macro → reserves**, not the Gas tab.

### The result: 11 of 21 cartesian charts fail, and the cause is one thing

**Every failing chart has 2 y-axes. Every passing chart has 1.** The
correlation is exact across 21 charts, with no exceptions in either direction.

The cleanest control is macro/budget — six charts, one card, one 323px SVG:

| y-axes | Plot width | % of SVG |
|---|---|---|
| 1 | 259–265px | 80.2–82.0 |
| 2 | 213px | 65.9 |

**The second y-axis costs 46–70px** (46px on budget's 323px SVG, 70px on
global's 326px — the spread is tick-label width). On a 326px canvas that is
14–21 points of plot ratio.

Margin and tick trimming cannot close this. The load curve is the proof: the
earlier pass already trimmed it hard and it reached 68%, now 70% after the
gutter commit — still short, and it is dual-axis. A 46–70px gap does not come
out of margins that are already single-digit.

---

## 3. Open question — blocking, for the user

**The 72% floor is entirely gated by the dual-axis policy.** This is not one
chart; it is 11 charts across 6 files, which is why the brief called it a
policy. Removing an axis changes what a chart claims, so per the brief it is
the user's decision. Options, costed:

| Option | Plot at 393px | Clears 72% | What it changes |
|---|---|---|---|
| Keep both axes | 176–246px (50–70%) | No, none of the 11 | Nothing. 11 charts stay below floor. |
| Drop 2nd axis on phones only (`@container`), keep both on desktop | ~259–265px (74–76%) | Yes | Phone reader loses the second scale's calibration; series still drawn, tooltip unchanged. |
| Express secondary series as a share/index on the primary scale | ~259–265px (74–76%) | Yes | Changes the denominator — a *claim* change at all widths. |
| Split into two stacked small charts | ~265px each (76%) | Yes | Doubles card height; no data lost; strongest on a phone. |

No answer has been applied. Nothing beyond the chart the user answers for
should be changed until they say it generalizes.

---

## 4. What is left, in intended order

1. **Await the dual-axis decision** — unblocks all 11 failing charts.
2. The 3 `macro/reserves` panels also nest cards (card width falls 352 → 293 →
   265 through three levels). Even single-axis they would be tight; the nesting
   is worth attacking regardless of the axis answer.
3. Non-blocked chart work: tap-to-pin tooltips (hover dependence not yet
   audited), 44px hit targets, legend chip rows. **Not yet measured.**
4. The two fixed `<PieChart width={200} height={200}>` — fixed size in a 352px
   card; should be container-driven for the 320px case.
5. Tables: 47 of 51 remain unconverted to `--stack`. This is the one count in
   the brief that held up exactly, and it is genuinely mostly undone.
6. Re-check 320px and 430px. Only 393px measured this session.

---

## 5. Things tried that did not work — do not retry

- **`grep -c ResponsiveContainer` as a chart count.** It counts lines: open tag,
  close tag and import. Use `grep -rFo "<ResponsiveContainer"`.
- **Scrolling the iframe to trigger lazy charts.** Freezes the renderer and
  times out CDP `Runtime.evaluate` at 45s, reproducibly, on the gas tab.
  Unnecessary anyway — charts on an active tab render without scrolling.
- **Keeping a whole tab sweep in one `javascript_tool` call.** ~20s is the safe
  ceiling; three frames at 6.5s each is the practical batch size.
- **`getBoundingClientRect()` / `getBBox()` on `.recharts-yAxis` groups.**
  Returns 0. Count axis *elements* and measure the cartesian grid instead.
- **`querySelector('.recharts-surface')` for the chart SVG.** Recharts legend
  icons carry the same class, so this returns a ~7px icon. Use
  `grid.ownerSVGElement`.
- **`resize_window`** — still a no-op here, as the brief's appendix A2 says.

---

## 6. Converted-count delta

**Charts converted to container sizing: 21 of 23 — unchanged this session**
(the remaining 2 are exempt sparklines). No conversion work was outstanding.

**Charts measured: 1 of 23 → 27 of 27 DOM instances.** That is what this
session produced, and it is what the fix list is built from.

Deliberately left alone: `components/admin/AdminAnalyticsCharts.tsx` and
`app/(public)/annual-reports/financials/FinancialsClient.tsx`, both out of scope
per the brief.
