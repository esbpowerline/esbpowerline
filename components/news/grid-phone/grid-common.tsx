'use client';

import type { ReactNode } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { Prov } from './shared';

/** "Who owes this number" citation block that closes every briefing, as on desktop. */
export function Cite({ day, part, doc = 'PGCB Daily Report', host = 'pgcb.gov.bd', file }: { day: GridDailyData; part: string; doc?: string; host?: string; file?: string | null }) {
  const f = file === undefined ? day.sourceFiles?.pgcb : file;
  return (
    <div className="gz-cite">
      <b>{doc} · {part}</b>
      <br />Date: {day.systemStats.date}
      {f ? <><br />File: {f}</> : null}
      <br />From <a href={`https://www.${host}/`} target="_blank" rel="noopener noreferrer">{host}</a>
    </div>
  );
}

/** Label with a provenance mark, value on the right. */
export function Fact({ k, label, value, note }: { k: 'P' | 'D'; label: ReactNode; value: ReactNode; note?: string }) {
  return (
    <div>
      <dt>{label}<Prov kind={k} note={note} /></dt>
      <dd>{value}</dd>
    </div>
  );
}

export const U = ({ children }: { children: ReactNode }) => <span className="gp-u">{children}</span>;

export const sourceLabel = (day: GridDailyData) =>
  day.regionalDemandSource === 'bpdb-published' ? 'BPDB daily generation report — zone table' : 'P1 sheet — zone-wise demand and load-shed table';
