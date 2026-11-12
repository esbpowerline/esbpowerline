"use client";

import { useState } from 'react';
import {
  Zap, Network, Waypoints, Factory, ShieldCheck, Flame, Landmark, Fuel,
  Droplet, Mountain, ExternalLink, ChevronRight, AlertTriangle, Link as LinkIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  DEFAULT_IMPORTANT_LINKS,
  type ImportantLinksData,
  type ILOrgNode,
  type ILTint,
  type ILIconName,
} from '@/lib/data/important-links';

/** Icon-name → lucide component. Names must match ILIconName in the data module. */
const ICONS: Record<ILIconName, LucideIcon> = {
  Zap, Network, Waypoints, Factory, ShieldCheck, Flame, Fuel, Droplet, Mountain, Link: LinkIcon,
};

/**
 * Subtle per-category icon tints — a coloured glyph over a neutral chip, so it
 * reads as quiet context rather than a colourful UI. Full literal class strings
 * so Tailwind's JIT keeps them.
 */
const TINT: Record<ILTint, string> = {
  amber: 'text-amber-600 dark:text-amber-400',
  sky: 'text-sky-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  orange: 'text-orange-600 dark:text-orange-400',
  teal: 'text-teal-600 dark:text-teal-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  violet: 'text-violet-600 dark:text-violet-400',
  stone: 'text-stone-500 dark:text-stone-400',
};

/** Matching soft-background pill used for the "N companies" count badge. */
const TINT_BADGE: Record<ILTint, string> = {
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  stone: 'bg-stone-500/10 text-stone-600 dark:text-stone-400',
};

/** Solid category node shown beside each subsidiary. */
const TINT_DOT: Record<ILTint, string> = {
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  stone: 'bg-stone-400',
};

function iconFor(name?: ILIconName): LucideIcon {
  return name ? (ICONS[name] ?? LinkIcon) : LinkIcon;
}

/** Neutral icon chip whose glyph carries a subtle category tint. */
function IconChip({ Icon, tint }: { Icon: LucideIcon; tint?: ILTint }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
      <Icon className={`w-4 h-4 stroke-[1.75] ${tint ? TINT[tint] : 'text-muted-foreground'} group-hover:text-primary transition-colors`} />
    </div>
  );
}

