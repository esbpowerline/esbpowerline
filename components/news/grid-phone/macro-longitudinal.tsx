'use client';

/**
 * The longitudinal study under National Budget & Infra, drawn for the phone.
 *
 * Same dataset as the desktop (lib/data/macro/longitudinal-study), same
 * arithmetic as LongitudinalStudyCharts (LongitudinalStudy.tsx:55-105): the
 * voltage split apportioned on the last published mix, generation added as a
 * year-on-year difference, every index on FY2011 = 100. Four cards, each one
 * plot under one tapped fiscal year, the desktop tooltip as ruled rows, the
 * desktop's explanation behind an info pill and every year behind a table pill.
 */

import { useMemo } from 'react';
import { formatNumber } from '@/lib/utils';
import { longitudinalStudyData } from '@/lib/data/macro/longitudinal-study';
import { Section } from './shared';
import { A, Foot, InfoPill, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor } from './macro-kit';

type Raw = (typeof longitudinalStudyData)[number];
type Proc = Raw & {
  v400: number | null; v230: number | null; v132: number | null;
  split: boolean; genAdded: number;
  bI: number | null; tI: number | null; gI: number | null; dI: number | null;
};

const H = 168;
const n0 = (v: number | null | undefined) => (v == null ? '—' : formatNumber(v, 0));
const n1 = (v: number | null | undefined) => (v == null ? '—' : `${formatNumber(v, 1)}`);
const fy = (y: string) => `’${y.slice(-2)}`;

function useProcessed(): Proc[] {
  return useMemo(() => {
    const data = longitudinalStudyData as Raw[];
    const b = data[0];
    const baseBudget = b.Power_Division_Budget_TkCr || 4914;
    const baseTx = b.Total_Transmission_ckm || 8396;
    const baseGen = b.Installed_Generation_MW || 7296;
    const baseDem = b.Peak_Demand_MW || 4890;
    const BASE_MIX = { v400: 0.022, v230: 0.326, v132: 0.652 };
    let last: { v400: number; v230: number; v132: number } | null = null;
    return data.map((d, i) => {
      const prev = i > 0 ? data[i - 1] : null;
      const genAdded = prev && d.Installed_Generation_MW && prev.Installed_Generation_MW ? Math.max(0, d.Installed_Generation_MW - prev.Installed_Generation_MW) : 0;
      const split = d.Transmission_400kV_ckm != null && d.Transmission_230kV_ckm != null && d.Transmission_132kV_ckm != null;
      let v400 = d.Transmission_400kV_ckm as number | null, v230 = d.Transmission_230kV_ckm as number | null, v132 = d.Transmission_132kV_ckm as number | null;
      if (split) last = { v400: v400!, v230: v230!, v132: v132! };
      else if (d.Total_Transmission_ckm && last) {
        const lt = last.v400 + last.v230 + last.v132;
        const s = lt > 0 ? d.Total_Transmission_ckm / lt : 1;
        v400 = last.v400 * s; v230 = last.v230 * s; v132 = last.v132 * s;
      } else if (d.Total_Transmission_ckm) {
        v400 = d.Total_Transmission_ckm * BASE_MIX.v400; v230 = d.Total_Transmission_ckm * BASE_MIX.v230; v132 = d.Total_Transmission_ckm * BASE_MIX.v132;
      }
      return {
        ...d, v400, v230, v132, split, genAdded,
        bI: d.Power_Division_Budget_TkCr ? (d.Power_Division_Budget_TkCr / baseBudget) * 100 : null,
        tI: d.Total_Transmission_ckm ? (d.Total_Transmission_ckm / baseTx) * 100 : null,
        gI: d.Installed_Generation_MW ? (d.Installed_Generation_MW / baseGen) * 100 : null,
        dI: d.Peak_Demand_MW ? (d.Peak_Demand_MW / baseDem) * 100 : null,
      };
    });
  }, []);
}

