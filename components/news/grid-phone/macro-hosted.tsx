'use client';

/**
 * The parts of Macro Trends the phone still shows as the desktop built them.
 *
 * Each is a large panel with its own loaders and state (the reserve model and
 * its canvas, the published-vs-derived ledger, the longitudinal study, the
 * seventeen-sheet monthly detail). Redrawing them is its own job; until then
 * they are hosted inside `.grid-explorer` so the explorer's stylesheets apply
 * exactly as on the page and nothing they publish is lost on a phone.
 */

import dynamic from 'next/dynamic';
import { useChartTheme } from '@/hooks/useChartTheme';

const sk = (h: number) => function Loading() { return <div className="gp-skel" style={{ height: h }} />; };

const GasReserveDepletionTab = dynamic(() => import('@/components/news/power-grid/GasReserveDepletionTab').then((m) => m.GasReserveDepletionTab), { ssr: false, loading: sk(420) });
const PublishedVsDerivedTab = dynamic(() => import('@/components/news/power-grid/PublishedVsDerivedTab').then((m) => m.PublishedVsDerivedTab), { ssr: false, loading: sk(420) });
const LongitudinalStudyCharts = dynamic(() => import('@/components/news/power-grid/LongitudinalStudy').then((m) => m.LongitudinalStudyCharts), { ssr: false, loading: sk(320) });

export function HostedReserves(props: { selectedDate: string; systemStatsDate: string; pgcbGasTotal: number }) {
  return <div className="gp-host grid-explorer gpm-hosted"><GasReserveDepletionTab {...props} chartsReady /></div>;
}

export function HostedVerification({ latestGridDay }: { latestGridDay: string }) {
  return <div className="gp-host grid-explorer gpm-hosted"><PublishedVsDerivedTab latestGridDay={latestGridDay} /></div>;
}

export function HostedLongitudinal({ isTruncated, allowedYears }: { isTruncated: boolean; allowedYears: number | null }) {
  const chartTheme = useChartTheme();
  return <div className="gp-host grid-explorer gpm-hosted"><LongitudinalStudyCharts chartTheme={chartTheme} isTruncated={isTruncated} allowedYears={allowedYears} /></div>;
}
