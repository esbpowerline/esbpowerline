---
name: grid-explorer-audit
description: Read-only inventory of the ESB PowerLine codebase and database — what data actually exists, what the UI actually renders, what every route costs in egress, and what content is currently on the site. Produces GRID_EXPLORER_AUDIT.md and CONTENT_INVENTORY.md and changes no code. Use this skill whenever the user asks to audit, inventory, survey, map out, take stock of, or "see what we actually have" in Grid Explorer or esbpowerline.com — and ALWAYS run it before any redesign, refactor, or UI overhaul of Grid Explorer, even if the user asks to go straight to redesigning. The redesign skill depends on its output and will refuse to run without it.
---

# Grid Explorer Audit

This skill answers one question: **what can this site actually show today?**

It exists because design proposals for Grid Explorer routinely describe features that need data
the project does not have — entity pages for substations, transmission topology graphs, live
system frequency, plant-by-plant comparison. Those are data-acquisition projects wearing UI
costumes. The only way to tell the difference is to go and look.

This skill looks. It does not fix, refactor, or improve anything. Resist that urge completely —
a single "while I was in there" edit turns a trustworthy inventory into an unreviewed change set.

## Ground rules

**Read-only.** No file edits, no migrations, no schema changes, no dependency installs, no
formatting. If something is broken, write it in the report; do not repair it.

**No guessing.** Every claim in the report cites a file path with line numbers, a table name, or
a query result. If something cannot be determined, the report says "unknown" and says why. A
confident wrong inventory is worse than an honest gap, because the redesign gets built on it.

