# COST_OPTIMIZATION_REPORT.md

**Branch:** `optimization/cost-control`
**Date:** 2026-09-06
**Scope:** Recommendations 1 and 2 only. Images untouched, Supabase Storage untouched,
database architecture untouched, `next/image` behaviour untouched.

---

> ## ⚠ CORRECTION (2026-09-06, later the same day)
>
> **Every per-page request count in this document was measured against the development
> server, and `next/link` prefetching is disabled in development.** Re-measured against a
> production build, the real middleware-invocation counts are:
>
> | Page | stated below | actual (prod) | of which prefetch |
> |---|---|---|---|
> | homepage | 4 | **46** | 44 |
> | article | 3 | **43** | 41 |
> | category | 1 | **43** | 42 |
> | `/articles` | 1 | **61** | 60 |
> | `/grid-explorer` | 43 | **63** | 43 (data is 19, not 41) |
>
> Two conclusions below are withdrawn: that 41 of the Grid Explorer's requests are the tier
> gate (19 are), and §2.7's rating of prefetch as **NOT A PROBLEM** — a prefetch of a
> statically-cached page still costs a full middleware invocation, and prefetch is ~90% of all
> invocations site-wide. See `GRID_REQUEST_AUDIT.md` §0 for the measurements.

## 1. Effective ISR behaviour, before vs after

Both columns are read from a real `npm run build` route table, not from the declared values.

| Route | Declares | Before | After | Factor |
|---|---|---|---|---|
| `/` | 180s | 1m | **3m** | 3× |
| `/about` | 86400s | 1m | **30m** | 30× |
| `/categories` | 86400s | 1m | **30m** | 30× |
| `/energy-policy` + 26 policy pages | 3600s | 1m | **30m** | 30× |
| `/titas-gas` | 3600s | 1m | **30m** | 30× |
| `/contact`, `/tags`, `/annual-reports/financials` | — | 1m | **30m** | 30× |
| article pages (132) | 600s | 1m | **10m** | 10× |
| category pages (11) | 600s | 1m | **10m** | 10× |
| `/search` | 600s | 1m | **10m** | 10× |
| `/analysis/gas-crisis-2026` | 3600s | 1m | **10m** | 10× |
| grid day pages (61) | 86400s | 1m | **10m** | 10× |
| grid archive years (15) | 86400s | 1m | **10m** | 10× |
| `/articles`, `/articles/popular`, `/articles/page/N` (14) | 300s | 1m | **5m** | 5× |
| `/magazine`, `/grid-explorer` | 300s | 1m | **5m** | 5× |

The homepage now honours its own declaration exactly (180s → 3m). Two residual clamps remain
and are **not** this change — see §8.

---

## 2. Approximate regeneration reduction

**Ceiling on ISR regenerations per day, across the 277 prerendered public pages:**

> **398,880 → 39,480 — about 10× lower.**

That is a *ceiling*, and the distinction matters. ISR regenerates on request, not on a timer, so
the ceiling only binds where every page is requested in every window. On a site with modest,
unevenly distributed traffic the realised saving will be lower on cold pages and close to the
ceiling on hot ones.

**Actual regeneration counts before and after: REQUIRES PRODUCTION METRICS.**

Each avoided regeneration is one serverless invocation plus that route's Postgres queries, so the
database saving tracks the same shape.

---

## 3. Middleware invocations per page view, before vs after

Measured with a real browser against the running app, counting requests **not** excluded by the
matcher — i.e. requests that cost an invocation even when the CDN serves the body.

| Route | Before | After |
|---|---|---|
| `/grid-explorer` | 44 | **43** |
| homepage | 5 | **4** |
| article | 3 | **3** |
| `/articles` | 2 | **1** |
| category | 1 | **1** |

**This is a small result and I am not going to dress it up.** Matcher scope was not where
page-view waste lived. 41 of the Grid Explorer's 43 are `/data/**.json` and its `/api/data/**`
twin, and those *are* the tier gate — excluding them would publish the archive. That is the price
of the gate, not waste.

The saving that *is* real does not appear in a page-view measurement: every crawler fetch of
`news-sitemap.xml` and `grid-sitemap.xml` (both previously matched, because the old exclusion list
named only `sitemap.xml`), every `feed.xml` poll, and every font, icon, manifest and PDF request
now skip middleware entirely. Google News polls a news sitemap frequently.
**Quantifying that: REQUIRES PRODUCTION METRICS.**

---

## 4. Mutation → revalidation → tag → pages

Requested mapping. Verified by reading every write to `Article`, `Category`, `MagazineIssue` and
`SiteSetting` in `lib/` and `app/`, and asserted by `lib/test/cache-invalidation.test.ts`.

