import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const createClient = vi.fn(() => ({ auth: { getUser } }));
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => createClient(...(args as [])) }));

const env = { url: 'https://example.supabase.co', anonKey: 'anon-key', isConfigured: true };
vi.mock('@/utils/supabase/env', () => ({ getSupabaseEnv: () => env }));

import { parseBearerHeader, verifyBearerUser } from '@/lib/supabase/bearer';

// a JWT-shaped token: three base64url parts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.c2lnbmF0dXJl';

describe('parseBearerHeader', () => {
  it('takes exactly "Bearer <jwt>"', () => {
    expect(parseBearerHeader(`Bearer ${TOKEN}`)).toBe(TOKEN);
  });

  it('accepts the scheme in any case (RFC 7235), nothing else loosened', () => {
    expect(parseBearerHeader(`bearer ${TOKEN}`)).toBe(TOKEN);
    expect(parseBearerHeader(`BEARER ${TOKEN}`)).toBe(TOKEN);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['scheme only', 'Bearer'],
    ['scheme and a space only', 'Bearer '],
    ['another scheme', `Basic ${TOKEN}`],
    ['no scheme', TOKEN],
    ['two spaces', `Bearer  ${TOKEN}`],
    ['a tab', `Bearer\t${TOKEN}`],
    ['trailing space', `Bearer ${TOKEN} `],
    ['leading space', ` Bearer ${TOKEN}`],
    ['two tokens', `Bearer ${TOKEN} ${TOKEN}`],
    ['not a jwt (no dots)', 'Bearer abcdef'],
    ['not a jwt (two parts)', 'Bearer aaa.bbb'],
    ['not a jwt (four parts)', 'Bearer aaa.bbb.ccc.ddd'],
    ['empty part', 'Bearer aaa..ccc'],
    ['illegal characters', 'Bearer aaa.bb$b.ccc'],
    ['newline injection', `Bearer ${TOKEN}\nX-Evil: 1`],
  ])('refuses %s', (_name, value) => {
    expect(parseBearerHeader(value as string | null | undefined)).toBeNull();
  });

  it('refuses an oversized token', () => {
    const big = `${'a'.repeat(4000)}.${'b'.repeat(100)}.${'c'.repeat(100)}`;
    expect(parseBearerHeader(`Bearer ${big}`)).toBeNull();
  });
});

describe('verifyBearerUser', () => {
  beforeEach(() => {
    getUser.mockReset();
    createClient.mockClear();
    env.isConfigured = true;
  });

  it('returns the user Supabase vouches for, and a client that sends the token', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'editor@example.com' } }, error: null });
    const result = await verifyBearerUser(TOKEN);
    expect(result?.user.id).toBe('user-1');
    expect(getUser).toHaveBeenCalledWith(TOKEN); // verified by Supabase, never read from the payload
    const [url, key, options] = createClient.mock.calls[0] as unknown as [string, string, { auth: Record<string, boolean>; global: { headers: Record<string, string> } }];
    expect(url).toBe(env.url);
    expect(key).toBe(env.anonKey);
    expect(options.global.headers.Authorization).toBe(`Bearer ${TOKEN}`); // row-level security runs as that user
    expect(options.auth).toMatchObject({ persistSession: false, autoRefreshToken: false });
  });

  it('is null when Supabase refuses the token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    expect(await verifyBearerUser(TOKEN)).toBeNull();
  });

  it('is null when Supabase returns no user without an error', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await verifyBearerUser(TOKEN)).toBeNull();
  });

  it('is null (and makes no call) when Supabase is not configured', async () => {
    env.isConfigured = false;
    expect(await verifyBearerUser(TOKEN)).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
