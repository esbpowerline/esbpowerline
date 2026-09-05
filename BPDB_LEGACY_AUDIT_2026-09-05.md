# BPDB legacy corpus — read-only fidelity & provenance audit

**2026-09-05.** Nothing on W: was modified. Nothing was ingested. Every legacy `verified`,
`match_percentage` and `verification_log` field is treated as a **claim**, counted and never
believed.

Tool: `scripts/profile-bpdb-legacy.ts` — a profiler, not an importer. It writes nowhere.

---

## 1. Corpus inventory

| corpus | files | unique dates | range | rows | calendar gaps |
|---|---|---|---|---|---|
| **Daily Generation Backlog / JSONs** | 5,663 | **5,663 (0 duplicates)** | 2010-12-26 → 2026-06-27 | **627,631 unit rows** | **0** |
| **Area Wise Demand Backlog** | 5,649 | **5,649 (0 duplicates)** | 2011-01-09 → 2026-06-27 | 49,229 zone rows | **0** |
| Daily Generation Backlog / PDFs | 662 | — | 2024-08 → 2026-06 | — | — |
| daily-max-generation | 2,361 + 1 csv | not audited | — | — | — |
| Annual Reports | 4 json + 17 pdf | not audited | — | — | — |

**Both corpora are date-contiguous with zero duplicates and zero calendar gaps.** For a
hand-assembled 15-year backlog that is unusually clean and is the strongest single signal in the
corpus's favour.

**Schema variants: one, in each corpus, at 100%.**

```
generation  calculated_totals|date|match_percentage|pdf_downloaded|pdf_link|pdf_totals|regions|verified
area        calculated_total|date|reported_total|verification_log|verified|zones|zones_count
```

No schema drift across fifteen years. All eleven unit-level fields are present on **100%** of
627,631 rows: `sl`, `name`, `unit_capacity`, `installed_capacity_mw`, `derated_capacity_mw`, and
forecast / actual / probable day and evening peaks.

**File sizes** (generation): min 260 B · p10 19.2 KB · median 48.8 KB · p90 78.1 KB · max 83.3 KB.
**70 files under 2 KB** — and those 70 are exactly the empty ones (see §3).

**Filename dates vs internal dates: no mismatches.** Every filename `dd-mm-yyyy` agrees with the
record's own `date` field. Checked, not assumed.

**Anomalies:** 0 negatives · 36 unit rows above 1,500 MW (implausible for a single Bangladeshi
unit — reported, not corrected) · 19 duplicate unit names within a region-day · 6 files with an
odd region count (one with 2 regions, two with 7, three with 9).

**Region coverage.** Nine BPDB zones appear on ~5,470–5,593 days each. **A tenth key appears on
5,593 days: `Under Maintenance`.** That is not a geography — it is a *status bucket* sharing a
dictionary with nine geographic zones. Any ingestion that treats `regions` as a region map will
silently import maintenance units as a tenth region. Flagged, not fixed.

---

## 2. Evidence lineage

**Searched:** all of W:, the whole repository, and the 47 Python parsers under
`bd-grid-backlog/grid-data/parsers/`.

**The generating code is not on W:.** No file writes `match_percentage`, `verified`,
`verification_log` or `pdf_totals`. The single reference in 47 parsers is
`headers.py:396`, which *reads* `verified` into a fingerprint column `fp_verified`. It consumes
the claim; it does not produce it.

**What does exist**, and is genuinely useful:

- `bd-grid-backlog/inventory/coverage.csv` — a **23,894-row** inventory of the entire archive with
  `sha256`, `filename_date`, `stamped_date`, `fp_n_regions`, `fp_n_zones`, `fp_verified`.
- `BACKLOG-PROMPT.md`, `ACQUISITION-LOG.md`, `COVERAGE-REPORT.md`, `PROGRESS.md`.

Crucially, `coverage.csv` labels these files **`role = prior-parse`**. The earlier backlog work had
already classified them as a prior parse rather than evidence, and recorded `verified` as a
*fingerprint* rather than trusting it. That judgement was correct and this audit confirms it.

