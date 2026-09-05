# Grid Explorer — Time Machine

**Proposal, 2026-09-05. Not implemented. For review.**

---

## What this is, and why it is the right first feature

Drag a handle along eleven years and watch Bangladesh's grid move. Pick 20:00 on any evening back
to April 2015 and see what the system was doing — generation by fuel, the four interconnectors,
and from April 2026 demand and load shedding beside it.

It is the right first capability for one reason: **it needs no data ESB does not already hold.**
103,331 hourly observations are in the database now, each naming the document it came from. Every
other candidate in the four-product thesis — maps, dossiers, the consumer app — is a data
acquisition project wearing a UI costume. This is the one that is purely a matter of building.

It is also the feature that makes the archive *visible*. Today ESB's best asset is invisible: a
reader sees one day at a time and has no way to perceive that eleven years sit behind it.

---

## Prerequisites — three, all from the correction work

**These are not optional and none is yet implemented.** Each was established by
`CORRECTION_REPORT_2026-09-05.md`.

| # | Prerequisite | Why the feature is wrong without it |
|---|---|---|
| 1 | **`observationKind`** (REGULAR / DAY_PEAK / EVENING_PEAK / UNCLASSIFIED) | 6,535 peak stamps sit at `:00` and 3,899 `:30` rows are regular. Averaging kinds together biases every historical mean **+35 to +71 MW**, systematically upward. |
| 2 | **Stored plausibility flag** (persisted `reconciles`) | One NLDC typo (`64526500` on 2023-01-15) moves the January 2023 monthly mean from ~8,900 to **91,349 MW**. The check exists in the live snapshot and is not stored, so the archive cannot filter on it. |
| 3 | **`DerivedSum { value, of, outOf }`** | Import totals are `PARTIAL` for most of the archive. A partial sum rendered as a total understates it silently. |

Prerequisites 1 and 2 are one migration together. 3 is a read-time type, no migration.

---

## Data model — canonical vs derived

The layering from the audit (§S) holds, and the Time Machine is the first surface to make it visible.

```
EVIDENCE     SourceDocument.rawGzip          the page as served
   |
CANONICAL    GridHourlyObservation           what NLDC printed, per hour
   |
DERIVED      hourly → daily → monthly        computed, never stored as canonical
```

**Canonical is hourly and is never resampled.** Daily and monthly are derived, computed on demand,
cached, and labelled. There is no "daily table" that could drift from the hours beneath it.

Every figure the UI renders carries one of four states:

| state | meaning | source |
|---|---|---|
| **REPORTED** | the publisher printed this figure | canonical row, `basis = REPORTED` |
| **DERIVED** | ESB computed it from reported figures | any aggregate, any sum |
| **ESTIMATED** | modelled where no figure exists | **nothing today** — reserved, never inferred |
| **MISSING** | no figure, and we say who owes it | `NULL`, or a gap in the series |

`ESTIMATED` has no producer in this design. It exists so that if a forecast or model is added later
it cannot be mistaken for a reading. Nothing in the Time Machine may emit it.

---

## Aggregation semantics

Fixed before the API is designed, per the correction report.

**Hourly (canonical):** returned as stored. `NULL` is `MISSING`, never zero.

**Daily (derived):**
- Means, sums and distributions use **`REGULAR` rows only**.
- Maxima may draw on **all kinds** — the peak stamp exists to record a value no hourly reading caught.
- Rows failing the plausibility flag are **excluded and counted**, never altered.
- Coverage travels with the figure: `regularObserved / regularExpected`, where expected derives
  from observed `REGULAR` hours, **not** from 24 × days.

**Monthly (derived):** the same, over days, and a month reports the days it rests on.

**No interpolation, ever.** Not linear, not carry-forward, not seasonal. A period below the coverage
floor is reported as insufficient rather than estimated.

**Worked example — the 517-hour gap, 2017-01-18 → 2017-02-08:**

- Daily: 21 days return `MISSING`, not zero and not a flat line.
- Monthly: February 2017 returns `{ value: …, coverage: { days: 20, of: 28 }, sufficient: false }`
  and the UI shows the mean struck through with "20 of 28 days". January 2017 likewise.
- The chart draws **a break in the line**, not a straight segment across it. A continuous line
  across a three-week outage is a fabricated claim, and it is the single most likely way this
  feature could lie.

---

## API design

Three read endpoints, additive, alongside the existing `/api/data/*`.

```
GET /api/grid/history/hours?from=&to=&fields=&kind=
    canonical rows, max 8,760 (one year). No aggregation, no resampling.

GET /api/grid/history/series?from=&to=&resolution=hour|day|month&metric=&agg=mean|max|min
    derived. Every point: { t, value, state, coverage }

GET /api/grid/history/at?t=2026-09-04T20:00
    one instant: all metrics, each with state and provenance
```

Every response carries provenance:

```jsonc
{
  "resolution": "day",
  "aggregation": "mean",
  "basis": "DERIVED",
  "rules": { "kinds": ["REGULAR"], "excluded": { "implausible": 1 } },
  "points": [
    { "t": "2017-02-01", "value": null, "state": "MISSING",
      "coverage": { "observed": 0, "expected": 24 } },
    { "t": "2017-02-09", "value": 6218.4, "state": "DERIVED",
      "coverage": { "observed": 24, "expected": 24 } }
  ],
  "sources": [{ "publisher": "PGCB", "document": "view_generations_bn?page=1451", "sha256": "…" }]
}
```

**Tier gating** reuses `feed-paths.ts` and `daily-access.ts` unchanged. History is exactly what the
tier exists to sell, so `/api/grid/history/*` registers there and inherits the 7-day public window,
the bot gate and the same-origin check. **It must be added to the default-closed pattern, not to a
roster** — that list has gone stale four times.