**Read-only DB access.** Use `SELECT`, `count(*)`, `information_schema`, `EXPLAIN`. Never
`INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, or `CREATE`.

**Sample, don't scan.** The archive is thousands of days across many series. Use `LIMIT`,
aggregates, and date-bucketed counts. Do not `SELECT *` a large table. If the database is
unreachable (quota restriction, missing env vars, 402 responses), say so plainly at the top of
the report and complete every other section from the code — a code-only audit is still valuable,
and a half-finished one that stops at the first error is not.

## Context you can assume

Correct any of this against what you actually find; it is a starting point, not a fact base.

- Next.js site at esbpowerline.com, deployed on Vercel, backed by Supabase Postgres.
- Grid Explorer lives at `/grid-explorer`, with a commodities ticker showing Avg/Gas/Coal/HFO/
  Import/Solar generation cost in Tk/kWh plus peak demand, gas production, USD/BDT, bulk tariff
  and fuel prices.
- Data comes from daily operational reports published by PGCB, Petrobangla and BPDB, ingested
  manually. The PGCB daily workbook has sheets: Forecast, Genlog, P1–P4, EWIC, Voltage, En Curve,
  L Curve.
- There is a tier-locked paywall enforced in middleware, with feed path matching in a file such
  as `feed-paths.ts`. A path-prefix bypass was fixed there recently. Treat this code as
  load-bearing and fragile.
- The project has an egress problem: it exceeded Supabase's 5 GB free monthly allowance while
  serving mostly text, with cached egress under 0.6 GB. Understanding why is a first-class goal
  of this audit, not a footnote.

## Procedure

Work through these in order. Take notes as you go rather than holding it all in context, and
write each section of the report as you finish the corresponding step.

### 1. Orient

Find the repo root. Read `package.json`, the Next.js config, `middleware.ts`, and the directory
tree of `app/` or `pages/`, `components/`, `lib/`. Identify the router (app vs pages), the data
client setup, and any caching or revalidation config already present.

Record the Next.js and React versions, and whether the Supabase client is instantiated for the
browser, the server, or both — and where each is used.

### 2. Data inventory — the core of this audit

Enumerate every table and view: name, columns with types, row count, and for anything with a
date column, the min date, max date, and count of distinct dates.

For each time series, determine:
- **Coverage** — which dates are present, and where the gaps are. Bucket by month so gaps are
  visible without dumping every row.
- **Granularity** — daily totals, hourly, per-plant, per-unit, per-region, system-wide only?
  This single answer determines what the redesign can and cannot build.
- **Provenance columns** — is there a source file reference, parser version, ingest timestamp,
  validation state, or revision history attached to rows? Name the exact columns. If provenance
  exists only in a separate audit or log table, say where.

Then answer these explicitly, because the entire redesign scope hinges on them:

- Is there **any** plant-level data? Named facilities, capacities, fuel types, commissioning
  dates, owners?
- Is there **any** geographic data? Coordinates, districts, divisions, regions?
- Is there **any** topology? Substations, transmission lines, voltage levels, what connects to
  what?
- Is there **any** entity-to-article linkage? Tags, foreign keys, or joins between news content
  and data entities?
- Is anything **derived or computed** rather than source-reported, and is that distinction
  recorded anywhere?

For each of the five, the answer is "yes, in table X, N rows, columns …" or "no". Not "partially"
without saying exactly which part.

### 3. What the UI actually renders

Walk `/grid-explorer` and every component it pulls in. For each visible element — every chart,
every ticker field, every stat readout, every table — record:

- the component file and line range
- which query or API route feeds it
- which database column the number ultimately comes from
- whether it is presented with an as-of date or source attribution, or presented bare

Flag anything displayed in a way that implies it is live or real-time when the underlying ingest
is daily and manual. This is a credibility risk, not a cosmetic one, and it belongs in the report
prominently.

Also record anything hardcoded, mocked, stubbed, or seeded — placeholder values that look like
data. List every instance with its file path.

### 4. Route and payload inventory — the egress picture

For every API route and every server-side data fetch: what it queries, whether it selects
specific columns or `*`, whether it bounds by date or pages, its approximate response size, and
its cache configuration (`revalidate`, `Cache-Control`, `force-dynamic`, `no-store`).

Then classify every data fetch in the app as one of:
- **client-side** — runs in the browser, hits Supabase directly, cannot be cached by Vercel
- **server-side, uncached** — runs per request
- **server-side, cached** — has a revalidate window or cache header
- **static** — built ahead of time

Rank routes by estimated monthly egress contribution: response size × plausible request volume.
Name the top offenders. This section is the single most actionable output of the audit, so give
it real effort rather than a list of file names.

### 5. Content inventory — nothing gets lost

The redesign that follows is allowed to restyle, reorganize, and rewrite presentation, but it is
not allowed to silently drop content. That guarantee is only enforceable if the content is
written down first.

Produce a complete list of every piece of user-visible text and every displayed data field in
Grid Explorer and its supporting pages:

- every label, heading, legend entry, axis title, tooltip, empty state, error message, button,
  link text, disclaimer, footnote and unit string
- every metric and field currently rendered anywhere
- every filter, toggle, dropdown option and control
- every page, tab, and route within Grid Explorer

Give each entry a stable identifier, its exact current text, and its source file and line. This
becomes `CONTENT_INVENTORY.md`, and the redesign skill checks its work against it.

### 6. Structural and integrity notes

Briefly, without fixing anything:

- Auth and paywall: where tier gating is enforced, which paths are protected, how the tier is
  determined. Note fragility; do not touch it.
- Env var usage, particularly any Supabase key naming inconsistency (`ANON_KEY` vs
  `PUBLISHABLE_KEY`) that could produce a production failure.
- Ingest path: how a daily report becomes rows. Which scripts, what runs them, what validates.
- Known data integrity issues already tracked (gap lists, outlier triage, repaired days).
- Mobile and responsive handling of Grid Explorer specifically.
- Anything that looks like dead code or an abandoned approach — noted, not deleted.

## Output

Write two files at the repo root.

**`GRID_EXPLORER_AUDIT.md`** — use exactly this structure:

```markdown
# Grid Explorer Audit — <date>

## Verdict in one page
<What the data supports building today, what it does not, and the three things that would
unlock the most. Written for a decision-maker, not a compiler.>

## 1. Data inventory
### Tables and coverage
### Granularity
### Provenance metadata
### The five questions
<plant-level / geographic / topology / news linkage / derived-vs-reported — each answered
yes-with-specifics or no>

## 2. What the UI renders today
<element → component → query → column, with as-of and source status>

## 3. Routes, payloads and caching
### Fetch classification
### Estimated egress ranking
### Top offenders

## 4. Buildable vs blocked
### Buildable now
<features the existing data fully supports>
### Buildable with modest work
<what is missing, and how much>
### Blocked pending data acquisition
<features that need a dataset the project does not have — with what that dataset would be
and where it would have to come from>

## 5. Risks and fragile areas
<paywall, env vars, ingest, integrity, anything implying live data>

## 6. Open questions for the user
<things only they can answer>
```

**`CONTENT_INVENTORY.md`** — the step 5 list, as a table: `id | current text | type | file:line`.

## Finishing

Report to the user in chat with: the verdict paragraph, the answers to the five questions, the
top three egress offenders, and the open questions. Keep it short — the detail is in the file.

Do not propose a redesign, do not offer to start implementing, and do not begin fixing what you
found. The next step is the user reading the report and deciding. If they ask you to proceed
immediately, point them at the redesign skill and let that skill's own gates apply.
