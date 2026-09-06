# GRID_REQUEST_AUDIT.md

**Branch:** `optimization/cost-control`
**Date:** 2026-09-06
**Status:** Audit only. **No Grid Explorer code changed.** The middleware gate is untouched.

---

## 0. A correction that comes first, because it changes the whole picture

**Every request measurement in `COST_AUDIT.md` and `COST_OPTIMIZATION_REPORT.md` was taken against
the development server, and `next/link` prefetching is disabled in development.** So all of them
systematically missed what turns out to be the largest single source of middleware invocations on
this site.

Measured again against a real production build (`next start`, same browser, same pages):

| Page | Reported before (dev) | **Actual (production)** | of which **prefetch** | data | doc/API |
|---|---|---|---|---|---|
| homepage | 4 | **46** | **44** | 1 | 1 |
| article | 3 | **43** | **41** | 0 | 2 |
| category | 1 | **43** | **42** | 0 | 1 |
| `/articles` | 1 | **61** | **60** | 0 | 1 |
| `/grid-explorer` | 43 | **63** | **43** | 19 | 1 |

**Roughly 90% of middleware invocations on every page are `<Link>` prefetches.** On the Grid
Explorer the data layer is 19 requests, not the 41 I reported — the other 43 are prefetch.

Two claims I made are therefore wrong and are withdrawn:

- *"41 of the Grid Explorer's 43 are the tier gate."* No: 19 are data, 43 are prefetch.
- *"Prefetch — NOT A PROBLEM. Destinations are static, so prefetch hits the CDN."*
  (`COST_AUDIT.md` §2.7.) That is right about bandwidth-to-origin and wrong about cost: **a
  prefetch of a statically-cached page still costs a full middleware invocation**, because
  middleware runs ahead of the edge cache. Phase 9 of your original brief asked me to check exactly
  this, and I answered it from a dev-server measurement that could not see it.

### The prefetch numbers, homepage, production

| | |
|---|---|
| Prefetch requests on one homepage view | **44** |
| Distinct destinations | 25 |
| **Duplicate prefetches** (same URL twice) | **19** |
| **Total prefetched bytes** | **896 KB** (avg 20.4 KB per destination) |

896 KB of RSC payload fetched speculatively — more than the homepage's own content — plus 44
middleware invocations, on every single view. Destinations are the navbar categories, the footer,
and every article card in view.

**This is now the largest identified cost item on the site, and it is not in the Grid Explorer.**
It is also the one I would want to fix next, and it needs its own decision because it trades
against perceived navigation speed.

---

## 1. The Grid Explorer data fan-out, measured

Production build, one cold view of `/grid-explorer`, scrolled to the bottom.

**19 data requests · 571 KB · 4 waves over ~2.4s (plus one lazy request at 30s).**

| Class | URL pattern | N | Total | Avg | First seen | Cacheable? |
|---|---|---|---|---|---|---|
| Unit-cost witness | `/data/grid-verification/unit-cost.json` | 1 | **327.5 KB** | 327.5 KB | 754 ms | Static file, immutable-ish |
| Daily reports | `/api/data/daily/{date}.json` | 9 | 154.2 KB | 17.1 KB | 1933 ms | `s-maxage=600, swr=3600` |
| Power stations | `/api/data/plants/{date}.json` | 1 | 76.6 KB | 76.6 KB | 2061 ms | `s-maxage=600, swr=3600` |
| Live grid | `/api/data/live-grid` | 1 | 7.6 KB | 7.6 KB | 808 ms | `s-maxage=600, swr=3600` |
| Forecast | `/data/forecast/{date}.json` | 1 | 3.7 KB | 3.7 KB | 820 ms | Static file |
| Manifest | `/api/data-manifest` | 1 | 1.2 KB | 1.2 KB | 1673 ms | **`s-maxage=30`** |
| No-source days | `/data/grid-verification/no-source-days.json` | 1 | 0.6 KB | 0.6 KB | 740 ms | Static file |

### Waves — serial or parallel?

| Wave | Timing | N | What |
|---|---|---|---|
| 1 | 740–820 ms | 4 | no-source-days, **unit-cost (327 KB)**, live-grid, forecast |
| 2 | 1673 ms | 1 | manifest |
| 3 | 1933–2415 ms | 9 | daily × 8, plants × 1 |
| 4 | 30150 ms | 1 | one further daily, scroll-triggered |

Within a wave the requests are parallel. **Between waves they are serial, and the dependency is
real**: wave 3 cannot start until the manifest (wave 2) has answered, because
`lib/data/runtime-data.client.ts` consults the manifest to decide whether a key is published as a
`DataRelease` (read from `/api/data/*`) or should come from the static file. That is a genuine
correctness mechanism — it is what makes a *correction* to an already-shipped day visible — not
an accident.

So the critical path is: page → manifest → 9 parallel day fetches. **~1.9 s before the first
daily payload is even requested.**

### Duplication

**One duplicated path:** `/api/data/daily/2026-09-05.json` fetched **3×** in a single view. The
newest day is read by more than one component (KPI strip, curve, comparison) with no shared
in-flight cache. Small in bytes (~17 KB × 2 wasted) but it is 2 extra middleware invocations and 2
extra function-or-CDN hits for bytes already in memory.

*(For contrast: the same page measured against the dev server showed 38 requests and 11 duplicated
paths. React Strict Mode double-invokes effects in development. The production figures above are
the real ones.)*

### Is it all needed immediately?

No, and one item stands out.

