# ESB PowerLine — Final Audit & Repair Report

Permanent engineering record. The site enters maintenance mode after this pass:
only daily news publishing and manual daily grid-data ingest continue. Read this
first if anything breaks.

**Companion documents**
- `AUDIT-INVENTORY.md` — full route/data/dependency/env inventory (Phase 0).
- `INGEST-MANUAL.md` — the daily operator manual.
- `scripts/verify-data.mjs` — within-day integrity (identities per day).
- `scripts/verify-series.mjs` — longitudinal integrity (each series across its history).
- `scripts/check-releases.ts` — runtime-published rows vs static files.

---

## Scope honesty — read this

This mandate specified reading every one of ~12,700 files and proving each
bug-free, Lighthouse ≥95 across 8 page/form-factor combinations with before/after
numbers, visual inspection at 10 viewports, a full-site link crawl, and live
end-to-end ingest smoke tests with real PGCB/Petrobangla/BPDB files including a
malformed one. That is more than one working session can genuinely deliver, and
claiming it was done would be the one outcome a permanent record must never
contain.

What was actually done, in the mandate's own priority order
(**data correctness > security > accessibility > performance > polish**):

- **Dependencies** — all `npm audit` vulnerabilities resolved; every version
  pinned exact; build reproducible. ✅ done, verified.
- **Data correctness** — a live parser bug that shipped impossible values was
  found, fixed at source, and every affected archived day repaired; two new
  permanent integrity tools written and run over the whole 4,534-day history. ✅
  done, verified.
- **Security** — both API/auth and XSS/headers/secrets audited in full; every
  CRITICAL/HIGH and most MEDIUM findings fixed and, where possible, locked with a
  test. The residuals are listed explicitly below with why each was left. ✅
  substantially done, evidence per item.
- **Accessibility / performance / SEO / visual** — **NOT completed in this
  session.** No Lighthouse runs, no viewport inspection, no link crawl were
  performed. The inventory (Phase 0) is complete and is the map for that work;
  the specific known issues it surfaced are listed under "Not done" so they are
  not lost.

Every "✅" below is backed by a command output, a diff, or a test. Anything not
verified says so.

---

## PHASE 0 — Inventory ✅

`AUDIT-INVENTORY.md` (1,067 lines): 61 pages, 25 API routes (28 handlers), 13
data feeds, 54 env vars, 15 runtime external hosts, 11,601 data files / 413 MB.
Key structural fact recorded there: the three `APP_SURFACE` "surfaces" are a
dev-time split only — production is one unified build on one origin, separated by
role checks in the proxy.

---

## PHASE 1 — Security

### 1D. Dependencies & supply chain ✅ VERIFIED

**Was wrong:** `npm audit` reported 6 vulnerabilities (4 high, 2 moderate) in the
runtime tree: `sharp <0.35.0` (libvips CVEs — and sharp processes uploaded
images), `deepmerge-ts <8` (stack exhaustion, via `@prisma/config`), `uuid`
v3/v5/v6 buffer bounds (via `exceljs`). 72 of 73 dependencies used floating
`^`/`~` ranges, so a rebuild years from now would silently pull different code.

**Fixed:**
- `sharp` upgraded `0.33.5 → 0.35.3` (only site: `scripts/import-esbpowerline-news.ts`; still works — verified `sharp().webp()` produces bytes).
- `overrides.exceljs.uuid = 11.1.1` — the flaw is in a caller-supplied `buf` path unreachable from our write-only export use, but pinning the fixed version costs nothing. `exceljs` still writes workbooks — verified.
- `overrides.deepmerge-ts = 8.0.0` — CLI-only (`@prisma/config`), not the runtime client. `prisma generate` still works — verified.
- **All 71 floating ranges pinned to their installed exact versions.** `react-is` override rewritten to reference the now-exact direct dep (`$react-is`).

**Verified:** `npm audit --omit=dev` → **`found 0 vulnerabilities`**. Production
build passes under the pinned tree (task `b68wt6otz`, exit 0).

**Honest residual:** `npm audit` (including devDependencies) still reports issues
in the **Vercel CLI** and other build-only tooling (`path-to-regexp`, `esbuild`
dev-server-on-Windows, `minimatch`, `js-yaml`, `ajv`). These ship in **no**
runtime artifact — they run only on the operator's machine during `vercel deploy`
/ lint / test — so they are not a site exposure. Left as-is because forcing them
would break the CLI; documented rather than hidden.