const SPLIT_NOTE = 'PGCB publishes the 400/230/132 kV split for 6 of these 15 years. Where it is not published, the split is the published total apportioned on the last known mix.';

function Voltage({ rows }: { rows: Proc[] }) {
  const sc = useSeriesColor();
  const [i, setI] = useSel(rows.length);
  const d = rows[i];
  if (!d) return null;
  const c4 = sc('kv400'), c2 = sc('kv230'), c1 = sc('kv132');
  const k = d.split ? 'P' as const : 'D' as const;
  return (
    <Section title="Network Evolution by Voltage Level" desc="Growth of ultra-high vs high voltage transmission corridors, circuit km — tracked since FY 2011" meta="Voltage">
      <Readout kicker={`${d.Fiscal_Year} · Voltage Evolution`} value={n0(d.Total_Transmission_ckm)} unit="ckm total" sub={d.split ? 'Split as published by PGCB' : 'Split apportioned from the published total'} />
      <Plot ariaLabel="Transmission circuit km by voltage level, by fiscal year, chart" height={H} labels={rows.map((x) => fy(x.Fiscal_Year))} sel={i} onSel={setI}
        series={[{ kind: 'line', values: rows.map((x) => x.v400), color: c4, width: 2.5 }, { kind: 'line', values: rows.map((x) => x.v230), color: c2, width: 2.5 }, { kind: 'line', values: rows.map((x) => x.v132), color: c1, width: 2.5 }]} />
      <Key items={[{ label: '400kV Ultra-High', color: c4, line: true }, { label: '230kV Corridor', color: c2, line: true }, { label: '132kV Corridor', color: c1, line: true }]} />
      <div className="gpm-kvs">
        <KV label="400kV Ultra-High" prov={k} note={SPLIT_NOTE} sw={c4} value={`${n0(d.v400)} ckm`} />
        <KV label="230kV Corridor" prov={k} note={SPLIT_NOTE} sw={c2} value={`${n0(d.v230)} ckm`} />
        <KV label="132kV Corridor" prov={k} note={SPLIT_NOTE} sw={c1} value={`${n0(d.v132)} ckm`} />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="Network Evolution by Voltage Level">
          <ul>
            <li><strong>400kV (Ultra-High Voltage Backbone):</strong> The backbone transmission lines built to import electricity (e.g., cross-border interconnections) and evacuate power from mega-generation stations (e.g., Payra, Rampal, Rooppur). This was zero prior to FY2014.</li>
            <li><strong>230kV Corridor:</strong> Regional transmission corridors linking major generation hubs to city gate stations.</li>
            <li><strong>132kV Corridor:</strong> Municipal transmission corridors delivering power to distribution grids. It remains the largest network by total physical length.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> The rapid growth of 400kV lines since 2014 reflects a major structural shift toward mega-capacity corridors to handle bulk coal power plants and cross-border imports. However, the slower expansion of regional 132kV networks creates local distribution bottlenecks, preventing generated power from efficiently reaching rural and industrial endpoints.</p>
        </InfoPill>
        <TablePill title="Network evolution by voltage level" sub="Circuit km. P where PGCB published the split that year, D where it is apportioned from the published total."
          head={['Fiscal year', { label: '400kV', unit: 'ckm' }, { label: '230kV', unit: 'ckm' }, { label: '132kV', unit: 'ckm' }, { label: 'Split', text: true }]}
          rows={rows.map((x) => [x.Fiscal_Year, n0(x.v400), n0(x.v230), n0(x.v132), x.split ? 'P' : 'D'])} />
      </div>
      <Foot>
        <span>Source: <A href="https://www.pgcb.gov.bd/">PGCB Annual Progress Reports</A></span>
        <span className="gp-note">Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout.</span>
        <span>Reporting Period: FY 2011 - FY 2025</span>
      </Foot>
    </Section>
  );
}

