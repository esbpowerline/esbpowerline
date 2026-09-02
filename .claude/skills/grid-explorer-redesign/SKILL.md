---
name: grid-explorer-redesign
description: Redesign the Grid Explorer UI on esbpowerline.com strictly from what the audit found — every element rebuilt from real data, nothing invented, no content silently removed, and every new data path cacheable. Requires GRID_EXPLORER_AUDIT.md and CONTENT_INVENTORY.md to exist first; if they do not, run the grid-explorer-audit skill instead. Use this skill whenever the user asks to redesign, overhaul, restyle, modernize, or improve the look, layout, UX or visual language of Grid Explorer or the ESB PowerLine site, including when they paste in a design brief or spec from elsewhere and ask to implement it.
---

# Grid Explorer Redesign

Rebuild the Grid Explorer interface into something a power-sector analyst takes seriously —
constrained at every point by what the data actually is.

The failure mode this skill exists to prevent: a beautiful interface full of placeholder nulls,
entity pages for entities that do not exist, and a live-looking status panel fed by a manual
daily ingest. That interface is worse than the current one, because it destroys credibility with
exactly the readers the site is built for.

## Gate: do not start without the audit

Check for `GRID_EXPLORER_AUDIT.md` and `CONTENT_INVENTORY.md` at the repo root.

If either is missing, stop and tell the user the audit needs to run first — then run the
`grid-explorer-audit` skill. Do not improvise a quick look around and proceed. The audit's value
is that it was done without a design already in mind; an inventory taken while itching to build
something finds whatever that something needs.

If both exist, read them fully before touching anything, and check their date. If the repo has
moved on substantially since, re-run the audit.

## The three hard constraints

### 1. No invented data

Every value rendered must trace to a real column identified in the audit.

No seed data. No sample rows. No mock objects. No `// TODO: wire up real data`. No plausible
placeholder numbers "to show the layout". No fabricated provenance — do not display a parser
version, validation state, or verification badge unless that field genuinely exists.

If a design idea needs data the audit marked as blocked, do not build a hollow version of it.
Write it into `REDESIGN_BACKLOG.md` under what data would unlock it. An empty state is honest;
a fake value is not.

### 2. No content loss

The audit produced `CONTENT_INVENTORY.md` precisely so this constraint is checkable.

Every entry in that inventory must still be reachable in the redesigned UI. Wording may change,
placement may change, several entries may merge where they genuinely said the same thing twice —
but nothing disappears because it was inconvenient to lay out.

What is allowed:
- rewording a label for clarity or consistency
- moving content to a different position, tab, panel or disclosure
- merging genuine duplicates into one canonical entry
- cutting redundant or repeated phrasing within an entry
- adding new labels, fields and controls

What is not allowed:
- dropping a metric, filter, control, or piece of text because the new layout has no room
- removing an explanatory note, unit, disclaimer or footnote as visual clutter
- quietly reducing what a chart or table shows

Maintain `CONTENT_MAPPING.md` as you work: `inventory id | old text | new text | new location |
kept / reworded / merged-into-X / added`. Every id from the inventory appears exactly once. This
file is the deliverable that proves nothing was lost, so write it as you go rather than
reconstructing it at the end.

### 3. Every data path must be cacheable

The site was cut off for exceeding its egress allowance while serving mostly text. A redesign
that adds richer views without fixing this simply hits the wall sooner.

For every data path you touch or create:
- prefer static generation or a daily-revalidated server fetch over a per-request query, because
  the underlying ingest is daily and the data does not change between ingests
- never fetch from Supabase in the browser for content that could be rendered server-side
- select named columns, never `*`
- bound every query by date range and paginate
- pre-aggregate to the resolution a chart actually renders rather than shipping raw series and
  thinning client-side

Record before/after payload sizes for anything you change, in `EGRESS_NOTES.md`. If a change
makes a payload larger, say so and justify it.

## Honest presentation

The ingest is manual and daily. The interface must never imply otherwise.

- Never label anything "live", "real-time", "now", or "current" unless it genuinely is.
- Every figure carries its as-of date and its source, e.g. `DATA AS OF 31 AUG 2026 · PGCB DAILY
  GENERATION REPORT`. Treat this as a feature, not a disclaimer — it is what separates this site
  from outlets that publish numbers with no lineage.