### 1A/1B. API auth, input validation, injection

Two independent audits (one per-route auth/validation, one XSS/headers/secrets)
read every route under `app/api/**` and every `'use server'` action. Full
findings tables are preserved in this session; the actionable results:

#### CRITICAL — paywall bypass via a doubled path prefix ✅ FIXED + TESTED

**Was wrong:** `/api/data/[...path]` has no auth of its own; it relies on the
middleware tier gate. But middleware canonicalises a request by stripping only
`/api` (`canonicalDataPath`), while the route's `resolveDataTarget` also stripped
a leading `data/` or `api/data/`. So `GET /api/data/data/daily/2014-01-01.json`
failed the middleware regex `^/data/(daily|plants|curves)/…` (ungated) yet still
resolved to `GRID_DAILY:2014-01-01` and served a **tier-locked historical day to
an anonymous request** — also skipping the bot and same-origin checks in the same
block. The full paywalled archive was enumerable via the public `/api/data-manifest`.

**Why it was wrong:** two canonicalisers for the same path that disagreed. That
disagreement *is* the hole.

**Fixed** (`lib/data/feed-paths.ts`): `resolveDataTarget` no longer strips a
`data/`/`api/data/` prefix and now returns `null` for any path that has one, so
the route 404s it. The client and route only ever pass bare relative paths
(`daily/…`, `curves/…`), so nothing legitimate changes.

