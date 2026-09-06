import { getLatestMagazineIssue } from '@/lib/category-content';
import { MagazinePageClient, MagazineLibraryButton } from '@/components/news/MagazinePageClient';
import {
  CONTENTS,
  COVER_STATS,
  DEMO_ISSUE,
  IS_DEMO,
  MAGAZINE_FALLBACK_COVER,
  MASTHEAD,
} from '@/lib/magazine-demo-issue';
import { getMagazineAssets } from '@/lib/magazine-assets';

/**
 * Rendered per request, not cached for 300s as it was.
 *
 * The artwork now arrives as Supabase signed URLs with a one-hour TTL, so a
 * cached page would hand later visitors links that had already expired — the
 * exact broken-image failure this change exists to remove.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Monthly Magazine',
  description:
    'Read the latest issue of ESB PowerLine — in-depth analysis, data and features on Bangladesh energy & power.',
  alternates: {
    canonical: '/magazine',
  },
  // A demo issue must not be advertised to search as a real edition.
  ...(IS_DEMO ? { robots: { index: false, follow: true } } : {}),
};

export default async function MagazinePage() {
  const [dbIssue, assets] = await Promise.all([getLatestMagazineIssue(), getMagazineAssets()]);

  /**
   * While IS_DEMO holds, the page shows the demo issue rather than whatever the
   * database says. The three published MagazineIssue rows are seed placeholders
   * whose pdfUrl points at example.com, so honouring them would put dead
   * download links in front of readers. Flipping IS_DEMO to false in
   * lib/magazine-demo-issue.ts restores the database-driven path unchanged.
   */
  const magazine = IS_DEMO
    ? {
        id: '',
        title: DEMO_ISSUE.title,
        summary: DEMO_ISSUE.standfirst,
        coverUrl: assets.coverUrl,
        pdfUrl: assets.pdfUrl,
        issueDate: new Date(DEMO_ISSUE.producedOn),
      }
    : (dbIssue ?? {
        id: '',
        title: 'ESB PowerLine Monthly',
        summary: 'In-depth analysis on Bangladesh power sector policy, projects and data.',
        coverUrl: MAGAZINE_FALLBACK_COVER,
        pdfUrl: null,
        issueDate: new Date(),
      });

  const issueLabel = IS_DEMO
    ? `${DEMO_ISSUE.volume} • ${DEMO_ISSUE.issue}`
    : `${new Date(magazine.issueDate)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        .toUpperCase()} ISSUE`;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Full-Page Ambient Glow with subtle cover page energy colors */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[5%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-amber-500/[0.03] blur-[150px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[25%] right-[10%] w-[45rem] h-[45rem] rounded-full bg-teal-500/[0.03] blur-[160px] animate-pulse duration-[12000ms]" />
        <div className="absolute bottom-[20%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-blue-500/[0.025] blur-[150px] animate-pulse duration-[10000ms]" />
        <div className="absolute bottom-[5%] right-[15%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/[0.03] blur-[140px] animate-pulse duration-[9000ms]" />
      </div>

      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none"
        aria-hidden="true"
      />

      <MagazinePageClient
        coverUrl={magazine.coverUrl}
        title={magazine.title}
        summary={magazine.summary}
        issueLabel={issueLabel}
        pdfUrl={magazine.pdfUrl}
        issueId={magazine.id}
        demo={IS_DEMO}
        pageImages={IS_DEMO ? assets.pageImages : []}
        thumbImages={IS_DEMO ? assets.thumbImages : []}
        assetsUnavailable={IS_DEMO ? assets.unavailable : false}
        masthead={IS_DEMO ? MASTHEAD : []}
        volumeLabel={IS_DEMO ? `${DEMO_ISSUE.volume} • ${DEMO_ISSUE.issue}` : undefined}
        pageCount={IS_DEMO ? DEMO_ISSUE.pageCount : undefined}
        cadence={IS_DEMO ? DEMO_ISSUE.cadence : undefined}
        priceLabel={IS_DEMO ? DEMO_ISSUE.priceLabel : undefined}
        pdfBytes={IS_DEMO ? DEMO_ISSUE.pdfBytes : undefined}
        publisher={IS_DEMO ? DEMO_ISSUE.publisher : undefined}
        contents={IS_DEMO ? CONTENTS : []}
        coverStats={IS_DEMO ? COVER_STATS : []}
      />

      <div className="container container--shell pb-16 relative z-10">
        <div className="mt-12 rounded-2xl border border-border/70 p-6 md:p-8 bg-muted/30 text-center mx-4 md:mx-0">
          <div className="max-w-md mx-auto">
            <div className="font-semibold text-lg mb-2">Access the full archive + exclusive briefings</div>
            <p className="text-sm text-muted-foreground mb-5">
              Monthly magazine + data packages for energy professionals.
            </p>
            <MagazineLibraryButton />
          </div>
        </div>
      </div>
    </div>
  );
}
