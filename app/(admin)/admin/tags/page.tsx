import { AdminPageHeader, AdminSectionStack, AdminCard, AdminTagCapsule } from '@/components/admin/AdminUI';
import { getTagCounts } from '@/lib/actions/articles';
import { Hash } from 'lucide-react';

/* Same icon, same counts, same empty state as the CMS Tags page. This one
   showed bare names under a different icon, with the empty message inside
   the chip row. */
export default async function AdminTagsPage() {
  const tags = await getTagCounts();
  return (
    <AdminSectionStack>
      <AdminPageHeader
        icon={Hash}
        title="Tags"
        description="All tags used across articles on the platform."
      />
      <AdminCard title={`${tags.length} tags`} icon={Hash}>
        {tags.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No tags yet.</p>
        ) : (
          <div className="admin-chip-grid">
            {tags.map(({ tag, count }) => (
              <AdminTagCapsule key={tag}>
                {tag}
                <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">{count}</span>
              </AdminTagCapsule>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminSectionStack>
  );
}
