'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, Scale, FileJson, Plus, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, AlertTriangle, ExternalLink, ChevronRight, Star, RotateCcw,
} from 'lucide-react';
import { POLICY_GROUPS, POLICY_STATUSES, type Policy, type PolicyStatus } from '@/lib/data/policy/policies';
import { DEFAULT_IMPORTANT_LINKS } from '@/lib/data/important-links';

const STATUS_PILL: Record<PolicyStatus, string> = {
  'In force': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Repealed: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  Superseded: 'bg-stone-500/15 text-stone-600 dark:text-stone-400',
};

const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Uniform circular icon button (matches .admin-category-delete geometry, neutral tone). */
const ICON_BTN = 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none';

function slugify(input: string) {
  return input.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function blankPolicy(): Policy {
  return {
    slug: '', title: '', short: '', group: 'acts', authority: '', year: '',
    status: 'In force', featured: false,
    source: { label: '', url: '', verified: true },
    brief: { overview: '', keyPoints: [] },
  };
}

interface PanelsEditorProps {
  panelImportantLinks: boolean;
  setPanelImportantLinks: (v: boolean) => void;
  panelPolicyFramework: boolean;
  setPanelPolicyFramework: (v: boolean) => void;
  policyItems: Policy[];
  setPolicyItems: (v: Policy[]) => void;
  ilText: string;
  ilError: string | null;
  onIlTextChange: (text: string) => void;
  onIlReset: () => void;
}

export function PanelsEditor({
  panelImportantLinks, setPanelImportantLinks,
  panelPolicyFramework, setPanelPolicyFramework,
  policyItems, setPolicyItems,
  ilText, ilError, onIlTextChange, onIlReset,
}: PanelsEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const patchItem = (idx: number, patch: Partial<Policy>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const patchBrief = (idx: number, patch: Partial<Policy['brief']>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, brief: { ...it.brief, ...patch } } : it)));
  const patchSource = (idx: number, patch: Partial<Policy['source']>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, source: { ...it.source, ...patch } } : it)));

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= policyItems.length) return;
    const next = [...policyItems];
    [next[idx], next[target]] = [next[target], next[idx]];
    setPolicyItems(next);
    setExpanded(null);
  };
  const remove = (idx: number) => {
    setPolicyItems(policyItems.filter((_, i) => i !== idx));
    setExpanded(null);
  };
  const add = () => {
    setPolicyItems([...policyItems, blankPolicy()]);
    setExpanded(policyItems.length);
  };

  const featuredCount = policyItems.filter((p) => p.featured).length;

  return (
    <div className="admin-form-stack">
      {/* Visibility toggles */}
      <div className="admin-card settings-panel p-6 space-y-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><LayoutGrid className="h-4.5 w-4.5 text-primary" /> Sidebar Panel Visibility</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Show or hide each reference directory in the homepage sidebar.</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <div
            onClick={() => setPanelImportantLinks(!panelImportantLinks)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
          >
            <span>
              <span className="block text-sm font-medium">Important Official Links</span>
              <span className="block text-xs text-muted-foreground">MPEMR directory of official sites</span>
            </span>
            <Switch checked={panelImportantLinks} onCheckedChange={setPanelImportantLinks} onClick={(e) => e.stopPropagation()} aria-label="Toggle Important Official Links panel" />
          </div>
          <div
            onClick={() => setPanelPolicyFramework(!panelPolicyFramework)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
          >
            <span>
              <span className="block text-sm font-medium">Policy &amp; Regulatory Framework</span>
              <span className="block text-xs text-muted-foreground">Acts, policies, regulations &amp; regulators</span>
            </span>
            <Switch checked={panelPolicyFramework} onCheckedChange={setPanelPolicyFramework} onClick={(e) => e.stopPropagation()} aria-label="Toggle Policy & Regulatory Framework panel" />
          </div>
        </div>
      </div>

      {/* Policy Framework structured editor */}
      <div className="admin-card settings-panel p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Scale className="h-4.5 w-4.5 text-primary" /> Policy &amp; Regulatory Framework</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {policyItems.length} entries · {featuredCount} featured in sidebar. Featured entries show on the homepage; all appear in the /energy-policy library.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add entry
          </button>
        </div>

        {policyItems.length === 0 && (
          <p className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            No entries yet. Click <span className="font-medium text-foreground">Add entry</span> to create one.
          </p>
        )}

        <div className="space-y-2.5">
          {policyItems.map((item, idx) => {
            const isOpen = expanded === idx;
            const groupTitle = POLICY_GROUPS.find((g) => g.key === item.group)?.title ?? item.group;
            return (
              <div key={idx} className={cn('rounded-xl border bg-card/40 transition-colors', isOpen ? 'border-primary/40' : 'border-border/60')}>
                {/* Summary header row */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : idx)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={isOpen}
                  >
                    <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90 text-primary')} />
                    <span className="truncate text-sm font-medium">{item.title || <span className="text-muted-foreground italic">Untitled entry</span>}</span>
                    {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
                    <span className={cn('shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide', STATUS_PILL[item.status])}>{item.status}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Move up" onClick={() => move(idx, -1)} disabled={idx === 0} className={ICON_BTN}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Move down" onClick={() => move(idx, 1)} disabled={idx === policyItems.length - 1} className={ICON_BTN}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Remove entry" onClick={() => remove(idx)} className="admin-category-delete opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Expanded fields */}
                {isOpen && (
                  <div className="grid gap-3 border-t border-border/50 px-4 py-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          patchItem(idx, item.slug ? { title } : { title, slug: slugify(title) });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Short name</Label>
                      <Input value={item.short} onChange={(e) => patchItem(idx, { short: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Slug <span className="font-normal text-muted-foreground">(URL)</span></Label>
                      <Input value={item.slug} onChange={(e) => patchItem(idx, { slug: slugify(e.target.value) })} className="mt-1 font-mono text-xs" placeholder="auto-from-title" />
                    </div>
                    <div>
                      <Label>Group</Label>
                      <select value={item.group} onChange={(e) => patchItem(idx, { group: e.target.value as Policy['group'] })} className={SELECT_CLASS}>
                        {POLICY_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select value={item.status} onChange={(e) => patchItem(idx, { status: e.target.value as Policy['status'] })} className={SELECT_CLASS}>
                        {POLICY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Authority</Label>
                      <Input value={item.authority} onChange={(e) => patchItem(idx, { authority: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input value={item.year} onChange={(e) => patchItem(idx, { year: e.target.value })} className="mt-1" />
                    </div>
                    <div
                      onClick={() => patchItem(idx, { featured: !item.featured })}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 md:col-span-2"
                    >
                      <Switch checked={!!item.featured} onCheckedChange={(v) => patchItem(idx, { featured: v })} onClick={(e) => e.stopPropagation()} aria-label="Featured in sidebar" />
                      <span className="text-sm">Feature in the homepage sidebar</span>
                    </div>
                    <div>
                      <Label>Source label</Label>
                      <Input value={item.source.label} onChange={(e) => patchSource(idx, { label: e.target.value })} className="mt-1" placeholder="e.g. bdlaws.minlaw.gov.bd" />
                    </div>
                    <div>
                      <Label>Source URL</Label>
                      <Input value={item.source.url} onChange={(e) => patchSource(idx, { url: e.target.value })} className="mt-1 font-mono text-xs" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Overview</Label>
                      <Textarea value={item.brief.overview} onChange={(e) => patchBrief(idx, { overview: e.target.value })} className="mt-1" rows={3} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Key points <span className="font-normal text-muted-foreground">(one per line)</span></Label>
                      <Textarea
                        value={item.brief.keyPoints.join('\n')}
                        onChange={(e) => patchBrief(idx, { keyPoints: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Official Links JSON editor */}
      <div className="admin-card settings-panel p-6 space-y-3">
        <div className="flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><FileJson className="h-4.5 w-4.5 text-primary" /> Important Official Links</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edit the nested ministry directory as JSON. Icon names: <code className="rounded bg-muted px-1 text-[11px]">Zap, Flame, Network, Fuel, Droplet, Mountain, Factory, Waypoints, ShieldCheck</code> · tints: <code className="rounded bg-muted px-1 text-[11px]">amber, sky, emerald, orange, teal, cyan, violet, stone</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onIlReset}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to default
          </button>
        </div>

        <div className={cn('flex items-center gap-1.5 text-xs font-medium', ilError ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400')}>
          {ilError ? <><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {ilError}</> : <><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Valid JSON — {DEFAULT_IMPORTANT_LINKS.sections.length} value-chain sections supported</>}
        </div>

        <Textarea
          value={ilText}
          onChange={(e) => onIlTextChange(e.target.value)}
          className={cn('font-mono text-xs leading-relaxed', ilError && 'border-rose-500/50 focus-visible:ring-rose-500/40')}
          rows={22}
          spellCheck={false}
        />

        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          Preview on homepage <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
