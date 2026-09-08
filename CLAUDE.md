@AGENTS.md

# ESB PowerLine

Bangladesh energy & power sector news portal, CMS, admin console, and a Grid Explorer
built over a ~4,500-day archive of PGCB / Petrobangla / SREDA data.

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 + Supabase Postgres ·
Tailwind 3 + shadcn/ui · Vitest · Python 3.14 for every parser.

`AUDIT-INVENTORY.md` is a file:line inventory of routes, env vars and data flow. Read it
before a survey question — it is almost always faster than grepping.

`docs/REMOTE-ACCESS.md` is how to reach the Pi, Vercel and Supabase from a machine that
has never seen this project. It holds **no secrets on purpose** — every credential is
either a browser sign-in or comes down with `vercel env pull .env.local`, so nothing has
to be copied between machines. The Pi is reachable off-LAN over Tailscale as `esb-pi`;
no port is forwarded and nothing of the Pi's is public.

---

## Branch

Work happens on **`authenticating`**, not `main`. The name is historical; it stopped being
an auth branch long ago and now carries the grid/ingest/CMS work.

**As of 2026-09-05 `main` == `authenticating` (`a9f33ef5`)** — the two are level and every
merge so far has been a clean fast-forward. Keep it that way: `git push origin
authenticating:main` is the whole release, and it needs no branch switch. Do **not** reach
for `git checkout main` followed by `reset --hard`; if the checkout aborts on a dirty tree
the reset lands on the branch you are standing on and throws away the work. That happened
on 2026-09-05 and only the prior `git push` made it recoverable.

`vercel.json` sets `git.deploymentEnabled.authenticating = false` — **pushing this branch
deploys nothing.** That is deliberate. Production ships from `main`, and pushing `main`
**does** trigger a Vercel production build automatically (git integration is live; only the
`authenticating` branch is opted out). No CLI upload is needed.

---

## Open work — left standing 2026-09-04 night

Delete an item when it is done; this section is a handover, not a changelog.

**1. Released 2026-09-08** (`eca705a4`). 24 commits fast-forwarded to `main`: the
System Snapshot rebuilt around NLDC's hourly pages and PGCB's forecast board, the
homepage hero and category-rail motion, the forecast-board capture and its stored
fallback, and the two Petrobangla slot fixes. Production verified serving all twelve
tiles, the board, and the per-interconnector import breakdown.

**Both of that release's build failures are now fixed in code, not worked around.**

*The pooler.* This was the second build killed by it, and the previous entry here said
what to do if it recurred, so it was done: `readSettingsMap` fails soft to
`HOMEPAGE_DEFAULTS` now. Static prerender runs 374 pages over three workers against a
session pooler shared with the live site and the Pi's hourly capture, and it runs out;
every `[releases]` read logged the same timeout and degraded as designed, while
`/about` — which has a full set of defaults available — took the whole build down. The
catch sits **outside** `unstable_cache` deliberately: an empty map returned from inside
would be stored under the settings key for the day-long window and pin the site to its
defaults long after the database recovered. Do not answer this with a bigger pool; that
ceiling is shared with readers.

*The migration.* Migration 0022 was applied by hand through `scratch/db-apply.ts`
before the release, so the build's `prisma migrate deploy` found it unrecorded, re-ran
it, and died on its one non-idempotent statement — leaving a row with `finished_at`
NULL, which blocks **every** later deploy until someone resolves it. The row is
resolved and the constraint is guarded, but the lesson is upstream of both: this repo
applies DDL on deploy (`build:vercel` runs `scripts/migrate-deploy-prod.mjs`), so
`db-apply.ts` is for reading a change into the database ahead of a deploy that cannot
wait — never for the migration the next deploy is about to run itself. Note also that
`migrate-deploy-prod.mjs` pipes Prisma's output and prints none of it, so a migration
failure shows up as a bare `exited with 1`; the cause has to be read out of
`_prisma_migrations`.

**2. The hourly NLDC ingest wrote nothing for a day, and said it succeeded.**
Found 2026-09-06 night. Every tick that day logged `generation: 0 pages, 0 rows,
0 documents already held, 2 failed` on both series, 132 `Unknown argument
"sourceUrl"` errors from `prisma.sourceDocument.create()` — **and exited 0**, so
`pi-notify.sh` never fired. The cause was a stale generated Prisma client on the
Pi: `prisma/schema.prisma` carries `sourceUrl`, the client under
`~/esb-ingest/deps/node_modules/.prisma/client` did not. Regenerating fixed it —
the 00:17 tick on 2026-09-07 wrote 51 generation rows and 102 demand/supply rows,
0 failed.

**Both follow-ups are now closed.** `pi-hourly.sh` no longer trusts the exit
code: it sums the `N failed` field across both series and treats any failure as
a failed tick, feeding the existing consecutive-failure counter. The
discriminator is deliberately `failed`, not `rows` — a quiet tick writes zero
rows on purpose, because `--recent` stops at an unchanged page 1, and that is
what makes this job cheap enough to run hourly forever. Checked against all
three real cases: the healthy 00:17 tick and a quiet tick stay silent, the
2026-09-06 output alerts. And the lost hours came back on their own — `--report`
now shows **0 days absent** across all 138 days of the demand series, with the
largest remaining gap one hour.

