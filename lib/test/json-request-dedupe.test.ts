import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchJsonDeduped,
  inflightJsonRequestCount,
} from '@/lib/data/json-request-dedupe';

/** A fetch the test settles by hand, so concurrency is real rather than timed. */
function deferredFetch() {
  const calls: string[] = [];
  const resolvers: Array<(res: Response) => void> = [];
  const fn = vi.fn((url: string) => {
    calls.push(url);
    return new Promise<Response>((resolve) => resolvers.push(resolve));
  });
  return { fn, calls, resolvers };
}

function jsonResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('fetchJsonDeduped', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares one request between concurrent callers of the same URL', async () => {
    // The production case: two components mount in the same render and both
    // ask for plants/2026-09-17.json before either answer has landed. On
    // 2026-09-19 that file was requested four times in one view.
    const { fn, calls, resolvers } = deferredFetch();
    vi.stubGlobal('fetch', fn);

    const a = fetchJsonDeduped<{ n: number }>('/api/data/plants/2026-09-17.json');
    const b = fetchJsonDeduped<{ n: number }>('/api/data/plants/2026-09-17.json');
    const c = fetchJsonDeduped<{ n: number }>('/api/data/plants/2026-09-16.json');

    expect(calls).toEqual([
      '/api/data/plants/2026-09-17.json',
      '/api/data/plants/2026-09-16.json',
    ]);
    expect(inflightJsonRequestCount()).toBe(2);

    resolvers[0](jsonResponse(200, { n: 17 }));
    resolvers[1](jsonResponse(200, { n: 16 }));
    const [ra, rb, rc] = await Promise.all([a, b, c]);

    expect(ra).toEqual({ ok: true, status: 200, data: { n: 17 } });
    expect(rb).toBe(ra);
    expect(rc).toEqual({ ok: true, status: 200, data: { n: 16 } });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(inflightJsonRequestCount()).toBe(0);
  });

  it('fetches again once the shared request has settled', async () => {
    // Not a result cache: the daily loader's `refresh` flag re-asks for a day
    // it already holds so a correction published since can land, and the
    // browser answers that revalidation by ETag. Holding results here would
    // silently turn that into a no-op.
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { v: 1 }));
    await fetchJsonDeduped('/data/daily/2026-09-17.json');
    await fetchJsonDeduped('/data/daily/2026-09-17.json');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns a 403 as a status to every waiter and never as data', async () => {
    // The tier gate is decided by middleware per request. A locked day must be
    // reported locked to each concurrent caller, and must not linger so that
    // a reader who signs in and asks again gets yesterday's denial.
    const { fn, resolvers } = deferredFetch();
    vi.stubGlobal('fetch', fn);

    const a = fetchJsonDeduped('/data/daily/2026-09-01.json');
    const b = fetchJsonDeduped('/data/daily/2026-09-01.json');
    resolvers[0](jsonResponse(403));
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toEqual({ ok: false, status: 403 });
    expect(rb).toEqual({ ok: false, status: 403 });
    expect('data' in ra).toBe(false);
    expect(inflightJsonRequestCount()).toBe(0);

    // The next ask is a fresh request, not the remembered denial.
    fn.mockImplementationOnce(async () => jsonResponse(200, { unlocked: true }));
    const after = await fetchJsonDeduped('/data/daily/2026-09-01.json');
    expect(after).toEqual({ ok: true, status: 200, data: { unlocked: true } });
  });

  it('does not read a body on a non-OK response', async () => {
    // Existing loader tests stub fetch with `{ ok: false, status }` and no
    // `json` method; a 404 must be reportable without touching the body.
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchJsonDeduped('/data/curves/2016-01-01.json')).resolves.toEqual({
      ok: false,
      status: 404,
    });
  });

  it('rejects every waiter on a network failure and clears the slot', async () => {
    const { fn, calls } = deferredFetch();
    fn.mockImplementation(() => {
      calls.push('x');
      return Promise.reject(new Error('offline'));
    });
    vi.stubGlobal('fetch', fn);

    const a = fetchJsonDeduped('/data/daily/2026-09-17.json');
    const b = fetchJsonDeduped('/data/daily/2026-09-17.json');
    await expect(a).rejects.toThrow('offline');
    await expect(b).rejects.toThrow('offline');
    expect(calls).toHaveLength(1);
    expect(inflightJsonRequestCount()).toBe(0);
  });
});