/** Tier label that heads each hierarchy group: centered tinted capsule flanked by fading rules. */
function SectionHeader({ title, tint }: { title: string; tint: ILTint }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent to-border" />
      <span className={`section-kicker rounded-full px-2.5 py-1 ${TINT_BADGE[tint]}`}>{title}</span>
      <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

export function ImportantLinks({ data = DEFAULT_IMPORTANT_LINKS }: { data?: ImportantLinksData }) {
  const { ministry, divisions, regulator, sections } = data;
  // Track which expandable rows are open, keyed by short name.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderOrg = (org: ILOrgNode) => {
    const Icon = iconFor(org.icon);
    const count = org.children?.length ?? 0;
    const hasChildren = count > 0;
    const isOpen = !!open[org.short];

    return (
      <div key={org.short}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(org.short)}
            aria-expanded={isOpen}
            className={`group -mx-2 w-[calc(100%+1rem)] flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 ${isOpen ? 'bg-muted/35' : ''}`}
          >
            <IconChip Icon={Icon} tint={org.tint} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors tracking-tight">{org.short}</span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9.5px] font-semibold tabular-nums ${org.tint ? TINT_BADGE[org.tint] : 'bg-muted text-muted-foreground'}`}>
                  {count}
                  <span className="font-normal">companies</span>
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{org.name}</div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90 text-primary' : 'text-muted-foreground/50 group-hover:text-primary'}`} />
          </button>
        ) : (
          <a
            href={org.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group -mx-2 w-[calc(100%+1rem)] flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
          >
            <IconChip Icon={Icon} tint={org.tint} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors tracking-tight">{org.short}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{org.name}</div>
            </div>
          </a>
        )}

        {/* Subsidiaries — same chip geometry, dots aligned under the parent icon column */}
        {hasChildren && isOpen && (
          <ul className="mt-0.5 mb-1 flex flex-col">
            {org.children!.map((child, i) => (
              <li
                key={child.short}
                className="important-links-item"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <a
                  href={child.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/child -mx-2 w-[calc(100%+1rem)] flex items-start gap-2.5 rounded-lg px-2 py-[7px] transition-colors hover:bg-muted/50"
                >
                  <span className="flex w-8 shrink-0 justify-center pt-[6px]">
                    <span className={`h-[7px] w-[7px] rounded-full transition-transform duration-200 group-hover/child:scale-[1.3] ${org.tint ? TINT_DOT[org.tint] : 'bg-muted-foreground/40'}`} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-[12.5px] text-foreground tracking-tight group-hover/child:text-primary transition-colors">{child.short}</span>
                      {child.note && (
                        <AlertTriangle aria-label={child.note} className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      <ExternalLink className="ml-auto w-3 h-3 text-muted-foreground/30 opacity-0 group-hover/child:opacity-100 group-hover/child:text-primary transition-opacity shrink-0" />
                    </span>
                    <span className="block text-[10.5px] text-muted-foreground/75 leading-snug mt-[1px]">{child.name}</span>
                    {child.note && (
                      <span className="block pt-0.5 text-[9.5px] leading-snug text-amber-600/80 dark:text-amber-500/80">{child.note}</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <section className="hp-card hp-links mt-8 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden" aria-labelledby="important-links-title">
      <div className="p-4 md:p-5 hp-links__desk">
        <header className="mb-4">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent to-border" />
            <span id="important-links-title" className="whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1 text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary">Important Official Links</span>
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-l from-transparent to-border" />
          </div>
        </header>

        {/* Tier 1 — MPEMR: the ministry, prominent and tagged as the parent */}
        <a
          href={ministry.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-3 py-3 shadow-sm transition-colors hover:bg-rose-500/[0.12]"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
            <Landmark className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors tracking-tight">{ministry.short}</span>
              <span className="rounded-full bg-rose-500/15 px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Ministry</span>
              <ExternalLink className="ml-auto w-3.5 h-3.5 text-rose-500/50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ministry.name}</div>
          </div>
        </a>

        {/* Tier 2 — the two divisions branch off the ministry like wings (org-chart connector) */}
        <div className="flex flex-col items-center">
          <span aria-hidden className="h-3 w-px bg-rose-500/35" />
          <div className="relative w-full">
            <span aria-hidden className="absolute left-1/4 right-1/4 top-0 h-px bg-rose-500/35" />
            <span aria-hidden className="absolute left-1/4 top-0 h-3 w-px -translate-x-1/2 bg-rose-500/35" />
            <span aria-hidden className="absolute right-1/4 top-0 h-3 w-px translate-x-1/2 bg-rose-500/35" />
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              {divisions.map((d) => {
                const DIcon = iconFor(d.icon);
                return (
                  <a
                    key={d.short}
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-2 text-left shadow-sm transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.05]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/50">
                      <DIcon className={`w-3 h-3 ${TINT[d.tint]}`} />
                    </span>
                    <span className="min-w-0 text-[10px] font-semibold leading-tight text-foreground/80 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {d.name} <span className="whitespace-nowrap font-bold text-muted-foreground">({d.short})</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tier 3 — Regulator */}
        <div className="mt-5">
          <SectionHeader title="Regulator" tint={regulator.tint ?? 'violet'} />
          {renderOrg(regulator)}
        </div>

        {/* Tier 4 — the energy value chain: Fuel → Generation → Transmission → Distribution */}
        <div className="hp-links__chain mt-5 flex flex-col gap-5">
          {sections.map((section) => (
            <div key={section.title}>
              <SectionHeader title={section.title} tint={section.tint} />
              <div className="flex flex-col">
                {section.orgs.map(renderOrg)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <PhoneLinks data={data} />
    </section>
  );
}

/* ── Phone module (below 768px only; app/home-phone.css shows it and hides the
   desktop org chart above). Same data, every link kept: the ministry and its
   divisions, the regulator, then the value chain behind a segmented switch —
   one stage at a time, each org a 56px row (tinted icon tile, short name,
   one-line role, chevron), subsidiaries opening in place. ─────────────────── */
function PhoneTile({ Icon, tint }: { Icon: LucideIcon; tint?: ILTint }) {
  return (
    <span className={`hp-il__tile ${tint ? TINT_BADGE[tint] : 'bg-muted text-muted-foreground'}`} aria-hidden>
      <Icon width={18} height={18} strokeWidth={1.9} />
    </span>
  );
}

function PhoneLinks({ data }: { data: ImportantLinksData }) {
  const { ministry, divisions, regulator, sections } = data;
  const [stage, setStage] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const row = (org: ILOrgNode) => {
    const Icon = iconFor(org.icon);
    const kids = org.children ?? [];
    if (!kids.length) {
      return (
        <li key={org.short}>
          <a className="hp-il__row" href={org.href} target="_blank" rel="noopener noreferrer">
            <PhoneTile Icon={Icon} tint={org.tint} />
            <span className="hp-il__copy">
              <span className="hp-il__name">{org.short}</span>
              <span className="hp-il__role">{org.name}</span>
            </span>
            <ExternalLink className="hp-il__chev" aria-hidden width={16} height={16} />
          </a>
        </li>
      );
    }
    const isOpen = !!open[org.short];
    return (
      <li key={org.short}>
        <button type="button" className="hp-il__row" aria-expanded={isOpen} onClick={() => toggle(org.short)}>
          <PhoneTile Icon={Icon} tint={org.tint} />
          <span className="hp-il__copy">
            <span className="hp-il__name">
              {org.short}
              <span className={`hp-il__count ${org.tint ? TINT_BADGE[org.tint] : ''}`}>{kids.length} companies</span>
            </span>
            <span className="hp-il__role">{org.name}</span>
          </span>
          <ChevronRight className={`hp-il__chev${isOpen ? ' is-open' : ''}`} aria-hidden width={18} height={18} />
        </button>
        {isOpen && (
          <ul className="hp-il__kids">
            <li>
              <a className="hp-il__kid" href={org.href} target="_blank" rel="noopener noreferrer">
                <i className={org.tint ? TINT_DOT[org.tint] : 'bg-muted-foreground'} aria-hidden />
                <span className="hp-il__kid-copy"><span className="hp-il__kid-name">{org.short} website</span></span>
                <ExternalLink className="hp-il__chev" aria-hidden width={14} height={14} />
              </a>
            </li>
            {kids.map((c) => (
              <li key={c.short}>
                <a className="hp-il__kid" href={c.href} target="_blank" rel="noopener noreferrer">
                  <i className={org.tint ? TINT_DOT[org.tint] : 'bg-muted-foreground'} aria-hidden />
                  <span className="hp-il__kid-copy">
                    <span className="hp-il__kid-name">
                      {c.short}
                      {c.note && <AlertTriangle aria-label={c.note} width={12} height={12} className="text-amber-500" />}
                    </span>
                    <span className="hp-il__role">{c.name}</span>
                    {c.note && <span className="hp-il__note">{c.note}</span>}
                  </span>
                  <ExternalLink className="hp-il__chev" aria-hidden width={14} height={14} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const current = sections[stage];
  return (
    <div className="hp-il">
      <h2 className="hp-il__title">Important official links</h2>
      <p className="hp-il__sub">Ministry, regulator and every agency along the energy value chain.</p>

      <p className="hp-il__group">Ministry</p>
      <ul className="hp-il__list">
        <li>
          <a className="hp-il__row" href={ministry.href} target="_blank" rel="noopener noreferrer">
            <span className="hp-il__tile hp-il__tile--ministry" aria-hidden><Landmark width={18} height={18} strokeWidth={1.9} /></span>
            <span className="hp-il__copy">
              <span className="hp-il__name">{ministry.short}</span>
              <span className="hp-il__role">{ministry.name}</span>
            </span>
            <ExternalLink className="hp-il__chev" aria-hidden width={16} height={16} />
          </a>
        </li>
        {divisions.map((d) => (
          <li key={d.short}>
            <a className="hp-il__row hp-il__row--sub" href={d.href} target="_blank" rel="noopener noreferrer">
              <PhoneTile Icon={iconFor(d.icon)} tint={d.tint} />
              <span className="hp-il__copy">
                <span className="hp-il__name">{d.short}</span>
                <span className="hp-il__role">{d.name}</span>
              </span>
              <ExternalLink className="hp-il__chev" aria-hidden width={16} height={16} />
            </a>
          </li>
        ))}
      </ul>

      <p className="hp-il__group">Regulator</p>
      <ul className="hp-il__list">{row(regulator)}</ul>

      <p className="hp-il__group">Value chain</p>
      <div className="hp-il__seg" role="tablist" aria-label="Value chain stage">
        {sections.map((sec, i) => (
          <button
            key={sec.title}
            type="button"
            role="tab"
            aria-selected={i === stage}
            className={i === stage ? 'is-on' : undefined}
            onClick={() => setStage(i)}
          >
            {sec.title.replace(' & Resources', '')}
            <span>{sec.orgs.length}</span>
          </button>
        ))}
      </div>
      {current && <ul className="hp-il__list" role="tabpanel" aria-label={current.title}>{current.orgs.map(row)}</ul>}
    </div>
  );
}
