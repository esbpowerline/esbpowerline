# COST_AUDIT.md

**Branch:** `optimization/cost-control`
**Date:** 2026-09-06
**Scope:** Phase 1 audit only. **No application code has been changed.**
**Baseline:** ~$50/month across Vercel + Supabase, $0 revenue.

---

## 0. How this audit was produced

Three evidence sources, in order of authority. Nothing below is inferred where it could be measured.

1. **A real production build** (`npm run build`, exit 0, 319 pages prerendered in 13.3s).
   The route table is the authority for what is STATIC / SSG / DYNAMIC. Quoted verbatim.
2. **A real browser, driven against the running app**, recording every same-origin request per
   page view and classifying it (`/_next/image`, `/api/*`, `/data/*`, static chunk).
   This is the authority for per-view request counts.
3. **Direct file:line reading.** Every claim below cites one.

**What I could not measure and have not guessed:** actual Vercel/Supabase invoice line items,
your plan tier, and current quota consumption. Anything depending on those is marked
`MANUAL VERIFICATION REQUIRED`.

### Measured per-page-view request profile

| Page | Total requests | **Middleware-eligible** | `/_next/image` | `/api/*` | `/data/*` |
|---|---|---|---|---|---|
| Homepage `/` | 52 | **4** | 30 | 1 | 0 |
| Article page | 23 | **3** | 7 | 1 (`POST …/view`) | 0 |
| `/articles` index | 25 | **1** | 11 | 0 | 0 |
| Category page | 34 | **1** | 20 | 0 | 0 |
| **`/grid-explorer`** | 60 | **43** | 2 | **33** | 9 |

"Middleware-eligible" = requests **not** excluded by the matcher at `middleware.ts:374`, i.e.
requests that cost one Edge Middleware invocation **even when the response itself is served from
the CDN**. Middleware runs *before* the edge cache — the codebase states this itself at
`middleware.ts:270`.

---

## 1. Executive summary

**The architecture is already largely correct.** Public pages are genuinely static/ISR, there are
zero Supabase image transformations, no runtime signed-URL generation, Prisma is on the Supavisor
pooler with a hard connection cap, the indexes match the query patterns, and Vercel Analytics and
Speed Insights are deliberately not installed. Several prior cost passes are visible in the code
comments (2026-09-03 in particular).

The remaining spend concentrates in **five** places, and one of them dominates.

| # | Finding | Severity |
|---|---|---|
| 1 | `revalidate: 60` on tagged caches clamps **every** ISR page to a 60s window | **CRITICAL** |
| 2 | Grid Explorer costs **43 middleware invocations per page view** | **CRITICAL** |
| 3 | Every article view = 1 function + ~4 Postgres statements | **HIGH** |
| 4 | `/authors/[slug]` and `/tags/[tag]` are fully dynamic SSR | **HIGH** |
| 5 | `/uploads/[...path]` does a full `readdir` per image request, in a function | **HIGH** |

---

## 2. VERCEL

### 2.1 CRITICAL — ISR is clamped to 60 seconds everywhere

**Evidence (build output, verbatim):**

```
├ ○ /                                             1m   1y      ← declares revalidate = 180
├ ○ /about                                        1m   1y      ← declares revalidate = 86400
├ ○ /categories                                   1m   1y      ← declares revalidate = 86400
├ ● /energy-policy/electricity-act-2018           1m   1y      ← declares revalidate = 3600
├ ● /grid-explorer/2026-07-08                     1m   1y      ← declares revalidate = 86400
├ ● /grid-explorer/archive/2013                   1m   1y      ← declares revalidate = 86400
```

Every declared interval is ignored. Next takes the **minimum** revalidate of every cache entry
touched during render, and these are all 60:

| File:line | Cache |
|---|---|
| `lib/category-content.ts:213` | `getPublishedArticlesForPublic` — `revalidate: 60` |
| `lib/category-content.ts:263` | `getPublishedArticleBySlug` — `revalidate: 60` |
| `lib/category-content.ts:140` | `getPublicCategories` — `revalidate: 60` |
| `lib/category-content.ts:189` | `getPublishedArticlesByCategory` — `revalidate: 60` |
| `lib/category-content.ts:325` | `getTrendingPublishedArticles` — `revalidate: 60` |
| `lib/category-content.ts:349` | `getFeaturedArticles` — `revalidate: 60` |
| `lib/category-content.ts:404` | `getLatestMagazineIssue` — `revalidate: 60` |
| `lib/homepage-content.ts:139`, `lib/coverage-content.ts:79,89,101` | `revalidate: 60` |

