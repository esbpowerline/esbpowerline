import { formatDeskDate } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { getArticles } from '@/lib/actions/articles';
import { can } from '@/lib/constants';
import { FileEdit } from 'lucide-react';
import { CmsCreateCapsule, CmsPageHeader, CmsListRow, CmsCard, CmsSectionStack, CmsListStack } from '@/components/cms/CmsUI';

export default async function CMSDraftsPage() {
  const session = await auth();
  const editorLead = can(session?.user?.role, 'article.review');

  const drafts = await getArticles({
    authorId: editorLead ? undefined : session?.user?.id,
    status: 'DRAFT',
  });

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title="Drafts"
        description={editorLead ? 'All in-progress stories across the newsroom' : 'Stories you are still writing'}
        icon={FileEdit}
      >
        <CmsCreateCapsule href="/cms/articles/new" label="New draft" />
      </CmsPageHeader>

      <CmsCard>
        <CmsListStack>
          {drafts.map((a) => (
            <CmsListRow
              key={a.id}
              title={a.title}
              href={`/cms/articles/${a.id}/edit`}
              meta={a.category}
              value={formatDeskDate(a.updatedAt)}
            />
          ))}
          {drafts.length === 0 && (
            <p className="text-[13px] text-muted-foreground py-4 text-center">No drafts — start a new story.</p>
          )}
        </CmsListStack>
      </CmsCard>
    </CmsSectionStack>
  );
}