# AUDIT-INVENTORY.md — Phase 0 Reconnaissance

**Repository:** `esbpowerline` (ESB PowerLine — Bangladesh energy & power sector portal)
**Snapshot taken:** 2026-08-20, branch `authenticating`, HEAD `43e1c858`
**Purpose:** A factual, navigable inventory of routes, data flow, external dependencies and configuration. Facts with `file:line` references. No recommendations.

> **Reading this in 2030?** Start with §0.1 (why there are three "surfaces" but only one production build), then §2.4 (the one rule that decides which copy of a day's data the site serves). §3.6 lists every number on the site that is a source literal rather than data. Line numbers are as of the snapshot above; `next.config.ts` was edited during the survey and its references reflect the post-edit file.

### Counts at a glance

| Thing | Count |
|---|---|
| Pages (`page.tsx`) | **61** — 19 public, 16 CMS, 15 admin, 11 ungrouped |
| Route handlers (`route.ts`) | **28** — 25 under `app/api/`, 3 elsewhere |
| Layouts / error / loading | 8 / 2 / 5 |
| Redirects | 3 (all permanent, all in `next.config.ts`); **0 rewrites** |
| Cron jobs scheduled | 1 (`/api/cron/publish-scheduled`, `*/15 * * * *`) |
| External hostnames reachable at runtime | **15** (§4.1) + 7 build/script-only (§4.2) |
| Environment variables read | **54** — 10 `NEXT_PUBLIC_`, 44 server-only |
| `public/data` files | **11,601** (413 MB) across 9 directories |
| `DataFeed` values | 13 |
| Runtime dependencies | 51 declared, **8 unreferenced in source** |
| Grid Explorer tabs | 9 |

---

## 0. Platform facts

| Item | Value | Source |
|---|---|---|
| Framework | Next.js — `^16.2.10` declared, **16.3.0** installed | `package.json:56`; `node_modules/next/package.json` |
| React | `^19.2.7` declared, **19.2.8** installed | `package.json:59-60` |
| Prisma | `^7.8.0` declared, **7.9.1** installed | `package.json:57-58`, `package.json:128` (`allowScripts`) |
| Node engine | **Not declared.** No `engines` field, no `.nvmrc`, no `.node-version` | `package.json` (absent) |
| Package manager | **npm** — only `package-lock.json` present | repo root |
| TypeScript | `^5.8.3`, `strict: true`, target ES2017, path alias `@/* → ./*` | `tsconfig.json:10,25-29` |
| Build errors | TypeScript errors **fail** the build | `next.config.ts:158-160` (`ignoreBuildErrors: false`) |
| Bundler | dev scripts force `--webpack`; Turbopack FS cache for build enabled, for dev disabled | `package.json:9-11`, `next.config.ts:146-147` |
| Server Action CSRF | `experimental.serverActions.allowedOrigins` is **`[]` in production** (same-origin only); the six localhost/127.0.0.1 dev origins apply only outside prod | `next.config.ts:128-144` |
| Instrumentation | `register()` runs `sanitizeAuthEnv()` then `validateProdEnv()` on Node runtime only | `instrumentation.ts:1-10` |
| Prisma config | schema `prisma/schema.prisma`, migrations `prisma/migrations`, datasource url from `DATABASE_URL` with a **localhost fallback** | `prisma.config.ts:4-12` |
| Deploy | Vercel, CLI upload (`git.deploymentEnabled.authenticating: false` — the current branch does **not** auto-deploy) | `vercel.json:2-9` |
| Build command (Vercel) | `npm run build:vercel` = `prisma generate && node scripts/migrate-deploy-prod.mjs && next build` | `vercel.json:2`, `package.json:16` |

### 0.1 The three-surface build system

`APP_SURFACE` has only **two** effects in the whole codebase:

1. **Separate dist directories**, so three concurrent dev servers do not corrupt each other's cache — `next.config.ts:4-5`:
   ```ts
   const surface = process.env.APP_SURFACE ?? 'all';
   const distDir = surface === 'all' ? '.next' : `.next-${surface}`;
   ```
2. **Cross-port URL resolution** in dev — `lib/workspace-urls.ts:7-17`, `lib/auth-routing.ts:87-101`.

It is re-exported to the client as `NEXT_PUBLIC_APP_SURFACE` (`next.config.ts:119-121`).

Complete list of `APP_SURFACE` reads: `lib/workspace-urls.ts:9,11`; `next.config.ts:4,111`; `package.json:9,10,11`.

**Consequence:** the three "surfaces" are a *development-time* split only.

- `npm run dev:all` (`package.json:14`) runs three Next instances via `concurrently`: `dev:public` (APP_SURFACE=public, port 3000), `dev:cms` (cms, 3001), `dev:admin` (admin, 3002), plus `dev:warmup`.
- `npm run build` (`package.json:15`) leaves `APP_SURFACE` unset → surface `all`, distDir `.next`. **Production is a single unified build** containing all three route groups, served from one origin.
- In production the workspaces are separated by **hostname**, not by build: `getPublicSiteUrl()` maps `cms.` / `admin.` subdomain prefixes back to the base domain (`lib/auth-routing.ts:73-79`), and `resolveWorkspaceUrl()` short-circuits to a plain path whenever `isSplitSurfaceDev()` is false (`lib/auth-routing.ts:87-88`).
- Access separation is therefore entirely **role-based in the proxy**, not build-based — see §1.3.

Surface origin overrides, when set, win over both: `NEXT_PUBLIC_ADMIN_SITE_URL` (`lib/workspace-urls.ts:21`), `NEXT_PUBLIC_CMS_SITE_URL` (`lib/workspace-urls.ts:31`), falling back to `NEXT_PUBLIC_APP_URL` (`lib/workspace-urls.ts:26,36`).

---

## 1. Route map

Totals: **61 pages**, **28 route handlers** (25 under `app/api/`), **8 layouts**, 2 `error.tsx`, 5 `loading.tsx`, 1 `robots.ts`, 1 `sitemap.ts`.

### 1.1 Pages

#### `app/(public)/` — 19 pages

| URL | File | Segment config |
|---|---|---|
| `/` | `app/(public)/page.tsx` | `revalidate = 180` (`:50`) |
| `/about` | `app/(public)/about/page.tsx` | `revalidate = 86400` (`:7`) |
| `/annual-reports/financials` | `app/(public)/annual-reports/financials/page.tsx` | `dynamic = 'force-static'` (`:5`) |
| `/articles` | `app/(public)/articles/page.tsx` | `revalidate = 300` (`:12`) |
| `/articles/[slug]` | `app/(public)/articles/[slug]/page.tsx` | `revalidate = 600` (`:28`), `generateMetadata` (`:32`) |
| `/authors/[slug]` | `app/(public)/authors/[slug]/page.tsx` | `revalidate = 600` (`:11`) |
| `/categories` | `app/(public)/categories/page.tsx` | `revalidate = 86400` (`:16`) |
| `/categories/[slug]` | `app/(public)/categories/[slug]/page.tsx` | `revalidate = 600` (`:12`) |
| `/contact` | `app/(public)/contact/page.tsx` (+ `contact/layout.tsx`) | none |
| `/energy-policy` | `app/(public)/energy-policy/page.tsx` | `revalidate = 3600` (`:9`) |
| `/energy-policy/[slug]` | `app/(public)/energy-policy/[slug]/page.tsx` | `revalidate = 3600` (`:10`), `generateStaticParams` (`:37`) |
| `/grid-explorer` | `app/(public)/grid-explorer/page.tsx` | `revalidate = 300` (`:18`) |
| `/magazine` | `app/(public)/magazine/page.tsx` | `dynamic = 'force-dynamic'` (`:22`) — artwork arrives as 1h Supabase signed URLs, so a cached page would serve expired links |
| `/search` | `app/(public)/search/page.tsx` | `revalidate = 600` (`:6`) |
| `/sign-in/[[...sign-in]]` | `app/(public)/sign-in/[[...sign-in]]/page.tsx` | none |
| `/sign-up/[[...sign-up]]` | `app/(public)/sign-up/[[...sign-up]]/page.tsx` | none |
| `/tags` | `app/(public)/tags/page.tsx` | none |
| `/tags/[tag]` | `app/(public)/tags/[tag]/page.tsx` | `revalidate = 600` (`:6`) |
| `/titas-gas` | `app/(public)/titas-gas/page.tsx` | `revalidate = 3600` (`:5`) |

Supporting files: `app/(public)/layout.tsx`, `app/(public)/error.tsx`, `app/(public)/grid-explorer/loading.tsx`.

#### `app/(admin)/` — 15 pages

`/admin`, `/admin/analytics`, `/admin/articles`, `/admin/categories`, `/admin/comments`, `/admin/data`, `/admin/logs`, `/admin/magazine`, `/admin/media`, `/admin/messages`, `/admin/settings`, `/admin/tags`, `/admin/users`, `/admin/users/new`, `/admin/users/[id]`.

Only one carries segment config: `app/(admin)/admin/data/page.tsx:7` — `export const dynamic = 'force-dynamic'`. Supporting: `app/(admin)/admin/layout.tsx`, `error.tsx`, `loading.tsx`.

#### `app/(cms)/` — 16 pages

`/cms`, `/cms/analytics`, `/cms/articles`, `/cms/articles/new`, `/cms/articles/drafts`, `/cms/articles/scheduled`, `/cms/articles/[id]/edit`, `/cms/calendar`, `/cms/categories`, `/cms/comments`, `/cms/media`, `/cms/notices`, `/cms/tags`, `/cms/trash`, `/cms/users/[id]`, `/cms/yoy-sheet`.

No segment config on any (only `app/(cms)/cms/yoy-sheet/page.tsx:6` metadata). Supporting: `app/(cms)/cms/layout.tsx`, `cms/loading.tsx`, `cms/articles/new/loading.tsx`, `cms/articles/[id]/edit/loading.tsx`.

#### Ungrouped — 11 pages

| URL | File | Config |
|---|---|---|
| `/login` | `app/login/page.tsx` (+ `layout.tsx`, `actions.ts`) | `dynamic = 'force-dynamic'` (`:11`) |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | `dynamic = 'force-dynamic'` (`:16`) |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | `dynamic = 'force-dynamic'` (`:16`) |
| `/members` | `app/members/(panel)/page.tsx` | none |
| `/members/account` | `app/members/(panel)/account/page.tsx` | none |
| `/members/comments` | `app/members/(panel)/comments/page.tsx` | none |
| `/members/downloads` | `app/members/(panel)/downloads/page.tsx` | none |
| `/members/magazine` | `app/members/(panel)/magazine/page.tsx` | none |
| `/members/saved` | `app/members/(panel)/saved/page.tsx` | none |
| `/members/subscription` | `app/members/(panel)/subscription/page.tsx` | none |
| `/members/login` | `app/members/login/page.tsx` (+ `layout.tsx`, `actions.ts`) | `dynamic = 'force-dynamic'` (`:11`) |

Root: `app/layout.tsx`, `app/providers.tsx`, `app/ProvidersShell.tsx`, `app/robots.ts`, `app/sitemap.ts` (`revalidate = 3600`, `app/sitemap.ts:6`).

### 1.2 Route handlers (API)

`AUTH` column quotes the guard verbatim. `FD` = `export const dynamic = 'force-dynamic'`.

| Route | Methods | FD / other config | Auth check (quoted) |
|---|---|---|---|
| `/api/admin/data/ingest-day` | POST (`:45`) | FD `:26`, `maxDuration = 800` `:27` | `:47` `if (!session?.user \|\| !can(session.user.role, 'data.publish')) {` → 401 |
| `/api/admin/data/parse` | POST (`:57`) | FD `:26`, `maxDuration = 300` `:27` | `:59` same `'data.publish'` check → 401 |
| `/api/admin/data/publish` | POST (`:63`) | FD `:27`, `maxDuration = 600` `:28` | `:65` same `'data.publish'` check → 401 |
| `/api/admin/data/publish-local` | POST (`:53`) | FD `:29`, `maxDuration = 600` `:30` | `:55` same `'data.publish'` check → 401 |
| `/api/admin/data/sreda` | POST (`:28`) | FD `:25`, `maxDuration = 120` `:26` | `:30` same `'data.publish'` check → 401 |
| `/api/admin/messages/[id]` | PATCH (`:6`), DELETE (`:40`) | none | `:11` and `:45` `if (!session?.user?.role \|\| !canAccessAdminPanel(session.user.role)) {` → 401 |
| `/api/analytics` | GET (`:8`) | FD `:6` | `:10` `if (!session?.user?.id \|\| !session?.user?.role \|\| !canAccessAdminPanel(session.user.role)) {` → 401; also 403 at `:22`. Additionally proxy-gated (`analytics.view_all`). |
| `/api/articles/[articleId]/view` | POST (`:11`) | none | **No session auth.** Rate limit only: `:15` `const limited = checkRateLimitResponse(request, 'api-article-view', 120, 60_000);` |
| `/api/auth/handoff` | GET (`:17`) | FD `:7`, `runtime = 'nodejs'` `:6` | **No session guard** — validates a signed handoff token instead (`verifyHandoffToken`, `lib/auth-handoff`); callback URL sanitised at `:9-15` |
| `/api/auth/session` | GET (`:8`) | FD `:5`, `runtime = 'nodejs'` `:4` | `:9-12` returns `null` when unauthenticated (not a 401) |
| `/api/cms/yoy-archive` | POST (`:40`), GET (`:105`) | FD `:25` | `:44` and `:107` `if (!session?.user \|\| !can(session.user.role, 'article.create')) {` → 401. Writes to a mapped network drive; local-dev only. |
| `/api/contact/csrf` | GET (`:6`) | FD `:4` | **None** — mints a CSRF token cookie (`httpOnly: false`, `sameSite: 'strict'`, `:10-13`) |
| `/api/contact` | POST (`:6`) | none | **No session auth.** `:7` `const csrfDenied = checkCsrf(request);` + `:15` `checkRateLimit(\`contact:${ip}\`, 5, 60_000)` |
| `/api/cron/ingest` | GET (`:7`) | FD `:5` | `:8` `if (!process.env.CRON_SECRET?.trim())` → 503; `:12` `if (!isCronAuthorized(request))` → 401. **Body is a no-op stub** — returns a guard message rather than running the Python pipeline on Vercel (`:19-21`). |
| `/api/cron/publish-scheduled` | GET (`:7`) | FD `:5` | `:8` → 503 if unset; `:12` `if (!isCronAuthorized(request))` → 401 |
| `/api/data/[...path]` | GET (`:20`) | FD `:18` | **No route-level auth** — deliberately gated by the proxy, which strips `/api` and applies the same tier rules as `/data/*` (see comment `:8-11`) |
| `/api/data-manifest` | GET (`:30`) | FD `:21` | **None.** Publishes only released *keys*, no payloads (`:19`) |
| `/api/db/health` | GET (`:7`) | FD `:5` | `:8` `if (!isCronAuthorized(request))` → 401 |
| `/api/market/dse` | GET (`:12`) | `revalidate = 60` `:5` | **None.** Rate limit only: `:13` `checkRateLimitResponse(request, 'api-market-dse', 60, 60_000)` |
| `/api/media-proxy` | GET (`:6`) | none | `:8` `if (!session?.user?.role \|\| !can(session.user.role, 'media.upload')) {` → 401; plus `:35` 403 "Forbidden domain" and `:41` 403 "Redirects are not permitted" |
| `/api/members/grid-export` | GET (`:41`) | FD `:31`, `runtime = 'nodejs'` `:30`, `maxDuration = 60` `:33` | `:45` `if (!session?.user?.id) {` → 401; second Supabase check `:80` → 401; `:87` `checkGridExportRateLimit(userId)`. Also proxy-gated (any signed-in role). |
| `/api/members/recent-downloads` | GET (`:8`) | FD `:6` | `:11` and `:18` → 401 via `getMemberSession()` |
| `/api/supabase/health` | GET (`:9`) | FD `:7` | `:11` `const session = cronAuthorized ? null : await auth();` then admin-panel role check `:12-13`, 401 at `:16` |
| `/api/upload` | POST (`:11`) | none | `:13` `if (!session?.user \|\| !can(session.user.role, 'media.upload')) {` → 401; `:18` rate limit 20/60s. Also proxy-gated. |
| `/api/upload/category-icon` | POST (`:7`) | none | `:9` `if (!session?.user \|\| !can(session.user.role, 'category.manage')) {` → 401; `:14` rate limit 10/60s. Also proxy-gated (`/api/upload` prefix). |

Non-`/api` route handlers:

| Route | Methods | Config | Auth |
|---|---|---|---|
| `/auth/callback` | GET (`app/auth/callback/route.ts:5`) | none | Supabase OAuth/code exchange (`:15`) |
| `/auth/continue` | GET (`app/auth/continue/route.ts:12`) | none | `:22-23` `if (!session?.user?.id \|\| !session.user.email \|\| !session.user.role)` → redirect, not 401 |
| `/uploads/[...path]` | GET (`app/uploads/[...path]/route.ts:5`) | none | **None.** Reads `public/uploads` from disk by fuzzy suffix match (`:19-32`), serves with `Cache-Control: public, max-age=31536000, immutable` (`:47`) |

### 1.3 Proxy / middleware

**The repo uses the legacy `middleware.ts` convention, not `proxy.ts`.** File: `middleware.ts` (303 lines), exporting `export async function middleware(request: NextRequest)` at `middleware.ts:128`.

Next.js 16 deprecation, quoted from the installed docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:11`):

> **Note**: The `middleware` file convention is deprecated and has been renamed to `proxy`.

and the version table at the same file `:774`:

> `v16.0.0` | Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime

A codemod exists (`proxy.md:755-761`). This repo has not run it.

**Matcher** (`middleware.ts:299-303`):
```ts
matcher: [
  '/((?!_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|api/cron).*)',
]
```
Note `api/cron` is excluded from the proxy — cron routes self-authenticate with `CRON_SECRET`.

**Execution order inside `middleware()`:**

1. **Upstash rate limiting** (`:136-179`) — only when `UPSTASH_REDIS_REST_URL` is set (`:31`). Credential paths get 5/min (`:33-37`), other `/api/*` gets 100/10s (`:39-42`); page views are not limited (`:145`). Limiter errors **fail open** (`:167` `allowed = true; // fail open rather than take the site offline`).
   Credential paths (`:52-60`): `/login`, `/api/auth`, `/members/login`, `/auth/forgot-password`, `/auth/reset-password`, `/sign-in`, `/sign-up`.
2. **Protected data JSON gate** (`:181-256`) — for `isProtectedDataJsonPath(pathname)`: blocked-bot UA check (`:184`), same-origin referer check (`:189-197`), then tier gating by ISO date. Public window: PGCB 7 days, Petrobangla 45 days (`:209` `const PETROBANGLA_PUBLIC_DAYS_BACK = 45;`). Dates *beyond* the shipped archive are treated as public (`:231` `isBeyondShippedArchive`) because a runtime-published day cannot appear in the build-time catalog. Restricted dates resolve a Supabase session and call `isDateAllowedForTier` (`:245-252`).
3. **Bot UA block** for all other paths (`:258-265`).
4. **Two fast paths** skipping Supabase entirely (`:267-278`).
5. **Proxy-protected API role gate** (`:283-291`) for the prefixes in `lib/api/protected-routes.ts:6-10`: `/api/analytics`, `/api/upload`, `/api/members/grid-export`. `isCronAuthorized(request)` bypasses (`:284`).
6. **Page role gate** (`:293-297`) via `canAccessPath` (`lib/auth-routing.ts:30-36`): `/members` → `SUBSCRIBER` only; `/admin` → `canAccessAdminPanel`; `/cms` → `can(role, 'article.create')`.

`isCronAuthorized` (`lib/api/cron-auth.ts:12-19`) is a constant-time `Bearer ${CRON_SECRET}` compare; returns `false` when the secret is unset (`:14`).

### 1.4 Redirects and rewrites

**`next.config.ts:242-260` — 3 permanent redirects, no rewrites anywhere:**

| Source | Destination | Permanent |
|---|---|---|
| `/advertising` | `/contact#advertising` | yes |
| `/power-grid` | `/grid-explorer` | yes |
| `/power-grid/:path*` | `/grid-explorer/:path*` | yes |

`vercel.json` defines **no** redirects or rewrites — only `headers` and `crons`.

### 1.5 Headers

**`next.config.ts:201-240`** — applied to `/(.*)`:
- `Content-Security-Policy` (built at `:43-62`, see §4.3)
- `X-Content-Type-Options: nosniff` (`:207`), `X-Frame-Options: SAMEORIGIN` (`:208`), **`X-XSS-Protection: 0`** (`:209` — the modern setting; the legacy auditor is disabled rather than enabled, and `frame-ancestors` now carries the clickjacking control), `Referrer-Policy: strict-origin-when-cross-origin` (`:210`), `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` (`:211`), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (`:212`)
- Production-only immutable caching for `/_next/static/(.*)`, `/images/(.*)`, `/fonts/(.*)` (`:222-224`, guarded by `immutableAsset` `:26-29` — dev is excluded because stable dev chunk names would serve stale bytes for a year, `:215-221`)
- `/data/daily/(.*)` → `Cache-Control: private, no-store` (`:225-231`)
- `/data/(.*)` → `nosniff` + `Referrer-Policy` (`:232-238`)

**`vercel.json:17-67`** — a second, overlapping header layer: `private, no-store` for `/data/daily/*`, `/data/sreda/*`, `/api/admin/*`, `/api/auth/*`, `/api/members/*`, `/api/analytics/*`, `/api/contact/*`; and `public, s-maxage=60, stale-while-revalidate=300` for every other `/api/*` (`:62-67`, negative-lookahead excludes admin|auth|members|analytics|contact|upload).

### 1.6 Cron jobs

`vercel.json:10-16` declares **one** cron:

| Path | Schedule |
|---|---|
| `/api/cron/publish-scheduled` | `*/15 * * * *` |

`/api/cron/ingest` exists as a route but is **not scheduled** in `vercel.json` (note the blank line at `vercel.json:11` where an entry was removed), and its handler is a stub that refuses to run the Python ingestion on Vercel (`app/api/cron/ingest/route.ts:19-21`).

### 1.7 robots.txt / sitemap

`app/robots.ts` — disallows `/admin`, `/cms`, `/members`, `/api`, `/search?`, `/data/`, `/login`, `/auth/`, `/sign-in`, `/sign-up` (`:10-31`); a second rule disallows `/` outright for 26 named AI/SEO crawlers (`:33-63`) including `GPTBot`, `ClaudeBot`, `CCBot`, `AhrefsBot`, `Bytespider`. Sitemap URL from `NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com'` (`:4`).

`app/sitemap.ts` — `revalidate = 3600` (`:6`); emits articles, categories, magazine, energy-policy slugs and static routes off the same base URL (`:12`).

### 1.8 File-tracing exclusions (deploy-size control)

`next.config.ts:79-117` documents a real production incident. `outputFileTracingExcludes` strips `public/data/**` from `/api/cron/ingest`, `/admin/**`, `/cms/**`, `/api/upload/**`, and strips `public/data/plants/**` + `public/data/curves/**` from **every** function (`:104`). `outputFileTracingIncludes` (`:109-117`) forces the daily archive, the Petrobangla index, the logo and `public/fonts/**` back into `/api/members/grid-export`.

Recorded caveat, `next.config.ts:95-97`:
> Note these keys are route paths, so `/admin/**` above does NOT cover `/api/admin/**` — those routes still carry the archive and sit closer to the limit than they look.

---

## 2. Data architecture of the Grid Explorer

Three layers serve the same logical dataset, in strict precedence: **`DataRelease` (Postgres, runtime) → `public/data/*.json` (static, shipped by deploy) → `lib/data/grid/archive-fallback.ts` (bundled JS constant)**.

### 2.1 Static archive — `public/data/`

Total **11,601 files, 413 MB** across 9 directories. No loose files at the `public/data` root.

| Directory | Files | Size | Naming | Date range |
|---|---|---|---|---|
| `public/data/daily/` | 4,534 | 77 MB | `YYYY-MM-DD.json` | 2013-12-31 → 2026-08-19 (calendar span 4,615 days ⇒ **81 missing days**) |
| `public/data/curves/` | 1,983 | 17 MB | `YYYY-MM-DD.json` | 2014-01-01 → 2026-08-19 |
| `public/data/plants/` | 2,297 | 151 MB | `YYYY-MM-DD.json` | 2014-01-01 → 2026-08-19 |
| `public/data/petrobangla/daily/` | 2,300 | 109 MB | `YYYY-MM-DD.json` (2,296 conforming) | 2020-01-12 → 2026-08-18 |
| `public/data/petrobangla/` (singletons) | 7 | — | named files | — |
| `public/data/pgcb-monthly/` | 317 | 31 MB | `YYYY-MM.json`, `YYYY-MM-events.json`, `_series.json` | 2013-01 → 2026-06 |
| `public/data/grid-verification/` | 157 | 28 MB | `YYYY-MM.json` (152) + 5 specials | 2014-01 → 2026-08 |
| `public/data/sreda/daily/` | 6 | 120 KB | `YYYY-MM-DD.json` | 2026-06-29 → 2026-08-09 |

Non-conforming filenames present: `petrobangla/daily/_manifest.json`, `Daily-Gas-Intake-Offtake-Report (1.3.05.26).json`, `Daily-Gas-Intake-Offtake-Report (16 12.25).json`, `Petrobangla.json` (stray parser dumps; none resolve to a feed); `grid-verification/{_gaps,_index,_pgcb-workbook-index,no-source-days,unit-cost}.json`; `petrobangla/{_index,_live_week,_manifest,reserve-model,reserve-sensitivity,reserves-published,timeline-summary}.json`.

Files with **no feed mapping at all** (changeable only by redeploy): the whole 28 MB `grid-verification/` tree, `petrobangla/_manifest.json`, `petrobangla/reserves-published.json`.

### 2.2 Prisma runtime layer

`prisma/schema.prisma:5-11` — `generator client { provider = "prisma-client-js" }`, `datasource db { provider = "postgresql" }`. **No `url` in the datasource block**; the connection string is injected by the driver adapter. `lib/prisma.ts:18-22` constructs `new PrismaPg(new Pool(createPgPoolConfig(databaseUrl)))`. URL resolution order (`lib/prisma-database.ts:9-20`): `DATABASE_URL` → `POSTGRES_PRISMA_URL` → `POSTGRES_URL` → hardcoded `postgresql://postgres:postgres@localhost:5432/esbpowerline`. `ssl: { rejectUnauthorized: false }` for remote hosts (`lib/prisma-database.ts:56`); pool `max: 2` in production (`:57`).

**The governing comment, `prisma/schema.prisma:512-519` (verbatim):**

> Historically every daily report shipped as a static file under public/data
> and therefore needed a rebuild. These tables let a parsed day be staged,
> reviewed and published at runtime instead. The static archive stays exactly
> as it is — it is the substrate the local parser reads and it serves ~6,800
> unchanging days straight from the CDN. Only days published after the last
> deploy live here, and a release always wins over a static file of the same
> key so a correction can supersede a shipped day.

**`enum DataFeed` — 13 values** (`prisma/schema.prisma:521-539`): `GRID_DAILY`, `GAS_DAILY`, `GAS_INDEX`, `GAS_LIVE_WEEK`, `GAS_TIMELINE`, `PGCB_MONTHLY_SERIES`, `PGCB_MONTHLY`, `SREDA_DAILY`, `GRID_CURVE`, `GRID_PLANTS`, `PGCB_MONTHLY_EVENTS`, `GAS_RESERVE_MODEL`, `GAS_RESERVE_SENSITIVITY`.

**`model DataDraft`** (`prisma/schema.prisma:542-561`) — "A parsed payload awaiting review. Transient: cleared once published or discarded."

| Field | Type | Attributes / notes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `feed` | `DataFeed` | |
| `key` | `String` | ISO date (daily), `YYYY-MM` (monthly), `"singleton"` (aggregates) |
| `payload` | `Json` | |
| `validation` | `Json?` | parser reconciliation + warnings; shape owned by the parser |
| `checksum` | `String` | SHA-256 of the canonical payload |
| `sourceName` | `String?` | original upload filename, e.g. `"23.07.26.pdf"` |
| `sourceUrl` | `String?` | archived original in Supabase Storage |
| `parserVersion` | `String?` | |
| `createdAt` | `DateTime` | `@default(now())` |
| `createdById` | `String?` | no FK relation declared |

Indexes: `@@unique([feed, key])` (`:559`), `@@index([createdAt])` (`:560`).

**`model DataRelease`** (`prisma/schema.prisma:564-582`) — "A published payload. This is what the site serves."

| Field | Type | Attributes / notes |
|---|---|---|
| `id` | `String` | `@id @default(cuid())` |
| `feed` | `DataFeed` | |
| `key` | `String` | |
| `payload` | `Json` | |
| `checksum` | `String` | |
| `sourceName` | `String?` | |
| `sourceUrl` | `String?` | |
| `parserVersion` | `String?` | |
| `revokedAt` | `DateTime?` | `:573-574` — "Set when a release is withdrawn; the loader then falls back to the static archive rather than serving a known-bad day." |
| `publishedAt` | `DateTime` | `@default(now())` |
| `publishedById` | `String?` | no FK relation declared |
| `updatedAt` | `DateTime` | `@updatedAt` |

Indexes: `@@unique([feed, key])` (`:580`, used as `where: { feed_key: {...} }`), `@@index([feed, revokedAt])` (`:581`).

**Other models** (name @ line): `User@16`, `Article@61`, `ArticleView@112`, `Category@138`, `EditorialNotice@154`, `Revision@190`, `Media@205`, `Comment@222`, `SavedItem@238`, `MemberDownload@254`, `MemberGridSubscription@266`, `MagazineIssue@301`, `Node@316` (power-grid graph nodes, from BD_PWR_TREE), `Edge@347` (grid graph edges), `DashboardStat@364`, `AuditLog@383`, `NewsletterSub@393`, `Ad@400`, `SiteSetting@414`, `Profile@425` (mirror of Supabase `auth.users`), `Tag@437`, `TickerItem@446`, `Notification@458`, `Bookmark@472`, `ArticleHistory@483`, `ContactMessage@498`.

Enums: `Role@43`, `UserStatus@52`, `ArticleStatus@126`, `EditorialNoticeType@171`, `EditorialNoticeStatus@180`, `SavedItemType@249`, `GridSubscriptionPlan@278`, `GridSubscriptionStatus@284`, `CommentStatus@291`, `DataFeed@521`.

### 2.3 `lib/data/feed-paths.ts` — the feed↔path table

Isomorphic by design (the browser imports it, so it must not touch Prisma) — `lib/data/feed-paths.ts:1-14`. `DataFeedName` is a string union kept in step with `enum DataFeed` (`:16-29`).

| Feed | Key shape | Path under `public/data/` | Line |
|---|---|---|---|
| `GRID_DAILY` | ISO date | `daily/{key}.json` | `:41` |
| `GRID_CURVE` | ISO date | `curves/{key}.json` | `:42` |
| `GRID_PLANTS` | ISO date | `plants/{key}.json` | `:43` |
| `GAS_DAILY` | ISO date | `petrobangla/daily/{key}.json` | `:44` |
| `SREDA_DAILY` | ISO date | `sreda/daily/{key}.json` | `:45` |
| `GAS_INDEX` | `singleton` | `petrobangla/_index.json` | `:50` |
| `GAS_LIVE_WEEK` | `singleton` | `petrobangla/_live_week.json` | `:51` |
| `GAS_TIMELINE` | `singleton` | `petrobangla/timeline-summary.json` | `:52` |
| `GAS_RESERVE_MODEL` | `singleton` | `petrobangla/reserve-model.json` | `:53` |
| `GAS_RESERVE_SENSITIVITY` | `singleton` | `petrobangla/reserve-sensitivity.json` | `:54` |
| `PGCB_MONTHLY_SERIES` | `singleton` | `pgcb-monthly/_series.json` | `:55` |
| `PGCB_MONTHLY` | `YYYY-MM` | `pgcb-monthly/{key}.json` | `:75`, `:94` |
| `PGCB_MONTHLY_EVENTS` | `YYYY-MM` | `pgcb-monthly/{key}-events.json` | `:70`, `:96` |

Key validators: `ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/` (`:36`) — rejects 2010 and 2030+, and does **not** range-check month/day. `MONTH_RE = /^(201[1-9]|202[0-9])-(0[1-9]|1[0-2])$/` (`:37`) — rejects `2013-01`.

Exports: `resolveDataTarget(relPath)` (`:59-84`; strips a leading `/` and an optional `api/`+`data/` prefix at `:60`; `-events` is special-cased *before* the generic month rule at `:66-71`), `dataPathFor(feed, key)` (`:87-99`), `isValidFeedKey(feed, key)` (`:102-105`, "the publisher's guard"), `staticDataUrl(relPath)` → `/data/{relPath}` (`:107-109`), `runtimeDataUrl(relPath)` → `/api/data/{relPath}` (`:111-113`).

### 2.4 The DataRelease publish flow and the precedence rule

`lib/data/releases.server.ts` (144 lines), `import 'server-only'` (`:1`), `unstable_cache` (`:2`).

**Fail-soft charter, `lib/data/releases.server.ts:6-15` (verbatim):**

> Runtime-published data (see the DataRelease model). The static archive under
> public/data still serves every day shipped with the last deploy; this layer
> only knows about days published since.
>
> Everything here fails soft. A release lookup is an enhancement to a read path
> that already works, so a database outage — or a deploy that lands the code
> before the table exists — must degrade to the static archive rather than take
> the Grid Explorer down. That mirrors the fail-open choice in middleware.ts.

**The precedence rule, `lib/data/releases.server.ts:125-139` (verbatim):**

> The precedence rule every server-side reader must apply, in one place:
> "a release always wins over a static file of the same key" (see the comment
> above `enum DataFeed` in prisma/schema.prisma). Returns the published payload
> when the key is published, or null to mean "nothing published — read the file".
>
> Checking the key list first is what makes this affordable. `getReleasePayload`
> caches per key, so asking it about every day of a 1,500-day export would cost
> a cache entry (and, on a cold instance, a query) per day; the key list is one
> cached entry per feed. It also keeps the common case — a day that only exists
> as a static file — free.
>
> Fails soft in both steps: an unreachable database yields an empty key list and
> a null payload, so the caller falls through to the static archive.

**Staleness backstop, `lib/data/releases.server.ts:19-29` (verbatim):**

> Upper bound on staleness, in seconds.
>
> Publishing invalidates by tag, so this is not the normal refresh path — it is
> the backstop for the cases tag invalidation cannot cover: a row written
> outside the server action (the local ingest bridge writes over SQL), or a
> publish handled by a different serverless instance from the one serving a
> read. Without it, `unstable_cache` holds a value indefinitely and a missing
> day stays missing forever. A minute costs at most one query per feed per
> minute, which is nothing next to the risk of serving a stale archive.

`const RELEASE_CACHE_SECONDS = 60;` (`:30`).

Exports: `RELEASE_CACHE_TAG = 'data-releases'` (`:17`), `feedCacheTag(feed)` → `data-release:${feed}` (`:33-35`), `getPublishedKeys` (`:75-80`, tagged `[RELEASE_CACHE_TAG, feedCacheTag(feed)]`, `revalidate: 60`), `getAllPublishedKeys` (`:110-115` — one query for all 13 feeds; the per-feed version caused a visible manifest flicker, documented at `:82-95`), `getReleasePayload` (`:118-123`), `getReleaseOverride` (`:140-144`). All DB reads filter `revokedAt: null` (`:45`, `:98`); `readPayload` re-checks at `:62`.

### 2.5 Loaders and net resolution order

**`lib/data/grid/daily-loader.server.ts` (106 lines)** — `loadDailyReportFromDisk(isoDate)` (`:52-106`):

1. **Release first** (`:58-75`). Comment `:58-62`: *"Release first, not file first. A correction to a day that already shipped has a static file, so an ENOENT-only fallback would never reach it and the stale day would be served forever."* Dynamic `import('@/lib/data/releases.server')` (`:64`) → `getReleaseOverride('GRID_DAILY', parsed)` (`:65`); wrapped in `try/catch {}` (`:73-75`).
2. **Static file** `fs.readFile(cwd/public/data/daily/{date}.json)` (`:77-86`), normalising `source` to `'disk'`.
3. **ENOENT-only second release probe** bypassing the cached key list (`:92-102`).
4. **Bundled `archive-fallback`** via `resolveDailyLoadFromStatus` (`:14-46`, `:29-33`), else 404. A 403 maps to `{ error: 'tier_locked' }` (`:40-42`).

**`lib/data/grid/daily-loader.client.ts` (86 lines)** — `fetchDailyReport(isoDate, {refresh})` (`:35-87`): memory cache (`:44-49`) → `fetch('/data/daily/{date}.json', {cache:'default'})` (`:52`) → **404 only** → `/api/data/daily/{date}.json` with `cache:'no-store'` (`:24-32`, `:57`) → lazy `import('@/lib/data/grid/archive-fallback')` (`:63`) → error. 403 → `tier_locked` (`:70-72`). `warnIfInvalidDailyReport` runs on the runtime payload (`:59`) and the static payload (`:76`) but **not** on the archive fallback (`:63-67`, `:80-84`).

**`lib/data/runtime-data.client.ts` (96 lines)** — manifest-first. Header `:1-16`: *"consult the manifest of published keys first. If the key is published, the database copy is authoritative and is read directly. Otherwise the static file is used, with the original 404 retry kept as a backstop for the window between a publish and the manifest refreshing."* `MANIFEST_URL = '/api/data-manifest'` (`:27`), `MANIFEST_TTL_MS = 30_000` (`:30`), module-level promise cache (`:32-43`), `clearDataManifestCache()` (`:46-49`), `isPublished()` (`:51-56`). `fetchDataJson<T>(relPath, init)` (`:66-96`): manifest (`:70`) → if published `runtimeDataUrl` (`:74`) → `staticDataUrl` (`:84`) → `404 && !published` one more runtime attempt (`:87-91`).

**Net resolution orders:**

- **Server (grid daily):** `DataRelease` (key-list gated, 60 s cache) → `public/data/daily/*.json` → `DataRelease` again (ENOENT only, uncached path) → `archive-fallback.ts` → 404.
- **Client (grid daily):** memory cache → `/data/daily/*.json` → (404 only) `/api/data/daily/*.json` → `archive-fallback` chunk → error.
- **Client (every other feed):** `/api/data-manifest` → if published `/api/data/*` → `/data/*` → (404 && !published) `/api/data/*` → error.

`lib/data/grid/archive-fallback.ts` is **34,341 lines**, statically imported by the server loader (`daily-loader.server.ts:3`) and dynamically by the client (`daily-loader.client.ts:15`).

### 2.6 The manual daily ingest, step by step

**`scripts/run_daily_ingest.py` (220 lines).** Docstring `:1-28`: *"`daily_data_extractor.py` is not the whole ingest… Five more steps produce the rest of what the site reads, and each one of them has been silently skipped at some point."* Paths: `PUBLIC = ROOT/public/data` (`:44`), `SOURCE_INDEX = ROOT/scratch/backfill-source-index.json` (`:45`), `PGCB_SOURCE_DIRS = [W:\Grid-Explorer\PGCB\Daily Reports - D, C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D]` (`:47-50`). Every step runs via `subprocess.run` with `PYTHONUTF8=1`, 1800 s default timeout, capturing output rather than aborting (`:53-75`). CLI: `--date` (required), `--json`, `--skip-extractor` (`:110-113`). Step order is documented as load-bearing (`:13-23`).

| # | Step | Command | Line |
|---|---|---|---|
| 1 | extractor (**hard stop on failure**, `:134-137`) | `scripts/daily_data_extractor.py --date {iso} --skip-google --auto-confirm --deploy`, timeout 2400 | `:126-133` |
| 2 | source index | `ensure_source_indexed(day)` — indexes the workbook filed under **day+1** as `Daily Report {DD}-{MM}-{YYYY}.{xlsx|xlsm|xls}`, avoiding a re-walk of ~2,400 network workbooks | `:78-106`, `:139` |
| 3 | energy curve | `scripts/backfill_energy_curve.py --apply --from {iso}` | `:144` |
| 4 | split curve | `scripts/split_energy_curve.py --apply` — moves the curve out of the day file into `public/data/curves/` | `:147` |
| 5 | border imports | `scripts/backfill_border_imports.py --apply --from {iso}` (Nepal, the 4th interconnector) | `:150` |
| 6 | plants | `scripts/build_daily_plants.py --apply --only {iso}` → `public/data/plants/` | `:153` |
| 7 | archive fallback | `scripts/rebuild_archive_fallback.py --apply` → regenerates `lib/data/grid/archive-fallback.ts` | `:156` |
| 8 | available dates | `scripts/sync_available_dates.py --apply` → `lib/available-dates.json` | `:159` |
| 9 | gas timeline (conditional) | `scripts/build_petrobangla_timeline.py`, timeout 900; skipped with `ok: true` when `petrobangla/daily/{iso}.json` is absent because Petrobangla files a window under the next morning (`:161-163`) | `:164-176` |

`artifacts_for(iso)` (`:181-188`) verifies the four output files (`daily/`, `curves/`, `plants/`, `petrobangla/daily/`); exit code 1 if any step failed (`:216`).

External URLs the chain reaches (via `scripts/daily_extractor/`): `erp.powergrid.gov.bd` (`download.py:71`, ID-probing scan at `:83-137`), `www.pgcb.gov.bd/reports/Daily_Report_*` (`download.py:145`, legacy path), `petrobangla.org.bd/pages/reports` listing → Oracle object-storage PDF links (`download.py:163-165`, `:185`; Bengali digits transliterated at `:217`), `www.googleapis.com/customsearch/v1` (`verify.py:116`, skipped by `--skip-google`), `html.duckduckgo.com` (`verify.py:132`).

**Then `scripts/publish-local.ts` (120 lines)** pushes those files into `DataRelease`. Header `:1-23`: no session, so `publishedById` is null; `parserVersion = 'publish-local-cli/1'`; **cache invalidation relies on the 60 s backstop, not on tag expiry** — *"`unstable_cache` tags can only be expired from inside the running server."* Requires `--conditions react-server` in the npm script because `lib/prisma` is `server-only` (`:21-22`). Args: `--date`, `--month`, `--dry-run`, `--force`, `--no-aggregates` (`:38-51`). A dry run still executes `validateReleaseKey` + `validateReleasePayload` so it is real evidence (`:72-83`); writes go through `writeRelease` (`:86-93`).

`lib/data/publish-local.ts`: `DAY_FEEDS` = GRID_DAILY, GRID_CURVE, GRID_PLANTS, GAS_DAILY, SREDA_DAILY (`:16-22`); `AGGREGATE_FEEDS` = GAS_INDEX, GAS_LIVE_WEEK, GAS_TIMELINE, GAS_RESERVE_MODEL, GAS_RESERVE_SENSITIVITY, PGCB_MONTHLY_SERIES (`:25-32`); `planLocalPublish` (`:73-96`) — a missing file is `{absent: true}`, not an error (`:53-58`); bad JSON yields `{error}` (`:62-69`). Header `:9-12`: *"The chain writes six or seven files per day and only two of them were ever published, which is why a published day used to arrive on the site with an empty Energy Curve and Power Stations tab."*

`lib/data/release-write.ts` (118 lines) is the single write path. `validateReleaseKey` (`:29-35`) delegates to `isValidFeedKey`. **`validateReleasePayload` applies the Zod schema to `GRID_DAILY` only** — `:45` `if (feed !== 'GRID_DAILY') return null`. Checksum via `payloadChecksum` (`lib/data/release-checksum.ts`). An unchanged re-publish short-circuits unless `force` (`:84-86`; the gas timeline alone is ~1.6 MB, `:80-83`). The upsert restores a revoked key by clearing `revokedAt` (`:107-108`). Comment `:17-18`: **"Auth is deliberately NOT here."**

### 2.7 Admin data routes — `app/api/admin/data/`

All five export **POST only**, all set `dynamic = 'force-dynamic'`, none set `runtime`, and all five carry the identical guard:

```ts
const session = await auth();
if (!session?.user || !can(session.user.role, 'data.publish')) {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
```

`can()` is `lib/constants.ts:175-180` (`roleLevel >= required`; an unknown action defaults to 100). `'data.publish': 80` and `'data.revoke': 80` at `lib/constants.ts:83-84`, commented `:81-82`: *"Publishing writes straight to the live homepage numbers, so it sits at the admin level rather than with editorial roles."* Level 80 = `ADMIN`; `SUPER_ADMIN` = 100.

| Route | Guard @ | maxDuration | Effect on the data layer |
|---|---|---|---|
| `ingest-day/route.ts` (113 L) | `:47` | 800 (`:27`) | Shells out to `run_daily_ingest.py --date {iso} --json` (`:79-93`), 780 s, 64 MB buffer. **Writes `public/data` only — no DB.** Returns 503 on `VERCEL`/`AWS_LAMBDA_FUNCTION_NAME` (`:51-60`). Parses the last `{` in stdout (`:96`), including on non-zero exit (`:102-110`). |
| `parse/route.ts` (179 L) | `:59` | 300 (`:27`) | **Writes nothing** (`:20-21` — "the payload comes back for review"). `collect=1` → `ingest_bridge.py --fetch --date {iso}` (`:100-111`, 480 s); upload → `ingest_bridge.py --pgcb {tmp} --pgcb-name {orig} [--pb {tmp}] [--date]` (`:142-160`, 240 s). 25 MB upload cap (`:29`, `:125-127`); tmpdir cleaned in `finally` (`:176-178`). 503 on serverless (`:63-72`). |
| `publish/route.ts` (207 L) | `:65` | 600 (`:28`) | **Disk then DB.** Splits `energyCurveData` into `public/data/curves/{date}.json` (`:103-112`), writes `daily/{date}.json` (`:113-117`), then `publishRelease('GRID_DAILY', … 'ingest_bridge/1')` (`:118-124`). With `gasArchive`: writes `petrobangla/daily/{date}.json` (`:140-144`), `publishRelease('GAS_DAILY', … 'parse_petrobangla_archive/2.0.0')` (`:145-151`), runs `build_aggregates.py --date {date}` (`:164-168`, 540 s), publishes `GAS_INDEX`/`GAS_LIVE_WEEK`/`GAS_TIMELINE` as `key: 'singleton'` (`:176-195`), then `revalidateGridPages()` for `/grid-explorer`, `/`, `/power-grid` (`:51-59`, called at `:200`). **Never publishes `GRID_CURVE` or `GRID_PLANTS`** despite writing the curve file. 503 on serverless (`:68-73`). |
| `publish-local/route.ts` (165 L) | `:55` | 600 (`:30`) | **Reads local `public/data`, writes DB only.** `planLocalPublish({date, month, includeAggregates})` (`:99-103`) → `writeRelease({… parserVersion: 'publish-local/1', publishedById: session.user.id, force})` per artifact (`:116-124`). One invalidation per touched feed at the end (`:141-143`; publishing a day touches up to eleven rows, `:138-140`), then `revalidateGridPages()` (`:144`). 503 on serverless (`:61-70`). |
| `sreda/route.ts` (94 L) | `:30` | 120 (`:26`) | **The only one that works deployed** (no Python, `:19-23`). `scrapeSredaDailySnapshot()` (`:35`) → 502 if unusable (`:37-41`); no-ops if `lastUpdate` is unchanged (`:43-52`); best-effort file write inside a swallowing try/catch (`:56-62`, read-only FS on serverless); `publishRelease('SREDA_DAILY', snapshot.date, … sourceName: 'ndre.sreda.gov.bd', parserVersion: 'ingest-sreda/1')` (`:64-70`); `revalidatePath('/')` and `revalidatePath('/grid-explorer')` (`:75-81`). |

### 2.8 Structural observations (facts, not recommendations)

1. **`DataDraft` is unused by the read/write path.** No route under `app/api/admin/data/` references `prisma.dataDraft`; `parse` returns the payload to the browser and `publish`/`publish-local` write straight to `DataRelease`. The "staged, reviewed" flow described at `prisma/schema.prisma:512-514` is not wired through these routes.
2. **The two client loaders disagree.** `runtime-data.client.ts` is manifest-first, so corrections to already-shipped days are visible; `daily-loader.client.ts` is static-first with a 404-only retry, so they are not. The server loader implements the schema rule correctly (`daily-loader.server.ts:58-72`).
3. **Key regexes exclude live archive data.** `MONTH_RE` (`feed-paths.ts:37`) rejects `2013-01`…`2013-12`, so the 2013 files in `pgcb-monthly/` cannot be published at runtime; `ISO_DATE_RE` (`:36`) likewise makes `daily/2013-12-31.json` — the archive's first day — unpublishable.
4. **Feeds `publish/route.ts` never writes:** `GRID_CURVE`, `GRID_PLANTS`, `PGCB_MONTHLY`, `PGCB_MONTHLY_EVENTS`, `PGCB_MONTHLY_SERIES`, `GAS_RESERVE_MODEL`, `GAS_RESERVE_SENSITIVITY`, `SREDA_DAILY`. Only `publish-local` covers all thirteen.
5. **Payload validation is grid-daily-only** (`lib/data/release-write.ts:45`): a malformed gas, curve, plants, monthly or SREDA payload upserts unchallenged.
6. A **malformed static JSON file** (a `JSON.parse` throw, code ≠ ENOENT) yields `status = null` at `daily-loader.server.ts:90`, and `shouldUseArchiveFallback(null)` is `true` (`lib/data/grid/daily-access.ts:98-100`) — so it silently serves the bundled archive copy rather than surfacing an error.

---

## 3. Displayed series and their origins

### 3.0 The runtime data spines

Every daily figure on the public site resolves through one of four sources:

| Spine | Entry point | Resolution | Payload shape |
|---|---|---|---|
| PGCB daily | `loadDailyReportFromDisk(iso)` — `lib/data/grid/daily-loader.server.ts:52` | release override first (`getReleaseOverride('GRID_DAILY')`, `:64-72`), then `public/data/daily/{iso}.json` (`:80`) | `GridDailyData` — `lib/data/grid/types.ts:442-491` |
| Petrobangla gas index | `loadPetrobanglaIndexDays()` — `lib/data/grid/grid-export.server.ts:54` | release `GAS_INDEX`, then `public/data/petrobangla/_index.json` (`:68`) | day objects with `grand_total_gas_mmcfd` |
| SREDA daily | `getLatestSredaDaily()` — `lib/data/sreda/daily-loader.server.ts` | release `SREDA_DAILY`, then `public/data/sreda/daily/{iso}.json` | `SredaDailyData` — `lib/data/sreda/types.ts:193+` |
| Latest date | `getRuntimeLatestDate()` — `lib/data/grid/available-dates.server.ts:27` | bundled `availableDates` merged with runtime `getPublishedKeys('GRID_DAILY')` | — |

Client-side tabs fetch through `fetchDataJson(relPath)` (`lib/data/runtime-data.client.ts`, manifest-aware) — **except `PublishedVsDerivedTab`**, which uses a raw `fetch('/data/…')` and therefore cannot see a runtime-published correction.

The repo marks provenance in the UI with `GridProvenanceTag`: **P** = publisher-stated, **D** = derived in this codebase.

### 3.1 Homepage ticker — `lib/data/grid/live-ticker.server.ts` (129 lines)

`import 'server-only'` (`:1`). Mounted via `app/(public)/layout.tsx:25` (also `app/(public)/page.tsx:87`) → `PublicNavbar` → `PublicMarketStrip` → `LiveMarketTicker`; the layout carries `revalidate = 300`. `localizeTickerItem` (`lib/i18n/homepage-copy.ts:48`) swaps the **label only** in Bengali — values are untouched.

Charter comment `:10-15`:

> Real ticker data, derived at render time from the same parsed archives that
> ship with each deploy (PGCB daily reports + Petrobangla index) plus published
> regulated prices (BERC tariff, BPC retail) and a live USD/BDT rate. No
> simulation anywhere — change percentages are true day-over-day deltas.

The day pair comes from the **runtime** catalog (`:42-45`), so the ticker follows days published from the admin panel. Four sources fetched in parallel at `:47-52`. Helpers: `pct(cur, prev)` returns `0` when `prev <= 0` (`:17-18`); `round(v, d=2)` (`:20`).

| # | Label | `id` | Numeric field | Origin | Unit | Change |
|---|---|---|---|---|---|---|
| 1 | Avg Gen Cost | `avg-cost` | `systemStats.avgProductionCost` (P) | daily JSON | Tk/kWh | true DoD (`:60-63`) |
| 2–6 | Gas / Coal / HFO / Import / Solar Gen Cost | `{fuel}-cost` | `generationData.find(g => g.name === fuel).unitCost` (D — PGCB cost ÷ energy, `types.ts:79`) | daily JSON | Tk/kWh | true DoD (`:74-82`) |
| 7 | Evening Peak | `peak-gen` | `systemStats.eveningPeakGen` (P) | daily JSON | MW | true DoD (`:85-88`) |
| 8 | Total Gas Prod | `gas-prod` | `days[].grand_total_gas_mmcfd`, newest entry (P) | `petrobangla/_index.json` | MMcfd | true DoD (`:92-106`) |
| 9 | USD/BDT | `fx` | `fxLive ?? fxFallback` | external FX API / `macro/economics.ts` | — (prefix `৳`) | **hardcoded `0`** (`:112`) |
| 10 | Bulk Tariff | `tariff` | `macroTariffData[last].tariff` = **8.39** | `lib/data/macro/tariff.ts:15` | Tk/kWh | **hardcoded `0`** (`:118`) |
| 11 | Diesel (BPC) | `diesel-bpc` | `macro.retailDiesel` = **105.50** | `lib/data/macro/economics.ts:13` | Tk/L | **hardcoded `0`** (`:122`) |
| 12 | Octane (BPC) | `octane-bpc` | `macro.retailOctane` = **125.0** | `lib/data/macro/economics.ts:13` | Tk/L | **hardcoded `0`** (`:125`) |

**Per-fuel guard** (`:77-81`): a fuel is skipped unless `unitCost != null && unitCost > 0 && gen > 0`. Comment `:77-78`: *"`unitCost` is null when the day's report carries no production-cost block; such a day is skipped rather than shown as a 0 Tk/kWh fuel."*

#### The external FX API

`fetchUsdBdt()` — `lib/data/grid/live-ticker.server.ts:23-37`:

```ts
const res = await fetch('https://open.er-api.com/v6/latest/USD', {
  // One origin hit per 6h across all visitors; ticker is not tick-by-tick FX.
  next: { revalidate: 21_600 },
  signal: AbortSignal.timeout(5_000),
});
```

- **Hostname / URL:** `https://open.er-api.com/v6/latest/USD` (Open Exchange Rate API, no key) — `:25`.
- **Caching:** `next: { revalidate: 21_600 }` = 6 hours (`:27`); timeout `AbortSignal.timeout(5_000)` (`:28`).
- **Parsing:** reads `data.rates.BDT` only when `data.result === 'success'` and the value is finite and `> 0` (`:31-33`).
- **On failure:** returns `null` (`:30`, `:34-36`) — never throws. The caller falls back to `macroEconomicData[last].exchangeRate` = **122.00** (`:109-110`, from `lib/data/macro/economics.ts:13`). Call sites additionally wrap in `.catch(() => null)`.

The whole ticker returns `null` if no item survives (`:128`).

#### Ticker fallback chain

If `getLiveTickerItems()` returns `null` → admin-configured `settings.ticker` → **`LiveMarketTicker.defaultItems`**, a hardcoded stale set at `components/news/LiveMarketTicker.tsx:19-26`: LNG 15.82, Coal 116.7, **USD/BDT 123.50**, Solar 0.10, **Bulk Tariff 8.95**, Gas 1350.

**Contradiction:** the fallback tariff **8.95** here and in `lib/homepage-defaults.ts:5` ("New 8.95 Tk/kWh bulk tariff") disagrees with the live `macroTariffData` tariff of **8.39** (`lib/data/macro/tariff.ts:15`).

### 3.2 Homepage System Snapshot — `home-snapshot.server.ts` + `home-snapshot-core.ts`

`getLatestHomeSnapshot()` is `react.cache`-wrapped (`home-snapshot.server.ts:15`). Comment `:19-21`: *"Must be the runtime catalog, not the bundled one: `availableDates` is compiled at build time, so a day published from the admin panel would never reach the homepage and its KPIs would sit on the last shipped day forever."* It loads the daily report and the latest SREDA snapshot in parallel (`:25-28`), then calls `buildHomeSnapshotFromDaily(result.data, sreda)` (`:33`). Rendered by `HomeSnapshotPanel` → `EnergyDashboard` / `LocalSnapshotDashboard`.

Twelve tiles — `lib/data/grid/home-snapshot-core.ts:85-142`:

| Tile | Value expression | Origin field | Unit | Line |
|---|---|---|---|---|
| Evening Peak Demand | `Math.round(s.eveningPeakDemand)` | `systemStats` (P) | MW | `:95` |
| Peak Generation | `max(eveningPeakGen, dayPeakGen)` | `systemStats` (P) | MW | `:91`, `:96` |
| Peak Today | `max(eveningPeakDemand, dayPeakDemand ?? 0)` | `systemStats` (P) | MW | `:90`, `:97` |
| Daily Generation | `gwhToAvgMw(s.totalEnergyGen)` = `round(GWh × 1000 / 24)` | `systemStats` (P) | MW (24 h avg) | `:7-9`, `:99-103` |
| Load Shedding | `max(hourlyLoadData[].loadShed)`, else `max(regionalDemandData[].loadShed)`, else 0 | daily JSON (P) | MW | `:44-54`, `:104` |
| Energy Unserved | `gwhToAvgMw(s.totalEnergyUnserved)` — **tile omitted when null** | `systemStats` (P) | MW | `:105-115` |
| Fuel Cost | `parseFloat(s.avgProductionCost.toFixed(2))` | `systemStats` (P) | Tk/kWh | `:116-122` |
| Gas Supply | `sum(gasProductionData[].gas)`, else `round(s.totalGasSuppliedPower)` | daily JSON | MMcfd | `:37-42`, `:92`, `:123` |
| Coal Generation | `gwhToAvgMw(generationData.find(name==='Coal').gen)` | daily JSON (P) | MW (24 h avg) | `:56-59`, `:124-128` |
| Grid Import | `sum(borderImportsData[].peakFlow)` | daily JSON (P) | MW | `:61-65`, `:129` |
| RE Installed | `Math.round(sreda.totalRenewableMw)` | SREDA daily (`parse-sreda-html.ts:705`) | MW | `:70-74` |
| RE Grid Share | `parseFloat(sreda.reGridSharePct.toFixed(2))` | SREDA daily (`parse-sreda-html.ts:724`) | % | `:75-81` |

**Hardcoded seed grids:** when no snapshot loads, `HomeSnapshotPanel` and `EnergyDashboard` seed from constant arrays — `components/home/HomeSnapshotPanel.tsx:46-59` and `components/news/EnergyDashboard.tsx:98-111` (Current Demand 16740, Peak Gen 16181, Fuel Cost 6.5, Gas 2610, Coal 5383, RE 1806, RE share 5.56, …). Server values overwrite them by label match. On the homepage they are also **jittered** when `isSimulatedTelemetryEnabled()` — but that is gated on `process.env.NODE_ENV !== 'production'` (`lib/telemetry-mode.ts`), so jitter is **dev/QA only, never production** (`HomeSnapshotPanel.tsx:111-132`).

**Two internal inconsistencies:**

1. `DAILY_SNAPSHOT_LABELS` (`home-snapshot-core.ts:20-33`) declares the first tile as `'Current Demand'`, but `buildHomeSnapshotFromDaily` emits `'Evening Peak Demand'` (`:95`). The declared label union and the built labels disagree.
2. The comment at `:105-107` states the principle — *"Dropped rather than shown as zero on days whose report does not publish unserved energy — a homepage tile reading '0 MW' would assert that no load was shed, which is not what an absent figure means"* — and Energy Unserved honours it (`:108-115`). But when SREDA data is absent, `RE Installed` and `RE Grid Share` are emitted as **literal `0`** (`:137-141`), the exact pattern the comment rejects.

### 3.3 The specifically-requested figures

**Average generation cost (Tk/kWh) — two distinct numbers with different provenance:**

- Homepage / ticker / Overview headline = **`systemStats.avgProductionCost`** (P — PGCB's own printed figure).
- Generation-tab table total = **derived**, `PowerGridExplorer.tsx:1745`:
  `avgCostPerKwh = totalCostBdt / (totalGenMkwhr * 1000000)`, where `totalCostBdt = Σ generationData[].cost` (`:1658`) and `totalGenMkwhr = Σ generationData[].gen` (`:1657`). Marked **D**, and shown only when `hasPublishedFuelCost` (`:1736`, `:2967`).

**Per-fuel costs (Gas, Coal, HFO, Solar, Imports, Hydro, HSD, Wind):** `generationData[].unitCost` from the daily JSON — itself **D**, being PGCB cost ÷ energy (`types.ts:79`). The Imports Tk/kWh figure is deliberately **withheld** on the Overview and Generation cards (`PowerGridExplorer.tsx:1742-1744`) though the cost line is shown. These are authenticated against BPDB's independent recompute via `/data/grid-verification/unit-cost.json` (`useUnitCostAuthentication.ts:83`), which **stops at 2026-06-24** — newer days render as `awaiting-witness`.

**Peak demand (MW):** `max(systemStats.eveningPeakDemand, systemStats.dayPeakDemand)` — `home-snapshot-core.ts:90`; Overview at `OverviewKpiStrip.tsx:248,269,274`. Day key is the PGCB **energy day** (midnight–midnight), filed under energy-day + 1 (`types.ts:420-427`; e.g. `2026-08-13.json` carries `sourceFiles.pgcb = "Daily Report 14-08-2026.xlsx"`).

**Gas production (MMcfd) — two different keys and two different numbers:**

- The ticker uses `_index.json` `grand_total_gas_mmcfd` (**P**).
- Overview and Gas tab tiles use **`Σ gasProductionData[].gas`** (`PowerGridExplorer.tsx:1067`) — a **D** sum of the six company rows, guarded by `hasGasProductionData = length > 0 && total > 0` (`:1076`) so an unpublished day never renders "0 MMCFD".
- The gas day is Petrobangla's 08:00→08:00 window (`observation-window.ts:170-182`), a **different key** from PGCB's energy day. On a sampled day the six rows sum to **1931.4** against the index's **1931.2**.

**USD/BDT:** external `open.er-api.com` (§3.1), falling back to `economics.ts` 122.00.

**Bulk tariff and fuel prices — all curated constants, not data-driven:**

| Series | Location | Latest value |
|---|---|---|
| Bulk tariff (Tk/kWh) | `lib/data/macro/tariff.ts` `tariff` column (mirror of `lib/data/companies/berc.ts` `bercBulkTariffHistory`) | 8.39 (`Jun 2026`) |
| BPDB unit generation cost | `lib/data/macro/tariff.ts` `cost` column | 12.91 (`Jun 2026`) |
| Retail diesel / octane, spot LNG, imported coal, exchange rate, inflation | `lib/data/macro/economics.ts:2-14` | 2026 row: diesel 105.50, octane 125.0, LNG 11.8, coal 105.0, FX 122.00, inflation 10.45 |
| Global-vs-domestic fuel prices + historical FX | `lib/data/macro/fuel-prices.ts` (`globalVsDomesticData`, BDT conversions `:38-47`) | — |
| Furnace/HFO, subsidy | `lib/data/bpdb-annual-accounts.ts`, rendered by `BpdbAccountsPanel` | — |
| Petrobangla audited financials | `lib/data/macro/economics.ts:16-29` | `FY 26`: revenue 44200, lngCost 48900, netProfit −1200 |
| DSE market ticker | `lib/bd-stock-market` → `DEFAULT_DSE_TICKER`, served `live: false` by `app/api/market/dse/route.ts` | — |

### 3.4 Grid Explorer tabs

`components/news/PowerGridExplorer.tsx` is **9,299 lines**; most tab bodies are inlined as `activeTab === '…' && (…)` blocks rather than split per file. `components/news/power-grid/` holds 45 top-level entries (41 files plus the `petrobangla-archive/`, `petrobangla-live/`, `renewables/` subdirectories; 60 files in total including those).

Tab bar — `PowerGridExplorer.tsx:1596-1610`, nine tabs. Data is destructured from `activeData` at `:1008-1064`.

| # | `id` | Label | Body / component | Primary fields and source |
|---|---|---|---|---|
| 1 | `overview` | Overview | inline `:2221` + `OverviewKpiStrip.tsx` | `systemStats.*`, `generationData`, gas sums, `totalCapacityRenewables` (constant). Pie total `totalGenMkwhr` (D, `:2251`) |
| 2 | `gen` | Generation & Cost | inline `:2835` + `TabKpiStrips.GenerationKpiStrip`, `EnergyCurveChart`, `UnitCostBadge` | `generationData[].{gen,cost,unitCost}`; curve from `curves/{iso}.json` (`energy-curve.client.ts:22`) |
| 3 | `gas` | Gas & LNG Supply | `GasTab.tsx` `:3347` + `PetrobanglaGasKpiStrip`, `PetrobanglaSectionDetail` | `gasProductionData`, `gasDistributionData`; archive detail from `petrobangla/daily/{gasDay}.json` |
| 4 | `imports` | C/B Imports | inline `:3365` + `TabKpiStrips.ImportsKpiStrip` | `borderImportsData[].{source,energy,peakFlow}`, `ewicData` |
| 5 | `regional` | Regional Grid | inline `:5696` + `TabKpiStrips.RegionalKpiStrip` | `regionalDemandData[].{zone,demand,loadShed}`; source label from `regionalDemandSource` (P1 vs BPDB, `:5711-5720`) |
| 6 | `renewables` | Renewables | `RenewablesTab.tsx` `:3538` + `renewables/*` | `sreda/daily/{latest}.json`, `plants/{iso}.json`, `pgcb-monthly/_series.json`, `generationData` |
| 7 | `plants` | Power Stations | `PowerStationsTab.tsx` `:3549` + `TabKpiStrips.StationsKpiStrip` | `plants/{iso}.json` → `PlantActual`, `GenLog`, `PlantForecast` |
| 8 | `transmission` | Technical Information | inline `:3556` + `GridTopologyMap` (dynamic) | **static datasets** — `substations.ts`, `projects-ongoing/-upcoming/-completed.ts`, plus large hardcoded PGCB prose |
| 9 | `macro` | Macro Trends | inline `:6172` + `LongitudinalStudy`, `PgcbMonthlyDetail`, `BpdbAccountsPanel`, `GasReserveDepletionTab`, `PublishedVsDerivedTab` | curated `lib/data/macro/*` and `lib/data/companies/*`, plus fetched reserve and verification feeds |

The `activeTab` state union at `:1190` lists nine ids; the `TabDescriptor` type at `:1591` additionally names `'pricing'`, which no entry in the `tabs` array supplies — a vestigial id.

Comment on the Renewables tab (`:1601-1606`): *"Named for the subject, not the publisher… The source is still SREDA alone — the agencies its tables name (BPDB, NWPGCL, EGCB, BREB, IDCOL…) are the owners SREDA attributes capacity to, not second publishers — so attribution stays on each card."*

`methodologyTabIds = ['overview', 'gen', 'gas', 'imports']` (`:1614`) — the four daily-PGCB tabs where the gross-vs-net reconciliation banner applies. Sub-tabs: Macro has `overview`/`budget`/`monthly` (`:6356-6358`); Technical Information has four groups totalling nine panels (`:3604-3628`, `:3663-3690`).

**Tab-level component derivations:**

- **`OverviewKpiStrip.tsx`** — props `:23-49`; `capacity` from `useGridOverviewContext` → `plants/{iso}.json`; `renewableGridSharePct` a constant (`companies/sreda.ts:53`). Derivations: `mkwhToAvgMw = (mkwh*1000)/24` (`:104`), `peakDeficitMw = max(0, round(eveningPeakDemand − eveningPeakGen))` (`:127`), `idlePct = (installed − eveningPeakGen)/installed` (`:140`), `totalDailyCost/10000000` → Crore (`:580`).
- **`TabKpiStrips.tsx`** — four strips; `CRORE = 10000000` (`:34`); fuel share `g.gen/totalRowGen*100`; import implied rate `importBill/(importedMkwh*1e6)` (`:415`).
- **`GasTab.tsx` / `PetrobanglaGasKpiStrip.tsx`** — diversity-adjusted demand `adjPower`, gap `adjPower − power_supply_mmcfd`, reconciliation tolerance `0.5` MMCFD (`:414`).
- **`PowerStationsTab.tsx`** — utilisation `evening/installed*100`; energy `energyKwh/1e6` MKWh.
- **`RenewablesTab.tsx`** — share `energy/totalGen*100`; reconciliation tolerance `0.005*(n+1)`.
- **`GasReserveDepletionTab.tsx`** — `petrobangla/reserve-model.json` + `reserve-sensitivity.json` (`reserveModel.ts:221-222`) + `macro/reserveBenchmarks.ts`; Tcf/BCF/MMCFD with field-level derivations.
- **`PublishedVsDerivedTab.tsx`** — raw `fetch('/data/grid-verification/_index.json')` and `{month}.json`, bypassing the manifest.
- **`BpdbAccountsPanel.tsx`** — static `lib/data/bpdb-annual-accounts.ts`; per-unit `(crore*1e7)/(mkwh*1e6)`.
- **`LongitudinalStudy.tsx`** — static `lib/data/macro/longitudinal-study.ts` (15 rows); indexed to FY2011 = 100.
- **`PgcbMonthlyDetail.tsx`** — `detail` from `usePgcbMonthly` → `public/data/pgcb-monthly/{key}.json`.

### 3.5 Per-day tab availability — `lib/data/grid/tab-availability.ts`

Header (`:1-17`) states the principle:

> Opening a 2015 day therefore lands a reader on tabs that are structurally empty — and an empty
> tab reads as "nothing happened here", which is a different and much stronger
> claim than "this era's report has no such sheet".

`tabAvailability(data)` (`:52-115`) derives the answer **from the day's own payload**, not from a date range, "so a day that is missing a sheet its era normally carries is reported as missing rather than assumed present" (`:14-16`).

| Tab | `hasData` test | Reason when empty |
|---|---|---|
| `overview` | `hasGen \|\| systemStats.eveningPeakGen > 0` | "PGCB's report for this day carries no generation summary." |
| `gen` | `generationData.some(g => g.gen > 0)` | Two branches: no per-fuel table, or "This era of the report publishes no per-fuel production-cost block, so cost per unit cannot be shown." |
| `gas` | `gasProductionData.some(g => g.gas > 0)` | "Petrobangla published no gas report for this day… Petrobangla daily reports enter this archive from January 2020." |
| `imports` | `borderImportsData.length > 0` | "…HVDC Bheramara appears from 2014, Tripura from 2016, and Adani and Nepal only on the 2025 layout." |
| `regional` | `regionalDemandData.length > 0` | "PGCB's report for this day carries no zone-wise demand and load-shed table." |
| `plants` | `systemStats.eveningPeakGen > 0` — a proxy, since the station table lives in a separate on-demand file (`:106-108`) | "PGCB's report for this day carries no power-station table." |
| `renewables`, `transmission`, `macro` | always `{ hasData: true }` | — |

`DATE_INDEPENDENT = new Set(['macro', 'transmission'])` (`:50`) excludes those two from `emptyTabs()` (`:117-126`). Note `renewables` is hardcoded `hasData: true` (`:105`) but is **not** in `DATE_INDEPENDENT`, despite the header comment at `:46-47` describing Renewables as date-independent alongside Macro.

`hourlyResolution(data)` (`:128+`) reports whether a day's hourly profile is genuinely hourly, a single stated hour, or absent.

### 3.6 Hardcoded (non-data-driven) displayed numbers

**Sector Glance (Macro › "Sector Glance & Losses") — all twelve tiles are string literals**, `PowerGridExplorer.tsx:6194-6329`:

`:6197` "33,092 MW" installed capacity · `:6208` "17,201 MW" peak gen ("Recorded on May 20, 2026") · `:6220` "137 Plants" · `:6231` "2,696 MW" import capacity · `:6242` "18,152 ckt km" · `:6253` "91,242 MVA" · `:6264` "658,563 km" · `:6275` "49.94 Million" consumers · `:6286` "100.0%" access · `:6297` "661 kWh" per-capita · `:6308` "498,000" pumps · `:6319` "18,409.52 Cr" ADP. None is data-driven.

**Technical Information tab** — asset figures are quoted PGCB prose constants (`:3875`, `:3936`, `:4009-4019` circuit-km; `:4187-4287` MVA table including total "91,512 MVA" — which disagrees with the "91,242 MVA" Sector Glance tile above). The one genuinely derived figure is `totalSubCapacityMva = Σ substationsData[].capacity` (`:1637-1641`, marked D at `:4380`); "9 Zones" (`:4384`) is hardcoded.

**Pricing sub-tab** — "Current Bulk" and "2010 Baseline" read `macroTariffData` (`:6570`, `:6584`), curated not live; "True Gen Cost" uses live `systemStats.avgProductionCost` (`:6597`); tariff deficit is `avgProductionCost − tariff` (`:6603`).

**Ticker / snapshot defaults** — `LiveMarketTicker.tsx:19-26`, `lib/homepage-defaults.ts:5`, `HomeSnapshotPanel.tsx:46-59`, `EnergyDashboard.tsx:98-111`.

**Curated macro/company modules rendered on the Macro tab** (not daily-sourced): `macro/{tariff,economics,gas,fuel-prices,budget,infrastructure,system-loss,longitudinal-study}.ts`, `companies/{bpdb,berc,sreda}.ts`, `bpdb-annual-accounts.ts`. SREDA fallback constants in `companies/sreda.ts` (`totalCapacityRenewables = 1823.572`, `NATIONAL_INSTALLED_CAPACITY_MW = 32474`, derived `renewableGridSharePct`) render in `OverviewKpiStrip.tsx:435` — a standing figure sitting inside a strip whose other tiles move with the date picker.

**Petrobangla archive constants** (`lib/data/petrobangla/constants.ts`): `ARCHIVE_BASELINE_GAS = 3167.9`, `ARCHIVE_PEAK = {2021-06-24, 3363.6}`, `ARCHIVE_INSIGHTS.*` (`:135-144`, e.g. `jun2026Latest.gas = 2643.0`, `coverageDays = 2247`). The index now runs to 2026-08-18, and `jun2026Latest` (2643.0 @ 2026-06-30) differs from the index's 2696.5 — a stale constant.

### 3.7 Display defects found while tracing (verified)

1. **`LongitudinalStudy.tsx:325`** renders "15,688 ckm in 2025" while the underlying data says **15680** (`macro/longitudinal-study.ts:579`) — off by 8.
2. **`LongitudinalStudy.tsx:448-451,457`** label the FY2011 = 100 **index** values (594.8, 380.0, 337.1, 186.8) as **growth percentages**. Actual budget growth is 494.8 %, not "594.8 %".
3. **`PublishedVsDerivedTab.tsx:470-472`** prints `pb_words` on **both** sides of "N of N words", making the coverage claim vacuous; `pb_words_unassigned` (declared `:81`) is never read.
4. **`GasTab.tsx:185,187`** states gas tracking "started January 12, 2020" while `coverage.ts:50` — rendered on the same tab — says **2020-01-11**.
5. **`PgcbMonthlyDetail.tsx:221`** carries a latent default `suffix = 'vs May'`.
6. **Threshold literals that drive displayed verdicts:** `PetrobanglaGasKpiStrip.tsx:165` coverage `< 60`; `PgcbMonthlyDetail.tsx:1490` voltage `−10 %`, `:1557` transformer `80 %`, `:1667` "full month" `>= 28` days; `BpdbAccountsPanel.tsx:144` a `0.05` Crore band; `OverviewKpiStrip.tsx:584` a `0.005` Tk gap.
7. **Three inconsistent MKWh→kWh spellings** across the codebase (`*1000000`, `/1_000_000`, `/1e6`) and two Crore divisors (a named `CRORE` constant versus inline `10000000`).
8. **`PublishedVsDerivedTab` is the only tab using raw `fetch('/data/…')`** — it will not see a runtime-published correction, unlike every sibling tab that goes through `fetchDataJson`.
9. **Sector Glance "91,242 MVA"** (`PowerGridExplorer.tsx:6253`) versus the Technical Information MVA table total **"91,512 MVA"** (`:4187-4287`) — two hardcoded totals for the same quantity.

---

## 4. External requests at runtime

### 4.1 Every external hostname the running site can contact

| Hostname | Purpose | Called from | Server/Client | Cache / timeout |
|---|---|---|---|---|
| `www.googletagmanager.com` | GA4 `gtag.js` loader | `app/layout.tsx:128` (`<Script strategy="lazyOnload">`), config `:130-139` | **Client**, every page (root layout) | n/a |
| `*.google-analytics.com` | GA4 beacon, loaded transitively by gtag.js | implied by `app/layout.tsx:128`; allowed in CSP `next.config.ts:13-14,47,49` | **Client** | n/a |
| `fonts.googleapis.com`, `fonts.gstatic.com` | `next/font/google` source for Inter, Space Grotesk, JetBrains Mono, Noto Sans Bengali | `app/layout.tsx:5,12-15` | **Build time only** — Next self-hosts the files; CSP is `font-src 'self' data:` (`next.config.ts:48`) | build |
| `*.supabase.in` | Allowed in CSP `connect-src` (`next.config.ts:49`); no code path observed calling it | `next.config.ts:49` | Client (permitted, unused) | n/a |
| `open.er-api.com` | **Live USD/BDT FX rate** for the public ticker | `lib/data/grid/live-ticker.server.ts:25` | **Server** (`server-only`) | `next: { revalidate: 21_600 }` (6 h), `AbortSignal.timeout(5_000)`, fails soft to `null` |
| `<project>.supabase.co` | Auth, Postgres (via pooler), Storage media; `<link rel=preconnect>` | `app/layout.tsx:90`, `utils/supabase/env.ts:11`, `lib/actions/media.ts:29`, `lib/article-image.ts:13`, `next.config.ts:36` | Both | n/a |
| Supabase host (proxied) | CMS image import via the media proxy | `app/api/media-proxy/route.ts:39` | **Server** | response `Cache-Control: public, max-age=31536000, immutable` |
| `*.upstash.io` | Redis rate limiting in the proxy | `middleware.ts:28-43`, `Redis.fromEnv()` at `:31` | **Server / Edge** | n/a |
| `www.pgcb.gov.bd` | Daily XLSX ingest | `lib/cron/energy-ingest.ts:10,41,247` | **Server** — unreachable in production, see §4.4 | none |
| `www.petrobangla.org.bd` | Daily PDF scrape + download | `lib/cron/energy-ingest.ts:11,85,95,99` | **Server** — unreachable in production | none |
| `ndre.sreda.gov.bd` | SREDA renewables snapshot | `lib/data/sreda/ingest-sreda.ts:22-26`, invoked by `app/api/admin/data/sreda/route.ts:35` | **Server** | none |
| `esbpowerline.com` (self) | Canonical/metadata base, JSON-LD `@id` | `app/layout.tsx:18,37`, `app/robots.ts:4`, `app/sitemap.ts:12`, `app/(public)/articles/[slug]/page.tsx:83`, `app/(public)/grid-explorer/page.tsx:120` | Both | n/a |
| `cdn.esbpowerline.com` | cPanel CDN base for uploads (`NEXT_PUBLIC_CDN_URL`) | `components/shared/MediaUpload.tsx:141,1140`, `components/cms/MediaPicker.tsx:57`, `components/cms/FeaturedImageEditor.tsx:77` | **Client** (presence check only; no fetch) | n/a |
| `www.youtube.com`, `www.facebook.com` | Embedded video iframes — CSP `frame-src` only | `next.config.ts:51` | Client | n/a |

### 4.2 Build- and script-only hosts (never contacted by the running site)

| Hostname | Purpose | Location |
|---|---|---|
| `erp.powergrid.gov.bd` | PGCB ERP archive workbook download / backtest | `scripts/backtest-erp.mjs:32`, `scripts/daily_extractor/download.py:71`, `scripts/fetch_pgcb_daily_workbooks.py:53` |
| `generativelanguage.googleapis.com` | Gemini 2.5 Flash article translation | `scripts/translate-articles.ts:22,54` |
| `www.googleapis.com` (Custom Search) | Source verification search | `scripts/daily_extractor/verify.py:116` |
| `html.duckduckgo.com` | Fallback verification search (HTML scrape) | `scripts/daily_extractor/verify.py:131-132` |
| `esbpowerline.com/wp-json/wp/v2` | Legacy WordPress news import | `scripts/import-esbpowerline-news.ts:80,229,259,266,443,517` |
| `sxgokpmrbgdndstygapc.supabase.co` | **Hardcoded project ref** | `scripts/sync-env-from-supabase.mjs:8,36`, `scripts/sync-vercel-prod-env.mjs:29,31`, `scripts/publish-titas-investigation.mjs:31`, `.mcp.json:5`, `supabase/.temp/linked-project.json:1` |
| `objectstorage.ap-dcc-gazipur-1.oraclecloud15.com` | BPDB annual-accounts PDF **citation strings only**, never fetched | `lib/data/bpdb-annual-accounts.ts:192…766` |

`lib/data/important-links.ts`, `lib/data/policy/policies.ts` and `lib/data/macro/reserveBenchmarks.ts` hold roughly 80 further `.gov.bd` and news hostnames — all inert `href`/citation strings with no fetch behind them.

### 4.3 Content Security Policy

Built at `next.config.ts:43-62`, emitted for `/(.*)` at `next.config.ts:206`:

```
default-src     'self'
script-src      'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com          [production]
script-src      'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com  [dev only, next.config.ts:12-14]
style-src       'self' 'unsafe-inline'
img-src         'self' blob: data: https://*.supabase.co https://*.esbpowerline.com https://esbpowerline.com https://www.esbpowerline.com https://*.google-analytics.com https://*.googletagmanager.com
font-src        'self' data:
connect-src     'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com
frame-src       'self' https://www.youtube.com https://www.facebook.com
media-src       'self'
base-uri        'self'
form-action     'self'
frame-ancestors 'self'
object-src      'none'
```

The last four directives were added with a comment explaining each (`next.config.ts:53-57`):

> default-src does not cover these three. Without base-uri an injected
> `<base href>` re-points every relative script URL; without form-action a
> form can post credentials cross-origin; frame-ancestors is the modern
> clickjacking control (X-Frame-Options is ignored by newer engines).
> object-src 'none' kills the legacy `<object>`/`<embed>` plugin vector.

Note `open.er-api.com` is **not** in `connect-src` — correctly, because that fetch is server-side only.

### 4.4 Image `remotePatterns`

`next.config.ts:167-185`:

- `<NEXT_PUBLIC_SUPABASE_URL host>` + `/storage/v1/object/public/**` (`:170-174`)
- `<NEXT_PUBLIC_SUPABASE_URL host>` + `/storage/v1/render/image/public/**` (`:175-179`)
- `esbpowerline.com` (`:182`), `www.esbpowerline.com` (`:183`), `**.esbpowerline.com` (`:184`) — **no `pathname` pin**, unlike the two Supabase entries, which carry an explicit open-proxy warning at `next.config.ts:164-166`.

The Supabase host is derived at `next.config.ts:34-41`; a missing env var drops the pattern entirely rather than re-opening the proxy. The deprecated `images.domains` key is not used.

### 4.5 Proxy/API route target validation

**`app/api/media-proxy/route.ts`** — layered and tight: authn+authz first (`:7-10`, `can(role,'media.upload')`); protocol allowlist (`:20-22`); host allowlist (`:28-33`) admitting the Supabase host only, plus `localhost`/`127.0.0.1` **only when `NODE_ENV !== 'production'`** (`:30`); `fetch(url, { redirect: 'manual' })` with 3xx rejected (`:39-42`, closing redirect-to-internal SSRF); `content-type` must start with `image/` (`:47-50`). Caveat: `isHostAllowed` (`:32-33`) accepts `host.endsWith('.' + allowed)`, so in dev `evil.localhost` passes; production is unaffected because the list is Supabase-only.

**`app/api/market/dse/route.ts`** — contacts **no external host at all**. It serves `DEFAULT_DSE_TICKER` from `lib/bd-stock-market` with `live: false`, `revalidate = 60` (`:5`), rate-limited 60/60 s (`:13`). The doc comment (`:7-11`) states there is no official free DSE feed and that the route deliberately avoids simulated jitter.

**Cron ingest is inert in production**: `app/api/cron/ingest/route.ts:19-24` returns a guard response *before* `runIngestionPipeline()` is ever reached, so PGCB and Petrobangla are never contacted from Vercel.

### 4.6 Fonts

- **`next/font/google` only** — `app/layout.tsx:5`: Inter (`:12`), Space Grotesk (`:13`), JetBrains Mono (`:14`), **Noto Sans Bengali with `subsets:['bengali']`** (`:15`); all `display:'swap'`, exposed as `--font-sans` / `--font-display` / `--font-mono` / `--font-bengali` and consumed throughout `app/globals.css` and `app/globals-optimized.css` (e.g. `globals-optimized.css:4852-4881`).
- **No `@font-face` rule and no `fonts.googleapis`/`fonts.gstatic` reference in any source or CSS file** — Next self-hosts the files at build time, consistent with `font-src 'self' data:`.
- `public/fonts/` holds **SourceSans3 Regular/Semibold/Bold TTF only**. These are referenced by no CSS; they exist for the server-side PDF export and are traced into `/api/members/grid-export` at `next.config.ts:115`.
- **No Hind Siliguri, Kalpurush, or SolaimanLipi anywhere in the repo.**

### 4.7 Analytics

- **GA4 only**, mounted client-side in the root layout at `app/layout.tsx:126-139`. The measurement ID **`G-V04WZWK8WT` is a hardcoded literal** at `app/layout.tsx:128` and `:135` — not env-driven, so all three surfaces report into the same property.
- `@vercel/analytics@^2.0.1` (`package.json:75`) and `@vercel/speed-insights@^2.0.0` (`:76`) are installed but **imported nowhere**. `.env.example:79-80` claims they are enabled in `app/layout.tsx`; that comment is stale.
- `@next/third-parties@^16.2.10` (`package.json:52`) is installed and **never imported** — GA is hand-rolled via `next/script` instead.
- No GTM container, Plausible, Umami, PostHog, Sentry, Clarity or Facebook pixel anywhere.
- `lib/telemetry-mode.ts:1-4` is unrelated to analytics; it gates simulated ticker jitter to non-production.

---

## 5. Environment variables

**54 distinct names** read across the repo (excluding `node_modules` and `.next*`): 10 client-exposed, 44 server-only.

### 5.1 Client-exposed (`NEXT_PUBLIC_`) — 10

| Var | Read at | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `app/layout.tsx:90` (×2), `utils/supabase/env.ts:11`, `lib/actions/media.ts:29`, `lib/article-image.ts:13`, `next.config.ts:36` (+10 more, 16 sites) | Supabase project URL; also derives the image `remotePattern` host |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `utils/supabase/env.ts:4`, `scripts/sync-vercel-prod-env.mjs:20`, `scripts/test-login.mjs:10` | Preferred public client key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `utils/supabase/env.ts:5`, `scripts/sync-vercel-prod-env.mjs:21`, `scripts/test-login.mjs:11` | Legacy anon JWT fallback |
| `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx:18,37`, `app/robots.ts:4`, `app/sitemap.ts:12`, `app/(public)/articles/[slug]/page.tsx:83`, `app/(public)/grid-explorer/page.tsx:120` | Canonical origin; every site falls back to `https://esbpowerline.com` |
| `NEXT_PUBLIC_CDN_URL` | `components/shared/MediaUpload.tsx:141,1140`, `components/cms/MediaPicker.tsx:57`, `components/cms/FeaturedImageEditor.tsx:77`, `scripts/sync-vercel-prod-env.mjs:36` | cPanel CDN base; its presence toggles the 4.5 MB direct-upload limit |
| `NEXT_PUBLIC_APP_URL` | `lib/public-site-url.ts:8`, `lib/workspace-urls.ts:26,36` | Shared origin when surfaces share one deploy |
| `NEXT_PUBLIC_PUBLIC_SITE_URL` | `lib/public-site-url.ts:5` | Public-site origin for password-reset email links |
| `NEXT_PUBLIC_ADMIN_SITE_URL` | `lib/workspace-urls.ts:21` | Admin surface origin |
| `NEXT_PUBLIC_CMS_SITE_URL` | `lib/workspace-urls.ts:31` | CMS surface origin |
| `NEXT_PUBLIC_APP_SURFACE` | `lib/workspace-urls.ts:9` | Injected by `next.config.ts:110-112` from `APP_SURFACE` |

### 5.2 Server-only — 44

| Var | Read at (all, or 5 + total count) | Purpose |
|---|---|---|
| `NODE_ENV` | `lib/env-guard.ts:52`, `lib/env-auth.ts:20`, `app/api/media-proxy/route.ts:30`, `lib/prisma.ts:16`, `lib/data/grid/daily-access.ts:22` (**34 total**) | prod/dev branching |
| `DATABASE_URL` | `lib/prisma-database.ts:10`, `lib/db-health.ts:20`, `prisma.config.ts:10`, `scripts/import-esbpowerline-news.ts:28`, `scripts/test-db-connection.ts:12` (**31 total**) | Prisma pooler connection |
| `DIRECT_URL` | `scripts/check-images.ts:9`, `scripts/import-esbpowerline-news.ts:63,64` | Prisma session pooler (migrations) |
| `POSTGRES_PRISMA_URL` | `lib/prisma-database.ts:12`, `scripts/backfill-media-library.ts:39`, `scripts/import-esbpowerline-news.ts:56`, `scripts/reset-analytics-and-staff.ts:42`, `scripts/sync-editor-identity.ts:40` (**9 total**) | Vercel/Supabase pooled URL fallback |
| `POSTGRES_URL` | `lib/prisma-database.ts:12`, `scripts/update-ticker.ts:12`, `scripts/sync-vercel-prod-env.mjs:27` | Pooled URL fallback |
| `POSTGRES_URL_NON_POOLING` | `scripts/import-esbpowerline-news.ts:67`, `scripts/update-ticker.ts:12`, `scripts/sync-vercel-prod-env.mjs:28,33` | Direct URL source |
| `POSTGRES_PASSWORD` | `scripts/sync-vercel-prod-env.mjs:25` | Env push only |
| `PRISMA_MIGRATE_USE_DIRECT_HOST` | `scripts/resolve-migration-database-url.mjs:37` | IPv4-addon migrate switch |
| `AUTH_SECRET` | `lib/env-auth.ts:19`, `scripts/sync-vercel-prod-env.mjs:35` | Session-handoff HMAC key |
| `SUPABASE_SERVICE_ROLE_KEY` | `utils/supabase/env.ts:20`, `scripts/create-bucket.ts:6`, `scripts/seed-supabase-staff.ts:33`, `scripts/sync-editor-identity.ts:51`, `scripts/test-db-connection.ts:17` (**10 total**) | Service-role admin key |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY` | `scripts/sync-vercel-prod-env.mjs:19 / :22 / :23` | Non-public mirrors, env-push only |
| `SUPABASE_STORAGE_BUCKET` | `lib/media-storage-url.ts:4` | Media bucket name |
| `CRON_SECRET` | `lib/api/cron-auth.ts:13`, `app/api/cron/ingest/route.ts:8`, `app/api/cron/publish-scheduled/route.ts:8` | Cron bearer token |
| `UPSTASH_REDIS_REST_URL` | `middleware.ts:31` | Presence gate for the Redis rate limiter |
| `UPSTASH_REDIS_REST_TOKEN` | *implicit* — read by `Redis.fromEnv()` at `middleware.ts:31` | **Appears in no grep; required by the SDK** |
| `MASTER_ADMIN_PASSWORD` | `lib/seed-credentials.ts:31,34,46`, `prisma/seed-production.ts:71`, `scripts/bootstrap-production.mjs:31`, `scripts/lib/seed-passwords.mjs:13,16` | Production admin bootstrap |
| `EDITOR_PASSWORD` | `lib/seed-credentials.ts:34,49`, `scripts/lib/seed-passwords.mjs:16` | Editor bootstrap |
| `MEMBER_DEMO_PASSWORD` | `lib/seed-credentials.ts:37,52`, `scripts/lib/seed-passwords.mjs:19` | Member demo bootstrap |
| `SEED_DEMO_PASSWORD` | `lib/seed-credentials.ts:42`, `scripts/lib/seed-passwords.mjs:23` | Dev seed override |
| `ALLOW_PRODUCTION_SEED` | `lib/seed-target-guard.ts:27`, `prisma/seed-production.ts:120`, `scripts/backfill-media-library.ts:48`, `scripts/import-esbpowerline-news.ts:738`, `scripts/reset-analytics-and-staff.ts:153` (**7 total**) | Destructive-operation gate |
| `VERCEL` | `app/api/admin/data/ingest-day/route.ts:51`, `parse/route.ts:33`, `publish/route.ts:31`, `publish-local/route.ts:61`, `app/api/cms/yoy-archive/route.ts:29` | Refuse local-only operations when deployed |
| `AWS_LAMBDA_FUNCTION_NAME` | same five routes (`:51/:33/:31/:61/:29`) | Second serverless detector |
| `VERCEL_URL` | `lib/auth-redirect.ts:30` | Preview-deploy redirect base |
| `APP_SURFACE` | `next.config.ts:4`, `lib/workspace-urls.ts:11` | Selects `distDir` and cross-port routing |
| `NEXT_RUNTIME` | `instrumentation.ts:2` | Node-only bootstrap gate |
| `GEMINI_API_KEY` | `scripts/translate-articles.ts:15` (→ URL query at `:22`) | Gemini translation |
| `ESB_PYTHON` | `app/api/admin/data/ingest-day/route.ts:33`, `parse/route.ts:42`, `publish/route.ts:36`, `scratch/*.ts` (6) | Python interpreter path |
| `LOCALAPPDATA`, `USERPROFILE`, `HOME` | `app/api/admin/data/*` (`:34`/`:43`/`:37`), `lib/cron/energy-ingest.ts:111` | Local archive path discovery |
| `ESB_YOY_ARCHIVE_DIR` | `lib/data/yoy-archive.ts:22` | Mapped-drive YoY folder |
| `DAILY_REPORT_VALIDATE` | `lib/data/grid/validate-daily-report.ts:205` | Validation strictness |
| `PY_DIR`, `PYTHON` | `scratch/verify-yoy.ts:34`, `scripts/verify-source.mjs:65` | Python path |
| `DRY_RUN`, `LIMIT` | `scripts/import-esbpowerline-news.ts:82`, `:81` | Importer flags |
| `CPANEL_FTP_{HOST,USER,PASSWORD,PORT,SECURE,PATH}` | `scripts/sync-vercel-prod-env.mjs:37-42` only | Env push only — **no runtime consumer** |
| Python-side: `GOOGLE_API_KEY`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX`, `GOOGLE_CSE_ID`, `ESB_AVAILABLE_DATES_PATH`, `ESB_DAILY_OUTPUT_DIR`, `ESB_DAILY_REPORTS_ROOT`, `ESB_GRID_BACKLOG`, `ESB_PARSE_PETROBANGLA`, `ESB_PB_PDF_DIR`, `ESB_PETROBANGLA_HOT_FOLDER`, `ESB_PETROBANGLA_JSON_STAGING` | `scripts/**/*.py` via `os.environ` | Extractor pipeline paths + search verification |

### 5.3 `.env.example` cross-reference

**Documented (25 names)**, `.env.example` lines: `DATABASE_URL:31`, `DIRECT_URL:32`, `AUTH_SECRET:38`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:43`, `NEXT_PUBLIC_SUPABASE_URL:49`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:50`, `NEXT_PUBLIC_SUPABASE_ANON_KEY:52`, `SUPABASE_SERVICE_ROLE_KEY:53`, `SUPABASE_STORAGE_BUCKET:55`, `NEXT_PUBLIC_APP_DOMAIN:59`, `NEXT_PUBLIC_PUBLIC_SITE_URL:63`, `SEED_DEMO_PASSWORD:66`, `MASTER_ADMIN_PASSWORD:69`, `EDITOR_PASSWORD:70`, `MEMBER_DEMO_PASSWORD:71`, `ALLOW_PRODUCTION_SEED:74`, `CRON_SECRET:77`, `CPANEL_FTP_*:84-89`, `NEXT_PUBLIC_CDN_URL:90`, `ESB_YOY_ARCHIVE_DIR:96`, and `PRISMA_MIGRATE_USE_DIRECT_HOST` in prose at `:28`.

**Documented but never read in code:**

- `NEXT_PUBLIC_APP_DOMAIN` (`.env.example:59`) — zero references repo-wide. It is documented as driving cross-subdomain auth cookies; it drives nothing. That logic lives in `lib/auth-routing.ts` / `lib/workspace-urls.ts` and uses `NEXT_PUBLIC_*_SITE_URL`.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (`:43`) — consumed by Next itself; no app read is expected.
- `CPANEL_FTP_*` (`:84-89`) — only pushed to Vercel by `scripts/sync-vercel-prod-env.mjs:37-42`. `basic-ftp@^6.0.1` (`package.json:77`) is installed but imported nowhere. Six unused secrets are shipped into the Vercel production environment.

**Read in code but undocumented in `.env.example` (≈32):** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_SITE_URL`, `NEXT_PUBLIC_CMS_SITE_URL`, `APP_SURFACE`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`, `ESB_PYTHON`, `PY_DIR`, `PYTHON`, `DAILY_REPORT_VALIDATE`, `DRY_RUN`, `LIMIT`, `GOOGLE_API_KEY`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX`, `GOOGLE_CSE_ID`, `ESB_AVAILABLE_DATES_PATH`, `ESB_DAILY_OUTPUT_DIR`, `ESB_DAILY_REPORTS_ROOT`, `ESB_GRID_BACKLOG`, `ESB_PARSE_PETROBANGLA`, `ESB_PB_PDF_DIR`, `ESB_PETROBANGLA_HOT_FOLDER`, `ESB_PETROBANGLA_JSON_STAGING`.

### 5.4 Env guard modules

**`lib/env-guard.ts`** — invoked from `instrumentation.ts:7-8`, Node runtime only, and only when `NODE_ENV === 'production'` (`:52`):

```ts
const FATAL_ENV = [                        // lib/env-guard.ts:12-17
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const WARN_ENV: Record<string, string> = { // lib/env-guard.ts:30-33
  CRON_SECRET: 'scheduled publishing and /api/cron/* are disabled (they answer 503)',
  NEXT_PUBLIC_SITE_URL: 'canonical URLs fall back to https://esbpowerline.com',
};
```

`assertEnvVar(name)` (`:1-5`) is exported but called nowhere.

**`lib/auth-env.ts`** — `sanitizeAuthEnv()` (`:28-41`), run first at `instrumentation.ts:3-4`. It throws if any of these appears with a `NEXT_PUBLIC_` prefix:

```ts
const SERVER_ONLY_VARS = [                 // lib/auth-env.ts:10-20
  'SUPABASE_SERVICE_ROLE_KEY', 'AUTH_SECRET', 'DATABASE_URL', 'DIRECT_URL',
  'CRON_SECRET', 'MASTER_ADMIN_PASSWORD', 'EDITOR_PASSWORD',
  'MEMBER_DEMO_PASSWORD', 'SEED_DEMO_PASSWORD',
] as const;
```

**`lib/env-auth.ts`** (a different file with a near-anagram name) — `getAuthSecret()` (`:18-41`) throws in production on an absent secret, on any value in the committed-placeholder set (`:8-13`), on a match for `/change[-_ ]?(me|in[-_ ]?prod)/i`, or on `length < 32`.

### 5.5 Flags

1. **`FATAL_ENV` requires the legacy key name.** `lib/env-guard.ts:16` hard-requires `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but the app's own resolver (`utils/supabase/env.ts:2-8`) *prefers* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and treats anon as the fallback, and `.env.example:50,52` presents publishable as primary with anon commented out. A deployment configured per the documented happy path (publishable only) **throws at instrumentation and 500s every dynamic route** while statics and the build stay green — the exact failure mode the file's own comment (`:38-49`) records from 2026-08-15.
2. **`process.env` read inside `"use client"` files** — all `NEXT_PUBLIC_`, so no leak, but they are inlined at build time and therefore fixed per build: `components/shared/MediaUpload.tsx:141,1140`, `components/cms/MediaPicker.tsx:57`, `components/cms/FeaturedImageEditor.tsx:77` (all `NEXT_PUBLIC_CDN_URL`); `components/shared/DevCompileHint.tsx:15` and `app/providers.tsx:8` (`NODE_ENV`). **No secret-looking name appears under `NEXT_PUBLIC_` anywhere.**
3. **Hardcoded credential-shaped literal in source**: `scripts/fetch_pgcb_daily_workbooks.py:53-57` embeds a Laravel encrypted-payload token (`eyJpdiI6…`) in the ERP listing URL; the comment at `:50-51` asserts it is public and stable. The file is **untracked in git**.
4. **Hardcoded Supabase project ref `sxgokpmrbgdndstygapc`** in five places, three of them git-tracked (see §4.2). Not a secret, but it pins the production project into the repo.
5. **GA4 measurement ID `G-V04WZWK8WT` hardcoded** at `app/layout.tsx:128,135`; the admin and CMS surfaces report into the public property.
6. **No secret values found in tracked source.** Scans for `eyJ`, `sk-`, `AIza` over `.ts/.tsx/.js/.mjs/.py/.json` (excluding `node_modules`, `.next*`, `scratch/`, `package-lock.json`) returned only the Python URL token in item 3.
7. **Env files present and correctly ignored**: `.env`, `.env.local`, `.env.production.local` exist on disk; `.gitignore:12-22` covers `.env`, `.env.*`, `.env.local`, `.env.production.local` and `.env*` with `!.env.example`; only `.env.example` is tracked. `.env.production.local` additionally holds `SUPABASE_JWT_SECRET` and `SUPABASE_SECRET_KEY` — two names read nowhere in code and documented nowhere.
8. **`UPSTASH_REDIS_REST_TOKEN` is invisible to every grep.** `middleware.ts:31` gates on the URL alone and lets `Redis.fromEnv()` read the token. Setting the URL without the token throws inside the SDK at middleware module scope, i.e. on every request.
9. **`images.remotePatterns` wildcard `**.esbpowerline.com`** (`next.config.ts:184`) carries no `pathname` pin, unlike the deliberately pinned Supabase entries at `:170-179`.
10. **Stale documentation**: `.env.example:79-80` claims Vercel Analytics and Speed Insights are mounted in `app/layout.tsx`; neither package is imported anywhere.

---

## 6. Dependencies

From `package.json`. "Used at" gives representative sites found by repo-wide grep over `app/`, `lib/`, `components/`, `scripts/`, `utils/`, `hooks/`, `prisma/`, `middleware.ts`, `instrumentation.ts`.

### 6.1 `dependencies` (51)

| Package | Version | Used at |
|---|---|---|
| `@hookform/resolvers` | `^5.4.0` | **No source reference** |
| `@next/third-parties` | `^16.2.10` | **No source reference** (GA is hand-rolled with `next/script`) |
| `@prisma/adapter-pg` | `^7.8.0` | `lib/prisma.ts`, `prisma/client.ts` |
| `@prisma/client` | `^7.8.0` (7.9.1 installed) | `lib/prisma.ts`, `prisma/client.ts`, `app/api/data/[...path]/route.ts` |
| `@radix-ui/react-dialog` | `^1.1.17` | `components/ui/dialog.tsx` |
| `@radix-ui/react-popover` | `^1.1.17` | `components/ui/popover.tsx` |
| `@react-pdf/renderer` | `^4.5.1` | `lib/data/grid/grid-export-charts.server.tsx`, `-fonts.server.ts`, `-icons.server.tsx`, `-pdf.server.tsx`. Declared in `serverExternalPackages` (`next.config.ts:116`) because it ships fontkit/yoga native bits |
| `@supabase/ssr` | `^0.12.0` | `app/api/auth/handoff/route.ts`, `utils/supabase/{client,middleware,server}.ts` |
| `@supabase/supabase-js` | `^2.108.2` | `lib/supabase/{admin-client,auth-user-sync,edge-session-gate,health,resolve-role}.ts` |
| `@tiptap/*` (11 packages) | `^3.26.1` | `components/editor/TipTapEditor.tsx` (starter-kit, image, link, placeholder, table + cell/header/row, text-align, underline, horizontal-rule, react) |
| `@types/bcryptjs` | `^2.4.6` | types only (a runtime dependency, not a devDependency) |
| `@upstash/ratelimit` | `^2.0.8` | `middleware.ts:27` |
| `@upstash/redis` | `^1.38.0` | `middleware.ts:28` |
| `@vercel/analytics` | `^2.0.1` | **No source reference** |
| `@vercel/speed-insights` | `^2.0.0` | **No source reference** |
| `basic-ftp` | `^6.0.1` | **No source reference** (cPanel FTP env vars exist but nothing consumes them) |
| `bcryptjs` | `^3.0.3` | `lib/actions/{auth-verify,member-profile,member-register,password-reset,profile}.ts` |
| `class-variance-authority` | `^0.7.1` | `components/ui/badge.tsx`, `components/ui/button.tsx` |
| `clsx` | `^2.1.1` | `lib/utils.ts` |
| `dagre` | `^0.8.5` | `components/news/GridTopologyMap.tsx` (graph layout) |
| `date-fns` | `^4.4.0` | `lib/datetime-local.ts`, `components/cms/CmsDateTimePicker.tsx`, `components/home/HomeTrendingSection.tsx`, `components/news/CoverageArticleLayouts.tsx` |
| `dotenv` | `^17.4.2` | `lib/prisma.ts`, `lib/prisma-database.ts`, `prisma.config.ts`, many scripts |
| **`exceljs`** | `^4.4.0` | **`lib/data/grid/grid-export.server.ts` only** — builds the member XLSX grid export |
| `jszip` | `^3.10.1` | **`lib/data/grid/grid-export.server.ts` only** — bundles multi-dataset exports |
| `lucide-react` | `^0.511.0` | Icons, ~everywhere in `app/` and `components/`. In `optimizePackageImports` (`next.config.ts:133`) |
| `next` | `^16.2.10` (16.3.0 installed) | framework |
| `next-themes` | `^0.4.6` | `components/dashboard/ThemeToggle.tsx` |
| `pg` | `^8.22.0` | `lib/prisma.ts`, `prisma/client.ts`, `scripts/{check-images,check-releases,publish-titas-investigation,recategorise-articles}` |
| `prisma` | `^7.8.0` | CLI (also a runtime dependency, not a devDependency) |
| `react` / `react-dom` | `^19.2.7` (19.2.8 installed) | framework |
| `react-hook-form` | `^7.79.0` | **No source reference** |
| `react-is` | `^19.2.7` | Not imported directly; present as an `overrides` pin (`package.json:131-133`) for Recharts |
| `react-window` | `^2.2.7` | **No source reference** |
| `reactflow` | `^11.11.4` | `components/news/GridTopologyMap.tsx` |
| `recharts` | `^3.8.1` | `app/(public)/annual-reports/financials/FinancialsClient.tsx`, `components/admin/AdminAnalyticsCharts.tsx`, `components/news/power-grid/LongitudinalStudy.tsx`, the four `petrobangla-archive/*` chart components, `petrobangla-live/pbLiveFieldSnapshot.tsx`. In `optimizePackageImports` (`next.config.ts:134`) |
| `sanitize-html` | `^2.17.5` | `lib/sanitize-article-html.ts` |
| `server-only` | `^0.0.1` | `lib/actions/yoy-comparison.ts`, `lib/article-view-tracking.ts`, `lib/auth-env.ts`, `lib/auth-handoff.ts`, `lib/author-stats.ts`, `lib/data/releases.server.ts`, and other `*.server.ts` modules |
| **`sharp`** | `^0.33.5` | **`scripts/import-esbpowerline-news.ts` only** in application source. Also pulled in transitively by `lib/media-storage` — `next.config.ts:79-84` records that `sharp` plus the data archive pushed `/api/upload/category-icon` to 267.37 MB against the 250 MB function limit and failed the 2026-08-15 production deploy |
| `sonner` | `^2.0.7` | `app/layout.tsx`, `lib/cms-toast.ts`, many `components/admin/*`. In `optimizePackageImports` (`next.config.ts:136`) |
| `tailwind-merge` | `^3.6.0` | `lib/utils.ts` |
| `zod` | `^3.25.76` | `lib/actions/articles.ts`, `lib/data/grid/validate-daily-report.ts`, `lib/validations/{article,user}.ts`, `lib/test/article-submit-validation.ts` |

### 6.2 `devDependencies` (22)

`@types/dagre@^0.7.54`, `@types/node@^22.15.21`, `@types/pg@^8.20.0`, `@types/react@^19.1.5`, `@types/react-dom@^19.1.5`, `@types/sanitize-html@^2.16.1`, `autoprefixer@^10.4.21`, `concurrently@^10.0.3` (drives `dev:all`), `cross-env@^10.1.0` (sets `APP_SURFACE` on Windows), `eslint@^9.27.0`, `eslint-config-next@15.3.3` (**pinned a major behind the installed Next 16**), `lighthouse@^13.4.0`, `postcss@^8.4.49`, `puppeteer@^25.3.0`, `supabase@^2.107.0` (CLI), `tailwindcss@^3.4.17`, `tsx@^4.19.4`, `typescript@^5.8.3`, `vercel@^54.14.2` (CLI — deploys are CLI uploads), `vitest@^3.2.4`.

### 6.3 Declared but unreferenced in source (8)

`@hookform/resolvers`, `@next/third-parties`, `@vercel/analytics`, `@vercel/speed-insights`, `basic-ftp`, `react-hook-form`, `react-window`, and `react-is` (present only as an `overrides` pin).

### 6.4 Other package.json facts

- `allowScripts` (`package.json:127-130`) permits postinstall for `@prisma/engines@7.9.1` and `prisma@7.9.1` only.
- `overrides` (`package.json:131-133`) forces `react-is@^19.2.7`.
- 47 npm scripts, spanning three dev surfaces, Prisma/Supabase seeding, the Python data pipeline (`verify:reserves`, `build:reserves`), verification (`verify:data`, `verify:source`, `backtest:erp`), and `test:qa`, which names ten specific security/role test files.

---

## Appendix A — Index of recorded inconsistencies

Every item below is a factual observation with a reference, gathered from the sections above. No judgement of severity is implied by the ordering.

### Configuration and environment
| # | Observation | Reference |
|---|---|---|
| A1 | `FATAL_ENV` hard-requires `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but the app's resolver prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `.env.example` presents publishable as primary | §5.5.1 |
| A2 | `UPSTASH_REDIS_REST_TOKEN` is required by the SDK but appears in no grep; the gate checks only the URL | §5.5.8 |
| A3 | `NEXT_PUBLIC_APP_DOMAIN` is documented in `.env.example:59` and read nowhere | §5.3 |
| A4 | Six `CPANEL_FTP_*` secrets are pushed to production; `basic-ftp` is imported nowhere | §5.3, §6.3 |
| A5 | ~32 env vars are read in code but undocumented in `.env.example` | §5.3 |
| A6 | `.env.example:79-80` claims Vercel Analytics/Speed Insights are mounted; neither package is imported | §4.7, §5.5.10 |
| A7 | `images.remotePatterns` wildcard `**.esbpowerline.com` carries no `pathname` pin | §4.4, §5.5.9 |
| A8 | GA4 measurement ID is a hardcoded literal, shared across all three surfaces | §4.7, §5.5.5 |
| A9 | `middleware.ts` uses the convention Next 16 deprecated and renamed to `proxy` | §1.3 |
| A10 | `eslint-config-next` is pinned at 15.3.3 against Next 16.3.0 | §6.2 |
| A11 | No `engines` field, `.nvmrc`, or `.node-version` pins the Node version | §0 |

### Data layer
| # | Observation | Reference |
|---|---|---|
| B1 | `DataDraft` is defined and indexed but no admin route reads or writes it; the "staged, reviewed" flow is not wired | §2.8.1 |
| B2 | `daily-loader.client.ts` is static-first with a 404-only retry, so corrections to already-shipped days are invisible to it; `runtime-data.client.ts` is manifest-first | §2.8.2 |
| B3 | `MONTH_RE` rejects all of 2013, and `ISO_DATE_RE` rejects the archive's first day (`2013-12-31`) — both unpublishable at runtime | §2.3, §2.8.3 |
| B4 | `publish/route.ts` never publishes `GRID_CURVE` or `GRID_PLANTS` despite writing the curve file | §2.7, §2.8.4 |
| B5 | Payload validation applies to `GRID_DAILY` only; 12 other feeds upsert unvalidated | §2.8.5 |
| B6 | A malformed static JSON file silently falls through to the bundled archive rather than erroring | §2.8.6 |
| B7 | 81 calendar days are missing from `public/data/daily/` | §2.1 |
| B8 | The 28 MB `grid-verification/` tree has no feed mapping and can only change by redeploy | §2.1 |
| B9 | Four stray parser dumps sit in `petrobangla/daily/` with non-conforming names | §2.1 |
| B10 | `archive-fallback.ts` is 34,341 lines and statically imported by the server loader | §2.5 |

### Displayed figures
| # | Observation | Reference |
|---|---|---|
| C1 | Bulk tariff, retail diesel/octane and the USD/BDT fallback are TypeScript constants with `change: 0` hardcoded | §3.1, §3.3 |
| C2 | Ticker fallback tariff **8.95** contradicts the live `macroTariffData` value **8.39** | §3.1 |
| C3 | All twelve Sector Glance tiles are string literals | §3.6 |
| C4 | Sector Glance "91,242 MVA" contradicts the Technical Information table total "91,512 MVA" | §3.6, §3.7.9 |
| C5 | `DAILY_SNAPSHOT_LABELS[0]` is `'Current Demand'`; the builder emits `'Evening Peak Demand'` | §3.2 |
| C6 | Energy Unserved is dropped when absent, but RE tiles are emitted as literal `0` — contradicting the stated principle | §3.2 |
| C7 | Two different "average generation cost" numbers coexist: PGCB's printed `avgProductionCost` (P) and a derived total (D) | §3.3 |
| C8 | Two different gas-production numbers coexist on different day-keys; a sampled day gives 1931.4 vs 1931.2 | §3.3 |
| C9 | Unit-cost authentication data stops at 2026-06-24; newer days render `awaiting-witness` | §3.3 |
| C10 | `LongitudinalStudy.tsx:325` prints 15,688 ckm where the data says 15,680 | §3.7.1 |
| C11 | `LongitudinalStudy.tsx:448-457` labels FY2011=100 index values as growth percentages | §3.7.2 |
| C12 | `PublishedVsDerivedTab.tsx:470-472` prints the same figure on both sides of "N of N words" | §3.7.3 |
| C13 | `GasTab.tsx` says gas tracking started 2020-01-12; `coverage.ts:50` on the same tab says 2020-01-11 | §3.7.4 |
| C14 | `PublishedVsDerivedTab` is the only tab bypassing the manifest-aware fetch | §3.0, §3.7.8 |
| C15 | Petrobangla `ARCHIVE_INSIGHTS.jun2026Latest` (2643.0) disagrees with the index (2696.5) | §3.6 |
| C16 | `renewables` is always `hasData: true` yet is absent from `DATE_INDEPENDENT` | §3.5 |
| C17 | The `TabDescriptor` type names a `'pricing'` tab id that no tab supplies | §3.4 |
| C18 | Three MKWh→kWh spellings and two Crore divisors coexist | §3.7.7 |

### Routes
| # | Observation | Reference |
|---|---|---|
| D1 | `/uploads/[...path]` serves files from disk with no auth and a fuzzy suffix match | §1.2 |
| D2 | `/api/cron/ingest` is routed and secret-gated but its body is a stub that never runs the pipeline; it is also unscheduled | §1.2, §1.6, §4.5 |
| D3 | `/api/market/dse` serves a curated snapshot with `live: false`; no DSE feed exists | §1.2, §4.5 |
| D4 | `next.config.ts` and `vercel.json` define two overlapping header layers for the same paths | §1.5 |
| D5 | `outputFileTracingExcludes` keys are route paths, so `/admin/**` does not cover `/api/admin/**` | §1.8 |
| D6 | `media-proxy` host allowlist uses `endsWith('.' + allowed)`; in dev this admits `evil.localhost` | §4.5 |

---

## Appendix B — Where to look first

| Question | File |
|---|---|
| "Which copy of a day's data is authoritative?" | `lib/data/releases.server.ts:125-139` |
| "Why is this tab empty for 2015?" | `lib/data/grid/tab-availability.ts:52-115` |
| "Where does the homepage ticker get its numbers?" | `lib/data/grid/live-ticker.server.ts` |
| "Who may publish data?" | `lib/constants.ts:83-84` (`data.publish: 80`) |
| "What gates the historical archive?" | `middleware.ts:181-256` |
| "What runs when a new day is ingested?" | `scripts/run_daily_ingest.py:126-176` |
| "Which feeds map to which files?" | `lib/data/feed-paths.ts:41-55` |
| "What can the site talk to?" | `next.config.ts:43-62` (CSP) |

*End of Phase 0 inventory.*
