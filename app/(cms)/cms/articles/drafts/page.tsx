import { auth } from '@/lib/auth';
import { getMyDrafts } from '@/lib/actions/articles';
import { can } from '@/lib/constants';
import { FileEdit } from 'lucide-react';
import { MyDraftsPanel } from '@/components/cms/MyDraftsPanel';
import { CmsCreateCapsule, CmsPageHeader, CmsCard, CmsSectionStack } from '@/components/cms/CmsUI';

/**
 * My Drafts.
 *
 * "My" is the whole specification. `getMyDrafts` scopes to the session and
 * takes no author parameter, so this cannot widen to the newsroom the way it
 * did when it went through `getArticles` — that helper shows everything to
 * anyone holding `article.review`, which meant an editor opened My Drafts and
 * saw every writer's unfinished work.
 *
 * A lead who wants the whole newsroom's drafts has All Articles, filtered to
 * Draft. That is a different job and it already has a page.
 */
export default async function CMSDraftsPage() {
  const session = await auth();
  const drafts = await getMyDrafts();

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title="My Drafts"
        description="Stories you are still writing. Select several to publish, schedule or trash together."
        icon={FileEdit}
      >
        <CmsCreateCapsule href="/cms/articles/new" label="New draft" />
      </CmsPageHeader>

      <CmsCard>
        <MyDraftsPanel
          drafts={drafts}
          canSchedule={can(session?.user?.role, 'article.publish')}
        />
      </CmsCard>
    </CmsSectionStack>
  );
}
