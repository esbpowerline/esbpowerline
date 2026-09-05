# Tariff evidence sprint

**2026-09-05.** Four primary instruments acquired, hashed and archived. Two blocking unknowns
resolved from the documents themselves. One factual error in the design corrected and committed
separately. **Nothing implemented.**

---

## A. Corrected June 2026 chronology

**Your chronology is right and mine was wrong.** The correction is in commit `873f9240`, separate
from this report as you asked.

| when | instrument | what it did |
|---|---|---|
| **3 Jun 2026** | **BERC Order 2026/20** (bulk) and **BERC Order 2026/22** (retail), with notification memo **…26.2521** publishing the retail schedule | Raised the whole LT-A ladder, lifeline **4.63 → 5.32** and first step **5.26 → 6.18**, effective **bill month June 2026** |
| **4 Jun 2026** | **BERC Reconsideration Order 2026/01**, with notification memo **…26.2569**, titled **সংশোধন বিজ্ঞপ্তি — amendment notification** | On the distribution companies' own 4 June application, after a hearing: the two increases are **not made effective** and **4.63 / 5.26 are restored**, also from **bill month June 2026**. Bulk rates cut to cover the resulting shortfall. All other orders of 3 June stand. |

The June 4 order's own words (¶5.1): *"…the increased rates re-fixed by the order of 3 June 2026
for the residential lifeline (0-50 units) and first step (0-75 units) are not made effective and
the previous rates are restored."* Legal basis: BERC Act 2003 ss. 22(kha) and 34, **and regulation
13(3) of the BERC Electricity Distribution (Retail) Tariff Regulations 2016** — there is a named
reconsideration mechanism, and this is it being used.

**Retraction, stated plainly.** The design claimed `ebill.info.bd` was serving superseded lifeline
rates. It is not. Its residential rates carry the 4 June values and are correct, and its worked
200-unit example implements the conditional lifeline correctly too. The claim has been withdrawn
from §A of the design and the incumbent is no longer described as wrong.

**How the error happened, since it matters more than the error.** I reasoned from press coverage of
3 June — the day the increase was announced and the day the headline 16.68% was printed — and never
looked for a 4 June instrument. That is precisely the failure the design attributes to a
version-less rate table, committed by the document arguing against it.