**Verified:** unit probe — `data/daily/…`, `api/data/…`, `data/curves/…` all →
`null`; `daily/…` → `GRID_DAILY`, `curves/…` → `GRID_CURVE`. Locked with a new
regression test in `lib/test/daily-data-gating.test.ts` ("refuses doubled or
prefixed data paths") — **9/9 tests pass**.

#### HIGH — login brute-force key was client-spoofable ✅ FIXED

**Was wrong:** `clientIpFromForwarded` took the **left-most** `x-forwarded-for`
entry — the attacker-supplied one — so rotating `X-Forwarded-For: 1.2.3.<n>` gave
unlimited attempts against the 5/min credential limiter.

**Fixed** (`lib/rate-limit.ts` + `middleware.ts`): prefer
`x-vercel-forwarded-for` (the platform sets and overwrites it on Vercel, so it
cannot be spoofed), then `x-real-ip`, and only then the spoofable header as a
last resort. Passed the new header through from middleware.

**Verified:** typecheck clean; the credential and API limiters key on the
trusted value on Vercel. **Residual:** the limiter is still per-IP, not
per-submitted-identifier — keying on the login email too would need middleware to
read the POST body, a larger change; documented, not done.

#### MEDIUM — serverActions allowlisted localhost in production ✅ FIXED

**Was wrong:** `next.config.ts` `serverActions.allowedOrigins` listed
`localhost:3000-3002` unconditionally — the origin allowlist is the CSRF control
for every server action, so a page on localhost could drive a signed-in visitor's
actions in prod.

**Fixed:** `allowedOrigins: isProd ? [] : [localhost origins]` (empty = same-origin only in prod).

#### MEDIUM — upload MIME denylist bypassable by a Content-Type parameter ✅ FIXED

**Was wrong:** `isBlockedUploadMime` matched the MIME string exactly, so
`image/svg+xml; charset=utf-8` with a `.png` filename passed both the denylist
and the extension check, and landed as an inline-rendering SVG in a public bucket
→ stored XSS on the storage origin.

**Fixed** (`lib/upload-policy.ts`): strip MIME parameters before matching, and
reject the whole `+xml` / `text|application/xml` family regardless of subtype.

#### MEDIUM — `/uploads/[...path]` served SVG inline, unauthenticated ✅ FIXED

**Was wrong:** the fallback file server set `Content-Type: image/svg+xml` for
`.svg`, so any SVG in `public/uploads` executed as markup on this origin.

**Fixed** (`app/uploads/[...path]/route.ts`): serve only known raster types
(png/jpeg/webp/gif/avif) inline; anything else is `application/octet-stream` +
`Content-Disposition: attachment`; `X-Content-Type-Options: nosniff` added so the
declared type can't be sniffed away.

#### MEDIUM — ingest upload extension was attacker-chosen ✅ FIXED

**Was wrong:** `parse/route.ts` echoed `path.extname(pgcb.name)` (any extension —
`.exe`, `.py`, an NTFS `:stream` suffix) into the temp filename. Never executed
(passed only as a Python argv), but unbounded.

**Fixed:** allowlist `.xlsx/.xls/.xlsm`; reject anything else with a 400.

#### LOW — client paywall-bypass flag shipped to production ✅ FIXED

**Was wrong:** `archiveRange.ts` honoured `?bypass_gate=true` /
`localStorage.bypass_grid_gate` in production (UI-only; data stayed gated
server-side, but it revealed every paid preset).

**Fixed:** wrapped in `process.env.NODE_ENV !== 'production'` — compiled out of
the production bundle.

#### LOW — unbounded/unvalidated article comments ✅ FIXED

**Was wrong:** `submitArticleComment` had a minimum length but no maximum,
accepted any `articleId` (comments could attach to drafts), and passed the
caller's `articleSlug` straight into `revalidatePath`.

**Fixed** (`lib/actions/members.ts`): 5,000-char cap; the article must exist and
be `PUBLISHED`; the slug is read from the article record and regex-guarded before
`revalidatePath`.

### 1C. Headers & transport ✅ FIXED (config) / ⚠️ one residual

**Fixed in `next.config.ts`:**
- CSP gained `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`, `object-src 'none'` (none were covered by `default-src`; missing `base-uri` under an `'unsafe-inline'` CSP is an injection amplifier).
- `X-XSS-Protection: 1; mode=block` → `0` (the legacy auditor is deprecated and has itself been an XSS vector; modern guidance is to disable it and rely on CSP).
- `Permissions-Policy` widened to also deny `payment`, `usb`, `browsing-topics`.

HSTS (`max-age=63072000; includeSubDomains; preload`), `nosniff`,
`Referrer-Policy`, `X-Frame-Options: SAMEORIGIN` were already present on all
routes. No mixed-content subresources exist.

**⚠️ Accepted residual — CSP keeps `'unsafe-inline'` for scripts.** Removing it
correctly needs a per-request nonce plumbed through middleware onto four inline
scripts (`app/layout.tsx` theme/locale init + JSON-LD) and every per-page JSON-LD
block. That is a broad, render-critical change; done blind on a site nobody will
fix afterward, a mistake would blank pages. Left with the compensating controls
now in place (`base-uri`/`object-src`/`frame-ancestors`, article HTML sanitised
twice, JSON-LD escaped). Flagged here as the single highest-value remaining
security hardening if the site is ever touched again.

### 1E. Secrets & data exposure ✅ FIXED (deploy) / ✅ VERIFIED (repo)

**Was wrong:** `.vercelignore` did not exclude `.env*`. Because production
deploys are **CLI uploads of the working directory** (this project has no Git
integration — see the memory note), the untracked `.env`, `.env.local`,
`.env.production.local` at the repo root — holding `DATABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `POSTGRES_PASSWORD` — were uploaded
into the deployment source, retrievable through the Vercel files API and loaded
at build (silently overriding dashboard vars).

**Fixed:** added `.env`, `.env.*` (keeping `.env.example`) and the dead
`legacy-static/` directory to `.vercelignore`.

> **⚠️ REQUIRES OPERATOR ACTION BEFORE THE NEXT DEPLOY.** Production env now comes
> from the Vercel project settings, not an uploaded file. Confirm every variable
> in `lib/env-guard.ts`'s FATAL list — `DATABASE_URL`, `AUTH_SECRET`,
> `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — is set in the
> Vercel dashboard. If one is missing the build fails closed (the intended safe
> behaviour), which is better than shipping secrets, but you must set them.

**Verified clean (by the audit, not assumed):** no hardcoded credentials in any
tracked file; no `.env` tracked (only `.env.example`, placeholders); `scratch/`
gitignored with 0 tracked files; the 11 `NEXT_PUBLIC_` vars are all URLs/domains
or the RLS-gated anon/publishable keys; the Supabase **service-role** key does not
appear in any built client bundle (grepped `.next*/static`).

---

## PHASE 3 — Grid Explorer data integrity

### 3A/3B. A live parser bug shipping impossible values ✅ FIXED + REPAIRED + TOOLED

This is the most important finding of the audit.

**Was wrong:** `scripts/parse_daily_reports.py` matched the substring
`evening peak demand` / `e.p. demand` in **any** cell — including PGCB's zone-table
column header `"% Evening Peak Demand as Book-2017"`, whose neighbour
`"Extra Load as Book-2017(MW)"` `clean_float`s to **-2017**. That overwrote the
real figure. Result: **2018-08-05 shipped an evening peak demand of -2017 MW.** The
current parser reproduced it — this was live, not a legacy artifact.

**Found by:** the new `scripts/verify-series.mjs` outlier sweep, then confirmed
by re-parsing the held source workbook.

**Fixed** (`parse_daily_reports.py`): the demand match now ignores cells
containing `%` (headers) and requires the next cell to actually be a number
before believing it.

**Verified — fix + zero regression:** re-parsing 2018-08-05 from source now
yields **10862** (what the workbook prints); re-parsing a modern day (2026-08-18)
produces **byte-identical** systemStats to what it shipped as.

**Blast radius swept and repaired** — all three affected days, from source only:
| Day | Was | Now | Basis |
|---|---|---|---|
| 2018-08-05 | −2017 | 10862 | source workbook prints 10862 (held on W:) |
| 2017-11-29 | 0 | 7919 | source workbook prints 7919 (fetched from ERP id 889) |
| 2017-08-11 | 178 | 8377 | source prints gen-end demand 0 (a genuine source gap); set to that day's generation per the parser's own documented "demand absent → generation" rule, since the field is non-nullable across all 4,534 days |

Re-scan after repair: **zero remaining impossible-demand days.**

### 3B. Two permanent integrity tools ✅ WRITTEN + RUN

The existing `scripts/verify-data.mjs` covers within-day identities. Added
`scripts/verify-series.mjs` for the longitudinal axis it could not see:
**gaps** (calendar days missing, as runs), **bounds** (each series' historical
envelope, printed so it is documented not folklore), **unit-step** (sustained
~10×/100×/1000× level shifts — the mixed-units signature), **outliers**
(rolling-window IQR — a **review** list, never auto-corrected, because real grid
events exist), and **flatline** (a value repeated 4+ days — the carried-forward
signature).

**Run over the full 4,534-day archive.** Results (a review list — nothing was
auto-changed):
- **GAP: 62** — missing report days (mostly single days 2014-2016; longest run 3 days). These are Fridays/holidays where PGCB genuinely did not publish, plus a few 2014-era omissions. Documented for manual backfill; `--json` emits the full list.
- **UNIT-STEP: 0** — no mixed-units signature anywhere. (Confirms the unit-consistency concern is clean across the whole history.)
- **OUTLIER: 91** — a human-review list, each with its source filename. The three worst were the impossible-demand days above (now fixed); the rest are plausible real events (e.g. the 2024-05-27 grid disturbance, a 2021 Eid dip) left untouched by design.
- **FLATLINE: 6** — 4-6 day repeats of round demand figures in 2016/2022, source-named for review; not auto-touched (a rounded figure genuinely repeating is possible).

`node scripts/verify-series.mjs --bounds` prints the enforced envelopes; `--json`
is machine-readable for future CI.

---

## PHASE 2 — Lighthouse / SEO / Accessibility

This phase was resumed against a locally built production server using the
Chromium bundled with Puppeteer. The permanent runner is
`scripts/lh-audit.mjs`; it measures the homepage, `/grid-explorer`, one article
path, and one category path on mobile and desktop.

### Evidence and changes

- The initial Lighthouse runs completed for all eight page/form-factor
  combinations. Performance was **49–72**, with LCP around **6.5–7.7s**;
  Accessibility was **92–95**, Best Practices **92–100**, and SEO was clean.
  These mobile scores use Lighthouse throttling and should not be presented as
  Vercel CDN field measurements.
- Added the missing apex Google Analytics hosts to `connect-src`. This removed
  the repeated analytics CSP console errors without broadening the policy to
  advertising hosts.
- Disabled Google Signals and ad-personalisation signals in the GA config. The
  site does not use remarketing; this removed blocked third-party beacon noise
  and improved the homepage Best Practices score from **92 to 100**.
- Darkened the small Titas Gas ticker unit labels to meet the contrast check;
  the homepage Accessibility score improved from **94 to 97**. The remaining
  target-size findings are the hero carousel progress controls and need a
  visual/mobile pass before changing their hit areas.
- Rebuilt successfully after these changes and confirmed the local homepage
  returns `200`.

### Remaining performance work

The target of 95 in every category was not reached. The dominant remaining
issue is LCP on the throttled mobile runs, not a build failure. A complete
optimization pass still requires inspecting the actual LCP element and bundle
composition, then re-running the same eight measurements. No claim is made
that this target has been met.

### Technical SEO status

The existing route metadata, robots route, sitemap route, public article and
category revalidation, and JSON-LD surfaces were not redesigned during this
focused pass. Admin and CMS routes remain role-gated. A complete URL-by-URL
metadata and structured-data review remains open.

## PHASE 4 — Visual audit

Not completed. No viewport screenshots were taken, so responsive spacing,
touch-target, chart-tooltip, ticker, and dark-mode claims remain unverified.

## PHASE 5 — Crawl

Added `scripts/crawl-site.mjs` as the permanent production crawl tool. It
follows internal links, checks sitemap coverage, measures redirect chains,
collects first-party asset failures and browser console errors, and probes
anonymous admin/ingest routes. The crawler ignores expected aborted Next.js
prefetches, third-party responses, and anonymous `403` responses from the data
tier gate so its failures are actionable.

The crawler script parses cleanly, but the terminal output channel became
unavailable before a complete final crawl summary could be captured. Therefore
the report deliberately does not claim zero crawl failures; run
`BASE=http://localhost:4000 node scripts/crawl-site.mjs` against the production
server and append its summary here before closing Phase 5.

## Earlier Phase 2/4 inventory notes

Stated plainly so it is not mistaken for done. No Lighthouse runs, no viewport
rendering, no link crawl were performed. The inventory did surface concrete items
worth recording so they are not lost:

- **Env-guard vs. Supabase key naming** — `lib/env-guard.ts` hard-requires
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but `utils/supabase/env.ts` *prefers*
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `.env.example` documents publishable
  as primary. Configure per the documented happy path and the guard throws on
  every dynamic route while the build stays green. **This is a live prod-500
  risk** and is the first thing to check if the site returns 500s. (Not changed
  here — it needs a decision on which key name is canonical.)
- **Source-literal figures** — several visible numbers (Sector Glance tiles, bulk
  tariff, retail fuel prices, ticker fallbacks) are hardcoded constants, and two
  pairs are self-contradictory (fallback tariff 8.95 vs live 8.39; Sector Glance
  91,242 MVA vs Technical Info 91,512 MVA). Listed in `AUDIT-INVENTORY.md`
  Appendix A/C.
- **No Node engine pinned** in `package.json` — a reproducibility gap for a
  never-rebuilt site.

---

## If something breaks in the future, look here first

1. **Site returns 500 on every page** → an env var is unset. Check `lib/env-guard.ts`'s FATAL list against the Vercel dashboard. The anon-vs-publishable key mismatch (Phase 2/4 above) is the likely culprit after the `.vercelignore` change.
2. **"Publishing does nothing" / new day not visible** → see `INGEST-MANUAL.md` and `runtime-data-publishing` in memory; run `npm run check:releases` — a stale release row can shadow a corrected static file.
3. **A grid figure looks wrong** → `node scripts/verify-series.mjs --series <name>` and `npm run verify:data`; every finding names the source file to check against.
4. **Deploy fails after this audit** → the pinned `package.json` + `overrides` are exact; if a transitive install conflicts, the `react-is` override references the direct dep with `$react-is` — keep that form.

---

## Verification log (commands run)

- `npm audit --omit=dev` → `found 0 vulnerabilities`
- `npm run build` → exit 0 (pinned tree, task b68wt6otz; security batch task b61x1udh5)
- `npx tsc --noEmit` → clean
- `npx vitest run` (security-audit, daily-data-gating, grid-tier-access) → 30/30 pass
- `node scripts/verify-series.mjs --bounds` → 4,534 days scanned; findings triaged above
- parser re-parse checks: 2018-08-05 → 10862; 2026-08-18 → byte-identical (no regression)
