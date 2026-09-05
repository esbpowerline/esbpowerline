# Versioned Bangladesh electricity tariff engine — design

**2026-09-05. Design only. Nothing implemented.**

---

## A. Executive verdict

**Build it — but the product is the versioned rule set, not the calculator.**

Arithmetic over slabs is an afternoon's work, and six free calculators already do it. What none
of them does — and what the sector has no public copy of anywhere — is answer *"which rule was in
force on this date, who issued it, and where is the document."* That question is unanswerable
today from any public source in Bangladesh, and it is the one every downstream feature in the
brief actually depends on.

**Evidence that the gap is real, found while auditing:**

The current tariff took effect June 2026. BERC raised the weighted-average retail tariff 16.68%,
Tk 9.11 → Tk 10.63/kWh, announced 3 June 2026. The lifeline rate went **Tk 4.63 → Tk 5.32** and
the 0–75 step **Tk 5.26 → Tk 6.18**.

`ebill.info.bd`, which brands itself *"Bangladesh Electricity Bill Calculator — 2026 BERC Tariff"*
and cites BERC, currently publishes the lifeline rate as **Tk 4.63** and the 0–75 step as
**Tk 5.26**, and states both were *"left unchanged in the 2026 revision."* Those are the
superseded values. **The most prominent public calculator is serving the previous tariff as
current, under the current tariff's name.** It has no version, so it cannot be wrong in a way it
can detect.

That is the differentiation, and it is not a marketing claim — it is a reproducible defect in the
incumbent.

**Three findings that shape the whole design:**

