"use client";

import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { POLICY_GROUPS, POLICIES, type Policy, type PolicyTint, type PolicyStatus } from '@/lib/data/policy/policies';

/** Icon-glyph tints (coloured glyph over a neutral chip). */
const TINT: Record<PolicyTint, string> = {
  sky: 'text-sky-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
};

/** Soft-background capsule used for section headers. */
const TINT_BADGE: Record<PolicyTint, string> = {
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
};

/** Status pill styling by lifecycle state. */
const STATUS_STYLE: Record<PolicyStatus, string> = {
  'In force': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Repealed: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  Superseded: 'bg-stone-500/12 text-stone-600 dark:text-stone-400',
};

/** Neutral icon chip whose glyph carries a subtle category tint. */
function IconChip({ Icon, tint }: { Icon: LucideIcon; tint: PolicyTint }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
      <Icon className={`w-4 h-4 stroke-[1.75] ${TINT[tint]} group-hover:text-primary transition-colors`} />
    </div>
  );
}

/** Centered tinted capsule flanked by fading rules — matches Important Official Links. */
function SectionHeader({ title, tint }: { title: string; tint: PolicyTint }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent to-border" />
      <span className={`section-kicker rounded-full px-2.5 py-1 ${TINT_BADGE[tint]}`}>{title}</span>
      <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

export function PolicyFramework({
  policies = POLICIES,
  layout = 'rail',
}: {
  policies?: Policy[];
  /** 'rail' = compact sidebar widget; 'full' = full-width band with the four groups side by side. */
  layout?: 'rail' | 'full';
}) {
  const full = layout === 'full';
  return (
    <section
      className={`${full ? 'mt-10' : 'mt-8'} rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden`}
      aria-labelledby="policy-framework-title"
    >
      <div className={full ? 'p-5 md:p-6' : 'p-4 md:p-5'}>
        <header className="mb-4">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-r from-transparent to-border" />
            <span id="policy-framework-title" className="whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
              Policy &amp; Regulatory Framework
            </span>
            <span aria-hidden className="h-px flex-1 rounded-full bg-gradient-to-l from-transparent to-border" />
          </div>
        </header>

        <div className={full ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4' : 'flex flex-col gap-5'}>
          {POLICY_GROUPS.map((group) => {
            const Icon = group.icon;
            const items = policies.filter((p) => p.group === group.key && p.featured);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <SectionHeader title={group.title} tint={group.tint} />
                <div className="flex flex-col">
                  {items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/energy-policy/${item.slug}`}
                      className="group -mx-2 w-[calc(100%+1rem)] flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      <IconChip Icon={Icon} tint={group.tint} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12.5px] leading-snug text-foreground group-hover:text-primary transition-colors tracking-tight">{item.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wide ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                          <span className="text-[10.5px] text-muted-foreground/80 leading-snug">{item.authority} · {item.year}</span>
                        </div>
                      </div>
                      <ChevronRight className="mt-[3px] w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/energy-policy"
          className="group mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 py-2.5 text-[12px] font-semibold text-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
        >
          View the full policy library
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
