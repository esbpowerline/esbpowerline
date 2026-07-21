import FinancialsClient from './FinancialsClient';

// Pure client component with static chart data — prerender as static HTML so it's
// served from the CDN with zero per-view serverless invocations.
export const dynamic = 'force-static';

export default function FinancialsPage() {
  return <FinancialsClient />;
}
