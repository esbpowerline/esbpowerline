'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PanelsEditor } from '@/components/admin/PanelsEditor';
import { AdminCard, AdminTagCapsule } from '@/components/admin/AdminUI';
import { resolvePolicies, type Policy } from '@/lib/data/policy/policies';
import { DEFAULT_IMPORTANT_LINKS, resolveImportantLinks } from '@/lib/data/important-links';
import { cn } from '@/lib/utils';
import { HOMEPAGE_DEFAULTS } from '@/lib/homepage-defaults';
import { DEFAULT_COVERAGE_SLOTS, normalizeCoverageSlots } from '@/lib/coverage-defaults';
import type { CoverageSlot } from '@/lib/coverage-types';
import {
  buildSettingsSnapshot,
  useSettingsChangeSync,
  type SettingsFormSnapshot,
} from '@/hooks/useSettingsChangeSync';
import { useAdminChangeQueue } from '@/components/admin/AdminChangeQueueProvider';
import { AdminTimeFormatSetting } from '@/components/admin/AdminTimeFormatSetting';
import {
  Settings, TrendingUp, BarChart3, Play, Globe,
  Database, ArrowUp, ArrowDown, Pin, LayoutGrid, Layers,
} from 'lucide-react';

type ArticlePickerItem = {
  slug: string;
  title: string;
  category: string;
  publishedAt: Date | null;
};

interface SettingsFormProps {
  settings: Record<string, unknown>;
  articlePickerList?: ArticlePickerItem[];
}

