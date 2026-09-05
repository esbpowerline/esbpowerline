# Event study, Phase 1 — what the archive shows for the 2026 gas shortfall

**2026-09-05.** Read-only. Every figure below was read from the committed archive
(`public/data/**`) or the `GridHourlyObservation` table on this date; nothing was fetched,
estimated, or modified. Scan scripts: `scratchpad/phase1_scan.py` (session scratchpad) and
`scratch/phase1-hourly-coverage.ts`. Window scanned: **2026-06-01 → 2026-08-31** (June included
deliberately — see §4, it changes the story the page may tell).

The single most important finding is in §3: **no document in this archive names an FSRU
outage.** The event the data supports is an **R-LNG supply collapse beginning on the gas day
starting 2026-07-21**, in two legs, with a measured generation and load-shed response. The page
must be framed on that, not on a cause the sources never stated.

---

## 1. The series, and where each comes from

| series | source file(s) | field | unit / alignment | window |
|---|---|---|---|---|
| National gas production | `public/data/petrobangla/daily/{d}.json` | `production.grand_total.gas_mmcfd` (accessor: `archiveGasTotal`, `petrobangla-day.server.ts:160`) | MMCFD, interval-mean | gas day 08:00 D → 08:00 D+1 |
| RPGCL R-LNG | same file | `production.subtotals[company_code=RPGCL].gas_mmcfd` (`archiveGasLng`, `:166`) | MMCFD, interval-mean | gas day |
| Gas supplied to power | `public/data/daily/{d}.json` | `systemStats.totalGasSuppliedPower` — PGCB P1's own figure, **not** Petrobangla's (see `types.ts:35` and the Gas Supply tile incident) | MMCFD, interval-mean | energy day 00:00→24:00 |
| Gas-fired generation | same file | `generationData[name='Gas'].gen` | GWh (MKWh), interval-total | energy day |
| Total generation / demand / unserved | same file | `systemStats.totalEnergyGen` / `totalEnergyDemand` / `totalEnergyUnserved` | GWh, interval-total | energy day |
| Hourly demand / supply / shed | `GridHourlyObservation`, series `DEMAND_SUPPLY` | `demandMw`, `supplyMw`, `loadShedMw` | MW, instant | hourly, NLDC |
| Workbook hourly curve | `public/data/daily/{d}.json` | `hourlyLoadData[]` (generation, loadShed, demand) | MW, instant | hourly, PGCB P4 |
| Fuel substitution + cost | `public/data/daily/{d}.json` | `generationData[]` per fuel; `totalDailyCost` (P); `avgProductionCost` (**D** — derived, `types.ts:42`) | GWh / Tk | energy day |
| Plant outages | same file | `dailyOutages[]` (time, plant, reason, full_desc) | text | energy day |

Alignment note for every chart that pairs gas with electricity: the gas day **starts at 08:00
on D** and anchors to D under the L1 rule (`observation-window.ts` header — verified against
stored figures; the evening peak falls *inside* that window). The Phase 2 module goes through
`petrobanglaGasDay()` / `pgcbEnergyDay()` and `comparable()`; nothing is hand-aligned.

## 2. What the numbers do (all REPORTED, quoted from the files)

**National gas / R-LNG (MMCFD, gas-day anchored):**

| date | grand total | R-LNG | note |
|---|---|---|---|
| 2026-07-01..16 | 2,613–2,693 | 1,014–1,055 | steady; R-LNG capacity printed 1,100 throughout |
| 2026-07-06..07 | 2,534 / 2,393 | 907 / 761 | brief dip, recovered by 07-08 |
| 2026-07-17..20 | 2,616–2,640 | 966–994 | slight easing |
| **2026-07-21** | **2,265 (−375)** | **621.6 (−371.9)** | **the break. Day-on-day loss is entirely the R-LNG line** |
| 2026-07-22..08-01 | 2,119–2,218 | 468–566, then **500.7–501.1 for 07-25..08-01** | eight consecutive days within 0.4 MMCFD of 500 — that flatness is what the documents print; the archive holds no explanation for it |
| 2026-08-06..09 | 2,343–2,375 | 722–749 | partial recovery |
| **2026-08-13..14** | **1,931 / 1,922 — the window minimum** | **300.2 / 300.5** | second, deeper leg |
| 2026-08-15 | 2,418 | 803.8 | recovery step |
| 2026-08-16..31 | 2,175–2,381 | 543–753 | never back to the ~1,040 July baseline |

