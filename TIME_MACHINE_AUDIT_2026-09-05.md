# Time Machine — post-launch semantics & product audit

**2026-09-05.** Three narrow corrections made; four items reported without change.
Verified against the production database and the running dev server.

---

## 0. W: drive — what is actually there

W: is mounted on this PC and holds the real archive (39,860 files under `Grid-Explorer`).
The note in project memory calling W: a Steam volume applies to the *other* machine.

| store | files | note |
|---|---|---|
| BPDB | 14,357 | Annual Reports · **Area Wise Demand Backlog** · **Daily Generation Backlog** · daily-max-generation |
| bd-grid-backlog | 9,623 | the validation tree |
| Petrobangla | 6,928 | Annual · Audit · **Daily Gas Reports - D** · MIS |
| Titas | 4,496 | — |
| PGCB | 3,652 | incl. **Daily Reports - D: 2,177 workbooks** |

**The finding that matters:** `BPDB/Daily Generation Backlog/JSONs` holds **5,663 files,
2010-12-26 → 2026-06-27, of which 5,593 carry region data** — nearly sixteen years of BPDB daily
generation, already fetched and parsed. `Area Wise Demand Backlog` adds **5,649** zone-level demand
and load-shed files back to 2012.

The strategic audit ranked BPDB daily generation "NOT STARTED, very high transformation cost". It
is in fact **already collected**. That materially changes its position in the archival priority
list.

Two cautions before anyone acts on it, both visible in a two-file sample:

- `01-01-2011.json` carries `"verified": true, "match_percentage": 100.0` with `"regions": {}` — an
  empty file asserting it verified. A flag that says "verified" over no data is worse than no flag.
- `Area Wise Demand Backlog/01-01-2012.json` carries real data (9 zones, Dhaka 2,380 MW) with
  `"verified": false` and `"Sum mismatch: … (website reported 0)"`.

So the backlog needs its own fidelity pass before ingestion. **Not started, per scope.**

---

## 1. Access limits were being reported as missing data — CORRECTED

**The defect.** An anonymous request for 2015 was clamped to the seven-day window, and the
truncated month returned:

```
2026-08   state: MISSING   coverage: 92/744
```

That reads as *"ESB does not hold August 2026."* ESB holds every hour of it. The archive was
reporting its own paywall as an absence of data — about the one thing it sells.

**The correction.** `RESTRICTED` is now a distinct state:

- **MISSING** — ESB queried a range it was allowed to query and does not hold enough observations.
- **RESTRICTED** — the archive holds the period; entitlement stopped us asking. It says nothing
  about coverage.

Every response now carries both ranges and the reason:

```json
"restriction": {
  "requested": { "from": "2026-06-01", "to": "2026-09-04" },
  "effective": { "from": "2026-08-29", "to": "2026-09-04" },
  "restricted": true, "reason": "tier", "tier": "visitor"
}
```

A range wholly outside entitlement now returns **403 with both ranges**, not empty data. The
entitlement window is part of the cache key, so a visitor's clamped answer can never be served to
a subscriber.

**Verified live**, and the distinction works in both directions:

```
2026-06  RESTRICTED     2026-07  RESTRICTED     2026-08  RESTRICTED
2026-09  MISSING     ← genuinely incomplete INSIDE the allowed window
```

A period only *partly* inside the window is also `RESTRICTED`, deliberately: reporting a mean of
seven visible days as "August" would be a smaller lie than a missing month, but a lie in the
direction of overstating what we know.

**UI truthfulness.** It was not truthful, and now is. The banner previously said the range "has
been left out"; it now leads with *"The archive holds this period"* and distinguishes
`Missing from the archive` from `Outside your plan — held, but not queried` in the summary, legend
and tooltip.

---

## 2. The public history limit — reported, not changed

**The existing reason.** `GRID_TIER_LIMITS` (`grid-tier-access.ts:16`) is an explicit, priced
ladder with human-readable labels and descriptions:

| tier | window | description in code |
|---|---|---|
| visitor | 7 days (`daysBack: 6`) | "Last 7 days — no account required." |
| member | 30 days | "Last 30 days of grid data with a free account." |
| plan_499 | 5 years | "Five years of historical grid reports (৳499/month)." |
| plan_999 | full | "Complete PGCB grid data backlog (৳999/month)." |

**Verdict: a deliberate business decision, not inherited architecture, not a performance guard, not
accidental coupling.** Prices are in the strings. There is no performance justification anywhere
near it, and the query cost of a decade at monthly resolution is trivial.

**The product case for opening the full range, and against.**

The strategic audit established that the archive is ESB's only real moat, and that its value is
*being the place people go*. A seven-day window means an anonymous visitor — a journalist checking
a claim, a researcher arriving from a search result — cannot see that eleven years exist. The asset
is invisible to exactly the people whose habit would make it valuable.

Against opening it: the 5-year and full-archive tiers are the two priced products, and history
*is* the thing being sold. Giving away the range gives away the ladder.