---

## Performance and caching

| layer | strategy |
|---|---|
| hourly, recent | `unstable_cache`, 600 s — matches `RELEASE_CACHE_SECONDS` |
| hourly, historical | immutable — a closed hour never changes; `s-maxage=31536000` |
| daily / monthly derived | materialised on request, cached 24 h, keyed by `(metric, agg, from, to, rulesVersion)` |
| chart payload | pre-thinned server-side — never ship 103,331 points to a phone |

`rulesVersion` in the cache key is load-bearing: when the aggregation rules change, every derived
figure must invalidate. Without it a rule change silently serves figures computed under the old one.

**Thinning is a display concern and must be stated.** A decade at hourly resolution cannot render
honestly on a 390 px screen. The server returns min/max envelopes per bucket rather than sampled
points, so a spike is never dropped, and the response says the series was thinned.

**Egress.** The audit's §3 finding applies: this is a new family of large responses. Historical
hours are immutable and CDN-cacheable, which is the whole reason to separate them from recent hours
in the cache policy.

---

## UX

### Timeline

A scrubber under the existing header, not a new page. Three zoom levels — decade / year / day —
with the day view showing the 24 hours plus peak stamps as distinct marks.

**Gaps are drawn.** Missing periods are visibly hatched on the scrubber itself, so the reader sees
that 2017 has a hole before they scrub into it.

### The four states, visually

| state | treatment |
|---|---|
| **REPORTED** | solid line, full-weight type, `P` mark |
| **DERIVED** | solid line, `D` mark, aggregation named on hover ("mean of 24 regular hours") |
| **ESTIMATED** | dashed, reduced weight — no producer today |
| **MISSING** | **a break in the line**, hatched band, "—" with the owing publisher |

This extends the existing `GridProvenanceTag` (`P`/`D`) rather than inventing a vocabulary — the
component already exists and is already understood by readers of the current tabs.

### Compare mode

Two instants side by side — "20:00 today vs 20:00 a year ago" — as a **delta column**, not two
charts. Comparison must refuse when either side is `MISSING`; a delta against absent data is the
kind of quiet fabrication this codebase exists to prevent.

### Mobile

Scrubbing is the whole interaction and must work with a thumb. Drag to scrub, pinch to zoom,
long-press to pin an instant. Values update on a 60 ms debounce against a pre-fetched window, so
scrubbing never waits on the network. The existing breakpoints stop at `lg:` — the timeline is the
first component that should use the wide screen properly.

---

## Reuse, change, and leave alone

### Reuse unchanged
- `GridProvenanceTag`, `GridCardFooter`, `GridSourceFiles`, `GridKpiTooltipRow` — the provenance vocabulary
- `LoadCurveCanvas` — already renders a 24-hour curve; the day view is that component with a different source
- `chart-palette` and its discipline test
- `feed-paths.ts` / `daily-access.ts` for gating
- `Figure` (`lib/data/grid/figure.ts`) — the known/awaiting primitive is exactly the REPORTED/MISSING split, and is currently used in one place. This feature should be its second.

### Must change
- **`GridHourlyObservation`** — `observationKind` + plausibility flag (one migration)
- **`lib/grid-explorer-views.ts`** — one new view; the tab list is the registration point
- **`daily-access.ts`** — register the history routes in the default-closed pattern
- **A derived-aggregation module** — new, and the only place aggregation rules may live

### Leave untouched
- The ingest chain, watcher and Pi runner — settled and working
- `public/data/**` and `DataRelease` — the Time Machine reads the hourly table, not the day files
- The eight existing tabs — this is a ninth view, not a redesign
- `archive-fallback.ts` — generated

---

## Risks

| risk | severity | mitigation |
|---|---|---|
| **A continuous line drawn across the 2017 gap** | **highest** | breaks are structural in the series type, not a rendering option; a test asserts a `MISSING` point cannot join |
| Peak stamps averaged into means | high | prerequisite 1; a test pins the +35…+71 MW bias |
| The `64526500` row entering an aggregate | high | prerequisite 2; excluded and counted, never altered |
| Partial import sums shown as totals | medium | prerequisite 3 |
| Egress from a new large-payload family | medium | immutable history CDN-cached; server-side thinning |
| Tier bypass on a new route family | medium | default-closed registration + the existing regression test |
| Scope creep into a map | medium | explicitly out of scope; §W showed OSM cannot even quantify what it draws |
| The archive stops growing while this is built | **high** | the watcher is autonomous and must not be paused for feature work |

---

## Sequence

1. **Prerequisites** — migration for `observationKind` + plausibility; backfill both from `rawGzip`, no refetch; `DerivedSum`.
2. **Aggregation module + tests** — rules first, with the 2017 gap and the 2023 typo as fixtures. No UI.
3. **API** — three endpoints, gated, cached, provenance in every response.
4. **Day view** — reuse `LoadCurveCanvas` against the hourly table. Smallest useful surface.
5. **Timeline scrubber** — decade/year/day, gaps drawn.
6. **Compare mode** — last, because it is the easiest to make dishonest.

Steps 1–2 are where the correctness lives and should be reviewed hardest; by step 4 the hard
decisions are already made.

---

## What would make me withdraw this

- If review finds the prerequisites too costly, **do not build a partial version.** A Time Machine
  that averages peaks into means and interpolates across 2017 is worse than none — it would put
  ESB's name on figures the archive does not support, which is the one thing the doctrine forbids.
- If the archive's growth stalls to build it, stop. The feature is worth less than the asset.