### Classification

| class | share | detail |
|---|---|---|
| **A** — raw evidence + reproducible transform | **0%** | the transform code does not exist anywhere |
| **B** — source reference + transformed data | **11.7%** (662 days, 2024-08 → 2026-06) | PDF held locally *and* `pdf_totals` recorded |
| **C** — transformed JSON only | **88.3%** (5,001 days, 2010-12 → 2024-07) | no PDF, `pdf_totals: null`, no transform code |
| **D** — mixed | — | the corpus as a whole is B+C |

**There is no class A. Not one record has a reproducible transform.**

---

## 3. The legacy verification claims

**Generation corpus, all 5,663 files:**

| claim | count | share |
|---|---|---|
| `pdf_totals` null — nothing to match against | 5,003 | 88.35% |
| `verified: true` | 697 | 12.31% |
| `pdf_downloaded: true` / has `pdf_link` | 662 | 11.69% |
| `match_percentage: 100` | 454 | 8.02% |
| **`verified: true` WITHOUT `pdf_totals`** | **72** | 1.27% |
| **`verified: true` AND `regions: {}`** | **70** | 1.24% |
| **`match_percentage: 100` AND no data** | **70** | 1.24% |

**The vacuous-truth bug is exactly bounded.** The 70 empty-regions files are *precisely* the 70
files claiming `verified: true` with `match_percentage: 100` and no PDF. The overlap is perfect:
`verified ∧ no-PDF = 70`, `empty-regions = 70`, `empty ∧ verified = 70`. Every empty file claims
perfect verification, and no non-empty file makes an unbacked claim of that kind.

**How it happened, inferred from behaviour rather than code** (the code is gone, so this is
inference and is labelled as such):

The comparison is `calculated_totals` against `pdf_totals`. Where both exist the arithmetic is
real and discriminating — 2025-01-01 records `99.85`, 2025-06-15 records `100.0`, and 35 days that
*have* a PDF are marked not-verified. That is a working check.

Where `regions` is empty, `calculated_totals` is an all-zero six-element array and `pdf_totals` is
null. A comparison of "nothing" against "nothing" returned agreement — the classic
`every([]) === true` / vacuous-truth shape, with a 0/0 percentage resolving to 100 rather than
undefined. **Parser success was recorded as data verification.**

**Area corpus:** `verified: false` on **100.00% of 5,649 files** — a constant, carrying zero
information. The reason is visible in the data: `reported_total` is missing or zero on **5,480 of
5,649 (97%)**, so the check compared each day's zone sum against a total BPDB's site never
published, and failed by construction. Notably, **where a comparison was possible it passed: 0
files disagree by more than 2%.** The `verified: false` flag is therefore not evidence against the
zone data — it is evidence about a missing denominator.

**Verdict: the legacy metadata is unusable as a trust signal in either corpus** — vacuously true in
one, constantly false in the other. It must be carried as an opaque legacy claim, never mapped to
ESB's `validationStatus`.

---

## 4. The profiler

`scripts/profile-bpdb-legacy.ts`. Read-only by construction: it opens files, counts, and prints.
It has no database import, no write path, and ends by saying so. Counts produced: schema variants,
legacy claims (including the three vacuous combinations), empty/malformed records, blank/zero/
negative/implausible values, duplicate unit names, unexpected region labels, expected-zone
coverage, zone-sum vs reported-total disagreement, filename-vs-internal date mismatch, size
distribution, per-year coverage and calendar gaps.

---

## 5. Schema-era sampling

**The JSON container has one schema across fifteen years**, so eras cannot be found in its shape.
They were sought in the *data* instead — per-year unit counts and per-field non-zero rates:

