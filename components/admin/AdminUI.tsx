/**
 * The admin panel's names for the shared staff kit. There is one
 * implementation, in components/staff/StaffUI.tsx, and CmsUI.tsx exports the
 * same components under the CMS names — so the two panels cannot drift apart
 * again. Add a component there, then alias it here and in CmsUI.tsx.
 */
export {
  StaffSectionStack as AdminSectionStack,
  StaffTileGrid as AdminTileGrid,
  StaffStatGrid as AdminStatGrid,
  StaffCardRow as AdminCardRow,
  StaffCardGrid as AdminCardGrid,
  StaffActionsGrid as AdminActionsGrid,
  StaffListStack as AdminListStack,
  StaffDenseList as AdminDenseList,
  StaffScheduleList as AdminScheduleList,
  StaffFilterTabs as AdminFilterTabs,
  StaffCardFooter as AdminCardFooter,
  StaffPageSkeleton as AdminPageSkeleton,
  StaffPageHeader as AdminPageHeader,
  StaffStatCard as AdminStatCard,
  StaffCard as AdminCard,
  StaffCreateCapsule as AdminCreateCapsule,
  StaffActionPill as AdminActionPill,
  StaffListRow as AdminListRow,
  StaffActivityItem as AdminActivityItem,
  StaffTableShell as AdminTableShell,
  StaffMetricRow as AdminMetricRow,
  StaffTagCapsule as AdminTagCapsule,
  StaffFormCard as AdminFormCard,
  StaffLoading as AdminLoading,
} from '@/components/staff/StaffUI';