function Buildout({ rows }: { rows: Proc[] }) {
  const sc = useSeriesColor();
  const [i, setI] = useSel(rows.length);
  const d = rows[i];
  if (!d) return null;
  const c4 = sc('kv400'), c2 = sc('kv230'), c1 = sc('kv132');
  const k = d.split ? 'P' as const : 'D' as const;
  const sum = [d.v132, d.v230, d.v400].every((v) => v != null) ? (d.v132 as number) + (d.v230 as number) + (d.v400 as number) : null;
  return (
    <Section title="Cumulative Grid Build-out" desc="Carrying capacity by voltage, stacked, circuit km — tracked since FY 2011" meta="Build-out">
      <Readout kicker={`${d.Fiscal_Year} · Cumulative Capacity`} value={n0(sum)} unit="ckm" sub="Stack: 132kV + 230kV + 400kV total circuit kilometers" />
      <Plot ariaLabel="Cumulative grid build-out by voltage, stacked, chart" height={H} labels={rows.map((x) => fy(x.Fiscal_Year))} sel={i} onSel={setI}
        series={[{ kind: 'bar', stack: 's', values: rows.map((x) => x.v132), color: c1 }, { kind: 'bar', stack: 's', values: rows.map((x) => x.v230), color: c2 }, { kind: 'bar', stack: 's', values: rows.map((x) => x.v400), color: c4 }]} />
      <Key items={[{ label: '132kV Base', color: c1 }, { label: '230kV Main', color: c2 }, { label: '400kV Ultra', color: c4 }]} />
      <div className="gpm-kvs">
        <KV label="132kV Base" prov={k} note={SPLIT_NOTE} sw={c1} value={`${n0(d.v132)} ckm`} />
        <KV label="230kV Main" prov={k} note={SPLIT_NOTE} sw={c2} value={`${n0(d.v230)} ckm`} />
        <KV label="400kV Ultra" prov={k} note={SPLIT_NOTE} sw={c4} value={`${n0(d.v400)} ckm`} />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="Cumulative Grid Build-out">
          <ul>
            <li><strong>132kV Base Grid:</strong> The regional transmission standard, delivering power to municipal substations. It remains the largest network by total physical length, starting from ~6,000 ckm in 2011.</li>
            <li><strong>230kV Main Grid:</strong> The primary inter-district transmission highway carrying medium loads between cities.</li>
            <li><strong>400kV Ultra Backbone:</strong> The modern bulk evacuation channels built since FY2014 to transport energy from remote mega power hubs and cross-border imports.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> Although the total carrying capacity has nearly doubled (from 8,396 ckm in 2011 to 15,688 ckm in 2025), the grid remains structurally fragile. The high-capacity <strong>400kV Ultra Backbone</strong> accounts for only ~20% of the total network. Over 50% of power transport is still dependent on the older, lower-voltage <strong>132kV Base Grid</strong>. This reliance on low-voltage transmission over long distances leads to high technical system losses, line overloads, and localized grid instability when major power plants trip.</p>
        </InfoPill>
      </div>
      <Foot>
        <span>Source: <A href="https://www.pgcb.gov.bd/">PGCB Transmission System Studies</A></span>
        <span className="gp-note">Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout.</span>
        <span>Reporting Period: FY 2011 - FY 2025</span>
      </Foot>
    </Section>
  );
}