- Where the audit found real provenance columns, make them visible on interaction: source
  document, data period, ingest date, validation result, link to the original file. This is the
  site's strongest differentiator and it costs almost nothing to build.
- Use only verification states that exist in the data. Do not introduce a taxonomy the database
  cannot populate, and never display a confidence percentage that was not computed from
  something real.

## Design direction

The aesthetic to aim for: a specialist publication's data instrument. Authoritative, dense,
restrained. Impressive because the hierarchy and typography are excellent, not because things
glow.

**Typography carries the identity.** A serif for editorial headings, a clean sans for interface
and labels, a monospaced face for numbers, timestamps, units and technical identifiers. That
split alone communicates journalism-plus-infrastructure without a single decorative element.

**Structure with rules, columns and whitespace — not cards.** Not every value needs a rounded
container with a shadow. Tables, alignment, hairline separators and a real typographic scale do
more, and weigh less.

**Show relationships between numbers, not isolated tiles.** Available capacity, demand and
reserve mean something together; three separate stat boxes throw that meaning away.

**Restraint.** No gradients as decoration, no glassmorphism, no neon, no floating particles, no
scroll-triggered animation. Motion only where it explains a transition or a state change, and
always behind `prefers-reduced-motion`.

**Dark mode as an engineering environment** — deep neutrals, contrast-driven emphasis, not a
gaming interface.

**Design mobile deliberately.** Do not let the desktop layout collapse and call it responsive.
Decide what a phone reader actually needs from Grid Explorer and build that.

Consult the `frontend-design` skill if available for token and styling conventions in this
environment.

## Build order

Ship in reviewable stages. After each, stop and let the user look.

**Stage 1 — Provenance and honest dating.** As-of dates and source attribution on every figure;
click-through provenance wherever real provenance columns exist. Highest credibility return, no
new data required, minimal risk.

**Stage 2 — Visual language.** Typography scale, colour tokens, the move from cards to rules and
columns, the system summary redrawn as related quantities rather than isolated tiles. Presentation
only — no data-layer changes.

**Stage 3 — Time-series exploration.** Day / month / year / custom range, overlays across the
series the audit confirmed exist, hover crosshair, CSV export. This is where the archive earns
its keep. Build it on pre-aggregated, cached endpoints.

**Stage 4 — "What changed".** A daily change summary derived from the ingest — framed explicitly
as a daily bulletin, never as a live feed. Only include change types the data can actually
detect.

**Stage 5 — Mobile.** Deliberate, not derived.

Anything beyond these stages — maps, entity pages, network topology, comparison across facilities
— goes in `REDESIGN_BACKLOG.md` with its data prerequisite, unless the audit explicitly confirmed
the data exists. If it did, propose the addition to the user before building it rather than
folding it in silently.

## Things not to touch

- **Paywall and tier gating.** A path-prefix bypass in this code was fixed recently. If a
  redesign genuinely requires changes here, stop and raise it with the user first, and never
  refactor the path matching as cleanup.
- **Parsers, ingest scripts, and data semantics.** Never change what a number means to make a
  component simpler. If a value is awkward to display, the display adapts.
- **Existing integrity checks and tests.** Extend, do not replace.

## Verification before you call anything done

Run through this explicitly and report the results:

1. Every `CONTENT_MAPPING.md` row accounted for; no inventory id missing.
2. No hardcoded, mocked or placeholder values anywhere in the new code — grep and show the result.
3. Every displayed figure has an as-of date and a source.
4. Nothing labelled live, real-time or current.
5. Every new query selects named columns and is date-bounded.
6. Every new data path is static or cached; no new browser-side Supabase fetches.
7. Payload sizes recorded in `EGRESS_NOTES.md`.
8. Existing tests still pass; paywall behaviour unchanged.
9. Keyboard navigation, focus states, contrast, and reduced-motion respected.
10. Mobile checked at a real narrow viewport, not just a media query.

## Deliverables

- The implemented stage
- `CONTENT_MAPPING.md` — proof nothing was lost
- `EGRESS_NOTES.md` — payload before/after
- `REDESIGN_BACKLOG.md` — what was deferred and what data would unlock it

Report in chat with what changed, what was deliberately left alone, and the verification results.
Keep it brief; the files hold the detail.
