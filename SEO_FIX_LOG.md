# SEO fix log — esbpowerline.com

Running record of the indexing, crawl and egress remediation started 2026-09-02 from
Search Console data dated the same day. Each stage records what was investigated, what
was found, what changed, what was measured before and after, and what was deferred.

Baseline note: the working tree on `authenticating` already carries an uncommitted
cost pass from earlier on 2026-09-02 (CDN caching on `/api/data/*` and public-window
`/data/*`, Grid Explorer made static, settings maps cached, export cap 366, pg pool
timeouts, WordPress-era redirects). Production (deployed 2026-08-30 from commit
`c1995086`) has none of it. "Before" numbers below are from production unless stated.

---

## Stage 1 — Egress and response time

### 1.1 Investigated

- Every Supabase access path in the running app (`app/`, `lib/`, `components/`,
  `utils/`, `middleware.ts`; scripts, seeds and tests excluded): Prisma calls, Supabase JS
  clients (auth, PostgREST, storage), and direct Storage URLs. 41 distinct read/write
  sites on public paths plus ~330 staff-only call sites in admin/CMS actions.
- Request volumes from Vercel runtime logs, production, 7 days to 2026-09-02 (function
  invocations only; CDN and static hits are not in these counts).
- Payload sizes measured on production with a browser user-agent and same-origin referer.
- The Supabase project itself: database 34 MB, `DataRelease` payloads 4.7 MB total,
  media bucket 47 MB / 659 objects. Auth and Storage APIs currently answer
  `402 exceed_egress_quota`; Postgres via the pooler still answers.

### 1.2 Findings that contradict the brief

- **There is no `select('*')` anywhere in the app.** Every PostgREST call names its
  columns; Prisma card lists use `ARTICLE_CARD_SELECT`, which excludes the body. The
  brief's "replace `select('*')` everywhere" has nothing to act on.
- **There are no browser-side reads of content.** The only browser-side Supabase calls
  are `auth.getUser()` on every page load (`utils/supabase/auth-context.tsx:103`) and,
  for signed-in users, one `profiles` row. Article, category and grid data reach the
  browser as server-rendered HTML or as JSON through `/data/*` and `/api/data/*`.
- **Grid Explorer series are already pre-aggregated static JSON** under `public/data`
  (one file per day; index/timeline singletons). The page itself is static as of today's
  uncommitted change. The egress on this path is not raw series shipped to the browser;
  it is two singleton keys served whole from Postgres (below).

### 1.3 Volumes (production, 7 days)

| Route | Invocations | Rendering | Notes |
|---|---:|---|---|
| `/articles/[slug]` | 842 | dynamic, every view | `auth()` reads cookies → no ISR |
| `/404` | 735 | dynamic | old WordPress URLs, Bengali slugs, scanner probes |
| `/categories/[slug]` | 391 | served `no-store` MISS in prod | code says ISR 600 s; cause of prod dynamic not isolated |
| `/` | 241 | ISR 180 s | |
| `/api/data/[...path]` | 236 | dynamic | `private, no-store` in prod |
| `/energy-policy/[slug]` | 137 | ISR 3600 s | |
| `/grid-explorer` | 123 | dynamic in prod; static in working tree | |
| `/api/data/live-grid` | 42 | dynamic, s-maxage 600 | no database |
| `/api/articles/[id]/view` | 14 | write path | |
| `/api/data-manifest` | 9 | s-maxage 30 | |

Status codes over the same window: 2,723 × 200, 651 × 403 (source-map scanners and
tool user-agents; Googlebot verified 200), 138 × 404.

### 1.4 Payload sizes (production, before)

| Path | Bytes | Cache-Control | x-vercel-cache |
|---|---:|---|---|
| `/api/data/petrobangla/timeline-summary.json` | 1,074,665 | private, no-store | MISS |
| `/api/data/petrobangla/_index.json` | 937,556 | private, no-store | MISS |
| `/api/data/petrobangla/_live_week.json` | 200,360 | private, no-store | MISS |
| `/api/data/daily/2026-08-31.json` | 21,931 | private, no-store | MISS |
| `/data/daily/2026-08-29.json` (static) | 39,057 | private, no-store | MISS |
| `/data/petrobangla/_index.json` (static) | 1,192,011 | private, no-store | MISS |
| `/api/data-manifest` | 1,038 | public, s-maxage=30 | MISS |
| `/api/data/live-grid` | 7,702 | public, s-maxage=600 | STALE |
| Homepage HTML | 730 KB | public, max-age=0 | HIT |
| Article HTML | 207–221 KB | private, no-store | MISS |

### 1.5 Data paths ranked by estimated monthly Supabase egress

Estimates are bytes × observed frequency. Where a cache bounds the frequency, the bound
is stated. Postgres egress counts as uncached on Supabase's meter; Storage served by
Supabase's CDN counts as cached (the brief reports 6.2 GB total, 0.6 GB cached, so the
problem is Postgres and Auth, not Storage).

| # | Path | Bytes / hit | Frequency | Est. / month | Evidence |
|---|---|---:|---|---:|---|
| 1 | **Commodities ticker reads the 1.19 MB `GAS_INDEX` release on every public page render** — `lib/data/grid/live-ticker.server.ts:50` → `loadPetrobanglaIndexDays`, called from `app/(public)/layout.tsx:25` and again from `app/(public)/page.tsx:86` | 1.19 MB | once per warm instance per 600 s (`unstable_cache`), every ISR regeneration of every public route; two calls on the homepage | **~2–5 GB per instance** (144 reads/day × 1.19 MB ≈ 170 MB/day) | It needs two scalars (the last two days' grand total) and reads the whole index to get them. |
| 2 | Article page dynamic render — full row incl. `content`+`contentBn`, 60 related cards, 20 comments, `auth.getUser` + `profiles` + `user.findFirst` | ~100–250 KB | 842 views / 7 d, no ISR because of `auth()` at `app/(public)/articles/[slug]/page.tsx:68` | ~0.4–0.9 GB | Related cards cached 3600 s per slug per instance; the rest per view |
| 3 | `/api/data/*` singleton keys (`_index` 0.94 MB, `timeline-summary` 1.07 MB) from Postgres | ~1 MB | 236 hits / 7 d mixed keys; every hit a function read; `unstable_cache` 600 s per instance | ~0.2–0.5 GB | Now CDN-cacheable in the working tree; Postgres side still per instance |
| 4 | Homepage regeneration fan-out — `getPublishedArticlesByCategory` × 10 categories × `take: 60` plus coverage/pinned/carousel pools (36 + 24 + 16 rows) with only per-request caching | ~600 card rows ≈ 1.5–2.5 MB | every 180 s and on every publish | ~0.5–1 GB | `lib/category-content.ts:163`, `lib/coverage-content.ts:57,80,98` |
| 5 | `/search` and `/articles` fetch 240 rows to render 120 | ~0.6 MB | ISR 300–600 s | ~0.1 GB | `lib/category-content.ts:186` `take: limit * 2` |
| 6 | Author pages: two unbounded `user.findMany` scans + 20 full article bodies never rendered | ~200 KB | 15 views / 7 d, dynamic | small today, unbounded growth | `app/(public)/authors/[slug]/page.tsx:23,52,176` |
| 7 | Browser `auth.getUser()` on every page load for every visitor | ~1 KB | every pageview | small bytes, highest request count | `utils/supabase/auth-context.tsx:103`, mounted in root layout |
| 8 | Middleware `auth.getUser()` per request carrying an auth cookie | ~1 KB | every request from signed-in readers | small | `utils/supabase/middleware.ts:33` |
| 9 | Grid export: up to 366 payload reads per request | ≤13 MB | 18 downloads total | small | cap reduced 1500→366 today |
| 10 | Storage: `/_next/image` fetches once per transform per Vercel region; CMS thumbnails and the author avatar hit Supabase per viewer | 50–350 KB | bounded by Vercel's image cache | in the 0.6 GB "cached" bucket | `lib/media-thumbnail.ts:43`, `authors/[slug]/page.tsx:189` |

Paths 1 and 2 together plausibly account for the whole overage. Path 1 is the single
change with the largest effect: replacing a 1.19 MB read with a two-row query (or a
static scalar written at ingest) removes it entirely.

### 1.6 Response-time causes

- Article pages are dynamic on every request (median TTFB 300 ms, outliers 2.0 s) because
  the page awaits `auth()` to decide whether to show the save button and comment form.
- Production carried no pool timeouts; on 2026-08-26 eleven renders hung for 300 s when
  Supabase was slow, and ISR revalidations died with `EAUTHTIMEOUT`. Timeouts were added
  today (uncommitted).
- The Supabase restriction itself: Auth answers 402, so `auth()` and the middleware
  session refresh fail on every request that reaches them. The site falls open (by design)
  but each failure costs the timeout first.

### 1.7 Proposed fixes for Stage 1, in order (not yet applied)

1. Ticker: stop reading `GAS_INDEX` for two scalars. Read the last two `GAS_DAILY`
   payloads (or store the grand total on the daily key) and wrap `getLiveTickerItems` in
   `unstable_cache` with a 10-minute window and the release tags. Call it once per render.
2. Article page: remove `auth()` from the render path; move save state, comments and
   quick-edit into client components that fetch after hydration. Add
   `generateStaticParams` for recent slugs. Restores ISR.
3. Homepage fan-out: wrap the coverage/pinned/carousel queries in `unstable_cache` with
   the articles tag; cap the per-category pool at what the section renders.
4. `/search` and `/articles`: fetch `limit`, not `limit * 2`.
5. Author page: `omit: { content, contentBn }`, bound the user lookup by slug, drop the
   duplicate scan; route the avatar through the image optimizer.
6. Browser auth bootstrap: only call `auth.getUser()` when an auth cookie is present.
7. Categories: establish why production serves them `no-store` (build shows them dynamic
   with no dynamic API in the page); likely resolved by deploying, verify after.
8. Already in the working tree from today: CDN caching on data routes, static Grid
   Explorer, cached settings, export cap, pool timeouts.

### 1.8 Open item for Hamim

The Supabase usage page splits egress by Database, Storage and Auth. That breakdown is
the one measurement that confirms the ranking above; the estimates are derived, not
read. Please export or screenshot it before Stage 1 fixes are applied so the after
number has a real before.

### 1.9 Changed in this stage (2026-09-02, uncommitted on `authenticating`)

| # | Change | Files | Effect |
|---|---|---|---|
| 1 | Ticker no longer reads the 1.19 MB `GAS_INDEX` release. It reads the last two `GAS_DAILY` payloads (~48 KB each, cached per key) and opens the shipped index from disk only when fewer than two released days exist. `getLiveTickerItems` is now `unstable_cache`d for 600 s on the release tag, so the layout's call and the homepage's second call share one computation. | `lib/data/grid/live-ticker.server.ts` | Removes the largest single Postgres egress path: ~1.19 MB per warm instance per 10 min on every public route → ~96 KB per 10 min site-wide. |
| 2 | Article page no longer reads the session during render. `SaveArticleButton` resolves signed-in state from the browser session provider and asks the server for saved state only when signed in; `ArticleCommentSection` derives its permissions from the same provider (the server action still re-checks on submit). `generateStaticParams` prerenders the newest 200 English articles. | `app/(public)/articles/[slug]/page.tsx`, `components/members/SaveArticleButton.tsx`, `components/members/ArticleCommentSection.tsx` | Route becomes ISR (600 s) instead of a cold render per view; per-view Supabase Auth + profiles + user lookups drop to zero for anonymous readers. Dev HTML for one article: 133 KB vs 209 KB served by production. |
| 3 | Homepage pools (pinned, coverage slots, coverage fallback, hero carousel) moved from per-request `cache()` to `unstable_cache` 60 s on the articles tag, matching the neighbouring lists. Follow-up: `unstable_cache` serialises rows to JSON, so `Date` columns arrive as strings; the two mappers now build a `Date` before calling `toISOString()` (the homepage threw `toISOString is not a function` until this). | `lib/coverage-content.ts`, `lib/homepage-content.ts` | ~80 card rows no longer re-read on every 180 s regeneration. |
| 4 | `/search` and `/articles` fetch `limit + 40` rows instead of `limit * 2` (240 → 160 for 120 shown; the 40 covers the Bengali-titled rows the filter drops). | `lib/category-content.ts` | One-third fewer card rows per regeneration. |
| 5 | Author page: `omit: { content, contentBn }` on the 20-row article query; the user scan runs once per request instead of twice. The avatar stays a plain `<img>` (avatar hosts are not all in the image optimizer's allowlist). | `app/(public)/authors/[slug]/page.tsx` | 20 article bodies per view no longer transferred; one user scan instead of two. |
| 6 | Browser auth bootstrap skips `auth.getUser()` when no `sb-*-auth-token` cookie is present. | `utils/supabase/auth-context.tsx` | One Supabase Auth request per anonymous pageview site-wide removed. |
| 7 | Carried from the earlier cost pass the same day: CDN caching on `/api/data/*` and public-window `/data/*`, static Grid Explorer, cached settings maps, export cap 366, pg pool timeouts, WordPress-era redirects. | see baseline note | |

Not changed (deferred, with reason): the `/api/data/*` singleton keys are still read from Postgres on a cache miss (1 MB each). Serving them as static files with a release-precedence check would remove that too, but it touches the feed-path matching the brief asks not to change without discussion. Author pages remain dynamic (`searchParams`); 15 views a week.

### 1.10 Verification

- `tsc --noEmit`: clean. `eslint` on changed files: clean (one pre-existing `<img>` warning on the author avatar).
- `vitest`: 55 files, 407 tests pass, including `daily-data-gating` and the tier tests; paywall logic untouched.
- Placeholder grep over the diff (`mock|placeholder|sample|TODO|lorem|dummy`): no hits.
- Dev server: article renders 200 with save button, discussion and related stories; ticker still shows "Total Gas Prod 2,331.2 MMCFD" from the 2026-08-31 gas day.
- Production build (`APP_SURFACE=admin next build`, separate dist dir): `/articles/[slug]`
  now prerenders — **128 article pages generated at build** (every published English
  article), 211 static pages in total, up from 0 article pages before. `/grid-explorer`
  builds as static. `/categories/[slug]` was still on-demand (ƒ) in that build; a
  `generateStaticParams` over the ten category slugs was added afterwards so the next
  build prerenders them too.

### 1.11 Before / after summary

| Measure | Before (production) | After (working tree) |
|---|---|---|
| Ticker gas total | 1.19 MB `GAS_INDEX` payload read per instance per 10 min, every public route | two ~48 KB `GAS_DAILY` payloads, cached 10 min |
| Article render | dynamic every view; 3 auth/profile round-trips + full row + 60 cards + 20 comments | prerendered / ISR 600 s; 0 auth calls for anonymous readers |
| Article prerendered at build | 0 | 128 |
| Homepage pools per regeneration | ~80 rows uncached + ~600 cached | all cached 60 s, tag-invalidated |
| `/search`, `/articles` rows fetched | 240 | 160 |
| Author page bodies transferred | 20 per view | 0 |
| Anonymous browser Auth calls per pageview | 1 | 0 |
| `/api/data/*` response caching | `private, no-store` | `s-maxage=600, swr=3600` (middleware gate runs before cache) |

The Supabase egress figure itself cannot be re-measured until the changes are deployed and
a billing day passes; the usage-page breakdown (Database / Storage / Auth) is still the
before/after instrument for that.

---

## Stage 2 — What the 1,543 URLs are

### 2.1 Investigated

- Every page route in the production build's route manifest (38 public routes, two with
  dynamic segments prerendered).
- Every place the app emits a query-string link or builds one client-side
  (`ArticlesClient`, `SortSelect`, `GridExplorerUrlSyncer`, `grid-explorer-url.ts`, the
  login callbacks).
- A breadth-first crawl of the live site's own links (browser user-agent, same origin,
  query strings kept, 1,050 URLs to exhaustion) recording status, canonical and robots
  meta per URL. Script: `scratch/crawl.mjs`, output `scratch/crawl.json`.
