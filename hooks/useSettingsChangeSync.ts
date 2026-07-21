'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminChangeQueue } from '@/components/admin/AdminChangeQueueProvider';
import type { CoverageSlot } from '@/lib/coverage-types';

type ProfessionalsCta = {
  label: string;
  title: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export type SettingsFormSnapshot = {
  siteName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  marketPulse: string;
  snapshotLabel: string;
  ctaLabel: string;
  ctaTitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  ticker: unknown[];
  snapshot: unknown[];
  interviews: unknown[];
  gridMix: unknown[];
  gridLines: unknown[];
  gridProjects: unknown[];
  coverageSlots: CoverageSlot[];
  panelImportantLinks: boolean;
  panelPolicyFramework: boolean;
  policyFramework: unknown[];
  importantLinks: unknown;
};

type SettingsSetters = {
  setSiteName: (value: string) => void;
  setTagline: (value: string) => void;
  setMetaTitle: (value: string) => void;
  setMetaDescription: (value: string) => void;
  setHeroTitle: (value: string) => void;
  setHeroSubtitle: (value: string) => void;
  setHeroImage: (value: string) => void;
  setMarketPulse: (value: string) => void;
  setSnapshotLabel: (value: string) => void;
  setCtaLabel: (value: string) => void;
  setCtaTitle: (value: string) => void;
  setCtaPrimaryLabel: (value: string) => void;
  setCtaPrimaryHref: (value: string) => void;
  setCtaSecondaryLabel: (value: string) => void;
  setCtaSecondaryHref: (value: string) => void;
  setTicker: (value: unknown[]) => void;
  setSnapshot: (value: unknown[]) => void;
  setInterviews: (value: unknown[]) => void;
  setGridMix: (value: unknown[]) => void;
  setGridLines: (value: unknown[]) => void;
  setGridProjects: (value: unknown[]) => void;
  setCoverageSlots: (value: CoverageSlot[]) => void;
  setPanelImportantLinks: (value: boolean) => void;
  setPanelPolicyFramework: (value: boolean) => void;
  setPolicyFramework: (value: unknown[]) => void;
  setImportantLinks: (value: unknown) => void;
};

function formatScalarChange(label: string, before: string, after: string) {
  const from = before.trim() || '(empty)';
  const to = after.trim() || '(empty)';
  return `${from} → ${to}`;
}

function stableJson(value: unknown) {
  return JSON.stringify(value);
}

function buildHomepagePayload(current: SettingsFormSnapshot) {
  return {
    carouselMode: 'managed' as const,
    marketPulse: current.marketPulse,
    snapshotLabel: current.snapshotLabel,
    professionalsCta: {
      label: current.ctaLabel,
      title: current.ctaTitle,
      primaryLabel: current.ctaPrimaryLabel,
      primaryHref: current.ctaPrimaryHref,
      secondaryLabel: current.ctaSecondaryLabel,
      secondaryHref: current.ctaSecondaryHref,
    },
  };
}

export function useSettingsChangeSync(
  baseline: SettingsFormSnapshot,
  current: SettingsFormSnapshot,
  setters: SettingsSetters,
) {
  const pathname = usePathname();
  const { upsertChange, removeChange } = useAdminChangeQueue();
  const page = pathname.startsWith('/admin') ? pathname : '/admin/settings';

  const collectors = useMemo(
    () => ({
      site: () => ({ site: { name: current.siteName, tagline: current.tagline } }),
      seo: () => ({ seo: { metaTitle: current.metaTitle, metaDescription: current.metaDescription } }),
      hero: () => ({
        hero: {
          title: current.heroTitle,
          subtitle: current.heroSubtitle,
          imageUrl: current.heroImage,
        },
      }),
      homepage: () => ({ homepage: buildHomepagePayload(current) }),
      ticker: () => ({ ticker: current.ticker }),
      snapshot: () => ({ snapshot: current.snapshot }),
      interviews: () => ({ interviews: current.interviews }),
      gridMix: () => ({ gridMix: current.gridMix }),
      gridLines: () => ({ gridLines: current.gridLines }),
      gridProjects: () => ({ gridProjects: current.gridProjects }),
      coverage: () => ({ coverage: current.coverageSlots }),
      panels: () => ({
        panels: {
          importantLinks: current.panelImportantLinks,
          policyFramework: current.panelPolicyFramework,
        },
      }),
      policyFramework: () => ({ policyFramework: current.policyFramework }),
      importantLinks: () => ({ importantLinks: current.importantLinks }),
    }),
    [current],
  );

  useEffect(() => {
    const syncScalar = (
      id: string,
      section: string,
      label: string,
      before: string,
      after: string,
      revert: () => void,
      collect: () => Record<string, unknown>,
    ) => {
      if (before === after) {
        removeChange(id);
        return;
      }
      upsertChange({
        id,
        group: 'settings',
        section,
        label,
        detail: formatScalarChange(label, before, after),
        page,
        revert,
        collect,
      });
    };

    syncScalar(
      'settings:site.name',
      'General & SEO',
      'Site name',
      baseline.siteName,
      current.siteName,
      () => setters.setSiteName(baseline.siteName),
      collectors.site,
    );
    syncScalar(
      'settings:site.tagline',
      'General & SEO',
      'Tagline',
      baseline.tagline,
      current.tagline,
      () => setters.setTagline(baseline.tagline),
      collectors.site,
    );
    syncScalar(
      'settings:seo.metaTitle',
      'General & SEO',
      'Meta title',
      baseline.metaTitle,
      current.metaTitle,
      () => setters.setMetaTitle(baseline.metaTitle),
      collectors.seo,
    );
    syncScalar(
      'settings:seo.metaDescription',
      'General & SEO',
      'Meta description',
      baseline.metaDescription,
      current.metaDescription,
      () => setters.setMetaDescription(baseline.metaDescription),
      collectors.seo,
    );
    syncScalar(
      'settings:hero.title',
      'General & SEO',
      'Hero title',
      baseline.heroTitle,
      current.heroTitle,
      () => setters.setHeroTitle(baseline.heroTitle),
      collectors.hero,
    );
    syncScalar(
      'settings:hero.subtitle',
      'General & SEO',
      'Hero subtitle',
      baseline.heroSubtitle,
      current.heroSubtitle,
      () => setters.setHeroSubtitle(baseline.heroSubtitle),
      collectors.hero,
    );
    syncScalar(
      'settings:hero.imageUrl',
      'General & SEO',
      'Hero image URL',
      baseline.heroImage,
      current.heroImage,
      () => setters.setHeroImage(baseline.heroImage),
      collectors.hero,
    );
    syncScalar(
      'settings:homepage.snapshotLabel',
      'Homepage controls',
      'Snapshot sources label',
      baseline.snapshotLabel,
      current.snapshotLabel,
      () => setters.setSnapshotLabel(baseline.snapshotLabel),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.marketPulse',
      'Homepage controls',
      'Market pulse marquee',
      baseline.marketPulse,
      current.marketPulse,
      () => setters.setMarketPulse(baseline.marketPulse),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.label',
      'Professionals CTA',
      'Section label',
      baseline.ctaLabel,
      current.ctaLabel,
      () => setters.setCtaLabel(baseline.ctaLabel),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.title',
      'Professionals CTA',
      'Headline',
      baseline.ctaTitle,
      current.ctaTitle,
      () => setters.setCtaTitle(baseline.ctaTitle),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.primaryLabel',
      'Professionals CTA',
      'Primary button',
      baseline.ctaPrimaryLabel,
      current.ctaPrimaryLabel,
      () => setters.setCtaPrimaryLabel(baseline.ctaPrimaryLabel),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.primaryHref',
      'Professionals CTA',
      'Primary link',
      baseline.ctaPrimaryHref,
      current.ctaPrimaryHref,
      () => setters.setCtaPrimaryHref(baseline.ctaPrimaryHref),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.secondaryLabel',
      'Professionals CTA',
      'Secondary button',
      baseline.ctaSecondaryLabel,
      current.ctaSecondaryLabel,
      () => setters.setCtaSecondaryLabel(baseline.ctaSecondaryLabel),
      collectors.homepage,
    );
    syncScalar(
      'settings:homepage.cta.secondaryHref',
      'Professionals CTA',
      'Secondary link',
      baseline.ctaSecondaryHref,
      current.ctaSecondaryHref,
      () => setters.setCtaSecondaryHref(baseline.ctaSecondaryHref),
      collectors.homepage,
    );
  }, [
    baseline,
    current,
    collectors,
    page,
    removeChange,
    setters,
    upsertChange,
  ]);

  useEffect(() => {
    const syncCollection = (
      id: string,
      section: string,
      label: string,
      before: unknown,
      after: unknown,
      revert: () => void,
      collect: () => Record<string, unknown>,
    ) => {
      if (stableJson(before) === stableJson(after)) {
        removeChange(id);
        return;
      }
      upsertChange({
        id,
        group: 'settings',
        section,
        label,
        detail: 'Section updated',
        page,
        revert,
        collect,
      });
    };

    syncCollection(
      'settings:ticker',
      'Live Markets',
      'Ticker items',
      baseline.ticker,
      current.ticker,
      () => setters.setTicker(baseline.ticker),
      collectors.ticker,
    );
    syncCollection(
      'settings:snapshot',
      'System Snapshot',
      'Snapshot stats',
      baseline.snapshot,
      current.snapshot,
      () => setters.setSnapshot(baseline.snapshot),
      collectors.snapshot,
    );
    syncCollection(
      'settings:interviews',
      'Interviews',
      'Featured interviews',
      baseline.interviews,
      current.interviews,
      () => setters.setInterviews(baseline.interviews),
      collectors.interviews,
    );
    syncCollection(
      'settings:gridMix',
      'Grid Explorer',
      'Generation fuel mix',
      baseline.gridMix,
      current.gridMix,
      () => setters.setGridMix(baseline.gridMix),
      collectors.gridMix,
    );
    syncCollection(
      'settings:gridLines',
      'Grid Explorer',
      'Transmission corridors',
      baseline.gridLines,
      current.gridLines,
      () => setters.setGridLines(baseline.gridLines),
      collectors.gridLines,
    );
    syncCollection(
      'settings:gridProjects',
      'Grid Explorer',
      'Infrastructure projects',
      baseline.gridProjects,
      current.gridProjects,
      () => setters.setGridProjects(baseline.gridProjects),
      collectors.gridProjects,
    );
    syncCollection(
      'settings:coverage',
      'All Coverage',
      'Coverage mosaic',
      baseline.coverageSlots,
      current.coverageSlots,
      () => setters.setCoverageSlots(baseline.coverageSlots),
      collectors.coverage,
    );
    syncCollection(
      'settings:panels',
      'Homepage panels',
      'Sidebar panel visibility',
      { il: baseline.panelImportantLinks, pf: baseline.panelPolicyFramework },
      { il: current.panelImportantLinks, pf: current.panelPolicyFramework },
      () => {
        setters.setPanelImportantLinks(baseline.panelImportantLinks);
        setters.setPanelPolicyFramework(baseline.panelPolicyFramework);
      },
      collectors.panels,
    );
    syncCollection(
      'settings:policyFramework',
      'Homepage panels',
      'Policy & Regulatory Framework content',
      baseline.policyFramework,
      current.policyFramework,
      () => setters.setPolicyFramework(baseline.policyFramework),
      collectors.policyFramework,
    );
    syncCollection(
      'settings:importantLinks',
      'Homepage panels',
      'Important Official Links content',
      baseline.importantLinks,
      current.importantLinks,
      () => setters.setImportantLinks(baseline.importantLinks),
      collectors.importantLinks,
    );
  }, [
    baseline,
    current,
    collectors,
    page,
    removeChange,
    setters,
    upsertChange,
  ]);
}

export function buildSettingsSnapshot(input: {
  siteName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  marketPulse: string;
  snapshotLabel: string;
  professionals: ProfessionalsCta;
  ticker: unknown[];
  snapshot: unknown[];
  interviews: unknown[];
  gridMix: unknown[];
  gridLines: unknown[];
  gridProjects: unknown[];
  coverageSlots: CoverageSlot[];
  panelImportantLinks: boolean;
  panelPolicyFramework: boolean;
  policyFramework: unknown[];
  importantLinks: unknown;
}): SettingsFormSnapshot {
  return {
    siteName: input.siteName,
    tagline: input.tagline,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    heroTitle: input.heroTitle,
    heroSubtitle: input.heroSubtitle,
    heroImage: input.heroImage,
    marketPulse: input.marketPulse,
    snapshotLabel: input.snapshotLabel,
    ctaLabel: input.professionals.label,
    ctaTitle: input.professionals.title,
    ctaPrimaryLabel: input.professionals.primaryLabel,
    ctaPrimaryHref: input.professionals.primaryHref,
    ctaSecondaryLabel: input.professionals.secondaryLabel,
    ctaSecondaryHref: input.professionals.secondaryHref,
    ticker: input.ticker,
    snapshot: input.snapshot,
    interviews: input.interviews,
    gridMix: input.gridMix,
    gridLines: input.gridLines,
    gridProjects: input.gridProjects,
    coverageSlots: input.coverageSlots,
    panelImportantLinks: input.panelImportantLinks,
    panelPolicyFramework: input.panelPolicyFramework,
    policyFramework: input.policyFramework,
    importantLinks: input.importantLinks,
  };
}