**Why this is pure waste:** every one of those caches is also **tagged**, and the tags are already
invalidated on every mutation — `lib/revalidate-tags.ts` is called from `lib/actions/articles.ts:85`,
`lib/actions/platform.ts:295`, `lib/actions/review-workflow.ts:226` and
`lib/cron/publish-scheduled-articles.ts:21`. Publishing already flushes the cache correctly and
immediately. The 60-second timer buys nothing and forces ~220 prerendered pages to be eligible for
regeneration every minute — each regeneration being one function invocation plus its Postgres
queries.

`/grid-explorer/archive/2013` — a page about a year that ended thirteen years ago — is currently
allowed to re-render every 60 seconds.

**Fix:** raise the `revalidate` on the tagged caches to something long (or `false`) and let the tags
do the invalidating, which is what they are for. Content freshness is *unchanged* — publishing
already expires the tag.

---

### 2.2 CRITICAL — Grid Explorer: 43 middleware invocations per page view

**Measured.** One load of `/grid-explorer` fires 60 same-origin requests, of which **43 are
middleware-eligible**: 33 `/api/data/*` calls, 9 `/data/*.json` files, and the document.

The bodies are mostly fine — `app/api/data/[...path]/route.ts:55` sets
`public, max-age=0, s-maxage=600, stale-while-revalidate=3600`, so the CDN absorbs the repeats and
the function itself runs only on a miss. **But middleware runs before the edge cache**, so all 43
are billed as edge invocations on every single view, cached or not.

Contributing factors:

- `middleware.ts:374` — the matcher excludes only
  `_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|api/cron`.
  `/data/*` and `/api/data/*` are **in** scope, deliberately: `isProtectedDataJsonPath`
  (`middleware.ts:213`) is the tier gate. This is a genuine security/cost tension, not an oversight.
- `lib/data/runtime-data.client.ts:9-13` — the client consults `/api/data-manifest` first and, when
  a key is published as a `DataRelease`, reads `/api/data/*` **instead of** the static file. Per
  `CLAUDE.md` roughly 90 days live as releases — i.e. exactly the recent days most visitors open.
  So the hot path never touches the free static file.
- `app/api/data-manifest/route.ts:61` — `s-maxage=30`. Very short for a manifest.

**Reducible to near-zero? Partially.** The gate must stay. The lever is *request count*: 43 → single
digits by batching the per-day fetches into one request, and by letting the archive's static files
serve days that have no correction pending.

---

### 2.3 HIGH — Every article view costs a function + ~4 Postgres statements

`components/analytics/ArticleViewTracker.tsx:12` fires `POST /api/articles/{id}/view` on every
article page view. Measured: 1 per view, and it is the **only** origin work an otherwise fully
static article page performs.

`app/api/articles/[articleId]/view/route.ts` → `lib/article-view-tracking.ts`:

- `:39` `prisma.article.findFirst`
- `:48` `prisma.$transaction` wrapping
- `:49` `tx.articleView.create`
- `:57` a raw update of the view counter
- `:63` `tx.user.update` (author totals)

So ~4 statements + a transaction per article read, plus a rate-limit check
(`route.ts:16`), plus the function invocation itself. This is simultaneously the largest
Supabase write load and a per-view Vercel invocation.

Not removable — you need view counts — but very reducible (batching, sampling, `sendBeacon`,
dropping the author-total write off the hot path).

---

### 2.4 HIGH — Two public routes are fully dynamic

```
├ ƒ /authors/[slug]
├ ƒ /tags/[tag]
```

`app/(public)/authors/[slug]/page.tsx:173-180` reads `searchParams: Promise<{ page?: string }>`,
and the file has **no `generateStaticParams`** — so its declared `revalidate = 600` (`:14`) never
applies and every hit is a full SSR + database render. Same shape for `/tags/[tag]`.

