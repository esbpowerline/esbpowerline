"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, AlertTriangle, BatteryCharging, Landmark } from "lucide-react";
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import { bpdbAuditedFinancials, BPDB_FINANCIALS_COVERAGE_NOTE } from '@/lib/data/companies/bpdb';
import {
  PETROBANGLA_STATEMENTS,
  PETROBANGLA_BALANCE_SHEET,
  PETROBANGLA_FINANCIALS_PROVENANCE,
  PETROBANGLA_LATEST,
  PETROBANGLA_PRIOR,
  croreToBillion,
} from '@/lib/data/companies/petrobangla-financials';

/*
 * Every figure on this page used to be an inline literal in this file —
 * three blocks of them, citing nothing, and disagreeing with the audited
 * accounts the rest of the site reads. The BPDB block claimed ৳277.65B of
 * FY 2022-23 revenue against ৳827.81B of cost where BPDB's own report prints
 * ৳508.58B and ৳953.86B. Both halves now come out of `lib/data`, and the two
 * halves are NOT of equal standing: BPDB's is dual-engine extracted from its
 * annual reports, Petrobangla's is held without a source document and is
 * labelled as such on the page.
 */

const bpdbChartData = bpdbAuditedFinancials.map((d) => ({
  name: d.year.replace(/^FY /, ''),
  "Revenue from Sales": d.revenue == null ? null : croreToBillion(d.revenue),
  "Total Operating Expenses": croreToBillion(d.cost),
  "Govt Subsidy": d.subsidy == null ? null : croreToBillion(d.subsidy),
  "Balance after subsidy": d.loss == null ? null : croreToBillion(d.loss),
}));

const chartData = PETROBANGLA_STATEMENTS.map((d) => ({
  name: d.shortLabel,
  Revenue: croreToBillion(d.revenueCrore),
  "Cost of Sales": croreToBillion(d.costOfSalesCrore),
  "Operating Loss": croreToBillion(d.operatingResultCrore),
  "Govt Fund (GDES)": croreToBillion(d.gdesFundCrore),
}));

const bdt = (billions: number) => `${billions < 0 ? '-' : ''}৳${Math.abs(billions).toFixed(2)}B`;

const gdesChangePct = Math.round(
  ((PETROBANGLA_LATEST.gdesFundCrore - PETROBANGLA_PRIOR.gdesFundCrore) /
    PETROBANGLA_PRIOR.gdesFundCrore) * 100,
);
const latestDeficit = PETROBANGLA_BALANCE_SHEET
  .find((r) => r.label === 'Un-appropriated Deficit')?.byYear[PETROBANGLA_LATEST.shortLabel] ?? 0;

// Billions of BDT, every one of them computed from the module above.
const kpis = [
  {
    title: `Operating Loss (${PETROBANGLA_LATEST.shortLabel})`,
    value: bdt(croreToBillion(PETROBANGLA_LATEST.operatingResultCrore)),
    trend: `Against ${bdt(croreToBillion(PETROBANGLA_PRIOR.operatingResultCrore))} in ${PETROBANGLA_PRIOR.shortLabel}`,
    icon: <TrendingDown className="text-red-500 w-6 h-6" />,
    color: "border-red-500/50 bg-red-500/10",
  },
  {
    title: "Cost of Sales vs Revenue Gap",
    value: bdt(croreToBillion(PETROBANGLA_LATEST.costOfSalesCrore - PETROBANGLA_LATEST.revenueCrore)),
    trend: "Loss on operations",
    icon: <AlertTriangle className="text-orange-500 w-6 h-6" />,
    color: "border-orange-500/50 bg-orange-500/10",
  },
  {
    title: "Gas Development Fund (GDES)",
    value: bdt(croreToBillion(PETROBANGLA_LATEST.gdesFundCrore)),
    trend: `${gdesChangePct > 0 ? '+' : ''}${gdesChangePct}% on ${PETROBANGLA_PRIOR.shortLabel}`,
    icon: <BatteryCharging className="text-teal-400 w-6 h-6" />,
    color: "border-teal-400/50 bg-teal-400/10",
  },
  {
    title: "Un-appropriated Deficit",
    value: bdt(croreToBillion(latestDeficit)),
    trend: `Balance sheet, ${PETROBANGLA_LATEST.shortLabel}`,
    icon: <Landmark className="text-purple-500 w-6 h-6" />,
    color: "border-purple-500/50 bg-purple-500/10",
  },
];

