'use client';

import '@/app/grid-phone-export.css';
import { useState, useTransition, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, Download, FileSpreadsheet, FileText, FileType, Sparkles } from 'lucide-react';
import { DatePickerField } from '@/components/members/DatePickerField';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSession } from '@/utils/supabase/auth-context';
import { cn } from '@/lib/utils';
import {
  resolveGridAccessTier,
  getEarliestAllowedDate,
  subtractDaysFromIso,
  GRID_TIER_LIMITS,
} from '@/lib/data/grid/grid-tier-access';
import {
  GRID_EXPORT_DATASETS,
  GRID_EXPORT_CATEGORIES,
  ALL_DATASET_KEYS,
  tabToDatasetKeys,
  columnLabel,
  type GridExportDatasetKey,
} from '@/lib/data/grid/grid-export-datasets';
import { parseGridExplorerTab, parseGridExplorerDate } from '@/lib/grid-explorer-url';

type ExportFormat = 'csv' | 'xlsx' | 'pdf';
type ScopePreset = 'day' | '7' | '30' | 'max' | 'custom';

const ALL_DAILY_KEYS = GRID_EXPORT_CATEGORIES.find((c) => c.id === 'daily')!.keys;

const UPGRADE_HREF = '/members/subscription';
/** Gentle client-side breather between downloads — discourages accidental re-clicks. */
const COOLDOWN_MS = 5000;

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match ? match[1] : null;
}

function readExplorerState(latestDate: string): { anchor: string; datasetKeys: GridExportDatasetKey[] } {
  if (typeof window === 'undefined') {
    return { anchor: latestDate, datasetKeys: tabToDatasetKeys('overview') };
  }
  const params = new URLSearchParams(window.location.search);
  const anchor = parseGridExplorerDate(params.get('date')) ?? latestDate;
  const tab = parseGridExplorerTab(params.get('tab')) ?? 'overview';
  return { anchor, datasetKeys: tabToDatasetKeys(tab) };
}

