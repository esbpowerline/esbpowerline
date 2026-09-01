import { describe, it, expect, vi, beforeEach } from 'vitest';

// Pin the append-only history contract: every effective publish writes exactly
// one revision with the right kind, the previous revision is superseded, and a
// failure to record history never blocks the publish itself (fail soft, loud).

const state: {
  existing: { id: string; checksum: string; revokedAt: Date | null } | null;
  lastRevision: { id: string; revision: number } | null;
  created: any[];
  superseded: string[];
  revisionTableBroken: boolean;
} = { existing: null, lastRevision: null, created: [], superseded: [], revisionTableBroken: false };

vi.mock('@/lib/prisma', () => {
  const tx = {
    dataReleaseRevision: {
      findFirst: async () => {
        if (state.revisionTableBroken) throw new Error('relation "DataReleaseRevision" does not exist');
        return state.lastRevision;
      },
      update: async ({ where }: any) => {
        state.superseded.push(where.id);
        return {};
      },
      create: async ({ data }: any) => {
        state.created.push(data);
        return data;
      },
    },
  };
  return {
    default: {
      dataRelease: {
        findUnique: async () => state.existing,
        upsert: async () => ({ id: 'rel-1' }),
      },
      $transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    },
  };
});

import { writeRelease } from '@/lib/data/release-write';

const payload = { any: 'payload' };

beforeEach(() => {
  state.existing = null;
  state.lastRevision = null;
  state.created = [];
  state.superseded = [];
  state.revisionTableBroken = false;
});

describe('writeRelease revision history', () => {
  it('records revision 1 with kind PUBLISH on a first publish', async () => {
    const r = await writeRelease({ feed: 'GAS_INDEX', key: 'singleton', payload, sourceName: 'ingest' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.revisionRecorded).toBe(true);
    expect(state.created).toHaveLength(1);
    expect(state.created[0]).toMatchObject({
      revision: 1,
      kind: 'PUBLISH',
      previousChecksum: null,
      reason: 'published from ingest',
    });
  });

  it('records CORRECT with the replaced checksum and supersedes the previous revision', async () => {
    state.existing = { id: 'rel-1', checksum: 'old-sum', revokedAt: null };
    state.lastRevision = { id: 'rev-1', revision: 1 };

    const r = await writeRelease({
      feed: 'GAS_INDEX',
      key: 'singleton',
      payload,
      reason: 'zone table re-parsed from workbook',
    });
    expect(r.ok).toBe(true);
    expect(state.superseded).toEqual(['rev-1']);
    expect(state.created[0]).toMatchObject({
      revision: 2,
      kind: 'CORRECT',
      previousChecksum: 'old-sum',
      reason: 'zone table re-parsed from workbook',
    });
  });

  it('records RESTORE when re-publishing a revoked key', async () => {
    state.existing = { id: 'rel-1', checksum: 'old-sum', revokedAt: new Date() };
    await writeRelease({ feed: 'GAS_INDEX', key: 'singleton', payload });
    expect(state.created[0].kind).toBe('RESTORE');
  });

  it('does not write a revision for an unchanged re-publish', async () => {
    const { payloadChecksum } = await import('@/lib/data/release-checksum');
    state.existing = { id: 'rel-1', checksum: payloadChecksum(payload), revokedAt: null };
    const r = await writeRelease({ feed: 'GAS_INDEX', key: 'singleton', payload });
    expect(r.ok && r.skipped).toBe('unchanged');
    expect(state.created).toHaveLength(0);
  });

  it('fails soft when the history table is missing: publish stands, revisionRecorded is false', async () => {
    state.revisionTableBroken = true;
    const r = await writeRelease({ feed: 'GAS_INDEX', key: 'singleton', payload });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.revisionRecorded).toBe(false);
  });
});