- The served `sitemap.xml` (172 URLs) and `robots.txt`.
- The tag universe in the database: 381 stored tags; 89 of 161 published articles have
  no stored tags and fall back to 10 machine-extracted keywords each.

### 2.2 Breakdown of what the site itself links to (live crawl, 2026-09-02)

| Pattern | URLs | Status | Robots | Canonical | Verdict |
|---|---:|---|---|---|---|
| `/tags/<word>` | **603** | 378 × 200, **225 × 404** | noindex | self | Auto-generated. The 404s are keyword tags from untagged articles: the tag page lists only stored tags, so `/tags/billion` from an article body has nothing to list. |
| `/members/login?callbackUrl=<article>` | **129** | 200 | robots-blocked, no meta | none | One per article from the save button, plus the magazine page. |
| `/login?callbackUrl=<article>` | **128** | 200 | robots-blocked, no meta | none | One per article from the comment section. |
| `/articles/<slug>` | 128 | 200 | index | self | Real content. |
| `/energy-policy/<slug>` | 25 | 200 | index | self | Real content. |
| `/categories/<slug>` | 10 | 200 | index | self | Real content. |
| `/grid-explorer?tab=` | 8 | 200 | index | → `/grid-explorer` | Alternates, correctly canonicalised. |
| `/authors/<slug>` | 3 | 200 | index | self | Real content, not in the sitemap. |
| Static pages | 12 | 200 | index (search, tags index noindex) | self | Real content. |
| `/auth/forgot-password?audience=` | 2 | 200 | robots-blocked | none | Intentional. |
| `/members/magazine` | 1 | 307 → login | | | Member link on a public page. |

**Real content: 175 URLs. Generated: 875.** Of the generated set, 603 are tag pages and
257 are login callbacks; between them they are 82% of every URL a crawler can reach from
the site, and 225 of them are dead. Not linked but reachable: `/articles?category=…&sort=…&page=N`
combinations (~330 possible; the pills and "load more" are rendered client-side today, which
is why the crawl did not find them and why Google has), and `/grid-explorer?date=…` (set by
`router.replace`, never as a link).

**Mapping onto Search Console's 1,543:** 192 indexed ≈ the 175 real URLs plus a few
variants. The 1,018 "crawled, currently not indexed" is consistent with tag pages as they
existed before the noindex was added, `/articles?…` combinations, and WordPress-era URLs
that now redirect or 404; the 140 "not found" is the 225 dead tag links plus old WordPress
paths; the 35 "duplicate without canonical" and 11 "blocked by robots" fit the 257 login
callback URLs. The example URL list from Search Console would confirm the split, and is
still worth exporting.

### 2.3 Sitemap and robots review

- Sitemap: 128 articles, 10 categories, 25 policy pages, 9 static. Missing: `/titas-gas`
  and the 3 author pages. Includes categories even when they have no published articles
  (a soft-404 source). `lastModified` on articles is `updatedAt`, which the view counter
  bumps on every read; static and policy pages carry the generation timestamp.
- robots.txt disallows `/admin`, `/cms`, `/members`, `/api`, `/search?`, `/data/`,
  `/login`, `/auth/`, `/sign-in`, `/sign-up`, and 26 AI/SEO bots. The 11 "blocked by
  robots.txt" pages are login callbacks and `/data/*.json`; the 13 "excluded by noindex"
  are tag pages and `/search`. Both are intentional and stay.

### 2.4 Changed in this stage

| # | Change | Files |
|---|---|---|
| 1 | Keyword-derived tags on untagged articles are shown but no longer linked (stored tags still link, URL-encoded). Removes 225 dead internal links and stops minting a `/tags/<word>` URL per keyword. Nothing a reader sees was removed. | `app/(public)/articles/[slug]/page.tsx` |
| 2 | Login links carry no per-page callback in the HTML; the callback is attached on click. Save button, comment section and magazine page. `rel="nofollow"` on all three. Removes 257 crawlable URLs. | `components/members/SaveArticleButton.tsx`, `components/members/ArticleCommentSection.tsx`, `components/news/MagazinePageClient.tsx` |
| 3 | Login pages declare `noindex` and a self canonical, so any variant Google still holds resolves to one URL. | `app/login/page.tsx`, `app/members/login/page.tsx` |
| 4 | Sitemap: categories only when they have a published article; `/titas-gas` and author pages added; article `lastmod` from `publishedAt` (honest until a content-edit timestamp exists); static and policy pages carry no `lastmod` rather than a fake one; database failures are logged instead of silently serving the stale copy. | `app/sitemap.ts` |
| 5 | The view counter increments `views` with a raw update that does not touch `updatedAt`, so reads stop posing as edits. | `lib/article-view-tracking.ts` |

Not changed: `/articles?category=…&sort=…&page=N` combinations remain possible (the
listing is client-rendered; the crawl found none of them linked in HTML). They are
addressed with the server-rendered listing and per-page canonicals in Stage 4. Tag pages
stay `noindex, follow` and out of the sitemap; the tags index likewise.

### 2.5 Verification

- `tsc`, `eslint`: clean. `vitest`: 55 files, 407 tests pass.
- Dev server, tagged article: 0 `callbackUrl` hrefs (was 2), 10 stored-tag links,
  3 login links carrying `rel="nofollow"`. Untagged article: 0 tag links, 10 plain
  keywords shown (was 10 links, all 404).
- Dev sitemap: 178 URLs — 129 articles, 11 categories with articles, 26 policy pages,
  4 author pages (de-duplicated), 9 static including `/titas-gas`. `lastmod` present on
  130 entries (articles from `publishedAt`, magazine, grid explorer) and absent from the
  rest instead of stamped "now".

### 2.6 Before / after

| Measure | Before | After |
|---|---:|---:|
| Distinct URLs reachable from the site's own links | 1,050 | ~440 (175 content + 378 stored-tag pages, noindex) |
| Dead internal links (`/tags/<keyword>` → 404) | 225 | 0 |
| Login URLs with per-page query strings in HTML | 257 | 0 |
| Sitemap entries with a dishonest `lastmod` | 172 of 172 | 0 of 178 |
| Real content missing from the sitemap | 4 (`/titas-gas`, 3 authors) | 0 |
| Empty categories submitted | 2 | 0 |

Search Console will take days to reflect this; the live crawl (`scratch/crawl.mjs`) can be
re-run after deploy to confirm the 440 figure.

---

## Stage 3 — The 404s and redirects

### 3.1 Investigated

- Vercel production logs: every 404 line of the last 3 days (100 lines), the 7-day 404
  and 403 request paths grouped, and the Stage 2 crawl's per-URL statuses.