| era | evidence |
|---|---|
| **2010-12 → 2011** | partial: 5 of 6 days in 2010, and **320 of 365 filled in 2011 (87.7%)** — the only year with substantial empties |
| **2012 → 2023** | stable: 98.9–100% filled, 10 region keys, `calculated_totals` length 6 on every file |
| **2024-08 →** | **raw evidence begins.** PDFs appear, `pdf_totals` populated, `match_percentage` becomes meaningful |
| **2025 →** | `installed_capacity_mw` non-zero rate drops **88% → 77%**, and `actual_day_peak` falls to **39%** by 2026 |

Fleet growth is visible and plausible: 11,565 unit rows in 2011 → 66,738 in 2025 (~32 → ~183 units
per day).

**The limit of this exercise, stated plainly:** §5 asks what the BPDB document actually showed for
each era. **For 2010-12 → 2024-07 that cannot be established, because no source document survives
anywhere** (§6). The faithfulness of 88% of this corpus is not checkable by any means available
today. That is the audit's central finding and no amount of sampling changes it.

---

## 6. Recoverability

BPDB's own endpoint is `https://misc.bpdb.gov.bd/storage/daily_entry/YYYY-MM-DD.pdf`. Probed
directly across eras:

| date | result |
|---|---|
| 2011-06-15 · 2014 · 2017 · 2020 · 2023 · 2024-07 | **404** |
| 2024-08-01 · 2024-08-15 | **404** |
| **2024-09-01** onward · 2025 · 2026 | **200, valid PDF** |

**BPDB retains roughly 24 months.** The boundary sits between 2024-08-15 and 2024-09-01.

Local PDFs span **2024-08 → 2026-06** — almost exactly the retained window. They add only **4 days**
(2024-08) that BPDB has since dropped.

| period | days | raw evidence | reconstructable in 2030 |
|---|---|---|---|
| 2010-12-26 → 2024-07-31 | **~4,970** | **none, anywhere** | **No — irreplaceable** |
| 2024-08 (local only) | 4 | local PDF | No |
| 2024-09 → 2026-06 | ~658 | local PDF + live source | Yes, while retention lasts |

**If W: were lost tomorrow, ~4,970 days of unit-level BPDB generation and ~4,900 days of
area-wise demand would be gone permanently.** They exist in one place, in one form, produced by
code that no longer exists.

---

## 7. Canonical-ingestion eligibility

Field-specific, as required. **Nothing is ingested.**

| scope | classification | reasoning |
|---|---|---|
| `date` (both corpora) | **SAFE TO CANONICALIZE** | filename and internal date agree on every file |
| Area-wise `zones[].zone_name / demand_mw / load_shed_mw` | **SAFE**, with the caveat below | one schema, 0 negatives, 0 disagreements where checkable, 9 stable zones |
| Area-wise `reported_total`, `verified`, `verification_log` | **LEGACY TRANSFORM ONLY** | 97% missing/zero; `verified` constant-false and meaningless |
| Generation `regions` → 9 geographic zones | **REQUIRES MANUAL/STRATIFIED VALIDATION** | structurally sound but unverifiable pre-2024-08 |
| Generation `regions['Under Maintenance']` | **REQUIRES MANUAL VALIDATION** | a status bucket, not a region — must not enter a region dimension |
| Generation unit fields, **2024-09 → 2026-06** | **SAFE**, after a reparse check | PDF held *and* live source; `match_percentage` is a real comparison here |
| Generation unit fields, **2010-12 → 2024-07** | **REQUIRES REPARSE FROM RAW EVIDENCE — which does not exist** ⇒ in practice **LEGACY TRANSFORM ONLY** | no PDF, no code, no source |
| `verified`, `match_percentage`, `pdf_totals`, `pdf_downloaded` | **UNUSABLE as trust signals** | vacuously true on all 70 empty files |
| The 70 empty-regions files | **UNUSABLE** | no data; carry a false verification claim |
| 36 rows >1,500 MW, 19 duplicate unit names, 6 odd-region files | **REQUIRES MANUAL VALIDATION** | small, enumerable, worth eyes |

