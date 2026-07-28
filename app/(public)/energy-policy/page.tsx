import Link from 'next/link';
import { ChevronRight, Scale } from 'lucide-react';
import {
  POLICY_GROUPS, resolvePolicies,
  type PolicyTint, type PolicyStatus,
} from '@/lib/data/policy/policies';
import { getPublicSettingsMap } from '@/lib/homepage-content';

export const revalidate = 3600;

export function generateMetadata() {
  return {
    title: 'Energy Policy & Regulatory Framework | ESB PowerLine',
    description:
      "The acts, policies, master plans and regulations that officially govern Bangladesh's power & energy sector — curated summaries with links to the official source documents.",
    alternates: {
      canonical: '/energy-policy',
    },
  };
}

const TINT_TEXT: Record<PolicyTint, string> = {
  sky: 'text-sky-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
};

const TINT_BADGE: Record<PolicyTint, string> = {
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
};

const STATUS_STYLE: Record<PolicyStatus, string> = {
  'In force': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Repealed: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  Superseded: 'bg-stone-500/15 text-stone-600 dark:text-stone-400',
};

export default async function EnergyPolicyLibraryPage() {
  const policies = resolvePolicies(await getPublicSettingsMap());
  const total = policies.length;

  return (
    <div className="container container--shell py-8 md:py-10">
      <div className="w-full">
        {/* Page header */}
        <header className="border-b border-border/50 pb-6">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">Reference Library</span>
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Energy Policy &amp; Regulatory Framework
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            The {total}&nbsp;key acts, policies, master plans and regulations that officially govern Bangladesh&apos;s power
            &amp; energy sector. Each entry is a plain-language summary — open it to read the brief and link straight to the
            official source document.
          </p>
        </header>

        {/* Groups */}
        <div className="mt-8 flex flex-col gap-10">
          {POLICY_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const items = policies.filter((p) => p.group === group.key);
            if (items.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TINT_BADGE[group.tint]}`}>
                    <GroupIcon className={`h-4 w-4 ${TINT_TEXT[group.tint]}`} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{group.title}</h2>
                    <p className="text-[12.5px] text-muted-foreground">{group.blurb}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/energy-policy/${item.slug}`}
                      className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[15px] leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                        <span className="text-[11.5px] text-muted-foreground/80">{item.authority} · {item.year}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">{item.brief.overview}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-10 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Summaries are curated by ESB PowerLine for clarity and are not a substitute for the official texts. Each entry
          links to its authoritative source document for verification.
        </p>
      </div>
    </div>
  );
}
