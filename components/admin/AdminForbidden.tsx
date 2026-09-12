import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { AdminCard, AdminPageHeader, AdminSectionStack } from '@/components/admin/AdminUI';

/*
 * A page like any other: header, then a card. It was a free-floating
 * `rounded-2xl` panel with a rose icon disc and no page header, so a
 * restricted section looked like a different application.
 */
export function AdminForbidden({
  title = 'Access restricted',
  description = 'Your role does not have permission to view this section. Contact a Super Admin if you need access.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <AdminSectionStack>
      <AdminPageHeader icon={ShieldOff} title={title} />
      <AdminCard title="Not available to your role" icon={ShieldOff} className="admin-card--warn">
        <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        <Link href="/admin" className="btn btn-secondary mt-4 self-start">
          Back to dashboard
        </Link>
      </AdminCard>
    </AdminSectionStack>
  );
}