**The honest position:** 88% of this corpus can be ingested only as *"what a prior parse of unknown
provenance asserted"*. That is a legitimate thing to hold — but it is a different class of data
from the PGCB archive, where every day names its document and the gas days carry a SHA-256. It
must never be presented beside them as though it were the same.

---

## 8. What BPDB adds over the existing archive

| holding | days | range |
|---|---|---|
| PGCB daily archive | 4,550 | 2013-12-31 → 2026-09-04 |
| PGCB per-station | 2,313 | 2014-01-01 → 2026-09-04 |
| PGCB energy curves | 2,004 | 2014-01-01 → 2026-09-04 |
| NLDC hourly | 103,340 obs | 2015-04-17 → 2026-09-05 |
| **BPDB generation** | **5,663** | **2010-12-26** → 2026-06-27 |
| **BPDB area demand** | **5,649** | 2011-01-09 → 2026-06-27 |

**Unique additions:**

1. **~3 extra years of history** — 2010-12-26 predates PGCB's daily archive (2013-12-31) by
   1,100 days.
2. **Per-generating-unit resolution.** 627,631 unit rows with installed *and* derated capacity per
   unit. ESB's `GeneratingUnit` table has **0 rows**; this is the only dataset that could populate
   it, and it is 2.4× deeper than PGCB's per-station file.
3. **Forecast vs actual, per unit** — forecast, actual and probable day/evening peaks side by side.
   PGCB's forecast lives at system level.
4. **Derated capacity** — a maintenance/availability signal PGCB's daily workbook does not carry.
5. **Zone demand and load shed back to 2011**, against PGCB's zone rows from 2013-12.
6. **Cross-source validation.** The July-2026 reference build already demonstrated
   "PGCB summed generation = BPDB headline peak, 32/32 days", so a genuine two-source check exists
   for the overlap.

**Semantic cautions — identically named metrics are not comparable:**

- BPDB reports **day peak and evening peak**; PGCB's hourly is a continuous series. A BPDB "peak" is
  not a PGCB hourly maximum.
- **`installed` vs `derated`** — BPDB carries both per unit; PGCB carries installed and present
  capacity at station level. They are different denominators.
- BPDB's day is a **calendar day**; PGCB's is an **energy day** (report date − 1). Aligning them
  without the observation-window rule would offset the entire corpus by one day.
- `Under Maintenance` is a status, not a place.

---

## 9. Strategic consequence

**Does it change the moat? Yes — and in a direction the strategic audit under-weighted.**

That audit concluded the archive's value is that publishers do not serve their back catalogue.
This corpus is the sharpest instance found so far: **BPDB retains ~24 months, and ESB holds ~15
years.** ~4,970 of those days exist in exactly one place on earth.

**Additional trustworthy history: 0 days today.** That is the uncomfortable answer and it should
not be softened. Nothing here is *trustworthy* yet, because 88% of it cannot be checked against
anything. What ESB holds is ~5,000 days of **unverifiable but irreplaceable** data — genuinely
valuable and genuinely unproven, at the same time.

Potentially recoverable to a **high** standard: ~658 days (2024-09 →), by reparsing PDFs held
locally and re-fetchable. Potentially recoverable to a **stratified-confidence** standard: the rest,
by sampling against PGCB's overlapping archive from 2013-12 onward — which would let ~4,600 days be
cross-checked on totals even though their unit detail can never be re-derived.

**Hardest for a 2030 competitor to reproduce**, ranked:

1. **BPDB unit-level generation 2010-12 → 2024-07** — ~4,970 days, source retention 24 months, no
   mirror found. Uncontestable.
2. **BPDB area-wise demand 2011 → 2024-07** — same shape, and load shedding by zone is the most
   politically salient series in the sector.
3. **NLDC hourly demand/load-shed** — 145-day retention (already established).
4. **The PGCB ERP id→date map** — the index PGCB stopped publishing.

**Is a BPDB fidelity/reparse project now higher priority than the tariff engine?**

**Split answer, and I would not merge them.**

