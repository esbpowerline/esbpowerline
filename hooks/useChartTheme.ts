'use client';

import { useEffect, useState } from 'react';
import {
  CHART_INK,
  categoricalSlot,
  resolveFuelColor,
  type ChartMode,
} from '@/lib/data/grid/chart-palette';

export type ChartTheme = {
  trendStroke: string;
  trendFill: string;
  axisTick: string;
  hoverFill: string;
  primary: string;
  accent: string;
  destructive: string;
  gridStroke: string;
  palette: string[];
  /** Which surface the chart is drawing on — palette steps are chosen per mode. */
  mode: ChartMode;
  /** Validated fuel colour by PGCB name. Ignores the payload's own `color`. */
  fuel: (name: string) => string;
  /** Nth validated categorical slot, for series that are not fuels. */
  categorical: (index: number) => string;
  /** Recessive chrome — gridlines, axes, muted label ink. */
  ink: { gridline: string; axis: string; muted: string };
};

function hslVar(name: string): string {
  if (typeof document === 'undefined') return '';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw})` : '';
}

const PALETTE_LIGHT = [
  'hsl(224 85% 42%)',
  'hsl(160 84% 33%)',
  'hsl(38 92% 42%)',
  'hsl(262 65% 48%)',
  'hsl(0 72% 48%)',
  'hsl(199 85% 38%)',
  'hsl(173 58% 36%)',
];

const PALETTE_DARK = [
  'hsl(217 91% 60%)',
  'hsl(160 84% 42%)',
  'hsl(38 92% 50%)',
  'hsl(262 72% 62%)',
  'hsl(0 72% 55%)',
  'hsl(199 89% 48%)',
  'hsl(173 58% 42%)',
];

/** The palette accessors for a mode, shared by the fallback and the live read. */
function paletteFor(mode: ChartMode) {
  return {
    mode,
    fuel: (name: string) => resolveFuelColor(name, mode),
    categorical: (index: number) => categoricalSlot(index, mode),
    ink: {
      gridline: CHART_INK.gridline[mode],
      axis: CHART_INK.axis[mode],
      muted: CHART_INK.muted[mode],
    },
  };
}

function readChartTheme(): ChartTheme {
  const fallback: ChartTheme = {
    trendStroke: '#fafafa',
    trendFill: '#fafafa',
    axisTick: '#a1a1aa',
    hoverFill: 'rgba(255,255,255,0.07)',
    primary: '#3b82f6',
    accent: '#10b981',
    destructive: '#ef4444',
    gridStroke: '#334155',
    palette: PALETTE_DARK,
    ...paletteFor('dark'),
  };

  if (typeof document === 'undefined') return fallback;

  const isLight = document.documentElement.classList.contains('theme-white');
  const primary = hslVar('--primary') || fallback.primary;
  const accent = hslVar('--accent') || fallback.accent;
  const destructive = hslVar('--destructive') || fallback.destructive;
  const gridStroke = hslVar('--border') || fallback.gridStroke;
  const axisTick = hslVar('--muted-foreground') || (isLight ? '#71717a' : '#a1a1aa');
  const trendStroke = hslVar('--foreground') || (isLight ? '#18181b' : '#fafafa');
  const palette = (isLight ? PALETTE_LIGHT : PALETTE_DARK).map((color, i) => {
    if (i === 0) return primary;
    if (i === 1) return accent;
    if (i === 4) return destructive;
    return color;
  });

  return {
    trendStroke,
    trendFill: trendStroke,
    axisTick,
    hoverFill: isLight ? 'hsl(var(--muted) / 0.55)' : 'hsl(var(--muted) / 0.35)',
    primary,
    accent,
    destructive,
    gridStroke,
    palette,
    ...paletteFor(isLight ? 'light' : 'dark'),
  };
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(readChartTheme);

  useEffect(() => {
    const sync = () => setTheme(readChartTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-site-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}