**It also propagated into the repo's own data**, which is how I would have caught it earlier had I
followed the citation: [policies.ts:689](lib/data/policy/policies.ts#L689) states *"Tk 7.00 → Tk
8.39/kWh … lifeline Tk 4.63 → Tk 5.32"*, `asOf: 'Jun 2026'`, cited to *Dhaka Tribune*. Both halves
are 3 June values, both superseded on 4 June. Reclassified in the design from *partially reusable*
to **dangerous**.

**Two facts the corrected chronology hands the product:**

1. **For consumption of 75 units or less, the June 2026 tariff revision changed nothing at all.**
   Lifeline and first step ended the month exactly where they started.
2. **The bulk tariff moved down, not up, on 4 June.** ¶4.2: the bulk rate had to be *reduced*
   (হ্রাস) so distributors could absorb the restored retail rates, with BPDB's government subsidy
   rising to meet it. Anyone reading only the 3 June coverage has this backwards.

---

## B. Documents preserved

Archived to `W:\Grid-Explorer\BERC\tariff\`, indexed with SHA-256 at
[evidence/tariff/manifest.json](evidence/tariff/manifest.json). The PDFs are not committed — 11 MB
of scans — but the hash is, so the archived copy stays checkable against the publisher's.

| # | instrument | dated | sha256 (first 16) | text layer |
|---|---|---|---|---|
| 1 | BERC notification memo …2521 — retail schedule 2026 | 2026-06-03 | `5c7b7b6bb615d635` | no (scan) |
| 2 | DPDC bundle — the 3 June notification **plus the 4 June amendment on page 5** | 2026-06-04 | `8f0bc9b8322e897c` | no (scan) |
| 3 | **BERC Reconsideration Order 2026/01** — the full 4 June order, 10 pp., signed by the Chairman and four Members | 2026-06-04 | `f5a7c4538585f849` | no (scan) |
| 4 | **Gazette S.R.O. 43-Law/2024** — the immediately previous residential instrument | 2024-02-29 | `dcfaf4667a0081db` | **yes** |

**Two provenance findings worth more than the documents.**

**`publishedOn` is not `issuedOn`, and the gap is months.** Reconsideration Order 2026/01 is dated
**4 June 2026** on its face and appeared on berc.org.bd on **24 August 2026** — **81 days**. For
those 81 days the only public account of the decision that actually governed June bills was a
notification page and newspaper coverage. A provenance model carrying one date cannot represent
that, and the manifest carries both.

**The 4 June notification was found on DPDC's page, not BERC's.** BERC's tariff-orders index
([berc.org.bd](https://berc.org.bd/pages/static-pages/6922e034933eb65569e25fb4)) stops at **2020**,
and its 2015 links are already broken. The regulator's own order index does not reach the current
tariff. That is K7 in the design — provenance decay — observed rather than predicted.

**A third finding that validates the schema.** BERC's 2020 index shows retail orders issued **per
distribution utility** — separate DPDC, DESCO, WZPDCO, NESCO, BUBO and BAPBIBD orders — and shows
a *Correction Order* re-issued under the **same order number** three weeks after the original.
Per-utility scoping and same-number amendment are BERC's own practice, not modelling speculation.

**Not held**, listed so the gap is explicit rather than absent: **BERC Order 2026/22 and its
Appendix-খ**, which the 3 June notification names as carrying the 2026 terms, applicability and
miscellaneous charges and declares an inseparable part of the tariff; and **BERC Order 2026/20**
(bulk, 3 June).

---

## C. K4 / lifeline verdict — **Interpretation A, conditional lifeline. Evidence: primary, dual, independent.**

**Verdict: if monthly consumption exceeds 50 units, the lifeline rate does not apply to any part
of it. Billing begins at the 0–75 first step.**

Footnote 3, BERC notification of 3 June 2026:

> লাইফ লাইন (০-৫০ ইউনিট) মূল্যহারের সুবিধা লাইফ লাইন গ্রাহক ব্যতীত আবাসিক গ্রাহকশ্রেণির অন্য কোনো গ্রাহক পাবেন না।
>
> *No residential consumer other than a Life Line consumer shall receive the benefit of the Life
> Line (0–50 unit) rate.*

Footnote 3, Gazette S.R.O. 43-Law/2024 of 29 February 2024:

> লাইফ লাইন (০-৫০ ইউনিট) গ্রাহকের মূল্যহারের সুবিধা আবাসিক গ্রাহক শ্রেণির অন্য কোনো গ্রাহক পাইবেন না।

**Two instruments, two years apart, two different issuers — BERC in 2026 and the Power Division in
2024 — same rule in near-identical words.** This is evidence tier 1 (official instrument), obtained
twice independently, and it is the strongest grade the design's `verificationStatus` ladder
defines. It did not need tiers 2–5.

The overlapping 0–50 / 0–75 bands are not a drafting error. They encode a **category test**: the
lifeline is a consumer class you qualify for, not a band every bill passes through.

**The boundary behaviour, computed under the current (post-4-June) schedule:**

| kWh | energy charge | working |
|---|---|---|
| 50 | **Tk 231.50** | 50 × 4.63 — lifeline applies |
| **51** | **Tk 268.26** | 51 × **5.26** — lifeline lost entirely |
| 75 | Tk 394.50 | 75 × 5.26 |
| 76 | Tk 403.00 | 75 × 5.26 + 1 × 8.50 |

**One extra unit costs Tk 36.76.** That is a published cliff at the exact boundary between the
poorest consumers and everyone else, and it is a story ESB can tell with an instrument in hand.

Under the wrong (telescopic) reading, 51 kWh computes as Tk 236.76 — **13.3% low**. That is the
size of the error the design was right to refuse to guess at.

**Steps 2–6 *are* telescopic**: 76–200, 201–300 and so on are contiguous and non-overlapping, and
`ebill.info.bd`'s 200-unit worked example (75 × 5.26 + 125 × 8.50) implements exactly that. The
overlap is unique to the lifeline row, which is why only that row needs `applicability:
CATEGORICAL`.

**K2 resolved in the same footnote block.** Footnote 2: demand is in **kW (কি.ও.)**, never kVA —
for **all LT and MT consumers it is the sanctioned load (kW)**; for HT and EHT it is
**max(recorded maximum demand, 80% of sanctioned load)**. Identical wording in the 2024 gazette.

**K3 resolved, and the answer is that it is not a tariff component.** S.R.O. 43-Law/2024 Table-2
enumerates every permitted miscellaneous fee — new-connection application, DC/RC, meter test,
meter inspection, meter installation, service-drop repair, contract amendment, prepaid card
re-issue, transformer oil test, transformer rental — and **every one is a one-off event fee. There
is no monthly meter rent and no monthly service charge**, and condition (ka) states that **no fee
or charge outside Table-2 may be imposed.** The "Tk 10–40/month meter rent" that secondary
calculators list has no basis in the instrument. Stated precisely: *not present in the instrument,
and the instrument forbids charges outside its own list.* Whether a utility bills one in practice
is a question for a real bill, not for me.

---

## D. Real bill / golden case — **not obtained. The end-to-end case is incomplete and I am not going to pretend otherwise.**

No authentic bill was acquired. What exists publicly is secondary: worked examples on calculator
sites, and a paywalled TBS explainer (HTTP 403). A Scribd upload of a DESCO bill exists and was
**not** used — it is unverifiable and carries a real customer's PII, which fails both the evidence
bar and your redaction instruction.

**What the instruments do establish, which is most of a bill:**

- energy charge — **fully resolved**, both versions, including boundary semantics
- demand charge — **fully resolved**: sanctioned load (kW) × 42.00 Tk/kW/month for residential
- meter rent / service charge — **resolved as absent**, and forbidden outside Table-2
- prepaid rebate — **0.5% on the net bill excluding VAT**, stated in ¶4 of the 3 June notification.
  The VAT-exclusive base is explicit in the document.

**What a bill is still needed for:**

- **The VAT base.** The 2024 gazette states VAT only on the **Table-2 service fees**. Neither
  instrument states VAT on the energy or demand charge — that sits in VAT law, not the tariff
  order. The universally quoted "5% on energy + demand" is plausible and unsourced here.
- **The 5% prompt-payment rebate.** Appears in no instrument I hold. Either it lives in Appendix-খ,
  or it is a utility practice, or it is calculator folklore.
- **Rounding and period proration**, which no rate table ever states.

**The golden case as far as the evidence carries it — 412 kWh, LT-A residential:**

| | Feb 2024 (S.R.O. 43/2024) | Jun 2026 (post-amendment) |
|---|---|---|
| 0–75 | 75 × 5.26 = 394.50 | 75 × 5.26 = 394.50 |
| 76–200 | 125 × 7.20 = 900.00 | 125 × 8.50 = 1,062.50 |
| 201–300 | 100 × 7.59 = 759.00 | 100 × 9.10 = 910.00 |
| 301–400 | 100 × 8.02 = 802.00 | 100 × 9.62 = 962.00 |
| 401–412 | 12 × 12.67 = 152.04 | 12 × 15.01 = 180.12 |
| **energy charge** | **Tk 3,007.54** | **Tk 3,509.12** |
| demand charge | sanctioned kW × 42.00 | sanctioned kW × 42.00 |
| VAT | **UNKNOWN** | **UNKNOWN** |
| **total** | **null** | **null** |

Energy-charge delta **+Tk 501.58, +16.68%**.

**A caution about that number, because it will mislead someone.** +16.68% is also the headline
weighted-average retail increase reported on 3 June. It is a **coincidence** — the headline was a
national average across all categories and utilities, and it was superseded on 4 June, when the
weighted average fell to about 10.40 Tk/kWh. Two numbers agreeing to two decimals for unrelated
reasons is exactly the kind of accident that gets published as validation. It is not.

**CORRECTED TWICE. The second correction matters more than the first.**

*First correction, 2026-09-05, by a golden test written during implementation.* This section
originally said a 412-unit bill was **identical** under the 3 June and 4 June instruments, on the
reasoning that the amendment touched only the two lowest steps. That is wrong: **only the lifeline
row is categorical.** The 0–75 first step is *telescopic*, so it prices the first 75 units of every
residential bill however large, and moving it 5.26 → 6.18 moved every bill above 75 units.

*Second correction, same day, on review.* The first correction then **overstated its own finding**
in two ways, and both are the same class of error as the one it was fixing — a single headline
number standing in for a schedule. It said the reconsideration reduced **every** residential bill by
Tk 69.00 "and by more than that below 75 units". Neither half is right. Below 75 units the reduction
is **smaller**, not larger, and it is not a *bill* reduction at all while VAT and rebate are UNKNOWN
and `total` is `null`.

**The actual energy-charge effect of the 4 June order relative to the 3 June order**, which is a
schedule and not a number:

| consumption | reduction in energy charge | why |
|---|---|---|
| 1–50 kWh | **Tk 0.69 × units** (Tk 34.50 at 50) | lifeline is categorical: 5.32 → 4.63 on every unit |
| 51–75 kWh | **Tk 0.92 × units** (Tk 46.92 at 51; Tk 69.00 at 75) | lifeline is lost; the first step reprices every unit, 6.18 → 5.26 |
| above 75 kWh | **exactly Tk 69.00** | the first step is capped at 75 units, so the saving stops growing |

The 51-unit consumer is the sharpest case in the table and it is the opposite of the intuition: they
save **more** than the 50-unit consumer (Tk 46.92 against Tk 34.50) despite the lifeline being
withdrawn from them, because the first step reprices all 51 units at a larger per-unit reduction.

**The defensible statement, and the only one to publish:**

> For residential consumption above 75 kWh, the June 4 reconsideration reduced the **energy-charge
> component** by exactly Tk 69 compared with the June 3 order, **before any VAT, rebate or other
> applicable billing effects.**

A 412-unit energy charge is Tk 3,578.12 as issued on 3 June and Tk 3,509.12 as governing.
`lib/test/tariff-calculate.test.ts` pins the whole schedule above, and every assertion is scoped to
`ENERGY_CHARGE_ONLY` — the change in what a household actually pays remains uncomputable while VAT
is UNKNOWN.

---

## E. ESB tariff defects corrected

**Fixed.**

| where | was | now |
|---|---|---|
| [lib/homepage-defaults.ts:5](lib/homepage-defaults.ts#L5) | `"… • New 8.95 Tk/kWh bulk tariff in effect"`, on the homepage market-pulse line | claim removed, with the reason and the real per-utility figures recorded in a comment |
| [prisma/seed.ts:448](prisma/seed.ts#L448) | the same string, seeded into production settings | same removal |
| [lib/data/companies/berc.ts](lib/data/companies/berc.ts) | 11 uncited values, header comment only | header now records that `Jun 2026: 8.39` is the 3 June weighted average superseded on 4 June, that its replacement is per-utility-per-voltage rather than a scalar, and that `Feb 2024: 7.04` conflicts with the order's stated prior of 7.00 |

**Why 8.95 could not simply be replaced with a better number:** there is no single national bulk
tariff to quote. Appendix-ক of Reconsideration Order 2026/01 fixes it **per utility and per
voltage level**:

| utility | 230 kV | 132 kV | 33 kV |
|---|---|---|---|
| BPDB distribution zones | 10.0460 | 10.0715 | 9.4115 |
| BREB (PBSs) | 10.0460 | 10.0715 | **7.1530** |
| DPDC | 10.0460 | 10.0715 | 10.0950 |
| DESCO | 10.0460 | 10.0715 | 10.0950 |
| WZPDCL | 10.0460 | 10.0715 | 8.5325 |
| NESCO | 10.0460 | 10.0715 | 8.3225 |

The 33 kV rate — where distribution actually takes supply — spans **7.15 to 10.10**. A single
scalar is not a rounding of that; it is a different kind of quantity. **8.95 matched nothing**, and
`8.39` is a weighted average that governed for one day. Retail behaves the same way: ¶5.3 fixes the
post-amendment weighted-average **retail** tariff per utility at BPDB 11.14, BREB 9.64, DPDC 11.89,
DESCO 12.05, WZPDCL 10.44, NESCO 10.45 — a Tk 2.41 spread that a national figure erases.

**Deliberately not fixed, and flagged.** The rest of that market-pulse string — *"LNG spot firming
• Solar module prices -2.1% WoW • BDT volatility impacting IPP margins • Coal API2 steady at
$102"* — is hand-written, uncited, and ships on the homepage. It is the same class of specimen data
already deleted from `LiveMarketTicker` for being "neither derived nor published". I left it
because you scoped this edit to the tariff defect, but it is a live defect of the same kind and it
wants its own decision.

**Hand-typed tariff values that the engine will replace**, recorded now so the list is not
rediscovered later:

| file | what | fate |
|---|---|---|
| `lib/data/companies/berc.ts` | 11 bulk-tariff rows | replaced by versioned bulk schedules per utility × voltage |
| `lib/data/macro/tariff.ts` | the same 11 values re-typed, plus an uncited `cost` column | the tariff half deleted; the cost column needs its own source |
| `lib/data/policy/policies.ts:689` | Jun 2026 bulk + lifeline, from a newspaper | replaced by the two instruments, or corrected in place before that |
| `lib/data/macro/economics.ts`, `fuel-prices.ts` | retail diesel/octane, exchange rates, `0.0` standing in for absent LNG and coal | out of tariff scope; the zeros are a standing rule-1 violation |

---

## F. Updated amendment / version model

The June 3 → June 4 sequence is now the model's specification, and it broke my first draft. Both
instruments carry the **same `effectiveFrom`** — bill month June 2026. Date ranges alone cannot
order them.

### The two questions must be separate fields, not one status

You put it exactly right: *validly issued* is not *governs this calculation*. The 3 June lifeline
rate of 5.32 was lawfully made, published, reported nationally, and **governed no bill ever**.

**Recommended minimal representation — two layers, and one of them is derived, not stored.**

**Layer 1: document lifecycle**, on `TariffDocument`. Five states, exactly your list:

```
ISSUED       lawfully made; says nothing about whether it governs
IN_FORCE     at least one of its rules currently resolves
AMENDED      partly changed by a later instrument; the rest still stands
SUPERSEDED   wholly replaced by a later instrument
WITHDRAWN    revoked by its issuer
```

with `amends`, `supersedes`, `withdraws`, `repeals` as typed edges to another document id. The 3
June retail order is **AMENDED** by the 4 June order — not WITHDRAWN and not SUPERSEDED, because
¶5.7 preserves everything else it said. The 2024 gazette is **SUPERSEDED**, and it in turn
**repeals** S.R.O. 9-Law/2023, which the document says in its own clause 3.

**Drop `CURRENT`.** It is the one state in your list that must not be stored: it is a function of
today's date, it goes stale silently, and two rows claiming it is a corruption with no detectable
symptom. Derive it.

**Layer 2: rule-version validity**, on each `TariffComponentVersion` — *not* on the document,
because a document amends individual rules. `effectiveFrom`, `effectiveTo`, `documentId`,
`supersededByVersionId`.

**And then the whole June 3 → June 4 problem dissolves into one line:** the 4 June order sets the 3
June lifeline version's `effectiveTo` **equal to its `effectiveFrom`**. A zero-length interval *is*
"validly issued, never governed" — it can never match a resolution query, it needs no special state,
and it is fully preserved and queryable. Nothing is deleted; the historical claim survives with its
document, its hearing and its signatures intact.

```
resolveApplicableTariff(utility, category, meterType, billingPeriod, asOf?) → ResolvedSchedule | null
```

Deterministic, with these rules:

1. Select component versions where `effectiveFrom <= period` and (`effectiveTo` is null or
   `effectiveTo > period`). **A zero-length version is excluded by construction.**
2. If `asOf` is given, additionally require `document.publishedOn <= asOf` — bitemporal.
3. **More than one surviving version for one key is an error, not a preference.** Throw. Silently
   picking one is how a wrong answer becomes unfalsifiable.
4. Zero surviving versions returns `null`. The caller renders "no rule held" — **never a zero bill**.
5. A billing period spanning a change is split, never blended.

**`asOf` earns its place because of the 81-day publication lag.** On 1 July 2026 the 4 June order
was not public; a bill computed then rested on a notification and press reports. `asOf('2026-07-01')`
must be able to say what ESB could have known, distinctly from what was true. That is the difference
between an archive and a rewrite.

### Golden version-resolution tests (added to §G of the design)

| # | case | expected |
|---|---|---|
| V1 | resolve LT-A lifeline for June 2026 | **4.63**, from Reconsideration Order 2026/01 |
| V2 | resolve LT-A lifeline for May 2026 | **4.63**, from S.R.O. 43-Law/2024 |
| V3 | resolve LT-A **second step** for June 2026 | **8.50**, from Order 2026/22 — *the amended document still governs the rows it was not amended in* |
| V4 | the 3 June lifeline version (5.32) | resolves for **no** period, and is still readable with its document and issue date |
| V5 | `asOf('2026-06-03')` for June 2026 | **5.32** — what was knowable that day |
| V6 | `asOf('2026-07-01')` for June 2026 | **4.63** |
| V7 | two overlapping non-zero-length versions | throws |
| V8 | ≤ 75 units, June 2026 vs May 2026 | **zero difference** across the revision |
| V9 | 51 units, June 2026 | 268.26, not 236.76 — the categorical lifeline |
| V10 | 412 units, 3 June vs 4 June instrument | **identical** |

---

## G. V1 scope now justified

**Verdict: PARTIALLY READY.**

Not READY, and I am not going to force it: the VAT base is not established by any instrument held,
so a **bill total** cannot be computed honestly. Not NOT READY either — that would be false, because
the version layer and the largest bill component are now fully source-backed by primary documents.

**What is justified to build now:**

- The full version/provenance layer — documents, lineage edges, component versions, zero-length
  intervals, `resolveApplicableTariff` with `asOf`, and every V-test above.
- **`energyCharge`** for LT-A residential, both versions, with `CATEGORICAL` lifeline. Primary,
  dual-sourced, boundary-tested.
- **`demandCharge`** for LT and MT — sanctioned load (kW) × the schedule rate. Primary, dual-sourced.
- `compareTariffs` and `explainChange` over the energy charge. **These need no VAT**, and they are
  the features that actually differentiate: the tariff-impact comparison and the deterministic
  "why did my bill change" both operate on energy charge.
- Journalism surface: *"75 units or less: your June bill did not change"* is publishable today.

**What ships `UNKNOWN`, making `total` null:** VAT, prompt-payment rebate, rounding, proration.
This is exactly the shape the design specified — components computed, total withheld, warnings
naming what is missing — and it is now a real instance rather than a hypothetical one.

**A product note that surprised me:** the energy charge is ~97% of a residential bill, and the two
headline features need only that. A `total: null` product is more useful here than it sounds.

---

## H. Unresolved questions

**H1 — BERC Order 2026/22, Appendix-খ. The single highest-value missing document.** The 3 June
notification names it as fixing the 2026 terms, applicability and miscellaneous charges/fees and
declares it an inseparable part of the tariff. It is the 2026 counterpart of the 2024 Table-2, and
it plausibly settles VAT and the prompt-payment rebate. It is not on BERC's tariff-orders page,
which stops at 2020. **Next step: a written request to BERC, or the Power Division, which the 2024
gazette names as the final authority on interpretation.**

**H2 — The VAT base.** Not in either instrument for energy or demand. It belongs to VAT law
(NBR), not the tariff order, which means the evidence chain for a bill total runs through a
*second* regulator. Needs an NBR instrument or a real bill.

**H3 — The 5% prompt-payment rebate.** In no instrument held. Instrument, utility practice, or
folklore — unknown which.

**H4 — A real bill, still.** The one thing rate tables structurally cannot give: order of
operations, rounding, and what utilities actually print. **The cheapest honest route is to ask a
colleague for their own DESCO or DPDC bill and redact it** — no PII in fixtures, as you said.

**H5 — Prepaid is a different product.** ¶4 gives prepaid consumers 0.5% on the net bill excluding
VAT, but prepaid vending has no billing period and no due date. Out of V1.

**H6 — BREB/PBS carve-outs are real, not theoretical.** Footnote 3 of the 2024 gazette exempts
PBSs whose lifeline rate already exceeds 4.63; footnote 7 bills PBS consumption entirely at the
MT-5 rate. The `utility` dimension is load-bearing from the first row.

**H7 — Bill-month semantics.** Every instrument says "effective from **bill month** June 2026", not
from a date. A bill month is a utility's reading cycle, not a calendar month, and cycles differ.
The design's `billingPeriod: {from, to}` is right; what a "bill month" resolves to per utility is
not yet established.

**H8 — 7.04 vs 7.00.** `berc.ts` says the Feb 2024 bulk tariff was 7.04; the June 2026 order states
the prior value as 7.00. Four paisa, no document either way. Resolvable once Order 2026/20 or its
2024 predecessor is held.

---

## I. Implementation recommendation

**Build the version layer and the energy + demand components now. Hold the total.**

Order, and it is deliberately front-loaded on the thing that is now fully evidenced:

1. **`lib/tariff/` types and `resolveApplicableTariff`**, with the two-layer model of §F and all ten
   V-tests written **before** the implementation. The zero-length-interval trick is the whole
   design; test it first.
2. **Two rule files** — `bpdb-lt-a-2024-02.json` (S.R.O. 43/2024) and `bpdb-lt-a-2026-06.json`
   (Order 2026/22 as amended by Reconsideration Order 2026/01) — each citing its document id and
   sha256 from the manifest, each transcribed **twice independently** before it ships, per the
   `bpdb-annual-accounts.ts` bar.
3. **`calculateBill`** with `energyCharge` and `demandCharge` live and `vat` / `rebate` as
   `UNKNOWN` components, so `total` is `null` and the warnings name why.
4. **`compareTariffs` and `explainChange`** over the energy charge.
5. **In parallel, and not blocking**: pursue H1 and H4. The moment Appendix-খ or a real bill lands,
   VAT becomes a component and `total` becomes a number, with no change to anything above it.

**One thing to do before any of that**, because it is a live wrong figure on a published page and
takes minutes: correct or annotate [policies.ts:689](lib/data/policy/policies.ts#L689). It currently
tells readers the lifeline rate rose to 5.32.

**Not started, per your instruction:** the engine itself, OCR, My Energy UI, payments, forecasting,
standalone app, knowledge graph, tenders, ESB Intelligence. **No return to BPDB.**

---

### Sprint summary

| | |
|---|---|
| chronology | **corrected**; `ebill.info.bd` claim **retracted**, committed separately as `873f9240` |
| instruments acquired | **4**, hashed, archived to W:, indexed in `evidence/tariff/manifest.json` |
| K4 lifeline | **RESOLVED — conditional (Interpretation A)**, two primary instruments, two years apart |
| K2 demand basis | **RESOLVED — sanctioned load in kW**, not kVA |
| K3 meter rent | **RESOLVED — not a tariff component**, and charges outside Table-2 are forbidden |
| real bill | **not obtained** — the total stays `null` |
| ESB defects fixed | 8.95 claim removed from homepage defaults and production seed; `berc.ts` annotated |
| verdict | **PARTIALLY READY** |

**Nothing implemented.**
