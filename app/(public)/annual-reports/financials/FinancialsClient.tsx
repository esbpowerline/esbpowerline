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

const chartData = [
  {
    name: "2017",
    Revenue: 45.93,
    "Cost of Sales": 65.95,
    "Operating Loss": -20.09,
    "Govt Fund (GDES)": 50.26,
  },
  {
    name: "2018",
    Revenue: 48.25,
    "Cost of Sales": 69.07,
    "Operating Loss": -20.31,
    "Govt Fund (GDES)": 117.78,
  },
];

const bpdbChartData = [
  {
    name: "2021-22",
    "Revenue from Sales": 243.39,
    "Gen & Purchase Cost": 444.38,
    "Net Loss": -320.15,
    "Govt Subsidy": 296.58,
  },
  {
    name: "2022-23",
    "Revenue from Sales": 277.65,
    "Gen & Purchase Cost": 827.81,
    "Net Loss": -477.88,
    "Govt Subsidy": 395.34,
  },
];

// Billions of BDT
const kpis = [
  {
    title: "Operating Loss (2018)",
    value: "৳20.31B",
    trend: "Down from 2017",
    icon: <TrendingDown className="text-red-500 w-6 h-6" />,
    color: "border-red-500/50 bg-red-500/10",
  },
  {
    title: "Cost of Sales vs Revenue Gap",
    value: "৳20.82B",
    trend: "Loss on operations",
    icon: <AlertTriangle className="text-orange-500 w-6 h-6" />,
    color: "border-orange-500/50 bg-orange-500/10",
  },
  {
    title: "Gas Development Fund (GDES)",
    value: "৳117.78B",
    trend: "+134% YoY jump",
    icon: <BatteryCharging className="text-teal-400 w-6 h-6" />,
    color: "border-teal-400/50 bg-teal-400/10",
  },
  {
    title: "Accumulated Deficit",
    value: "-৳107.15B",
    trend: "Un-appropriated surplus",
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
            Petrobangla Financial Overview
          </h1>
          <p className="text-zinc-400 mt-2">
            Audited Financial Statements (2017 - 2018) | Macro Trends Analysis
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
              BPDB: Revenue vs Gen & Purchase Cost (in Billions BDT)
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bpdbChartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Revenue from Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gen & Purchase Cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Govt Subsidy" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net Loss" fill="#a855f7" radius={[4, 4, 0, 0]} />
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
                The BPDB data vividly illustrates the widening gap between electricity sales revenue and generation/purchase costs (IPPs/Rentals). 
              </p>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="block text-orange-400 font-bold mb-1">Color Distinct Visualization</span>
                Notice how the <strong>Gen & Purchase Cost (Orange)</strong> massively outpaces Revenue (Green), resulting in severe <strong>Net Losses (Purple)</strong>, which are then covered by <strong>Govt Subsidies (Yellow)</strong>. 
              </div>
              <p>
                By strictly separating these 4 metrics with highly contrasting colors, the escalating capacity payments and systemic risk become immediately obvious at a glance.
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
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
                The 2018 audit reveals a stark structural imbalance. While Petrobangla's revenues grew marginally, the <strong>Cost of Sales</strong> dramatically outpaced it.
              </p>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="block text-red-400 font-bold mb-1">Critical Insight</span>
                The corporation is effectively surviving through massive injections into the <strong>Gas Development and Energy Security Fund</strong>, which skyrocketed by 134% in a single year to cover operational deficits.
              </div>
              <p>
                This data highlights the increasing reliance on government subsidies and external funding to maintain sector liquidity, paving the way for our Grid Explorer trend analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Balance Sheet Sneak Peek */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
          <h2 className="text-xl font-semibold mb-6">Condensed Balance Sheet (in Billions BDT)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="p-4 rounded-tl-lg">Metric</th>
                  <th className="p-4">2017 (Audited)</th>
                  <th className="p-4 rounded-tr-lg">2018 (Audited)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">Total Assets</td>
                  <td className="p-4">165.16</td>
                  <td className="p-4 font-semibold text-white">238.57</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">Total Equity & Liabilities</td>
                  <td className="p-4">165.16</td>
                  <td className="p-4 font-semibold text-white">238.57</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">Accounts Payable</td>
                  <td className="p-4 text-red-400">77.33</td>
                  <td className="p-4 text-green-400">46.93</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">Un-appropriated Deficit</td>
                  <td className="p-4 text-red-400">-84.42</td>
                  <td className="p-4 text-red-500 font-bold">-107.15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
