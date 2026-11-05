'use client';

/** Supply › Imports — desktop "C/B Imports" tab: KPI strip and the interconnector tracker. */

import { coverageLabel } from '@/lib/data/grid/coverage';
import { sumPeakFlowMw } from '@/lib/data/grid/border-imports';
import { fmt, Meter } from './charts';
import { usePhone } from './context';
import { fuelPalette, isNum, Prov, Row, Section } from './shared';
import { Absent, How, Pill, Ref, Tile, U, useBrief, useNote } from './supply-bits';
import { DaySlots } from './supply-slots';

export function ImportsView() {
  const { day, date } = usePhone();
  const brief = useBrief();
  const note = useNote();
  const ss = day.systemStats;
  const file = day.sourceFiles?.pgcb;
  const links = day.borderImportsData ?? [];
  const row = (day.generationData ?? []).find((g) => g.name === 'Imports');
  const importedMkwh = isNum(row?.gen) ? (row!.gen as number) : null;
  const importBill = isNum(row?.cost) ? (row!.cost as number) : null;
  const numLinks = links.filter((l) => isNum(l.energy));
  const linkSum = numLinks.reduce((a, l) => a + l.energy, 0);
  // Largest link is unknown when any link states no peak.
  const biggest = links.length && !links.some((l) => l.peakFlow == null) ? links.reduce((a, l) => ((l.peakFlow as number) > (a.peakFlow as number) ? l : a)) : null;
  const sharePct = importedMkwh != null && isNum(ss.totalEnergyGen) && ss.totalEnergyGen > 0 ? (importedMkwh / ss.totalEnergyGen) * 100 : null;
  const color = fuelPalette(day).Imports;
  const peakMax = Math.max(...links.map((l) => l.peakFlow ?? 0), 1);
  const peakSum = sumPeakFlowMw(links);
  const mk = (v: number | null, dp = 2) => (v == null ? 'not published for this day' : `${fmt(v, dp)} MKWh`);
  const ref = (part: string) => <Ref part={part} date={ss.date} file={file} url="https://pgcb.gov.bd" />;

  const bImported = () =>
    brief({
      title: 'Import Briefing',
      rows: [
        { kind: 'P', label: 'Imports, fuel-mix row:', value: mk(importedMkwh) },
        { kind: 'D', label: 'Sum of the interconnectors:', value: `${fmt(linkSum, 2)} MKWh` },
      ],
      audit: 'PGCB prints imports twice — once as a fuel-mix row and once split across the interconnectors. The headline is the fuel-mix row; the sum of the links is shown beneath it so a disagreement between the two is visible rather than resolved here.',
      ref: ref('P1 sheet — fuel mix and interconnector rows'),
    });
  const bLargest = () =>
    brief({
      title: 'Interconnector Briefing',
      rows: links.map((l) => ({ kind: 'P' as const, label: `${l.source}:`, value: `${isNum(l.peakFlow) ? `${fmt(l.peakFlow)} MW peak` : 'peak not stated'} · ${isNum(l.energy) ? fmt(l.energy, 2) : '—'} MKWh` })),
      audit: 'Each link’s peak flow is PGCB’s own figure. They are listed rather than added: the report does not state that these peaks occurred in the same hour, so a combined peak import would be a number no source supports.',
      ref: ref('P1 sheet — cross-border interconnector rows'),
    });
  const bShare = () =>
    brief({
      title: 'Dependence Briefing',
      rows: [
        { kind: 'P', label: 'Imported:', value: mk(importedMkwh) },
        { kind: 'P', label: 'Total generated:', value: isNum(ss.totalEnergyGen) ? `${fmt(ss.totalEnergyGen, 2)} MKWh` : 'not published for this day' },
      ],
      audit: 'Both figures are PGCB’s; the percentage between them is ours. It is a share of energy across the whole day, not of capacity and not of the peak hour.',
      ref: ref('P1 sheet — fuel mix and daily total'),
    });
  const bBill = () =>
    brief({
      title: 'Import Cost Briefing',
      rows: [
        { kind: 'P', label: 'Cost of imported power:', value: importBill == null ? 'not published for this day' : `${fmt(importBill / 1e7, 2)} Crore BDT` },
        { kind: 'D', label: 'Implied rate:', value: importBill != null && importedMkwh ? `${fmt(importBill / (importedMkwh * 1e6), 2)} Tk/kWh` : '—', note: 'Import bill over imported energy.' },
      ],
      audit: 'The bill is published. The implied rate is that bill over the imported energy — a blended settlement figure across every link, not a contracted tariff for any one of them, and not comparable to a per-plant rate.',
      ref: ref('P1 sheet — production-cost block'),
    });

  const nepalNote = () =>
    note('From the curve', <p style={{ marginTop: 0 }}>PGCB does not list this line in its production-cost interconnector block. Its energy and peak are computed here from the half-hourly generation curve — the half-hour MW readings summed and halved for the energy, and their maximum for the peak.</p>);

  const lineSumGap = importedMkwh != null && Math.abs(linkSum - importedMkwh) > 0.05;

  return (
    <>
      <Section title="Cross-border imports today" desc="Tap a figure for its briefing" meta={<span className="gp-tag">Daily</span>} source="PGCB daily report · P1 sheet">
        <div className="gp-stats gp-stats--first">
          <Tile label="Imported Energy" prov="P" value={importedMkwh != null ? fmt(importedMkwh, 2) : '—'} unit={importedMkwh != null ? 'MKWh' : undefined} detail={importedMkwh == null ? 'Not published for this day' : undefined} onClick={bImported} />
          <Tile label="Largest Link" prov="P" value={biggest ? fmt(Math.round(biggest.peakFlow as number)) : '—'} unit={biggest ? 'MW' : undefined} detail={biggest ? biggest.source : links.length ? 'a link’s peak is not stated' : undefined} onClick={bLargest} />
          <Tile label="Share of Generation" prov="D" note="Imported energy over the day’s published total." value={sharePct != null ? sharePct.toFixed(1) : '—'} unit={sharePct != null ? '%' : undefined} detail={isNum(ss.totalEnergyGen) ? `of ${fmt(ss.totalEnergyGen, 0)} MKWh generated` : undefined} onClick={bShare} />
          <Tile label="Import Bill" prov="P" value={importBill != null ? fmt(importBill / 1e7, 2) : '—'} unit={importBill != null ? 'Cr Tk' : undefined} detail={importBill == null ? 'Not published for this day' : undefined} onClick={bBill} />
        </div>
        <DaySlots />
      </Section>

      {links.length > 0 ? (
        <Section
          title="Cross-Border Power Imports Tracker"
          desc={<>Import allocations and power trade as filed for the day (Report: {ss.date}) · {coverageLabel('borderImports')}</>}
          meta={<span className="gp-tag">Daily</span>}
          source={<span>Source: PGCB Daily Report — P1 sheet, import stats block; Nepal from the En-Curve stack · {file ? <code style={{ fontSize: 11 }}>{file}</code> : null} · As published. Not independently audited. · Reporting period: Daily Interconnector Flow (Date: {ss.date})</span>}
        >
          <div className="gp-rows">
            {links.map((l) => {
              const nepal = /nepal/i.test(l.source);
              return (
                <Row
                  key={l.source}
                  sw={color}
                  name={<>{l.source}{nepal && <> <Pill tone="warn" onClick={nepalNote}>from curve</Pill></>}</>}
                  wrap
                  sub={<>{l.type} <Prov kind="D" note="The line’s type, as filed." /></>}
                  value={<>{fmt(l.energy, 2)} <U>MKWh</U><Prov kind={nepal ? 'D' : 'P'} note={nepal ? 'Computed from the half-hourly curve, not printed in the interconnector block.' : undefined} /></>}
                  small={isNum(l.peakFlow) ? <>{fmt(Math.round(l.peakFlow))} MW peak<Prov kind={nepal ? 'D' : 'P'} /></> : 'peak not published'}
                  meter={isNum(l.peakFlow) ? <Meter value={l.peakFlow} max={peakMax} color={color} /> : undefined}
                />
              );
            })}
            <Row
              name={<>Total Grid Imports<Prov kind="D" note="Energy and peaks summed across the lines." /></>}
              sub="National aggregate"
              value={<>{fmt(linkSum, 2)} <U>MKWh</U></>}
              small={<>{peakSum == null ? 'peak —' : `${fmt(Math.round(peakSum))} MW sum of peaks`}{importBill != null && <><br />{fmt(importBill / 1e7, 2)} Cr Tk cost<Prov kind="P" /></>}</>}
            />
          </div>
          <div className="gp-hint" style={{ textAlign: 'left' }}>Cost per line: PGCB publishes one import cost covering all interconnectors, not a figure per line. The total peak is a dash when any line states none.</div>
          <How title="Why cost is shown once, and the lines" label="Why cost is shown once, and the lines">
            <p style={{ marginTop: 0 }}>
              <b>Why cost is shown once, and no rate at all:</b> PGCB reports energy and peak flow for each interconnector, but prices imports as a single line in its production-cost table — one figure covering all of them. Bheramara, Adani Godda and Tripura are separate contracts at different prices, and the report does not say what those prices are. Dividing the one cost by the one energy would give a single average across all three, which is not the tariff of any of them, so no per-unit rate is published here.
              {importedMkwh != null && lineSumGap && <> The cost above covers the {fmt(importedMkwh, 2)} MKWh the fuel table reports, which differs from the {fmt(linkSum, 2)} MKWh these lines add up to — PGCB states import energy in two places and they do not always agree.</>}
            </p>
            <p><b>The lines:</b> Adani Cross-Border Interconnector (Godda Coal Power) provides dedicated base-load supply directly to the northern grid interface. HVDC Bheramara is the main synchronous link with the Indian National Grid (NTPC/PowerGrid).</p>
          </How>
        </Section>
      ) : (
        <Section title="Cross-Border Power Imports Tracker" source="PGCB daily report · P1 sheet">
          <Absent>PGCB’s interconnector rows are not in this day’s report, so there is nothing to list. That is the report’s gap, not a measurement of zero imports.</Absent>
        </Section>
      )}
    </>
  );
}