**What I would put to you — as an option, not a recommendation to act on:** the two are separable.
The *range* is what makes ESB the default destination; the *analytical capability over that range*
is what a professional pays for. Opening read-only exploration at day and month resolution while
charging for hourly resolution, exports, the API, saved views, compare mode and alerting would keep
every paid capability intact and remove the thing that currently hides the moat.

Two facts support that shape. **Nobody else has the archive** — a 2030 competitor cannot rebuild
it, so the range is not the defensible part; the accumulation is. And the register's own finding
that the 5-year tier exists tells you the ladder already assumes people will pay for depth *of
capability*, since 5 years already covers most journalistic need.

**No change made.** This is a pricing decision and it is yours.

---

## 3. Metric-specific eligibility — CORRECTED (a real bug)

Eligibility was **row-level and metric-blind**. Both exclusions destroyed good data:

| exclusion | condemned | but also destroyed |
|---|---|---|
| `TOTAL_DISAGREES_WITH_COMPONENTS` | the printed total | **370 hours of valid gas, coal, hydro** — the very components that convicted the total |
| `BREAKDOWN_ALL_ZERO` | the all-zero breakdown | **24 valid totals from 2015** — the earliest data the archive holds |

`isEligibleForMetric(excluded, metric)` now decides per metric. Proven by test:

- `TOTAL_DISAGREES` row → `totalMw` is null and counted; `gasMw` returns **5,910**, `coalMw` **1,349**.
- `BREAKDOWN_ALL_ZERO` row → `totalMw` returns **5,862**; `gasMw` is null and counted.

Exclusions are also **counted only against the metric they actually suppressed**, so a gas chart no
longer reports rows set aside that never touched it — which would have been a false statement about
that chart's completeness.

**One earlier golden test asserted the opposite and was wrong.** It checked that a
`BREAKDOWN_ALL_ZERO` row is dropped from a *total* aggregate, encoding the bug. Corrected, with a
comment saying so.

**Other generic-flag code paths:** none. `excluded` is read in exactly two places — the aggregator
(now metric-specific) and the ingester that writes it. The API and UI never branch on it.

---

## 4. The reconciliation threshold — measured, unchanged

Full archive, rows with ≥1 component reported and a non-zero total:

| band | rows | share | cumulative |
|---|---|---|---|
| 0 – 0.5% | 97,598 | 94.4436% | 94.44% |
| 0.5 – 1% | 1,520 | 1.4709% | 95.91% |
| 1 – 2% | 1,673 | 1.6189% | 97.53% |
| 2 – 5% | 1,543 | 1.4931% | 99.03% |
| 5 – 10% | 415 | 0.4016% | 99.43% |
| 10 – 20% | 197 | 0.1906% | 99.62% |
| 20 – 50% | 166 | 0.1606% | 99.78% |
| > 50% | 228 | 0.2206% | 100% |

**There is no natural break at 20%.** Density declines monotonically and the bands either side of
the line are almost equal — 197 rows below, 166 above. Nothing in the data distinguishes 20% from
15% or 25%.

Finer, the tail is continuous too: 20–30% 75 · 30–50% 91 · 50–90% 116 · 90–99.9% 18 · **≥99.9% 94**.

**Conclusion: 20% is a policy constant, not an empirical boundary — and it should be documented as
one rather than defended as a discovered threshold.** The only genuine cluster is at the extreme
(94 rows ≥99.9%, the `64526500` class), which any threshold from 20% to 90% would catch.

**Not changed**, per instruction — the evidence does not justify moving it. For calibration: 10%
would exclude 591 rows (0.57%), the current 20% excludes 394 (0.38%), 50% would exclude 228 (0.22%).

---

## 5. Deep-link state — one bug CORRECTED, the rest proposed

**The bug.** `GridExplorerTab` was widened with `timemachine`; `TAB_IDS` in `grid-explorer-url.ts`
was not. `parseGridExplorerTab('timemachine')` returned null, so **`?tab=timemachine` silently
opened Overview**. Nothing threw, no test failed, and the link looked like it worked.

Fixed, and pinned: a test now asserts every member of the union parses, so widening one list
without the other fails loudly. `buildGridExplorerQuery` had no coverage at all and now has
round-trip and default-omission cases.

**What already exists.** `readGridExplorerUrlBoot` / `buildGridExplorerQuery` handle `tab`, `date`
and `macro`, and deliberately omit defaults so the canonical URL stays bare.

**What is not yet representable**, and my proposal for it — durable state only:

| param | example | why it belongs |
|---|---|---|
| `metric` | `metric=coalMw` | the subject of the view; a shared link about coal must open on coal |
| `res` | `res=month` | changes what the numbers mean, not just how they look |
| `from` / `to` | `from=2017-01-01&to=2017-03-01` | the range **is** the finding — "look at the 2017 outage" is unshareable without it |
| `vs` | `vs=2024-06-01` | compare anchor, only when compare is active |

**Deliberately excluded as transient:** hover position, tooltip state, loading state, scroll,
selected legend item, chart zoom. None survives a reload meaningfully and all of it would make the
URL unreadable.