This is inconsistent with the rest of the codebase, which already solved exactly this problem:
`/articles/page/[n]` uses a **path segment** for pagination and is prerendered (`●`), and
`middleware.ts:157-168` already 308-redirects the legacy `?page=` form. Author and tag pages just
never got the same treatment.

Also dynamic and worth noting:

- `ƒ /[...missing]` — the catch-all 404 handler. Every bot probing random URLs costs a function
  invocation. For a site with a public sitemap this is not trivial.
- `ƒ /uploads/[...path]` — see 2.5.

---

### 2.5 HIGH — `/uploads/[...path]` scans a directory per image request

`app/uploads/[...path]/route.ts:26` calls `fs.readdir(uploadsDir)` on **every request**, then
linear-scans the listing to fuzzy-match a filename suffix, then `fs.readFile`s and streams the
bytes back **through the serverless function**.

`public/uploads` currently holds 42 files / 2.7 MB, so the scan is cheap *today*. The costs are
structural: every legacy `/uploads/` image is a function invocation plus function egress instead of
a CDN-served static asset, and the work grows linearly with the folder.

`lib/article-image.ts:12` normalises `/uploads/` URLs, which implies legacy article images still
point there.
**MANUAL VERIFICATION REQUIRED:** how many published articles still have an `imageUrl` under
`/uploads/` rather than Supabase storage. I did not query production to find out.

---

### 2.6 MEDIUM — Vercel Image Optimization is on, and it is the dominant request type

`next.config.ts:195` — `unoptimized: false`. The trailing comment
(`// Bypass Vercel 1000 image/mo limit`) is **misleading**: `false` means optimization is *enabled*.
Every `<Image>` goes through `/_next/image`.

Measured `/_next/image` requests per view: **homepage 30, category 20, `/articles` 11, article 7.**

Important nuance, so this is not overstated: Vercel bills *transformations*, which are per unique
(source × width × quality × format) and cached afterwards — **not** per request. The config is
already well defended against transformation blowup:

- `next.config.ts:229` — `minimumCacheTTL: 31536000` (1 year), with a correct justification
  (filenames are content-addressed `${Date.now()}-${name}`).
- `next.config.ts:220` — `qualities: [80]` only, so quality cannot multiply variants.
- `next.config.ts:199-216` — `remotePatterns` pins host **and** path, closing the open-proxy hole.

So transformation *count* is bounded by distinct images × requested widths. The **bandwidth** is
not bounded, and 30 optimized images on the homepage is a lot of Fast Data Transfer per view.

**This is the Phase 2 decision point and I am not pre-judging it.** See §5.

---

### 2.7 MEDIUM / LOW — the rest

| Item | File:line | Severity | Note |
|---|---|---|---|
| Homepage live-grid poll | `components/home/HomeSnapshotPanel.tsx:104` | **MEDIUM** | Fetches `/api/data/live-grid` on load, then every 15 min. **No `document.hidden` guard** — a backgrounded tab polls forever. Well mitigated: `route.ts:21` sets `s-maxage=600` and `live-grid.server.ts:84` caches 600s server-side. |
| Cron | `vercel.json` crons | **LOW** | One job, `*/15 * * * *` = ~2,880 invocations/month, each hitting Postgres. Only genuinely needs to run when something is scheduled. |
| Console logging | 51 non-error `console.*` across `lib/` (45), `components/` (4), `app/api/` (2) | **LOW** | No `compiler.removeConsole` in `next.config.ts`. Log volume is billable on some Vercel plans. |
| Deployment payload | `public/data` = **412 MB / 11,689 JSON files** | **LOW→MEDIUM** | Ships with every deploy. Largest: `plants/` 153M, `petrobangla/` 112M, `daily/` 73M. Affects build/deploy time and upload, not per-request cost. Bandwidth only for files actually fetched. |
| Prefetch | no `prefetch={false}` anywhere | **NOT A PROBLEM** | Destinations are static/SSG, so prefetch hits the CDN. `middleware.ts:333` already skips token refresh for `next-router-prefetch`. Leave alone. |
| Web Analytics / Speed Insights | `app/layout.tsx:156` | **NOT A PROBLEM** | Deliberately not installed, with a comment saying so. |
| `/api/cron/ingest` | disabled on Vercel, returns 503 | **NOT A PROBLEM** | Python chain runs on the Raspberry Pi. Correct. |
| Middleware internals | `middleware.ts:322-338` | **NOT A PROBLEM** | Two fast paths already skip Supabase entirely for anonymous public traffic, and prefetches skip token refresh. Already optimised. |