**That related trap is now closed too.** `pi-ingest.sh` copied helper scripts down
and installed cron lines, but nothing re-ran `prisma generate` when the schema
changed — so a migration that added a column would silently break every script on
the Pi the same way. The poll now hashes `prisma/schema.prisma` after the reset and
regenerates when the hash moves, keyed on the hash rather than a timestamp so an
ordinary poll skips it (generate is ~40 s on that hardware). A failure there is
fatal and alerts: continuing against a stale client is exactly the silent case
above. First exercised by migration 0021 on 2026-09-07.

**3. The outage backfill is built, dry-run, and not applied.**

```bash
python scripts/repair_outage_cause.py            # dry run, prints the report
python scripts/repair_outage_cause.py --apply    # 1,233 files
```

4,549 days / 119,642 rows → **1,748 reasons** and **19,316 plants** corrected across **1,233
days**. Blocked on 2026-09-04 by the permission classifier — a mass rewrite of the published
archive is exactly what that guard is for, so it wants a human. The tool is idempotent (a
second run reports nothing) and its writer reproduces the archive's serialisation byte for
byte, asserted per file. Afterwards: republish the ~90 days holding `DataRelease` rows
(`scripts/publish-local.ts`); older days ride the static archive and need the deploy in item 1.

**4. 41,034 outage rows cannot be repaired from disk.** Pre-2025 the parser stored no
`full_desc`, so there is no evidence to re-derive the cause from — 100% coverage in 2025-26,
66% in 2023-24, 9.5% in 2017. Their causes are probably wrong in the same way. Fixing them
means reparsing the source workbooks (`reingest_from_archive.py`), which is a different and
much larger job. Do not guess at them; that would be inventing text.

**5. The commodities strip is three hand-typed yearly rows.** `live-ticker.server.ts` carries
Bulk Electricity (BERC), Diesel and Octane (BPC), read from `lib/data/macro/economics.ts` —
one row per year, hand-maintained, no official document cited. Hamim asked for the real list of
energy commodities the government imports or administers, each with its gazetted price, issuer,
instrument and effective date. The research was started and lost to session limits; nothing
usable survives. Note BPC moved to a **monthly automatic pricing formula in 2024** and BERC
reprices LPG monthly, so a yearly table cannot be right by construction. Do not answer this
from memory — the strip's own header says it carries gazetted prices and nothing else.

**6. The audit and security sweeps are partial.** `GRID_EXPLORER_AUDIT.md` and
`CONTENT_INVENTORY.md` are from 2026-09-03 and predate everything since. Of the security pass,
the gating surface was checked directly (path-prefix bypass closed, `%`-encoding closed,
`TIER_GATED_DAILY_DIRS` complete, every dated feed 403s on a locked day) — server actions, API
routes, injection and secrets were **not**. Run those serially in small batches; four parallel
fan-outs died on session limits with zero agents completing.

---

## Commands

```bash
npm run dev            # single instance, port 3000, distDir .next
npm run dev:all        # three instances: public :3000, cms :3001, admin :3002
npm run dev:clean      # nuke .next .next-public .next-cms .next-admin

npm test               # vitest run — full suite
npm run test:qa        # the auth/role/security subset
npm run lint

npm run build          # prisma generate && next build (surface = all)
npm run db:migrate     # prisma migrate dev
npm run db:studio

npm run verify:data    # self-consistency sweep over the published archive
npm run verify:source  # source fidelity: refetch, reparse, diff
npm run verify:reserves
npm run build:forecast # python scripts/build_forward_forecast.py
```

Single test: `npx vitest run lib/test/<name>.test.ts` — `npx vitest` and `npx tsx` are
already allowlisted in `.claude/settings.local.json`.

---

## The data doctrine

This is the part of the codebase that matters most, and the part that is easiest to break
by writing reasonable-looking code. The site reproduces figures published by national
bodies. Its credibility rests entirely on never printing a number those bodies did not
state. Every rule below was written after a specific defect shipped; the incident is
recorded next to the code, and those comments are load-bearing — read them before editing,
and preserve them.

### 1. `null` is not zero. This is the whole charter.

A figure the source did not publish is `null`, forever, everywhere — in the parser, in the
JSON, in the comparison engine, on the tile. Never `0`, never a default, never an estimate,
never carried forward, never interpolated.

Zero is a claim: it says the measurement happened and came out zero. `null` says nobody
filed it. A homepage tile reading `0 MW` for Energy Unserved asserts that no load was shed
that day. A comparison that turns "PGCB printed nothing" into `-100%` manufactures a
headline out of a gap in a report. `lib/data/grid/comparison.ts` states the rule for the
comparison engine; `validate-daily-report.ts` encodes it in the schema — nearly every field
in `systemStats` is `.nullable()` on purpose, so a layout that omits a figure reports null
rather than an estimate dressed as a measurement.

### 2. Absent is absent — never substitute a neighbouring quantity.

The sharpest incident in the repo. The Gas Supply tile fell back to
`totalGasSuppliedPower` when Petrobangla had not filed the window yet. That is a different
quantity: the power sector's slice, about a third of national production. The tile read
2,366 MMcfd on 26 Aug and 856 on the 28th — a 64% "collapse" that was purely a change of
source under one unchanged label.

If the exact quantity is unavailable, print a dash. Do not reach for the nearest number
that happens to share its unit.