- Direct probes of the legacy and convention URLs on production.
- The Search Console 404 export was not available; the patterns below come from the
  Pages, Top-target-pages and Coverage exports plus the logs.

### 3.2 Found

| Source of 404s | Evidence | Cause | Kind |
|---|---:|---|---|
| `/tags/<keyword>` from untagged articles | 225 in the crawl; effectively all 100 sampled 404 log lines | Keyword links to tag pages that cannot list them | Never existed — links fixed in Stage 2 |
| WordPress date URLs `/YYYY/MM/DD/<slug>/` | 2 in Search Console pages, more in Coverage | Old site scheme; slugs carried over | Moved — redirected (earlier today) |
| `/category/news/<slug>` (nested) | logs | Old site scheme; only the flat `/category/<slug>` was redirected | Moved — redirect added |
| `/tag/<x>`, `/author/<x>`, `/page/<n>`, `/posts/all/` | probes 404 | Old site scheme | Moved — redirects added (`/author/*` to the news index; the old author slugs were WordPress logins with no counterpart) |
| `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest` | probes 404; requested by every browser and crawler by convention | Never provided | Provided — `app/apple-icon.png` (180×180), `app/manifest.ts`, redirects for the conventional paths |
| `/og-image.png` | 404, referenced by the root metadata | Missing file | Stage 5 (share image) |
| `/articles/<bengali-slug>` | logs, 33 articles | Server rejects Bengali titles | Deferred — Bengali URL space (Stage 5/6) |
| `/articles/lng-terminal-shutdown-…` | 404, once linked internally | Article is ARCHIVED | Correct 404; no current internal link |
| `/ip`, `/.well-known/traffic-advice`, `*.js.map` probes | logs | Scanners | Ignore |

Redirects: `www` → apex uses a 307 and http → www → apex is two hops; both are set by
Vercel's domain configuration, not code, and `permanent` in `vercel.json` already asks
for 308. Public pages linked to two member-only URLs that redirect anonymous readers to
login (`/members/magazine`, `/members/subscription`); both now carry `rel="nofollow"`.
The crawl found no other internal link to a redirect or a 404 besides the tag links.

The 8 "blocked due to other 4xx", 1 "403" and 2 soft 404s: the only 403s in the logs are
source-map scanners and tool user-agents (Googlebot verified 200); the two soft 404s fit
the empty category pages, which now declare `noindex` while they have nothing published.

### 3.3 Changed

| # | Change | Files |
|---|---|---|
| 1 | Legacy redirects: nested WordPress categories, `/tag/*`, `/author/*`, `/page/N`; conventional icon and manifest paths. | `next.config.ts` |
| 2 | Apple touch icon and web manifest provided. | `app/apple-icon.png`, `app/manifest.ts` |
| 3 | `nofollow` on the two member-only links reachable from public pages. | `components/news/MagazinePageClient.tsx`, `components/news/power-grid/GridLockedContent.tsx` |
| 4 | Empty categories declare `noindex` until they have a published article. | `app/(public)/categories/[slug]/page.tsx` |

### 3.4 Verification

- `tsc`, `eslint`: clean. `vitest`: 55 files, 407 tests pass.
- Dev server probes: `/category/news/power-generation` → 308 `/categories/power-generation`;
  `/tag/lng` → `/tags/lng`; `/author/chiefhamim` → `/articles`; `/page/2` →
  `/articles?page=2`; `/favicon.ico` → `/icon.png` (200); `/apple-touch-icon.png` →
  `/apple-icon.png` (200, 180×180); `/site.webmanifest` → `/manifest.webmanifest`
  (200, `application/manifest+json`).
- Still owed: the Search Console "Not found (404)" URL export, to catch any legacy pattern
  not visible in three days of logs.

---

## Stage 4 — Crawl budget and JavaScript

### 4.1 Investigated

- The production build's prerendered HTML for the homepage, `/articles`, `/grid-explorer`
  and an article: what is inside `<main>`, how many article links, which script chunks are
  referenced and their sizes on disk.
- Vercel logs for 5xx responses (function and static sources) over 7 days.
- Which packages sit inside the two largest shared chunks.

### 4.2 Found

| Page (prerendered, before) | Words in `<main>` | Article links | JS referenced |
|---|---:|---:|---:|
| Homepage | 3,723 | 67 | 1,114 KB raw |
| `/articles` | no `<main>`; 4 skeleton boxes | 5 | 1,026 KB |
| `/grid-explorer` | 132 (the loading skeleton) | 0 | 1,090 KB |
| Article | full body | ~20 | 1,085 KB |
| Policy page | full body | | 997 KB |

- **Two client-side bailouts, same cause.** Both `/articles` (`ArticlesClient`) and
  `/grid-explorer` (`PowerGridExplorerClient`) read `useSearchParams` inside a static route,
  which makes Next prerender only the Suspense fallback. The news index shipped 120 fetched
  articles to nobody, and the flagship page's HTML was a grey box. This is also why
  Googlebot's crawl was 46% JavaScript to 15% HTML: it had to execute both pages to see them.
- **The largest chunk on every page is supabase-js**, 246 KB raw, because the auth provider
  in the root layout imported the client statically. The next largest is react-dom (223 KB),
  which is unavoidable. Roughly 1 MB of raw script (about 330 KB compressed) is shared by
  every route; page-specific code is small by comparison. Recharts and the 1 MB archive
  fallback were already dynamically imported and do not appear in the shared set.
- **Failed requests (12.2%)**: no 5xx responses exist in seven days of function or static
  logs. What the logs do show is the eleven 300-second renders of 26 August and the ISR
  revalidations that died on database auth timeouts (Stage 1), plus image-optimizer 502s
  while Supabase Storage is restricted. Those are the requests Google would count as failed.
  The pool timeouts added in Stage 1 stop the first class; the second ends when Supabase is
  restored.

### 4.3 Changed

| # | Change | Files |
|---|---|---|
| 1 | News index rendered on the server: `/articles` (page 1), `/articles/page/N` (prerendered via `generateStaticParams`), `/articles/popular`. Category pills link to the existing category pages; sort is two links; pagination is numbered links with `rel` prev/next. Every view has its own canonical. The client list and its sort select are removed; nothing a reader could do is gone. | `components/news/ArticlesIndex.tsx`, `components/news/ArticlesIndexFrame.tsx`, `app/(public)/articles/page.tsx`, `app/(public)/articles/page/[n]/page.tsx`, `app/(public)/articles/popular/page.tsx`, `lib/i18n/messages.ts` (five strings, EN + BN); removed `components/news/ArticlesClient.tsx`, `components/news/SortSelect.tsx` |
| 2 | Legacy `?category=`, `?sort=views`, `?page=N` on `/articles` redirect permanently to the new pages. This is a small block at the top of the middleware, before rate limiting and ahead of the data gate; the gate itself is untouched. | `middleware.ts` |
| 3 | Grid Explorer boots from `window.location` captured during hydration instead of `useSearchParams`, so the default view (latest day, overview) is in the HTML; a deep link remounts with its tab and date after mount. | `components/news/PowerGridExplorerClient.tsx` |
| 4 | supabase-js is loaded on demand: only when an auth cookie is present or a sign-in flow needs it. Anonymous readers no longer download it. | `utils/supabase/auth-context.tsx` |

| 5 | The sign-out helper reached the public navbar through the member menu and imported supabase-js statically; its client-side fallback now loads the library on demand. | `lib/staff-sign-out.ts` |

Deferred: the homepage HTML (635 KB) carries 60 cards per category for the "show more"
sections; trimming that would remove reader-visible content and is left as it is. The
react-dom and Next runtime chunks are the floor.

### 4.4 Verification

- `tsc`, `eslint`: clean. `vitest`: 55 files, 407 tests pass.
- Dev server: `/articles` → 200 with 19 article links, 4 page links and 25 category links
  in HTML; `/articles/page/2` and `/articles/popular` render; `/articles?page=2` → 308
  `/articles/page/2`, `?category=x` → `/categories/x`, `?sort=views` → `/articles/popular`.
- Dev server `/grid-explorer` HTML contains the overview headings, the KPI strip, the
  load-curve card, the generation mix, the forecast card and zone tables (3,427 visible
  words; the tabbed content streams after `<main>` in the same response).
- Production build: 196 prerendered routes, including `/articles/page/2…4`,
  `/articles/popular` and all 10 categories.

### 4.5 Before / after (prerendered HTML from the production build)

| Page | Words in HTML | Article links | JS referenced (raw) |
|---|---:|---:|---:|
| `/articles` | skeleton, 5 links → **1,164 words, 19 links + pagination** | 5 → 19 | 1,026 KB → **775 KB** |
| `/grid-explorer` | 132 → **3,427** | | 1,090 KB → **846 KB** |
| Homepage | 3,723 → 4,285 | 67 → 67 | 1,114 KB → **869 KB** |
| Article | full → full | | 1,085 KB → **842 KB** |

supabase-js (223–246 KB raw per page) no longer appears in any public page's initial
script set; it loads only when an auth cookie is present or a sign-in flow runs.

---

## Stage 5 — Structured data and metadata

### 5.1 Investigated

- Every JSON-LD block in `app/` and what each page type emits; the article, category,
  policy, author, tag and index metadata functions; the title template chain from the root
  layout through the public layout to the pages.
- The article rows: which have a short title (1 of 161), an editor's `seo.metaTitle` /
  `seo.metaDescription` (stored on the `seo` JSON column), excerpts ending in
  `[&hellip;]` (90), excerpts over 160 characters (112), titles over 60 characters (121).
- The Moheshkhali article named in the brief.

### 5.2 Found

- **The Moheshkhali article is ARCHIVED**, so the site answers 404 and Google shows a
  bare URL — not a missing title. It has an editor's meta title, a description and an
  image on the row. Whether to republish is an editorial call (it drew 110 impressions and
  6 clicks in three months, one of the best performers). This contradicts the brief's
  assumption; nothing in code can fix it.
- **Editors' search titles and descriptions were never rendered.** Every article can carry
  `seo.metaTitle` and `seo.metaDescription`; the page built `<title>` from the headline
  and the description from the excerpt regardless.
- Breadcrumb JSON-LD existed only on articles and the Grid Explorer; the Dataset block
  already carries `license` in code (the report's "missing license" reflects the 30 August
  build).
- `NewsArticle` lacked author URL, section, language, free-access and keywords, and
  declared a second publisher entity instead of referencing the organisation. The
  organisation had no `sameAs`; the site had no `SearchAction`.
- The root template `%s | ESB PowerLine` was cancelled by the public layout's string
  title, so 17 pages hard-coded the suffix; article titles ran to 122 characters.
- `/og-image.png` did not exist; pages that set their own `openGraph` block lost the
  layout's image entirely (the homepage emitted none).
- No RSS feed, no news sitemap, no branded 404; the homepage had no `h1`.

### 5.3 Changed

