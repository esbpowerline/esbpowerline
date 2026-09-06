# ARTICLE_VIEW_COST_OPTIONS.md

**Branch:** `optimization/cost-control`
**Date:** 2026-09-06
**Status:** Audit only. **No tracking code has been changed.**

---

## 0. The number that decides this

Queried from the production database (read-only):

| | |
|---|---|
| `ArticleView` rows, all time | **1,472** |
| Window covered | 2026-06-26 → 2026-09-06 (**73 days**) |
| **Article views per day, site-wide** | **≈ 20** |
| Distinct visitors | 818 |
| Published articles | 164 |
| `sum(Article.views)` | 1,472 — exactly equal to the ledger, so the counters are in sync |
| `ArticleView` table size | **1,304 kB** |

**At ~20 views per day this feature costs roughly 20 function invocations and 80–120 Postgres
statements per day.** That is not a meaningful part of a $50/month bill, and I am not going to
pretend otherwise. Everything below is written on that basis: this is a *correctness and
principle* question far more than a cost one, and the cost case only starts to matter if traffic
grows by two or three orders of magnitude.

---

## 1. Exact requests triggered by one article view

| # | Request | Billable as |
|---|---|---|
| 1 | `GET /articles/[slug]` — prerendered, served from CDN | ISR/CDN, function only on regeneration |
| 2 | `POST /api/articles/{id}/view` — from `ArticleViewTracker` | **1 edge middleware invocation + 1 serverless function invocation** |

That is the whole of it. Measured with a browser: an article page produces **3
middleware-eligible requests**, of which this POST is one.

`components/analytics/ArticleViewTracker.tsx:9-18` — fires once per mount, guarded by a
`useRef`, `keepalive: true`, errors swallowed.

Not free but easily missed: the POST also passes the middleware Upstash rate limiter
(`middleware.ts:186-191` — `/api/` and not a read-only data path), which is **2 Upstash commands
per view** against the 10,000/day free allowance. At 20 views/day that is 40 commands. Worth
knowing before traffic grows.

---

## 2. Exact database operations

`lib/article-view-tracking.ts:34-73`, per **new** view:

| # | Statement |
|---|---|
| 1 | `SELECT id, authorId FROM "Article" WHERE id = $1 AND status = 'PUBLISHED'` |
| 2 | `BEGIN` |
| 3 | `INSERT INTO "ArticleView" (articleId, visitorKey, dedupBucket, referrer, …)` |
| 4 | `UPDATE "Article" SET "views" = "views" + 1 WHERE "id" = $1` |
| 5 | `UPDATE "User" SET "totalViews" = "totalViews" + 1 WHERE "id" = $1` |
| 6 | `COMMIT` |

**Six round trips, four of them statements.**

Per **deduplicated** (repeat) view: statements 1–3 still run, the `INSERT` violates
`@@unique([articleId, visitorKey, dedupBucket])`, Prisma raises `P2002`, the transaction rolls
back. So **a returning reader still costs a function invocation and ~4 round trips to record
nothing.** That is the least defensible part of the current design.

Statement 4 is deliberately raw SQL, and the comment at `:57-61` explains why: `tx.article.update`
would trip Prisma's `@updatedAt`, rewriting a column that feeds the sitemap's `lastmod` and the
`NewsArticle` `dateModified`. Every article would have claimed to change moments before each
crawl. **Any rewrite must preserve this.** It is a trap, not a style choice.

### The finding that matters more than the statement count

**`ArticleView` is written on every view and read by nothing.**

- `grep articleView\.` across `lib/` and `app/` → exactly one hit, the `create` above.
- `lib/actions/analytics.ts` contains **zero** references to `articleView`. Every admin metric —
  totals, top articles, per-category, per-author, time series — aggregates the denormalised
  `Article.views` / `User.totalViews` columns instead.
- The only reader is `reconcileArticleViewCounts()` (`:78-101`), an admin integrity check that
  re-derives the counters from the ledger.
- The `referrer` column is populated on all 1,472 rows and **read by nothing at all**.

So the per-view `INSERT` buys exactly two things: the unique constraint that implements dedup,
and the ability to re-derive counters. It is not powering any analytics.

---

