'use client';

/**
 * Technical Information — the transmission tab, split out of
 * PowerGridExplorer so its ~2,100 lines of standing asset-register JSX load
 * only when the tab is opened (the parent renders it through next/dynamic).
 * The register is static reference data; everything stateful here (sub-tab,
 * project filters, substation filters) belongs to this tab alone, which is
 * what made the cut clean.
 */

import { useEffect, useState, useRef } from 'react';
import {
  Zap, Activity, Cable, FileText, MapPin, Search, ChevronLeft, ChevronRight,
  ChevronDown, Check, Info, Map, Network, History, Database, TrendingUp,
  CheckSquare, Globe,
} from 'lucide-react';
import { cn, formatNumber, formatBdtAmount } from '@/lib/utils';
import { substationsData } from '@/lib/data/infrastructure/substations';
import { ongoingProjectsData } from '@/lib/data/infrastructure/projects-ongoing';
import { upcomingProjectsData } from '@/lib/data/infrastructure/projects-upcoming';
import { completedProjectsData } from '@/lib/data/infrastructure/projects-completed';
import { CustomDropdown, TakaIcon, getUpcomingProjectStatusInfo, renderProjectCost } from '@/components/news/power-grid/shared';
import { GridDataTable, type GridTableDensity } from '@/components/news/power-grid/GridDataTable';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { GridCardFooter, GridProvenanceTag, GridTablePager, useTablePager } from '@/components/news/power-grid/GridExplorerUI';

