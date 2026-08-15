# Grid Explorer — mobile optimization

Optimize the Grid Explorer for mobile, charts and graphs first. Most of them
were sized against a desktop window and are still on fixed pixel heights; on a
phone the chrome eats the data. Fix that properly — not by hiding things.

Desktop must come out unchanged or better. Never worse.

## The actual state, measured 2026-08-15

An earlier pass converted a minority of charts to container-driven sizing. The
rest were never touched. Verified counts in Grid Explorer scope:

- **57 `ResponsiveContainer`s across 11 files**
- **23** use `grid-explorer-chart-area`; **9** use a `--h-*` height class
- **22** still use inline `height={NNN}`; **27** sit in fixed `h-[400px]`-style
  wrappers
- **2 files** use the `chart-axis.ts` tick convention
- **32** hand-set `margin={}` props — there is no shared default
- **47 `yAxisId`** across 6 files — dual axes are a pattern, not one chart
- **51 `<table>` in `components/news`, 4 converted** to `--stack`

**Re-run these counts yourself before starting** and tell me if they have
drifted. Use the same commands so the numbers are comparable:

```bash
grep -rc ResponsiveContainer --include=*.tsx components/news | grep -v ':0'
grep -rn "grid-explorer-chart-area" --include=*.tsx components/news | wc -l
grep -rno "grid-explorer-chart-area--h-[a-z]*" --include=*.tsx components/news | wc -l
grep -rn "height={[0-9]" --include=*.tsx components/news | wc -l
grep -rEn "h-\[[0-9]+px\]" --include=*.tsx components/news | wc -l
grep -rFn "margin={" --include=*.tsx components/news | wc -l
grep -rn "yAxisId" --include=*.tsx components/news | wc -l
grep -rFo "<table" --include=*.tsx components/news | wc -l
grep -rno "grid-explorer-table--stack[a-z-]*" --include=*.tsx components/news | wc -l
```

Then work outward from the ~34 charts that were **never converted** — that is
where the mobile damage actually is. Do not spend the session polishing the 23
that already work.

The chart files, by count: `PowerGridExplorer.tsx` (29), `RenewablesTab.tsx`,
`EnergyCurveChart.tsx`, `GasReserveDepletionTab.tsx`, the four
`petrobangla-archive/*` panels and the two `petrobangla-live/*` panels (3 each),
plus the shared wrapper `PowerGridChartUI.tsx`.

**Out of scope — do not touch:** `components/admin/AdminAnalyticsCharts.tsx`
(9 charts) and `app/(public)/annual-reports/financials/FinancialsClient.tsx`
(5 charts). They contain `ResponsiveContainer` but are not the Grid Explorer.

## Read before you touch anything

- `AGENTS.md` — this is not the Next.js you know. Read the relevant guide under
  `node_modules/next/dist/docs/` before writing code.
- Project memory: `grid-explorer-mobile-overhaul`, `testing-mobile-layout`,
  `verify-mobile-fixes-before-reporting`.
- `app/globals.css` from ~line 7240 (the `grid-explorer-*` layer — read the
  comments, they explain the architecture and its traps),
  `components/news/PowerGridChartUI.tsx`, and the chart files listed above.

## What "done" means

- No horizontal page scroll at any width from 320px up. Ever.
- Every **cartesian** chart's plotted area is **at least 72% of its card width**
  at 393px. The floor applies to charts with axes. Pie charts (3) and any
  axis-less KPI/sparkline chart are exempt — for those the test is legible
  labels, no clipped slices, and a tappable legend. State which exemption you
  applied and why; never quietly exempt a chart that does have axes.
- No overlapping, wrapped or unreadable axis labels at 393px.
- Every interactive target ≥44px; every tooltip reachable by tap. Hover-only is
  broken on a phone, not degraded.
- Nothing illegible without pinch-zoom.
- It looks deliberate — level with the rest of the site, in the site's own
  vocabulary, not a mobile stylesheet bolted on.

**About the 72%.** Only one chart has ever been measured: the 24-hour load
curve, which reached 68% after margin and axis trimming alone. The other ~56 are
unmeasured and some will be far worse. 72% is reachable, but the last points
come from structure, not more trimming. If a chart cannot get there without
changing what it *claims* — a dropped axis, a merged series, a new denominator —
**stop and report it with the measurement instead of forcing it.** A chart that
hits 72% by quietly showing less has failed this brief.

## Hard constraints

1. **No data loss at any width.** Never drop a series, row, column, fuel, zone
   or tooltip field to make something fit. Reflow, stack, make it swipeable, or
   put it behind a visible labelled control. Visible on desktop but unreachable
   on a phone is a bug, not an optimization.
2. **Never silently reduce.** Any bucketing or truncation must be user-visible
   and reversible.
3. **Colours come from `lib/data/grid/chart-palette.ts` only.** Fuel names have
   aliases (`HSD` vs `HSD (Diesel)`) — canonicalize, never key raw.
4. **Provenance survives.** `P` / `D` / `†` stay visible wherever they are now.
5. **No new dependencies.** No chart library swap.
6. **Preserve desktop.** Screenshot the affected tab at desktop width before and
   after every change.
7. Tests and typecheck pass at every commit.

### The data-integrity gate

Constraint 1 must be *proved*, not asserted. For every card you touch, count
before and after, in the 393px iframe, and put the numbers in your report:

- series/columns rendered (including zero-value ones — a fuel with no output
  must still be named somewhere),
- rows rendered,
- fields present in the tooltip,
- legend entries.

Any figure that drops is a defect unless the value moved somewhere else you can
point to. This is how the zone × fuel stack was verified previously: visible
fuels plus the "No output" names summed to 8 columns and all 10 rows survived.

