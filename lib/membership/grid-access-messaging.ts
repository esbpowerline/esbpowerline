import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { GRID_PLANS, formatPlanPrice } from '@/lib/membership/grid-plans';

export type GridAccessMessage = {
  badge: string;
  headline: string;
  subheadline: string;
  currentAccess: string;
  upgradePrompt: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  showPaymentSoon: boolean;
};

const CALLBACK = '/grid-explorer';
const LOGIN = `/members/login?callbackUrl=${encodeURIComponent(CALLBACK)}`;

/** Copy shown when user hits a locked date — keyed by tier required to unlock. */
export function getLockedDateMessage(
  requiredTier: GridAccessTier,
  selectedDate: string,
): GridAccessMessage {
  switch (requiredTier) {
    case 'member':
      return {
        badge: 'Data locked',
        headline: 'Historical data is locked',
        subheadline: `Reports before your visitor window are members-only. ${selectedDate} sits outside what you can view today.`,
        currentAccess: 'You can only view the last 7 days of data.',
        upgradePrompt: 'Want to see more? Sign up free for the last 30 days of grid data.',
        primaryLabel: 'Sign up free',
        primaryHref: LOGIN,
        secondaryLabel: 'Already a member? Sign in',
        secondaryHref: LOGIN,
        showPaymentSoon: false,
      };
    case 'plan_499':
      return {
        badge: 'Archive locked',
        headline: 'This date needs a subscription',
        subheadline: `${selectedDate} is beyond your free 30-day member window.`,
        currentAccess: 'Your free account covers the last 30 days of PGCB grid reports.',
        upgradePrompt: `Subscribe at ${formatPlanPrice(GRID_PLANS.plan_499)}/month to unlock five years of daily data.`,
        primaryLabel: 'View ৳499 plan',
        primaryHref: '/members/subscription',
        secondaryLabel: 'Compare all plans',
        secondaryHref: '/members/subscription',
        showPaymentSoon: true,
      };
    case 'plan_999':
    default:
      return {
        badge: 'Deep archive locked',
        headline: 'Full backlog access required',
        subheadline: `${selectedDate} is older than five years — it lives in our complete PGCB archive.`,
        currentAccess: 'Your current plan does not include the full historical backlog.',
        upgradePrompt: `Upgrade to ${formatPlanPrice(GRID_PLANS.plan_999)}/month for unlimited archive access since 2013.`,
        primaryLabel: 'View ৳999 plan',
        primaryHref: '/members/subscription',
        secondaryLabel: 'See plan details',
        secondaryHref: '/members/subscription',
        showPaymentSoon: true,
      };
  }
}

/** Persistent status copy for the access banner — keyed by user's current tier. */
export function getTierStatusMessage(
  tier: GridAccessTier,
  totalArchiveDays?: number,
): {
  statusLabel: string;
  accessWindow: string;
  upgradeLine: string | null;
  upgradeHref: string | null;
} {
  const archiveHint =
    totalArchiveDays && totalArchiveDays > 0 && tier !== 'plan_999'
      ? `${totalArchiveDays.toLocaleString()} days in the full archive`
      : null;

  switch (tier) {
    case 'visitor':
      return {
        statusLabel: 'Visitor access',
        accessWindow: 'Last 7 days',
        upgradeLine: archiveHint
          ? `Want more? Sign up free → 30 days · ${archiveHint}`
          : 'Want more? Sign up free → 30 days of grid data',
        upgradeHref: LOGIN,
      };
    case 'member':
      return {
        statusLabel: 'Free member',
        accessWindow: 'Last 30 days',
        upgradeLine: archiveHint
          ? `Go deeper → ৳499/mo for 5 years · ${archiveHint}`
          : 'Go deeper → ৳499/mo unlocks 5 years of history',
        upgradeHref: '/members/subscription',
      };
    case 'plan_499':
      return {
        statusLabel: 'Grid Archive — 5 Years',
        accessWindow: '5 years of daily reports',
        upgradeLine: archiveHint
          ? `Need everything? ৳999/mo full archive · ${archiveHint}`
          : 'Need everything? Upgrade to ৳999/mo for the full backlog',
        upgradeHref: '/members/subscription',
      };
    case 'plan_999':
      return {
        statusLabel: 'Full archive',
        accessWindow: 'Complete PGCB backlog',
        upgradeLine: null,
        upgradeHref: null,
      };
  }
}
