# Moving the data archive out of the repository

*Written 2026-09-01 as the remediation plan for audit finding F-17.*

## What the problem actually is

`public/data` holds **11,639 files / 413 MB**, committed to git and shipped with
every deployment.

| Directory | Size | Files |
|---|---:|---:|
| `plants/` | 152 MB | 2,308 |
| `petrobangla/` | 112 MB | 2,318 |
| `daily/` | 77 MB | 4,545 |
| `pgcb-monthly/` | 31 MB | 317 |
| `grid-verification/` | 28 MB | 157 |
| `curves/` | 17 MB | 1,994 |
| everything else | < 1 MB | 12 |

This is not primarily a bandwidth problem — Vercel compresses responses, and a
daily file is 28 KB that goes over the wire as 4.5 KB. It is a **structural**
problem, and it has already cost real money and one production incident:

1. **It forced the dual-source architecture.** Because the archive ships with
   the deploy, any day published *after* a deploy needs a second home. That is
   why `DataRelease` exists, and why `lib/data/releases.server.ts` has to carry
   a precedence rule reconciling a database row against a static file of the
   same key. The rule is well designed and well documented. It also would not
   need to exist.

2. **It poisons serverless function tracing.** `loadDailyReportFromDisk` builds
   its path with a `path.join` the tracer cannot resolve, so the whole archive
   gets traced into any function that imports the loader. This once put
   `/api/upload` at 267 MB against a 250 MB limit and failed a production
   deploy. The fix — a `/cms/**` exclude plus a `/cms/yoy-sheet` include — is
   load-bearing, unverifiable outside a real build, and documented at length in
   `lib/test/function-bundle-tracing.test.ts` because nothing else could
   express it.

3. **It grows.** ~4 files a day, forever.

## Options, with the numbers

**Compression in place.** Storing `.json.gz` and inflating in the loader.
Measured on real files: a daily report goes 27,981 → 4,553 bytes (**84%**), a
plants file 17,897 → 2,373 (**87%**). The archive would fall to roughly **60 MB**.

*Verdict: worth doing regardless, but it solves the symptom.* The dual-source
architecture and the tracing problem both survive a smaller archive.

**Object storage (Vercel Blob, S3, or Supabase Storage).** The archive moves
out of the repo entirely; the loader fetches by key. Removes all three problems
at once: no deploy coupling, so `DataRelease` becomes an ordinary cache rather
than a precedence system; nothing for the tracer to find; unbounded growth.

*Costs:* every historical read becomes a network call, so the loader needs a
cache tier it does not have today. Supabase Storage is currently **over its
egress quota** (see the media-library fixes of 2026-09-01), so it is not the
candidate to reach for first. Vercel Blob bills separately from the Supabase
account.

**A data table.** `DataRelease` already holds published payloads as `Json`. The
archive could become rows in the same table, which unifies the two sources into
one and deletes the precedence rule outright.

*Costs:* Postgres egress, which is the meter that just went over. `lib/data/releases.server.ts`
caches for 60 seconds while `/api/data/*` is `no-store`, so nothing absorbs
repeat reads today — that would have to be fixed first or this makes the bill
worse.

## Recommended sequence

1. **Fix the release cache first.** Raise `RELEASE_CACHE_SECONDS` (tag
   invalidation already handles correctness; the 60 s is only a backstop) and
   stop sending `no-store` on ungated feeds. Do this whichever option follows —
   it is a prerequisite for two of them and a straight win for the third.

2. **Compress in place.** Independent of the destination, reversible, ~84%.
   One loader change, one migration script, no architectural commitment.

3. **Then choose a destination**, with the meter behaviour from step 1 known
   rather than assumed. The archive is append-mostly and read-rarely beyond the
   recent window — which argues for object storage with a CDN in front, not a
   database.

4. **Keep the last ~90 days in the repo** whatever else happens. That is what
   the public 7-day window and the 45-day Petrobangla window actually serve, it
   is a few megabytes, and it keeps the fast path fast and local.

5. **Only then retire the precedence rule.** Not before: it is the thing
   holding the two sources together, and it should be removed when there is one
   source, not in anticipation of it.

## What is deliberately not decided here

The destination. That is a cost and vendor question, and the account that would
host it was over quota the week this was written. The sequencing above is
correct under any of the three.
