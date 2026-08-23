/**
 * Read a data file from wherever its current version lives.
 *
 * Every client reader used to fetch `/data/<path>` and, at best, retry
 * `/api/data/<path>` on a 404. That covers a day published after the last
 * deploy, but not a *correction* to a day already in the build: the stale file
 * answers 200, so the retry never happens and publishing appears to do nothing.
 *
 * So: consult the manifest of published keys first. If the key is published,
 * the database copy is authoritative and is read directly. Otherwise the static
 * file is used, with the original 404 retry kept as a backstop for the window
 * between a publish and the manifest refreshing.
 *
 * Failing to reach the manifest is not an error — it degrades to exactly the
 * old behaviour.
 */

import {
  resolveDataTarget,
  runtimeDataUrl,
  staticDataUrl,
  type DataFeedName,
} from '@/lib/data/feed-paths';

type Manifest = { generatedAt: string; feeds: Partial<Record<DataFeedName, string[]>> };

const MANIFEST_URL = '/api/data-manifest';
/** Long enough that a tab does not re-request it constantly, short enough that
 *  an editor watching the site sees their publish without a reload. */
const MANIFEST_TTL_MS = 30_000;

let manifestPromise: Promise<Manifest | null> | null = null;
let manifestFetchedAt = 0;

function loadManifest(): Promise<Manifest | null> {
  const now = Date.now();
  if (manifestPromise && now - manifestFetchedAt < MANIFEST_TTL_MS) return manifestPromise;
  manifestFetchedAt = now;
  manifestPromise = fetch(MANIFEST_URL, { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<Manifest>) : null))
    .catch(() => null);
  return manifestPromise;
}

/** Drop the cached manifest so the next read re-checks. */
export function clearDataManifestCache(): void {
  manifestPromise = null;
  manifestFetchedAt = 0;
}

async function isPublished(relPath: string): Promise<boolean> {
  const target = resolveDataTarget(relPath);
  if (!target) return false;
  const manifest = await loadManifest();
  return Boolean(manifest?.feeds?.[target.feed]?.includes(target.key));
}

/**
 * Whether the manifest says this path has a runtime release. Exposed for
 * loaders with their own fetch flow (the daily-report loader): asking first
 * lets them skip the static request entirely for a released day, instead of
 * collecting a guaranteed 404 in every visitor's console on the way to the
 * fallback.
 */
export async function isPathPublished(relPath: string): Promise<boolean> {
  return isPublished(relPath);
}

export type DataFetchResult<T> =
  | { ok: true; data: T; source: 'static' | 'runtime' }
  | { ok: false; status?: number; error: string };

/**
 * Fetch one data file by its path relative to `public/data`
 * (e.g. `curves/2026-08-19.json`).
 */
export async function fetchDataJson<T>(
  relPath: string,
  init?: RequestInit,
): Promise<DataFetchResult<T>> {
  const published = await isPublished(relPath);

  if (published) {
    try {
      const res = await fetch(runtimeDataUrl(relPath), { ...init, cache: 'no-store' });
      if (res.ok) return { ok: true, data: (await res.json()) as T, source: 'runtime' };
      // A revoked release between manifest and read: fall through to static.
      if (res.status === 403) return { ok: false, status: 403, error: 'tier_locked' };
    } catch {
      /* fall through to the static copy */
    }
  }

  try {
    const res = await fetch(staticDataUrl(relPath), init);
    if (res.ok) return { ok: true, data: (await res.json()) as T, source: 'static' };
    if (res.status === 403) return { ok: false, status: 403, error: 'tier_locked' };
    if (res.status === 404 && !published) {
      // Published a moment ago, before the manifest caught up.
      const runtime = await fetch(runtimeDataUrl(relPath), { cache: 'no-store' });
      if (runtime.ok) return { ok: true, data: (await runtime.json()) as T, source: 'runtime' };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}
