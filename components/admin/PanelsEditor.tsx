'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { LayoutGrid, Scale, FileJson, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { POLICY_GROUPS, POLICY_STATUSES, type Policy } from '@/lib/data/policy/policies';
import { DEFAULT_IMPORTANT_LINKS } from '@/lib/data/important-links';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function blankPolicy(): Policy {
  return {
    slug: '',
    title: '',
    short: '',
    group: 'acts',
    authority: '',
    year: '',
    status: 'In force',
    featured: false,
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

const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function PanelsEditor({
  panelImportantLinks,
  setPanelImportantLinks,
  panelPolicyFramework,
  setPanelPolicyFramework,
  policyItems,
  setPolicyItems,
  ilText,
  ilError,
  onIlTextChange,
  onIlReset,
}: PanelsEditorProps) {
  const patchItem = (idx: number, patch: Partial<Policy>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const patchBrief = (idx: number, patch: Partial<Policy['brief']>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, brief: { ...it.brief, ...patch } } : it)));
  const patchSource = (idx: number, patch: Partial<Policy['source']>) =>
    setPolicyItems(policyItems.map((it, i) => (i === idx ? { ...it, source: { ...it.source, ...patch } } : it)));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...policyItems];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPolicyItems(next);
  };
  const remove = (idx: number) => setPolicyItems(policyItems.filter((_, i) => i !== idx));
  const add = () => setPolicyItems([...policyItems, blankPolicy()]);

  return (
    <div className="admin-form-stack">
      {/* Visibility toggles */}
      <div className="admin-card settings-panel p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><LayoutGrid className="h-4.5 w-4.5 text-primary" /> Sidebar Panel Visibility</h2>
        <p className="text-sm text-muted-foreground">Show or hide each reference directory in the homepage sidebar.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <span className="block font-medium">Important Official Links</span>
              <span className="block text-xs text-muted-foreground">MPEMR directory of official government sites</span>
            </div>
            <Switch checked={panelImportantLinks} onCheckedChange={setPanelImportantLinks} aria-label="Toggle Important Official Links panel" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <span className="block font-medium">Policy &amp; Regulatory Framework</span>
              <span className="block text-xs text-muted-foreground">Acts, policies, regulations &amp; regulators</span>
            </div>
            <Switch checked={panelPolicyFramework} onCheckedChange={setPanelPolicyFramework} aria-label="Toggle Policy & Regulatory Framework panel" />
          </div>
        </div>
      </div>

      {/* Policy Framework structured editor */}
      <div className="admin-card settings-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Scale className="h-4.5 w-4.5 text-primary" /> Policy &amp; Regulatory Framework</h2>
            <p className="mt-1 text-sm text-muted-foreground">{policyItems.length} entries. &ldquo;Featured&rdquo; entries also appear in the homepage sidebar; all appear in the /energy-policy library.</p>
          </div>
          <button type="button" onClick={add} className="admin-btn admin-btn--sm inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/40">
            <Plus className="h-4 w-4" /> Add entry
          </button>
        </div>

        <div className="space-y-4">
          {policyItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" title="Move up" onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded p-1 hover:bg-muted/50 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" title="Move down" onClick={() => move(idx, 1)} disabled={idx === policyItems.length - 1} className="rounded p-1 hover:bg-muted/50 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" title="Remove" onClick={() => remove(idx)} className="rounded p-1 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
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
                  <Label>Slug (URL)</Label>
                  <Input value={item.slug} onChange={(e) => patchItem(idx, { slug: slugify(e.target.value) })} className="mt-1 font-mono text-xs" />
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
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2 md:col-span-2">
                  <Switch checked={!!item.featured} onCheckedChange={(v) => patchItem(idx, { featured: v })} aria-label="Featured in sidebar" />
                  <span className="text-sm">Featured in homepage sidebar</span>
                </div>
                <div>
                  <Label>Source URL</Label>
                  <Input value={item.source.url} onChange={(e) => patchSource(idx, { url: e.target.value })} className="mt-1 font-mono text-xs" />
                </div>
                <div>
                  <Label>Source label</Label>
                  <Input value={item.source.label} onChange={(e) => patchSource(idx, { label: e.target.value })} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Overview</Label>
                  <Textarea value={item.brief.overview} onChange={(e) => patchBrief(idx, { overview: e.target.value })} className="mt-1" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <Label>Key points <span className="text-muted-foreground font-normal">(one per line)</span></Label>
                  <Textarea
                    value={item.brief.keyPoints.join('\n')}
                    onChange={(e) => patchBrief(idx, { keyPoints: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Official Links JSON editor */}
      <div className="admin-card settings-panel p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><FileJson className="h-4.5 w-4.5 text-primary" /> Important Official Links</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit the ministry directory as JSON (deeply nested). Icons use names like{' '}
              <code className="rounded bg-muted px-1 text-xs">Zap, Flame, Network, Fuel, Droplet, Mountain, Factory, Waypoints, ShieldCheck</code>; tints:{' '}
              <code className="rounded bg-muted px-1 text-xs">amber, sky, emerald, orange, teal, cyan, violet, stone</code>.
            </p>
          </div>
          <button type="button" onClick={onIlReset} className="admin-btn admin-btn--sm shrink-0 rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/40">
            Reset to default
          </button>
        </div>

        <div className={cn('flex items-center gap-1.5 text-xs font-medium', ilError ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400')}>
          {ilError ? <><AlertTriangle className="h-3.5 w-3.5" /> {ilError}</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Valid JSON</>}
        </div>

        <Textarea
          value={ilText}
          onChange={(e) => onIlTextChange(e.target.value)}
          className="font-mono text-xs leading-relaxed"
          rows={22}
          spellCheck={false}
        />

        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          Preview on homepage <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="text-[11px] text-muted-foreground">Default structure has {DEFAULT_IMPORTANT_LINKS.sections.length} value-chain sections under the ministry.</p>
      </div>
    </div>
  );
}