### 3. Hold the layout; name who owes the number.

Dropping an absent tile was the earlier stance, and it was right about the figure and wrong
about the grid: the snapshot is a fixed 2×6, so losing a tile reflowed the other eleven and
the panel silently changed shape on the newest day — every day, until Petrobangla filed.
`HomeSnapshotStat.awaiting` names the upstream instead: the tile stays, prints a dash, and
says who it is waiting on. The Grid Explorer's Gas Supply KPI takes the same stance.

Empty Grid Explorer tabs follow the same principle (`tab-availability.ts`): say what the
*source* does or does not publish for that era. Never "no data" — a reader hears that as a
measurement of zero, which is a much stronger claim than "this era's workbook has no such
sheet".

### 4. Report the source's inconsistency; never silently repair it.

PGCB breaks `demand = generation + shedding` constantly. Petrobangla's printed grand total
routinely disagrees with the field rows above it. **Publish it as filed and report the
discrepancy.** Silently correcting upstream figures makes the archive unfalsifiable and
destroys the thing that makes it worth having. This is exactly what the `verify:data`
severities encode:

| | |
|---|---|
| `ERROR` | The archive asserts something no source said. **We** corrupted it. Fix. |
| `WARN` | The source disagrees with itself. Report, never repair. |
| `INFO` | A known-incomplete day — e.g. grid published before its gas window. |

### 5. Every day names its source document, and names the right one.

`sourceFiles` is not decoration. A day carrying real gas figures with no
`sourceFiles.petrobangla` is an ERROR. So is a day citing a document whose window belongs to
a different day — presence-only checking cannot see that, so citations are reconciled by the
date they carry (`provenance-agreement`, `citation-offset`).

Days that legitimately have no source live in
`public/data/grid-verification/no-source-days.json`. Adding a day there is a published
declaration, not a way to silence a check.

**And the document says which day it is — never the filename, and never the caller.**
Learned the hard way on 2026-09-07. `parse_petrobangla_archive.py` derived every date it
wrote — `report_date_label`, `_start`, `_end`, `month_label`, even the summary prose —
from the energy day the caller passed in, and never read the PDF's own `Date : DD-DD`
header. So whatever day you asked for became the window the report claimed to cover, and
the claim was internally consistent: `verify:data` reconciles citations against the date
our own JSON carries, so it agreed with itself and could not see the error. It took
refetching the source and reading it independently to find it.

The trigger was Petrobangla skipping its 06.09.26 slot. The report served under 07.09.26
states `Date : 05-06`, so it is the 05→06 Sep window — energy day 2026-09-05 — and the
listing-key-minus-one rule filed it as 2026-09-06 under a fabricated "06-07 Sep, 2026"
label. Both layers now read the document: `document_window()` is the single reader, the
parser keys `report_date_start` off it, `deploy_petrobangla()` keys the file (and so the
index entry and the citation) off that, and `download_petrobangla()` will accept a
document from a neighbouring slot **only** when its own header states the window asked
for. A listing slot is a hint about where to look; it is never a claim about what is
inside.

### 6. Do not grade the forecast.

Forecast-vs-actual is a **signed difference and nothing more**. No scoring, no accuracy
percentage, no grading — PGCB forecasts a system it does not fully control. Both the archive
card and the live `forward-forecast.ts` take this position, and they must agree.

Related: only hours belonging to the forecast's own target day may be matched. The live
window is "the last 24 posted rows", which routinely spans two calendar days; folding
yesterday's 22:00 into today's curve invents a comparison PGCB never made.

### 7. A "day" means something different to every publisher.

This is the root of essentially every alignment complaint, and `observation-window.ts` is
the single place it is resolved. Read that file's header before touching anything that puts
two figures side by side.

| Publisher | What a "day" is | Filing quirk |
|---|---|---|
| PGCB | Energy day D, 00:00→24:00 | Workbook **filed as D+1** |
| Petrobangla | Gas day, 08:00 on D → 08:00 on D+1 | PDF **named for D+1**; the file name is a filing convention, not a claim about the measurement |
| SREDA | A standing register — a stock as of a date, not an interval | — |

**The anchor rule (L1): a record anchors to the calendar day containing its START
instant.** So energy day D shows the gas window opening at 08:00 on D. Not arbitrary — it is
what the archive has always done (verified against stored figures back to 2020), and it is
the only electrically honest choice: the evening peak, 18:00–21:00, falls *inside* the
08:00→08:00 window. Anchoring on the window's end would pair day D's peak with gas that
stopped being measured ten hours before it.

**Alignment class (L2):** knowing the interval is not enough to compare. A peak measured at
an instant and a rate averaged over 24 hours are different kinds of quantity, and the KPI
strip has headlined them in one row before — readers subtracted them. Use `comparable()`;
do not eyeball it.

All instants are BST, UTC+06:00, no DST, applied uniformly.

---

## Verification — two layers, and neither substitutes for the other

**`npm run verify:data`** — self-consistency across the whole archive. It checks identities
that must hold: zone demand against the national evening peak (2% tolerance absorbs PGCB's
own rounding across nine printed zones), hourly `demand = generation + shedding`, gas
byte-identical to the previous day (carry-forward — a failed fetch published as a reading),
how a day says "no gas", provenance, citation agreement, grid gas against the archive window
it came from, and the document against itself.