## The architecture to work within

Cards are containers (`container-type: inline-size; container-name: gridcard`)
and their contents size in `cqi`, not `vw`. The same card is 343px on a phone,
~470px in a three-column desktop grid and ~1430px full width — simultaneously. A
viewport query is right for one and wrong for the rest. Use
`@container gridcard (max-width: …)` for anything inside a card.

Two traps, both documented in `globals.css` — read those comments:

- **A container cannot size itself.** `cqi` on the card resolves against an
  ancestor container, or the viewport when there is none, so the card's own
  padding still needs a viewport query.
- **Cascade order at equal specificity.** Height utilities must stay declared
  *below* the classes that also set height. When a rule appears to do nothing,
  check declaration order first.

## Build the shared layer before editing 57 charts

There is no central chart margin — 32 hand-set props — and only 2 files use the
tick convention. Editing each chart individually will produce 57 inconsistent
results and an unreviewable diff.

**First** extend the shared layer: a default margin set, the `chart-axis.ts`
convention applied by default, and the `--h-*` container heights. **Then** move
charts onto it in small batches, deleting the fixed `h-[NNNpx]` wrapper and the
inline `height={}` as you go. Report how many charts each batch converts.

## How to verify — not optional

`resize_window` reports success and does nothing here; `window.innerWidth` stays
at desktop. Shrinking a single element is worse than useless — Tailwind's `md:`
/`lg:` and every `@media` rule still resolve as desktop.

Use a **393px iframe**, which has its own viewport:

```js
const f = document.createElement('iframe');
f.id = 'phonesim';
f.style.cssText = 'position:fixed;top:0;left:0;width:393px;height:1290px;'
  + 'border:0;z-index:2147483647;background:#fff;'
  + 'transform:scale(1.95);transform-origin:top left';
f.src = 'http://localhost:3000/grid-explorer?tab=overview';
document.body.appendChild(f);
```

Scale is for screenshot legibility only — the frame's viewport stays 393px. Same
origin, so `f.contentDocument` is measurable. Rebuild the frame rather than
calling `reload()`; allow ~6.5s for hydration and for Recharts to settle. Check
320px and 430px too, and all 10 tabs — not just Overview.

Never report a fix you have not measured. Quote the number that changed.

## Per-chart brief

- **Chrome vs data.** Axes, margins and category padding are negotiable; the
  plot is not. Compact the y-axis (`1.2k`), lift units out of rotated axis
  labels into a caption, trim margins to single digits.
- **Tick density by rule.** `minTickGap` + `interval="preserveStartEnd"` so
  ticks thin themselves. Time axes land on whole hours — never `0:00:02`.
- **Legends are mostly custom markup here, not Recharts `<Legend>`** (one real
  site, in `PowerGridChartUI.tsx`). Fix them where they are rendered. Below the
  chart, centred, wrapped. Three or fewer series: prefer direct labelling and
  drop the legend. Many series: a scrollable chip row with an edge fade, and
  make the chips toggle series so the legend earns its space.
- **Double-counted space.** A top legend plus a top margin reserves the same
  band twice; this has bitten this codebase before.
- **Aspect ratio.** Phones are portrait — charts should be relatively taller
  than on desktop. Drive height from `cqi` with a floor.
- **Touch.** Tap-to-pin tooltips, generous hit areas, no hover dependency, no
  tooltip overflowing the card.
- **Genuinely wide data** (zone × fuel) may scroll inside its own card, with a
  visible affordance, edge fade and snap. The page never scrolls.

Tables: continue the `grid-explorer-table--stack` conversion — **47 of 51
remain**. Add `data-label` per cell. Thresholds are measured: 40rem normal,
58rem for the zone × fuel matrix (min-content 862px).

## Bring these to me — do not decide them yourself

- **Dual axes — raise in your first pass, not at the end.** There are 47
  `yAxisId` across 6 files, so this is a policy, not one chart. On the 24-hour
  load curve the second scale costs 42px of a 326px width, most of the gap
  between 68% and 72%. Measure it, then bring the options costed in pixels —
  keep, express the secondary series as a share on the existing scale, or split
  it into its own small chart. Removing an axis changes what a chart *claims*,
  so it is my call. Keep working on other charts while you wait, and do not
  apply my answer beyond the chart I answered for until I say it generalizes.
- **Any other change to what a chart asserts** — re-based axis, changed
  denominator, merged series.
- **Regrouping the tabs.** Editorial, already half-decided.

## This is multi-session work — leave a trail

57 charts and 47 tables will not fit in one context window. Keep
`docs/mobile-optimization-progress.md` in the repo, committed with each batch:

- the count table above, re-measured, with today's figures;
- every chart converted so far — file, chart, before → after plot ratio;
- what is left, in the order you intend to take it;
- open questions waiting on me, and any answer I have already given;
- anything you tried that did not work, so the next session does not retry it.

Update it **before** you run low on context, not after. When resuming, read it
first and re-measure the counts before trusting them.

## Working method

Small reviewable commits, shared layer first, then batches. No sweeping rewrite:
`PowerGridExplorer.tsx` alone is 9,011 lines and a broad diff cannot be reviewed
or reverted cleanly. After each commit: tests, typecheck, phone screenshot,
desktop screenshot.

## Report back as a table

Per chart: file, card width, plot width before → after, plot ratio before →
after, clears 72% yes/no, axis labels colliding yes/no, data-integrity counts
before → after, what changed. Numbers, not adjectives. Name every chart that
fell short and why. Close with the converted-count delta (e.g. "23 → 41 of 57")
and what you deliberately left alone.
