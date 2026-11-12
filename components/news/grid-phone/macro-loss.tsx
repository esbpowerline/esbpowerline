'use client';

/**
 * Sector Glance & Losses: the twelve sector indicators (tap one for what the
 * desktop shows on hover), the distribution-loss target, and Power Cell's
 * year-wise loss series with the utilities' own figures for the tapped year.
 */

import { systemLossData } from '@/lib/data/macro/system-loss';
import { Prov, Section, useSheet } from './shared';
import { A, Foot, InfoPill, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';
import { glanceIndicators } from './macro-glance';

const pc = (v: number | null) => (v !== null ? `${v.toFixed(2)}%` : '—');
const n2 = (v: number | null) => (v !== null ? v.toFixed(2) : '—');

export function MacroLoss({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const open = useSheet();
  // Newest first in the module; everyone but full-archive readers sees five years (MacroTrendsTab.tsx:295).
  const local = win.full ? systemLossData : systemLossData.slice(0, 5);
  const data = [...local].reverse();
  const [i, setI] = useSel(data.length);
  const d = data[i];
  const cD = sc('powerBudget'), cT = sc('retailDiesel');

  return (
    <>
      <Section title="Power Sector at a Glance" desc="Official key indicators of grid capacity, consumer base, transmission, and performance. Tap one for its basis.">
        <div className="gpm-glance">
          {glanceIndicators.map((s) => (
            <button key={s.label} type="button" onClick={() => open(<><h3>{s.tooltipTitle}</h3><p className="gp-sheet__sub">{s.label}: {s.value} · {s.desc}</p><div className="gpm-prose"><p>{s.tooltipDesc}</p><div className="gpm-hl"><span>{s.highlightLabel}</span><b>{s.highlightValue}</b></div></div></>)}>
              <span className="gpm-glance__l"><s.Icon />{s.label}</span>
              <span className={`gpm-glance__v${'valueColor' in s && s.valueColor ? ' is-primary' : ''}`}>{s.value}</span>
              <span className="gpm-glance__d">{s.desc}</span>
            </button>
          ))}
        </div>
        <button type="button" className="gpm-target" onClick={() => open(<><h3>Target Distribution Loss</h3><p className="gp-sheet__sub">Distribution System Loss Target: 7.35%</p><div className="gpm-prose"><p>The official government performance contract target for utility-level power line distribution system losses (BPDB, BREB, DPDC, DESCO, WZPDCO, NESCO).</p><div className="gpm-hl"><span>Target Deadline:</span><b>June 2026</b></div></div></>)}>
          <div className="gp-kicker"><span>Distribution System Loss Target</span></div>
          <div className="gp-hero gp-hero--md"><b>7.35%</b></div>
          <div className="gp-subline">Official FY 2025-26 performance target (evaluated up to April 2026)</div>
        </button>
        <Foot>
          <span>Source: <A href="https://powerdivision.gov.bd/">Ministry of Power, Energy and Mineral Resources (Power Division)</A></span>
          <span>Figures as entered by the desk on June 14, 2026 — not refreshed automatically</span>
        </Foot>
      </Section>

      {d && (
        <Section title="Historical System Loss Trends (T&D)" desc="Long-term reduction curves in transmission, distribution, and overall system loss — Tracked since 2001" meta="As entered Sep 17, 2025">
          <Readout kicker={`FY ${d.fiscal_year} Loss Analysis · Power Cell`} tone="bad" value={`${d.total_td.toFixed(2)}%`} unit={<>Total T&amp;D Loss<Prov kind="P" /></>} />
          <Plot ariaLabel="Historical System Loss Trends (T&D), chart" labels={data.map((x) => `’${x.fiscal_year.slice(5)}`)} sel={i} onSel={setI} max={30} tick={(v) => `${v}%`}
            series={[{ kind: 'area', values: data.map((x) => x.total_td), color: 'var(--gp-bad)', width: 2.5 }, { kind: 'line', values: data.map((x) => x.distribution), color: cD }, { kind: 'line', values: data.map((x) => x.transmission), color: cT }]} />
          <Key items={[{ label: 'Total T&D Loss', color: 'var(--gp-bad)', line: true }, { label: 'Distribution Loss', color: cD, line: true }, { label: 'Transmission Loss', color: cT, line: true }]} />
          <div className="gpm-kvs">
            <KV label="Transmission Loss" prov="P" value={pc(d.transmission)} sw={cT} />
            <KV label="Distribution Loss" prov="P" value={pc(d.distribution)} sw={cD} />
            <KV label="Total T&D Loss" prov="P" value={pc(d.total_td)} sw="var(--gp-bad)" tone="bad" />
          </div>
          <p className="gpm-sub">Utility Distribution Loss · FY {d.fiscal_year}</p>
          <div className="gpm-kvs gpm-kvs--2">
            <KV label="BPDB" value={pc(d.bpdb)} />
            <KV label="REB" value={pc(d.reb)} />
            <KV label="DPDC" value={pc(d.dpdc)} />
            <KV label="DESCO" value={pc(d.desco)} />
            <KV label="WZPDCO" value={pc(d.wzpdco)} />
            <KV label="NESCO" value={pc(d.nesco)} />
          </div>
          <div className="gpm-pills">
            <InfoPill label="Overview and trends" title="Overview and Trends" sub="Historical System Loss Trends (T&D)">
              <p>Bangladesh has made significant strides in upgrading its grid performance over the last two decades. The total <strong>Transmission &amp; Distribution (T&amp;D) system loss</strong> dropped from a peak of <strong>27.97% in FY 2001-02</strong> to <strong>{systemLossData[0].total_td}% in FY {systemLossData[0].fiscal_year}</strong>.</p>
              <p>This rationalization was driven primarily by massive investments in prepaid metering, distribution substation reinforcement, and the conversion of low-voltage overhead lines to underground circuits in urban pockets. Technical transmission loss (high-voltage line resistance) has remained stable between <strong>2.6% and 4.0%</strong> during this period.</p>
            </InfoPill>
            <TablePill label="Year-wise table" title="Year-wise System Loss Statistics" sub={<>Audit-verified utility-wise and overall grid system loss records — Tracked since 2001. Distribution, Transmission and Total T&amp;D are published<Prov kind="P" />.</>}
              head={['FY', ...['BPDB', 'REB', 'DPDC', 'DESCO', 'WZPDCO', 'NESCO', 'Distribution', 'Transmission', 'Total T&D'].map((label) => ({ label, unit: '%' }))]}
              rows={local.map((x) => [x.fiscal_year, n2(x.bpdb), n2(x.reb), n2(x.dpdc), n2(x.desco), n2(x.wzpdco), n2(x.nesco), n2(x.distribution), n2(x.transmission), n2(x.total_td)])} />
          </div>
          <Foot>
            <span>Source: <A href="http://www.powercell.gov.bd/">Power Cell, Ministry of Power, Energy and Mineral Resources</A></span>
            <span className="gp-note">Every column is Power Cell&apos;s own published figure, the Total T&amp;D included — it is not our sum of the two columns beside it, and would not match one: losses compound rather than add, so 7.38% distribution and 3.04% transmission give a 10.13% total, not 10.42%.</span>
            <span>Report Period: Year-wise Consolidated Audit (FY 2002 - FY 2025)</span>
          </Foot>
        </Section>
      )}
    </>
  );
}