Every real defect so far was caught by checking a figure against something else that should
agree with it — never by trusting the parser that produced it. It is deliberately not a test
suite: most findings are the source's own inconsistencies and must stay published.

**`npm run verify:source`** — fidelity. Refetch the document from the publisher, reparse it
with the same parser, diff against what was committed. This exists because `verify:data`
structurally cannot catch a parser misreading a column: both sides would be wrong and agree
perfectly. Two things keep it non-circular — the gas PDF is hashed (`content_sha256`, so the
bytes parsed are the bytes being served today), and the diff is over values rather than
summaries, so a column shift surfaces as a changed number instead of a plausible total.

Verdicts, worst first: `INDICATOR` (a *published* figure disagrees with the source — fix
now) · `HASH` · `DRIFT` (unpublished values — triage) · `SHAPE` · `MATCH` · `UNFETCHED`.

`verification/source-ledger.json` is audit evidence. **Commit it.** A day verified in August
is a day you need not refetch in December, and the publisher may not still be serving that
document by then.

When a check "passes", confirm it actually ran. `gas-vs-archive` read two keys that exist in
none of the 2,295 archive files, and passed 4,529 days by never looking at them.

### The live layer has neither check, and a captured fixture is not a check

Both sweeps above cover the **archive**. Nothing verifies `live-grid.server.ts` against NLDC,
and a fixture in `lib/test/fixtures/` only ever proves the parser handled the day it was
captured.

NLDC made the demand/supply page's time cell responsive between 2026-08-23 and 2026-09-04 —
the hour is printed once per breakpoint, so `stripTags` flattens it to `"13:00:00 13:00"` and
`toIsoLocal`'s anchored regex dropped **every** demand row. The generation page was untouched,
so the failure was silent and one-sided: the homepage said "Current Demand — awaiting NLDC"
while that page was publishing 13,847 MW for the hour it was rendering. The suite stayed green
the whole time, on a fixture captured before the change. Same parser, same code: 51 rows from
the fixture, 0 from the live page.

Two rules follow. **Refresh a fixture when the publisher moves, and keep the old one** — both
layouts are pinned in `live-grid-parse.test.ts` now, because a parser that stops handling the
2026-08 markup is also a regression. And **when a parse yields nothing, that is the finding** —
do not let a fallback quietly answer for it. `buildLiveGridSnapshot` used to fall back to the
generation table, so peak demand and peak supply both became the generation total and load shed
became `Math.max(0, ...[])`. For 2026-09-04 that published 13,864 / 13,864 / **0** where NLDC
had 15,583 / 13,815 / 2,222 — a zero asserting no load was shed on a day with 2.2 GW of it.
Those five fields are nullable now and reach across to nothing.

---

## Ingestion

Python parsers own every number on the site. They carry years of source-quirk knowledge —
**reuse them, never reimplement.**

- `scripts/daily_data_extractor.py` — the daily chain (download → parse → write → verify).
  See `scripts/daily_extractor/EXTRACTOR.md`.
- `scripts/ingest_bridge.py` — what the admin panel shells out to. Parses and returns the
  payload on stdout and **writes nothing to `public/data`**, so a bad parse never lands on
  disk or on the site. The caller decides whether to publish.
- Downloads are signature-checked (`%PDF`, `PK`) — publisher sites serve HTML redirect pages
  under a `.pdf` URL, and a parser fed HTML produces confident nonsense.
- A step that wrote nothing must **fail**, not report success.
- `/api/cron/ingest` is **disabled on Vercel** (returns 503); the Python chain exceeds
  serverless compute limits. Only `/api/cron/publish-scheduled` runs on Vercel, every
  15 min.

### The Pi runs ingest, and nothing else

It used to also serve the magazine's artwork — nginx on `:8090` over `/srv/magazine`,
reachable only through Tailscale. That meant every page image, the cover and the
PDF 404'd for anyone off the tailnet, and on 2026-09-06 Tailscale dropped and the
magazine page rendered 97 broken images with no indication anything was wrong.
The artwork now lives in a **private Supabase Storage bucket**, signed per render
(`lib/magazine-assets.ts`, uploaded by `scripts/upload-magazine-assets.mjs`).

**Nothing a reader loads should ever come off the Pi.** It is on a home
connection behind NAT with no port forwarded; it is an ingest worker, not an
origin. The `:8090` vhost can be retired.

### The scheduled poll runs on the Raspberry Pi

`scripts/pi-ingest.sh`, from cron at 09:30 / 12:30 / 16:30 / 21:30 Dhaka, over the
trailing three energy days (`scripts/ingest_recent_days.py`). It publishes DataRelease
rows and pushes `public/data` to `authenticating`; **nothing redeploys** — releases carry
the day to the live site. No cost on any plan.

The runner assumes it is broken until shown otherwise: a lock so polls never overlap, a
25-minute timeout, a disk guard (Jellyfin on the same card refuses to start under 2 GiB),
a clock guard, and at the start of every poll it fetches the day it published last time
from the live site and compares every value. Two more jobs share the lock:
`scripts/pi-nightly.sh` (02:30 — `verify:data`, `verify:source` over the trailing week
with the ledger committed, gzipped `pg_dump` kept 14 deep) and `scripts/pi-weekly.sh`
(Sunday 03:30 — SREDA register, media-bucket mirror). Every failure goes through
`scripts/pi-notify.sh`: always `~/esb-ingest/logs/alerts.log`, Telegram if
`~/esb-ingest/notify.env` holds a token. Power-cut behaviour is documented at the top of
`pi-ingest.sh`; the short version is that downloads are atomic, torn workbooks are
refetched, and the next poll finishes whatever the last one did not.