- **Preservation: yes, immediately, and it outranks everything.** These files sit on one W: drive
  with no committed copy, no checksum in ESB's control, and no second location. `coverage.csv` has
  sha256 for every file, which makes a verified copy cheap. The risk is not that the data is wrong —
  it is that a disk failure erases fifteen irreplaceable years. **That is a backup task, not a data
  project, and it should happen before anything else in this report.**
- **Reparse/ingestion: no, it does not outrank the tariff engine.** There is nothing to reparse for
  88% of the corpus — no source, no code. What it needs is stratified validation against PGCB, which
  is slow analytical work with an uncertain outcome. The tariff engine has a clear path, a known
  source (gazettes) and blocks a differentiated consumer feature. **Tariff engine first; BPDB
  validation as a parallel research track.**

---

## 10. Time Machine access policy — assessment only, not implemented

Your decision: *historical range should be publicly explorable; capability, extraction and scale
should be monetised.* The audit's §2 finding supports it — the seven-day window is a business
decision, and it hides the moat from exactly the people whose habit makes it valuable.

**Smallest safe change.** One constant:

```ts
visitor: { daysBack: 6 }   →   { daysBack: null }
```

`getEarliestAllowedDate` already returns null for unlimited (`plan_999` uses it), so the clamp
disappears with no new code path. Everything downstream continues to work.

**What must move with it, and nothing more:**

1. **Resolution stays tiered.** Hourly is where cost and value both live. Visitors get day and
   month; hourly, exports, the API and compare remain paid. This is the "capability not reach"
   line, and it is enforceable in the existing route by rejecting `resolution=hour` for a visitor.
2. **Bound the span, not the reach.** A visitor may reach 2015 but not request 4,000 points in one
   call. A max-span-per-resolution cap (say 400 points) is a performance guard, not an entitlement
   one, and it should return a clear "narrow your range" rather than a tier message.
3. **Rate limiting.** Upstash is already wired in middleware; history is `force-dynamic` and
   uncached on first call for an arbitrary range, so anonymous history needs its own bucket.
4. **Cache pressure is the real cost.** Arbitrary ranges are unbounded cache keys. Snapping
   `from`/`to` to period boundaries before the cache key would collapse most of that; worth doing
   with the change, not after.

**`RESTRICTED` stays.** It becomes rare, not wrong. Resolution gating, span caps and any future
tier all still need a state that says *"ESB holds this; you cannot see it here"* as distinct from
*"the archive does not have it."* Removing it because it got quiet would reintroduce exactly the
conflation just corrected.

**Not implemented.**

---

## 11. Telemetry — unchanged, with the BPDB consequence noted

The seven-event set from the previous audit stands. After the access change, one event shifts
meaning and is worth stating: `restricted_encountered` stops being the conversion signal and
becomes a **guard-rail signal** — if it fires often, the span cap or resolution gate is set wrong,
not the price.

Reaffirming the privacy shape, which matters more now that the range is public: **no exact
historical research dates** (year only), **no search terms**, **no plant names**, **no session
stitching**, **no user id**. A journalist repeatedly querying one plant across one narrow period is
a research trail, and it is precisely what must not be reconstructable — including by ESB.

**Minimum implementation after the BPDB work:** one client helper posting to one endpoint, seven
event names, properties restricted to the enumerated buckets, no third-party analytics dependency
required. **Not implemented.**

---

## Summary

| | |
|---|---|
| corpus | 5,663 generation days + 5,649 demand days, **0 duplicates, 0 calendar gaps** |
| unit rows | **627,631** |
| schema variants | **1 per corpus, across 15 years** |
| class A (reproducible transform) | **0%** |
| raw evidence held | **11.7%**, all 2024-08 → 2026-06 |
| legacy claims usable as trust | **none** — 70 vacuous in one corpus, constant-false in the other |
| irreplaceable | **~4,970 days**; BPDB retains ~24 months |
| immediate action | **back it up** — one drive, no checksummed copy, no second location |

Nothing on W: was modified. Nothing was ingested. No product work was started.
