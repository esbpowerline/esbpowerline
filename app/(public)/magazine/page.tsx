import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getLatestMagazineIssue } from '@/lib/category-content';
import { MagazinePageClient, MagazineLibraryButton } from '@/components/news/MagazinePageClient';
import {
  CONTENTS,
  COVER_STATS,
  DEMO_ISSUE,
  IS_DEMO,
  MASTHEAD,
  PAGE_IMAGES,
  THUMB_IMAGES,
} from '@/lib/magazine-demo-issue';

export const revalidate = 300;

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
  const dbIssue = await getLatestMagazineIssue();

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
        coverUrl: DEMO_ISSUE.coverUrl,
        pdfUrl: DEMO_ISSUE.pdfUrl as string | null,
        issueDate: new Date(DEMO_ISSUE.producedOn),
      }
    : (dbIssue ?? {
        id: '',
        title: 'ESB PowerLine Monthly',
        summary: 'In-depth analysis on Bangladesh power sector policy, projects and data.',
        coverUrl: '/images/demo_magazine_cover.jpg',
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
        pageImages={IS_DEMO ? PAGE_IMAGES : []}
        thumbImages={IS_DEMO ? THUMB_IMAGES : []}
        masthead={IS_DEMO ? MASTHEAD : []}
        volumeLabel={IS_DEMO ? `${DEMO_ISSUE.volume} • ${DEMO_ISSUE.issue}` : undefined}
        pageCount={IS_DEMO ? DEMO_ISSUE.pageCount : undefined}
        cadence={IS_DEMO ? DEMO_ISSUE.cadence : undefined}
        priceLabel={IS_DEMO ? DEMO_ISSUE.priceLabel : undefined}
        pdfBytes={IS_DEMO ? DEMO_ISSUE.pdfBytes : undefined}
      />

      <div className="container container--shell pb-12 relative z-10">
        {/* The three figures printed on the issue's cover. */}
        {IS_DEMO ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-12">
            {COVER_STATS.map((s) => (
              <div key={s.label} className="card p-5 sm:p-6">
                <div className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 lg:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-5">
            <h2 className="font-semibold text-xl">In this issue</h2>
            <Link
              href="/articles"
              className="text-xs text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              All power sector features <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* The magazine's own printed table of contents (page 3). This grid
              used to carry four hand-written feature titles that appeared in no
              issue, each captioned "12 pages". */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            {CONTENTS.map((entry) => (
              <div
                key={`${entry.page}-${entry.title}`}
                className="card p-5 sm:p-6 group hover:border-primary/50 transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  <div className="absolute -top-[30%] -right-[30%] w-[10rem] h-[10rem] rounded-full bg-emerald-500/6 blur-[30px]" />
                  <div className="absolute -bottom-[30%] -left-[30%] w-[10rem] h-[10rem] rounded-full bg-primary/4 blur-[30px]" />
                </div>
                <div className="uppercase text-accent text-xs tracking-widest font-semibold mb-1.5">
                  {entry.section}
                </div>
                <h4 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                  {entry.title}
                </h4>
                <div className="text-[11px] mt-4 text-muted-foreground/80 tabular-nums">
                  Page {entry.page} • {entry.pages} {entry.pages === 1 ? 'page' : 'pages'}
                </div>
              </div>
            ))}
          </div>
        </div>

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
