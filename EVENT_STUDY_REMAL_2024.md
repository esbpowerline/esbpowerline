# Event study: the R-LNG line after Cyclone Remal (2024) — evidence pass

**2026-09-13.** The Phase-1 pass for the second event study, done before any framing, as
`ANALYSIS_EVENT_STUDY_2026-09.md` §5 requires. Every archive figure below was read from
`public/data/**` on this date; nothing was fetched from a publisher, estimated or modified.
External reporting is in `evidence/events/remal-2024/external-coverage.json`, each item with
the basis for its date.

The two findings that bound the page:

1. **The archive names the cyclone, but never ties it to gas.** PGCB's outage log cites
   "Cyclone Remal" for three 132 kV transmission trips at Barishal (26 and 28 May). No
   Petrobangla document names a terminal, a vessel or a fault anywhere in the window.
2. **Petrobangla's footnote is not evidence.** Its report carries `* RPGCL Shutdown.` in the
   remarks on nearly every gas day from April to 14 July 2024, whatever R-LNG delivered —
   1,098 MMCFD on 20 May, 243.5 on 10 July. It is a standing note, and the page must not
   read it as a report of this event.

---

## 1. The window, and why

| | range | reason |
|---|---|---|
| lead-in | 2024-05-21 .. 05-23 | three ordinary days: R-LNG 1,089.0 / 1,077.1 / 1,039.0 |
| the break | gas day 2024-05-24 | 1,039.0 → **646.7**, the first day the fall is visible in the data |
| end | 2024-10-05 | R-LNG stepped to 654.4 on 2 Oct and ~700 after; five days of the new level are inside |
| baseline | 2024-04-21 .. 05-20 | the 30 days before the lead-in |

The break is **two days before** the landfall PGCB's log records. The data shows it; the
reporting explains it (send-out slowed before the cyclone, per Gas Outlook). The page shows
both and asserts neither as the other's cause.

The baseline is not calm and is not trimmed: R-LNG dipped to 828.4 on 1 May and 818.9 on
19 May, and Petrobangla printed the terminal's capacity as 1,000 until 26 April, 1,100 after.

## 2. Series and coverage

Same series and alignment rules as the 2026 study (`PHASE1_EVENT_STUDY_FINDINGS.md` §1), with
one substitution forced by the era:

- **PGCB printed no daily energy demand or energy unserved in 2024.** The field starts in
  2025. So the shortfall is read at the evening peak — P1's *Evening Peak Demand* and *Evening
  Peak Generation* (both P, instants, printed in every era) — and the intensity series is the
  **sum of P1's nine zone load-shed rows at the evening peak hour** (D: PGCB prints the rows,
  not a total). The sum is null unless all nine rows printed a number.
- Zone tables are absent on 2024-05-21, 05-22, 05-26, 06-09, 07-18..22 and 10-04.
- **Petrobangla reports are not held for eight gas days**: 2024-07-17..22 and 07-25..26. They
  are on neither W: nor the C: archive. Petrobangla's listing today names only its 9 newest
  reports, so whether they were published was **not established**; the page says "this
  archive holds" rather than "Petrobangla filed". 18–23 July 2024 is also the national
  internet shutdown; that is context, not an explanation, and the page does not offer it.
- **No NLDC hourly load-shed exists for 2024.** That page rolls off after ~145 days and was
  first captured in April 2026 (`DEMAND_SUPPLY` starts 2026-04-22). NLDC hourly *generation*
  is held (2,920 rows in the window) but is not used here.
- **No ESB PowerLine coverage.** The newsroom's first published article is 2024-11-13.

## 3. What the numbers do

R-LNG (Petrobangla RPGCL subtotal, MMCFD, gas-day anchored):

| gas day | R-LNG | national | note |
|---|---|---|---|
| 05-21..23 | 1,089.0 / 1,077.1 / 1,039.0 | ~3,056–3,107 | lead-in |
| **05-24** | **646.7** | 2,660.3 | the break |
| 05-25 | **325.5** | 2,351.2 | window minimum until July |
| 05-26 | 663.2 | 2,691.0 | |
| 05-27 | 906.6 | 2,685.9 | the rebound |
| 05-28..29 | 805.7 / 769.9 | | |
| 05-30 .. 07-08 | **597–612** | ~2,600–2,640 | flat; three days at 754–860 on 06-08..10 |
| 07-09..11 | 455.5 / **243.5** / 252.9 | 2,253–2,464 | second dip |
| 07-12 .. 10-01 | ~550–610 | ~2,500–2,650 | flat again; 327.6 / 375.7 on 09-15..16 |
| 10-02 .. 10-05 | 654.4 → ~700–726 | ~2,650–2,710 | the step up |

