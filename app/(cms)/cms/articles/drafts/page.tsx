import { auth } from '@/lib/auth';
import { getArticles } from '@/lib/actions/articles';
import { can } from '@/lib/constants';
import { FileEdit } from 'lucide-react';
import { AdminArticleManager } from '@/components/admin/AdminArticleManager';
import { CmsCreateCapsule, CmsPageHeader, CmsSectionStack } from '@/components/cms/CmsUI';

/**
 * My Drafts.
 *
 * This was a read-only list of titles and a date: to publish, schedule or
 * delete a draft you had to open it, act, and come back — for each one. It now
 * uses the same table as the articles desk, so a batch of drafts can be
 * selected and published, scheduled or trashed in one pass, with the search,
 * category filter and sort that table already has.
 *
 * Reused rather than rebuilt on purpose. A second bulk surface would be a
 * second place for the delete gate and the schedule validation to drift out
 * of, and this repo has been bitten by exactly that kind of parallel copy.
 */
export default async function CMSDraftsPage() {
  const session = await auth();
  const role = session?.user?.role;
  const editorLead = can(role, 'article.review');
  const canEditAny = can(role, 'article.edit_any');

  const drafts = await getArticles({
    authorId: editorLead ? undefined : session?.user?.id,
    status: 'DRAFT',
  });

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title={editorLead ? 'Drafts' : 'My Drafts'}
        description={
          editorLead
            ? 'All in-progress stories across the newsroom. Select several to publish, schedule or trash together.'
            : 'Stories you are still writing. Select several to publish, schedule or trash together.'
        }
        icon={FileEdit}
      >
        <CmsCreateCapsule href="/cms/articles/new" label="New draft" />
      </CmsPageHeader>

      <AdminArticleManager
        articles={drafts.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          author: a.author ? { id: a.author.id, name: a.author.name } : undefined,
          category: a.category,
          status: a.status,
          views: a.views,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          publishedAt: a.publishedAt,
          isPinned: a.isPinned,
          isFeatured: a.isFeatured,
          isBreaking: a.isBreaking,
          postAsNewsDesk: a.postAsNewsDesk,
        }))}
        editBase="/cms/articles"
        options={{
          currentUserId: session?.user?.id,
          canEditAny,
          // Every row here is a draft, so a status filter would offer one
          // option, and the author column only means something to a lead.
          showStatusFilter: false,
          showAuthorColumn: editorLead,
          showAuthorFilter: editorLead,
          showRevisionRequest: editorLead,
          showBulkFlags: false,
          useOwnBulkActions: !canEditAny,
          canSchedule: can(role, 'article.publish'),
        }}
      />
    </CmsSectionStack>
  );
}