| Mutation | File | Helper | Tags expired | Pages affected |
|---|---|---|---|---|
| Article create / update / publish / unpublish / delete / placement flags | `lib/actions/articles.ts:85` | `revalidateArticleContent` | `articles`, `categories` | `/`, `/articles`, `/articles/[slug]`, `/categories/*`, `/search`, `/tags` |
| Scheduled publish (cron, every 15 min) | `lib/cron/publish-scheduled-articles.ts:21` | `revalidateArticleContent` | `articles`, `categories` | same |
| Approve-and-publish after review | `lib/actions/review-workflow.ts:226` | `revalidateArticleContent` | `articles`, `categories` | same |
| Platform bulk actions | `lib/actions/platform.ts:295`, `:21` | `revalidateArticleContent` / `revalidateAllContent` | `articles`, `categories`, `magazine` | all public |
| Category create / rename / reorder / delete | `lib/actions/categories.ts:39` | `revalidateCategoryContent` | `categories`, `articles` | `/categories`, `/categories/[slug]`, nav, footer |
| Magazine issue create / update / delete | `lib/actions/magazine.ts:42,60,70` | `revalidateMagazineContent` | `magazine` | `/magazine`, `/` |
| Site settings edit | `lib/actions/settings.ts:81` | `revalidateTag` direct | `site-settings` | every page (layout) |
| Data release publish / revoke | `lib/data/releases.server.ts` | `revalidateDataRelease` | `data-release:*` | Grid Explorer |
| **Editor trashes own published article** | `lib/actions/editor-trash.ts` | `revalidateArticleContent` | `articles`, `categories` | all article surfaces |
| **Platform undo (restores status / publishedAt)** | `lib/actions/logs.ts` | `revalidateArticleContent` | `articles`, `categories` | all article surfaces |
| **Hero image replaced** | `lib/actions/media.ts` | `revalidateArticleContent` | `articles`, `categories` | every card of that article |

The **bold** three had no tag flush before this branch. They called `revalidatePath`, which
re-renders the route but leaves the tagged data cache holding the old rows underneath — so the
re-render repainted the same stale content. All three were survivable only because every cache
carried `revalidate: 60` and healed itself within a minute.

**Why approach B (long fallback) and not A (no timer).** Coverage is not exhaustive, for a reason
that cannot be fixed by adding calls: `import:news`, `translate:news`, `backfill:media` and any
direct database edit run **outside the Next runtime**, where `revalidateTag` does not exist. A
timer is the only backstop for those. 86400s is the ceiling on how long such an out-of-band change
can stay invisible. Nothing that goes through the application waits for it.

**Not claimed: "zero freshness risk."** The residual risk is (a) an out-of-band mutation is
invisible for up to a day, versus up to a minute before, and (b) any future mutation path that
forgets its tag now degrades for a day rather than a minute. (b) is what the new test exists to
prevent.

---

## 5. Functionality affected

Nothing regressed. Verified directly:

| Check | Result |
|---|---|
| `/admin`, `/admin/users`, `/cms/articles`, `/members/downloads` signed out | **307** to login ✓ |
| `/api/upload`, `/api/admin/data/publish`, `/api/members/grid-export`, `/api/analytics` signed out | **401** ✓ |
| 2019 archive day, no session — static path **and** API twin | **403** both ✓ |
| Recent day within the public window, with referer | **200** ✓ |
| 13 public routes (home, article, category, articles, search, grid explorer, magazine, about, login, sitemap, news-sitemap, robots, feed) | **200**, 0 broken images, 0 page errors ✓ |
| Images across those pages | 299 images loaded, **0 broken** ✓ |
| Middleware diff | **one line** of matcher; gate logic untouched ✓ |

**Behaviour changes that are intended, not regressions:**

- Trending ordering is now up to 30 minutes stale (was 60 seconds). It orders by `views`, which
  every article read increments and deliberately never invalidates.
- An out-of-band database edit takes up to 24h to surface (was 60s). Publishing through the app is
  unaffected and still read-your-writes.

**Not executed:** a signed-in end-to-end publish → view → edit → delete cycle through the CMS UI.
That needs staff credentials against a live database, which I did not use. What replaces it is
`lib/test/cache-invalidation.test.ts`, which asserts the call exists on every path that owes one —
the property that actually broke. `revalidateTag` throws outside a request scope, so a server
action cannot be driven from vitest at all. **End-to-end publish verification: still owed.**

---

## 6. Exact files changed