export function GridExportDialog({
  latestDate,
  earliestDate,
  className,
}: {
  latestDate: string;
  earliestDate: string;
  className?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [preset, setPreset] = useState<ScopePreset>('day');
  const [selectedKeys, setSelectedKeys] = useState<Set<GridExportDatasetKey>>(
    () => new Set(tabToDatasetKeys('overview')),
  );
  const [expanded, setExpanded] = useState<Set<GridExportDatasetKey>>(new Set());
  // Per-dataset column selection; a key absent here means "all columns".
  const [columnSel, setColumnSel] = useState<Partial<Record<GridExportDatasetKey, Set<string>>>>({});
  const [anchor, setAnchor] = useState(latestDate);
  // Custom from/to range (used when preset === 'custom').
  const [customFrom, setCustomFrom] = useState(latestDate);
  const [customTo, setCustomTo] = useState(latestDate);
  const [pending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    setNow(Date.now());
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntil) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const onCooldown = cooldownRemaining > 0;

  function startCooldown(ms: number) {
    setNow(Date.now());
    setCooldownUntil(Date.now() + ms);
  }

  const tier = resolveGridAccessTier({
    isAuthenticated: !!session?.user,
    role: session?.user?.role,
    gridPlan: session?.user?.gridPlan,
  });
  const tierLimits = GRID_TIER_LIMITS[tier];
  const isTopTier = tier === 'plan_999';

  function onOpenChange(next: boolean) {
    if (next) {
      const state = readExplorerState(latestDate);
      setAnchor(state.anchor);
      setCustomFrom(state.anchor);
      setCustomTo(state.anchor);
      setSelectedKeys(new Set(state.datasetKeys));
    }
    setOpen(next);
  }

  const activeKeys = ALL_DATASET_KEYS.filter((k) => selectedKeys.has(k));

  function toggleKey(key: GridExportDatasetKey) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setKeys(keys: GridExportDatasetKey[]) {
    setSelectedKeys(new Set(keys));
  }

  function toggleCategory(keys: GridExportDatasetKey[], allOn: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (allOn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  const allColsFor = (key: GridExportDatasetKey) => GRID_EXPORT_DATASETS[key].columns.map((c) => c.key);

  function isColChecked(key: GridExportDatasetKey, col: string): boolean {
    const sel = columnSel[key];
    return sel ? sel.has(col) : true; // absent = all selected
  }

  function toggleExpand(key: GridExportDatasetKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCol(key: GridExportDatasetKey, col: string) {
    setColumnSel((prev) => {
      const cur = new Set(prev[key] ?? allColsFor(key));
      if (cur.has(col)) cur.delete(col);
      else cur.add(col);
      return { ...prev, [key]: cur };
    });
  }

  function setAllCols(key: GridExportDatasetKey, on: boolean) {
    setColumnSel((prev) => ({ ...prev, [key]: new Set(on ? allColsFor(key) : []) }));
  }

  function computeRange(): { from: string; to: string } {
    switch (preset) {
      case 'day':
        return { from: anchor, to: anchor };
      case '7':
        return { from: subtractDaysFromIso(anchor, 6) ?? anchor, to: anchor };
      case '30':
        return { from: subtractDaysFromIso(anchor, 29) ?? anchor, to: anchor };
      case 'max': {
        const tierEarliest = getEarliestAllowedDate(tier, latestDate);
        return { from: tierEarliest ?? earliestDate, to: latestDate };
      }
      case 'custom': {
        let from = parseGridExplorerDate(customFrom) ?? anchor;
        let to = parseGridExplorerDate(customTo) ?? anchor;
        if (from > to) [from, to] = [to, from];
        return { from, to };
      }
    }
  }

  function handleDownload() {
    startTransition(async () => {
      if (activeKeys.length === 0) {
        toast.warning('Select at least one dataset to export.');
        return;
      }
      const { from, to } = computeRange();
      const datasets =
        activeKeys.length === ALL_DATASET_KEYS.length ? 'all' : activeKeys.join(',');
      const params = new URLSearchParams({ format, from, to, datasets });
      // Per-dataset column subsets — only when a proper (non-empty) subset is chosen.
      for (const key of activeKeys) {
        const sel = columnSel[key];
        if (!sel) continue;
        const all = allColsFor(key);
        if (sel.size > 0 && sel.size < all.length) {
          params.set(`col_${key}`, all.filter((c) => sel.has(c)).join(','));
        }
      }
      try {
        const res = await fetch(`/api/members/grid-export?${params.toString()}`);
        if (res.status === 429) {
          const body = await res.json().catch(() => null);
          const retry = Number(body?.retryAfter ?? res.headers.get('Retry-After')) || 30;
          startCooldown(retry * 1000);
          toast.warning(body?.error ?? `Too many downloads — try again in ${retry}s.`);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? 'Export failed');
        }
        const note = res.headers.get('X-Export-Note');
        const days = res.headers.get('X-Export-Days');
        const fallbackExt =
          format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : activeKeys.length === 1 ? 'csv' : 'zip';
        const filename =
          parseFilename(res.headers.get('Content-Disposition')) ?? `esb-grid-export.${fallbackExt}`;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(days ? `Exported ${days} day${days === '1' ? '' : 's'} of grid data` : 'Grid data exported');
        if (note) {
          toast.info(note, { duration: 7000 });
        }
        window.dispatchEvent(new CustomEvent('esb-download-sync'));
        router.refresh();
        startCooldown(COOLDOWN_MS);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not export grid data');
      }
    });
  }

  const presetLabels: Record<ScopePreset, string> = {
    day: `This day (${anchor})`,
    '7': 'Last 7 days',
    '30': 'Last 30 days',
    max: `Max — ${tierLimits.shortLabel}`,
    custom: 'Custom range…',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn('btn btn-primary flex items-center justify-center gap-1.5 text-xs w-full py-2', className)}
        >
          <Download className="h-3.5 w-3.5" />
          Download grid data
        </button>
      </DialogTrigger>
      <DialogContent className="grid-export max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export grid data</DialogTitle>
          <DialogDescription>
            Download PGCB daily grid data for your selected range, capped to your access tier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid-export__cols grid gap-6 sm:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-5">
          {/* Format */}
          <fieldset className="grid-export__format space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format</legend>
            <div className="flex flex-col gap-1.5">
              <OptionButton
                active={format === 'xlsx'}
                onClick={() => setFormat('xlsx')}
                icon={<FileSpreadsheet className="h-4 w-4" />}
                label="Excel"
                hint=".xlsx workbook"
              />
              <OptionButton
                active={format === 'csv'}
                onClick={() => setFormat('csv')}
                icon={<FileText className="h-4 w-4" />}
                label="CSV"
                hint={activeKeys.length > 1 ? 'ZIP of CSVs' : 'single file'}
              />
              <OptionButton
                active={format === 'pdf'}
                onClick={() => setFormat('pdf')}
                icon={<FileType className="h-4 w-4" />}
                label="PDF"
                hint="branded report"
              />
            </div>
          </fieldset>

          {/* Scope */}
          <fieldset className="grid-export__range space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date range</legend>
            <div className="grid-export__presets grid grid-cols-2 gap-2">
              {(['day', '7', '30', 'max', 'custom'] as ScopePreset[]).map((p) => (
                <OptionButton
                  key={p}
                  active={preset === p}
                  onClick={() => setPreset(p)}
                  label={presetLabels[p]}
                />
              ))}
            </div>
            {preset === 'custom' && (
              <div className="grid-export__custom space-y-1.5 rounded-2xl border border-border/50 bg-muted/25 p-2.5 shadow-inner">
                <DatePickerField
                  label="From"
                  value={customFrom}
                  min={earliestDate}
                  max={latestDate}
                  onChange={setCustomFrom}
                />
                <div className="flex justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </span>
                </div>
                <DatePickerField
                  label="To"
                  value={customTo}
                  min={earliestDate}
                  max={latestDate}
                  onChange={setCustomTo}
                />
                <p className="pt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  Same date twice exports a single day. Ranges beyond your plan are trimmed automatically.
                </p>
              </div>
            )}
          </fieldset>

          {/* Tier note */}
          <div className="grid-export__tier flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Access: <span className="font-semibold text-foreground">{tierLimits.label}</span> · {tierLimits.shortLabel}
            </span>
            {!isTopTier && (
              <Link href={UPGRADE_HREF} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            )}
          </div>
          </div>

          <div className="min-w-0">
          {/* Datasets */}
          <fieldset className="grid-export__datasets space-y-2">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datasets
              </legend>
              <span className="text-[11px] text-muted-foreground">{activeKeys.length} selected</span>
            </div>

            {/* Presets — tuned for who is reading the export */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { label: 'Current view', keys: readExplorerState(latestDate).datasetKeys, format: undefined, hint: 'What you are looking at now' },
                  { label: 'Investor brief', keys: ['kpi', 'generation', 'fin_tariff', 'fin_budget', 'fin_economics', 'fin_petrobangla'] as GridExportDatasetKey[], format: 'pdf' as const, hint: 'KPIs + financial trends as a PDF report' },
                  { label: 'Researcher pack', keys: [...ALL_DATASET_KEYS], format: 'xlsx' as const, hint: 'Every dataset as an Excel workbook' },
                  { label: 'Quick overview', keys: ['kpi', 'generation', 'regional'] as GridExportDatasetKey[], format: 'pdf' as const, hint: 'The essentials, easy to read' },
                  { label: 'All daily', keys: [...ALL_DAILY_KEYS], format: undefined, hint: 'All per-day grid tables' },
                ]
              ).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  title={p.hint}
                  onClick={() => {
                    setKeys(p.keys);
                    if (p.format) setFormat(p.format);
                  }}
                  className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium hover:border-primary/50 hover:bg-muted/40"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setKeys([])}
                className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              >
                Clear
              </button>
            </div>

            {/* Grouped checkboxes */}
            <div className="space-y-3">
              {GRID_EXPORT_CATEGORIES.map((cat) => {
                const allOn = cat.keys.every((k) => selectedKeys.has(k));
                return (
                  <div key={cat.id} className="grid-export__cat rounded-lg border border-border/50 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.hint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCategory([...cat.keys], allOn)}
                        className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                      >
                        {allOn ? 'Clear' : 'Select all'}
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {cat.keys.map((k) => {
                        const cols = GRID_EXPORT_DATASETS[k].columns;
                        const selCount = cols.filter((c) => isColChecked(k, c.key)).length;
                        const isOpen = expanded.has(k);
                        return (
                          <div key={k}>
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-[11px] text-foreground">
                                <input
                                  type="checkbox"
                                  checked={selectedKeys.has(k)}
                                  onChange={() => toggleKey(k)}
                                  className="h-3.5 w-3.5 shrink-0 accent-primary"
                                />
                                <span className="truncate">{GRID_EXPORT_DATASETS[k].label}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => toggleExpand(k)}
                                className="shrink-0 text-[10px] font-medium text-primary hover:underline"
                              >
                                {isOpen ? 'Hide' : `Cols (${selCount}/${cols.length})`}
                              </button>
                            </div>
                            {isOpen && (
                              <div className="ml-5 mb-1 mt-1 rounded-md border border-border/40 bg-muted/20 p-1.5">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">
                                    {selCount}/{cols.length} columns
                                  </span>
                                  <span className="flex gap-1.5">
                                    <button type="button" onClick={() => setAllCols(k, true)} className="text-[10px] font-medium text-primary hover:underline">
                                      All
                                    </button>
                                    <button type="button" onClick={() => setAllCols(k, false)} className="text-[10px] font-medium text-muted-foreground hover:underline">
                                      None
                                    </button>
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                  {cols.map((c) => (
                                    <label
                                      key={c.key}
                                      className="flex cursor-pointer items-center gap-1 text-[10px] text-foreground"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isColChecked(k, c.key)}
                                        onChange={() => toggleCol(k, c.key)}
                                        className="h-3 w-3 shrink-0 accent-primary"
                                      />
                                      <span className="truncate">{columnLabel(c.header)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={pending || onCooldown || activeKeys.length === 0}
          className="grid-export__go btn btn-primary mt-1 flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {pending
            ? 'Preparing…'
            : onCooldown
              ? `Available in ${cooldownRemaining}s`
              : activeKeys.length === 0
                ? 'Select datasets'
                : `Download ${format === 'xlsx' ? 'Excel' : format === 'pdf' ? 'PDF' : 'CSV'}`}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function OptionButton({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
        active
          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
          : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        {icon}
        {label}
      </span>
      {hint && <span className="line-clamp-1 text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  );
}