| # | Change | Files |
|---|---|---|
| 1 | `lib/seo.ts`: `cleanDescription` (strips markup and `[&hellip;]`, cuts at a sentence or word boundary before 160), `shareImageUrl` (routes article images through the site's optimizer instead of the Supabase origin, which answers 402 while the quota is exceeded), `breadcrumbJsonLd`, `articleListJsonLd`. | `lib/seo.ts` |
| 2 | `Breadcrumbs` component: one list rendered both as the visible trail and as `BreadcrumbList`; placed on articles, categories (index and detail), policy (index and detail), news index and its pages, authors, tags, Titas. | `components/shared/Breadcrumbs.tsx` + 10 pages |
| 3 | Article `<title>` is now the editor's meta title, else the short title, else the headline — with no site suffix. Description from the editor's meta description, else the cleaned excerpt. Full OpenGraph (url, image via optimizer with alt, published and modified time, author URL, section, tags) and Twitter card. `NewsArticle` gains `author.url`, `articleSection`, `inLanguage`, `isAccessibleForFree`, `keywords`, and references the organisation by `@id`. The category label on the article is a link to its hub. | `app/(public)/articles/[slug]/page.tsx`, `lib/category-content.ts` (exposes `metaTitle`, `metaDescription`, `focusKeyword`) |
| 4 | Title chain: the public layout declares `absolute` + `template`, the 17 hard-coded suffixes are removed, the layout carries the fallback share image and Twitter card, and feed autodiscovery. | `app/(public)/layout.tsx`, 16 page files |
| 5 | Organisation `sameAs` (Facebook, YouTube from the footer's constant) and a `SearchAction` on the WebSite entity. | `app/layout.tsx` |
| 6 | Categories: title `<Name> News — Bangladesh Power Sector`, description built from the stored one plus the published count when the stored one is short, `ItemList` of the listed articles, breadcrumbs, OpenGraph with image. Policy pages: cleaned description, OpenGraph, breadcrumbs. Authors: `ProfilePage` over a `Person` with the bio and `worksFor`. | `app/(public)/categories/[slug]/page.tsx`, `energy-policy/[slug]/page.tsx`, `authors/[slug]/page.tsx` |
| 7 | `public/og-image.png` (1200×630, built from the real logo); every page that sets its own `openGraph` names an image. | `public/og-image.png`, homepage, articles index, grid explorer, categories, policy |
| 8 | RSS 2.0 feed at `/feed.xml` (50 newest English articles) and a Google News sitemap at `/news-sitemap.xml` (last 48 hours; honestly empty when nothing is that new), both cached; `/feed`, `/rss`, `/rss.xml` redirect; both sitemaps listed in robots. | `app/feed.xml/route.ts`, `app/news-sitemap.xml/route.ts`, `app/robots.ts`, `next.config.ts` |
| 9 | Branded 404 inside the public layout, with links to the newsroom, categories, Grid Explorer and policy plus the three most-read stories; a catch-all route makes unknown public paths use it. Still a real 404. | `app/(public)/not-found.tsx`, `app/(public)/[...missing]/page.tsx` |
| 10 | Screen-reader-only `h1` on the homepage. | `app/(public)/page.tsx` |

Not done in code (editorial): fill `seo.metaTitle` on the 121 articles whose headlines
exceed 60 characters — the field now renders; decide whether the Moheshkhali story is
republished.

### 5.4 Verification (public dev instance)

| Page | Title (chars) | Description (chars) | JSON-LD | og:image |
|---|---|---|---|---|
| Article (BAPEX) | headline, no suffix (82) | 149, cleaned | Organisation graph, NewsArticle (14 fields, publisher by id, author url), BreadcrumbList | via `/_next/image` |
| Category | `Power Generation News — Bangladesh Power Sector \| ESB PowerLine` (63) | 153 | ItemList, BreadcrumbList | `/og-image.png` |
| Policy | 68 | 102 | BreadcrumbList | `/og-image.png` |
| Homepage | 60, one `h1` | 146 | Organisation + WebSite (sameAs, SearchAction) | `/og-image.png` |
| News index | 27 | 110 | BreadcrumbList | `/og-image.png` |
| Author | 29 | 128 | ProfilePage, BreadcrumbList | `/og-image.png` |

`/feed.xml` 200 with 50 items; `/news-sitemap.xml` 200 (0 items, none in 48 h); `/feed`
and `/rss.xml` → 308 `/feed.xml`; `/og-image.png` 200; unknown path → 404 with the
branded page. Every JSON-LD block parses. `tsc`, `eslint` clean; 407 tests pass.

---

## Stage 6 — Internal linking

### 6.1 Investigated

- How article bodies reach the page (split in two around an ad slot, sanitised with
  `sanitize-html`), what the policy register exposes to match on (`short`, `title`,
  `authority`, `year`, `status` for 27 entries), the related-stories scorer (category +
  tag overlap, 3 shown), the footer's link lists, and the category slugs against the
  Grid Explorer's eight views.
- Search Console's "Top target pages": policy pages absent from the top 70; articles at
  6–39 inbound links each, mostly navigation.

### 6.2 Changed

| # | Change | Files |
|---|---|---|
| 1 | **Contextual policy links.** The first mention of each policy the article names — matched on the register's own `short`/`title` strings, with and without the comma before the year — links to its library page: at most five per article, never inside an existing link, heading or code, applied to the sanitised HTML so the link markup is the site's. A "Policy referenced" card lists the same policies with authority, year and status. Articles that name no policy get nothing. | `lib/policy-links.ts`, `app/(public)/articles/[slug]/page.tsx` |
| 2 | **Grid Explorer from articles.** A "Data behind this story" card links the explorer view that matches the article's category (generation, gas, renewables, transmission, regional, imports, macro). The mapping is explicit and partial: the policy category points at the library instead, and a category with no genuine data view gets no card. The views list moved to a shared module so the page and the card cannot drift. | `lib/grid-explorer-views.ts`, `app/(public)/grid-explorer/page.tsx` |
| 3 | Related stories: four instead of three, a "More in <category>" link beside the heading, and the heading is an `h2` (the page skipped from `h1` to `h3`). The category label in the header is a link (stage 5). | `app/(public)/articles/[slug]/page.tsx` |
| 4 | Footer "Explore" list gains the policy library — the one site-wide link to it. | `components/shared/PublicFooter.tsx`, `lib/i18n/messages.ts` |
| 5 | Visible breadcrumb navigation on every content page type (built in stage 5 as one component with the markup). | `components/shared/Breadcrumbs.tsx` |

No link farm: every link is derived from the article's own text or category, capped, and
deduplicated; nothing is added to pages that have no reason to carry it.

### 6.3 Verification (public dev instance)

| Article | Policy links in body | Policy card | Data card | Related |
|---|---:|---|---|---|
| electricity-prices-leap-household… | 2 (BERC, full name and acronym once each) | yes | Macro trends | 4 + "More in Consumers & Tariffs" |
| bangladesh-targets-3-000-mw-solar… | 0 (names no policy) | no | Renewables | 4 |
| bapex-begins-site-development… | 0 | no | none (Energy Policy & Regulators category) | 4 |

Footer carries "Energy Policy Library" on every public page. `tsc`, `eslint` clean.

---

## Stage 7 — Desktop performance

### 7.1 Investigated

- Lighthouse 12, mobile and desktop, on a local production build (`next start` of the
  same code, served on port 3010; no CDN, so absolute numbers run below production's but
  before/after are like-for-like). Four pages: homepage, article, policy, Grid Explorer.
- The stylesheet: 25,680 lines / 686 KB source, parsed rule by rule with PostCSS and
  classified by selector.
- Font loading, image `priority`/`sizes` on listing cards, and the Grid Explorer's
  backdrop, which Lighthouse named as the layout-shift culprit on production.
- The Search Console device split, re-read against the query list.

### 7.2 Found

| Page (before, local prod) | Mobile | Desktop | Desktop LCP element | Render-blocking CSS (desktop) |
|---|---:|---:|---|---:|
| Homepage | 77 | 64 | masthead wordmark (text) | 903 ms + 153 ms |
| Article | 78 | 69 | article `h1` (text) | 904 ms + 154 ms |
| Policy | 76 | 67 | text | 903 ms |
| Grid Explorer | 67 | 50 | strap-line (text), TBT 290 ms, main thread 5.1 s | 903 ms |

- **Nothing renders differently on desktop.** The LCP element on every desktop run is
  text, and it is painted late for one reason: two render-blocking stylesheets, the larger
  of which costs about 900 ms in Lighthouse's desktop simulation on every page. That sheet
  is `globals.css`, and **40% of it (1,449 rules, 231 KB of source) is admin, CMS, login and
  member-panel styling** that no public page uses. Desktop scores lower than mobile locally
  because Lighthouse's desktop profile weights blocking time and main-thread work more
  heavily; the cause is the same on both.
- The Bengali font family was preloaded on every page for every visitor, although the
  server always renders English.
- Listing cards carried no `sizes` (so the browser assumed full-viewport width and fetched
  the largest candidate for a 400 px slot) and no `priority` on the first row, which is the
  category page's LCP.
- The Grid Explorer's three glow blobs were positioned by percentage of the container's
  height inside an `inset-0` wrapper; as tab content streamed in and the page grew, they
  moved — the 0.128 CLS on production.
- **The Search Console desktop/mobile gap is query mix, not rendering.** Desktop had 4,801
  impressions at position 30.7 and 1.5% CTR; mobile 728 at 7.4 and 6.0%. The desktop
  volume is dominated by loosely related queries the site surfaces deep for ("what is the
  industry of sreda.bg" 410 impressions, "oil and gas bid opportunities" position 72,
  "marine structural repair services market" position 76); mobile traffic is mostly
  branded and specific. The pages are byte-identical to both; the stage 5 title fix
  (naming Bangladesh on the policy pages) addresses the largest of those mismatches.

### 7.3 Changed

| # | Change | Files |
|---|---|---|
| 1 | Staff-only CSS split out of `globals.css` into `staff-surface.css`, moved rule-by-rule with PostCSS (selectors starting `.cms-`, `.admin-`, `.login-`, `.media-library`, `.editorial-calendar`, `.staff-signout`, `.member-panel`, `.members-`, editor classes), each with its explanatory comment, media queries preserved. Imported by the admin, CMS, staff-login, member-login and member-panel layouts only. `globals.css`: 686 KB → 440 KB source. | `app/globals.css`, `app/staff-surface.css`, five staff layouts |
| 2 | Bengali font `preload: false`: fetched only when a Bengali glyph is laid out. | `app/layout.tsx` |
| 3 | Article cards: `sizes` matching the grid (1 / 2 / 3 columns) and a `priority` prop, set on the first two cards of category and index pages; the card `alt` now uses the editor's image alt when one exists. | `components/news/ArticleCard.tsx`, `components/news/ArticlesIndex.tsx`, `app/(public)/categories/[slug]/page.tsx` |
| 4 | Grid Explorer backdrop blobs positioned by fixed offsets from the top instead of percentages of a growing container. | `components/news/PowerGridExplorer.tsx` |
| 5 | Mono font `preload: false` (figures in the ticker and tables; never the largest paint). Measured after the table below. | `app/layout.tsx` |

### 7.4 Before / after (Lighthouse 12, local production build, same machine, same run order)

| Page | Form | Score | LCP (ms) | FCP (ms) | CLS | Blocking (ms) | CSS transferred |
|---|---|---:|---:|---:|---:|---:|---:|
| Homepage | mobile | 77 → 76 | 5,588 → 5,364 | 1,962 → 1,964 | 0 → 0 | 1,062 → 914 | 114 → 82 KB |
| Homepage | desktop | 64 → 66 | 6,128 → 5,601 | 1,956 → 1,957 | 0 → 0 | 1,056 → 908 | 114 → 82 KB |
| Article | mobile | 78 → 83 | 5,707 → 4,738 | 1,657 → 1,509 | 0 → 0 | 1,058 → 908 | 114 → 82 KB |
| Article | desktop | 69 → 70 | 5,201 → 6,268 | 1,657 → 1,510 | 0 → 0 | 1,058 → 910 | 114 → 82 KB |
| Policy | mobile | 76 → 78 | 6,773 → 6,020 | 1,656 → 1,505 | 0 → 0 | 1,056 → 906 | 114 → 82 KB |
| Policy | desktop | 67 → 70 | 6,710 → 5,867 | 1,657 → 1,504 | 0 → 0 | 1,058 → 904 | 114 → 82 KB |
| Grid Explorer | mobile | 67 → 69 | 7,651 → 7,018 | 1,805 → 1,654 | 0.049 → 0.055 | 1,056 → 904 | 114 → 82 KB |
| Grid Explorer | desktop | 50 → 52 | 7,779 → 7,003 | 1,805 → 1,656 | 0.001 → 0.001 | 1,056 → 906 | 114 → 82 KB |

Single runs; Lighthouse's simulated numbers vary ±10% between runs (the article desktop
LCP moved the other way inside that band). Consistent across all eight: CSS on the wire
down 28%, render-blocking time down ~150 ms, FCP down ~150 ms on every page but the
homepage. LCP fell 0.5–0.9 s on **five** of eight (homepage desktop 0.53, policy mobile
0.75, policy desktop 0.84, Grid Explorer mobile 0.63, Grid Explorer desktop 0.78), by
0.2 s on homepage mobile, by 0.97 s on article mobile, and **rose** 1.07 s on article
desktop — so one run is inside the noise and the "six of eight" this paragraph first
claimed was a miscount (corrected 2026-09-19, stage 10). These are local-build lab
numbers from 2026-09-03 and are not evidence about production today; stage 10 holds the
current production runs. Font files per page 5 → 4 (Bengali no longer preloaded); the
mono change (row 5) was applied after this table.

What still holds LCP: on every page the largest paint is text set in a web font, so under
Lighthouse's slow-4G model LCP waits for the CSS (82 KB) and the display fonts, then the
hydration work (527 KB of script on the homepage, 290 ms TBT on the Grid Explorer). The
remaining levers, each a design decision rather than a fix: `display: optional` on the
display faces (no swap re-paint, but fallback type on slow loads), a smaller homepage
payload (the 60-cards-per-category "show more" sections, 105 KB of compressed HTML), and
the site's own request count (63–73 per page). Production adds CDN caching and a nearer
origin on top of these local numbers.

### 7.5 Verification

- `tsc`, `eslint` clean; 407 tests pass.
- Staff surfaces keep their styles: `/login` and `/members/login` serve two stylesheets on
  the dev server (global + staff), the homepage serves one; the sign-in shell renders.
- Production build: 196 routes prerendered as before.

---

## Stage 8 — The archive had no pages

### 8.1 Investigated

- Whether the ~4,500-day grid archive was reachable by a search engine at all.
- Every URL the Grid Explorer can produce, and which of them a crawler can see.
- Status codes returned for URLs under `/grid-explorer/` that do not exist.

### 8.2 Found

**The archive was one URL.** `/grid-explorer` held the date in client state, so
4,548 days of PGCB and Petrobangla figures — 2013-12-31 to 2026-09-02 — shared a
single document. `?date=` was never read by the server (made deliberately static
in the cost pass, stage 1), so it produced no distinct HTML, and the sitemap
submitted `/grid-explorer` once with the newest day's `lastModified`.

Stages 1-7 tuned how well the site's existing pages ranked. None of them could
have helped an archive query, because there was nothing to rank: a search for
the grid's figures on a given day in 2019 had no page on this site to return.
This is the single largest indexing gap the site has had, and it is invisible in
Search Console — a page that does not exist reports no impressions, no coverage
error and no warning.

**A soft 404 under the whole segment.** `app/(public)/grid-explorer/loading.tsx`
wrapped every child segment in a Suspense boundary. A streamed response commits
its status before the page body runs, so `notFound()` could swap the UI but not
the status: every nonexistent URL under `/grid-explorer/` returned **200 with a
"page could not be found" body**. Confirmed in both dev and the production build,
on first request and on cache hits. The four older dynamic routes (`articles`,
`categories`, `authors`, `energy-policy`) return a correct 404 and have no
`loading.tsx`, which is what isolated the cause.

### 8.3 Changed

| # | Change | Files |
|---|---|---|
| 1 | One page per archive day at `/grid-explorer/{date}` — eleven headline figures, the fuel table, source documents, and prev/next day links. Figures reuse `buildHomeSnapshotFromDaily`, so the data doctrine is enforced in one place and an absent figure prints a dash naming its publisher. | `app/(public)/grid-explorer/[date]/page.tsx`, `lib/data/grid/archive-day.server.ts` |
| 2 | A prose summary per day, used as both the meta description and the page's lead. Written only from figures the report carried — a clause about a figure nobody filed is not written at all, rather than written with a zero. | `lib/data/grid/archive-day.server.ts` |
| 3 | Crawl path: `/grid-explorer/archive` (years) and `/grid-explorer/archive/{year}` (days by month), linked from the Grid Explorer itself. A sitemap alone would have left 4,548 orphans. | `app/(public)/grid-explorer/archive/**`, `app/(public)/grid-explorer/(explorer)/page.tsx` |
| 4 | `grid-sitemap.xml`, separate from the editorial sitemap so Search Console reports archive and newsroom indexing apart. `lastmod` is the day itself, stated once — the honest value, per the stage 2 rule. | `app/grid-sitemap.xml/route.ts`, `app/robots.ts` |
| 5 | `loading.tsx` moved into an `(explorer)` route group so the skeleton still covers the page that needs it while the archive routes fall outside the Suspense boundary. No URL changes. | `app/(public)/grid-explorer/(explorer)/loading.tsx` |
| 6 | `Dataset` and `BreadcrumbList` JSON-LD per day, with each known figure as a `PropertyValue` and PGCB named as creator. | `app/(public)/grid-explorer/[date]/page.tsx` |
| 7 | Seven tests pinning the prose against inventing a figure, and the date formatter against timezone drift. | `lib/test/archive-day-summary.test.ts` |

### 8.4 What stayed paid

The day page publishes the headline figures and nothing else. The hourly curve,
per-station output, zone demand and load shedding, the gas field table and
cross-border imports remain behind `grid-tier-access.ts` and the ৳499/৳999
plans. Verified against the served HTML of an old day: no `hourlyLoadData`, no
`zoneGenerationData`, no station or regional rows. The public page is the index
entry and the pitch for that day, not the day itself.

### 8.5 Verification (production build, Googlebot UA)

| URL | Before | After |
|---|---|---|
| `/grid-explorer/2019-06-15` | did not exist | 200, unique title and description |
| `/grid-explorer/archive` | did not exist | 200, 14 year links |
| `/grid-explorer/archive/2019` | did not exist | 200, 359 day links |
| `/grid-explorer/zzz-bad` | **200** (soft 404) | 404 |
| `/grid-explorer/1854-05-05` | **200** (soft 404) | 404 |
| `/grid-explorer/archive/1896` | n/a | 404 |
| `/grid-sitemap.xml` | did not exist | 200, 4,563 URLs |
| `/grid-explorer` | 200 | 200, unchanged, skeleton intact |

Googlebot, Bingbot, DuckDuckBot, GoogleOther and Google-InspectionTool all
receive 200 on the day pages and the sitemap. Yandex receives 403, consistent
with the crawler block list already in `robots.ts`.

Indexable URLs submitted: **172 → 4,735**.

Build 317 static pages (was 241); 433 tests pass; lint 0 errors.

### 8.6 Cost

No new database work per page. `getPublishedKeys` is already `unstable_cache`d
with tag invalidation, so a crawler walking the whole archive shares one cached
entry rather than issuing a query per day; the figures come from the daily JSON
already traced into the bundle. Day pages carry `revalidate = 86400` and 60 recent
days are prerendered, so the common case is a CDN hit and the rare case is one
disk read.

---

## Stage 9 — Re-audit against production, 2026-09-19

Stages 1–8 are all live: production is `9852aeeda` (main), and `authenticating` is
four data/ledger commits ahead of it with no code difference. This stage re-measured
the live site against every rule those stages set, fixed what had drifted, and
recorded what cannot be measured from this machine.

### 9.1 Access — what was and was not available

| Source | State | Consequence |
|---|---|---|
| Live site (curl, browser UA; Googlebot/Bingbot UA as a diagnostic) | available | every finding below that names a URL was reproduced here |
| Repository, dev servers (`dev:all`), tests, typecheck | available | fixes verified locally |
| Vercel CLI (`esbplbd`, team `teamesb`, project `esbpowerline`) | available for deployments and domains; **no usage/billing** | cost baseline is unverified; the CLI exposes no usage figures and `vercel api` refused every path form |
| Supabase Postgres (read-only query via the script client) | available | database size below; no egress/bandwidth figures |
| **Search Console** | **blocked** — the browser has no Google session; `search.google.com/search-console` lands on the marketing page | every report the brief names (Page indexing, Sitemaps, CWV, HTTPS, enhancements, crawl stats, manual actions, security) is unobserved this stage |
| **Bing Webmaster Tools** | blocked, same reason | unobserved |
| **PageSpeed Insights / CrUX field data** | blocked — the anonymous API quota is exhausted for the day (`Queries per day` for the shared consumer) | no field LCP/INP/CLS; stage 7's lab numbers stand |
| Vercel / Supabase dashboards (usage, spend controls) | blocked, no browser session | spend settings unreviewed; nothing was changed |
| schema.org validator | available | article and grid-day pages: 0 errors, 0 warnings |

Nothing was installed beyond the Playwright MCP browser binary the session already
declared. No paid service, plan change or scheduled job was added.

### 9.2 Baseline, production, 2026-09-19 (browser UA unless stated)

| Check | Result |
|---|---|
| `robots.txt` | as `app/robots.ts`; three sitemaps declared |
| `sitemap.xml` | 220 URLs: 171 articles, 26 policy, 11 categories, 5 authors, 7 static — **`/magazine` listed while the page is `noindex`; `/analysis` and both event studies absent** |
| `news-sitemap.xml` | 6 URLs, matching the 6 rows published in the last 48 h |
| `grid-sitemap.xml` | 4,578 URLs (archive index, 14 years, 4,563 days to 2026-09-17) |
| Googlebot / Bingbot UA | 200 on `/`, an article, a grid day, `sitemap.xml`, `/articles` |
| `http://` → `https://` | 308 |
| trailing slash (`/about/`) | 308 → `/about` |
| **`https://www.` → apex** | **307**, set by the Vercel domain configuration ahead of the `vercel.json` rule that asks for 308 |
| `http://www.` → apex | 308 → `https://www.` → 307 → apex (two hops) |
| unknown path, unknown grid date, future grid date, page/999 | 404 (hard) |
| legacy `/category/news/x`, `/articles?page=2` | 308 to the canonical page |
| `/grid-explorer?tab=gas` | 200, canonical `/grid-explorer` |
| `/analysis` `<title>` | **`Event studies — ESB PowerLine \| ESB PowerLine`** — the page string carried the site name and the layout template appended it again |
| Homepage HTML | 792 KB raw / 90 KB compressed (504 KB markup, 275 KB RSC; 81 images all with alt text, 67 article links) — unchanged from stage 4's deferral |
| `/analysis/remal-2024` HTML | 1.13 MB raw / 61 KB compressed, served from the CDN (`HIT`) |
| Structured data, validator | grid day: Dataset + BreadcrumbList + NewsMediaOrganization + WebSite, 0/0; article: NewsArticle + BreadcrumbList + Organization + WebSite, 0/0 |
| Database | **172 MB** (was 142 MB on 2026-09-06): `GridHourlyObservation` 73, `SourceDocument` 39, `DataReleaseRevision` 23, `DailyReport` 14 |
| Articles (database) | 205 published; **33 Bengali-titled** (404 on the site); 142 English titles over 60 chars, 95 with an editor's meta title |

### 9.3 Issue register

| ID | Priority | Observed | Family / URLs | Actual vs intended | Cause | Change | State |
|---|---|---|---|---|---|---|---|
| S9-1 | high | 2026-09-19, live sitemap | `/magazine` | submitted in `sitemap.xml` while serving `<meta name="robots" content="noindex, follow">` | `app/sitemap.ts` listed it unconditionally; the page gates `robots` on `IS_DEMO` | entry gated on the same `IS_DEMO` flag | **fixed in code, verified on dev** (0 magazine entries) |
| S9-2 | high | 2026-09-19, live sitemap | `/analysis`, `/analysis/gas-crisis-2026`, `/analysis/remal-2024` | indexable pages (canonical, 200, ISR 3600) with no sitemap entry and only in-page discovery | pages shipped 2026-09-13 without a sitemap change | entries derived from `EVENT_STUDIES`, undated | **fixed in code, verified on dev** (3 entries) |
| S9-3 | medium | 2026-09-19, live HTML | `/analysis` | doubled site name in `<title>` | page title contained "ESB PowerLine"; public layout template appends it | title rewritten without the name; says "Bangladesh" | **fixed in code, verified on dev** |
| S9-4 | low | 2026-09-19, live JSON-LD | `/grid-explorer/{date}` (4,563 pages) | `Dataset.publisher` an inline `Organization` beside the root `NewsMediaOrganization` of the same name | written before `ORGANIZATION_ID` existed | publisher by `@id` | **fixed in code, verified on dev** |
| S9-5 | medium | 2026-09-19, headers | `https://www.esbpowerline.com/*` | 307 (temporary) redirect to the apex; `vercel.json` asks for 308 | Vercel's domain-level redirect runs first and is set to 307 in the project's Domains settings | change the www domain's redirect status to 308 in Vercel → Project → Settings → Domains (dashboard only; the CLI exposes no setter) | **blocked — needs Hamim in the dashboard**; Google consolidates either way, so this is hygiene, not an outage |
| S9-6 | editorial | database | 33 published Bengali-titled articles | published in the CMS, 404 on the site, absent from the sitemap by design | server locale pinned to `en`; no `/bn` route exists | product decision: a Bengali URL space, or unpublish | **editorial/product** — unchanged since stage 3 |
| S9-7 | editorial | database | 142 articles with headlines over ~60 chars | 95 carry an editor's search title (rendered since stage 5); 47 show the headline as `<title>`. Length is a display consideration — Google truncates around 60 characters on a desktop result and rewrites titles it finds unhelpful — not a rule: a long, accurate headline beats a short vague one, and nothing in code enforces a limit | editors have not written a search title where one would read better | offer, per story, a search title only where the headline truncates badly; never shorten for its own sake | **editorial, optional** |
| S9-8 | monitor | unverifiable this stage | all | Core Web Vitals field data | PSI quota, no GSC session | none | **blocked** — read CWV in Search Console when signed in |
| S9-9 | monitor | 2026-09-19 | homepage | 792 KB raw HTML (90 KB on the wire) | 60-card "show more" sections, stage 4 deferral | none — content readers see; compressed size is acceptable | **intentional, watch** |
| S9-10 | monitor | 2026-09-19 | `/analysis/remal-2024` | 1.13 MB raw (61 KB on the wire), CDN hit | RSC payload for the day-by-day charts | none — no per-request cost; revisit only if field LCP says so | **intentional, watch** |

Not found, and checked: no 5xx on any probed URL; no soft 404 (unknown grid dates,
years, pagination and authors all hard-404); no redirect loop; no `X-Robots-Tag`; no
`noindex` on any page the sitemap lists apart from S9-1; no page without a canonical;
`lang="en"` on every page; no hreflang (none is warranted — the Bengali toggle is a
client-side rendering of the same URL, not a separate language version); no video
pages exist on the site, so no `VideoObject` is claimed.

### 9.4 Route policy (what each family is meant to do; stage 8's Grid Explorer decision stands)

| Family | Eligibility | Canonical | Discovery | Sitemap | Rendering / cache | Freshness |
|---|---|---|---|---|---|---|
| `/` | index | self | — | yes, daily | ISR 180 s | publish + snapshot |
| `/articles/{slug}` | index | self | index, categories, related, feed | yes, `lastmod = publishedAt` | ISR 600 s, 200 newest prerendered | edit → tag revalidate |
| `/articles`, `/articles/page/N`, `/articles/popular` | index | per page | rel prev/next | index only | ISR | publish |
| `/categories/{slug}` | index while it has a published article, else `noindex,follow` | self | nav, footer, breadcrumbs | only with articles | ISR 600 s | publish |
| `/authors/{slug}` (+ `/page/N`) | index | self | bylines | first page only | ISR | publish |
| `/energy-policy`, `/energy-policy/{slug}` | index | self | footer, article policy links | yes, undated | ISR 3600 s | manual |
| `/analysis`, `/analysis/{slug}` | index | self | nav, cards | **yes (S9-2)**, undated | ISR 3600 s | DataRelease correction |
| `/grid-explorer` | index, one URL; `?tab=` canonicalises to it | self | nav | yes | static, ISR 300 s | new day |
| `/grid-explorer/{date}` | index — public headline figures, prose summary, sources; hourly/plant/zone detail stays with the plans | self | archive year pages, prev/next | `grid-sitemap.xml`, `lastmod = date` | ISR 86 400 s, 60 newest prerendered | DataRelease correction |
| `/grid-explorer/archive`, `/archive/{year}` | index | self | explorer | grid sitemap | ISR | new day |
| `/magazine` | `noindex,follow` while `IS_DEMO`; index when a real issue ships | self | nav | **only when not demo (S9-1)** | dynamic (signed asset URLs) | per request |
| `/titas-gas`, `/about`, `/contact`, `/annual-reports/financials` | index | self | footer | yes, undated | ISR | manual |
| `/tags`, `/tags/{tag}` | `noindex,follow` | self | article tag chips | no | ISR | publish |
| `/search` (+ `?q=`) | `noindex,follow`; `?q=` robots-disallowed | self | nav | no | ISR | — |
| `/login`, `/members/login`, `/sign-in`, `/sign-up`, `/auth/*` | robots-disallowed, `noindex` | self | none in HTML (`nofollow` on the buttons) | no | dynamic | — |
| `/admin`, `/cms`, `/members`, `/api`, `/data/*` | robots-disallowed; auth/tier gated in middleware | — | none | no | dynamic / gated | — |
| `feed.xml`, `news-sitemap.xml`, `grid-sitemap.xml` | feeds | — | robots, `<link rel=alternate>` | — | 900 / 600 / 86 400 s | publish |

### 9.5 Cost

No change to any query, cache window, cron or plan. The three code changes touch
sitemap generation (one array of three static entries, one conditional) and two
metadata strings; the sitemap's database reads are unchanged and it remains
`revalidate = 3600`. Workload model unchanged: origin work ≈ public requests × the
CDN miss rate × one ISR render, plus the Pi's ingest, which does not touch Vercel.
Monetary figures are **unverified** — no billing surface was reachable — and nothing
here claims a saving. The database grew 30 MB in 13 days (172 MB of the 500 MB tier),
faster than the ~130 MB/year projected on 2026-09-06; `DataReleaseRevision` (23 MB)
is new to the top table and worth a look before the retention question in
`STRATEGIC_AUDIT_2026-09.md` §U becomes urgent.

### 9.6 Verification

- `tsc --noEmit`: clean. `eslint` on the four changed files: clean.
- `vitest run`: **88 files, 955 tests pass**, including the new `lib/test/sitemap.test.ts`
  (7 cases: Bengali titles excluded, magazine gated on `IS_DEMO` both ways, every
  registry study listed and undated, `lastModified` only where a real date exists,
  no robots-blocked or noindex family listed, news-desk author de-duplicated).
- Dev server (`:3000`): `sitemap.xml` 224 URLs, 3 `/analysis` entries, 0 `/magazine`;
  `/analysis` `<title>` "Event studies — Bangladesh grid and gas events, day by day |
  ESB PowerLine"; `/grid-explorer/2019-06-15` `publisher: {"@id": ".../#organization"}`.

### 9.7 Rollout, rollback, follow-up

**Release** is the usual `git push origin authenticating:main`; the build runs
`migrate-deploy-prod.mjs` and there is no migration in this change. **Rollback** is
reverting the one commit; nothing here writes to the database or changes a URL, so no
redirect or index state needs unwinding. After release: fetch `sitemap.xml` (expect the
three `/analysis` entries and no `/magazine`), `/analysis` `<title>`, and a grid day's
JSON-LD from production; then, signed in, resubmit `sitemap.xml` in Search Console once.
Do not request indexing for the grid archive.

**Day 7**: Search Console → Sitemaps (the three files read without error, discovered
counts ≈ 223 / a handful / ~4,580); Page indexing → "Submitted URL marked noindex" should
lose `/magazine`; Core Web Vitals report read for the first time. **Day 28**: Page
indexing trend for `/analysis/*` and the grid archive; the www 307 (S9-5) done;
Supabase database size against the 400 MB warning in `pi-hourly.sh`.

---

## Stage 10 — Timestamps, cost, measurement and redirects, 2026-09-19

Same day as stage 9, after review of it. Production is still `dpl_GtVooFAyJNLiagjfEVZ8EGHF2RWY`
(`main` at `9852aeeda`), so **every stage 9 code fix is still unreleased** and the
"production verification" column below is honest about that.

### 10.1 Access this stage

The route to Search Console is Hamim's own Edge, started with a remote-debugging port
and signed in there; the stage-9 scripts in `scratch/gsc*.mjs` attach to it, open a tab
of their own, read it and detach. No such window was open this session (Edge is running,
port 9222 is not), so Search Console, Bing, the Vercel usage page and the Supabase usage
page remain **unobserved**. To open it:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\esb-gsc-profile" https://search.google.com/search-console
```

Sign in to Google (and Vercel, Supabase) in that window once. It is a separate profile
because a normally-running Edge refuses the port. Then `node scratch/gsc.mjs` lists its
tabs and every check in §10.5 can be driven in front of you.

What was measurable without it: the live site through Puppeteer driving Edge with a real
browser user-agent (request counts, transfer bytes, edge-cache states per request), a
bounded Lighthouse set against production (Edge, `CHROME_PATH`), read-only Postgres
queries, and the repository.

### 10.2 The five concerns

**1. `lastmod` — grid sitemap and articles.** The grid sitemap stamped every day with
the observation date: when PGCB measured, not when this site published or changed the
page, and on a 2019 day seven years wrong. Articles used `publishedAt`, and the page's
`dateModified` used `updatedAt` — a Prisma `@updatedAt` that pinning, trashing, status
moves, media re-pointing and the admin view reconcile all bump: 171 of 205 published rows
carried one more than an hour past publication and 30 had moved in the previous week,
while only 16 have an actual body revision after publishing.

Both now read the ledgers that record real change. `DataReleaseRevision` appends a row
only when bytes change (PUBLISH / CORRECT / RESTORE, `release-write.ts`), so a grid day's
`lastmod` is its newest non-revoke revision time, across `GRID_DAILY` and `GAS_DAILY`,
and a day with no revision row — every day before 2026-08-21, held only in the static
archive — carries none. `Revision` is written only when an article's body changes
(`lib/actions/articles.ts`), so an article's `lastmod`, `dateModified` and
`og:modified_time` are the later of publication and its newest body revision. Dev
server: 30 of 4,578 archive entries dated, 4,548 undated; the sampled article's
`dateModified` equals its `datePublished`, which is true. A title-only edit does not move
these dates; that is the ledger's limit and it is stated in the code.

**2. Cost, measured rather than asserted.** "CDN hit means no per-request cost" was
wrong in two ways: a hit still transfers bytes, and middleware runs before the cache on
every matched request. Measured on production with Puppeteer + Edge, browser UA, cold
profile, one load each:

| Page | Requests | Transfer | Doc | Images | Fonts | Script | RSC/fetch | Same-origin `/api` calls | Edge state of those |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | 74 | 1,825 KB | 90 KB | 23 / 739 KB | 5 / 265 KB | 29 / 501 KB | 11 / 119 KB | 1 | STALE |
| article | 53 | 240 KB | 22 KB | 3 / 76 KB | cached | 28 / 24 KB | 12 / 118 KB | 1 | MISS |
| `/grid-explorer` | 90 | 579 KB | 34 KB | — | cached | 35 / 250 KB | 43 / 294 KB | **25 (10 distinct, 15 duplicates)** | 24 HIT, 1 STALE |
| grid day | 48 | 151 KB | 17 KB | 2 / 8 KB | cached | cached | 11 / 126 KB | 0 | — |
| `/analysis/remal-2024` | 52 | 204 KB | 60 KB | — | cached | 30 / 26 KB | 11 / 118 KB | 0 | — |

Fonts and script show as cached on later pages because the profile persisted across the
five loads; the homepage row is the true cold cost. Two findings with a cost:

- **The Grid Explorer asks for the same day's JSON up to four times in one view** —
  `/api/data/daily/2026-09-12.json` four times, three other days three times. 25
  requests for 10 files. Each is a middleware invocation (the tier gate, by design)
  plus an edge lookup; on a STALE or MISS it is also a function run and a Postgres read.
  The fix is client-side de-duplication of the fetch, which is Grid Explorer code and
  outside this stage's scope; it is the largest per-view request cost on the site.
- **The homepage transfers 1.8 MB cold, 739 KB of it images** across 23 requests. Every
  one is served through `/_next/image`, cached a year, so the cost is bandwidth rather
  than transformations — but it is the page's LCP budget (below).

Origin work per route, from the code (not the dashboard): `sitemap.xml` is four Postgres
queries per hour at most (one more sub-select per article for the revision, inside the
same `findMany`); `grid-sitemap.xml` is one cached release read per day; a grid day page
is zero database work on a hit and one catalogue read otherwise; an article is zero for
anonymous readers after its ISR window. **Plans and money remain unverified**: neither
the Vercel nor the Supabase usage page was reachable (§10.1), the CLI exposes no usage,
and no figure here is a billing figure. Database size 172 MB of Supabase's 500 MB free
tier (stage 9).

**3. Lighthouse.** Stage 7's paragraph miscounted (corrected in place: five of eight LCP
improvements in the 0.5–0.9 s band, not six, and one regression), and its numbers were a
local build on 2026-09-03 — not evidence about production now. Current production,
Lighthouse 13.4.1 via Edge, one run per cell, same machine and hour:

| Page | Form | Score | LCP | FCP | TBT | CLS | Speed Index | Bytes |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | mobile | 66 | 6.2 s | 2.0 s | 410 ms | 0.000 | 3.0 s | 1,644 KB |
| `/` | desktop | 99 | 0.96 s | 0.54 s | 2 ms | 0.001 | 0.88 s | 1,954 KB |
| article | mobile | 89 | 3.6 s | 1.7 s | 54 ms | 0.000 | 1.7 s | 883 KB |
| article | desktop | 99 | 0.83 s | 0.49 s | 0 ms | 0.000 | 0.71 s | 1,180 KB |
| `/grid-explorer` | mobile | 67 | 5.1 s | 1.7 s | 461 ms | 0.070 | 3.3 s | 1,398 KB |
| `/grid-explorer` | desktop | 95 | 1.1 s | 0.51 s | 6 ms | 0.100 | 0.99 s | 1,511 KB |
| grid day | mobile | 90 | 3.5 s | 1.7 s | 60 ms | 0.000 | 1.7 s | 912 KB |
| grid day | desktop | 100 | 0.81 s | 0.49 s | 0 ms | 0.000 | 0.62 s | 1,031 KB |

Lab, simulated slow 4G on mobile; single runs, so ±10% is noise. These say what a
Lighthouse run says and nothing about rankings. The one number that stands out is the
homepage mobile LCP at 6.2 s, driven by the image and script weight above. On the same
profile the article and grid-day pages sit at 3.5-3.6 s, a second past the 2.5 s target,
and every desktop run is under 1.1 s. **Field
data (CrUX) is still unverified** — the anonymous PageSpeed quota was exhausted and
Search Console's CWV report needs the signed-in window.

**4. Title length.** Reframed (S9-7 edited in place): ~60 characters is where a desktop
result truncates, not a requirement, and nothing in the code enforces one. A search
title is worth writing only where the headline truncates badly; a long accurate
headline is better than a short vague one.

**5. Legacy author redirects.** `/author/:name` → `/articles` sent every old author
archive to a page about something else — a soft 404 that also lost the reader. The
WordPress login slugs survive as the e-mail local part the importer minted
(`rasel@esbpowerline.com`, `admin@esbpowerline.com`; `hamim` special-cased), so the
three that carried published stories now redirect to their own author pages, which
exist and answer 200 in production. Every other `/author/*` falls through to the branded
404 rather than a guess. Old logins with no evidence in the database (there may be
others in Search Console's 404 list) can be added the same way when that list is read.

### 10.3 Per-issue status

| ID | Issue | Code | Production | Google's observed status | Measured cost impact |
|---|---|---|---|---|---|
| S9-1 | `/magazine` submitted while noindex | fixed, tested | **not deployed** | unobserved (no GSC session) | none: one array entry |
| S9-2 | `/analysis*` absent from sitemap | fixed, tested | not deployed | unobserved | none |
| S9-3 | `/analysis` doubled title | fixed, verified on dev | not deployed | unobserved | none |
| S9-4 | grid-day publisher by `@id` | fixed, verified on dev | not deployed | unobserved | none |
| S9-5 | www 307 | n/a (dashboard) | **open** | unobserved | none |
| S10-1 | grid sitemap `lastmod` = observation date | fixed, tested, dev-verified (30 dated / 4,548 undated) | not deployed | unobserved | +1 cached query per day on the sitemap |
| S10-2 | article `dateModified` = `updatedAt` | fixed, tested, dev-verified | not deployed | unobserved | +1 sub-select inside two existing queries |
| S10-3 | `/author/*` → news index | fixed, tested | not deployed | unobserved | unknown slugs now cost a 404 render instead of an edge redirect; volume in stage 3's logs was a handful a week |
| S10-4 | Grid Explorer duplicate data fetches | **not fixed** — documented | live | n/a | 15 redundant middleware invocations per explorer view |
| S10-5 | homepage cold weight 1.8 MB / mobile LCP 6.2 s lab | not fixed — measured | live | field unverified | bandwidth per cold visit |

### 10.4 Verification

- `tsc --noEmit` clean; `eslint` on the nine changed files clean.
- `vitest run`: **90 files, 962 tests** — `sitemap.test.ts` (8, revision-based lastmod
  added), new `grid-sitemap.test.ts` (3: revision time only, never the observation date,
  undated on a failed read), new `legacy-redirects.test.ts` (3: each known login to its
  author page, no catch-all guess, content-equivalent mappings intact).
- Dev server: figures in §10.2 (1). `next.config` redirects are read at server start, so
  the author mappings are verified by the config test, not by the running dev instance.

### 10.5 Release and what to check after it

Release is `git push origin authenticating:main` — no migration, no data write, rollback
is one revert. Then, in production with a browser UA: `grid-sitemap.xml` (about 30
`<lastmod>` elements, none equal to a bare date), `sitemap.xml` (three `/analysis`,
no `/magazine`), an article's `dateModified`, `/author/rasel` → 308
`/authors/sheikh-rasel`, `/author/unknown` → 404. Then, in the 9222 window, in this
order: Page indexing (classify each reason; export "Submitted URL marked noindex" and
"Not found" — the latter is where any further `/author/*` logins will be), Sitemaps
(resubmit the three once), Core Web Vitals (the first field numbers this work has had),
the Vercel usage page (function invocations, edge requests, bandwidth, image
transformations for the current period) and the Supabase usage page (egress, database
size), recorded here as the before for whatever comes next.

### 10.6 Search Console, read in Hamim's window (2026-09-19, later the same day)

Hamim opened the 9222 Edge and signed in; every figure below was read from the
property `https://esbpowerline.com/` through `scratch/gsc*.mjs`, in tabs opened and
closed in front of him. Report dates are Google's "last update".

**Sitemaps — none was submitted.** The Sitemaps report was empty: robots.txt named the
three files, but nothing had ever been submitted, so the "Sitemaps" evidence stages 2, 5
and 8 expected to read did not exist. All three were submitted from the window
(`scratch/gsc-submit-sitemap.mjs`) and read back: `sitemap.xml` Success, 220 discovered;
`news-sitemap.xml` Success, 6; `grid-sitemap.xml` showed "Couldn't fetch" for the first
minute — the origin answered Googlebot 200, well-formed, 714 KB, cached — then Success,
4,578. Those counts are the *live* files, i.e. before the stage 9/10 changes deploy;
the first read after release should show 223 for the first and about 30 dated entries
in the third.

**Page indexing (9/14/26):** 207 indexed, 1,050 not indexed across 11 reasons. Every
example list was exported in full (`scratch/gsc-table.mjs`) and classified:

| Reason | Pages | What they are | Disposition |
|---|---:|---|---|
| Crawled – currently not indexed | 784 | 252 `/_next/static/*` chunks, fonts and CSS with old `?dpl=` ids; 154 WordPress date URLs with Bengali slugs; 85 other Bengali-era paths (`/tag/…`, `/location/…`, `/category/…`); 20 WordPress date URLs with English slugs; 12 current tag/category/article pages | Assets: Google fetching page resources, not a defect, and they must not be blocked (rendering needs them). Bengali-era: obsolete URLs from the old site (S9-6 is the product question). The 12 current pages: **unresolved diagnosis** — three articles and a handful of hubs Google chose not to index; content, not code |
| Not found (404) | 159 | 94 Bengali-era paths; 16 WordPress date URLs whose slug does not exist here (`…-season-2`); 14 `/tags/<keyword>` (stage 2's dead links); 6 `/category/…`; 4 `/articles/…` (truncated slugs, and the archived Moheshkhali story); 2 slugless date archives; 1 `/categories/grid-transmission-2`; scanner junk (`/W`, `/t`, `/mmbtu`) | The two date archives and the `-2` category now redirect (this stage). The rest are correct 404s: obsolete, awaiting recrawl |
| Duplicate without user-selected canonical | 31 | 24 `/?NNNNNN.html` spam query strings on the homepage; 5 `/login?callbackUrl=…`; `/categories/environment-efficiency`; `/articles/drilling-for-survival-…-kamta-2` | Obsolete report: the homepage and login pages carry canonicals since stage 2/5 (live check today); the two real pages are **unresolved** — inspect after release |
| Page with redirect | 23 | WordPress URLs and trailing-slash variants, all redirecting correctly | Intentional |
| Excluded by 'noindex' | 20 | `/tags/*`, `/tags` | Intentional |
| Blocked by robots.txt | 14 | `/login?callbackUrl=…`, `/members/login?callbackUrl=…` | Intentional; the callback links left the HTML in stage 2 |
| Blocked due to other 4xx | 8 | Bengali-era paths, one `/tags/among`, two `/?N.html` | Obsolete |
| Alternate page with proper canonical | 4 | | Intentional |
| three further reasons | 2, 1, 1 | validation "Started" | not read individually |

Nothing in the not-indexed set is a page this site wants indexed and cannot get indexed
for a technical reason that is still live. The number will not go to zero and should
not: two-thirds of it is the old Bengali site, and a quarter is page resources.

**Core Web Vitals (CrUX, 9/17/26) — the first field evidence this work has had.**
Mobile: 0 good, **146 need improvement, 0 poor**, one issue: *LCP longer than 2.5 s
(mobile)*. Desktop: 146 good, 0 issues. This agrees with the lab runs in §10.2 (3):
mobile LCP is the site's one performance problem in the field, at the "needs
improvement" band (2.5–4 s at the 75th percentile), not "poor". The homepage's 1.8 MB
cold weight is the likeliest driver; a fix is design work (the 60-card sections, image
sizing on the first screen) and is not attempted here.

**Other reports:** HTTPS — 140 HTTPS URLs, 0 non-HTTPS (9/11). Manual actions — none.
Security issues — none. Breadcrumbs — 0 invalid (9/17). Datasets — 1 valid, 0 invalid,
"Missing field license" 0 (9/17); only one Dataset item is counted, so the 4,563 day
pages had not been read as datasets by 9/17. Video indexing — no report exists (the
site has no video pages). Crawl stats (90 days to 9/17): 6,590 requests, 185 MB, 250 ms
average response; by response 80% 200, 9% 404, 8% 301, 3% other 4xx, <1% 5xx; by
purpose 95% refresh, 5% discovery; by file type 45% JavaScript, 16% HTML, 14% other,
8% image, 5% CSS. Host status: no problems.

**Performance, 12 Jul – 16 Sep 2026:** 184 clicks, 10.7K impressions, 1.7% CTR,
average position 19.4. The preceding-period comparison and the query/page/device tables
were not read this session; they change nothing about the fixes and are the first thing
to read after release.

**Not reached:** the Vercel usage page and the Supabase usage page both asked for a
sign-in in that window. Cost remains as §10.2 (2) states: measured per request, not in
money.

**Per-issue "Google's observed status", updated:** S9-1 — `/magazine` does not appear in
the noindex or sitemap lists yet (the sitemap was only submitted today). S9-2 — the
`/analysis` pages are not in any not-indexed list; whether they are indexed needs URL
Inspection after release. S9-5 (www 307) — the redirect list holds no www URL. S10-3
— no `/author/*` URL appears in the 404 or redirect exports, so the only evidence for
the old logins is the importer's e-mail slugs. S10-5 — confirmed in the field: mobile
LCP is the one CWV issue, on every URL Google has data for.

### 10.7 Released and verified in production (2026-09-19)

`main` fast-forwarded `9852aeeda` → `8eb566114` on Hamim's instruction; Vercel built
`dpl_4tZQkinq1ih6QCtpKQiHzPJ8knTb` and it was serving within about ten minutes. No
migration ran (none in the change). Verified against that deployment with a browser
user-agent (Googlebot UA for the grid sitemap):

| Check | Production result |
|---|---|
| `sitemap.xml` | 226 URLs, 3 `/analysis*`, 0 `/magazine`, edge HIT |
| `grid-sitemap.xml` | 4,578 URLs, 30 `<lastmod>` (all revision timestamps), 0 bare-date lastmods; 2019-06-15 undated |
| `/analysis` `<title>` | "Event studies — Bangladesh grid and gas events, day by day \| ESB PowerLine" |
| grid day `Dataset.publisher` | `{"@id": ".../#organization"}` |
| article `dateModified` / `og:modified_time` | equal to `datePublished` for an unrevised article (true) |
| `/author/hamim`, `/author/rasel`, `/author/admin` | 308 to the author pages, which answer 200 |
| `/author/unknown-person` | 404 |
| `/2026/06/08/`, `/2026/04/` | 308 (slash strip) → 308 → `/articles` 200 |
| `/categories/grid-transmission-2` | 308 → `/categories/grid-transmission` |
| `/magazine` | still `noindex, follow` (intentional) |
| `/grid-explorer/zzz-bad` | still a hard 404 |

Per-issue state after release: S9-1, S9-2, S9-3, S9-4, S10-1, S10-2, S10-3 — **deployed
and verified in production**; Google's observed status unchanged until recrawl (the
sitemaps were submitted the same day and show the pre-release counts until Google
re-reads them). S9-5 (www 307) — still open, dashboard. S10-4, S10-5 — unchanged,
documented. Editorial items unchanged.

This section is committed to `authenticating` only; `main` carries the code and is one
docs commit behind, which the next release closes.

### 10.8 The www redirect, closed from the CLI (2026-09-19)

S9-5 was "dashboard only". It was not. `vercel api` (beta) had been refusing every path
because Git Bash rewrites a leading `/v9/…` into a Windows path; with
`MSYS_NO_PATHCONV=1` it works. The project had **only the apex** attached
(`GET /v9/projects/esbpowerline/domains`: one entry, no redirect), so the 307 on
`www.esbpowerline.com` was Vercel's default for a host on its DNS that belongs to no
project — which is also why the `vercel.json` host rule never ran: the request never
reached the project. Fix: attach the host to the project as a redirect,

```
vercel api /v10/projects/esbpowerline/domains -X POST \
  -f name=www.esbpowerline.com -f redirect=esbpowerline.com -F redirectStatusCode=308
```

verified immediately (Vercel DNS, same account). Live 15 s later: `https://www.` → 308
`https://esbpowerline.com/` (path preserved), `http://www.` → 308 `https://www.` → 308
apex. Still two hops on plain-http www, which is the HSTS-preload shape and stays.
Reversible with `DELETE /v9/projects/esbpowerline/domains/www.esbpowerline.com`.
S9-5: **deployed and verified in production**; Google's redirect list is unchanged
until recrawl.

While the API was open: the team `teamesb` is on the **Pro** plan, billing period
2026-09-13 → 2026-10-13 (`GET /v2/teams?slug=teamesb`). The usage figures themselves
are not exposed by the public API; the dashboard read is still owed.

### 10.9 S10-4 and S10-5, fixed by two agents in worktrees (2026-09-19)

Both measured on a local production build, before and after, with Puppeteer driving
Edge under a real Chrome user-agent; both cherry-picked onto `authenticating` and the
merged tree re-verified (91 files, 968 tests; `tsc`, `eslint` clean).

**S10-5 — homepage cold weight** (`bfa614fe0`, `perf(home)`). Five causes, all
evidenced in the network log rather than guessed:

1. `HomeTrendingSection` "prewarmed" five images with `new window.Image().src =
   originalUrl` — the raw Supabase Storage originals, a different URL from the
   `/_next/image` candidates the `<Image>` actually renders, so nothing could reuse
   them. 535 KB of the 738 KB of images on a cold phone load, fetched while the LCP
   image was still downloading. Removed.
2. The masthead link prefetched `/` from `/` — 64 KB of RSC for a click that only
   scrolls to the top on the homepage. `prefetch={pathname !== '/'}`.
3. Source Serif 4 was preloaded on every page and used by no rendered element (the
   typographic masthead was retired 2026-09-03). 51 KB ahead of the LCP. `preload:
   false`; the face stays registered.
4. The hero image's preload carried no `fetchPriority`; added `high` on the first
   slide. Observed LCP-image load 790 ms → 11 ms.
5. Six promotional images had no `sizes` (the browser chose the 2560 px candidate for a
   24 rem slot) and interview thumbnails claimed `100vw` for a 2–4 column grid. Each
   now describes its slot.

| Cold mobile load, local production build | Before | After |
|---|---:|---:|
| Requests | 63 | 55 |
| Transfer | 1,765 KB | 1,101 KB |
| Images | 14 / 738 KB | 9 / 181 KB |
| Fonts | 4 / 164 KB | 3 / 113 KB |
| RSC / fetch | 12 / 140 KB | 10 / 84 KB |
| Lighthouse mobile LCP | 7.1 s | 5.3–5.6 s |

What remains of LCP is render delay behind the 87 KB blocking stylesheet and hydration
of a document carrying 24 articles × 10 categories in its RSC payload — structural, and
not touched. Script weight was examined and left: nothing heavy reaches the homepage
bundle that is not needed above the fold; gtag (174 KB) is already `lazyOnload`.

**S10-4 — Grid Explorer duplicate fetches** (`3d869f6ee`, `perf(grid)`). Cause: the
Overview's prior-seven-days walker keys its effect on `systemStats`, a fresh object on
every resolution of the explorer's own refresh fetch, so it re-ran up to three times a
view; and every result cache above the fetch layer is filled only after a response
lands, so a day still in flight was asked again — and a 403 day, never cached by
design, on every run. Fix: one in-flight promise map keyed by URL at the fetch layer
(`lib/data/json-request-dedupe.ts`), deliberately not a result cache; a non-OK response
reaches every waiter as a status with no body read and is never held. `/api/data` vs
`/data` order, `refresh` revalidation, the 404/network-only archive fallback and the
tier gate are unchanged; five tests pin the helper.

| Same-origin `/api/data` requests (total / distinct / duplicate) | Before | After |
|---|---|---|
| First load | 13 / 10 / 3 | 11 / 10 / 1 |
| After Overview → Gas → Power Stations → Overview | 17 / 12 / 5 | 15 / 12 / 3 |
| A tier-locked day (`?date=2026-09-01`) | 26 / 9 / 17 | 10 / 9 / 1 |

KPIs byte-identical before and after; the locked day still shows the locked state and
never requests its own file. The remaining duplicate is the locked eighth day back asked
once per sequential walker run, which is a 403 and stays uncached on purpose.

**Found on the way, not fixed — a doctrine defect (S10-6).** Under the visitor lock the
Overview skeleton prints "Evening Peak Gen: 0 MW / Total Energy Gen: 0.00 MKWh" for a
day it never fetched — a zero where rule 1 wants a dash. Present in production today;
needs its own change in the Overview's empty state.

State: both **fixed in code, verified on a local production build, not yet released**.