| File | Change |
|---|---|
| `lib/actions/editor-trash.ts` | +tag flush when a *published* article is trashed |
| `lib/actions/logs.ts` | +tag flush on platform undo |
| `lib/actions/media.ts` | +tag flush on hero image replace |
| `lib/category-content.ts` | 6 caches 60s → `CONTENT_CACHE_TTL` (86400); trending → `TRENDING_CACHE_TTL` (1800) |
| `lib/coverage-content.ts` | 3 caches 60s → 86400 |
| `lib/homepage-content.ts` | 1 cache 60s → 86400; 2 settings caches 300s → 86400 |
| `app/(public)/layout.tsx` | `revalidate` 300 → 86400 (the second half of the clamp) |
| `middleware.ts` | matcher: +`__nextjs_font`, +extension exclusion; one line |
| `lib/test/cache-invalidation.test.ts` | **new** — 19 assertions |
| `lib/test/middleware-matcher.test.ts` | **new** — 46 assertions |
| `COST_AUDIT.md`, `COST_OPTIMIZATION_REPORT.md` | **new** — docs |

---

## 7. Build / lint / typecheck / tests

| | |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | **0 errors**, 15 warnings (all pre-existing, none in changed files) |
| `npm run build` | exit 0, 319 pages prerendered |
| `npm test` | **748 passed** (was 683; +65 new) |

Both new test files were **verified by breaking them**, per the repo's own rule that a passing
check must be shown to have run:

- Removing the flush from `editor-trash.ts` → the trash assertion fails.
- Restoring `revalidate = 300` on the public layout → the layout assertion fails.
- Adding `json` to the middleware extension list → **8 assertions fail**, including every gated
  `/data/**` and `/api/data/**` path.

---

## 8. Still unexpectedly expensive

**Two residual ISR clamps, both deliberate, both leaving a lever on the table:**

1. **`app/(public)/not-found.tsx` renders three trending articles.** A `not-found` belongs to the
   route-group segment tree, so its data requirement becomes the floor for *every* sibling route.
   That is why `/about` — a page with no articles on it — reports 30m instead of the day it
   declares. Giving the 404 page a longer-lived list (or dropping the trending block) would lift
   `/about`, `/categories`, `/contact`, `/tags`, `/titas-gas` and all 26 policy pages from 30m to
   their declared values. **Left alone: it changes what a page displays, which is your call.**

2. **The release cache's 10-minute production backstop** (`lib/data/releases.server.ts:53`) sets
   the floor for grid routes. It is documented, deliberate, and already an order of magnitude
   better than the value it replaced. Leave it.

**Unchanged from the audit and still the largest items:**

- **Grid Explorer: 43 middleware invocations per view.** The lever is fewer client requests
  (batching the per-day fetches, lengthening the 30s manifest TTL), not a wider matcher.
- **Every article view costs a function + ~4 Postgres statements** (`lib/article-view-tracking.ts`).
- **`/authors/[slug]` and `/tags/[tag]` are still fully dynamic SSR** — audit §2.4. Mechanical fix,
  the pattern already exists at `/articles/page/[n]`.
- **`/uploads/[...path]` still runs `fs.readdir` per image request** inside a function.
- **Images: untouched, as instructed.** Awaiting your Vercel transformation and bandwidth numbers.

---

## 9. Commits

| SHA | Commit |
|---|---|
| `7fccfdac` | `docs(build): audit where this project actually spends money` |
| `833bfc27` | `fix(cache): flush the article tag on the three paths that skipped it` |
| `e56aea57` | `perf(cache): replace 60s ISR churn with tag-driven invalidation` |
| `6081760d` | `test(cache): assert the mutation -> tag wiring the timers used to cover` |
| `c7946e23` | `perf(middleware): exclude static and unnecessary public requests` |

`main` untouched. Nothing deployed.

---

# Phase 3 — prefetch, and the disabled Supabase transform

**Date:** 2026-09-06 · **Commits:** `acd3f2ad`, `eaa954d4`
All measurements below are from `npm run build` + `next start`. None are from `next dev`.

## 1. Where the 19 duplicate homepage prefetches came from

Not a rendering bug, and not two links per card — `ArticleCard` carries exactly one `<Link>`.
They came from the **same destination being legitimately reachable several times on one page**,
and prefetch firing **per `<Link>`, not per href**:

| Destination | Anchors on the homepage | Where |
|---|---|---|
| `/articles` | **5** | navbar hub "Latest", "Browse archive", "View all in All News", "All stories", footer |
| `/categories/power-generation` | **3** | navbar category ribbon, section "View All", footer |
| `/` | **3** | masthead logo, navbar Home pill, footer logo |
| `/grid-explorer` | **3** | navbar hub, "System Snapshot" title link, footer |

Two structural amplifiers: the navbar renders its **category ribbon twice** (desktop rail and
mobile sheet, both in the DOM), and the **footer repeats destinations the navbar already offers** —
the footer alone owned 15 of the homepage's prefetched anchors.

A third, smaller mechanism: a single anchor re-firing on re-render — `/analysis/gas-crisis-2026`
was prefetched 4× from **1** anchor on the Grid Explorer.

## 2–4. Before / after

