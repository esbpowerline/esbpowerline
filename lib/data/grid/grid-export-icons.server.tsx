import 'server-only';

import { Svg, Path, Circle, Line } from '@react-pdf/renderer';

/**
 * Minimal stroked vector icon set for the PDF report (lucide-style 24x24 paths,
 * MIT). Rendered natively by react-pdf's SVG engine — no image assets.
 */
export type IconName =
  | 'zap'
  | 'flame'
  | 'gauge'
  | 'globe'
  | 'clock'
  | 'map'
  | 'alert'
  | 'network'
  | 'trend'
  | 'bank'
  | 'percent'
  | 'factory'
  | 'droplet'
  | 'bulb'
  | 'calendar'
  | 'user'
  | 'shield'
  | 'layers';

type Prim = { d?: string; c?: [number, number, number]; l?: [number, number, number, number] };

const ICONS: Record<IconName, Prim[]> = {
  zap: [
    {
      d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    },
  ],
  flame: [
    {
      d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5',
    },
  ],
  gauge: [{ d: 'm12 14 4-4' }, { d: 'M3.34 19a10 10 0 1 1 17.32 0' }],
  globe: [
    { c: [12, 12, 10] },
    { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' },
    { l: [2, 12, 22, 12] },
  ],
  clock: [{ c: [12, 12, 10] }, { d: 'M12 6v6l4 2' }],
  map: [
    { d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' },
    { c: [12, 10, 3] },
  ],
  alert: [
    { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' },
    { d: 'M12 9v4' },
    { d: 'M12 17h.01' },
  ],
  network: [
    { c: [18, 5, 3] },
    { c: [6, 12, 3] },
    { c: [18, 19, 3] },
    { l: [8.59, 13.51, 15.42, 17.49] },
    { l: [15.41, 6.51, 8.59, 10.49] },
  ],
  trend: [{ d: 'M16 7h6v6' }, { d: 'm22 7-8.5 8.5-5-5L2 17' }],
  bank: [
    { d: 'M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z' },
    { c: [12, 12, 2] },
    { d: 'M6 12h.01M18 12h.01' },
  ],
  percent: [{ l: [19, 5, 5, 19] }, { c: [6.5, 6.5, 2.5] }, { c: [17.5, 17.5, 2.5] }],
  factory: [
    { d: 'M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' },
    { d: 'M17 18h1' },
    { d: 'M12 18h1' },
    { d: 'M7 18h1' },
  ],
  droplet: [
    {
      d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
    },
  ],
  bulb: [
    {
      d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
    },
    { d: 'M9 18h6' },
    { d: 'M10 22h4' },
  ],
  calendar: [
    { d: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { d: 'M16 2v4' },
    { d: 'M8 2v4' },
    { d: 'M3 10h18' },
  ],
  user: [{ d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }, { c: [12, 7, 4] }],
  shield: [
    {
      d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    },
  ],
  layers: [
    {
      d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z',
    },
    { d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' },
    { d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' },
  ],
};

export function Icon({
  name,
  size = 12,
  color = '#2563eb',
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const prims = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {prims.map((p, i) => {
        const common = {
          stroke: color,
          strokeWidth,
          fill: 'none',
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
        };
        if (p.d) return <Path key={i} d={p.d} {...common} />;
        if (p.c) return <Circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} {...common} />;
        if (p.l) return <Line key={i} x1={p.l[0]} y1={p.l[1]} x2={p.l[2]} y2={p.l[3]} {...common} />;
        return null;
      })}
    </Svg>
  );
}