**The response chain (energy-day anchored):**

- Gas to power (PGCB P1): 971→927 through 07-20, then 858 (07-21), 751 (07-22), bottoming
  ~651–699 (07-25..08-09), back to ~931 on 08-13.
- Gas-fired generation: 130–137 GWh (early July) → 121.2 (07-21) → 104.0 (07-22) → 87–95
  (07-24..08-09) → 121.2 (08-13) → 118–129 thereafter.
- Substitution: HFO rose from ~30 GWh (07-01) to 43–54 GWh (late July–August); coal roughly
  flat; `totalDailyCost` 2.30bn Tk (07-01) → 2.63bn (07-29); derived avg cost 6.33 → 7.69
  Tk/kWh (mark **D**).
- Energy unserved (GWh/day): 2–12 through 07-24 → 13.7 (07-25) → 23.9 (07-26) → 43.3 (07-29)
  → 52–65 (08-01..04) → **71.8 on 08-09**, 69.5 (08-10) → easing to 14–30 mid-Aug → a second
  peak 57–71.5 on 08-27..31.
- NLDC hourly peak shed: 3,757 MW on 08-10; > 3,500 MW on 08-03, 08-08..12, 08-27, 08-29..31.

**Dates the shift first shows, per series** (the brief's question 2):

| series | first visible | evidence |
|---|---|---|
| R-LNG / national gas | **gas day 2026-07-21** | −372 MMCFD day-on-day, all on the RPGCL line |
| gas to power / gas generation | energy day 2026-07-21 (slight) / **2026-07-22** (clear) | −68 then −107 MMCFD; −17 GWh on 07-22 |
| energy unserved | **2026-07-25 onward**, severe from 07-29 | 13.7 → 43.3 GWh |
| production cost | late July | 6.3 → 7.7 Tk/kWh (derived) |

So "the crisis began around 21 July" is supported for **gas supply** — and the archive shows
shedding responding with a 4–8 day lag, which the page can show but must not explain beyond
the numbers.

## 3. What the archive does NOT say — this bounds the page

1. **No FSRU outage is named anywhere.** Petrobangla's daily prints one aggregated
   **"R-LNG Terminal"** row (capacity 1,100 MMCFD constant all window); it does not name
   Moheshkhali, Excelerate, Summit, or any terminal event. `remarks_shutdown_plants` in the
   window carries only garbled subtotal fragments. `meta.agent_summary` and `warnings`: no
   mention. PGCB monthly for 07/2026 and 08/2026 is **not yet in the archive**. The page may
   say "RPGCL's R-LNG supply fell from ~1,040 to ~500, then ~300 MMCFD"; it may **not** say
   "FSRU outage" as a fact, only — at most — as an editorial attribution *outside* the data
   surface, and Phase 3 should not do even that.
2. **Gas-supply-caused plant outages exist but are few and must be quoted, not counted.**
   In `dailyOutages` reasons: Sirajganj 225 MW CCPP GT+ST 07-22 ("due to extremely low gas
   pressure…"), JERA Meghnaghat 718 MW 07-23 ("due to gas shortage."), Unique Meghnaghat
   584 MW 08-14 ("due to low gas pressure."). Beware: most "gas" matches in the log are SF6
   breaker gas at substations. A regex count would fabricate a series; the page shows the
   quoted rows verbatim instead.
3. **Shedding is not uniquely a gas story in this window.** June carries its own episode —
   62.3 GWh unserved on 06-28 with national gas at ~2,687 and R-LNG at ~1,052. Any framing of
   "gas fell ⇒ shedding began" is falsified by the archive's own June; the page reports the
   two series and the signed difference, nothing causal.
4. **The Aug-9 shed peak precedes the Aug-13 gas minimum.** Unserved peaked (71.8 GWh) four
   days before the gas floor, while `maxTemp` sat at 34.2 °C. The archive cannot apportion
   demand-side vs supply-side; the page must not.
5. **On 08-13 the two publishers pull apart**: Petrobangla's window (08:00 08-13 → 08:00
   08-14) prints its minimum while PGCB's energy day 08-13 prints gas-to-power back up at 931
   MMCFD and gas generation at 121 GWh. Different windows, different measurement points — a
   reportable tension, not an error to reconcile.

## 4. Coverage and verification findings in the window

- **Files: complete; one window unresolvable.** 92/92 days in `daily/`, 92/92 in
  `petrobangla/daily/`. But **energy day 2026-06-21 resolves no gas document** under the window
  rule: `2026-06-21.json` declares `gas_day_start: 2026-06-20` and no held file declares a
  06-21 start — this is the `provenance-agreement` WARN above and sits exactly at the
  2026-06-22 file-naming flip (`observation-window.ts`). `loadPetrobanglaForEnergyDay`
  correctly returns null there, so every Petrobangla series has 29/30 baseline days and says so.
- **NLDC hourly: complete.** 2,299 rows per series over the 92 BST days (24/day + the :30
  evening-peak stamp), no day under 24 rows, zero null `loadShedMw` in `DEMAND_SUPPLY`. The
  demand series only begins 2026-04-22, but that predates the window.
- **Twelve June days have no workbook hourly sheet and null unserved/demand**: 06-02, 06-06..11,
  06-14..17, 06-20 (`hourlyLoadData` empty, `totalEnergyUnserved`/`totalEnergyDemand` null).
  None after 06-20. This is why the Phase 2 default baseline is **2026-06-21 → 2026-07-20**:
  the last 30 days before the break with full shed coverage. Note the baseline *contains* the
  June shedding episode; coverage metadata must say so, and the delta stays a signed
  difference either way (doctrine rule 6's spirit).
- **06-25..29: the grid file's own `gasProductionData` rows are the legacy all-zero form**
  (`verify:data` WARN `zero-gas`) while the *Petrobangla files for the same days carry real
  figures*. The module must read gas from `petrobangla/daily/` via
  `loadPetrobanglaForEnergyDay()` — never from the grid file's gas rows.
- **`verify:data` WARNs inside the window** (all source-side; report, never repair):
  - `hourly-balance`: nearly every day breaks `demand = generation + shedding` in the workbook
    hourly sheet (worst in window: 169 MW on 08-10).
  - `archive-self` 06-20: gas PDF prints grand total 2,694.1 vs field-row sum 2,697.4.
  - `provenance-agreement` 06-21: cited gas PDF window cannot be checked.
  - `zone-demand` WARN 08-01: zones sum 10.9% under the evening peak (trailing median 3.7%).
- **The two hourly sources disagree.** E.g. 07-31 max shed: workbook 2,238 MW vs NLDC 2,746 MW;
  07-29: 2,566 vs 2,556. Same kind of quantity, different publishers/pages. Phase 3 uses the
  NLDC canonical layer (provenanced, complete) for the hourly panel and PGCB's daily totals
  for the daily panel, and the methodology block states the disagreement exists.
- **PGCB monthly 2026-07 / 2026-08 absent** from `pgcb-monthly/` (not yet published into the
  archive) — no monthly cross-check available for the window.

## 5. Consequences for Phase 2/3 (design decisions this evidence forces)

1. **Title and framing: "The R-LNG shortfall, July–August 2026"** — not "FSRU outage". Every
   card is a publisher's series; the causal chain is the *page order*, not a claim.
2. **Chain to render:** R-LNG + national gas (Petrobangla) → gas to power (PGCB P1) →
   gas-fired vs substitute generation + cost (PGCB, avg cost marked D) → daily unserved
   (PGCB) → hourly shed (NLDC) → the quoted gas-shortage outage rows (PGCB log, verbatim).
3. **Two legs, one window**: the study window is **2026-07-21 → 2026-08-31**; baseline
   **2026-06-21 → 2026-07-20** (real days only; per-series coverage carried).
4. Deltas vs baseline are DERIVED with the formula stated (`mean(window) − mean(baseline)`
   over the days both exist, count disclosed). No percentages against null, per
   `comparison.ts`.
5. Reuse: `loadPetrobanglaForEnergyDay` / `archiveGasTotal` / `archiveGasLng`,
   `loadDailyReportFromDisk`, `Figure` (`figure.ts`), `pgcbEnergyDay` / `petrobanglaGasDay` /
   `comparable`, `gwhToAvgMw` where a GWh needs an MW reading, and the aggregation rules of
   `history-aggregate.ts` for anything hourly.
