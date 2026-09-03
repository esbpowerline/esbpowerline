import { requireMemberSession } from '@/lib/member-auth';
import { getMemberDownloads } from '@/lib/actions/members';
import { DownloadGridButton } from '@/components/members/DownloadGridButton';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: 'Downloads | Member library',
};

export default async function MemberDownloadsPage() {
  const session = await requireMemberSession();
  const downloads = await getMemberDownloads();

  return (
    <div className="space-y-8">
      <section className="member-section">
        <h2 className="member-section__title">Get data packages</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Download illustrative grid and sector snapshots. Each fetch is logged here for your reference.
        </p>
        <DownloadGridButton />
      </section>

      <section className="member-section">
        <h2 className="member-section__title">Download history</h2>
        {downloads.length === 0 ? (
          <div className="member-empty">
            <p>No downloads yet. Use the button above or export from Grid Explorer.</p>
          </div>
        ) : (
          <ul className="member-list">
            {downloads.map((item) => (
              <li key={item.id} className="member-list__item">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(item.createdAt.toISOString())}
                  </p>
                </div>
                {item.fileUrl === '/api/members/grid-export' ? (
                  // A route handler streaming a file, not a page: `next/link`
                  // would try to client-navigate to the download.
                  // eslint-disable-next-line @next/next/no-html-link-for-pages
                  <a href="/api/members/grid-export" className="btn btn-secondary text-xs">
                    Download again
                  </a>
                ) : item.fileUrl ? (
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-xs">
                    Open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}