### Every hour: the NLDC capture

`scripts/pi-hourly.sh`, at :17 from cron, running
`ingest-nldc-hourly.ts --recent 2`. It writes rows to Postgres and **nothing
else** — no commit, no push, no deploy.

**Four NLDC pages since 2026-09-07**, not two: generation,
demand/supply/load-shed, and PGCB's two cross-border import pages
(`imported_power_india_bn`, `imported_power_nepal_bn`). The script defaults to
every series it knows, so the runner and its cron line were untouched.

**And PGCB's forecast board since 2026-09-08** (`show_forecasts_bn`, `--series
board`). Not a series — one page, one row, one day, in `GridForecastBoard`
(migration 0022) — but captured on this tick rather than by the daily polls
because the board is *replaced* each morning: four fixed slots would read a
board posted between them late and a board replaced between them never. Two
snapshot tiles read it (Forecast Demand, Y-day Peak Gen) and until this table
existed the site was reading a figure nobody keeps and storing none of it.
`live-grid.server.ts` falls back to the stored row when PGCB will not serve the
page, bounded to today or yesterday in Dhaka — exactly the set of boards PGCB
itself could be serving, since the new one goes up during the morning.

Two things about it are load-bearing. `boardDate`/`previousDate` are `@db.Date`
and go in as **UTC midnight**: handed a Dhaka-midnight instant, Postgres takes
the UTC date and files the day early, which is how the first capture stored the
08 board as the 07. The capture reads the row back and fails the tick if the
stored days disagree with the document's. And the board's stated previous-day
peak is cross-checked against our own hourly maximum — 15,473 MW on 2026-09-07,
exact — comparing the greater of its two peaks, since our aggregate is a day
maximum. Reported, never reconciled.

The import pages were added for one figure. Every *actual* on them already
appears on the generation table — checked column by column over 102 hours on
2026-09-07, zero disagreements, and that comparison is now a test rather than an
assumption. What appears nowhere else is NLDC's hourly **forecast**
(পূর্বাভাস) per interconnector, printed beside the actual: Bheramara HVDC,
Tripura and Adani separately on the India page, Nepal on its own. Doctrine rule
6 governs the pair — the signed difference and nothing more, no scoring, because
PGCB does not control the far side of the border. The actuals are stored anyway,
as an independent check of a figure the site prints.

Depth measured 2026-09-07: India goes back to **2015-04-17** (2,036 pages, the
same depth as generation); Nepal to **2024-11-14** over 325 pages, which is when
the Bangladesh-Nepal trade began rather than a retention cliff. Only the recent
window is captured so far — a full India backfill would add a decade of hourly
forecasts and has not been run.

This is the most perishable stream in the archive: NLDC's demand/supply/load-shed
page rolls off after ~145 days and nobody else in Bangladesh keeps it, so an hour
missed inside that window is gone. It was listed "IMPLEMENTED 2026-09-05" and was
in fact **dead from the moment it was written** — nothing referenced the script,
and its documented invocation could not run because it imported `@/lib/prisma`,
which opens with `server-only` and throws outside an RSC. Found 2026-09-06 with
26 hours missing; the import now uses `createScriptPrismaClient` like every other
script in `scripts/`, and the gap was refilled from NLDC's own retention window.

Three things keep it cheap enough to run 24×/day forever. `--recent` **stops at an
unchanged page 1** — NLDC's first page turns over once an hour, identical bytes are
the same `SourceDocument`, so a quiet tick is one request per series and zero
writes. The poll skips `--report` (five aggregate scans per series). And
`NODE_ENV=production` caps the pg pool at 2 rather than 10
(`lib/prisma-database.ts:67`) — the session pooler is shared with the live site and
has been exhausted twice in one day, once killing a production build on `/about`.

`:17` is chosen against the timetable: the polls run at `:30`, the watcher at
`:07/:22/:37/:52`, and all of them take the same lock, so `:17` is the widest gap.
It takes that lock too — not for the database, where the writes are idempotent, but
because `pi-ingest.sh` does `git reset --hard` on the checkout and pulling the tree
out from under a running `tsx` is how one job corrupts another.

**The schedule is declared in the repo, not just on the Pi.** `pi-ingest.sh` has
always copied each helper down at the end of a poll, but nothing scheduled them —
which is precisely how `ingest-nldc-hourly.ts` could be listed IMPLEMENTED while
running zero times. The `SCHEDULE` table beside that copy loop now names every
runner's cron line, and a poll installs any the crontab lacks. So a new helper
reaches the Pi *and* gets called with no session on it at all, and a Pi reflashed
or restored from a card image reschedules itself on its first poll.

It is additive on purpose. A helper already named anywhere in the crontab is left
alone whatever schedule or redirection it carries — the original four lines were
typed by hand and the runner cannot see what else is on them. A schedule that
disagrees with the table is printed to the log and **not** corrected; fix it by
hand, or change the table. Retiming a runner therefore means editing both.

**The tier ceiling is announced, not discovered.** The script prints `db_size_mb=`
on the connection it already has open and the runner warns once a day past 400 MB.
Measured 2026-09-06: the database is **142 MB** of Supabase's 500 MB free tier —
`GridHourlyObservation` 72 MB, `SourceDocument` 30 MB — growing ~130 MB/year, almost
all of it evidence bytes. Roughly two and a half years of headroom. When it gets
close the answer is the object-storage move in `STRATEGIC_AUDIT_2026-09.md` §U or an
evidence retention window, not a bigger tier.

One failed tick is not an alert: the hour is still inside NLDC's window and the next
tick's two-page walk picks it up. Four consecutive failures are.

### Checking the Pi from anywhere

The Pi is on the tailnet as `esb-pi`, key expiry disabled, no port forwarded. If
the name will not resolve, it is this machine's Tailscale that is down, not the
Pi — `tailscale status` printing `unexpected state: NoState` means it is still
starting, and `tailscale up` finishes it. `docs/REMOTE-ACCESS.md` has the SSH
config; nothing below needs a password.

```bash
tailscale status | grep esb-pi              # is it on the tailnet at all
ssh pi@esb-pi 'crontab -l | grep -v "^#"'   # all five runners scheduled?
ssh pi@esb-pi 'tail -20 ~/esb-ingest/logs/alerts.log'
ssh pi@esb-pi 'timedatectl | grep -i synchron'   # a skewed clock refuses polls
```

**Read the counts, not the exit code.** This is the lesson of open-work item 2:
a poll can fail on every write and still exit 0, so the only honest health check
is whether rows landed.

```bash
# Today's hourly ticks. "0 pages, 0 rows" on both series is a FAILURE,
# whatever the exit line says.
ssh pi@esb-pi 'grep -E "pages,|exit [0-9]+" ~/esb-ingest/logs/hourly-$(date +%Y%m%d).log | tail'

