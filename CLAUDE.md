@AGENTS.md

# ESB PowerLine

Bangladesh energy & power sector news portal, CMS, admin console, and a Grid Explorer
built over a ~4,500-day archive of PGCB / Petrobangla / SREDA data.

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 + Supabase Postgres ·
Tailwind 3 + shadcn/ui · Vitest · Python 3.14 for every parser.

`AUDIT-INVENTORY.md` is a file:line inventory of routes, env vars and data flow. Read it
before a survey question — it is almost always faster than grepping.

---

## Branch

Work happens on **`authenticating`**, not `main`. The name is historical; it stopped being
an auth branch long ago and now carries the grid/ingest/CMS work, ~34 commits ahead.
`main` is stale.

`vercel.json` sets `git.deploymentEnabled.authenticating = false` — **pushing this branch
deploys nothing.** That is deliberate. Production ships from `main`.

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
  serverless compute limits. Ingestion runs locally. Only `/api/cron/publish-scheduled`
  runs on Vercel, every 15 min.

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
`home-snapshot-core.ts`) — ten PGCB/Petrobangla plus two SREDA. That count is a layout
contract, and rules 1–3 above exist because of it. Adding, removing or reordering tiles
means changing `DAILY_SNAPSHOT_LABELS` and its tests, not special-casing a render.

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