- **`unit-cost.json` is 327.5 KB — 57% of all grid bytes — and it is fetched in the very first
  wave, at 754 ms.** It is the whole-archive unit-cost witness (`days` array covering the entire
  record) pulled down to authenticate a per-day badge
  (`components/news/power-grid/useUnitCostAuthentication.ts:83`). A reader looking at one day needs
  one day of it.
- The 9 daily payloads back the trailing-window sparkline and comparison. The **newest day** is
  needed for first paint; the other 8 are context.
- `plants/{date}.json` (76.6 KB) backs the Power Stations tab, which is not the landing tab.

---

## 2. Options

### A. One bundled payload
One request returning everything for the selected day.

- Requests **19 → 1**; middleware invocations for data **19 → 1**.
- **Rejected as stated, and you already said why.** It would put the 327 KB witness and the
  76.6 KB plants payload on the critical path for a reader who opens the KPI tab and leaves, and
  it would break the per-file cacheability that lets a shared day be reused across visitors. It
  also collapses the tier gate's granularity: the gate reasons about `/data/**.json` paths and
  dates, and one opaque bundle would have to re-implement that inside the handler.

### B. A few grouped payloads — **recommended shape**
Three groups aligned with how the page is actually read:

1. **`first-paint`** — newest day + live-grid + forecast + no-source-days, in one response.
2. **`window`** — the trailing 7–8 daily payloads for the sparkline, one response.
3. **on demand** — plants, and the per-day slice of the unit-cost witness, when their tab opens.

- Requests **19 → ~2 on load, +1 per tab opened**.
- Middleware invocations for data **19 → ~2–4**.
- Keeps the gate intact: each grouped endpoint is still date-scoped and still lives under
  `/api/data/`, so `isProtectedDataJsonPath` and `isDateAllowedForTier` apply unchanged.
- Bytes on first paint fall sharply if the witness split lands with it (see D).
- **Cost:** a new grouped endpoint plus client changes. This is the real work.

### C. Lazy-load only what is visible
Defer plants and the witness until their tab is opened; keep everything else as is.

- Requests **19 → ~10 on load**. Bytes on first paint **571 KB → ~180 KB**.
- **Much the best effort-to-benefit ratio on this list**, and it is independent of B — it needs no
  new endpoint, only moving two fetches behind the tab that uses them.
- Risk: a reader who opens the Power Stations tab waits where they previously did not.

### D. Split the unit-cost witness per day
Serve `/data/grid-verification/unit-cost/{date}.json` instead of one 327 KB archive file.

- **Removes 327 KB — 57% of grid bytes — from every single view**, replacing it with a few KB.
- Requests unchanged (still 1), so no middleware saving; this is purely bandwidth.
- Cost: a build-step change to emit per-day files, and a fallback while both shapes exist.
- Combined with C this is the largest byte reduction available anywhere in the app.

### E. Longer manifest caching
`/api/data-manifest` is `s-maxage=30` (`route.ts:61`) and the client re-checks every 120 s
(`runtime-data.client.ts:32`).

- On its own: saves at most 1 request per view; **negligible.**
- But it sits on the **critical path** — wave 3 cannot start until it answers, ~1.9 s in. Raising
  `s-maxage` to a few minutes would not reduce request count but would make that hop a CDN hit
  almost always, cutting perceived load. **Do this one regardless; it is a one-line change.**
- Caveat: the manifest is what surfaces a just-published day, so the TTL is a freshness knob.
  Anything beyond ~5 minutes should be your call, not mine.

### F. Current architecture
19 requests, 571 KB, ~2.4 s to settle, 1 duplicate. Defensible. Not free.

---

## 3. Expected reduction

| Change | Data requests | Middleware (data) | First-paint bytes | Effort | Risk |
|---|---|---|---|---|---|
| Current | 19 | 19 | 571 KB | — | — |
| **C** lazy plants + witness | ~10 | ~10 | **~180 KB** | Low | Low |
| **D** split witness per day | 19 | 19 | **~250 KB** | Medium | Low |
| **C + D** | ~10 | ~10 | **~180 KB**, witness now KB not MB | Medium | Low |
| **B** grouped payloads | **~2–4** | **~2–4** | ~180 KB | High | Medium |
| **E** manifest TTL | 19 | 19 | 571 KB | Trivial | Low (freshness) |
| dedup the 3× daily fetch | 17 | 17 | 537 KB | Low | Low |

**Recommended order: E (one line) → dedup → C → D → then decide on B.**

None of these touch the gate. Every grouped or split endpoint stays under `/data/**` or
`/api/data/**` and stays date-scoped, so `isProtectedDataJsonPath`, the referer check and
`isDateAllowedForTier` apply exactly as they do now. `lib/test/middleware-matcher.test.ts` asserts
those paths keep reaching middleware.

---

## 4. But this is not the biggest item

Ranked by measured middleware invocations per view, production:

| Source | Invocations | Note |
|---|---|---|
| **`<Link>` prefetch, site-wide** | **41–60 per view on every page** | 896 KB speculative payload on the homepage alone |
| Grid Explorer data | 19, on one route | Addressed above |
| Everything else | 1–2 per view | Document, view-tracking POST |

Restructuring the Grid Explorer's fan-out is worth doing, but on a site-wide basis prefetch is
between two and three times larger and affects *every* page rather than one. I would want to look
at that before doing the higher-effort option B here.

**I have not changed prefetch behaviour and am not proposing a specific change yet** — it trades
directly against navigation feel, 19 of the 44 homepage prefetches are outright duplicates that
may be a bug rather than a policy, and it deserves its own measured decision the way this one got.

---

## 5. Status

Audit complete. **No Grid Explorer code changed. Middleware gate untouched.** Awaiting your
approval before implementing any option.
