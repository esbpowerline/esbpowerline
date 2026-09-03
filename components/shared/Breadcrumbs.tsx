import Link from 'next/link';
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo';
import { safeJsonLd } from '@/lib/json-ld';

/**
 * The trail a page sits on, as a visible nav and as BreadcrumbList JSON-LD
 * from one list — so the markup can never say something the reader cannot
 * see. Search Console counted 0 valid breadcrumb items site-wide before this
 * (SEO_FIX_LOG stage 5); the visible element is what stage 6 asks for.
 *
 * The first crumb is always Home; the last is the current page and is not a
 * link. Pass `hideVisible` where a page already draws its own trail.
 */
export function Breadcrumbs({ crumbs, hideVisible = false, className }: { crumbs: Crumb[]; hideVisible?: boolean; className?: string }) {
  const trail: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(trail)) }} />
      {!hideVisible && (
        <nav aria-label="Breadcrumb" className={className ?? 'breadcrumbs mb-4 text-xs text-muted-foreground'}>
          <ol className="flex flex-wrap items-center gap-1.5">
            {trail.map((c, i) => {
              const last = i === trail.length - 1;
              return (
                <li key={`${c.path ?? c.name}-${i}`} className="inline-flex items-center gap-1.5 min-w-0">
                  {last || !c.path ? (
                    <span aria-current={last ? 'page' : undefined} className="truncate max-w-[16rem] text-foreground/80">{c.name}</span>
                  ) : (
                    <Link href={c.path} className="hover:text-primary transition-colors">{c.name}</Link>
                  )}
                  {!last && <span aria-hidden className="text-muted-foreground/50">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </>
  );
}
