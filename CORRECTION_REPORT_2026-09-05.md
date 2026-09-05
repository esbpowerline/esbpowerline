# Blank-vs-Zero Correction — Verification Report

**2026-09-05** · verified against the production database after `28ba1594`.

---

## 1. Reconciling the counts

The earlier figures headlined **raw cells**, which are inflated. Corrected below.

**Why they differ.** NLDC's pagination advances by roughly one day while each page carries about
two days, so consecutive pages overlap. The corpus holds **3,381 documents / 172,403 data rows /
103,333 unique timestamps — an overlap factor of 1.67×**. Canonical holds 103,331 observations.

The two-row difference is accounted for: the parser rejects a row whose `total`, `gas` or `coal`
is absent, because a row without a generation total is not an observation. Two such rows exist in
the corpus (0.002%).

| field | raw cells examined | raw blank | raw literal `0` | **unique ts blank** | **canonical NULL after** | canonical zero after | canonical NULL before | canonical zero before |
|---|---|---|---|---|---|---|---|---|
| solar | 172,403 | 22,143 | 78,738 | **21,898** | **21,897** | 43,254 | **0** | 65,151 |
| wind | 172,403 | 92,376 | 27,467 | **73,573** | **73,572** | 10,266 | **0** | 83,838 |
| adani | 172,403 | 126,392 | 177 | **84,896** | **84,895** | 59 | **0** | 84,954 |
| nepal | 172,403 | 132,353 | 26,840 | **86,881** | **86,880** | 10,766 | **0** | 97,646 |

Unique-timestamp blanks exceed canonical NULLs by exactly one per field — the same two
parser-rejected rows, of which one carried blanks in all four columns.

`canonical zero before` is derived as `zero after + corrected to NULL`: every corrected cell held
`0`, since that is precisely what was fabricated. `canonical NULL before` was **0** for all four —
the series reported 100% non-null coverage, which was the symptom.

**Total corrected: 267,244 fabricated zeros across 103,331 observations.**

`liquid`, `hydro`, `bheramara` and `tripura` are never blank in the held evidence and were not
touched. `gas`, `coal` and `total` are required by the parser and were never at risk.

---

## 2. What the evidence does and does not establish

Earlier wording — in chat and in code comments now corrected — said the reporting cutoffs "match
physical reality exactly" and referred to plants that "did not exist". **That was an overreach and
is withdrawn.**

What the evidence establishes is narrower and entirely sufficient:

> NLDC printed a value in some cells and left others empty, and it did both on the same row. The
> archive recorded a figure where the source printed none.

Why a cell is blank — the plant was absent, a meter was down, the column simply was not published
that year — **is not established by this evidence and is not decided anywhere in the ingest.**

The rule now enforced end to end:

| source | canonical |
|---|---|
| blank / `-` / `—` / `n/a` | **NULL** |
| literal `0` | **0** |

Commissioning dates, operating history and interconnector milestones belong to the entity/event
layer, joined at read time and labelled as external knowledge. They must never be inferred from
a reporting gap, and nothing in the ingest may consult them.

The observable pattern — Adani blanks ceasing in 2025, wind in 2024, solar in 2018 — is recorded
as **when NLDC began publishing that column**, which is a fact about the publisher.

---

## 3. `:30` semantics — the minute offset is not the classifier

Measured from the stored `remark` column, which the ingest already preserves:

| generation | `:00` | `:30` |
|---|---|---|
| blank (regular) | 92,177 | **3,899** |
| ডে পিক (Day Peak) | **3,722** | 1 |
| সন্ধ্যা পিক (Evening Peak) | **2,813** | 719 |

**6,535 peak observations sit at `:00`, and 3,899 `:30` rows carry no peak remark.** Classifying
on the minute offset would misclassify both groups — roughly 10% of the series. The earlier
cadence note that treated `:30` as "the evening-peak stamp" was a plausible reading of the offset
distribution and is wrong.

The demand series behaves the same way and uses **English** labels (`Day Peak`, `Evening Peak`)
where generation uses **Bangla** (`ডে পিক`, `সন্ধ্যা পিক`), with `—` rather than empty for its
blank. Any classifier must normalise both vocabularies.

### Recommendation: add `observationKind`

```prisma
enum ObservationKind {
  REGULAR        // no remark — the hourly reading
  DAY_PEAK       // ডে পিক / Day Peak
  EVENING_PEAK   // সন্ধ্যা পিক / Evening Peak
  UNCLASSIFIED   // a remark present but not recognised
}
```

Derived from `remark` at ingest, stored, and never inferred from the timestamp. `UNCLASSIFIED`
matters: it makes a new remark vocabulary visible instead of silently folding into `REGULAR`.

This is worth a migration because the aggregation rule below cannot be expressed without it, and
because deriving it in every query re-implements the vocabulary mapping at each call site.