Capacity: 1,100 printed on every day of the window.

The response, energy-day anchored (PGCB P1):

- Gas to power: ~1,240–1,285 MMCFD before → 1,125 (05-24), 915 (05-25), 843 (05-26),
  **469 (05-27)**, then ~950–1,000 through June, ~750 on 07-10..11.
- Gas-fired generation: 166–174 GWh before → **~130–135 GWh for four months**.
- Coal generation: 75–92 GWh before → 105–134 GWh in June. It ran instead.
- 27 May, the day after landfall: evening peak demand **4,554 MW** against ~15,000 the week
  before, total generation 150.9 GWh. That is the storm's effect on load, not a gas figure.
- Zone load-shed at the evening peak (D): no Remal spike. The window's largest readings are
  1,727 MW (06-25), 1,973 MW (09-09) and 1,365–1,457 MW (06-24, 06-26); the baseline's
  largest is 1,533 MW (04-29, a heatwave). The page reports this; it does not make the
  shortfall look larger than the record shows.

## 4. The outage log, read by hand

Quoted verbatim on the page (`REMAL_2024_OUTAGE_KEYS`). Most "gas" strings in the log are
SF6 breaker gas and "storm" rows are ordinary thunderstorms, so nothing here is a count.

| energy day | row | printed reason |
|---|---|---|
| 05-26 | Barishal-Bhandaria 132 kV Ckt-1 | "Due to Bad weather, Cyclone Remal." |
| 05-26 | Barishal-Patuakhali 132 kV | "due to Cyclone Remal." |
| 05-28 | Barishal-Bhandaria 132 kV Ckt-1 | "Due to Cyclone Remal. Bad weather." |
| 07-02 | Meghnaghat Summit CCPP 335MW GT2 | "due to gas shortage." |
| 07-02 | Rampal 1320 MW unit-1 | "due to coal shortage." |
| 07-05 | Ghorashal # 5 | "due to gas shortage" |
| 07-09 | Meghnaghat CCPP (Summit) | "due to gas pressure low. …" |
| 07-11 | Meghnaghat 450 MW CCPP (MPL) GT-1 | "due to Low gas pressure for leakage at Titas gas line." |
| 07-14 | Ashuganj 420 MW CCPP (East) | "due to low gas pressure." |

"Meghnaghat Summit CCPP" is a power station owned by the same group as the Summit LNG
terminal. It is not the terminal, and the page says so beside the quote. The 11 July row
names a **different** cause, a Titas pipeline leak, and is quoted for that reason.

## 5. The reporting, and how it lines up

Placed on the dates the items themselves state (see the evidence file):

| date | reported | archive that day |
|---|---|---|
| 26 May | landfall near Mongla | PGCB log names Cyclone Remal |
| 27 May | Summit's FSRU struck ~20:10 | R-LNG 906.6 (gas day from 08:00) |
| 30 May | send-out back to 600 once damage found | R-LNG 602.9 |
| 12 Jun | vessel disconnects for a shipyard | R-LNG 603.0 |
| 11 Sep | Summit: ready to send out 500 | R-LNG 617.8; no step up until 2 Oct |

The last row matters: the operator's readiness statement and the archive's recovery are three
weeks apart. The page shows both and reconciles neither.

## 6. Decisions for Hamim

1. **Public exposure of gated days** — same question as the 2026 study's §3.1. The page shows
   headline daily figures for 2024 days the explorer gates by plan. The zone-shed sum is a
   national figure; no zone, plant, curve or field detail is shown.
2. **The design brief.** This page reuses the 2026 study's components and layout unchanged.
   `docs/DESIGN-DIRECTION.md` (2026-09-11) governs new reader-facing work; this is a template
   reuse, not a redesign, but it ships in the pre-brief visual language.
3. **Three reports could not be read** (Daily Star, TBS, Financial Express; 403). They are
   listed undated. Reading them would place the 11 July re-mooring damage on its day.
