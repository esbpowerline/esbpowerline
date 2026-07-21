import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle, Dot } from 'lucide-react';
import {
  POLICIES, POLICY_GROUPS, getPolicyBySlug, resolvePolicies,
  type PolicyTint, type PolicyStatus,
} from '@/lib/data/policy/policies';
import { getPublicSettingsMap } from '@/lib/homepage-content';

export const revalidate = 3600;

const TINT_BADGE: Record<PolicyTint, string> = {
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
};

const TINT_TEXT: Record<PolicyTint, string> = {
  sky: 'text-sky-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
};

const STATUS_STYLE: Record<PolicyStatus, string> = {
  'In force': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Repealed: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  Superseded: 'bg-stone-500/15 text-stone-600 dark:text-stone-400',
};

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug, resolvePolicies(await getPublicSettingsMap()));
  if (!policy) return { title: 'Policy not found | ESB PowerLine' };
  return {
    title: `${policy.short} — Energy Policy & Regulatory Framework | ESB PowerLine`,
    description: policy.brief.overview,
  };
}

export default async function PolicyDetailPage({ params }: Props) {
  const { slug } = await params;
  const policies = resolvePolicies(await getPublicSettingsMap());
  const policy = getPolicyBySlug(slug, policies);
  if (!policy) notFound();

  const group = POLICY_GROUPS.find((g) => g.key === policy.group)!;
  const GroupIcon = group.icon;
  const related = policies.filter((p) => p.group === policy.group && p.slug !== policy.slug).slice(0, 4);

  return (
    <div className="container container--shell py-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/energy-policy" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Policy &amp; Regulatory Framework
        </Link>

        {/* Header */}
        <header className="mt-4 border-b border-border/50 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TINT_BADGE[group.tint]}`}>
              <GroupIcon className={`w-3.5 h-3.5 ${TINT_TEXT[group.tint]}`} />
              {group.title}
            </span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[policy.status]}`}>{policy.status}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">{policy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {policy.authority} · {policy.year}
          </p>
        </header>

        {/* Caveat callout */}
        {policy.note && (
          <div className="mt-6 flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">{policy.note}</p>
          </div>
        )}

        {/* Overview */}
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Overview</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{policy.brief.overview}</p>
        </section>

        {/* Key provisions */}
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Key points</h2>
          <ul className="mt-2 space-y-2">
            {policy.brief.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-foreground/90">
                <span className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${TINT_TEXT[group.tint]} bg-current`} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Timeline */}
        {policy.brief.timeline && policy.brief.timeline.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Timeline</h2>
            <ul className="mt-2 space-y-2.5 border-l border-border/60 pl-4">
              {policy.brief.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[21px] top-1 h-2 w-2 rounded-full ${TINT_TEXT[group.tint]} bg-current`} />
                  <span className="text-[13px] font-semibold text-foreground">{t.date}</span>
                  <span className="text-[14px] text-muted-foreground"> — {t.event}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Official source */}
        <section className="mt-8 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Official source</h2>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            This is a plain-language summary curated by ESB PowerLine. For the authoritative text, read the official document:
          </p>
          <a
            href={policy.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Read the official document
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <p className="mt-2.5 flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
            <Dot className="h-3 w-3" />
            {policy.source.label}
            {!policy.source.verified && (
              <span className="ml-1 rounded bg-amber-500/10 px-1.5 py-[1px] text-[9.5px] font-sans font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                link to be confirmed
              </span>
            )}
          </p>
        </section>

        {/* Related in group */}
        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">More in {group.title}</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/energy-policy/${r.slug}`}
                  className="group flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">{r.short}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.year}</span>
                  </span>
                  <span className={`rounded-full px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wide ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