### Aggregation semantics — required before any historical API

Peak rows are **extra samples taken at moments chosen for being extreme**. They are not additional
hours; they are annotations on the same hour. Measured bias from averaging them in:

| year | mean of all obs | mean of regular only | bias |
|---|---|---|---|
| 2015 | 5,967.7 | 5,933.1 | **+34.6 MW** |
| 2020 | 8,437.8 | 8,379.7 | **+58.1 MW** |
| 2026 | 12,363.2 | 12,292.5 | **+70.7 MW** |

Small in percentage terms (~0.6%) and **systematic in one direction**, which is worse than noise:
it makes every historical mean quietly too high, and the error grows with demand.

**The rules:**

1. **Means, sums and distributions use `REGULAR` only.** Never mix kinds in an average.
2. **`DAY_PEAK` / `EVENING_PEAK` answer peak questions**, and are reported as maxima, not averages.
3. **A daily maximum may draw on all kinds** — the peak stamp exists precisely because it may
   record a value no hourly reading caught.
4. **Counts must state which kind they counted.** "25 observations" is a cadence fact; "24 hours"
   is a coverage fact; they are different numbers.

---

## 4. Completeness of derived sums

`imports.indiaMw` and `imports.totalMw` now sum only reported components and are `null` when none
were reported. That is better than fabricating a total, but a bare number still cannot distinguish
these three cases:

| case | meaning |
|---|---|
| **COMPLETE** | every component reported |
| **PARTIAL** | some reported, some absent — a lower bound |
| **NONE** | nothing reported — null |

A partial sum presented as a total understates it, and before 2025 that is the *normal* case for
imports, not an edge case.

### Smallest sufficient change

Do **not** add a completeness column per derived field — that is a column per sum, forever.

Return derived sums as a pair instead, computed at read time, stored nowhere:

```ts
type DerivedSum = {
  value: number | null;        // null when nothing was reported
  of: number;                  // components reported
  outOf: number;               // components the source defines
};
// complete  <=> value !== null && of === outOf
```

Three integers, no migration, and the UI can render `PARTIAL` from `of < outOf` directly. The
`reconciles` flag already in the snapshot is the same idea applied to the whole row, and it is what
catches the row below.

### Gaps, and why nothing may be interpolated

Two distinct causes must never be conflated:

| kind | example | treatment |
|---|---|---|
| **Publication cadence** | a day with 24 observations rather than 25 | not a gap — no `:30` stamp was issued |
| **Source gap** | 2017-01-18 → 2017-02-08, **517 hours** | absent; 185 two-hour and 11 three-hour gaps also exist |
| **Source error** | see below | present but unusable |

For any derived period the rules are:

1. **No interpolation, ever** — not linear, not carry-forward, not seasonal.
2. **Every period carries its own coverage**: observations present / expected, and the expected
   count derives from `REGULAR` hours, not from 24 × days.
3. **A period below a stated coverage floor is reported as insufficient, not estimated.** The
   February 2017 monthly mean must say it rests on 20 of 28 days, or decline to state a mean.
4. **Coverage travels with the figure** into exports and the API, not just the chart.

### The source error that this surfaced

Checking the bias hypothesis exposed an unrelated defect. January 2023 showed a monthly mean of
**91,349 MW** against ~8,900 for its neighbours. One row is responsible:

```
2023-01-15 05:00 Dhaka   raw cell "64526500"
components: 4490 + 265 + 952 + 30 + 0 + 645 + 82 = 6,464
neighbouring hours: 6,475 and 6,653
```

The raw evidence shows NLDC published `64526500`. **This is the source's error, not the parser's**,
so under rule 4 it stays exactly as filed and is reported, never repaired.

But it must be **excluded from derived aggregates**, or one typo moves a monthly mean by an order
of magnitude. The mechanism already exists: `reconciles` compares the printed total against its own
components and would be false here by four orders of magnitude. It is computed in the live snapshot
and **not stored per row** — so the archive cannot currently filter on it.

**Recommendation:** persist `reconciles` (or a `plausible` flag derived from it) per observation at
ingest. It is the row-level completeness signal that the derived layer needs, it costs one boolean,
and it is the difference between an aggregate that quietly reports 91,349 MW and one that reports
8,900 MW with a note that one hour was excluded and why.

Eight further rows fall below 1,000 MW and have not been examined; they are recorded here as
open rather than assumed benign.

---

## Verification summary

| check | result |
|---|---|
| canonical rows | 103,331 |
| fabricated zeros removed | **267,244** |
| raw ↔ canonical reconciliation | exact, 2 rows explained |
| refetches required | **none** — corrected wholly from `rawGzip` |
| tests | **441 passing** (58 files) |
| `tsc` | clean |

Three prerequisites are now recommended before the Time Machine is built, none of them yet
implemented: `observationKind`, a stored plausibility flag, and the `DerivedSum` shape.