## 3. Do duplicate refreshes count as additional views?

**No, but they are not free.** Dedup is a unique constraint on
`(articleId, visitorKey, dedupBucket)`, with the bucket from `lib/article-view-dedup.ts`:

```ts
Math.floor(now / (24 * 60 * 60 * 1000))
```

One view per visitor per article per bucket. Two caveats:

- The bucket is **fixed, not rolling**, despite the comment calling it a rolling window. A read at
  23:59 UTC and another at 00:01 UTC fall in different buckets and both count. Minor, and it
  cannot inflate by more than one extra view per visitor per article per day.
- `visitorKey` is a SHA-256 of a `httpOnly` cookie (`route.ts:31-38`, `tracking.ts:12-19`). Cleared
  cookies, private windows and different devices each read as a new visitor. 818 distinct visitors
  against 1,472 events is consistent with that.

---

## 4. Can bots and crawlers increment views?

**Partly.**

- Known-bad user agents are refused in middleware before the handler runs
  (`middleware.ts:315-320`, `isBlockedBotUserAgent`).
- **A crawler that executes JavaScript can still count.** The tracker is a client `useEffect`, and
  Googlebot renders JS. Nothing checks for `navigator.webdriver`, headless UAs, or requires an
  interaction or dwell time.
- Anything can POST the endpoint directly with a fresh cookie. It is rate-limited
  (`route.ts:16` — 120/min per IP, in-memory per instance; plus the Upstash limiter in middleware)
  but not authenticated, and it is not signed against the article.

**So the counts are "browser-ish traffic", not verified humans.** Fine for ordering a "most read"
list. Not fine as a number to quote to an advertiser, and the site does publish `views` on cards.

---

## 5. Can prefetch increment views?

**No.** `next/link` prefetch fetches the RSC payload; it does not mount components or run
effects. `useEffect` only runs on a real client render. Confirmed by the measurement in
`COST_AUDIT.md`: an article page produced exactly one `POST …/view`, and the homepage — which
prefetches many article links — produced none.

---

## 6. Is the increment synchronous with page rendering?

**No.** The page is prerendered (`● /articles/[slug]`) and served from the CDN. The tracker runs
after hydration and does not block paint. `keepalive: true` lets it survive navigation.

---

## 7. Can failure slow article rendering?

**No.** `void fetch(...).catch(() => undefined)` — not awaited, errors swallowed. A dead database
or a 500 from the route is invisible to the reader. This property is already correct and **any
replacement must keep it**; your own constraint, and the code already honours it.

---

## 8. What `views` is actually used for

| Consumer | Reads | Needs precision? |
|---|---|---|
| Article cards, public | `Article.views` via `ARTICLE_CARD_SELECT` (`lib/category-content.ts:53`) | No — a displayed count |
| Trending ranking | `getTrendingPublishedArticles`, `orderBy: [isTrending, views desc]` (`:312`) | No — ordering only |
| `/articles/popular` | client-side sort by `views` (`ArticlesIndexFrame.tsx:36`) | No — ordering only |
| Admin analytics | `Article.views`, `User.totalViews` aggregates (`lib/actions/analytics.ts`, ~25 sites) | Approximate is fine |
| Author totals | `User.totalViews` | Approximate is fine |
| **`ArticleView` ledger** | **nothing** | — |
| **`ArticleView.referrer`** | **nothing** | — |

**No consumer requires exactness.** Every one is a display figure or a sort key.

---

## 9. Options

### A. Keep current behaviour

- **Vercel:** 1 middleware + 1 function per view. ~20/day today.
- **Supabase:** 4 statements/6 round trips per new view; ~4 per repeat view that records nothing.
- **Accuracy:** highest available here. **Bot resistance:** weak (§4). **Complexity:** zero.
- **Failure modes:** none for the reader; a DB outage silently loses views.
- **Privacy:** hashed cookie, no IP stored; referrer stored and never used.
- **Verdict:** at 20 views/day this is genuinely defensible. It is not what is costing you money.

### B. One atomic statement

Collapse to a single `INSERT … ON CONFLICT DO NOTHING` with a `RETURNING`, and drive the two
counters from it — or drop the `SELECT` by making the insert conditional on the article being
published via a `WHERE EXISTS` subquery.

