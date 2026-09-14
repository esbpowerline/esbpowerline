# Telegram notifications — discovery

**2026-09-14.** Read-only audit of the repository and the live systems it depends on,
done before any notification code was written. Line references are to
`authenticating` at `85e06b56`. Every claim below was checked in code; where
`AUDIT-INVENTORY.md` (2026-08-20) disagrees with the code, the code wins.

---

## 1. Article architecture

`prisma/schema.prisma:61-111` — `Article`.

| field | meaning for notifications |
|---|---|
| `status ArticleStatus` | `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `SCHEDULED`, `ARCHIVED`, `TRASH` (`:130-137`). **The only thing that makes an article public.** |
| `publishedAt DateTime?` | Doubles as the scheduled go-live time. There is no `scheduledAt`/`embargoUntil` column anywhere. |
| `title`, `excerpt`, `slug` | Headline, standfirst, URL key. The slug can change on edit (`lib/actions/articles.ts:651`) with no redirect. |
| `titleBn`, `excerptBn`, `contentBn`, `locale` | Bengali. Public reads tell language by the regex `/[ঀ-৿]/` on `title`, **not** by `locale` (`lib/category-content.ts:224-229`). |
| `category` (name) + `categoryId?` | Articles store the category *name*; public links slugify it (`app/(public)/articles/[slug]/page.tsx:166`). |
| `imageUrl`, `imageCredit` | Absolute URL into the Supabase `media` bucket. |
| `isBreaking`, `isFeatured`, `isPinned`, `isTrending` | Placement flags. `isBreaking` is the only honest signal for a "breaking" post. |
| `editorTrash`, `trashedAt`, `version`, `updatedAt` | Soft-delete and edit markers. |

No review, embargo or "announce" flag exists. Nothing records that an article has
been announced anywhere.

## 2. The publication path

**Seven in-app paths write `status = 'PUBLISHED'`, and none emits an event.**

| # | path | file:line | notes |
|---|---|---|---|
| a | `createArticle` | `lib/actions/articles.ts:552-621` | `publishedAt` from `resolvePublishedAt` (`:89-104`) — the editor's date, else now |
| b | `updateArticle` | `:623-700` | previous status is `existing.status` (`:625`); `version++` |
| c | `bulkArticleAction('publish')` | `:391-404` | array `$transaction`; **no status filter** — re-publishes live rows, publishes drafts |
| d | `bulkOwnArticleAction('publish')` | `:833-843` | same, own rows only |
| e | `approveReviewSubmission(publish)` | `lib/actions/review-workflow.ts:111-228` | interactive `$transaction`, requires `IN_REVIEW` |
| f | cron `publishDueScheduledArticles` | `lib/cron/publish-scheduled-articles.ts:25-106` | `*/15`; **update is not conditional on the row still being `SCHEDULED`** (`:84-90`) — two overlapping runs would both "publish" |
| g | `undoAuditLogAction` | `lib/actions/logs.ts:98-115` | undoing a trash/draft of a live article re-publishes it |
| h | scripts | `scripts/import-esbpowerline-news.ts`, `scripts/publish-titas-investigation.mjs`, `prisma/seed.ts` | outside the Next runtime; no revalidation |

**Visibility is decided by status alone.** Every public query filters
`status: 'PUBLISHED'` and none compares `publishedAt` with now
(`lib/category-content.ts:258-262`, feed, sitemap). Consequences:

- A `PUBLISHED` row with a future `publishedAt` is live immediately.
- A `SCHEDULED` row whose time has passed stays hidden until the next cron tick (≤15 min).
- **An article whose title is in Bengali script returns 404 at `/articles/[slug]`**
  even when `PUBLISHED` (`category-content.ts:267-269`; the server locale is pinned to
  `en`, `lib/locale-server.ts:3-7`). Announcing one would link readers to a 404.

Unpublish/withdraw paths: `updateArticle` to `DRAFT`/`ARCHIVED`, bulk `draft`/`archive`/`trash`,
`deleteArticle` (soft delete to `TRASH`), `trashOwnArticle`, and hard delete from trash.
Restore goes to `DRAFT`. `ArticleHistory` exists in the schema and is never written.

**Canonical URL:** `${NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com'}/articles/${encodeURIComponent(slug)}`
(`lib/seo.ts:8`, `page.tsx:76`, feed). `publicArticleUrl()` in `lib/public-site-url.ts`
reads a different variable and does not encode; it is for CMS links only. No UTM
convention exists anywhere in the code.

**Images:** uploads are converted to WebP q80, longest edge ≤2560 px
(`lib/media-storage.ts:52-110`), stored in the public Supabase bucket. Direct bucket
hits by scrapers exhausted the egress quota on 2026-09-02, which is why share
images go through `shareImageUrl()` (`lib/seo.ts:44-58`).

## 3. Database models that matter

| model | use here |
|---|---|
| `Article`, `Category`, `User` | the news post |
| `AuditLog` | admin actions are recorded here (`settings.ts:69-77` pattern) |
| `SiteSetting` (`key @id, value Json`) | runtime settings. **Every row is sent to `SettingsForm` as props** (`lib/actions/settings.ts:19-25`), and `updateSettingsBatch` flushes every public page on save — unsuitable for notification state |
| `Notification` (`:461-470`) | per-user in-app notices from `0001_init`; **no code uses it**. The name is taken, so new models must not reuse it |
| `GridHourlyObservation`, `SourceDocument`, `GridForecastBoard` | grid (§4) |
| `DataRelease` | runtime-published daily data; a release beats a static file (`lib/data/releases.server.ts`) |

Migrations: `prisma/migrations/0001…0022`, hand-written SQL with long explanatory
headers, recent ones idempotent (`IF NOT EXISTS`) after the 0022 re-run incident.
They are applied **only by a production build** (`scripts/migrate-deploy-prod.mjs:55-61`
exits 0 for any other `VERCEL_ENV`), in a single attempt whose output is not printed.

## 4. Grid Explorer data

**Hourly (NLDC), captured by the Pi at :17 every hour** (`scripts/ingest-nldc-hourly.ts`,
`scripts/pi-hourly.sh`). Four series in `GridHourlyObservation` (`schema.prisma:991-1053`):
`GENERATION`, `DEMAND_SUPPLY`, `INDIA_IMPORT`, `NEPAL_IMPORT`.

- Columns: `totalMw`, fuel columns (`gasMw`, `liquidMw`, `coalMw`, `hydroMw`, `solarMw`,
  `windMw`), interconnectors (`bheramaraMw`, `tripuraMw`, `adaniMw`, `nepalMw`) and their
  forecasts, `demandMw`, `supplyMw`, `loadShedMw`. All nullable `Decimal(12,3)`; a blank
  cell is null, never 0.
- `observedAt` is `timestamp without time zone` holding a **UTC instant**
  (`toInstant = new Date(\`${localIso}+06:00\`)`, `ingest-nldc-hourly.ts:97-98`). Read
  through node-pg on a +06:00 machine it appears six hours early — a trap hit during
  this audit. Format with an explicit `Asia/Dhaka` zone, always.
- `@@unique([series, observedAt])`; upserts use `COALESCE(new, old)`, so a later page
  never blanks a stored figure.
- `excluded AggregationExclusion?` marks rows whose total disagrees with its parts by
  more than 20%, or whose breakdown is all zero.

**Lag.** NLDC posts its hourly pages late. Measured today over 174 hours: median
**3.3 h**, p90 **6.3 h**, max 25.3 h between the hour and our first write. Anything
labelled "live" is really "the newest hour NLDC has posted".

**Live snapshot.** `lib/data/grid/live-grid.server.ts` reads NLDC directly (not the DB)
behind a 180 s `unstable_cache`, returning `latest`, `hours` (last 24 *posted* rows),
`today` maxima, `reconciles`, `componentSumMw`, `forecast`. No code compares `asOf` with
the clock — the homepage has no staleness threshold. `lib/data/grid/live-row-integrity.ts`
classifies a generation row as consistent / inconsistent (shown as filed, flagged) /
unusable (withheld, >10% off its parts).

**Daily (PGCB workbook, Petrobangla PDF)** via `getRuntimeLatestDate()` and
`loadDailyReportFromDisk()` (release first, then `public/data/daily/{date}.json`).
`systemStats` carries evening/day peak demand and generation, min/max generation,
energy generated, energy unserved (printed from 2025 only), max temperature, gas to
power, cost (derived). Energy day D is filed on D+1.

**Forecast board** (`GridForecastBoard`): PGCB's forecast peaks for `boardDate` and its
previous-day actual peaks; one row per day, captured hourly.

**What exists, and what does not:**

| figure | source | cadence | usable by the bot |
|---|---|---|---|
| demand, supply, load shed at an hour | `DEMAND_SUPPLY` | hourly, 3–6 h late | yes |
| generation total + fuel mix | `GENERATION` | hourly | yes, with the integrity rule |
| imports per interconnector | `GENERATION` / import series | hourly | yes; totals are our sums (D) |
| day's peaks, energy, unserved | `systemStats` | daily, D+1 | yes |
| forecast peaks | `GridForecastBoard` | daily | yes, never graded (doctrine rule 6) |
| zone/regional, outages, plants | daily JSON | daily | not in v1 (gated beyond 7 days, outages are free text) |
| **grid frequency** | — | — | **stored nowhere** |
| **records (annual/all-time)** | — | — | **no code computes them**; demand history is ~145 days, generation history since 2015 with gaps. PGCB's printed "till now the maximum generation" is deliberately not parsed |

**Tier gating.** Hourly history older than the latest daily date − 6 days is gated by
plan (`lib/data/grid/grid-tier-access.ts`). A public channel must not become a door to
it: the bot only ever speaks about the newest hour, today and yesterday.

**Measured distributions** (for alert thresholds, `scratch/tg-thresholds.ts`):

- Load shed, 3,603 hours over 145 days (2026-04-22 → 09-14): median 322 MW, p75 1,454,
  p90 2,352, p95 2,690, p99 3,342, max 3,757. **32% of hours are ≥1,000 MW**; 15% ≥2,000;
  **2.6% ≥3,000**.
- Generation hour-on-hour change, last 365 days (8,369 consecutive pairs): p1 −1,034 MW,
  p0.5 −1,230, p0.1 −1,667, worst −2,412. **Drops ≥2,000 MW: twice in a year.** All-time
  worst: −7,176 MW, 2022-10-04 15:00 (the national grid collapse).

## 5. Scheduled and background processing

- **Vercel:** one cron, `/api/cron/publish-scheduled` `*/15` (`vercel.json:11-17`),
  authenticated by `Authorization: Bearer $CRON_SECRET` (`lib/api/cron-auth.ts`, constant
  time). `/api/cron/ingest` is disabled (always 503). No `maxDuration` is configured.
- **Pi cron** (installed from `SCHEDULE`, `scripts/pi-ingest.sh:266-298`): polls
  09:30/12:30/16:30/21:30, nightly 02:30, weekly Sun 03:30, monthly 05:30, watcher
  `7,22,37,52 8-22`, hourly `:17`. All share `~/esb-ingest/.ingest.lock`.
- No queue, outbox, worker, webhook sender or email library exists.

## 6. Raspberry Pi integration

- Cron only. No systemd units, Docker, or pm2 in the repo or on the Pi (checked
  2026-09-14 over SSH: six cron lines).
- Every runner does `git reset --hard origin/authenticating` — the Pi runs
  **unreleased** code, and its checkout is overwritten up to ~60 times a day.
- Reaches the database through `~/esb-ingest/repo/.env.local` (transaction pooler, :6543).
- **Existing Telegram:** `scripts/pi-notify.sh` sends ops alerts with `curl` to
  `sendMessage` using `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` from
  `~/esb-ingest/notify.env`. Plain text, no retry, never fails the caller.
- Tailscale only, no inbound ports; `tailscale funnel` is forbidden
  (`docs/REMOTE-ACCESS.md`). **The Pi cannot receive a webhook.**
- Shares an SD card with Jellyfin; a 1 GiB free-disk guard stops runs.

## 7. Admin infrastructure

- `app/(admin)/admin/**`, 15 pages, wrapped by `AdminShell` (`components/admin/AdminShell.tsx`).
  A section needs: a `NAV_GROUPS` item (`:19-48`), a `PAGE_TITLES` entry (`:50-65`) and an
  `ADMIN_NAV_PERMISSIONS` entry (`lib/admin-nav.ts:5-18`) — **missing the last one makes
  the item visible to every admin** (`:22-23`).
- UI kit: `components/admin/AdminUI.tsx` (`AdminSectionStack`, `AdminPageHeader`,
  `AdminCard`, `AdminTableShell`, `AdminFilterTabs`, `AdminStatGrid`, …), shadcn, `sonner`.
- Pattern: async server page → `auth()` + `can(role, perm)` → `AdminForbidden` or content;
  mutations are server actions that re-check permission and write `AuditLog`.
- Roles: `PERMISSION_MATRIX` in `lib/constants.ts:48-100`; an action missing from the
  matrix denies everyone.

## 8. Deployment topology

- `main` auto-deploys production on push; `authenticating` and `yeasin` are opted out in
  `vercel.json` (the opt-out must exist on the branch being built).
- No branch protection (Free org plan).
- `build:vercel` = `prisma generate && migrate-deploy-prod.mjs && next build`.
- Prisma pool is capped at 2 in production (`lib/prisma-database.ts:127`); the pooler is
  shared by the site, the build's prerender and the Pi.

## 9. Logging and monitoring

- No logger, no Sentry, no OpenTelemetry. Convention: `console.warn/error` with a
  bracketed prefix (`[settings]`, `[releases]`). `@vercel/analytics` is installed and
  never imported.
- Pi: `alerts.log` + ops Telegram. Archive integrity: `verify:data`, `verify:source`.
- Nothing monitors the live layer or any background job on Vercel.

## 10. Best integration points

1. **Articles:** one non-throwing helper called after each in-app publish path commits,
   plus a **reconciliation sweep** that finds recently published articles with no
   announcement. The sweep also covers scripts (path h), lost events, withdrawals and
   headline edits, so correctness does not depend on every call site being hooked.
2. **Grid:** read `GridHourlyObservation` / `GridForecastBoard` / the daily release from
   the database on Vercel, after the Pi has captured them. The Pi is not touched.
3. **Delivery and commands:** Vercel — publicly reachable HTTPS for the webhook, the
   same deploy as the schema migration, `after()` for delivery within seconds.
4. **Fix the cron race** (path f) with a conditional update, because it is the one path
   where a real double-publish can occur.

## 11. Risks

| risk | consequence | mitigation |
|---|---|---|
| seven unhooked publish paths | missed announcements | reconciliation sweep |
| Bengali-title articles 404 | channel links to a 404 | never announce a Bengali-script title |
| backdated or imported articles | months-old story posted as news | announce only if `publishedAt` is within `articleMaxAgeHours` and after the feature went live |
| Telegram success + DB write failure | duplicate post on retry | ambiguous outcomes go to `UNCERTAIN`, never auto-retried |
| NLDC lag 3–6 h, batched posting | "hourly" bulletins stale or bursty | bulletin only the newest hour, only if within `gridMaxAgeHours`, at most one per interval |
| hourly data gated by plan | channel leaks gated history | bot speaks only of newest hour, today, yesterday |
| middleware bot guard | Telegram's webhook POST rejected | narrow path bypass before the guard; the route checks the secret |
| pooler shared with the site | connection exhaustion | cron every 5 min, pool of 2, no long transactions |
| migration applied only on a production build | code on `authenticating` ahead of the schema | notification code is Vercel-only; the Pi does not import it |
| `SiteSetting` sent to the settings form | none for config, but bad for secrets | dedicated `NotificationSetting` table; secrets stay in env |
| `Notification` name taken | model collision | `NotificationEvent` / `NotificationDelivery` |

## 12. Decisions

1. **Postgres-backed queue** in two new tables, claimed with `FOR UPDATE SKIP LOCKED`. No
   Redis, no new service.
2. **Everything runs on Vercel.** The Pi keeps doing ingestion and nothing else; it gains
   no process, no dependency and no code path.
3. **Webhook, not long polling** — Vercel is reachable over HTTPS and cannot host a
   long-lived poller; the Pi could poll but cannot be reached and runs unreleased code.
4. **A new, separate bot** for the public channel. The ops bot in `notify.env` is left alone.
5. **Delivery within seconds via `after()`**, with a `*/5` cron sweep as the safety net.
6. **Deterministic text only.** No AI in any path.
7. **Not implemented, deliberately:** `OFFICIAL_DOCUMENT_DETECTED` (every detected file is a
   routine daily report; broadcasting detections is spam and unverified), records (no
   trustworthy basis — §4), grid frequency (not stored), `/broadcast` from Telegram (a
   compromised admin account would become a public post; publish through the CMS instead),
   magazine announcements (no publish event exists).
