'use client';

import type { ReactNode } from 'react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { canonicalFuelName, FUEL_DISPLAY_ORDER } from '@/lib/data/grid/chart-palette';
import { coverageLabel } from '@/lib/data/grid/coverage';
import type { GridDailyData, RegionalDemandItem, ZoneGenerationItem } from '@/lib/data/grid/types';
import { fmt, StackBar } from './charts';
import { Cite, Fact, sourceLabel, U } from './grid-common';
import { isNum, Prov, Row, Section, useSheet } from './shared';

const sev = (z: RegionalDemandItem) => (isNum(z.pct) ? z.pct : z.demand > 0 ? (z.loadShed / z.demand) * 100 : 0);
const pct1 = (n: number) => `${n.toFixed(1)}%`;
const fz = (v: number | undefined) => (v === undefined ? '—' : v === 0 ? '0' : v < 0.01 ? '<0.01' : v.toFixed(2));

function zoneStats(zones: RegionalDemandItem[]) {
  const rows = zones.filter((z) => isNum(z.demand));
  const shed = rows.reduce((a, z) => a + (isNum(z.loadShed) ? z.loadShed : 0), 0);
  const demand = rows.reduce((a, z) => a + z.demand, 0);
  const ratio = (z: RegionalDemandItem) => (z.demand ? (z.loadShed || 0) / z.demand : 0);
  const ranked = [...rows].sort((a, b) => ratio(b) - ratio(a));
  const worst = ranked.find((z) => (z.loadShed || 0) > 0) ?? null;
  const clean = rows.filter((z) => z.loadShed === 0);
  return { rows, shed, demand, ranked, worst, clean, gridPct: demand > 0 ? (shed / demand) * 100 : null };
}

