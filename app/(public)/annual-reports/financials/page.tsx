import FinancialsClient from './FinancialsClient';

// Pure client component with static chart data — prerender as static HTML so it's
// served from the CDN with zero per-view serverless invocations.
export const dynamic = 'force-static';

export const metadata = {
  title: 'Sector Financials | ESB PowerLine',
  description:
    "Annual financial performance of Bangladesh's power sector utilities — revenue, subsidy, losses and capital spend, charted from published annual reports.",
  alternates: {
    canonical: '/annual-reports/financials',
  },
};

export default function FinancialsPage() {
  return <FinancialsClient />;
}
