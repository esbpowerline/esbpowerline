import { beforeEach, describe, expect, it, vi } from 'vitest';

const settings = vi.hoisted(() => new Map<string, unknown>());
vi.mock('@/lib/notifications/store', () => ({
  SETTING_KEYS: {
    config: 'telegram.config',
    heartbeat: 'telegram.heartbeat',
    health: 'telegram.health',
    hourlyLast: 'grid.hourly.last',
    schedulerLease: 'lease.scheduler',
    alertState: (rule: string) => `grid.alert.${rule}`,
  },
  readSetting: async (key: string, _schema: unknown, fallback: unknown) => (settings.has(key) ? settings.get(key) : fallback),
  writeSetting: async (key: string, value: unknown) => void settings.set(key, value),
  acquireLease: async () => true,
  releaseLease: async () => undefined,
}));

const emitted = vi.hoisted(() => ({ keys: new Set<string>(), calls: [] as Array<{ type: string; dedupeKey: string; payload: unknown }> }));
vi.mock('@/lib/notifications/events', () => ({
  emitEvent: async (e: { type: string; dedupeKey: string; payload: unknown }) => {
    const created = !emitted.keys.has(e.dedupeKey);
    emitted.keys.add(e.dedupeKey);
    if (created) emitted.calls.push(e);
    return { eventId: e.dedupeKey, created, deliveriesCreated: created ? 1 : 0 };
  },
}));

const grid = vi.hoisted(() => ({ newest: vi.fn(), shed: vi.fn(), gen: vi.fn() }));
vi.mock('@/lib/notifications/grid/snapshot', () => ({
  readNewestHour: grid.newest,
  loadShedHoursSince: grid.shed,
  generationHoursSince: grid.gen,
}));
vi.mock('@/lib/notifications/grid/daily', () => ({ buildDailySummaryPayload: vi.fn() }));
vi.mock('@/lib/notifications/processor', () => ({ processDueDeliveries: vi.fn() }));
vi.mock('@/lib/notifications/articles', () => ({ reconcileArticles: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {} }));

import { produceAlerts, produceHourly } from '@/lib/notifications/scheduler';
import { DEFAULT_RUNTIME_CONFIG } from '@/lib/notifications/config';

const NOW = new Date('2026-09-14T06:00:00Z');
const config = { ...DEFAULT_RUNTIME_CONFIG, gridHourly: true, gridAlerts: true };
const hourAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const snapshot = (observedAt: string) => ({
  observedAt,
  demandMw: 14000,
  supplyMw: 13900,
  loadShedMw: 100,
  generationMw: 13900,
  generationState: 'consistent' as const,
  componentSumMw: 13900,
  importsMw: 2400,
  previous: null,
});

beforeEach(() => {
  settings.clear();
  emitted.keys.clear();
  emitted.calls.length = 0;
  vi.clearAllMocks();
  grid.gen.mockResolvedValue([]);
});

describe('hourly bulletin', () => {
  it('posts nothing when switched off', async () => {
    expect(await produceHourly({ ...config, gridHourly: false }, NOW)).toBe('disabled');
  });

  it('posts nothing when no hour is stored — never zeros', async () => {
    grid.newest.mockResolvedValue(null);
    expect(await produceHourly(config, NOW)).toBe('no stored hour');
    expect(emitted.calls).toHaveLength(0);
  });

  it('does not post an hour older than the window, and says why', async () => {
    grid.newest.mockResolvedValue(snapshot(hourAgo(10)));
    expect(await produceHourly(config, NOW)).toBe('stale');
    expect(emitted.calls).toHaveLength(0);
  });

  it('posts a new hour once, keyed by the hour', async () => {
    grid.newest.mockResolvedValue(snapshot(hourAgo(4)));
    expect(await produceHourly(config, NOW)).toBe('queued');
    expect(emitted.calls[0]).toMatchObject({ type: 'GRID_HOURLY_SNAPSHOT', dedupeKey: `grid.hourly:${hourAgo(4)}` });
    expect(await produceHourly(config, NOW)).toBe('no new hour');
    expect(emitted.calls).toHaveLength(1);
  });

  it('respects the minimum interval when NLDC posts a batch', async () => {
    grid.newest.mockResolvedValue(snapshot(hourAgo(4)));
    await produceHourly(config, NOW);
    grid.newest.mockResolvedValue(snapshot(hourAgo(3)));
    expect(await produceHourly(config, new Date(NOW.getTime() + 20 * 60_000))).toBe('within interval');
    expect(await produceHourly(config, new Date(NOW.getTime() + 61 * 60_000))).toBe('queued');
  });
});

describe('alerts', () => {
  const shed = (h: number, mw: number | null) => ({ observedAt: new Date(hourAgo(h)), loadShedMw: mw });

  it('four hours above the line is one alert, not four', async () => {
    grid.shed.mockResolvedValue([shed(5, 3100), shed(4, 3150), shed(3, 3120), shed(2, 3180)]);
    expect(await produceAlerts(config, NOW)).toBe(1);
    expect(emitted.calls[0]).toMatchObject({ type: 'GRID_ALERT', payload: expect.objectContaining({ rule: 'HIGH_LOAD_SHED', transition: 'ENTER', valueMw: 3100 }) });
  });

  it('a second run over the same hours alerts nothing new', async () => {
    grid.shed.mockResolvedValue([shed(5, 3100), shed(4, 3150)]);
    await produceAlerts(config, NOW);
    grid.shed.mockResolvedValue([]);
    expect(await produceAlerts(config, NOW)).toBe(0);
    expect(emitted.calls).toHaveLength(1);
  });

  it('hours too old to be news advance the state silently', async () => {
    grid.shed.mockResolvedValue([shed(20, 3400)]);
    expect(await produceAlerts(config, NOW)).toBe(0);
    expect(settings.get('grid.alert.HIGH_LOAD_SHED')).toMatchObject({ active: true });
  });
});