function Pace({ rows }: { rows: Proc[] }) {
  const sc = useSeriesColor();
  const [i, setI] = useSel(rows.length);
  const d = rows[i];
  if (!d) return null;
  const cT = sc('kv230'), cG = sc('genCapacityAdded');
  const labels = rows.map((x) => fy(x.Fiscal_Year));
  const calc = 'Transmission Added = Total ckm (Current Year) - Total ckm (Previous Year) | Gen Capacity Added = Installed MW (Current) - Installed MW (Previous)';
  return (
    <Section title="Transmission Expansion Pace" desc="New circuit km and generation capacity added per year — tracked since FY 2011" meta="Additions">
      <div className="gp-kicker"><span>{d.Fiscal_Year} · Annual Physical Additions</span></div>
      <div className="gpm-cap"><span><i style={{ background: cT }} />Grid Lines Added</span><b>{n0(d.Transmission_Added_ckm as number | null)} ckm</b></div>
      <Plot ariaLabel="Grid lines added per year, chart" height={120} labels={labels} sel={i} onSel={setI} series={[{ kind: 'bar', values: rows.map((x) => x.Transmission_Added_ckm as number | null), color: cT }]} />
      <div className="gpm-cap"><span><i style={{ background: cG }} />Gen Cap. Added</span><b>{n0(d.genAdded)} MW</b></div>
      <Plot ariaLabel="Generation capacity added per year, chart" height={120} labels={labels} sel={i} onSel={setI} series={[{ kind: 'line', values: rows.map((x) => x.genAdded), color: cG, width: 2.5 }]} />
      <div className="gpm-kvs">
        <KV label="Grid Lines Added" prov="D" note={calc} sw={cT} value={`${n0(d.Transmission_Added_ckm as number | null)} ckm`} />
        <KV label="Gen Cap. Added" prov="D" note={calc} sw={cG} value={`${n0(d.genAdded)} MW`} />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="Transmission Expansion Pace">
          <ul>
            <li><strong>Grid Lines Added (ckm):</strong> Represents the net circuit-kilometers of transmission lines commissioned by PGCB in each fiscal year.</li>
            <li><strong>Gen Capacity Added (MW):</strong> Represents the net generation capacity added to the national grid in megawatts each fiscal year.</li>
          </ul>
          <p>{calc}</p>
          <p><strong>Analytical Insight:</strong> Comparing grid additions with generation additions exposes a massive decoupling. In peak years (e.g. FY2019 and FY2023), generation additions surged by 2,000+ MW while grid expansion remained cyclical and volatile. This structural delay forces the grid to bottleneck, stranding generation surplus at remote power hubs (like Payra and Rampal) because the corresponding transmission lines are not completed in time.</p>
        </InfoPill>
        <TablePill title="Annual physical additions" sub="Both columns derived (D): differences between PGCB/BPDB published totals."
          head={['Fiscal year', { label: 'Grid lines added', unit: 'ckm' }, { label: 'Gen cap. added', unit: 'MW' }]}
          rows={rows.map((x) => [x.Fiscal_Year, n0(x.Transmission_Added_ckm as number | null), n0(x.genAdded)])} />
      </div>
      <Foot>
        <span>Source: <A href="https://www.pgcb.gov.bd/">PGCB Project Audit Summaries</A> · PGCB &amp; BPDB Progress Reports</span>
        <span className="gp-note">Differenced here from PGCB’s published totals. PGCB publishes the totals, not the year-on-year additions.</span>
        <span>Reporting Period: FY 2012 - FY 2025</span>
      </Foot>
    </Section>
  );
}

