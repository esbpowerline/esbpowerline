import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getTagCounts } from '@/lib/actions/articles';
import { can } from '@/lib/constants';
import { Hash, Search } from 'lucide-react';
import { CmsPageHeader, CmsSectionStack, CmsCard, CmsTagCapsule } from '@/components/cms/CmsUI';

export default async function CMSTagsPage() {
  const session = await auth();
  const editorLead = can(session?.user?.role, 'article.review');
  const tags = await getTagCounts(editorLead ? undefined : session?.user?.id);

  return (
    <CmsSectionStack>
      <CmsPageHeader
        icon={Hash}
        title="Tags"
        description={
          editorLead
            ? 'All topic tags used across the news portal — spot coverage gaps and trends.'
            : 'Tags on your articles — reuse them for consistent topic coverage.'
        }
      />

      <CmsCard title={`${tags.length} tags`} icon={Hash}>
        {tags.length === 0 ? (
          <p className="text-[13px] text-muted-foreground flex items-center gap-2">
            <Search className="h-4 w-4" /> No tags yet — add them when writing articles.
          </p>
        ) : (
          <div className="admin-chip-grid">
            {/* The capsule's own hover, not a sky override on this page alone. */}
            {tags.map(({ tag, count }) => (
              <Link key={tag} href={`/cms/articles?tag=${encodeURIComponent(tag)}`}>
                <CmsTagCapsule className="cursor-pointer">
                  {tag}
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">{count}</span>
                </CmsTagCapsule>
              </Link>
            ))}
          </div>
        )}
      </CmsCard>
    </CmsSectionStack>
  );
}