export function TechnicalInfoTab({
  selectedDate,
  tierLockRequired,
  onTryDemo,
}: {
  selectedDate: string;
  tierLockRequired: unknown;
  onTryDemo: () => void;
}) {
  // Ongoing & Upcoming Projects states & filters
  const [projectType, setProjectType] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectPartnerFilter, setProjectPartnerFilter] = useState('all');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);
  const [projectPage, setProjectPage] = useState(1);
  const projectsPerPage = 3;

  // Reset page when projectType changes
  useEffect(() => {
    setProjectPage(1);
  }, [projectType]);

  // Combined Projects filtering logic
  const filteredProjects = (projectType === 'ongoing' ? ongoingProjectsData : upcomingProjectsData).filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                          proj.objectives.some(o => o.toLowerCase().includes(projectSearch.toLowerCase())) ||
                          proj.scope.some(s => s.toLowerCase().includes(projectSearch.toLowerCase())) ||
                          ('director' in proj ? proj.director.toLowerCase().includes(projectSearch.toLowerCase()) : false);
    const matchesPartner = projectPartnerFilter === 'all' ||
                           (projectPartnerFilter === 'N/A' && proj.partner === 'N/A') ||
                           (projectPartnerFilter !== 'N/A' && proj.partner.toLowerCase().includes(projectPartnerFilter.toLowerCase()));
    return matchesSearch && matchesPartner;
  });

  const paginatedProjects = filteredProjects.slice(
    (projectPage - 1) * projectsPerPage,
    projectPage * projectsPerPage
  );

  const totalProjectPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Completed Projects states & filters
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedPartnerFilter, setCompletedPartnerFilter] = useState('all');
  const [isCompletedPartnerDropdownOpen, setIsCompletedPartnerDropdownOpen] = useState(false);
  const completedPartnerDropdownRef = useRef<HTMLDivElement>(null);
  const [completedPage, setCompletedPage] = useState(1);
  const completedPerPage = 3;

  // Combined Completed Projects filtering logic
  const filteredCompletedProjects = completedProjectsData.filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(completedSearch.toLowerCase()) ||
                          proj.objectives.some(o => o.toLowerCase().includes(completedSearch.toLowerCase())) ||
                          proj.scope.some(s => s.toLowerCase().includes(completedSearch.toLowerCase()));
    const matchesPartner = completedPartnerFilter === 'all' ||
                           (completedPartnerFilter === 'N/A' && proj.partner === 'N/A') ||
                           (completedPartnerFilter !== 'N/A' && proj.partner.toLowerCase().includes(completedPartnerFilter.toLowerCase()));
    return matchesSearch && matchesPartner;
  });

  const paginatedCompletedProjects = filteredCompletedProjects.slice(
    (completedPage - 1) * completedPerPage,
    completedPage * completedPerPage
  );

  const totalCompletedProjectPages = Math.ceil(filteredCompletedProjects.length / completedPerPage);

  // Substation & Transmission Tab States
  const [transSubTab, setTransSubTab] = useState<'transmission' | 'lines' | 'substations' | 'projects' | 'completed_projects' | 'grid_net' | 'geo_map' | 'opgw_map' | 'opgw_lease'>('transmission');
  const [isTransDropdownOpen, setIsTransDropdownOpen] = useState(false);
  const transDropdownRef = useRef<HTMLDivElement>(null);

  const [isVoltageDropdownOpen, setIsVoltageDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const voltageDropdownRef = useRef<HTMLDivElement>(null);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  const [subSearch, setSubSearch] = useState('');
  const debouncedSubSearch = useDebouncedValue(subSearch);
  const [subVoltageFilter, setSubVoltageFilter] = useState<string>('all');
  const [subZoneFilter, setSubZoneFilter] = useState<string>('all');
  const [subOwnerFilter, setSubOwnerFilter] = useState<string>('all');
  const [subTableDensity, setSubTableDensity] = useState<GridTableDensity>('comfortable');
  const [subFiltersOpen, setSubFiltersOpen] = useState(false);
  const zones = ['Dhaka', 'Khulna', 'Barishal', 'Cumilla', 'Sylhet', 'Rajshahi', 'Chattogram', 'Rangpur', 'Mymensingh'];
  const owners = ['POWER GRID', 'APSCL', 'BIFPCL', 'RNPP', 'Bulk', 'BPDB', 'DESCO', 'DPDC', 'MoST', 'DMTCL'];

  const voltageOptions = [
    { label: 'All Voltage Classes', value: 'all' },
    { label: '400 kV', value: '400kV' },
    { label: '230 kV', value: '230kV' },
    { label: '132 kV', value: '132kV' },
    { label: '230/33 kV', value: '230/33kV' },
    { label: '132/33 kV', value: '132/33kV' },
  ];

  const zoneOptions = [
    { label: 'All Operation Zones', value: 'all' },
    ...zones.map((z) => ({ label: z, value: z })),
  ];

  const ownerOptions = [
    { label: 'All Owners', value: 'all' },
    ...owners.map((o) => ({ label: o, value: o })),
  ];

  const substationRowKey = (sub: (typeof substationsData)[number]) =>
    `${sub.sn}:${sub.voltage}:${sub.name}`;

  // Substation Filtering Logic
  const filteredSubstations = substationsData.filter((sub) => {
    const q = debouncedSubSearch.toLowerCase();
    const matchesSearch = sub.name.toLowerCase().includes(q) ||
                          sub.circle.toLowerCase().includes(q);
    const matchesVoltage = subVoltageFilter === 'all' || sub.voltage === subVoltageFilter;
    const matchesZone = subZoneFilter === 'all' || sub.zone === subZoneFilter;
    const matchesOwner = subOwnerFilter === 'all' || sub.owner === subOwnerFilter;
    return matchesSearch && matchesVoltage && matchesZone && matchesOwner;
  });

  const totalSubCapacityMva = filteredSubstations.reduce((sum, sub) => {
    const val = parseFloat(sub.capacity.replace(/,/g, ''));
    if (sub.capacity.includes('MW') || isNaN(val)) return sum;
    return sum + val;
  }, 0);

  // Was a bespoke pager with prev/next only and its own page sizes. Same hook
  // as every other long list now, so a reader who learns the controls once has
  // learned them everywhere.
  const substationPager = useTablePager(filteredSubstations, 25);
  const paginatedSubstations = substationPager.rows;

  // The filter reset lives in useTablePager: it keys off the row count, which
  // is what actually changes when a filter is applied.

  // Click outside listener for this tab's dropdowns.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (transDropdownRef.current && !transDropdownRef.current.contains(target)) {
        setIsTransDropdownOpen(false);
      }
      if (voltageDropdownRef.current && !voltageDropdownRef.current.contains(target)) {
        setIsVoltageDropdownOpen(false);
      }
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(target)) {
        setIsZoneDropdownOpen(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(target)) {
        setIsOwnerDropdownOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(target)) {
        setIsPartnerDropdownOpen(false);
      }
      if (completedPartnerDropdownRef.current && !completedPartnerDropdownRef.current.contains(target)) {
        setIsCompletedPartnerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">PGCB Transmission Grid Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB transmission outages and substation tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={onTryDemo}><div className="grid-explorer-panel space-y-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Mobile/Tablet Sub-tab Navigation */}
            <div className="lg:hidden w-full relative z-40 bg-card border border-border/60 p-3 rounded-2xl shadow-sm">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                Select Section
              </label>
              <div className="relative">
                <select
                  value={
                    transSubTab === 'projects'
                      ? (projectType === 'ongoing' ? 'projects_ongoing' : 'projects_upcoming')
                      : transSubTab
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'projects_ongoing') {
                      setTransSubTab('projects');
                      setProjectType('ongoing');
                    } else if (val === 'projects_upcoming') {
                      setTransSubTab('projects');
                      setProjectType('upcoming');
                    } else {
                      setTransSubTab(val as any);
                    }
                  }}
                  className="w-full appearance-none px-4 py-3 pr-10 text-xs font-semibold rounded-xl border border-border/40 bg-muted/20 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {[
                    {
                      group: "Grid Infrastructure",
                      items: [
                        { id: 'transmission', label: 'Power Transmission' },
                        { id: 'lines', label: 'Transmission Line Information' },
                        { id: 'substations', label: 'Substation Information' }
                      ]
                    },
                    {
                      group: "Grid Projects",
                      items: [
                        { id: 'projects_ongoing', label: 'Ongoing Projects' },
                        { id: 'projects_upcoming', label: 'Upcoming Projects' },
                        { id: 'completed_projects', label: 'Completed Projects' }
                      ]
                    },
                    {
                      group: "Maps & Diagrams",
                      items: [
                        { id: 'grid_net', label: 'National Grid Network Diagram' },
                        { id: 'geo_map', label: 'Geographical Grid Map' }
                      ]
                    },
                    {
                      group: "Optical Fiber (OPGW)",
                      items: [
                        { id: 'opgw_map', label: 'OPGW Fiber Network Map' },
                        { id: 'opgw_lease', label: 'Optical Fiber Leasing' }
                      ]
                    }
                  ].map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </div>
              </div>
            </div>

            {/* Desktop Left Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-3 space-y-4 lg:sticky lg:top-24 bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
              <div className="pb-3 border-b border-border/40">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Technical Information
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Power Grid Infrastructure &amp; Projects
                </p>
              </div>

              {[
                {
                  group: "Grid Infrastructure",
                  colorClass: "text-sky-500",
                  items: [
                    { id: 'transmission', label: 'Power Transmission', icon: Activity, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" },
                    { id: 'lines', label: 'Transmission Line Information', icon: Cable, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" },
                    { id: 'substations', label: 'Substation Information', icon: Database, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" }
                  ]
                },
                {
                  group: "Grid Projects",
                  colorClass: "text-muted-foreground",
                  items: [
                    { id: 'projects_ongoing', label: 'Ongoing Projects', icon: TrendingUp, activeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-400" },
                    { id: 'projects_upcoming', label: 'Upcoming Projects', icon: Activity, activeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400" },
                    { id: 'completed_projects', label: 'Completed Projects', icon: CheckSquare, activeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400" }
                  ]
                },
                {
                  group: "Maps & Diagrams",
                  colorClass: "text-indigo-500",
                  items: [
                    { id: 'grid_net', label: 'National Grid Network Diagram', icon: Network, activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400" },
                    { id: 'geo_map', label: 'Geographical Grid Map', icon: MapPin, activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400" }
                  ]
                },
                {
                  group: "Optical Fiber (OPGW)",
                  colorClass: "text-purple-500",
                  items: [
                    { id: 'opgw_map', label: 'OPGW Fiber Network Map', icon: Map, activeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400" },
                    { id: 'opgw_lease', label: 'Optical Fiber Leasing', icon: TakaIcon, activeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400" }
                  ]
                }
              ].map((g, idx) => (
                <div key={g.group} className={cn("space-y-1.5", idx > 0 && "pt-3 border-t border-border/30")}>
                  <h4 className={cn("text-[10px] font-bold uppercase tracking-widest px-2", g.colorClass)}>
                    {g.group}
                  </h4>
                  <div className="space-y-0.5">
                    {g.items.map((t) => {
                      const SubIcon = t.icon;
                      const active = t.id === 'projects_ongoing'
                        ? (transSubTab === 'projects' && projectType === 'ongoing')
                        : t.id === 'projects_upcoming'
                        ? (transSubTab === 'projects' && projectType === 'upcoming')
                        : transSubTab === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (t.id === 'projects_ongoing') {
                              setTransSubTab('projects');
                              setProjectType('ongoing');
                            } else if (t.id === 'projects_upcoming') {
                              setTransSubTab('projects');
                              setProjectType('upcoming');
                            } else {
                              setTransSubTab(t.id as any);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all duration-150 border text-left",
                            active
                              ? t.activeClass
                              : cn("border-transparent text-muted-foreground", t.hoverClass)
                          )}
                        >
                          <SubIcon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-current" : "text-muted-foreground group-hover:text-current")} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9 space-y-6">

          {/*
            Provenance note for the whole tab. This section is a standing asset
            register, not a daily reading: it does not move with the date picker,
            so a reader could otherwise take these figures for the selected day's.
          */}
          <div className="p-3 rounded-2xl bg-muted/10 border border-border/30 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">What P and D mean here.</strong>{' '}
              <GridProvenanceTag kind="P" /> marks a figure PGCB states in its own
              publication, quoted as written.{' '}
              <GridProvenanceTag kind="D" /> marks one computed here — on this tab that
              is only ever a count of the records held or a total summed from the rows
              shown, never an estimate. These are <strong className="text-foreground">standing
              infrastructure figures, not daily readings</strong>: they carry the date PGCB
              states for them and do not change with the reporting date selected above.
            </span>
          </div>

          {/* Sub-tab 1: Power Transmission */}
          {transSubTab === 'transmission' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Core Operating Function Card */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/25 relative overflow-hidden">
                {/* Visual grid pattern background decoration */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                      <Activity className="h-6 w-6 shrink-0 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">Power Transmission</h3>
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                          Core Grid Function
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                        PGCB does not generate electricity and does not sell it to you. It
                        owns the wires in between: it collects power from the stations that
                        make it and carries it to the companies that deliver it to homes and
                        businesses. It earns a fee per unit carried — a toll for use of the
                        road, not a price for the goods — and the regulator, BERC, sets that
                        fee rather than PGCB.
                      </p>
                      <details className="group/jargon">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5">
                          <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open/jargon:rotate-180" />
                          PGCB&apos;s exact wording
                        </summary>
                        <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-3 mt-2">
                        The main operating function of Power Grid is wheeling of energy from BPDB power stations and Generation Companies to Distribution entities utilizing transmission network. Power Grid gets its energy wheeling charge from its clients(distribution entities) at the rate fixed by Bangladesh Electricity Regulatory Commission (BERC).
                        </p>
                      </details>
                    </div>
                  </div>

                  {/* Wheeling Workflow Visualization */}
                  <div className="space-y-4 pt-4 border-t border-border/30">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How power reaches you</h4>
                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      {/* Step 1 */}
                      <div className="group p-4 rounded-2xl bg-muted/15 border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted-foreground/10 px-2.5 py-0.5 rounded-full">Step 1: Generation</span>
                            <Zap className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">Power Generation Plants</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Power stations burn gas or coal, or catch sun and wind, and make electricity. State-owned and private plants both feed the same grid.
                          </p>
                        </div>
                        <div className="border-t border-border/20 pt-2 mt-4 text-[10px] text-muted-foreground font-medium">
                          Gas, coal, furnace oil, solar, and imported power
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="group p-4 rounded-2xl bg-primary/5 border border-primary/25 hover:border-primary/40 hover:bg-primary/10 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Step 2: Transmission</span>
                            <Cable className="h-4 w-4 shrink-0 text-primary" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">High-Voltage Wheeling Grid</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            This is PGCB. It raises the voltage to <strong className="text-foreground">400,000, 230,000 or 132,000 volts</strong> so the power can cross the country without most of it being lost as heat along the way.
                          </p>
                        </div>
                        <div className="border-t border-primary/20 pt-2 mt-4 text-[10px] text-primary font-semibold">
                          The toll PGCB charges is set by the regulator
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="group p-4 rounded-2xl bg-muted/15 border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted-foreground/10 px-2.5 py-0.5 rounded-full">Step 3: Distribution</span>
                            <Globe className="h-4 w-4 shrink-0 text-emerald-500" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">Distribution Entities (Clients)</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The voltage is brought back down at a substation and handed to your local utility, which runs the last stretch of cable to your meter.
                          </p>
                        </div>
                        <div className="border-t border-border/20 pt-2 mt-4 text-[10px] text-muted-foreground font-medium">
                          Your bill comes from one of these: DPDC, DESCO, BREB/PBS, WZPDCO, NESCO
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Asset History and Standing Comparison */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Historical Takeover */}
                <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-muted/5 border-border/40 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid-explorer-chart-card__head !justify-start text-left">
                      <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                        <FileText className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <h3 className="grid-explorer-chart-card__title">Where PGCB Started</h3>
                        <p className="grid-explorer-chart-card__sub">What PGCB started with, handed over from BPDB and DESA</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-amber-500/50 pl-3">
                        "The Power Grid took over about 2497 circuit km of 230 kV lines, 4236 circuit km 27.3 circuit km (Others) of 132 kV lines, 6 nos of 230/132 kV Substation and 63 nos of 132/33 kV substations from BPDB and DESA in different phases."
                      </p>

                      <div className="grid gap-2.5 mt-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 230 kV Transmission Lines</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">about 2497 circuit km</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 132 kV Transmission Lines</span>
                          <div className="text-left">
                            <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">4236 circuit km</span>
                            <span className="block text-[9px] text-muted-foreground mt-1">Plus 27.3 circuit km (Others)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 230/132 kV Substations</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">6 nos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 132/33 kV Substations</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">63 nos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                    <span>Quoted verbatim from PGCB&apos;s own statement. Not independently audited.</span>
                    <span className="font-medium">Reporting Period: Takeover from BPDB &amp; DESA</span>
                  </GridCardFooter>
                </div>

                {/* Standing Assets up to June, 2026 */}
                <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-muted/5 border-border/40 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid-explorer-chart-card__head !justify-start text-left">
                      <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                        <TrendingUp className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <h3 className="grid-explorer-chart-card__title">The Grid Today</h3>
                        <p className="grid-explorer-chart-card__sub">What PGCB owns and runs, as at June 2026</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-foreground leading-relaxed">
                        PGCB now runs <strong>18,816 km of high-voltage line</strong> — the
                        long-distance wires that carry power from the plants to your city,
                        before any local pole or street cable. It hands that power over at{' '}
                        <strong>259 substations</strong>, the sites that step the voltage
                        down so it can be used.
                      </p>

                      <details className="group/quote">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5">
                          <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open/quote:rotate-180" />
                          PGCB&apos;s exact wording
                        </summary>
                        <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-sky-500/50 pl-3 mt-2">
                          &ldquo;Transmission lines of the company up to June, 2026 are stood at 3,282 ckt km 27.8 ckt km (Others) of 400 kV lines, 5,423 circuit km 27.3 circuit km (Others) of 230 kV lines, 9,687 circuit km and 369 circuit km (Others) of 132 kV lines and 1 nos of 400 kV Station, 11 nos of 400/230kV substation, 5 nos of 400/132kV substation, 36 nos of 230/132 kV substation, 3 nos of 230/33 KV substation and 151 nos of 132/33 kV substations.&rdquo;
                        </p>
                      </details>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />400 kV — the motorways</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">3,282 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 27.8 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />230 kV — the trunk roads</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">5,423 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 27.3 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30 col-span-2">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />132 kV — the main roads</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">9,687 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 369 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Highest-voltage sites</span>
                          <span className="text-[10px] font-bold text-foreground block mt-0.5 leading-tight">1 × 400 kV station</span>
                          <span className="text-[9px] text-muted-foreground">11 step 400→230 kV, 5 step 400→132 kV</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Handover sites</span>
                          <span className="text-[10px] font-bold text-foreground block mt-0.5 leading-tight">36 step 230→132 kV</span>
                          <span className="text-[9px] text-muted-foreground">2 step 230→33 kV, 150 step 132→33 kV</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                    <span>
                      Figures read from PGCB&apos;s page by two independent parsers, which
                      agreed on all 20 checked values. One caveat, and it is PGCB&apos;s
                      own: the paragraph quoted above says <strong className="text-foreground">3</strong>{' '}
                      230/33 kV and <strong className="text-foreground">151</strong> 132/33 kV
                      substations, while the table further down the same page says{' '}
                      <strong className="text-foreground">2</strong> and{' '}
                      <strong className="text-foreground">150</strong>. The tiles follow the
                      table, because that is the version PGCB&apos;s own totals add up to.
                    </span>
                    <span className="font-medium">Standing as at: June 2026</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Takeover vs. Standing Comparative Table */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Database className="h-5 w-5 shrink-0 text-primary" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Then vs Now</h3>
                </div>
                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table text-xs">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="py-2.5 text-left text-foreground font-bold">Infrastructure Class</th>
                        <th className="py-2.5 text-left text-foreground font-bold">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited (Takeover from BPDB &amp; DESA)</span>
                        </th>
                        <th className="py-2.5 text-left text-foreground font-bold">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Standing (Up to June, 2026)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">400 kV Transmission Lines</td>
                        <td className="py-2 text-muted-foreground">—</td>
                        <td className="py-2 text-foreground font-medium">3,282 ckt km <span className="text-[10px] text-muted-foreground block">Plus 27.8 ckt km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">230 kV Transmission Lines</td>
                        <td className="py-2 text-foreground font-medium">about 2497 circuit km</td>
                        <td className="py-2 text-foreground font-medium">5,423 circuit km <span className="text-[10px] text-muted-foreground block">Plus 27.3 circuit km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">132 kV Transmission Lines</td>
                        <td className="py-2 text-foreground font-medium">4236 circuit km <span className="text-[10px] text-muted-foreground block">Plus 27.3 circuit km (Others)</span></td>
                        <td className="py-2 text-foreground font-medium">9,687 circuit km <span className="text-[10px] text-muted-foreground block">Plus 369 circuit km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">400 kV Stations / Substations</td>
                        <td className="py-2 text-muted-foreground">—</td>
                        <td className="py-2 text-foreground font-medium">
                          <span className="block">1 nos of 400 kV Station</span>
                          <span className="block text-[10px] text-muted-foreground">11 nos of 400/230kV substation</span>
                          <span className="block text-[10px] text-muted-foreground">5 nos of 400/132kV substation</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">230 kV Substations</td>
                        <td className="py-2 text-foreground font-medium">6 nos of 230/132 kV Substation</td>
                        <td className="py-2 text-foreground font-medium">
                          <span className="block">36 nos of 230/132 kV substation</span>
                          <span className="block text-[10px] text-muted-foreground">2 nos of 230/33 KV substation</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">132/33 kV Substations</td>
                        <td className="py-2 text-foreground font-medium">63 nos of 132/33 kV substations</td>
                        <td className="py-2 text-foreground font-medium">150 nos of 132/33 kV substations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <GridCardFooter className="mt-4">
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                  <span>
                    Both columns restate PGCB&apos;s own figures side by side. No growth
                    rate or difference is computed, so every cell here is P; the
                    &ldquo;—&rdquo; marks a class PGCB does not state for that period, not a zero.
                  </span>
                  <span className="font-medium">Reporting Period: Takeover &rarr; June 2026</span>
                </GridCardFooter>
              </div>

              {/* Callout box for projects */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                </div>
                <p className="text-xs text-foreground font-semibold leading-normal">
                  PGCB is building more lines and substations — the projects are listed under Grid Projects in the menu.
                </p>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt)</strong>
                    1,000 volts. Pushing power at high voltage is like using a wider pipe — less is wasted as heat on a long journey, which is why the grid steps voltage up to travel and back down to deliver.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">ckt km (Circuit Kilometers)</strong>
                    Length of wire, not length of route. One tower line often carries two circuits, so a 10 km stretch of towers counts as 20 circuit km.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA (Megavolt-Ampere)</strong>
                    The size rating of a substation — roughly how much power it can pass at once. Think of it as the width of the doorway, not how much actually walks through.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Nos (Numbers)</strong>
                    Just “number of”. PGCB writes “11 nos” where we would write “11”.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">BERC / BPDB</strong>
                    BERC is the regulator that sets prices. BPDB is the state power company that generates and buys electricity.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Transmission Line Information */}
          {transSubTab === 'lines' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Column 1: Transmission Line stats */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Transmission Line Info Card */}
                  <div className="grid-explorer-chart-card card h-full flex flex-col justify-between">
                    <div>
                      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                        <Cable className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <h3 className="grid-explorer-chart-card__title">Transmission Line as on: June, 2026</h3>
                          <p className="grid-explorer-chart-card__sub">How much high-voltage wire exists, by voltage class</p>
                        </div>
                      </div>

                      <div className="grid-explorer-table-wrap">
                        <table className="grid-explorer-table text-xs">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="py-2 text-left">Voltage Class</th>
                              <th className="py-2 text-left">
                                <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Main Capacity</span>
                              </th>
                              <th className="py-2 text-left">
                                <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Others</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                400kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">3,282 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">27.8 Circuit km (Others)</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                230kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">5,423 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">27.3 Circuit km (Others)</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                132kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">9,687 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">369 Circuit km (Others)</td>
                            </tr>
                            <tr className="border-t border-border/60 font-bold bg-muted/20">
                              <td className="py-3 pl-3">Total Line</td>
                              <td className="py-3 text-left tabular-nums text-primary pr-3" colSpan={2}>18,816 Circuit km</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Last Five Years Achievement */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid-explorer-chart-card card h-full flex flex-col justify-between">
                    <div>
                      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                        <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <h3 className="grid-explorer-chart-card__title">Last Five years achievement</h3>
                          <p className="grid-explorer-chart-card__sub">Major projects and capacities commissioned recently</p>
                        </div>
                      </div>

                      <div className="grid-explorer-table-wrap">
                        <table className="grid-explorer-table text-xs">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="py-2 text-left">Infrastructure Item</th>
                              <th className="py-2 text-left">Verbatim Capacity / Length</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">400/230kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">9 Nos. 13,100 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">400/132 kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">4 Nos. 2,990 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">230/132kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">10 Nos: 7,550 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">230/33KV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">1 Nos 280 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">132/33kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">38 Nos. 7,647 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">400kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">2,124.77 Circuit km</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">230kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">1,481.94 Circuit km</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">132kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">1,249.874 Circuit km</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Substation Capacity details (Full width) */}
                <div className="lg:col-span-12">
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                      <Database className="h-5 w-5 text-indigo-500 shrink-0" />
                      <div>
                        <h3 className="grid-explorer-chart-card__title">Substation as on: June, 2026</h3>
                        <p className="grid-explorer-chart-card__sub">Comprehensive capacity aggregates across all operation nodes</p>
                      </div>
                    </div>

                    <div className="grid-explorer-table-wrap">
                      <table className="grid-explorer-table text-xs">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="py-2 text-left">Substation / Station Class</th>
                            <th className="py-2 text-left">Count / Quantity</th>
                            <th className="py-2 text-left">Main Capacity / Rating</th>
                            <th className="py-2 text-left">Others (Quantity &amp; Capacity)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400kV HVDC Station</td>
                            <td className="py-2.5 text-foreground">1 Nos.</td>
                            <td className="py-2.5 text-left font-medium text-foreground">2x500MW HVDC Back to Back station</td>
                            <td className="py-2.5 text-left text-muted-foreground">—</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400/230kV Substation</td>
                            <td className="py-2.5 text-foreground">11 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">16,180 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">3 Nos. 2730 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400/132 kV Substation</td>
                            <td className="py-2.5 text-foreground">5 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">4,590 MVA</td>
                            <td className="py-2.5 text-left text-muted-foreground">—</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">230/132kV Substation</td>
                            <td className="py-2.5 text-foreground">36 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">24,725 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">1 Nos. 250 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">230/33KV Substation</td>
                            <td className="py-2.5 text-foreground">2 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">700 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">4 Nos. 1,050 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">132/33kV Substation</td>
                            <td className="py-2.5 text-foreground">150 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">33,627 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">46 Nos. 7,661 MVA (Others)</td>
                          </tr>
                          
                          {/* Summary Row 1: Overall Capacity */}
                          <tr className="border-t border-border/50 bg-primary/5 font-semibold text-foreground">
                            <td className="py-3 pl-3 text-primary font-bold">Overall Capacity</td>
                            <td className="py-3 font-bold" colSpan={2}>259 Nos.</td>
                            <td className="py-3 text-left font-bold text-primary pr-3">91,512 MVA</td>
                          </tr>
                          
                          {/* Summary Row 2: Dispatch Capacity */}
                          <tr className="bg-emerald-500/5 font-semibold text-foreground">
                            <td className="py-3 pl-3 text-emerald-500 font-bold" colSpan={2}>Dispatch Capacity at 33kV level</td>
                            <td className="py-3 text-left font-bold text-emerald-500 pr-3" colSpan={2}>
                              36267.21 MW <span className="text-[10px] text-muted-foreground font-normal">(Including all organizations)</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt)</strong>
                    1,000 volts. Higher voltage travels further with less waste.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Circuit km (ckt km)</strong>
                    Length of wire rather than length of route — a tower line carrying two circuits counts twice.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA / MW</strong>
                    Two different things that both sound like size. MVA rates what a substation can pass; MW measures power actually flowing. They cannot be added together.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">HVDC Station</strong>
                    A converter station. Bangladesh’s grid and India’s run out of step with each other, so power is turned into DC and back to cross between them.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Others Capacity</strong>
                    Lines and substations on the network that someone other than PGCB owns. Listed separately so PGCB’s own assets are not overstated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Substation Information */}
          {transSubTab === 'substations' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header Card Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Text Description */}
                <div className="grid-explorer-chart-card card p-6 lg:col-span-2 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent border-indigo-500/20 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Database className="h-6 w-6 shrink-0" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-foreground">National Grid Substation Database</h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                            Register as collected May 24, 2026 — not refreshed automatically
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Every substation on the national grid — the sites where voltage is stepped down and power changes hands. Search or filter the list below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Key Stats Quick View Card */}
                <div className="grid-explorer-chart-card card p-6 lg:col-span-1 bg-muted/10 border-border/30 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Substation Database Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        {/*
                          Counts register rows, and the register lists one row per
                          transformer bank, not per station — Payra appears twice, once
                          for its 2x325 bank and once for its 2x80/120. Calling the
                          result "Stations" overstated the fleet: 260 rows cover 227
                          distinct stations. Labelled for what it actually counts.
                        */}
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Register Entries</span>
                        <div className="text-sm font-bold text-foreground tabular-nums">{filteredSubstations.length} Rows</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Filtered Capacity</span>
                        <div className="text-sm font-bold text-primary tabular-nums">{formatNumber(totalSubCapacityMva)} MVA</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Unique Zones</span>
                        <div className="text-sm font-bold text-foreground tabular-nums">9 Zones</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Grid Circle Groups</span>
                        <div className="text-sm font-bold text-emerald-500 tabular-nums">HVDC &amp; Circles</div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB substation register</a></span>
                    <span>
                      Each substation is listed as PGCB states it; the counts and the
                      capacity total are ours, computed over whatever the filters above
                      currently select — so they move as you filter and are not PGCB
                      totals. <strong className="text-foreground">The register lists one row per
                      transformer bank, not per station</strong>, so its 260 rows cover 227
                      distinct stations; the row count is shown as rows rather than as a
                      station count for that reason.{' '}
                      <strong className="text-foreground">Filtered Capacity sums only the
                      MVA-rated transformers</strong>: the HVDC back-to-back blocks are rated in
                      MW, a different quantity, and adding them to an MVA total would be
                      arithmetic on mismatched units, so they are excluded.{' '}
                      <strong className="text-foreground">This station list is the April 2026
                      collection and has not been re-collected since.</strong> Summed whole it
                      comes to 89,155 MVA, which matched PGCB&apos;s April total exactly; PGCB
                      has since published 91,512 MVA for June, so the list now trails the
                      summary tables above by 2,357 MVA.
                    </span>
                    <span className="font-medium">Register as at: April 2026</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Substation Rating Categories Breakdown Table */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Database className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Substation Assets &amp; Capacity</h3>
                    <p className="grid-explorer-chart-card__sub">Active substations and transformer ratings as of June 2026</p>
                  </div>
                </div>

                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table">
                    <thead>
                      <tr>
                        <th>Rating / Type</th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Quantity</span>
                        </th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Capacity (MVA)</span>
                        </th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Others Capacity</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-semibold">400 kV HVDC Back-to-Back</td>
                        <td className="text-left tabular-nums font-medium text-foreground">1 Station</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">2x500 MW</td>
                        <td className="text-left text-muted-foreground">—</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">400/230 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">11 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">16,180 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">3 Nos. (2,730 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">400/132 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">5 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">4,590 MVA</td>
                        <td className="text-left text-muted-foreground">—</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">230/132 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">36 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">24,725 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">1 Nos. (250 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">230/33 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">2 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">700 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">4 Nos. (1,050 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">132/33 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">150 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">33,627 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">46 Nos. (7,661 MVA)</td>
                      </tr>
                      <tr className="border-t border-border/80 font-bold bg-muted/20">
                        <td className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Overall Substation Capacity</td>
                        <td className="text-left tabular-nums text-primary">259 Stations</td>
                        <td className="text-left tabular-nums text-primary" colSpan={2}>91,512 MVA</td>
                      </tr>
                      <tr className="font-bold bg-muted/10">
                        <td className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Dispatch Capacity (33kV level)</td>
                        <td className="text-left tabular-nums text-emerald-500 font-extrabold" colSpan={3}>38,733 MW</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <GridCardFooter className="mt-4">
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — substation assets</span>
                  <span>
                    Every row here is PGCB&apos;s, including the Overall line, which PGCB
                    prints itself — so it is marked P rather than as our sum. Adding the
                    rows up gives 259 stations, matching exactly, and{' '}
                    <strong className="text-foreground">91,513 MVA against the 91,512 PGCB
                    prints</strong> — a 1 MVA difference in PGCB&apos;s own arithmetic, shown
                    as published rather than quietly corrected. The HVDC back-to-back
                    station sits outside the MVA total: it is rated 2&times;500 MW, a
                    different quantity that cannot be added to an MVA figure.
                  </span>
                  <span className="font-medium">Assets as at: June 2026</span>
                </GridCardFooter>
              </div>

              {/* Substation Filters */}
              <div className={cn('grid-explorer-filter-panel p-4 bg-card border border-border/60 rounded-2xl z-40 relative', subFiltersOpen && 'is-open')}>
                <button
                  type="button"
                  className="grid-explorer-filter-panel__toggle"
                  aria-expanded={subFiltersOpen}
                  onClick={() => setSubFiltersOpen((o) => !o)}
                >
                  <span>Filter substations</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', subFiltersOpen && 'rotate-180')} />
                </button>
                <div className="grid-explorer-filter-panel__body mt-4 sm:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Search substation name..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="grid-explorer-control w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <CustomDropdown
                    value={subVoltageFilter}
                    onChange={setSubVoltageFilter}
                    options={voltageOptions}
                    placeholder="All Voltage Classes"
                    isOpen={isVoltageDropdownOpen}
                    setIsOpen={setIsVoltageDropdownOpen}
                    dropdownRef={voltageDropdownRef}
                  />

                  <CustomDropdown
                    value={subZoneFilter}
                    onChange={setSubZoneFilter}
                    options={zoneOptions}
                    placeholder="All Operation Zones"
                    isOpen={isZoneDropdownOpen}
                    setIsOpen={setIsZoneDropdownOpen}
                    dropdownRef={zoneDropdownRef}
                  />

                  <CustomDropdown
                    value={subOwnerFilter}
                    onChange={setSubOwnerFilter}
                    options={ownerOptions}
                    placeholder="All Owners"
                    isOpen={isOwnerDropdownOpen}
                    setIsOpen={setIsOwnerDropdownOpen}
                    dropdownRef={ownerDropdownRef}
                  />
                </div>
              </div>

              {/* Substations Table */}
              <div className="grid-explorer-chart-card card">
                <div className="flex items-center justify-end gap-2 px-4 pt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Density</span>
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSubTableDensity(d)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150 capitalize',
                        subTableDensity === d
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-muted/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/30',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <p className="grid-explorer-table-scroll-hint sm:hidden px-4" role="note">
                  Swipe horizontally to see all columns
                </p>
                <GridDataTable
                  stickyHeader
                  stickyFirstCol
                  density={subTableDensity}
                  empty={paginatedSubstations.length === 0}
                  emptyMessage="No substations match your filter criteria."
                  aria-label="National grid substation registry"
                  footer={
                    <div className="px-4 py-2">
                      <GridTablePager
                        page={substationPager.page}
                        totalPages={substationPager.totalPages}
                        pageSize={substationPager.pageSize}
                        total={substationPager.total}
                        from={substationPager.from}
                        to={substationPager.to}
                        onPage={substationPager.setPage}
                        onPageSize={substationPager.setPageSize}
                        noun="substations"
                      />
                    </div>
                  }
                >
                  <table className="grid-explorer-table">
                    <thead>
                      <tr>
                        <th>SN</th>
                        <th>Substation Name</th>
                        <th>Voltage Class</th>
                        <th>Operation Zone</th>
                        <th>Transformer Detail</th>
                        <th className="text-right">Total Capacity</th>
                        <th>Ownership</th>
                        <th>Grid Circle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubstations.map((sub) => (
                        <tr key={substationRowKey(sub)} className="hover:bg-muted/5 transition-colors">
                          <td className="font-semibold text-muted-foreground tabular-nums">{sub.sn}</td>
                          <td className="font-semibold text-foreground" title={sub.name}>
                            <span className="grid-explorer-table__truncate">{sub.name}</span>
                          </td>
                          <td>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              sub.voltage === '400kV' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              sub.voltage === '230kV' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              sub.voltage === '132kV' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
                            )}>
                              {sub.voltage}
                            </span>
                          </td>
                          <td>{sub.zone}</td>
                          <td className="font-mono text-xs">{sub.transformer}</td>
                          <td className="text-right font-medium tabular-nums text-foreground">{sub.capacity}</td>
                          <td>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              sub.owner === 'POWER GRID' ? 'bg-primary/10 text-primary' :
                              sub.owner === 'Bulk' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-muted text-muted-foreground',
                            )}>
                              {sub.owner}
                            </span>
                          </td>
                          <td>{sub.circle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GridDataTable>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA (Megavolt-Ampere)</strong>
                    Apparent power capacity rating of the step-down transformers operating inside the substation.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt Class)</strong>
                    Substation connection voltage (e.g. 132/33 kV steps down 132kV grid line to 33kV distribution feeder).
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Transformer Code</strong>
                    System operators designate transformer units (e.g. T-1, TR-2) for maintenance tracking.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Owner Groups</strong>
                    Entities managing the station (e.g. POWER GRID / PGCB, APSCL, BPDB utilities).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Ongoing / Upcoming Projects */}
          {transSubTab === 'projects' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header block */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {projectType === 'ongoing' ? 'Ongoing Projects' : 'Upcoming Projects'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {projectType === 'ongoing' 
                      ? 'Detailed status tracking of PGCB high-voltage grid upgrades, river crossings, and transmission line projects.'
                      : 'Planned high-voltage grid expansions, battery energy storage systems (BESS), and power transmission line projects in the pipeline.'}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0 font-mono inline-flex items-center gap-1">
                  <GridProvenanceTag kind="D" />
                  {projectType === 'ongoing' ? ongoingProjectsData.length : upcomingProjectsData.length} Projects under tracking
                </span>
              </div>

              {/* Project Type Toggle Pills */}
              <div className="flex items-center gap-2 p-1 bg-muted/20 border border-border/30 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setProjectType('ongoing')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent",
                    projectType === 'ongoing'
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10 border-amber-600/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  Ongoing Projects ({ongoingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectType('upcoming')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent",
                    projectType === 'upcoming'
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/10 border-red-600/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  Upcoming Projects ({upcomingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('completed_projects');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  Completed Projects ({completedProjectsData.length})
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search project name, objective, partner..."
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setProjectPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="relative" ref={partnerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground hover:bg-muted/30 hover:border-primary/30 focus:outline-none focus:border-primary/50 transition-all duration-150 font-medium shadow-sm"
                  >
                    <span className="truncate">Partner: {projectPartnerFilter === 'all' ? 'All Development Partners' : projectPartnerFilter}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150", isPartnerDropdownOpen && "rotate-180")} />
                  </button>
                  {isPartnerDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => { setProjectPartnerFilter('all'); setIsPartnerDropdownOpen(false); setProjectPage(1); }}
                        className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", projectPartnerFilter === 'all' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                      >
                        <span>All Development Partners</span>
                        {projectPartnerFilter === 'all' && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      {['EXIM Bank of India', 'World Bank', 'ADB', 'AIIB', 'JICA', 'EDCF', 'KfW', 'Exim Bank China (G to G)', 'Indian LoC', 'N/A'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setProjectPartnerFilter(p); setIsPartnerDropdownOpen(false); setProjectPage(1); }}
                          className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", projectPartnerFilter === p ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                        >
                          <span>{p}</span>
                          {projectPartnerFilter === p && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 gap-6">
                {paginatedProjects.map((proj, idx) => {
                  const isOngoing = 'status' in proj && typeof proj.status === 'object';
                  
                  if (isOngoing) {
                    const oProj = proj as any;
                    const physicalVal = parseFloat(oProj.status.physical.replace(/%/g, ''));
                    const financialVal = parseFloat(oProj.status.financial.replace(/%/g, ''));
                    
                    return (
                      <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                        {/* Title & Status */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{oProj.name}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                                Partner: {oProj.partner}
                              </span>
                              <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                                Duration: {oProj.duration}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress Bars */}
                          <div className="flex items-center gap-6 shrink-0 bg-muted/10 p-3 rounded-2xl border border-border/20">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-8 text-[10px] font-bold text-foreground">
                                <span>Physical Progress</span>
                                <span className="text-primary font-mono">{oProj.status.physical}</span>
                              </div>
                              <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${physicalVal}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-8 text-[10px] font-bold text-foreground">
                                <span>Financial Progress</span>
                                <span className="text-emerald-500 font-mono">{oProj.status.financial}</span>
                              </div>
                              <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${financialVal}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Objectives & Scope */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {oProj.objectives.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {oProj.scope.map((scp: string, i: number) => (
                                <li key={i}>{scp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cost Grid */}
                        <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                            {renderProjectCost(oProj.cost.total)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">GOB Contribution</span>
                            {renderProjectCost(oProj.cost.gob)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                            {renderProjectCost(oProj.cost.pa)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">PGCB Funding</span>
                            {renderProjectCost(oProj.cost.pgcb)}
                          </div>
                        </div>

                        {/* Footer: Contacts & Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span><strong>Project Director:</strong> {oProj.director}</span>
                            <span>•</span>
                            <span>
                              <strong>Office:</strong> {oProj.office}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Mobile:</strong> <a href={`tel:${oProj.mobile}`} className="text-primary hover:underline font-medium">{oProj.mobile}</a>
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Email:</strong> <a href={`mailto:${oProj.email}`} className="text-primary hover:underline font-medium">{oProj.email}</a>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                            <span>Source: {oProj.source}</span>
                            <span>Updated: {oProj.lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const uProj = proj as any;
                    const statusInfo = getUpcomingProjectStatusInfo(uProj.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                        {/* Title & Status */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{uProj.name}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                                Partner: {uProj.partner}
                              </span>
                              <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                                Duration: {uProj.duration}
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badge & Status Details */}
                          <div className="flex items-center gap-3 shrink-0 bg-muted/10 p-3 rounded-2xl border border-border/20 max-w-xs md:max-w-md">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <StatusIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider", statusInfo.bgColor, statusInfo.textColor)}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                                {uProj.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Objectives & Scope */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {uProj.objectives.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {uProj.scope.map((scp: string, i: number) => (
                                <li key={i}>{scp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cost Grid */}
                        <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                            {renderProjectCost(uProj.cost.total)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                            {renderProjectCost(uProj.cost.pa)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Development Partner</span>
                            <div className="font-bold text-foreground">{uProj.partner}</div>
                          </div>
                        </div>

                        {/* Footer: Contacts & Meta (Omitted Director details) */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-md border border-border/20">
                              Upcoming Pipeline Project
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                            <span>Source: {uProj.source}</span>
                            <span>Updated: {uProj.lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {filteredProjects.length === 0 && (
                  <div className="card p-12 text-center text-muted-foreground text-sm border-dashed border-border/60">
                    No {projectType} projects found matching the filters or search query.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalProjectPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium">{(projectPage - 1) * projectsPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(projectPage * projectsPerPage, filteredProjects.length)}</span> of{" "}
                    <span className="font-medium">{filteredProjects.length}</span> {projectType} projects
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={projectPage === 1}
                      onClick={() => setProjectPage(projectPage - 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                    </button>
                    <div className="text-xs font-semibold text-foreground">
                      Page {projectPage} of {totalProjectPages}
                    </div>
                    <button
                      type="button"
                      disabled={projectPage === totalProjectPages}
                      onClick={() => setProjectPage(projectPage + 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              <GridCardFooter>
                <span>Source: PGCB project documents, cited per project on each card above</span>
                <span>
                  Every project&apos;s name, partner, cost, duration and status is as the
                  source document states it. The counts are ours — they count the records
                  held here. {projectType === 'ongoing'
                    ? 'Checked against PGCB’s live ongoing-projects list on 13 Aug 2026: all 13 match, with nothing on their list missing here and nothing here absent from theirs.'
                    : 'PGCB publishes no upcoming-projects list on its site, so unlike the ongoing and completed registers these 7 cannot be reconciled against a live PGCB page.'}
                </span>
                <span className="font-medium">Registry: {projectType === 'ongoing' ? 'Ongoing' : 'Upcoming'} projects</span>
              </GridCardFooter>
            </div>
          )}

          {/* Sub-tab: Completed Projects */}
          {transSubTab === 'completed_projects' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header block */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Completed Projects
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive registry of successfully completed high-voltage transmission lines, substations, and grid network infrastructure projects.
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0 font-mono inline-flex items-center gap-1">
                  <GridProvenanceTag kind="D" />
                  {completedProjectsData.length} Completed Projects
                </span>
              </div>

              {/* Project Type Toggle Pills */}
              <div className="flex items-center gap-2 p-1 bg-muted/20 border border-border/30 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('projects');
                    setProjectType('ongoing');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  Ongoing Projects ({ongoingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('projects');
                    setProjectType('upcoming');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  Upcoming Projects ({upcomingProjectsData.length})
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 border-emerald-600/20"
                  )}
                >
                  <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  Completed Projects ({completedProjectsData.length})
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search completed project name, objective, scope..."
                    value={completedSearch}
                    onChange={(e) => {
                      setCompletedSearch(e.target.value);
                      setCompletedPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="relative" ref={completedPartnerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCompletedPartnerDropdownOpen(!isCompletedPartnerDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground hover:bg-muted/30 hover:border-primary/30 focus:outline-none focus:border-primary/50 transition-all duration-150 font-medium shadow-sm"
                  >
                    <span className="truncate">Partner: {completedPartnerFilter === 'all' ? 'All Development Partners' : completedPartnerFilter}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150", isCompletedPartnerDropdownOpen && "rotate-180")} />
                  </button>
                  {isCompletedPartnerDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => { setCompletedPartnerFilter('all'); setIsCompletedPartnerDropdownOpen(false); setCompletedPage(1); }}
                        className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", completedPartnerFilter === 'all' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                      >
                        <span>All Development Partners</span>
                        {completedPartnerFilter === 'all' && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      {['ADB', 'IDB', 'World Bank', 'JICA', 'EDCF', 'KfW', 'DANIDA', 'PGCB', 'N/A'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setCompletedPartnerFilter(p); setIsCompletedPartnerDropdownOpen(false); setCompletedPage(1); }}
                          className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", completedPartnerFilter === p ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                        >
                          <span>{p}</span>
                          {completedPartnerFilter === p && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 gap-6">
                {paginatedCompletedProjects.map((proj, idx) => (
                  <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                    {/* Title & Status */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{proj.name}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                            Partner: {proj.partner}
                          </span>
                          <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                            Duration: {proj.duration}
                          </span>
                        </div>
                      </div>
                      
                      {/* Completed status badge */}
                      <div className="flex items-center gap-3 shrink-0 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            Completed Project
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Objectives & Scope */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                      <div className="space-y-2">
                        <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                        {proj.objectives.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                            {proj.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No objectives detailed.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                        <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                          {proj.scope.map((scp, i) => (
                            <li key={i}>{scp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Cost Grid */}
                    <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                        {renderProjectCost(proj.cost.total)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">GOB Contribution</span>
                        {renderProjectCost(proj.cost.gob)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                        {renderProjectCost(proj.cost.pa)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">PGCB Funding</span>
                        {renderProjectCost(proj.cost.pgcb)}
                      </div>
                    </div>

                    {/* Footer: Contacts & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-md border border-border/20">
                          Successfully Commissioned
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                        <span>Source: {proj.source}</span>
                        <span>Updated: {proj.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCompletedProjects.length === 0 && (
                  <div className="card p-12 text-center text-muted-foreground text-sm border-dashed border-border/60">
                    No completed projects found matching the filters or search query.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalCompletedProjectPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium">{(completedPage - 1) * completedPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(completedPage * completedPerPage, filteredCompletedProjects.length)}</span> of{" "}
                    <span className="font-medium">{filteredCompletedProjects.length}</span> completed projects
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={completedPage === 1}
                      onClick={() => setCompletedPage(completedPage - 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                    </button>
                    <div className="text-xs font-semibold text-foreground">
                      Page {completedPage} of {totalCompletedProjectPages}
                    </div>
                    <button
                      type="button"
                      disabled={completedPage === totalCompletedProjectPages}
                      onClick={() => setCompletedPage(completedPage + 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              <GridCardFooter>
                <span>Source: PGCB project documents, cited per project on each card above</span>
                <span>
                  Each completed project is described as its source document states it;
                  the count is ours. Checked against PGCB&apos;s live completed-projects
                  list on 13 Aug 2026: <strong className="text-foreground">50 of these 51
                  appear on it, and none of theirs is missing here.</strong> The one
                  exception is the Western Grid Network Development Project (kfW,
                  completed June 2022), which PGCB&apos;s current list does not carry. It is
                  kept rather than dropped — a project finishing is not a reason to erase
                  it — but it stands on our record alone.
                </span>
                <span className="font-medium">Registry: Completed projects</span>
              </GridCardFooter>
            </div>
          )}

          {/* Sub-tab 5: National Grid Network Diagram */}
          {transSubTab === 'grid_net' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/25 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                      <Network className="h-6 w-6 shrink-0 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">National Grid Network Diagram</h3>
                          <p className="text-sm text-muted-foreground">Schematic mapping of grid interconnectivity across Bangladesh</p>
                        </div>
                        <a
                          href="/pdf/national_grid_network.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    This official schematic diagram depicts the complete topology of the Bangladesh electricity transmission network, mapping the electrical connections between power generation stations, high-voltage transmission lines (400 kV, 230 kV, and 132 kV), and grid substations.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/national_grid_network.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="National Grid Network Diagram"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> Diagram Key &amp; Technical Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Line Voltages</strong>
                    Red lines represent 400 kV circuits; blue/amber lines show 230 kV and 132 kV circuits respectively.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Substation Nodes</strong>
                    Circles represent grid substations. Solid lines entering/leaving circles represent active bus bar feeders.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Asynchronous Interface</strong>
                    High-Voltage Direct Current (HVDC) station links at borders are represented as block interface icons.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Document Details</strong>
                    Published officially by PGCB (Power Grid Company of Bangladesh) System Operations &amp; Planning Division.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 5: Geographical Grid Map */}
          {transSubTab === 'geo_map' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-teal-500/5 via-primary/5 to-transparent border-teal-500/20 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20 shrink-0">
                      <MapPin className="h-6 w-6 shrink-0 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Geographical Grid Map</h3>
                          <p className="text-sm text-muted-foreground">Geographic layout and physical routing of national transmission lines</p>
                        </div>
                        <a
                          href="/pdf/geo_map.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    This geographical map projects all high-voltage pylon paths and transmission line routing across the physical terrain of Bangladesh. It details grid line runs crossing major rivers (such as Padma and Jamuna) and the locations of substations relative to regional load centers.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/geo_map.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="Geographical Grid Map"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-teal-400" /> Mapping &amp; Geography Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Physical Routing</strong>
                    Traces the geographical paths of pylons. Crucial for understanding regional grid vulnerability to natural hazards (e.g. floods, cyclones).
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">River Crossings</strong>
                    Includes details of special high-tension long-span river-crossing towers engineered across active delta rivers.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Scale Projection</strong>
                    Geospatial representations conform to official national grid system projections.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Data Sources</strong>
                    Sourced from PGCB Engineering and Survey Departments.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 6: OPGW Fiber Network Map */}
          {transSubTab === 'opgw_map' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-purple-500/5 via-primary/5 to-transparent border-purple-500/20 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 shrink-0">
                      <Map className="h-6 w-6 shrink-0 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">OPGW Fiber Network Map</h3>
                          <p className="text-sm text-muted-foreground">National Optical Ground Wire (OPGW) telecommunication backbone network</p>
                        </div>
                        <a
                          href="/pdf/opgw_map.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Optical Ground Wire (OPGW) is a dual-functioning cable. It acts as a conventional shield wire at the top of transmission towers to protect lines from lightning strikes, while containing optical fibers used for PGCB's protection signaling, SCADA telemetry, and commercial telecommunication leases.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/opgw_map.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="OPGW Fiber Network Map"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-purple-400" /> OPGW &amp; Telecom Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">OPGW (Optical Ground Wire)</strong>
                    A ground/shield wire containing optical fiber cores. Installed on pylon tops for dual lightning shielding and high-speed data transmission.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">SCADA &amp; Telemetry</strong>
                    Optic lines provide real-time connection from grid stations to the National Load Dispatch Center (NLDC) for remote data monitoring.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Commercial Leasing</strong>
                    PGCB leases spare fiber capacity (dark fiber cores) to telecom operators, ISP companies, and state agencies.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Planning Source</strong>
                    Published officially by PGCB Telecommunications Division.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 7: Optical Fiber Leasing */}
          {transSubTab === 'opgw_lease' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Introduction Card */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-emerald-500/5 via-primary/5 to-transparent border-emerald-500/25 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 shrink-0">
                      <TakaIcon className="h-6 w-6 shrink-0" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">Optical Fiber Leasing</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Power Grid Bangladesh PLC (Power Grid) is responsible to transmit high voltage power across the whole country. Previously Power Grid used earth wire/ground wire to protect the transmission line from thundering. Before 2008, Power Grid used analog PLC (Power Line Carriers) based technology for telecommunication, SCADA (Supervisory Control and Data Acquisition) and power transmission system protection. After 2008, Power Grid adopted new optical fiber based communication technology replacing the prevalent ground wire by modern OPGW (Optical Ground Wire) with modern digital communication system for reliable and faster telecommunication, SCADA and system protection.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-emerald-500/40 pl-3">
                    Till June 2026, Power Grid has installed around 11,876 km of OPGW across the country along with its high voltage transmission lines. Besides Power Grid's own needs, the unused optical fibers are being leased out to local telecommunication operator according to approved lease rate and standard contract document with a view to developing national telecommunication infrastructure.
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Stats Summary Column */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Licensing & Networks */}
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                      <Network className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">Licensing &amp; Leasing Agreements</h4>
                        <p className="text-xs text-muted-foreground">National regulatory and partner allocations</p>
                      </div>
                    </div>
                    <ul className="space-y-3 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <strong>NTTN Licensing:</strong> Power Grid has obtained NOFTTN (Nationwide Optical Fiber Telecommunication Transmission Network) license in 2005 which was later transformed into NTTN (Nationwide Telecommunication Transmission Network) license in 2014.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <GridProvenanceTag kind="P" className="me-1" />
                          <strong>Partner Organizations:</strong> Total 10 (ten) organizations including other NTTN license holders and Mobile network operators are using Power Grid's OPGW-based optical fiber under leasing agreement.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <GridProvenanceTag kind="P" className="me-1" />
                          <strong>Capacity Leased:</strong> Total 22,611.66 KM (22,611.66 x 2=45,223.33 Core-km) of optical fiber core has been leased till June 2026.
                          <span className="block text-[10px] text-muted-foreground/80 mt-1">
                            Quoted as PGCB writes it, including the arithmetic: 22,611.66 &times; 2
                            is 45,223.32, not the 45,223.33 printed. The figure is left as
                            published rather than silently corrected.
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Backbone & Internet Capacity */}
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                      <Globe className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">Transmission Network &amp; Backbone Capacity</h4>
                        <p className="text-xs text-muted-foreground">Dhaka – Kuakata – Benapole route deployment stats</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-xs text-muted-foreground">
                      <p>
                        With the aim of delivering internet services to the people of the country through Power Grid's robust and highly available fiber network, Power Grid has established a data transmission network with <strong>9.6 / 13.2 Tbps</strong> backbone capacity (operational capacity: 800 Gbps) along the Dhaka–Kuakata–Benapole route.
                      </p>
                      <div className="p-3 bg-muted/10 border border-border/30 rounded-xl flex items-center justify-between">
                        <span>Leased Data Capacity (Dec 2025)</span>
                        <span className="font-bold text-foreground">200 Gbps <span className="text-[10px] text-muted-foreground font-normal">(To International Internet Gateway (IIG) operators)</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commercial Pricing Column */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Pricing Card */}
                  <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-emerald-500/5 border-emerald-500/20 flex flex-col justify-between min-h-[15rem]">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
                          <TakaIcon className="h-4 w-4 shrink-0" />
                        </div>
                        <h4 className="font-bold text-foreground uppercase tracking-wider text-xs">Dark Fiber Lease Rate</h4>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Effective: 01.01.2026</span>
                        <div className="text-2xl font-black text-foreground tabular-nums flex items-baseline gap-1">
                          Tk. 5.40
                          <span className="text-xs font-normal text-muted-foreground">/ Core / Meter / Month</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                          Monthly Recurring Charge (MRC) including Tax &amp; excluding VAT.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-3 mt-4 text-[10px] text-emerald-500 font-semibold flex justify-between items-center">
                      <span>Annual Increment</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-500">Tk. 0.20 / Year</span>
                    </div>
                  </div>

                  {/* Contacts details Card */}
                  <div className="grid-explorer-chart-card card p-6 space-y-4">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">OFCL Contact Details</h4>
                    <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                      <div>
                        <strong className="text-foreground block font-bold">Superintending Engineer</strong>
                        Optical Fiber Commercial Leasing (OFCL)
                      </div>
                      <div>
                        <strong className="text-foreground block font-bold">Office Address:</strong>
                        Level-10, Grid Bhaban, Avenue-3, Jahurul Islam City, Aftabnagar, Badda, Dhaka-1212.
                      </div>
                      <div className="border-t border-border/20 pt-2.5">
                        <strong className="text-foreground block font-bold">Email Query:</strong>
                        <a href="mailto:se.ofcl@pgcb.gov.bd" className="text-primary hover:underline font-semibold">se.ofcl@pgcb.gov.bd</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Core-km</strong>
                    Fibre length multiplied by how many strands run through it. 10 km of cable carrying 2 strands is 20 core-km.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Tbps / Gbps</strong>
                    Internet speed. 1 Tbps is a thousand times 1 Gbps — roughly the capacity of a national backbone versus a large office.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">NTTN / NTTN License</strong>
                    The licence that lets a company rent out long-distance fibre to phone and internet providers. PGCB holds one.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Dark Optical Fiber</strong>
                    Spare fibre strands with no signal running through them. PGCB rents them out and the tenant lights them up with their own equipment.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">SCADA / PLC</strong>
                    SCADA is the control-room system operators watch the grid through. PLC was the old way of sending those signals down the power lines themselves.
                  </div>
                </div>
              </div>

              <GridCardFooter>
                <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — Optical Fiber Commercial Leasing</span>
                <span>
                  Fiber lengths, partner counts, backbone capacity and the lease rate are
                  quoted as PGCB publishes them. Nothing on this page is computed here.
                </span>
                <span className="font-medium">Stated as at: June 2026 &middot; rate effective 01.01.2026</span>
              </GridCardFooter>
            </div>
          )}
            </div>
          </div>
        </div>
        </GridLockedContent> )
  );
}