export function SettingsForm({ settings, articlePickerList = [] }: SettingsFormProps) {
  const { count, setDockOpen } = useAdminChangeQueue();
  const [activeTab, setActiveTab] = useState<'general' | 'markets' | 'snapshot' | 'interviews' | 'grid' | 'coverage' | 'panels'>('general');

  // 1. General, SEO & Hero
  const site = (settings.site as Record<string, string>) ?? {};
  const seo = (settings.seo as Record<string, string>) ?? {};
  const hero = (settings.hero as Record<string, string>) ?? {};

  const [siteName, setSiteName] = useState(site.name ?? 'ESB PowerLine');
  const [tagline, setTagline] = useState(site.tagline ?? "Bangladesh's premier energy news portal");
  const [metaTitle, setMetaTitle] = useState(seo.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(seo.metaDescription ?? '');
  const [heroTitle, setHeroTitle] = useState(hero.title ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(hero.subtitle ?? '');
  const [heroImage, setHeroImage] = useState(hero.imageUrl ?? '');

  const homepage = (settings.homepage as Record<string, unknown>) ?? {};
  const professionalsDefault = HOMEPAGE_DEFAULTS.professionalsCta;
  const professionals = (homepage.professionalsCta as typeof professionalsDefault) ?? professionalsDefault;

  const [marketPulse, setMarketPulse] = useState(
    (homepage.marketPulse as string) ?? HOMEPAGE_DEFAULTS.marketPulse
  );
  const [snapshotLabel, setSnapshotLabel] = useState(
    (homepage.snapshotLabel as string) ?? HOMEPAGE_DEFAULTS.snapshotLabel
  );
  const [ctaLabel, setCtaLabel] = useState(professionals.label ?? professionalsDefault.label);
  const [ctaTitle, setCtaTitle] = useState(professionals.title ?? professionalsDefault.title);
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(professionals.primaryLabel ?? professionalsDefault.primaryLabel);
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(professionals.primaryHref ?? professionalsDefault.primaryHref);
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(professionals.secondaryLabel ?? professionalsDefault.secondaryLabel);
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(professionals.secondaryHref ?? professionalsDefault.secondaryHref);

  // A cleared numeric field becomes null, not 0. `parseFloat('') || 0` read
  // "I do not have this figure" as "the figure is zero" on every input below.
  const numOrNull = (raw: string) => (raw.trim() === '' ? null : Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : null);

  // The seeds below are scaffolding, never content.
  //
  // Every one of these lists used to ship pre-filled with invented figures and
  // invented facts: spot LNG at $11.85/mmbtu, "Generation Capacity 28,420 MW",
  // a "400 kV Rooppur-Baghabari, Under Construction, 2400 MW" line, and four
  // interviews attributing remarks to named holders of real offices - the
  // Chairman of SREDA, the Managing Director of PGCB, a Member of BERC -
  // behind YouTube IDs that pointed at unrelated videos. An administrator who
  // opened Settings on an unconfigured site and pressed Save published all of
  // it, and `app/(public)/page.tsx` reads `settings.snapshot` and
  // `settings.ticker` as the fallback when the data pipeline has nothing, so
  // there was a live path from this form to the homepage.
  //
  // The rows remain because the editors have no add-row control and an empty
  // list would be uneditable. What they no longer carry is a value. A blank
  // field publishes nothing; a fabricated one publishes a claim.

  // 2. Live Markets Ticker - instrument names and units are structural; the
  // quote and the day's change are the administrator's to enter.
  const [ticker, setTicker] = useState<any[]>(
    (settings.ticker as any[]) ?? [
      { id: 'lng', name: 'LNG (Spot)', value: null, unit: '/mmbtu', change: null, prefix: '$' },
      { id: 'coal', name: 'Coal (API2)', value: null, unit: '/t', change: null, prefix: '$' },
      { id: 'fx', name: 'USD/BDT', value: null, unit: '', change: null, prefix: '৳' },
      { id: 'solar', name: 'Solar Module', value: null, unit: '/W', change: null, prefix: '$' },
      { id: 'tariff', name: 'Bulk Tariff', value: null, unit: 'Tk/kWh', change: null, prefix: '' },
      { id: 'gas', name: 'Petrobangla Gas', value: null, unit: 'MMcfd', change: null, prefix: '' },
    ]
  );

  // 3. System Snapshot Stats
  const [snapshot, setSnapshot] = useState<any[]>(
    (settings.snapshot as any[]) ?? [
      { label: 'Generation Capacity', value: null, unit: 'MW', icon: 'Zap', color: '#3b82f6' },
      { label: 'Current Demand', value: null, unit: 'MW', icon: 'Activity', color: '#ef4444' },
      { label: 'Renewable Share', value: null, unit: '%', isDecimal: true, icon: 'Leaf', color: '#10b981' },
      { label: 'System Loss', value: null, unit: '%', isDecimal: true, icon: 'Gauge', color: '#f59e0b' },
      { label: 'Gas Supply', value: null, unit: 'MMcfd', icon: 'Flame', color: '#8b5cf6' },
      { label: 'Peak Demand', value: null, unit: 'MW', icon: 'TrendingUp', color: '#3b82f6' },
      { label: 'India Grid Import', value: null, unit: 'MW', icon: 'Cable', color: '#06b6d4' },
      { label: 'Solar Installed', value: null, unit: 'MW', icon: 'Sun', color: '#f59e0b' },
    ]
  );

  // 4. Featured Interviews
  const [interviews, setInterviews] = useState<any[]>(
    (settings.interviews as any[]) ??
      // Blank slots, not example interviews. These carried four invented
      // conversations with named office-holders; nothing here now asserts that
      // anyone said anything.
      ['i1', 'i2', 'i3', 'i4'].map((id) => ({
        id,
        title: '',
        guest: '',
        role: '',
        duration: '',
        date: '',
        thumbnail: '',
        youtubeId: '',
        excerpt: '',
      }))
  );

  // 5. Grid Explorer Data
  const [gridMix, setGridMix] = useState<any[]>(
    // Fuel categories are structural. The share and the installed capacity
    // were invented and are now the administrator's to source and enter.
    (settings.gridMix as any[]) ?? [
      { name: 'Gas (CCGT + GT)', value: null, mw: null },
      { name: 'Coal', value: null, mw: null },
      { name: 'HFO / Diesel', value: null, mw: null },
      { name: 'Hydro', value: null, mw: null },
      { name: 'Solar + Wind', value: null, mw: null },
      { name: 'Imports', value: null, mw: null },
      { name: 'Nuclear (Rooppur-1)', value: null, mw: null },
    ]
  );

  const [gridLines, setGridLines] = useState<any[]>(
    // Every field here is a claim about a specific transmission asset - its
    // name, its commissioning status, its rating, its loading. All four rows
    // were invented, so all four are blank.
    (settings.gridLines as any[]) ??
      Array.from({ length: 4 }, () => ({ name: '', status: '', capacity: '', owner: '', load: null }))
  );

  const [coverageSlots, setCoverageSlots] = useState<CoverageSlot[]>(
    normalizeCoverageSlots(settings.coverage ?? DEFAULT_COVERAGE_SLOTS)
  );

  const [gridProjects, setGridProjects] = useState<any[]>(
    // As above: named projects with tender status and commissioning dates,
    // none of them sourced.
    (settings.gridProjects as any[]) ??
      Array.from({ length: 4 }, () => ({ name: '', status: '', mw: '', date: '' }))
  );

  // Homepage sidebar panel visibility toggles (both default ON)
  const panelsSetting = (settings.panels as { importantLinks?: boolean; policyFramework?: boolean }) ?? {};
  const [panelImportantLinks, setPanelImportantLinks] = useState(panelsSetting.importantLinks !== false);
  const [panelPolicyFramework, setPanelPolicyFramework] = useState(panelsSetting.policyFramework !== false);

  // Panel content editors
  const [policyItems, setPolicyItems] = useState<Policy[]>(() => resolvePolicies(settings));
  const [ilData, setIlData] = useState<unknown>(() => resolveImportantLinks(settings));
  const [ilText, setIlText] = useState<string>(() => JSON.stringify(resolveImportantLinks(settings), null, 2));
  const [ilError, setIlError] = useState<string | null>(null);

  const handleIlTextChange = (text: string) => {
    setIlText(text);
    try {
      const parsed = JSON.parse(text);
      setIlData(parsed);
      setIlError(null);
    } catch (err) {
      setIlError('Invalid JSON — ' + (err as Error).message.slice(0, 70));
    }
  };
  const handleIlReset = () => {
    setIlData(DEFAULT_IMPORTANT_LINKS);
    setIlText(JSON.stringify(DEFAULT_IMPORTANT_LINKS, null, 2));
    setIlError(null);
  };
  const setImportantLinksFromRevert = (v: unknown) => {
    setIlData(v);
    setIlText(JSON.stringify(v, null, 2));
    setIlError(null);
  };

  const currentSnapshot = useMemo(
    () =>
      buildSettingsSnapshot({
        siteName,
        tagline,
        metaTitle,
        metaDescription,
        heroTitle,
        heroSubtitle,
        heroImage,

        marketPulse,
        snapshotLabel,
        professionals: {
          label: ctaLabel,
          title: ctaTitle,
          primaryLabel: ctaPrimaryLabel,
          primaryHref: ctaPrimaryHref,
          secondaryLabel: ctaSecondaryLabel,
          secondaryHref: ctaSecondaryHref,
        },
        ticker,
        snapshot,
        interviews,
        gridMix,
        gridLines,
        gridProjects,
        coverageSlots,
        panelImportantLinks,
        panelPolicyFramework,
        policyFramework: policyItems,
        importantLinks: ilData,
      }),
    [
      siteName,
      tagline,
      metaTitle,
      metaDescription,
      heroTitle,
      heroSubtitle,
      heroImage,

      marketPulse,
      snapshotLabel,
      ctaLabel,
      ctaTitle,
      ctaPrimaryLabel,
      ctaPrimaryHref,
      ctaSecondaryLabel,
      ctaSecondaryHref,
      ticker,
      snapshot,
      interviews,
      gridMix,
      gridLines,
      gridProjects,
      coverageSlots,
      panelImportantLinks,
      panelPolicyFramework,
      policyItems,
      ilData,
    ],
  );

  const baselineRef = useRef<SettingsFormSnapshot | null>(null);
  const settingsRef = useRef(settings);

  if (baselineRef.current === null) {
    baselineRef.current = currentSnapshot;
  }

  useEffect(() => {
    if (count === 0 && settings !== settingsRef.current) {
      settingsRef.current = settings;
      baselineRef.current = currentSnapshot;
    }
  }, [count, currentSnapshot, settings]);

  useSettingsChangeSync(baselineRef.current, currentSnapshot, {
    setSiteName,
    setTagline,
    setMetaTitle,
    setMetaDescription,
    setHeroTitle,
    setHeroSubtitle,
    setHeroImage,
    setMarketPulse,
    setSnapshotLabel,
    setCtaLabel,
    setCtaTitle,
    setCtaPrimaryLabel,
    setCtaPrimaryHref,
    setCtaSecondaryLabel,
    setCtaSecondaryHref,
    setTicker,
    setSnapshot,
    setInterviews,
    setGridMix,
    setGridLines,
    setGridProjects,
    setCoverageSlots,
    setPanelImportantLinks,
    setPanelPolicyFramework,
    setPolicyFramework: (v) => setPolicyItems(v as Policy[]),
    setImportantLinks: setImportantLinksFromRevert,
  });

  // Ticker helpers
  const updateTickerField = (index: number, field: string, val: any) => {
    const next = [...ticker];
    next[index] = { ...next[index], [field]: val };
    setTicker(next);
  };

  // Snapshot helpers
  const updateSnapshotField = (index: number, field: string, val: any) => {
    const next = [...snapshot];
    next[index] = { ...next[index], [field]: val };
    setSnapshot(next);
  };

  // Interview helpers
  const updateInterviewField = (index: number, field: string, val: any) => {
    const next = [...interviews];
    next[index] = { ...next[index], [field]: val };
    setInterviews(next);
  };

  const moveInterview = (index: number, direction: 'up' | 'down' | 'first') => {
    const next = [...interviews];
    if (direction === 'first' && index > 0) {
      const [item] = next.splice(index, 1);
      next.unshift(item);
    } else if (direction === 'up' && index > 0) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    } else if (direction === 'down' && index < next.length - 1) {
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
    }
    setInterviews(next);
  };

  // Grid Mix helpers
  const updateGridMixField = (index: number, field: string, val: any) => {
    const next = [...gridMix];
    next[index] = { ...next[index], [field]: val };
    setGridMix(next);
  };

  // Grid Lines helpers
  const updateGridLinesField = (index: number, field: string, val: any) => {
    const next = [...gridLines];
    next[index] = { ...next[index], [field]: val };
    setGridLines(next);
  };

  // Grid Projects helpers
  const updateGridProjectsField = (index: number, field: string, val: any) => {
    const next = [...gridProjects];
    next[index] = { ...next[index], [field]: val };
    setGridProjects(next);
  };

  const updateCoverageArticle = (index: number, articleSlug: string) => {
    const next = [...coverageSlots];
    next[index] = { ...next[index], articleSlug };
    setCoverageSlots(next);
  };

  const tabs = [
    { id: 'general', label: 'General & SEO', icon: Settings },
    { id: 'markets', label: 'Live Markets', icon: TrendingUp },
    { id: 'snapshot', label: 'System Snapshot', icon: BarChart3 },
    { id: 'interviews', label: 'Interviews', icon: Play },
    { id: 'grid', label: 'Grid Explorer', icon: Database },
    { id: 'coverage', label: 'All Coverage', icon: LayoutGrid },
    { id: 'panels', label: 'Sidebar Panels', icon: Layers },
  ] as const;

  return (
    <div className="admin-form-stack">
      <div className="admin-filter-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={active}
              className={cn('admin-filter-tab', active && 'admin-filter-tab--active')}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.25 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {/* Tab 1: General & SEO */}
        {activeTab === 'general' && (
          <div className="admin-settings-grid">
            <AdminTimeFormatSetting />

            <AdminCard title="Site Configuration" icon={Globe} bodyClassName="admin-settings-body">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" />
              </div>
            </AdminCard>

            <AdminCard title="SEO Defaults" icon={Globe} bodyClassName="admin-settings-body">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1" rows={3} />
              </div>
            </AdminCard>

            <AdminCard title="Homepage Controls" icon={Globe} className="lg:col-span-2" bodyClassName="admin-settings-body">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Homepage carousel</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Featured stories are pulled from published articles (breaking, then featured, then latest).
                  </p>
                </div>
                <div>
                  <Label>Snapshot sources label</Label>
                  <Input value={snapshotLabel} onChange={(e) => setSnapshotLabel(e.target.value)} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label>Market pulse marquee</Label>
                  <Textarea value={marketPulse} onChange={(e) => setMarketPulse(e.target.value)} className="mt-1" rows={2} />
                </div>
              </div>
            </AdminCard>

            <AdminCard title="Professionals CTA Block" icon={Globe} className="lg:col-span-2" bodyClassName="admin-settings-body">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Section label</Label><Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="mt-1" /></div>
                <div className="md:col-span-2"><Label>Headline</Label><Input value={ctaTitle} onChange={(e) => setCtaTitle(e.target.value)} className="mt-1" /></div>
                <div><Label>Primary button</Label><Input value={ctaPrimaryLabel} onChange={(e) => setCtaPrimaryLabel(e.target.value)} className="mt-1" /></div>
                <div><Label>Primary link</Label><Input value={ctaPrimaryHref} onChange={(e) => setCtaPrimaryHref(e.target.value)} className="mt-1" /></div>
                <div><Label>Secondary button</Label><Input value={ctaSecondaryLabel} onChange={(e) => setCtaSecondaryLabel(e.target.value)} className="mt-1" /></div>
                <div><Label>Secondary link</Label><Input value={ctaSecondaryHref} onChange={(e) => setCtaSecondaryHref(e.target.value)} className="mt-1" /></div>
              </div>
            </AdminCard>

            <AdminCard title="Homepage Hero Section" icon={Globe} className="lg:col-span-2" bodyClassName="admin-settings-body">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="heroImage">Hero Image URL</Label>
                  <Input id="heroImage" value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Textarea id="heroSubtitle" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="mt-1" rows={2} />
                </div>
              </div>
            </AdminCard>

          </div>
        )}

        {/* Tab 2: Live Markets */}
        {activeTab === 'markets' && (
          <AdminCard title="Live Markets Ticker" icon={TrendingUp} bodyClassName="admin-settings-body">
        <p className="admin-card-lead text-[12px] text-muted-foreground">Manage real-time commodities and currencies displayed in the top marquee</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                <div className="col-span-3">Item Name</div>
                <div className="col-span-2">Value</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Change (%)</div>
                <div className="col-span-2">Prefix</div>
                <div className="col-span-1">ID</div>
              </div>
              {ticker.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-1 rounded-xl">
                  <div className="col-span-3">
                    <Input value={item.name ?? ''} onChange={(e) => updateTickerField(idx, 'name', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.001" placeholder="—" value={item.value ?? ''} onChange={(e) => updateTickerField(idx, 'value', numOrNull(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Input value={item.unit ?? ''} onChange={(e) => updateTickerField(idx, 'unit', e.target.value)} placeholder="none" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.1" placeholder="—" value={item.change ?? ''} onChange={(e) => updateTickerField(idx, 'change', numOrNull(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Input value={item.prefix ?? ''} onChange={(e) => updateTickerField(idx, 'prefix', e.target.value)} placeholder="none" />
                  </div>
                  <div className="col-span-1 font-mono text-xs text-muted-foreground select-none pl-1">
                    {item.id}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        )}

        {/* Tab 3: System Snapshot */}
        {activeTab === 'snapshot' && (
          <AdminCard title="Live System Snapshot" icon={BarChart3} bodyClassName="admin-settings-body">
        <p className="admin-card-lead text-[12px] text-muted-foreground">Configure national power grid generation capacity, demand numbers, loss parameters, etc.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                <div className="col-span-3">Label</div>
                <div className="col-span-2">Value</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Color (Hex)</div>
                <div className="col-span-2">Icon</div>
                <div className="col-span-1 text-center">Decimal?</div>
              </div>
              {snapshot.map((stat, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-1 rounded-xl">
                  <div className="col-span-3">
                    <Input value={stat.label ?? ''} onChange={(e) => updateSnapshotField(idx, 'label', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.1" placeholder="—" value={stat.value ?? ''} onChange={(e) => updateSnapshotField(idx, 'value', numOrNull(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Input value={stat.unit ?? ''} onChange={(e) => updateSnapshotField(idx, 'unit', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input value={stat.color ?? ''} onChange={(e) => updateSnapshotField(idx, 'color', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <select 
                      value={stat.icon} 
                      onChange={(e) => updateSnapshotField(idx, 'icon', e.target.value)}
                      className="admin-native-select"
                    >
                      <option value="Zap">Zap</option>
                      <option value="Activity">Activity</option>
                      <option value="Leaf">Leaf</option>
                      <option value="Gauge">Gauge</option>
                      <option value="Flame">Flame</option>
                      <option value="TrendingUp">TrendingUp</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <input 
                      type="checkbox" 
                      checked={!!stat.isDecimal} 
                      onChange={(e) => updateSnapshotField(idx, 'isDecimal', e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        )}

        {/* Tab 4: Latest Interviews */}
        {activeTab === 'interviews' && (
          <div className="admin-settings-stack">
            {interviews.map((iv, idx) => (
              <AdminCard
                key={iv.id}
                title={`Interview #${idx + 1}: ${iv.guest || 'Untitled'}`}
                icon={Play}
                bodyClassName="admin-settings-body"
                action={
                  <div className="flex items-center gap-1">
                    {idx === 0 && <AdminTagCapsule className="mr-1">Pinned first</AdminTagCapsule>}
                    <button type="button" className="admin-row-btn" title="Pin to first" aria-label="Pin to first" onClick={() => moveInterview(idx, 'first')}>
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="admin-row-btn" title="Move up" aria-label="Move up" onClick={() => moveInterview(idx, 'up')} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="admin-row-btn" title="Move down" aria-label="Move down" onClick={() => moveInterview(idx, 'down')} disabled={idx === interviews.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-xs text-muted-foreground ml-1">{iv.id}</span>
                  </div>
                }
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Interview Title</Label>
                    <Input value={iv.title ?? ''} onChange={(e) => updateInterviewField(idx, 'title', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Guest Name</Label>
                    <Input value={iv.guest ?? ''} onChange={(e) => updateInterviewField(idx, 'guest', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Guest Role / Designation</Label>
                    <Input value={iv.role ?? ''} onChange={(e) => updateInterviewField(idx, 'role', e.target.value)} className="mt-1" />
                    <p className="mt-1 text-xs text-muted-foreground">Shown in full in the player modal.</p>
                  </div>
                  <div>
                    <Label>Programme / Series (card chip)</Label>
                    <Input
                      value={iv.programme ?? ''}
                      onChange={(e) => updateInterviewField(idx, 'programme', e.target.value)}
                      className="mt-1"
                      placeholder="e.g. Express Talk"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      The card chip is narrow — a full job title truncates there. Falls back to the role if left blank.
                    </p>
                  </div>
                  <div>
                    <Label>Video Platform</Label>
                    <select
                      value={iv.provider ?? 'youtube'}
                      onChange={(e) => updateInterviewField(idx, 'provider', e.target.value)}
                      className="admin-native-select mt-1"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                  {(iv.provider ?? 'youtube') === 'facebook' ? (
                    <div>
                      <Label>Facebook Video URL</Label>
                      <Input
                        value={iv.videoUrl ?? ''}
                        onChange={(e) => updateInterviewField(idx, 'videoUrl', e.target.value)}
                        className="mt-1"
                        placeholder="https://www.facebook.com/…/videos/…"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Required — Facebook has no short embed id, so the card cannot play without this.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label>YouTube Video ID (embed)</Label>
                      <Input value={iv.youtubeId ?? ''} onChange={(e) => updateInterviewField(idx, 'youtubeId', e.target.value)} className="mt-1" />
                      <p className="mt-1 text-xs text-muted-foreground">Just the id, not the full URL.</p>
                    </div>
                  )}
                  <div>
                    <Label>Thumbnail Image URL</Label>
                    <Input value={iv.thumbnail ?? ''} onChange={(e) => updateInterviewField(idx, 'thumbnail', e.target.value)} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Duration (e.g. 24:15)</Label>
                      <Input value={iv.duration ?? ''} onChange={(e) => updateInterviewField(idx, 'duration', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Date / Display Label</Label>
                      <Input value={iv.date ?? ''} onChange={(e) => updateInterviewField(idx, 'date', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Excerpt Summary</Label>
                    <Textarea value={iv.excerpt ?? ''} onChange={(e) => updateInterviewField(idx, 'excerpt', e.target.value)} className="mt-1" rows={2} />
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        )}

        {/* Tab 6: All Coverage mosaic */}
        {activeTab === 'coverage' && (
          <AdminCard title="All Coverage Mosaic" icon={LayoutGrid} bodyClassName="admin-settings-body">
        <p className="admin-card-lead text-[12px] text-muted-foreground">Choose which nine published stories appear in the All Coverage grid on the homepage. Cards use the same uniform style.</p>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                <div className="col-span-1">#</div>
                <div className="col-span-11">Article</div>
              </div>
              {coverageSlots.map((slot, idx) => (
                <div key={slot.id} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-1 rounded-xl">
                  <div className="col-span-1 font-mono text-xs text-muted-foreground">{idx + 1}</div>
                  <div className="col-span-11">
                    <select
                      value={slot.articleSlug}
                      onChange={(e) => updateCoverageArticle(idx, e.target.value)}
                      className="admin-native-select"
                    >
                      <option value="">— Select article —</option>
                      {articlePickerList.map((article) => (
                        <option key={article.slug} value={article.slug}>
                          {article.title} ({article.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        )}

        {/* Tab 5: Grid Explorer Data */}
        {activeTab === 'grid' && (
          <div className="admin-settings-stack">
            {/* Grid Mix */}
            <AdminCard title="Generation Fuel Mix" icon={Database} bodyClassName="admin-settings-body">
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                  <div className="col-span-5">Fuel Source</div>
                  <div className="col-span-3">Installed Share (%)</div>
                  <div className="col-span-4">Installed Capacity (MW)</div>
                </div>
                {gridMix.map((mix, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-0.5 rounded-lg">
                    <div className="col-span-5">
                      <Input value={mix.name ?? ''} onChange={(e) => updateGridMixField(idx, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" placeholder="—" value={mix.value ?? ''} onChange={(e) => updateGridMixField(idx, 'value', numOrNull(e.target.value))} />
                    </div>
                    <div className="col-span-4">
                      <Input type="number" placeholder="—" value={mix.mw ?? ''} onChange={(e) => updateGridMixField(idx, 'mw', numOrNull(e.target.value))} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Grid Transmission Corridors */}
            <AdminCard title="Transmission Corridors" icon={Database} bodyClassName="admin-settings-body">
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                  <div className="col-span-4">Corridor / Line</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-2">Capacity</div>
                  <div className="col-span-2">Operator</div>
                  <div className="col-span-1">Load %</div>
                </div>
                {gridLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-0.5 rounded-lg">
                    <div className="col-span-4">
                      <Input value={line.name ?? ''} onChange={(e) => updateGridLinesField(idx, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Input value={line.status ?? ''} onChange={(e) => updateGridLinesField(idx, 'status', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input value={line.capacity ?? ''} onChange={(e) => updateGridLinesField(idx, 'capacity', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input value={line.owner ?? ''} onChange={(e) => updateGridLinesField(idx, 'owner', e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      <Input type="number" placeholder="—" value={line.load ?? ''} onChange={(e) => updateGridLinesField(idx, 'load', numOrNull(e.target.value))} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Grid Projects */}
            <AdminCard title="Major Infrastructure Projects" icon={Database} bodyClassName="admin-settings-body">
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-1">
                  <div className="col-span-5">Project Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Capacity (MW)</div>
                  <div className="col-span-3">Commissioning Year</div>
                </div>
                {gridProjects.map((proj, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center hover:bg-muted/10 p-0.5 rounded-lg">
                    <div className="col-span-5">
                      <Input value={proj.name ?? ''} onChange={(e) => updateGridProjectsField(idx, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input value={proj.status ?? ''} onChange={(e) => updateGridProjectsField(idx, 'status', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input value={proj.mw ?? ''} onChange={(e) => updateGridProjectsField(idx, 'mw', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <Input value={proj.date ?? ''} onChange={(e) => updateGridProjectsField(idx, 'date', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        )}

        {activeTab === 'panels' && (
          <PanelsEditor
            panelImportantLinks={panelImportantLinks}
            setPanelImportantLinks={setPanelImportantLinks}
            panelPolicyFramework={panelPolicyFramework}
            setPanelPolicyFramework={setPanelPolicyFramework}
            policyItems={policyItems}
            setPolicyItems={setPolicyItems}
            ilText={ilText}
            ilError={ilError}
            onIlTextChange={handleIlTextChange}
            onIlReset={handleIlReset}
          />
        )}
      </div>

      <div className="admin-settings-queue-hint">
        <div className="admin-settings-queue-hint__copy">
          <Layers className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Edits stack in the <strong className="text-foreground font-medium">Changes</strong>{' '}panel on the right.
            Review, remove mistakes, then save when ready — you&apos;ll be prompted before leaving with unsaved work.
          </p>
        </div>
        {count > 0 && (
          <button
            type="button"
            className="admin-settings-queue-hint__btn"
            onClick={() => setDockOpen(true)}
          >
            {count} pending
          </button>
        )}
      </div>
    </div>
  );
}