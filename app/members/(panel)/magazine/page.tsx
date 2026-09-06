import Link from 'next/link';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { requireMemberSession } from '@/lib/member-auth';
import { getAllMagazineIssues, getMagazineSavedState } from '@/lib/actions/members';
import { SaveMagazineButton } from '@/components/members/SaveMagazineButton';
import { formatDate } from '@/lib/utils';
import { DEMO_ISSUE, IS_DEMO } from '@/lib/magazine-demo-issue';

export const metadata = {
  title: 'Magazine archive | Member library',
};

export default async function MemberMagazinePage() {
  /**
   * While IS_DEMO holds there is no archive to list.
   *
   * This read MagazineIssue directly and so served the three seed rows from
   * prisma/seed.ts — "Renewables Surge & Tariff Reform", "Grid Modernization &
   * Nuclear Dawn", "Gas Security & Regional Trade" — as a member's back-issue
   * library, each with a Download PDF button pointing at example.com. None of
   * those issues exists. /magazine has ignored the same rows since it was
   * written; this page and the homepage card had not caught up.
   *
   * The one real issue is the demo, and it has no MagazineIssue row to save
   * against, so it is not listed here — it is linked instead.
   */
  const [session, issues] = await Promise.all([
    requireMemberSession(),
    IS_DEMO ? Promise.resolve([]) : getAllMagazineIssues(),
  ]);
  const savedStates = await Promise.all(
    issues.map((issue) => getMagazineSavedState(issue.id)),
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Full magazine archive for members. Download PDFs or save issues to your library for quick access.
      </p>

      {issues.length === 0 ? (
        <div className="member-empty">
          {IS_DEMO ? (
            <p>
              No edition has been published yet. The one issue the site carries &mdash;{' '}
              <strong>{DEMO_ISSUE.title}</strong> ({DEMO_ISSUE.volume} &bull; {DEMO_ISSUE.issue}) &mdash; is a
              sample produced to demonstrate the magazine&rsquo;s design, and it is readable in full on the
              public page.
            </p>
          ) : (
            <p>No magazine issues published yet.</p>
          )}
          <Link href="/magazine" className="btn btn-secondary text-sm mt-4">
            {IS_DEMO ? 'Read the demo issue' : 'View public magazine page'}
          </Link>
        </div>
      ) : (
        <ul className="member-magazine-list">
          {issues.map((issue, index) => (
            <li key={issue.id} className="member-magazine-card">
              <div className="member-magazine-card__cover">
                <Image src={issue.coverUrl} alt="" width={112} height={144}  className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {formatDate(issue.issueDate.toISOString())}
                </p>
                <h3 className="font-semibold text-lg mt-1">{issue.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{issue.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {issue.pdfUrl ? (
                    <a
                      href={issue.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary inline-flex items-center gap-2 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">PDF coming soon</span>
                  )}
                  <SaveMagazineButton magazineId={issue.id} initialSaved={savedStates[index]} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}