function fuelColumns(rows: ZoneGenerationItem[]): string[] {
  const order = FUEL_DISPLAY_ORDER as readonly string[];
  const rank = (n: string) => {
    const i = order.indexOf(canonicalFuelName(n));
    return i === -1 ? order.length : i;
  };
  return Array.from(new Set(rows.flatMap((z) => Object.keys(z.fuels)))).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/* ───────────────────────── KPI strip ───────────────────────── */

export function ZoneKpis({ day }: { day: GridDailyData }) {
  const open = useSheet();
  const s = zoneStats(day.regionalDemandData ?? []);
  const cite = <Cite day={day} part={sourceLabel(day)} />;
  const tiles: { key: string; label: string; k: 'P' | 'D'; note: string; value: string; unit?: string; hint?: string; sheet: () => ReactNode }[] = [
    {
      key: 'n', label: 'Zones reporting', k: 'P', note: 'The number of zone rows the report prints.', value: String(s.rows.length), hint: 'at the evening peak',
      sheet: () => (
        <>
          <h3>Coverage briefing</h3>
          <dl className="gz-dl" style={{ marginTop: 12 }}>
            <Fact k="P" label="Zones in the table" value={s.rows.length} />
            <Fact k="D" label="Demand across them" value={<>{fmt(Math.round(s.demand))} <U>MW</U></>} note="Sum of the zone demand figures." />
          </dl>
          <p className="gz-audit">A count of the rows this day’s zone table prints. Zones the report omits are absent here rather than shown at zero.</p>
          {cite}
        </>
      ),
    },
    {
      key: 's', label: 'Load shed, all zones', k: 'D', note: 'Our sum of the published zone load-shed figures.', value: fmt(Math.round(s.shed)), unit: 'MW',
      sheet: () => (
        <>
          <h3>Shedding briefing</h3>
          <dl className="gz-dl" style={{ marginTop: 12 }}>
            <Fact k="D" label="Summed across zones" value={<>{fmt(Math.round(s.shed))} <U>MW</U></>} note="Sum of the zone load-shed figures." />
            <Fact k="D" label="Grid-wide severity" value={s.gridPct == null ? '—' : pct1(s.gridPct)} note="Summed shed over summed demand, to one decimal." />
          </dl>
          <p className="gz-audit">Each zone’s load-shed figure is published; the total is our sum of them. Every row is read at the same evening peak, so they add without mixing hours. The severity is the summed shed over the summed demand — not the average of the zone percentages, which weights a small zone like a large one.</p>
          {cite}
        </>
      ),
    },
    {
      key: 'w', label: 'Worst-hit zone', k: 'D', note: 'The zone with the highest shed over its own demand — a ranking made here.', value: s.worst ? s.worst.zone : '—',
      hint: s.worst && s.worst.demand ? `${pct1((s.worst.loadShed / s.worst.demand) * 100)} of its demand unserved` : undefined,
      sheet: () => (
        <>
          <h3>Severity briefing</h3>
          <dl className="gz-dl" style={{ marginTop: 12 }}>
            {s.ranked.slice(0, 4).map((z) => (
              <Fact key={z.zone} k="D" label={z.zone} note="Shed over this zone’s demand, ranked here." value={z.demand ? `${pct1(((z.loadShed || 0) / z.demand) * 100)} · ${fmt(Math.round(z.loadShed || 0))} MW` : '—'} />
            ))}
          </dl>
          <p className="gz-audit">Ranked by shed over that zone’s own demand, so it names where the shortage bit hardest rather than where the most megawatts were cut. Both inputs are published; the ratio and the ranking are ours.</p>
          {cite}
        </>
      ),
    },
    {
      key: 'c', label: 'Zones unaffected', k: 'D', note: 'Zones whose published load-shed cell is zero, counted here.', value: `${s.clean.length} of ${s.rows.length}`,
      hint: s.clean.length ? s.clean.map((z) => z.zone).join(', ') : 'every zone shed load',
      sheet: () => (
        <>
          <h3>Unaffected zones</h3>
          {s.clean.length ? (
            <dl className="gz-dl" style={{ marginTop: 12 }}>
              {s.clean.map((z) => <Fact key={z.zone} k="P" label={z.zone} value="0 MW shed" />)}
            </dl>
          ) : (
            <p className="gz-audit">Every zone in this day’s table shed some load.</p>
          )}
          <p className="gz-audit">Counts the rows whose published load-shed cell is zero. A zone missing from the table is not counted as unaffected — it is simply not reported.</p>
          {cite}
        </>
      ),
    },
  ];
  return (
    <Section title="Zones at the evening peak" desc="Tap a figure for its briefing">
      <div className="gp-stats gp-stats--first">
        {tiles.map((t) => (
          <div key={t.key} className="gp-stat gz-tile" role="button" tabIndex={0} onClick={() => open(t.sheet())} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(t.sheet())}>
            <div className="gp-stat__l">{t.label}<Prov kind={t.k} note={t.note} /></div>
            <div className="gp-stat__v"><b>{t.value}</b>{t.unit && <small>{t.unit}</small>}</div>
            {t.hint && <div className="gp-stat__d">{t.hint}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────── Zone demand & shedding ───────────────────────── */

function ZoneSheet({ day, z, s }: { day: GridDailyData; z: RegionalDemandItem; s: ReturnType<typeof zoneStats> }) {
  const theme = useChartTheme();
  const gen = (day.zoneGenerationData ?? []).find((g) => g.zone === z.zone);
  const fuels = gen ? fuelColumns([gen]) : [];
  const derived = day.regionalDemandSource === 'derived-served-plus-shed';
  return (
    <>
      <h3>{z.zone}</h3>
      <p className="gp-sheet__sub">Evening peak · {day.systemStats.date}</p>
      <dl className="gz-dl">
        <Fact k={derived ? 'D' : 'P'} label="Evening demand" value={<>{fmt(z.demand)} <U>MW</U></>} note={derived ? 'Reconstructed as area served plus load-shed.' : undefined} />
        <Fact k="P" label="Load-shedding" value={<>{fmt(z.loadShed)} <U>MW</U></>} />
        <Fact k="D" label="Shedding severity" value={!isNum(z.loadShed) ? 'not stated' : z.loadShed > 0 ? pct1(sev(z)) : 'Clean (0%)'} note="Load-shed ÷ demand × 100, to one decimal." />
        <Fact k="D" label="Share of grid demand" value={s.demand > 0 ? pct1((z.demand / s.demand) * 100) : '—'} note="This zone’s demand over the sum of all zones’ demand." />
        {s.shed > 0 && <Fact k="D" label="Share of all shed" value={pct1(((z.loadShed || 0) / s.shed) * 100)} note="This zone’s shed over the sum of all zones’ shed." />}
      </dl>
      <div className="gz-sheet-h">Generation by fuel in this zone · full day</div>
      {gen ? (
        <>
          <StackBar parts={fuels.map((f) => ({ key: f, value: gen.fuels[f] ?? 0, color: theme.fuel(f) }))} height={10} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {fuels.map((f) => (
              <Row key={f} sw={theme.fuel(f)} name={f} value={<>{fz(gen.fuels[f])} <U>MKWh</U></>} />
            ))}
            <Row name={<b>Zone total</b>} value={<>{gen.total.toFixed(2)} <U>MKWh</U></>} small="published" />
          </div>
          <p className="gz-audit">Energy generated inside the zone, not delivered to it. Demand above is a MW reading at the evening peak and generation is MKWh over the day, so the two are not compared.</p>
        </>
      ) : (
        <p className="gz-audit">This day’s report prints no generation row for {z.zone}.</p>
      )}
    </>
  );
}

export function ZoneDemand({ day }: { day: GridDailyData }) {
  const open = useSheet();
  const src = day.regionalDemandSource;
  const all = day.regionalDemandData ?? [];
  const s = zoneStats(all);
  const bpdb = src === 'bpdb-published';
  const derived = src === 'derived-served-plus-shed';
  const stamp = bpdb ? null : day.systemStats.peakTimes?.eveningPeakDemand ?? null;
    const how = () =>
    open(
      <>
        <h3>About this table</h3>
        <p>
          {bpdb ? (
            <>
              <b>This day is BPDB’s table, not PGCB’s.</b> No PGCB report for this date is held, so the figures come from BPDB’s own published zone Demand / Supply / Load-shed table for the same evening peak — a second publisher of the same reading, checked against BPDB’s printed total. Severity and the totals row are computed here.
            </>
          ) : derived ? (
            <>On this day the demand figure is reconstructed as area served + load-shed (no local copy of PGCB’s printed Demand column yet) — a derived stand-in, not the published cell. Load-shed is PGCB’s own figure; severity and the totals row are computed here.</>
          ) : (
            <>Demand and load-shed are PGCB’s own zone table, verified cell-for-cell against the source workbooks across 2025 and 2026. Severity and the totals row are computed here.</>
          )}
        </p>
        <div className="gz-sheet-h">How severity is calculated (D)</div>
        <p>Shedding severity = that zone’s load-shed ÷ its demand × 100, to one decimal. Demand is the full figure including the shed portion, so severity is the share of demand that went unserved; the bar is drawn to the same percentage. The final row divides the summed shed by the summed demand — a grid-wide ratio, which is not the same as averaging the nine zone percentages and will read lower when shedding falls on the smaller zones. Both inputs are published; neither publisher states a severity figure.</p>
        <div className="gz-sheet-h">Source</div>
        <p>
          {bpdb ? (
            <>BPDB Daily Generation Report (misc.bpdb.gov.bd/daily-generation-archive) — zone table.</>
          ) : (
            <>PGCB Daily Report (pgcb.gov.bd) — P1 sheet, zone-wise demand and load-shed table.{day.sourceFiles?.pgcb ? <> Read from: PGCB {day.sourceFiles.pgcb}.</> : null}</>
          )}
          <br />As published. Not independently audited.
          <br />Reporting Period: Evening Peak Load (Date: {day.systemStats.date}).
          <br />{coverageLabel('regionalDemand')}.
        </p>
      </>,
    );
  return (
    <Section
      title="Demand and load-shedding by zone"
      desc={
        <>
          SCADA readings at the evening peak hour {bpdb ? 'BPDB' : 'PGCB'} reports for the day
          {stamp ? <> — <b>{stamp} hr</b><Prov kind="P" /></> : null}
        </>
      }
      meta={s.shed > 0 ? <span className="gp-tag bad">{fmt(s.shed)} MW shed</span> : <span className="gp-tag good">no shedding</span>}
    >
      <div className="gz-line">
        <span>Demand</span><Prov kind={derived ? 'D' : 'P'} note={derived ? 'Reconstructed as area served plus load-shed.' : undefined} />
        <span>· Load-shed</span><Prov kind="P" />
        <span>· Severity</span><Prov kind="D" note="Load-shed ÷ demand × 100, to one decimal." />
      </div>
      {/*
        Rebuilt for the phone 2026-11-12 ("fix the daily load shedding by Zone graph").
        The old rows drew a severity meter scaled to max(10%, worst zone), so 3.9% filled
        ~40% of the track and read as a big share; seven "Clean (0%)" rows of equal weight
        buried the two that shed. Now each zone is one bar whose length is its demand on a
        common MW scale, with the shed drawn as the red tail of that same bar at its true
        share — so a 43 MW shed on 1,094 MW looks like 4%, because it is. A zone whose
        shed cell is not published is marked "not stated", never drawn or counted as clean.
      */}
      <div className="gz-zbars" role="list">
        {all.map((z) => {
          const shed = isNum(z.loadShed) ? z.loadShed : null;
          const dem = isNum(z.demand) ? z.demand : null;
          const maxD = Math.max(1, ...all.map((r) => (isNum(r.demand) ? r.demand : 0)));
          const wPct = dem != null ? Math.max(1, (dem / maxD) * 100) : 0;
          const shedPct = dem && shed != null && shed > 0 ? Math.max(2, (shed / dem) * 100) : 0;
          return (
            <button key={z.zone} type="button" role="listitem" className={`gz-zbar${shed != null && shed > 0 ? ' is-shed' : ''}`} onClick={() => open(<ZoneSheet day={day} z={z} s={s} />)}>
              <span className="gz-zbar__name">{z.zone}</span>
              <span className="gz-zbar__dem"><b>{fmt(dem)}</b> MW</span>
              <span className="gz-zbar__track" aria-hidden>
                <span className="gz-zbar__fill" style={{ width: `${wPct}%` }}>
                  {shedPct > 0 && <span className="gz-zbar__shed" style={{ width: `${shedPct}%` }} />}
                </span>
              </span>
              <span className="gz-zbar__shedtxt">
                {shed == null ? (
                  <span className="is-nil">shed not stated</span>
                ) : shed > 0 ? (
                  <><b>{fmt(shed)} MW shed</b> · {fmt(sev(z), 1)}%</>
                ) : (
                  <span className="is-ok">0 MW shed</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="gz-ztotal">
        <div>
          <span className="gz-ztotal__l">Entire grid<Prov kind="D" note="Sums of the zone rows; the percentage is summed shed over summed demand." /></span>
          <span className="gz-ztotal__v"><b>{fmt(s.demand)}</b> MW demand</span>
        </div>
        <div>
          <span className="gz-ztotal__l">Shed · grid-wide severity</span>
          <span className="gz-ztotal__v"><b className={s.shed > 0 ? 'bad' : undefined}>{fmt(s.shed)} MW</b> · {s.gridPct == null ? '—' : `${s.gridPct.toFixed(1)}%`}</span>
        </div>
      </div>
      <div className="gz-zkey">
        <span><i className="is-dem" />Demand, common MW scale</span>
        <span><i className="is-shed" />Shed, true share of the zone</span>
      </div>
      <button type="button" className="gz-info" onClick={how}>How to read this, and the source</button>
    </Section>
  );
}

/* ───────────────────────── Zone generation by fuel ───────────────────────── */

function ZoneGenSheet({ day, z, fuels }: { day: GridDailyData; z: ZoneGenerationItem; fuels: string[] }) {
  const theme = useChartTheme();
  const d = day.regionalDemandData?.find((r) => r.zone === z.zone);
  return (
    <>
      <h3>{z.zone}</h3>
      <p className="gp-sheet__sub">Generated in the zone, full day · MKWh</p>
      <StackBar parts={fuels.map((f) => ({ key: f, value: z.fuels[f] ?? 0, color: theme.fuel(f) }))} height={10} />
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {fuels.map((f) => <Row key={f} sw={theme.fuel(f)} name={f} value={<>{fz(z.fuels[f])} <U>MKWh</U></>} />)}
        <Row name={<b>Zone total</b>} value={<>{z.total.toFixed(2)} <U>MKWh</U></>} small="published" />
      </div>
      {d && (
        <>
          <div className="gz-sheet-h">Same zone at the evening peak</div>
          <dl className="gz-dl">
            <Fact k="P" label="Demand" value={<>{fmt(d.demand)} <U>MW</U></>} />
            <Fact k="P" label="Load-shedding" value={<>{fmt(d.loadShed)} <U>MW</U></>} />
          </dl>
        </>
      )}
    </>
  );
}

export function ZoneGeneration({ day }: { day: GridDailyData }) {
  const open = useSheet();
  const theme = useChartTheme();
  const rows = day.zoneGenerationData ?? [];
  if (!rows.length) return null;
  const fuels = fuelColumns(rows);
  const natTotal = rows.reduce((a, z) => a + z.total, 0);
  const published: Record<string, number> = Object.fromEntries((day.generationData ?? []).map((g) => [g.name, g.gen]));
  const zMax = Math.max(...rows.map((z) => z.total), 1);
  const noOutput = (z: Record<string, number>) => fuels.filter((f) => z[f] === 0);

  const table = () =>
    open(
      <>
        <h3>Zone × fuel, full table</h3>
        <p className="gp-sheet__sub">MKWh over the full day · swipe sideways, zone names stay put</p>
        <div className="gz-tbl">
          <table>
            <thead>
              <tr>
                <th>Grid zone</th>
                {fuels.map((f) => <th key={f}><i style={{ background: theme.fuel(f) }} />{f}<Prov kind="P" /></th>)}
                <th>Zone total<Prov kind="P" /></th>
                <th style={{ textAlign: 'left' }}>No output</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((z) => (
                <tr key={z.zone}>
                  <td>{z.zone}</td>
                  {fuels.map((f) => <td key={f} className={z.fuels[f] === 0 ? 'is-zero' : ''}>{fz(z.fuels[f])}</td>)}
                  <td>{z.total.toFixed(2)}</td>
                  <td style={{ whiteSpace: 'normal', minWidth: 120, textAlign: 'left' }}>{noOutput(z.fuels).join(', ') || '—'}</td>
                </tr>
              ))}
              <tr className="is-total">
                <td>National total</td>
                {fuels.map((f) => <td key={f}>{fz(published[f])}</td>)}
                <td>{natTotal.toFixed(2)}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 120, textAlign: 'left' }}>{fuels.filter((f) => published[f] === 0).join(', ') || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="gz-audit">Per fuel, the National total row is PGCB’s own fuel-mix row (P). In the Zone total column it is the sum of the zone totals (D). Where the two disagree both are shown as published, neither repaired.</p>
      </>,
    );
  const how = () =>
    open(
      <>
        <h3>Every figure on this card is published (P)</h3>
        <p>PGCB prints this table zone by zone and states its own National Total row, which is the row shown here and the same one the fuel-mix chart is built from. The nine zone rows sum to it, so the two are a check on each other rather than one being derived from the other. A dash means the fuel has no column on this day’s sheet; a zero means the zone generated none. Figures under 0.01 MKWh are shown as ‘&lt;0.01’ rather than rounded to nothing.</p>
        <div className="gz-sheet-h">Source</div>
        <p>
          PGCB Daily Report — P1 sheet, zone-wise generation summary.{day.sourceFiles?.pgcb ? <> Read from: PGCB {day.sourceFiles.pgcb}.</> : null}
          <br />As published. Not independently audited.
          <br />Reporting Period: Full day (Date: {day.systemStats.date}).
          <br />{coverageLabel('fuelMix')}.
        </p>
      </>,
    );
  return (
    <Section
      title="Generation by zone and fuel"
      desc={<>Energy generated inside each zone across the full day, in MKWh <span className="gp-tag">P1</span></>}
      meta={natTotal > 0 ? <>{natTotal.toFixed(2)} MKWh<br />national<Prov kind="D" note="Sum of the zone totals; PGCB’s own National Total row is in the full table." /></> : undefined}
    >
      <div className="gp-rows">
        {rows.map((z) => {
          const top = fuels.filter((f) => (z.fuels[f] ?? 0) > 0).sort((a, b) => z.fuels[b] - z.fuels[a]).slice(0, 3);
          return (
            <Row
              key={z.zone}
              name={z.zone}
              wrap
              chevron
              sub={top.map((f) => `${f} ${fz(z.fuels[f])}`).join(' · ') || 'no output'}
              value={<>{z.total.toFixed(2)}<Prov kind="P" /></>}
              small="MKWh"
              onClick={() => open(<ZoneGenSheet day={day} z={z} fuels={fuels} />)}
              meter={
                <div style={{ gridColumn: '1 / -1', marginTop: 8, width: `${Math.max(3, (z.total / zMax) * 100)}%` }}>
                  <StackBar parts={fuels.map((f) => ({ key: f, value: z.fuels[f] ?? 0, color: theme.fuel(f) }))} height={8} />
                </div>
              }
            />
          );
        })}
      </div>
      <div className="gp-legend" style={{ marginTop: 12 }}>
        {fuels.map((f) => <span key={f}><i style={{ background: theme.fuel(f) }} />{f}</span>)}
      </div>
      <button type="button" className="gp-more" onClick={table}>Full zone × fuel table, with national total</button>
      <button type="button" className="gz-info" onClick={how}>How to read this, and the source</button>
    </Section>
  );
}