---

## 3. SUPABASE

### 3.1 Image transformations — already zero

**`/storage/v1/render/image/` is used nowhere in the application.** I grepped for it and every hit
was a CSS `transform:` property. Phase 2's "zero Supabase runtime transformations" goal is
**already met**.

One dangling item: `next.config.ts:207-211` still allowlists the
`/storage/v1/render/image/public/**` pattern in `remotePatterns`. Harmless (nothing constructs such
a URL) but it should go, so nothing can silently start using it.

### 3.2 Signed URLs / storage listing — already correct

No `createSignedUrl(` and no `getPublicUrl(` anywhere in `lib/`, `app/` or `components/`. Public
object paths are stored and reused, which is exactly the Phase 10 target. **NOT A PROBLEM.**

### 3.3 Prisma connection safety — already correct

- `DATABASE_URL` → port **6543**, Supavisor transaction pooler, `pgbouncer` flag present.
- `DIRECT_URL` → port **5432**, session pooler, for migrations.
- `lib/prisma-database.ts:78` — `max: 2` connections in production (10 in dev).
- `lib/prisma-database.ts:88-90` — `connectionTimeoutMillis: 10s`, `query_timeout` and
  `statement_timeout` 15s, added after a documented incident where eleven renders each burned the
  full 300s function timeout.

*(No secret values were read, printed or written. Only port number, pooler-vs-direct shape, and
which query flags are present.)*

**NOT A PROBLEM.** Phase 6 is effectively already done.

### 3.4 Query shape — mostly correct

`lib/category-content.ts:43-67` — `ARTICLE_CARD_SELECT` explicitly excludes `content`, with a
comment saying that is the point. Cards do not fetch bodies. Indexes match the access patterns:
`Article` carries `@@index([status, publishedAt])`, `([category, status])`, `([isFeatured, status])`,
`([isTrending, views desc])`, `([authorId])`; 31 indexes across the schema.

Remaining, both **LOW**:

- `lib/category-content.ts:200` — `take: limit + 40` then filter-and-slice in JS. Fetches ~100 card
  rows to return 60. Bounded, but it is real egress on a cache miss.
- `ARTICLE_CARD_SELECT` includes `seo: true` — the whole SEO JSON blob per card, × ~100 rows.
- `lib/category-content.ts:266` — `getPublishedArticleBySlug` uses `include` with no `select`, so it
  pulls **every** column including both `content` **and** `contentBn` when only one is rendered
  (`:249`). Roughly doubles the row payload on an article cache miss.

**No N+1 patterns found.** The one place that could have been (`collaboratorIds` →
`lib/category-content.ts:234`) correctly uses a single batched `findMany({ where: { id: { in } } })`.

### 3.5 Not present

Realtime subscriptions: none. Supabase Edge Functions: none. Log drains: none. **NOT A PROBLEM.**

---

## 4. Answers to your seven questions

**1. Where Vercel is being wasted**
ISR regenerating every 60s across ~220 pages when the declared intervals are 1–24 hours (§2.1);
43 edge middleware invocations per Grid Explorer view (§2.2); a function + DB write per article
read (§2.3); two public routes doing full SSR that should be prerendered (§2.4); images served
through a function that scans a directory each time (§2.5).

**2. Where Supabase is being wasted**
Much less than Vercel. The waste is *derived*: it is the database traffic caused by §2.1 and §2.3.
Direct waste is limited to over-fetching (§3.4) — double article bodies, whole SEO blobs, and 100
rows fetched to return 60.

**3. What is actually billable**
Edge middleware invocations · serverless function invocations · function duration · Fast Data
Transfer (the `/_next/image` bytes are the bulk of it) · image transformations (bounded, see §2.6) ·
Supabase database egress and compute · Supabase storage egress.
**MANUAL VERIFICATION REQUIRED** for which of these your plan actually meters and at what included
allowance — I will not invent your invoice.