export default function FinancialsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Sector Financials
          </h1>
          <p className="text-zinc-400 mt-2">
            BPDB, FY 2016-17 to FY 2022-23 · Petrobangla, {PETROBANGLA_PRIOR.fy} and {PETROBANGLA_LATEST.fy}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-amber-200/90 border-l-2 border-amber-500/70 bg-amber-500/5 pl-3 py-2">
            <strong className="font-semibold">The two halves of this page are not equally sourced.</strong>{' '}
            BPDB&apos;s figures are read out of its own annual reports, each row naming the
            report it came from. {PETROBANGLA_FINANCIALS_PROVENANCE}
          </p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md relative overflow-hidden transition-all hover:border-zinc-600`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium">{kpi.title}</h3>
              <div className="text-3xl font-bold mt-1 tracking-tight">{kpi.value}</div>
              <div className="text-xs text-zinc-500 mt-2 font-medium">{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Main Chart Area - BPDB */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
              BPDB: Energy Sales vs Total Operating Expenses (in Billions BDT)
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bpdbChartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  {/*
                    Same gridline geometry as every other chart on the site, but
                    the stroke is this page's own zinc rather than the theme's
                    border colour. This page is deliberately dark-only — it sets
                    bg-zinc-950 and hardcodes ten other colours — so a
                    theme-aware stroke would go pale here in light mode and dim
                    to nothing in dark. Passing the ground's own neutral keeps
                    the shading identical to the themed charts as it appears.
                  */}
                  <CartesianGrid {...chartGridProps('#a1a1aa')} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Revenue from Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total Operating Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Govt Subsidy" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Balance after subsidy" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              BPDB Subsidy Dependency
            </h2>
            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <p>
                BPDB sells power for less than it costs to supply, in every year it has published. <strong>Total Operating Expenses (Orange)</strong> stands above <strong>Energy Sales (Green)</strong> throughout, and the <strong>Government Subsidy (Yellow)</strong> is what closes the gap.
              </p>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="block text-orange-400 font-bold mb-1">What the purple bar is</span>
                <strong>Balance after subsidy (Purple)</strong> is sales plus subsidy less expenses — our arithmetic, not a figure BPDB prints. It comes out <em>positive</em> in FY 2018-19, 2019-20 and 2020-21: in those years the transfer more than covered the gap. It turns sharply negative in FY 2022-23, when expenses nearly doubled.
              </div>
              <p>
                It is an operating balance only, carrying no interest and no other income, and it is blank for FY 2016-17, which printed no subsidy. {BPDB_FINANCIALS_COVERAGE_NOTE}
              </p>
            </div>
          </div>
        </div>

        {/* Main Chart Area - Petrobangla */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-2 h-6 bg-teal-500 rounded-full mr-3"></span>
              Petrobangla: Revenue vs Expenses (in Billions BDT)
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  {/*
                    Same gridline geometry as every other chart on the site, but
                    the stroke is this page's own zinc rather than the theme's
                    border colour. This page is deliberately dark-only — it sets
                    bg-zinc-950 and hardcodes ten other colours — so a
                    theme-aware stroke would go pale here in light mode and dim
                    to nothing in dark. Passing the ground's own neutral keeps
                    the shading identical to the themed charts as it appears.
                  */}
                  <CartesianGrid {...chartGridProps('#a1a1aa')} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cost of Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Govt Fund (GDES)" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              The "Circular Debt" Story
            </h2>
            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <p>
                Across {PETROBANGLA_PRIOR.shortLabel} and {PETROBANGLA_LATEST.shortLabel}, Petrobangla&apos;s revenue grew marginally while <strong>Cost of Sales</strong> stayed well above it — an operating loss of {bdt(croreToBillion(PETROBANGLA_LATEST.operatingResultCrore))} in the later year.
              </p>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="block text-red-400 font-bold mb-1">Critical Insight</span>
                Receipts into the <strong>Gas Development and Energy Security Fund</strong> rose {gdesChangePct}% between {PETROBANGLA_PRIOR.shortLabel} and {PETROBANGLA_LATEST.shortLabel}, from {bdt(croreToBillion(PETROBANGLA_PRIOR.gdesFundCrore))} to {bdt(croreToBillion(PETROBANGLA_LATEST.gdesFundCrore))}.
              </div>
              <p>
                Two consecutive years is a pair, not a trend. Read it as what those two statements said and nothing further — and against the sourcing note at the top of the page.
              </p>
            </div>
          </div>
        </div>

        {/* Balance Sheet Sneak Peek */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
          <h2 className="text-xl font-semibold mb-2">Petrobangla: Condensed Balance Sheet (in Billions BDT)</h2>
          <p className="text-xs text-zinc-500 mb-6">Held without a source document — see the note at the top of this page.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="p-4 rounded-tl-lg">Metric</th>
                  {PETROBANGLA_STATEMENTS.map((s, i) => (
                    <th key={s.shortLabel} className={`p-4${i === PETROBANGLA_STATEMENTS.length - 1 ? ' rounded-tr-lg' : ''}`}>
                      {s.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {PETROBANGLA_BALANCE_SHEET.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">{row.label}</td>
                    {PETROBANGLA_STATEMENTS.map((s, i) => {
                      const v = row.byYear[s.shortLabel];
                      const last = i === PETROBANGLA_STATEMENTS.length - 1;
                      const prev = i === 0 ? null : row.byYear[PETROBANGLA_STATEMENTS[i - 1].shortLabel];
                      // The first column is the baseline and gets no verdict; a
                      // later one is red when it is negative or moved the wrong
                      // way, green when it improved on the year before it.
                      const tone = !row.lowerIsBetter
                        ? (last ? 'font-semibold text-white' : '')
                        : v < 0
                          ? 'text-red-400'
                          : prev == null
                            ? ''
                            : v > prev
                              ? 'text-red-400'
                              : 'text-green-400';
                      return (
                        <td key={s.shortLabel} className={`p-4 tabular-nums ${tone}`}>
                          {croreToBillion(v).toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