| Route | Prefetch reqs | Prefetch bytes | Unique dests | Duplicates | Middleware-eligible |
|---|---|---|---|---|---|
| `/` | 45 → **5** | 896 KB → **4 KB** | 25 → **5** | 20 → **0** | 47 → **12** |
| article | 42 → **5** | 847 KB → **4 KB** | 23 → **5** | 19 → **0** | 43 → **11** |
| category | 46 → **5** | 941 KB → **4 KB** | 27 → **5** | 19 → **0** | 47 → **11** |
| `/articles` | 60 → **5** | 1193 KB → **4 KB** | 37 → **5** | 23 → **0** | 61 → **11** |
| `/grid-explorer` | 44 → **5** | 1028 KB → **4 KB** | 23 → **5** | 21 → **0** | 60 → **26** |

Total transferred per view also falls (homepage 3854 → 3383 KB; `/articles` 3299 → 2532 KB).
Every page now prefetches exactly the five primary hubs, once each. Targets were 5–8; the result
is **5 on all five pages**.

Grid Explorer's residual 26 is its data layer (19 requests) plus the document — the tier gate,
untouched, and the subject of `GRID_REQUEST_AUDIT.md`.

## 5. Navigation UX

Measured, three runs each, median time from click to the destination's heading:

| Transition | Prefetch | Median |
|---|---|---|
| navbar → `/articles` | kept | 71 ms |
| navbar → `/magazine` | kept | 72 ms |
| navbar → `/grid-explorer` | kept | 145 ms |
| article card | **disabled** | 106 ms |
| category ribbon | **disabled** | 91 ms |
| footer → `/about` | **disabled** | 85 ms |
| pagination → page 2 | **disabled** | **63 ms** |

**The fastest transition on the site is now one with prefetch disabled.** Every destination is
prerendered, so the click-time RSC fetch is already quick. No hover-prefetch framework was built —
the measurements do not justify one.

## 6. Where prefetch was disabled

Kept (opted in explicitly on `PublicNavLink`): home, `/articles`, `/grid-explorer`, `/magazine`,
`/search`. Disabled across 105 `<Link>` sites in 44 files: footer, navbar category ribbon,
`ArticleCard`, `ArticlesIndex`/`Frame`, `AuthorProfileFrame`, `FeaturedCarousel`, `SectorCoverage`,
home sections, breadcrumbs, grid-explorer lists, member CTAs, and the public pages' inline links.
`href`, keyboard behaviour, accessibility and crawlability are unchanged.

## 7–10. The Supabase transform bug

**Root cause.** Transformations are disabled; `/storage/v1/render/image/` answers
`403 FeatureNotEnabled`. Two live constructors still built those URLs.

| Constructor | Callers | Class | Effect |
|---|---|---|---|
| `lib/media-thumbnail.ts` `mediaThumbnailUrl` | `MediaPicker`, `FeaturedImageEditor`, `MediaUpload` (6 sites) | **CMS** | 168 Supabase-object Media rows → broken |
| `lib/article-image.ts` `normalizeArticleImageUrl` | `category-content`, `coverage-content`, `homepage-content`, `AuthorProfileFrame`, article page | **PUBLIC** | branch only fires for `/uploads/` — **0 published articles**, so no public breakage |
| same | `MediaUpload` | **CMS** | the other 42 `/uploads/` Media rows → broken |
| `next.config.ts` remotePattern | — | **DEAD** | allowlisted a path nothing may use; removed |

**Fix.** Both return the plain `/storage/v1/object/public/...` URL. No Supabase transformation, and
no Vercel one either — these render through plain `<img>` already, CSS-constrained at every site.

**Why that is now cheap:** uploads are normalised on ingest (WebP q80, 2560px longest edge), so the
168 objects total **16 MB — 100 kB average, 342 kB largest**. The comment justifying the transform
predated that normalisation.

**Confirmation of zero live requests:** nine public pages driven in a real browser produced **608
requests, 0 to `/storage/v1/render/image/`**, 408 images rendered, **0 broken**, 0 page errors. All
212 Media rows resolve with no transform URL; a 25-row sample all HEAD 200. A repo-wide re-grep
leaves only comments and test assertions — no live constructor.

## 11. Build / tests

`tsc` clean · `lint` 0 errors (14 pre-existing warnings) · `build` exit 0 · **753 tests pass**
(was 748). The new transform guard was verified by reintroducing a `render/image` URL, which fails
three assertions.

## 12. Commits

| SHA | Commit |
|---|---|
| `acd3f2ad` | `perf(prefetch): stop speculative loading on dense content surfaces` |
| `eaa954d4` | `fix(media): remove disabled Supabase transform dependency` |
| `fffc75d0` | `feat(magazine): fix the section and rebuild the interactive reader` (unrelated work that had been sitting uncommitted; separated out rather than folded in) |