1. **BERC is not always the authority.** Its own notices page lists a retail tariff order dated
   **23-11-2017**. The 2023–2024 revisions were **Power Division gazette notifications** issued
   under BERC Act §34K, which let the executive set tariffs without a public hearing. §34K was
   **repealed by gazette in August 2024**, and the June 2026 revision is a BERC order again. A
   schema that hardcodes `publisher = BERC` cannot represent 2023 or 2024. The repo already
   documents this history at [policies.ts:111,116](lib/data/policy/policies.ts#L111) — it just
   never connected it to the tariff data.

2. **The slab structure is genuinely unresolved and must not be guessed.** The published table
   lists **0–50 at 4.63 and 0–75 at 5.26** — overlapping bands, which is incoherent under a
   telescopic reading. It is only coherent if the lifeline is a *category* (all-or-nothing:
   exceed 50 units and none of your units get 4.63), not a band. One competitor asserts full
   telescopic pricing; another declines to say. Getting this wrong changes a 51-unit bill by
   roughly 13%. See §K1.

3. **The repository has no consumer tariff logic at all.** Not a partial one, not a stale one.
   There is nothing to refactor, which is the best possible starting position — and it means
   every number the site currently prints about tariffs is a hand-typed constant.

**Do it now. Scope V1 to one utility path and four versions.** The reason to start now is not
demand; it is that the June 2026 order is fresh, cited in the press, and the 2023–24 gazettes are
still findable. Provenance decays. See §K7.

---

## B. Existing-code audit

**No bill calculator, slab table, VAT logic, demand-charge logic, meter-rent logic or consumer
billing component exists anywhere in the repository.** Verified by targeted search across `.ts`,
`.tsx`, `.py` and `.prisma`: zero matches for `slab`, `lifeline` (outside a Petrobangla chart
title), `meter rent`, `demand charge`, `calculateBill`, `tariffVersion`. The only `effectiveFrom`
in the codebase belongs to `Contract` and to the Time Machine's restriction boundary.

What *does* exist is tariff-adjacent display data:

| # | File | What it holds | Class | Note |
|---|---|---|---|---|
| 1 | [lib/data/companies/berc.ts](lib/data/companies/berc.ts) | 11 rows of **bulk wholesale** tariff, 2010→Jun 2026 | **hardcoded · unverified** | No source, no URL, no document, no issuer. Jun 2026 = 8.39 is corroborated by the June 2026 order; Feb 2024 = **7.04** conflicts with the order's own stated prior value of **7.00**. This is the single best V1 migration candidate — small, real, and already wrong in a checkable way. |
| 2 | [lib/data/macro/tariff.ts](lib/data/macro/tariff.ts) | Same 11 tariff values **re-typed**, plus a `cost` column | **duplicate · hardcoded · unverified** | Imports `bercBulkTariffHistory` and then restates every one of its values inline. Two copies of one series, and nothing keeps them equal. The `cost` column has no source at all. |
| 3 | [lib/homepage-defaults.ts:5](lib/homepage-defaults.ts#L5) | `"New 8.95 Tk/kWh bulk tariff in effect"` | **dangerous · stale** | Contradicts 8.39 in both files above, and 8.39 is the one the June 2026 order supports. Ships in the homepage market-pulse string. **Fix independently of this project** — it is a wrong published figure, today. |
| 4 | [lib/data/policy/policies.ts:689](lib/data/policy/policies.ts#L689) | `"Tk 7.00 → Tk 8.39/kWh; lifeline Tk 4.63 → Tk 5.32"`, `asOf: 'Jun 2026'` | **partially reusable · unverified source** | **The only retail tariff figure in the repo, and it is correct** — it matches the June 2026 order where the leading competitor does not. But it cites *Dhaka Tribune*, a newspaper, not the order. Right number, wrong provenance class. |
| 5 | [lib/data/macro/economics.ts](lib/data/macro/economics.ts) | Exchange rate, inflation, spot LNG, coal, retail diesel/octane by year | **hardcoded · unverified · doctrine violation** | `spotLng: 0.0` and `importCoal: 0.0` for 2010–2016 assert a measured zero where the correct value is null (Bangladesh imported no LNG before 2018). This is exactly rule 1. **Do not reuse as a pattern.** |
| 6 | [lib/data/macro/fuel-prices.ts](lib/data/macro/fuel-prices.ts) | Global vs domestic prices back to 1975; derived BDT conversions | **stale · unverified** | Same zero-for-absent shape (`bdCoal: 0.0`, `bdSolar: 0.0` for decades). The conversion arithmetic is inlined in a `.map()`. Out of scope, flagged. |
| 7 | [lib/data/grid/live-ticker.server.ts](lib/data/grid/live-ticker.server.ts) | Reads 1, 5 into the commodities strip | **partially reusable** | Correctly structured — every item carries `source` and `asOf`, and `null` where unquoted. The consumer is right; its inputs are not. This is the **first place a real tariff version should plug in**, and it closes standing item 4 in `CLAUDE.md`. |
| 8 | [lib/data/bpdb-annual-accounts.ts](lib/data/bpdb-annual-accounts.ts) | BPDB cost heads by year | **reusable — as the reference pattern** | Not tariff data, but the house standard for source-backed figures: names the document, the page block, the extraction scripts, the dual-engine agreement rule, and where coverage stops. **The tariff engine should look like this file.** |
| 9 | [lib/data/grid/comparison.ts](lib/data/grid/comparison.ts) | The two-day comparison engine | **reusable — as the architectural precedent** | `changeOf(a, b)` already implements the exact null-safe delta/percentage contract `compareTariffs` needs, including refusing to produce a percentage from a null. Do not reimplement; mirror it. |
| 10 | [prisma/schema.prisma](prisma/schema.prisma) `SourceDocument` | publisher, sha256, `sourceUrl`, `rawGzip`, `ingestStatus`, `validationStatus`, `parserVersion` | **reusable — directly** | Built for the NLDC persistence work and it fits tariff orders unchanged. A gazette PDF is a source document with a window and a hash. |
| 11 | `GridSubscriptionPlan` / member plans | ESB's own pricing | **unrelated** | Named "plan/pricing" but has nothing to do with electricity tariffs. Noted so nobody conflates them. |

**Nothing is dangerous to *correctness* except #3**, which is a live wrong figure on the homepage.

---

## C. Proposed data model — conceptual

Four layers, matching the archive's EVIDENCE → CANONICAL → DERIVED discipline. The fourth layer
is not persisted at all.

```
EVIDENCE     TariffDocument       the PDF/gazette as issued, hashed and stored
   │
CANONICAL    TariffOrder          what the document decided: issuer, dates, scope
   │           └─ TariffSchedule  one (utility × category × meter × phase) rate card
   │                └─ components slabs, charges, taxes, rebates
   │
DERIVED      BillCalculation      never stored; recomputed from a locked version id
```

### TariffDocument — evidence

Mirrors `SourceDocument` and should probably *be* it, with `Publisher` widened.

`issuer` · `documentType` (`BERC_ORDER | GAZETTE_NOTIFICATION | UTILITY_CIRCULAR | PRESS_RELEASE`)
· `title` · `publishedOn` · `sourceUrl` · `contentSha256` · `rawGzip` · `retrievedAt` ·
`language` (order text is often Bangla; the English rendering is a translation, and that matters
for a dispute) · `note`.

**`documentType` is load-bearing.** A press release announcing a tariff is not the tariff. If V1
must start from press coverage for a version whose order is not yet located, the record says so
in its type rather than in a comment nobody reads.

### TariffOrder — canonical decision

`documentId` · `issuer` · `issuedOn` · `effectiveFrom` · `effectiveTo` (null = still in force) ·
`supersedesOrderId` · `amendsOrderId` · `scope` (which utilities and levels it covers) ·
`verificationStatus` · `note`.

**Split from the document deliberately.** One gazette can carry bulk, transmission and retail
decisions; one revision can arrive as an order plus a later corrigendum. Document ≠ decision.

### TariffSchedule — one rate card

`orderId` · `utility` · `consumerCategory` · `voltageLevel` · `meterType` · `phase` ·
`timeOfDayScheme` · `effectiveFrom` / `effectiveTo` · `sourcePage`.

Dimensions, kept open rather than enumerated to today's residential case:

| dimension | V1 values | designed to accept |
|---|---|---|
| `utility` | BPDB, DPDC, DESCO, NESCO, WZPDCL, BREB/PBS | any licensee |
| `consumerCategory` | LT-A residential | LT-B irrigation, LT-C/D small industry, LT-E commercial, LT-T temporary, MT, HT, EHT |
| `voltageLevel` | LT | MT / HT / EHT |
| `meterType` | POSTPAID | PREPAID, SMART, TOD |
| `phase` | SINGLE | THREE |
| `timeOfDayScheme` | FLAT | OFF_PEAK / PEAK where the category has one |

**`utility` is a required dimension even though V1 populates one path.** BREB's service charge and
DESCO's meter rent are not the same instrument, and a schema that assumes one national rate card
cannot later represent that without a migration of every historical row.

### Components — a schedule's charges

Not one table of slabs. A `TariffComponent` list, discriminated by `kind`, each carrying its own
`basis` (§D):

`ENERGY_SLAB` (index, `fromUnit`, `toUnit`, `rate`, `applicability`) · `FIXED_CHARGE` ·
`DEMAND_CHARGE` · `METER_RENT` · `SERVICE_CHARGE` · `MINIMUM_CHARGE` · `VAT` · `REBATE` ·
`SURCHARGE` · `LATE_PAYMENT` · `ADJUSTMENT`.

Every component carries `basis`, `appliesTo` (which earlier components form its base), `order`,
and — where the rule could not be read off the document — **`status: UNKNOWN` with the question
written out**. An `UNKNOWN` component does not silently evaluate to zero; it produces a warning
and suppresses the total. See §D.

**`applicability` on `ENERGY_SLAB` is where the lifeline question lives.** `TELESCOPIC` (this band
prices only units inside it) vs `CATEGORICAL` (this rate applies to *all* units, but only if total
consumption stays within the band). The 0–50 / 0–75 overlap is representable, and its resolution
is data, not code.

---

## D. Calculation engine design

**A pure function over plain data. No Prisma import, no `server-only`, no React, no I/O, no
`Date.now()`.** It must be callable from a route handler, a client component, a test, a script, and
one day a React Native app, with identical output.

```
calculateBill(input: BillInput, schedule: ResolvedSchedule): BillResult
```

`ResolvedSchedule` is a plain object — the caller resolves *which* schedule (§F) and hands it in.
The engine never looks up a date. That separation is what makes it deterministic and trivially
golden-testable.

### Input

```
utility · consumerCategory · meterType · phase
billingPeriod: { from, to }        // days matter — see §K5
kwh                                 // consumption in the period
sanctionedLoadKw? · maxDemandKw? · connectedLoadKw?
paidWithinDueDate? · isPrepaid?
priorArrears? · knownAdjustments[]  // for reconstruction against a real bill
```

Anything absent is `undefined`, **never zero**. A missing `sanctionedLoadKw` on a schedule with a
demand charge is a warning and an unresolved component — not a demand charge of nil.

### Output

```
{
  components: [
    { kind, label, basis, base, rate, amount, status, note?, sourceRef }
  ],
  subtotalBeforeTax, taxes, rebates, total: number | null,
  warnings: Warning[],
  provenance: {
    orderId, documentTitle, issuer, documentType, sourceUrl, contentSha256,
    effectiveFrom, effectiveTo, versionId, verificationStatus, engineVersion
  }
}
```

**`total` is nullable, and that is the most important line in the design.** If any component is
`UNKNOWN` or an input it needs is absent, the total is `null` and the warnings say which component
and why. A partial sum presented as a bill is the tariff-engine form of the Gas Supply incident:
a plausible number under an unchanged label, computed from a different quantity than the one the
label claims.

The per-slab breakdown ships too — every band, its unit count, its rate and its subtotal — because
a reader disputing a bill needs the working, not the answer.

### Error states

| state | behaviour |
|---|---|
| No schedule for (utility, category, date) | throw — a caller asking for a rule that does not exist has a bug |
| Overlapping schedules for one key | throw — ambiguity must never be resolved by picking one (§F) |
| Component `status: UNKNOWN` | compute what is knowable, warn, `total: null` |
| Required input absent | same |
| Billing period spans a tariff change | see §F — split, never blend |
| kWh negative | throw |
| kWh zero | valid, and a real case — fixed charges may still apply (§G) |

### Billing semantics — what each component is based on

Per §4 of the brief, and **the honest answer is that most of these are UNKNOWN until the order is
read.** Marked accordingly rather than invented.

| component | basis | status |
|---|---|---|
| Energy charge | kWh × slab rate | **known** in shape; **UNKNOWN** whether telescopic or categorical (§K1) |
| Demand charge | sanctioned load, monthly | **UNKNOWN unit** — sources say both "৳42/kW" and "৳42/kVA". kW and kVA differ by power factor; for residential the distinction may be nominal, for industrial it is not (§K2) |
| Meter rent | fixed monthly, by meter type & phase | **UNKNOWN** — likely utility circular, not the BERC order (§K3) |
| Service charge | fixed monthly | **UNKNOWN** — believed BREB/PBS-specific (§K3) |
| Minimum charge | greater-of against computed bill | **UNKNOWN** whether it survives in the current residential order |
| VAT | 5%, on some base | **UNKNOWN base** — energy only, or energy + demand + rent; and before or after rebate (§K4) |
| Prompt-payment rebate | 5%, conditional on payment date | **UNKNOWN base and stacking order** (§K4) |
| Prepaid rebate | 0.5%, reportedly "on net bill excluding VAT" | **UNKNOWN** — and prepaid may not be a billing period at all (§K6) |
| Late payment surcharge | %, time-conditional | **UNKNOWN** — out of V1 scope |
| Days in period | may prorate fixed charges and slab boundaries | **UNKNOWN** (§K5) |

**Every one of these ships as `UNKNOWN` until the document says otherwise.** A tariff engine that
guesses is worse than no tariff engine, because it is confidently wrong at scale — the exact
failure mode found in the incumbent in §A.

---

## E. Provenance model

Reuse the archive's discipline verbatim; it is already proven here.

- **Every rate traces to a document, and the document is stored, not linked.** BERC's own notices
  page lists a retail order from 2017 and the portal has reorganised at least once — the
  `berc.portal.gov.bd` URLs in `policies.ts` and the `berc.org.bd` ones found today are different
  hosts for the same regulator. **A URL is not preservation.** `rawGzip` + `contentSha256`, same as
  the NLDC evidence layer.
- **`verificationStatus` per order, never per project.** `UNVALIDATED` → `SOURCE_LINKED` →
  `DOCUMENT_HELD` → `FIGURES_TRANSCRIBED` → `DUAL_TRANSCRIBED`. The BPDB accounts file sets the bar:
  two independent reads must agree before a figure ships.
- **The site must render the status.** A rate transcribed from a press report is displayed as such.
  This is what `policies.ts:689` gets wrong — a correct figure with a newspaper citation, presented
  identically to one from a gazette.
- **Never repair the source.** If the order's slab table does not sum to its own stated weighted
  average, publish both and report the discrepancy. Rule 4.
- **No AI transcription without a second read.** Rates are the one dataset where a single digit is
  a fabricated figure in every bill the engine ever computes.

---

## F. Historical-version semantics

**Resolution is a pure function**, separate from calculation:

```
resolveSchedule(utility, category, meterType, onDate) → ResolvedSchedule | null
```

- `effectiveFrom` inclusive, `effectiveTo` exclusive. Open-ended = current.
- **Overlap is an error, not a preference.** Two schedules matching one key on one date throw. The
  archive learned this the expensive way: silently picking one makes the wrong answer
  unfalsifiable.
- **Amendments create a new version; they never mutate one.** A corrigendum is a new
  `TariffOrder` with `amendsOrderId` set and its own `effectiveFrom`.
- **Retroactive changes are first-class and must be visible.** `issuedOn > effectiveFrom` is
  legitimate and common — an order in June effective from the June billing cycle already announced.
  A bill computed *before* that order existed was correct then and wrong now, and the engine must
  be able to say both. `asOfKnowledge` (bitemporal) is designed for but **not built in V1** (§J).
- **Source corrections are versioned too.** A transcription error is fixed by superseding the
  version, never by editing it in place — same rule as `DataReleaseRevision`.
- **Invalidated versions are revoked, not deleted.** `revokedAt` + reason, and the resolver skips
  them. Mirrors `DataRelease`.
- **A version id is what gets locked.** A stored bill estimate keeps `versionId` and
  `engineVersion`, so a 2022 estimate is reproducible in 2030 even if both the rules and the
  arithmetic have moved. Recomputing without a locked id is how history quietly rewrites itself.
- **A billing period spanning a tariff change is split, never blended.** Two sub-periods, each with
  its own version, each computed independently, both shown. Whether the utility itself prorates
  this way is **UNKNOWN** (§K5) — so V1 shows the split and warns rather than asserting a total.

---

## G. Testing plan

**Golden tests over real published examples, and the engine never depends on an LLM for
arithmetic.** Every fixture is a checked-in JSON with a citation.

**Core cases**

| # | case | why |
|---|---|---|
| 1 | 0 kWh | fixed charges may still apply; must not return 0 by accident |
| 2 | 1 kWh | lowest band |
| 3 | **exactly 50** | lifeline boundary |
| 4 | **51** | the categorical-vs-telescopic discriminator (§K1). **This test is the specification.** |
| 5 | **exactly 75, 76, 200, 201, 300, 301, 400, 401, 600, 601** | every published boundary, both sides |
| 6 | 412 kWh under Mar 2022 and under Sep 2026 | the brief's own example, pinned |
| 7 | very high (5,000) | top band, no overflow |
| 8 | negative | throws |
| 9 | schedule with an `UNKNOWN` component | `total === null`, warning names the component |
| 10 | missing `sanctionedLoadKw` where demand charge applies | `total === null`, not a nil charge |

**Version and provenance cases**

| # | case |
|---|---|
| 11 | A date under each version resolves to that version — 2022, Feb 2023 (gazette), 2024, Jun 2026 (BERC order) |
| 12 | The day before and the day of each `effectiveFrom` |
| 13 | Overlapping schedules throw |
| 14 | A gap with no schedule returns null, and the caller renders "no rule held" — **never a zero bill** |
| 15 | A billing period spanning a change splits into two sub-periods |
| 16 | A revoked version is not resolved |
| 17 | An amended order supersedes on its own date, not the parent's |
| 18 | Every schedule in the rule set carries a `documentId`, `sourceUrl` and `contentSha256` — a structural test over the rule directory, like `TIER_GATED_DAILY_DIRS` |
| 19 | Every `UNKNOWN` component carries a written question |
| 20 | Recomputing a locked `versionId` after adding a newer version yields the identical result |

**Comparison and attribution**

| # | case |
|---|---|
| 21 | `compareTariffs(412, v2022, v2026)` — component-by-component, and the deltas sum to the total delta |
| 22 | Comparing a version against itself → all deltas 0, pct 0 |
| 23 | Comparing against a version with an `UNKNOWN` component → delta `null`, **never a percentage** |
| 24 | Attribution: usage + tariff + fixed + arrears + remainder **exactly reconstructs** the difference |

**Cross-source sanity** — where the June 2026 order states a weighted-average retail tariff of
Tk 10.63/kWh, the engine's own weighted average over the published consumption mix should land near
it. Disagreement is reported, not corrected. This is `verify:data`'s method applied to tariffs.

---

## H. My Energy V1 dependency map

```
1. utility/category profile   → needs: schedule dimensions (§C)          ─ blocked on engine
2. manual monthly usage entry → needs: BillInput shape only              ─ blocked on engine
3. deterministic estimate     → needs: calculateBill + one live version  ─ blocked on engine
4. bill history               → needs: user storage + locked versionId   ─ blocked on engine + §12
5. usage trend                → needs: nothing from the engine           ─ CAN SHIP FIRST
6. cost trend                 → needs: calculateBill over stored months  ─ blocked on engine
7. tariff-impact comparison   → needs: compareTariffs + ≥2 versions      ─ blocked on engine + §14
8. "why did my bill change?"  → needs: attribution (§7)                  ─ blocked on all above
```

**Only #5 is independent.** Everything else is one dependency: a resolvable, source-backed schedule
for one utility/category. That is a strong argument for the narrow V1 in §I — it unblocks seven of
eight features with a single rule card.

### Bill-change attribution — deterministic, no AI

Given two consecutive periods, decompose the difference in a **fixed order** so it is reproducible:

```
Δtotal = usage effect + tariff effect + fixed effect + arrears/adjustment + remainder
```

- **usage effect** = bill(kwh₂, versionOld) − bill(kwh₁, versionOld) — usage change at old prices
- **tariff effect** = bill(kwh₂, versionNew) − bill(kwh₂, versionOld) — price change at new usage
- **fixed effect** = change in fixed/demand/rent components, isolated
- **arrears/adjustment** = declared inputs, passed through untouched
- **remainder** = the residual against the actual bill, **always shown, never hidden**

Order matters — usage-first and tariff-first give different splits (the standard index-number
problem). Pick usage-at-old-prices, document it on the output, and keep it stable forever. A
changed convention silently rewrites every past explanation.

**The remainder is the honesty valve.** If a real bill does not reconcile, the gap is displayed as
unexplained. It must never be absorbed into a component to make the arithmetic close — that is the
same instinct as substituting a neighbouring quantity, and it is how a calculator starts inventing
charges.

---

## I. Smallest viable first implementation

**No database. No migration. No package. Files and pure functions.**

```
lib/tariff/
  types.ts          BillInput, BillResult, TariffComponent, ResolvedSchedule
  resolve.ts        resolveSchedule(utility, category, meterType, onDate)
  calculate.ts      calculateBill(input, schedule)     ← pure, no imports beyond types
  compare.ts        compareTariffs(kwh, a, b)
  attribute.ts      explainChange(periodA, periodB)
  rules/
    index.ts        loads and validates every rule file at import
    bpdb-lt-a-2022-03.json
    bpdb-lt-a-2023-02.json
    bpdb-lt-a-2024-xx.json
    bpdb-lt-a-2026-06.json
  documents/
    <sha256>.json   evidence metadata; PDFs to the media bucket, not git
lib/test/
  tariff-calculate.test.ts
  tariff-resolve.test.ts
  tariff-rules-integrity.test.ts   ← every rule cites a document
```

**Scope: one utility path (BPDB LT-A residential, postpaid, single phase), four versions.**

Why JSON files rather than tables: the rule set is small, it must be diffable in review, and a rate
change should arrive as a **pull request with the document attached** — which is a better editorial
control than a CMS form. Migrate to Prisma when the CMS needs to edit rules, not before.

**First user-visible surface: nothing consumer-facing.** Point
[live-ticker.server.ts](lib/data/grid/live-ticker.server.ts) at the real bulk-tariff version and
fix [homepage-defaults.ts:5](lib/homepage-defaults.ts#L5). That proves the provenance chain
end-to-end against a surface already built for it, closes standing item 4 in `CLAUDE.md`, and
corrects a wrong figure the site prints today — before a single bill is calculated.

---

## J. Do not build yet

- **OCR / bill scanning.** The canonical input model in §D is exactly what OCR would populate —
  `utility, category, period, kwh, sanctionedLoad, meterType` — so nothing is lost by waiting, and
  OCR against an unverified rule set produces confident nonsense twice over.
- **Bitemporal `asOfKnowledge`.** Designed for, not built. Add when a retroactive order actually
  arrives.
- **Prepaid vending logic.** A different product, not a billing period (§K6).
- **Every utility, every category.** BREB, DESCO, DPDC, NESCO, WZPDCL, and MT/HT/EHT wait for the
  BPDB LT-A path to prove out.
- **Time-of-day tariffs**, industrial power-factor penalties, net metering, late-payment surcharge.
- **A `@esb/tariff-engine` package** (§13). The repo has **no workspaces** and one `@/*` path alias.
  A monorepo is not justified by one consumer. `lib/tariff/` with a hard no-server-imports rule
  gives every benefit of a package — purity, testability, portability — at zero structural cost, and
  extracting it later is a directory move. **Enforce purity with a test**, not a convention: assert
  `calculate.ts` and `compare.ts` import nothing outside `lib/tariff/types.ts`.
- **Storing user bills.** V1 computes; it does not remember. See §12.
- **Reconstructing every tariff ever published.** §14.
- **Any return to BPDB archaeology.** Nothing found there touches tariff correctness.

---

## K. Risks and unknowns

Ranked by how much wrongness each can cause.

**K1 — Is the residential slab telescopic or categorical? `UNKNOWN`. Highest risk.**
The published table lists overlapping bands (0–50 at 4.63, 0–75 at 5.26), which only makes sense if
the lifeline is all-or-nothing. One competitor asserts strict telescopic pricing; another declines
to say. A 51-unit bill differs by ~13% between the readings, and it affects the poorest consumers —
the ones for whom the number matters most and who are most likely to dispute it. **Resolution
requires the order's own text, and possibly a real bill.** Until then the engine ships the
component as `UNKNOWN` and returns `total: null` for the affected range. **This single question
gates V1.**

**K2 — Demand charge: kW or kVA? `UNKNOWN`.** Sources say both. For residential the practical
difference may be nil; for any later commercial or industrial category it is not, and the schema
records the unit rather than assuming one.

**K3 — Meter rent and service charge may not live in the BERC order at all.** Likely per-utility
circulars, possibly varying by meter type and phase. If so, a *second* evidence stream is needed
per utility, and the ~Tk 10–40/month involved is invisible on a 412-unit bill and material on a
30-unit one.

**K4 — VAT base and rebate stacking. `UNKNOWN`.** Is 5% VAT on energy alone or on energy + demand +
rent? Does the 5% prompt-payment rebate apply before or after VAT? Is the 0.5% prepaid rebate
really "on net bill excluding VAT"? Three orderings give three different totals from identical
inputs. **This must be read off a real bill, not a rate table** — rate tables state rates, bills
state order of operations.

**K5 — Billing period length. `UNKNOWN`.** Do slab boundaries prorate for a 45-day period? Do
fixed charges? Meter-reading dates drift, and a long period pushes a consumer into a higher slab
that a proration rule might prevent. Affects historical reconstruction most.

**K6 — Prepaid is a different product.** No billing period, no due date, no prompt-payment rebate;
vending applies charges at purchase. Modelling it as postpaid-with-a-flag will misstate every
prepaid bill. Out of V1; the `meterType` dimension exists so it can be added without migration.

**K7 — Provenance decay, and it is already happening.** BERC's own notices page lists a retail
order from **2017**; the recent revisions are elsewhere or nowhere public. Two different BERC hosts
appear in this repo and in today's search results. The 2023–24 Power Division gazettes are the most
at-risk documents in scope. **This argues for acquiring and hashing documents early, even ahead of
transcribing them** — the same lesson the BPDB audit just delivered at ~4,970 days' cost.

**K8 — Authority changes across the historical range.** BERC → Power Division gazette (Feb 2023 →
Aug 2024) → BERC. The engine must attribute each version to its actual issuer. Getting this wrong
is not a rounding error; it is a factual claim about who set a price, in a country where that is a
live political question.

**K9 — Legal exposure.** A published bill calculator will be used to dispute real bills. It must
carry an unambiguous "estimate, not a bill" statement, cite its order, and — the strongest
protection — return `null` rather than a guess whenever a rule is unresolved. The engine's honesty
is its liability defence.

**K10 — Bangla-language orders.** The authentic text may be Bangla with English figures in Arabic
numerals; the repo already handles Bengali/Arabic numeral conventions in the DOCX exports. Record
`language` on the document and treat any English rendering as a translation.

---

## L. Implementation plan — after this design is reviewed

**Phase 0 — corrections, independent of everything else (hours).**
Fix the 8.95/8.39 contradiction at [homepage-defaults.ts:5](lib/homepage-defaults.ts#L5). Deduplicate
[tariff.ts](lib/data/macro/tariff.ts) against [berc.ts](lib/data/companies/berc.ts) so one series has
one copy. Neither waits for the engine; both are live wrong-or-duplicated figures.

**Phase 1 — evidence acquisition (the gating phase).**
Locate, download, hash and store: the June 2026 BERC retail order; the Feb 2023 Power Division
gazette; the intervening 2023–24 revisions; one pre-2023 BERC retail order for the March-2022
comparison. Record each as a `TariffDocument` with its real `documentType`. **Acquire before
transcribing** (§K7). If the June 2026 order cannot be located, that is the finding and Phase 2
does not start.

**Phase 2 — resolve the four blocking unknowns.**
K1 (telescopic vs categorical), K4 (VAT base and rebate order), K2 (kW vs kVA), K3 (meter rent
source). From the order text where possible; from a real bill where the order is silent. **Anything
still unresolved ships as `UNKNOWN`, and the engine returns `null` rather than a number.**

**Phase 3 — the pure core.** `types` → `calculate` → `resolve`, with the golden tests of §G written
**before** the implementation. The `Number('') === 0` bug in the NLDC parser was found only because
a regression test existed first; slab arithmetic has the same shape of silent-zero failure.

**Phase 4 — comparison and attribution.** `compareTariffs`, then `explainChange`. Both pure, both
mirroring `changeOf`'s null contract from [comparison.ts:460](lib/data/grid/comparison.ts#L460).

**Phase 5 — first surface.** The bulk tariff in the commodities strip, sourced properly. No
consumer calculator yet.

**Phase 6 — journalism surface (§11).** A server-rendered `<TariffImpact>` component taking
`{ kwh, versionA, versionB }` and calling the same engine — **the article frontend contains no
billing logic whatsoever.** An editor writing about a tariff change embeds the component with two
version ids; the engine supplies the numbers, the provenance line and the "estimate, not a bill"
caveat. When a rule is corrected, every past article corrects with it. This is also the cheapest
possible V1 audience test.

**Phase 7 — My Energy V1**, in the §H order, starting with usage trend (which needs nothing) and
adding the estimate once Phase 3 lands.

### §12 — security and privacy

**Tariff rules are public, static, non-sensitive and aggressively cacheable.** They should be served
from the static path, revalidate on the order of a day, and never require a session. There is no
reason for a tariff rule to touch Postgres on a read.

**Personal bill data is the opposite, and the boundary must be structural, not conventional.** The
pure engine cannot leak what it cannot see: it takes numbers and returns numbers, with no user id,
no account number, no meter number, no location. Consumption history is arguably a household
occupancy trace, so if My Energy ever stores it: separate table, row-level security, no analytics
event carrying a kWh value or a meter identifier, and the same restraint already agreed for Time
Machine telemetry. **V1 stores nothing.**

---

## Verdict in one line

Build the versioned rule set now, one utility path, four versions, `UNKNOWN` wherever the document
does not speak — because the incumbent's failure is not bad arithmetic, it is having no version at
all, and that is the only part of this that is hard to copy.

**Nothing implemented.**

Sources consulted for the tariff-publication structure and competitor check:
[BERC notices](https://berc.org.bd/pages/notices/6922d992dbfbab28ce04e027) ·
[The Business Standard, June 2026 tariff](https://www.tbsnews.net/bangladesh/energy/retail-power-tariff-hiked-tk152-amid-subsidy-cuts-1453181) ·
[Dhaka Tribune, June 2026 rates](https://www.dhakatribune.com/bangladesh/power-energy/411666/how-much-does-electricity-tariff-increase-per) ·
[The Daily Star, 16.7% hike](https://www.thedailystar.net/news/bangladesh/news/power-prices-167-average-4190281) ·
[TBS, Power Division 5% hike by gazette](https://www.tbsnews.net/bangladesh/energy/retail-electricity-tariff-hiked-5-566802) ·
[Prothom Alo, tariff effective 1 Feb](https://en.prothomalo.com/bangladesh/t5ajsm3mdy) ·
[ebill.info.bd tariff table](https://ebill.info.bd/tariff) ·
[bdbillcalculator](https://bdbillcalculator.netlify.app/) ·
[BD Electricity Bill Calculator (Play Store)](https://play.google.com/store/apps/details?id=zaman.cloud.bdelectricitybillcalculator&hl=en)
