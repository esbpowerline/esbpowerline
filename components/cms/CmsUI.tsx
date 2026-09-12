/**
 * The CMS's names for the shared staff kit. There is one implementation, in
 * components/staff/StaffUI.tsx, and AdminUI.tsx exports the same components
 * under the admin names — so the two panels cannot drift apart again. Add a
 * component there, then alias it here and in AdminUI.tsx.
 */
export {
  StaffSectionStack as CmsSectionStack,
  StaffTileGrid as CmsTileGrid,
  StaffStatGrid as CmsStatGrid,
  StaffCardRow as CmsCardRow,
  StaffCardGrid as CmsCardGrid,
  StaffActionsGrid as CmsActionsGrid,
  StaffListStack as CmsListStack,
  StaffDenseList as CmsDenseList,
  StaffScheduleList as CmsScheduleList,
  StaffFilterTabs as CmsFilterTabs,
  StaffCardFooter as CmsCardFooter,
  StaffPageSkeleton as CmsPageSkeleton,
  StaffPageHeader as CmsPageHeader,
  StaffStatCard as CmsStatCard,
  StaffCard as CmsCard,
  StaffCreateCapsule as CmsCreateCapsule,
  StaffActionPill as CmsActionPill,
  StaffListRow as CmsListRow,
  StaffActivityItem as CmsActivityItem,
  StaffTableShell as CmsTableShell,
  StaffMetricRow as CmsMetricRow,
  StaffTagCapsule as CmsTagCapsule,
  StaffFormCard as CmsFormCard,
  StaffLoading as CmsLoading,
} from '@/components/staff/StaffUI';