- **Vercel:** unchanged (still 1 function/view).
- **Supabase:** 6 round trips → **1**. Repeat views cost 1 instead of ~4.
- **Accuracy:** identical. **Bot resistance:** unchanged. **Complexity:** low — one raw query.
- **Failure modes:** must preserve the raw-SQL `updatedAt` trap (§2) and keep author totals
  consistent. Reconciliation already exists as the safety net.
- **Privacy:** unchanged.
- **Verdict:** the best cost-per-unit-of-risk on the list. ~75% fewer statements, no behaviour
  change, no accuracy loss, nothing to explain to a reader.

### C. Client-side throttling / dedup

Skip the POST entirely when `localStorage` says this visitor already counted this article today.

- **Vercel:** removes the invocation for repeat views — the ~44% of events that are repeat visits
  by the 818-visitor / 1,472-event ratio, though the true repeat rate needs production data.
- **Supabase:** proportional reduction. **Accuracy:** slightly lower (cleared storage double-counts,
  private windows always count). **Bot resistance:** unchanged. **Complexity:** low.
- **Failure modes:** two sources of truth for dedup; server constraint must stay as the backstop.
- **Privacy:** adds per-visitor state in the browser; worth a line in the privacy policy.
- **Verdict:** good, and **composes with B**. Do it second, not first.

### D. Sample views

Count 1 in N and multiply.

- **Vercel/Supabase:** linear reduction by N. **Accuracy:** unbiased in aggregate, visibly wrong
  per article at these volumes — at 20 views/day and 1-in-10, most articles would show 0 or 10.
- **Complexity:** low. **Privacy:** improves slightly.
- **Verdict:** **reject at current traffic.** Sampling needs volume to be honest, and the site
  publishes per-article counts on cards. It would make a displayed number a fiction, which is
  exactly the thing the data doctrine in `CLAUDE.md` exists to prevent.

### E. Stop realtime counting; update periodically

Write raw events only, recompute counters on a schedule.

- **Vercel:** unchanged per view; adds a cron. **Supabase:** fewer writes per view, one batch job.
- **Accuracy:** counters lag by the interval. **Complexity:** medium — needs a scheduled job, and
  the Pi or the existing 15-min Vercel cron would have to carry it.
- **Verdict:** solves a problem you do not have. The write path is already 4 statements, not 40.

### F. Disable detailed tracking for now

Drop the `ArticleView` insert and the `referrer` column; keep only the counter increments.

- **Vercel:** unchanged. **Supabase:** removes the only growing table (1.3 MB, ~18 kB/day) and one
  statement per view.
- **Accuracy:** loses per-visitor dedup entirely unless replaced — every refresh would count.
  **Verdict as written: reject.** But the underlying observation stands, and is the strongest
  finding in this document: **the ledger and the `referrer` column are written on every view and
  read by nothing.** If they are never going to power anything, they are pure write amplification;
  if they are meant to power future analytics, that should be stated, because right now they are
  costing writes for a feature that does not exist.

---

## 10. Recommendation

**Do B, and consider C afterwards. Do not do D or E. Decide separately about the ledger.**

1. **B — collapse to one statement.** 6 round trips → 1, repeat views 4 → 1, zero accuracy or
   behaviour change. Small, testable, reversible.
2. **C — client-side dedup** on top, if you want the invocation count down too.
3. **A decision on `ArticleView.referrer`.** It has 1,472 populated rows and no reader. Either
   something is going to use it, or it should stop being written — storing a referrer per reader
   for no purpose is a privacy cost with no benefit.

**But the honest headline: this feature is not why you are paying $50/month.** At 20 views/day it
is roughly 600 function invocations and 1.3 MB of storage per month. The items in
`COST_AUDIT.md` §2.1 and §2.2 were three orders of magnitude larger. I would take B because it is
cheap and strictly better, not because it will show up on the invoice.

**Anything beyond that: REQUIRES PRODUCTION METRICS** — specifically the real repeat-visit rate
and how much of the 1,472 is crawler traffic, neither of which is derivable from the schema.

---

## 11. Status

Audit complete. **No code changed.** Awaiting your decision before implementing any option.
