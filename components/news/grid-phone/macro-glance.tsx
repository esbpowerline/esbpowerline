/**
 * The twelve "Power Sector at a Glance" indicators.
 *
 * COPIED BY SCRIPT, not typed, from MacroTrendsTab.tsx (the `glanceIndicators`
 * array, 2026-11-12): the desktop keeps these as literals inside its render
 * body, so there is nothing to import. Until that array is lifted into a
 * shared module this file must be regenerated when the desktop's changes -
 * sed -n '297,431p' of that file is the whole procedure.
 */
import { Zap, Activity, Cable, TrendingUp, BarChart3, Database, Globe, Network, Landmark, Droplet, Sun } from 'lucide-react';
import { TakaIcon } from '@/components/news/power-grid/shared';

export const glanceIndicators = [
  {
    label: "Installed Capacity",
    value: "33,092 MW",
    desc: "Includes captive & renewable energy",
    Icon: Zap,
    iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    tooltipTitle: "Official Installed Grid Capacity",
    tooltipDesc: "Total utility-scale grid-connected capacity monitored by BPDB is 26,300 MW, supplemented by 3,500 MW captive industrial plants and 3,292 MW of renewable capacity (including off-grid solar home systems and grid-tied solar).",
    highlightLabel: "Grid-Tied vs. Off-Grid:",
    highlightValue: "85% Utility-Scale"
  },
  {
    label: "Peak Generation",
    value: "17,201 MW",
    valueColor: "text-primary",
    desc: "Recorded on May 20, 2026",
    Icon: Activity,
    iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    tooltipTitle: "National Grid Peak Load Record",
    tooltipDesc: "Verified maximum instantaneous active power generation delivered by public & private generators to the national grid during the summer peak load window. Monitored by PGCB's National Load Despatch Centre (NLDC).",
    highlightLabel: "SCADA Verified Peak:",
    highlightValue: "17,201 MW"
  },
  {
    label: "Active Power Plants",
    value: "137 Plants",
    desc: "0 retired/expired plants",
    Icon: Landmark,
    iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    tooltipTitle: "BPDB Contracted Power Plants",
    tooltipDesc: "Official count of grid-tied power stations under active Power Purchase Agreements (PPA) with the BPDB. Comprises 62 public units, 66 Independent Power Producers (IPPs), and 9 Rental/Quick Rental units.",
    highlightLabel: "PPA Active Units:",
    highlightValue: "137 Operational"
  },
  {
    label: "Import Capacity",
    value: "2,696 MW",
    desc: "Cross-border grid connection",
    Icon: Globe,
    iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    tooltipTitle: "Cross-Border Interconnection",
    tooltipDesc: "Consolidated importing capability via cross-border transmission networks. Includes Bheramara HVDC (1,000 MW), Adani Power Godda link (1,496 MW), and Tripura radial link (200 MW).",
    highlightLabel: "HVDC Interconnectors:",
    highlightValue: "2 Active Links"
  },
  {
    label: "Transmission Lines",
    value: "18,152 ckt km",
    desc: "High-voltage grid network",
    Icon: Cable,
    iconColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    tooltipTitle: "PGCB Transmission Network Asset",
    tooltipDesc: "Consolidated circuit kilometers of high-voltage transmission lines operated exclusively by PGCB: 400kV lines (approx. 2,100 ckt km), 230kV lines (approx. 4,300 ckt km), and 132kV lines (approx. 11,752 ckt km).",
    highlightLabel: "National Grid Backbone:",
    highlightValue: "100% PGCB Managed"
  },
  {
    label: "Substation Capacity",
    value: "91,242 MVA",
    desc: "Grid substation network",
    Icon: BarChart3,
    iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    tooltipTitle: "Grid Transformation Capacity",
    tooltipDesc: "Total installed transformer capacity across PGCB transmission grid substations. Includes 400kV, 230kV, and 132kV primary transformer ratings measured in Megavolt-Amperes (MVA).",
    highlightLabel: "PGCB Transformer Assets:",
    highlightValue: "91,242 MVA"
  },
  {
    label: "Distribution Lines",
    value: "658,563 km",
    desc: "Electrified lines (May 2026)",
    Icon: Network,
    iconColor: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    tooltipTitle: "Distribution Network Grid Length",
    tooltipDesc: "Aggregated distribution line lengths (33kV, 11kV, and 0.4kV networks) operated by utilities. The Bangladesh Rural Electrification Board (BREB) holds the largest share with over 530,000 km of lines.",
    highlightLabel: "BREB Share:",
    highlightValue: "80.5% of Lines"
  },
  {
    label: "Consumer Base",
    value: "49.94 Million",
    desc: "49,941,000 links (May 2026)",
    Icon: Database,
    iconColor: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    tooltipTitle: "Official Registered Accounts",
    tooltipDesc: "Aggregated live electricity meters across all six distribution utilities. The consumer base grew by 8.4% annually, driven by rural grid expansion under the 'Electricity for All' initiative.",
    highlightLabel: "Active Connections:",
    highlightValue: "49,941,000 Accounts"
  },
  {
    label: "Electricity Access",
    value: "100.0%",
    desc: "Share of population connected",
    Icon: Sun,
    iconColor: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    tooltipTitle: "National Electrification Ratio",
    tooltipDesc: "Official government declaration certifying universal electricity access. Accomplished through grid extensions by BREB and off-grid Solar Home Systems (SHS) deployed by IDCOL in remote island regions.",
    highlightLabel: "Off-Grid Solar Coverage:",
    highlightValue: "8% of Population"
  },
  {
    label: "Per Capita Gen.",
    value: "661 kWh",
    desc: "FY 2024-25, inc. captive & RE",
    Icon: TrendingUp,
    iconColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    tooltipTitle: "Annual Per Capita Energy Metric",
    tooltipDesc: "Calculated by dividing total annual gross generation (including captive industrial and renewable generation) by the national population estimate, serving as a primary indicator of economic productivity.",
    highlightLabel: "FY 2024-25 Actual:",
    highlightValue: "661 kWh / person"
  },
  {
    label: "Irrigation Pumps",
    value: "498,000",
    desc: "Agriculture connections",
    Icon: Droplet,
    iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    tooltipTitle: "Agricultural Grid Connections",
    tooltipDesc: "Dedicated power connections for seasonal crop watering (Boro season). Monitored under agricultural tariff subsidies to ensure food security. Peak demand occurs from February to April.",
    highlightLabel: "Peak Agricultural Load:",
    highlightValue: "Demands up to 2,500 MW"
  },
  {
    label: "ADP Allocation",
    value: "18,409.52 Cr",
    desc: "FY 2025-26 budget",
    Icon: TakaIcon,
    iconColor: "text-lime-600 dark:text-lime-400 bg-lime-500/10 border-lime-500/20",
    tooltipTitle: "National Development Budget",
    tooltipDesc: "Capital expenditure allocation under the Annual Development Programme (ADP) specifically earmarked for the Power Division. Funded by government resources and foreign development partners (JICA, ADB, WB).",
    highlightLabel: "ADP Earmark:",
    highlightValue: "18,409.52 Crore BDT"
  }
];