# The four daily polls and the between-poll watcher.
ssh pi@esb-pi 'ls -t ~/esb-ingest/logs | head; tail -30 ~/esb-ingest/logs/watch-$(date +%Y%m%d).log'
```

A healthy hourly tick looks like `generation: 1 pages, 51 rows, ... 0 failed`.
`db_size_mb=` is printed on every hourly run and warned on daily past 400 MB.

### Between the polls: the watcher asks each publisher separately

Four slots a day is a timetable, and the lag it costs is the timetable's, not the
publishers'. PGCB filed energy day 2026-09-03 between the 09:30 and the 12:30 poll and
the site carried a stale newest day for three hours; Petrobangla filed the 2026-09-02
window just after 12:30 and it waited for 16:30. **Nothing was ever blocked** — the chain
has published gasless days since it was written (`run_daily_ingest.py` step 10 skips gas
explicitly and step 12 publishes anyway), and on 2026-09-04 the site served grid data for
the 3rd while its newest gas window was the 1st. It was waiting on a clock.

`scripts/pi-watch.sh`, at :07/:22/:37/:52 from 08:00 to 22:52 Dhaka, closes that. Offset off
`:30` on purpose — a tick firing on the same minute as a scheduled poll takes the lock
first, and the poll, which is the only thing that runs the trailing window, would find it
held and skip that slot. It runs
`scripts/watch_sources.py`, which puts **one question to each publisher about that
publisher's own documents** and names only energy days a publisher demonstrably has and
the archive demonstrably lacks — then hands those days to `pi-ingest.sh` through
`ESB_INGEST_DATES` → `ingest_recent_days.py --dates`. The poll runner is reused rather
than reimplemented, so the lock, the guards, the live check, the commit and the push have
exactly one copy.

Two properties matter more than the cadence:

- **Cost.** Petrobangla is one fetch of its listing, which names every report it serves.
  PGCB costs *nothing at all* while the newest energy day is already held; only a missing
  day makes it reach out, and then in order of cost — held workbook store, pgcb.gov.bd's
  own URL, then the ERP estimate ± 2. Not `probe_erp_for_energy`, which widens its slack
  with distance and pulls dozens of workbooks: right for a backfill, indefensible every
  quarter hour. Whatever it fetches while asking is filed, so the chain that follows reads
  it off disk. (`download.py`'s `PGCB_SOURCE_DIRS` honours `ESB_PGCB_ARCHIVE` for that
  reason — it did not, so on the Pi nothing was ever filed or found and every re-run went
  back to the ERP.)
- **The trailing window cannot reach a late gas filing.** `--days 3` is anchored on PGCB's
  cadence, so a window Petrobangla files four days late belongs to a day that left the
  window before the gas arrived. The watcher compares per source against the whole
  `LOOKBACK_GAS` span instead, and a day that fell out is still picked up.
- **A skipped Petrobangla slot must not hide a day that is published.** Fixed 2026-09-08,
  and it is the second half of the lesson below. Petrobangla files every slot one day
  behind its own label whenever it drops one: on 2026-09-08 slot 07.09.26 held the 04→05
  window and 08.09.26 held 05→06. `download.py` said "the exact slot first, then the days
  after it" and did "the exact slot **or** the days after it" — so asked for the 6th it
  found its exact slot present, fetched it, correctly rejected it on the header, and
  stopped one slot short of the document that stated the day. The search now always
  continues past a rejected slot, and stops early when a candidate states a *later*
  window, which keeps a genuinely unfiled day to one fetch. The watcher had the mirror
  fault — slot-minus-one — so it spent its four attempts on a 2026-09-07 no document
  states and never once asked for the 6th; it offers both K-1 and K-2 now and lets the
  document decide. Neither layer fetches a PDF to guess: a slot is a hint about where to
  look.
- **Gas does not wait on PGCB, in either layer.** Fixed 2026-09-07, after the site sat on
  a gas window Petrobangla was publicly serving. Two independent things held it:

  The watcher skipped any gas day whose grid half was missing, on the stated assumption
  that such a day was "already queued above". It was not — the PGCB pass only queues a day
  it can confirm PGCB has filed, so a day where **Petrobangla is early and PGCB is late**
  fell through both passes and emitted neither a finding nor a note. With `LOOKBACK_GAS` at
  14 and `LOOKBACK_GRID` at 4, gas for any day PGCB was more than four days late on could
  never be queued at all, silently. The guard now skips only days the PGCB pass actually
  queued.

  And the chain itself aborted on `Pipeline A requires PGCB daily report`, so even a queued
  day could not be taken. `daily_extractor` now falls through to a **gas-only run** when the
  workbook is absent and the PDF is not: it parses, validates and publishes Pipeline B
  through the same `deploy_petrobangla()` the full chain calls, and `run_daily_ingest.py`
  records the eight grid steps as skipped rather than failed — PGCB being late is the
  premise of the run, not a fault in it. The day reports `ok: true` **with a note**, which
  had never happened before; anything reading `ok` and ignoring `note` will call it a
  complete day, and it is not one. The grid half lands whenever PGCB files, from the
  trailing window, with the gas already on disk.

A day is emitted only once its publisher is confirmed to have it, so no run is spent on a
day that does not exist yet. If a confirmed-available day is fired at `MAX_ATTEMPTS` times
and still yields no artifact, it is backed off to the scheduled polls — otherwise a day
the parser refuses (the zero-gas triage backlog is full of them) would be retried sixty
times a day forever. Counters live in `$ESB_WATCH_STATE`, outside the repo, because every
poll `git reset --hard`s the tree.

The four cron slots stay. They are the backstop for anything the watcher missed, and the
only thing that runs the trailing window.

GitHub Actions was tried first and **removed** (2026-09-03): every dispatch on this
account ends in `startup_failure` — including a one-line `echo` workflow, so the block
is account-level, not the file — and each scheduled tick emailed Hamim a failure. The
workflow and its `DATABASE_URL` secret are deleted; do not re-add an Actions job
without checking the account block is lifted. The Pi is the better host anyway — it is
on a Bangladeshi connection, so PGCB's ERP and Petrobangla see a local visitor.

Off the Windows box every archive path is an env var: `ESB_PGCB_ARCHIVE`,
`ESB_DAILY_REPORTS_ROOT`, `ESB_SOURCE_INDEX`. The Pi holds ~365 MB of npm packages for
`publish-local.ts` alone, symlinked in as `node_modules` — a full install does not fit on
that card.

Two things that only appear when the same day is built on both machines, both fixed and
both worth knowing about: a parser that split a path on backslashes alone published an
absolute POSIX path as the gas document's *name*, and a writer that deliberately emits
CRLF rewrote a whole file with no figure changed. `.gitattributes` pins the published
archive to LF for that reason.

### Publishing

`public/data/**` is the archive shipped with the deploy; anything published since lives in
`DataRelease`. The precedence rule — **a release always wins over a static file of the same
key** — belongs in exactly one place, `lib/data/releases.server.ts`, and every server-side
reader goes through it. It fails soft to the static archive on a database error, mirroring
the fail-open choice in middleware.

**Publish every feed of a day, not just the headline one.** `GRID_DAILY` alone shows the
KPIs while the Energy Curve and Power Stations tabs 404 — those are `GRID_CURVE` and
`GRID_PLANTS`. The `DataFeed` enum in `prisma/schema.prisma` is the full file↔feed map.

Read the **runtime** date catalog (`getRuntimeLatestDate()`), never the build-time
`availableDates` import, on any path that must see a day published after the last deploy.
`lib/available-dates.json` is compiled into the bundle; a homepage reading it would sit on
the last shipped day forever.

Drafts carry a SHA-256 `checksum` so an unchanged reparse is detectable, plus a `validation`
blob the reviewer must see before approving. Revoking sets `revokedAt` and falls back to the
static archive rather than serving a known-bad day.

---

## Homepage

`app/(public)/page.tsx`, `revalidate = 180`. Most sections are deferred/dynamic; the
snapshot is server-rendered.

The **snapshot panel is a fixed 2×6 of twelve tiles** (`DAILY_SNAPSHOT_LABELS` in
`home-snapshot-core.ts`). That count is a layout contract, and rules 1–3 above exist
because of it. Adding, removing or reordering tiles means changing
`DAILY_SNAPSHOT_LABELS`, `SNAPSHOT_SLOTS` and the tests that pin both — not
special-casing a render.

**Ten of the twelve are hourly.** NLDC's two pages carry far more than the snapshot used
to read: generation total, gas, liquid fuel, coal, hydro, solar, wind and four
interconnectors, plus demand, supply and load shed — all of it stored in
`GridHourlyObservation` since the capture was written, and for years only five tiles read
any of it. `liveValueFor` in `HomeSnapshotPanel.tsx` now fills eight, and `LIVE_BACKED_LABELS`
is the list both sides must agree on; a label in one and not the other waits forever.

Two tiles stay daily on purpose. `Daily Generation` and `Energy Unserved` are day
quantities — NLDC posts power, not energy, and the live snapshot's `hours` field is the
last 24 *posted* rows rather than 24 hours, so averaging it and calling the result daily
is what that field's comment forbids. `Gas Supply` (Petrobangla's 08:00→08:00 window) and
`Production Cost` are the cadence their publishers file at.

**`Gas Generation` and `Gas Supply` now sit adjacent, and they are different quantities** —
gas burned for power against national production, roughly a third against the whole. That
substitution is the sharpest incident in this repo (2,366 → 856 MMcfd under one unchanged
label). A test pins them apart; keep it.

SREDA's `RE Installed` and `RE Grid Share` left the panel for `Solar + Wind`, NLDC's hourly
renewable output. The register answers "what is built", never "what is generating now".
`buildSredaSnapshotStats` is still exported and tested for the surfaces that want capacity.

`gwhToAvgMw()` is the only sanctioned GWh→MW conversion (daily energy over 24h). Do not
inline the arithmetic; a tile that mixes a 24-hour average with an instantaneous peak under
one unit is exactly the L2 mistake above.

---

## Grid Explorer

`components/news/PowerGridExplorer*.tsx` over `lib/data/grid/`. Ten tabs, one date picker,
the full archive.

- Per-day tab availability is derived from the day's **own payload**, not from a date range
  — so a day missing a sheet its era normally carries is reported missing rather than
  assumed present.
- Access is tiered in `middleware.ts`: recent days public (7-day PGCB window, 45-day
  Petrobangla window), older days gated by plan via `grid-tier-access.ts`. The public-window
  path deliberately skips Supabase and Postgres entirely — it is the hot path, do not add a
  round-trip to it.
- **Splitting data out of a payload must not unlock it, and a roster of names will not keep
  that promise.** It has gone stale three times: `plants` was caught, `curves` was not (1,979
  locked days served to anyone), then `forecast` was added and missed, then the Petrobangla
  aggregates — `reserve-model`, `reserve-sensitivity`, `reserves-published` answered 200 with
  no Referer while `timeline-summary` beside them answered 403. Both gates are default-closed
  now and both are tested against the real directory listing rather than a hand-written list
  (`TIER_GATED_DAILY_DIRS`, and any `.json` directly under `petrobangla/`). Register a new feed
  by putting the file where the pattern already covers it. `pgcb-monthly/**` is deliberately
  public — `build_pgcb_monthly_public.py` says so and a test asserts it.
- Exports (PDF/DOCX/CSV) are branded, datestamped and rate-limited, and inherit every rule
  above: an export must not print a figure the day did not publish.
- `archive-fallback.ts` is **auto-generated**. Do not hand-edit; the canonical source is
  `public/data/daily/{date}.json`.

---

## Conventions

- **Commits**: `type(scope): what changed, in plain English` — lowercase, imperative,
  describing behaviour rather than files. e.g. `fix(grid): stop the snapshot inventing
  figures`, `chore(data): ingest energy days 2026-08-24..28`. Scopes in use: `grid`, `gas`,
  `ingest`, `cms`, `admin`, `home`, `build`, `data`.
- **Comments explain why, and cite the incident that motivated the code**, with the actual
  figures and dates. `next.config.ts`, `middleware.ts`, `observation-window.ts` and
  `verify-data.mjs` are the house style. Match that density; never narrate the obvious.
- Imports use `@/`. Server-only modules import `server-only`.
- `AGENTS.md`'s `nextjs-agent-rules` block is regenerated by `next dev` — don't fight it,
  commit it with your work.

## Architecture notes

**The three "surfaces" are a dev-time split only.** `APP_SURFACE` picks a distDir (so three
dev servers don't corrupt each other's cache) and resolves cross-port URLs in dev. `npm run
build` leaves it unset, so **production is one unified build on one origin** containing all
of `(public)`, `(cms)` and `(admin)`; the workspaces are separated by hostname and role,
never by build. `AUDIT-INVENTORY.md` §0.1.

**Access control lives in `middleware.ts`**, not in the route groups. Roles and numeric
permission levels are in `lib/constants.ts`, path rules in `lib/auth-routing.ts`. A new
protected path needs an entry in `canAccessPath()` — putting a page under `app/(admin)/`
protects nothing on its own.

**Middleware fails open on purpose.** An Upstash outage used to 500 every route. A limiter
or session failure must degrade, never take the site down. Keep that shape.

## Gotchas

- Windows host. Prefer the npm scripts over hand-rolled shell.
- Next.js 16 + React 19 — check `node_modules/next/dist/docs/` before assuming an API.
- `npm run dev:all` needs `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` shared across the three
  instances; `scripts/ensure-server-action-key.mjs` writes it into `.env.local`.
- Never commit `.env*`. `AUTH_SECRET` in git makes session-handoff tokens forgeable.
- `public/data` is ~11,600 files / 413 MB. Never glob it blind — go through
  `lib/available-dates.json` or the feed index files.