`agg` is borderline — it changes meaning, but `mean` is the only aggregation the UI currently
exposes. Add it when a second one ships, not before.

---

## 6. "Then vs Now" — product proposal only

**The idea.** One date against another, same metric, same resolution, rendered as a **delta**
rather than two charts side by side. "20:00 tonight against 20:00 a year ago." Nothing new is
computed — it is two existing series and a subtraction.

**Why it earns its place.** The Time Machine answers *what happened*. Then vs Now answers *what
changed*, which is the question a reader actually arrives with, and it is the natural companion to
an ESB article about a tariff change, a new plant or a bad week of load shedding.

**Semantics it must preserve — all of which already exist and none of which may be relaxed:**

1. **A delta against `MISSING` is refused, not zero.** If either side is absent the comparison
   returns `MISSING` and says which side. A difference computed against absent data is fabrication,
   and it is the single most likely way this feature would lie.
2. **A delta against `RESTRICTED` is refused separately**, and says so — "your plan does not reach
   June 2024" is a different sentence from "we have no data for June 2024", and item 1 exists
   precisely so the UI can tell them apart.
3. **Schema eras are surfaced, not silently crossed.** Comparing 2016 with 2026 on `adaniMw` is
   comparing *nothing reported* with a real figure. The comparison must say "not reported in 2016"
   rather than showing a `+1,165 MW` rise that is an artefact of NLDC starting to publish a column.
   This is the case the whole blank-vs-zero correction was about, and it resurfaces here as a
   product question.
4. **Excluded rows stay excluded on both sides**, with reasons shown for each — and metric-
   specifically, per item 3.
5. **Coverage is shown for both sides.** A month at 20/28 days compared against one at 28/28 is not
   a like-for-like comparison and must not look like one.

**Shape.** A `vs=` date on the existing view; the chart gains a second, muted line; a delta column
lists metric, then, now, change, and — where either side is absent — the reason instead of a
number. Reuses the existing series endpoint twice; **no new aggregation semantics, no new API**.

**Explicitly not in it:** percentage change against a `MISSING` or zero baseline, "records broken"
claims, or any narrative text generated from the delta.

---

## 7. Telemetry — what is measurable, and the minimum worth collecting

**What exists:** an admin analytics system for articles (`/api/analytics`, role-gated) and
`lib/analytics-period.ts`. **No product-event telemetry, and `@vercel/analytics` is not
installed.** So today: **none of the eight items can be measured.**

**Minimum event set** — enough to answer "do people value this", nothing more:

| event | properties | answers |
|---|---|---|
| `time_machine_opened` | `entry` (tab click / deep link) | does anyone find it |
| `time_machine_range_changed` | `resolution`, `span_days` bucketed, `era` (year only) | do they explore, or accept the default |
| `time_machine_metric_changed` | `metric` | is it only ever total generation |
| `time_machine_missing_encountered` | `resolution`, `count` | how often the archive disappoints |
| `time_machine_restricted_encountered` | `tier`, `requested_era` | **the conversion signal** — how often a paywall is hit and from how far back |
| `time_machine_provenance_opened` | `state` | does anyone care where a figure came from |
| `time_machine_error` | `status`, `latency_ms` bucketed | is it reliable |

Seven events. Compare-mode use folds into `range_changed` with a `compare: true` flag when that
ships.

**Privacy shape, and it matters here more than usual.** No user id, no session stitching, no exact
timestamps, no IP retention, no free-text. Dates reduced to **year only** and spans to buckets — a
precise date plus a repeat visit is close to a fingerprint for a small professional audience, and
this audience *is* small and professional. Aggregate counts only; nothing that could reconstruct
one reader's research trail, which for a journalist checking a story is genuinely sensitive.

**The one that decides the feature:** `restricted_encountered` against `opened`. If readers open the
Time Machine and repeatedly hit the seven-day wall reaching for 2017, that is both the strongest
evidence the archive is wanted and the direct input to the item-2 pricing decision. If they open it
once and never change the range, the feature is a curiosity and should not be built on further.

**Not implemented** — this is a recommendation, and adding an analytics dependency is a decision
about third-party data flow that should be made deliberately.

---

## Summary

| item | outcome |
|---|---|
| 1 · access ≠ missing | **corrected** — `RESTRICTED` state, both ranges + reason, UI reworded |
| 2 · public history limit | **reported** — deliberate business decision; separable option put to you |
| 3 · metric-specific eligibility | **corrected** — real bug; 370 component-hours and 24 totals recovered |
| 4 · reconciliation threshold | **measured, unchanged** — policy constant, no distribution break |
| 5 · deep-link state | **corrected** — tab was unlinkable; remaining params proposed |
| 6 · Then vs Now | **proposal only** |
| 7 · telemetry | **recommendation only** — nothing measurable today |

475 tests, `tsc` clean, lint 0 errors. No scope crossed into My Energy, Intelligence, graph, app or
tender work.