**4. What is harmless**
Supabase image transformations (already zero) · signed URLs (none) · Prisma pooling (already
capped) · indexes (already right) · prefetch (destinations are static) · Vercel Analytics (not
installed) · realtime/edge functions/log drains (none) · the cron ingest route (already 503 on
Vercel) · middleware's internal fast paths (already optimised).

**5. What to fix first**
§2.1. It is one line changed in each of ~11 cache definitions, it is the largest single reduction
available, and it carries **no** freshness risk because tag invalidation already exists and already
works. Then §2.4 (mechanical, and the pattern is already in the repo). Then §2.2 (largest absolute
win, most design work).

**6. What can realistically go to near-zero**
ISR regeneration on archival pages (`/grid-explorer/archive/2013` should regenerate ~never) ·
SSR on author and tag pages · the `/uploads/` function path · 404 catch-all invocations ·
production console volume.
**Cannot go to zero:** article view counting (needs a write), the Grid Explorer tier gate (security),
image bytes (a news site must ship images).

**7. Recommended changes** — see §5.

---

## 5. Recommended change set, in commit order

Each is independently reviewable and independently revertable.

| # | Change | Expected effect | Risk |
|---|---|---|---|
| **1** | Raise `revalidate` on the ~11 tagged content caches; let tags invalidate | ~220 pages stop regenerating every 60s | **Low** — tags already wired and tested |
| **2** | Prerender `/authors/[slug]` + `/tags/[tag]`; move pagination to a path segment, mirroring `/articles/page/[n]` | Two route families: SSR+DB → static | **Low** — pattern already exists in repo |
| **3** | Serve `/uploads/*` as static assets; delete the `readdir` route, or cache it hard | Removes a function + directory scan per legacy image | **Medium** — must confirm no live URLs break |
| **4** | Batch Grid Explorer's per-day fetches into one request; lengthen the manifest TTL; prefer the static file when no correction is pending | 43 middleware invocations/view → single digits | **Medium** — must not break the correction path or the tier gate |
| **5** | Make view tracking cheaper: `sendBeacon`, drop the author-total write off the hot path, consider batching | ~4 statements/view → ~1 | **Medium** — counts must stay accurate |
| **6** | Trim query payloads: `select` on `getPublishedArticleBySlug`, drop `seo` from cards, tighten the `+40` over-fetch | Lower DB egress per cache miss | **Low** |
| **7** | `document.hidden` guard on the homepage poll; `compiler.removeConsole` keeping `error`/`warn`; drop the dead `render/image` remotePattern | Small, cheap, safe | **Low** |
| **8** | Phase 2 image decision — **see below** | Potentially the largest bandwidth change | **Needs your call** |

### On Phase 2 (images) — I am not proceeding without a decision

You asked me not to trade a Supabase image bill for a Vercel one. The honest finding is that
**there is no Supabase image bill to trade** — transformations are already unused (§3.1) — so the
build-variants-at-upload architecture you sketched would be replacing a *working, well-configured*
Vercel path rather than rescuing a broken one.

The real question is narrower: `minimumCacheTTL` is already 1 year and qualities are pinned to one
value, so transformation count is already bounded. What is *not* bounded is bytes — 30 optimized
images on a homepage view.

Three options, and I would want to measure actual transformation count and image bytes against your
real Vercel usage page before recommending one. That measurement is
**MANUAL VERIFICATION REQUIRED** — it is on your Vercel usage dashboard, not in this repository.

---

## 6. Confirmed-safe list (do not "optimise" these)

Changing any of these would cost money, break security, or undo a documented incident fix:

- `lib/prisma-database.ts:78-90` — connection cap and timeouts. Added after 55 minutes of billed
  dead compute on 2026-08-26.
- `middleware.ts:213-311` — the Grid Explorer tier gate. Reducing middleware scope must not remove
  this. `CLAUDE.md` records that this gate has gone stale three times and leaked 1,979 locked days.
- `next.config.ts:199-216` — pinned `remotePatterns`. Loosening reopens the image-proxy hole.
- `middleware.ts:322-338` — the anonymous fast paths.
- `app/api/data/[...path]/route.ts:55` — the shared-cache header. The comment records it used to be
  `private, no-store`, which was the expensive version.

---

## 7. Status

Phase 1 complete. **No code modified.** Awaiting approval before Phase 2.