function Indexed({ rows }: { rows: Proc[] }) {
  const sc = useSeriesColor();
  const [i, setI] = useSel(rows.length);
  const d = rows[i];
  if (!d) return null;
  const cB = sc('budgetIndex'), cG = sc('genCapacityIndex'), cD = sc('genCapacityAdded'), cT = sc('kv132');
  const calc = 'Index = (Current Value / FY2011 Value) * 100';
  return (
    <Section title="Long-term Trajectories (Indexed)" desc="Base year FY2011 = 100 for true comparative percentage growth — tracked since FY 2011" meta="FY11 = 100">
      <div className="gp-kicker"><span>{d.Fiscal_Year} · Growth Index (FY11=100)</span></div>
      <Plot ariaLabel="Budget, generation capacity, peak demand and transmission indexed to FY2011, chart" height={H} labels={rows.map((x) => fy(x.Fiscal_Year))} sel={i} onSel={setI}
        series={[{ kind: 'line', values: rows.map((x) => x.bI), color: cB, width: 2.5 }, { kind: 'line', values: rows.map((x) => x.gI), color: cG, width: 2.5 }, { kind: 'line', values: rows.map((x) => x.dI), color: cD, width: 2.5 }, { kind: 'line', values: rows.map((x) => x.tI), color: cT, width: 2 }]} />
      <div className="gpm-kvs">
        <KV label="Budget Index" prov="D" note={calc} sw={cB} value={`${n1(d.bI)}%`} />
        <KV label="Gen. Cap. Index" prov="D" note={calc} sw={cG} value={`${n1(d.gI)}%`} />
        <KV label="Peak Demand Index" prov="D" note={calc} sw={cD} value={`${n1(d.dI)}%`} />
        <KV label="Transmission Index" prov="D" note={calc} sw={cT} value={`${n1(d.tI)}%`} />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="Long-term Trajectories (Indexed)">
          <p><strong>Structural Decoupling in the Power Sector</strong></p>
          <p>This chart indexes all metrics to <strong>FY2011 = 100</strong> to compare their relative growth rates. It highlights a critical structural decoupling in Bangladesh&apos;s energy infrastructure:</p>
          <ul>
            <li><strong>Fiscal Allocation:</strong> The Power Division budget has skyrocketed by <strong>594.8%</strong>, representing massive capital injection.</li>
            <li><strong>Installed Generation:</strong> Total generation capacity has increased by <strong>380.0%</strong>, leading to substantial generation surplus.</li>
            <li><strong>Peak Demand:</strong> Peak load utilized by the grid grew by <strong>337.1%</strong>, demonstrating solid consumption demand.</li>
            <li><strong>Transmission Lines:</strong> The transmission network has lagged far behind, expanding by only <strong>186.8%</strong>. This gap explains why Bangladesh experiences load shedding and grid vulnerability despite having surplus generation capacity.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> The indexed trajectories expose a severe mismatch in asset prioritization. While the fiscal budget grew 6-fold (594.8%) and generation capacity expanded by 380.0% (closely matching peak demand growth at 337.1%), the transmission network only expanded by 186.8%. This massive divergence indicates that capital allocation was heavily diverted toward paying capacity charges for underutilized private generators and fuel import subsidies, rather than building the necessary grid infrastructure to evacuate and distribute power safely.</p>
        </InfoPill>
        <TablePill title="Growth index, FY2011 = 100" sub={`Every column derived (D). ${calc}.`}
          head={['Fiscal year', { label: 'Budget', unit: '%' }, { label: 'Gen. cap.', unit: '%' }, { label: 'Peak dem.', unit: '%' }, { label: 'Transm.', unit: '%' }]}
          rows={rows.map((x) => [x.Fiscal_Year, n1(x.bI), n1(x.gI), n1(x.dI), n1(x.tI)])} />
      </div>
      <Foot>
        <span>Source: <A href="https://www.mof.gov.bd/">MOF Budget Briefs</A> &amp; <A href="https://www.bpdb.gov.bd/">BPDB/PGCB Statistics</A></span>
        <span>As published. Not independently audited.</span>
        <span>Reporting Period: FY 2011 - FY 2025 Baseline Study</span>
      </Foot>
    </Section>
  );
}

export function MacroLongitudinal({ isTruncated, allowedYears }: { isTruncated: boolean; allowedYears: number | null }) {
  const all = useProcessed();
  // The desktop's windows (LongitudinalStudy.tsx:107-111).
  const line = all.slice(-(isTruncated ? Math.max(allowedYears ?? 2, 3) : all.length));
  const bar = all.slice(-(isTruncated ? allowedYears ?? 2 : all.length));
  return (
    <>
      <Voltage rows={line} />
      <Buildout rows={line} />
      <Pace rows={bar} />
      <Indexed rows={bar} />
    </>
  );
}
