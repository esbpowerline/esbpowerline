import { describe, it, expect } from 'vitest';
import { friendlyAuthError, GENERIC_AUTH_ERROR } from '@/lib/auth-error-copy';

describe('friendlyAuthError', () => {
  it('never leaks the Supabase billing restriction to the public sign-in page', () => {
    // The exact string the form rendered on 2026-09-01, verbatim.
    const upstream =
      'Service for this project is restricted due to the following violations: ' +
      'exceed_egress_quota. The project owner must upgrade their plan or remove ' +
      'spend caps to restore service.';

    const { message, detail } = friendlyAuthError(upstream);

    expect(message).toBe(GENERIC_AUTH_ERROR);
    expect(message).not.toMatch(/quota|egress|plan|spend|billing|restrict/i);
    // The operator still needs to know, so it travels separately.
    expect(detail).toBe(upstream);
  });

  it.each([
    'Service unavailable',
    'Database error querying schema',
    'connect ECONNREFUSED 10.0.0.1:5432',
    'JWT expired',
    'relation "profiles" does not exist',
    '{"code":"over_quota","message":"payment required"}',
  ])('sends %s to the log, not the form', (upstream) => {
    const { message, detail } = friendlyAuthError(upstream);
    expect(message).toBe(GENERIC_AUTH_ERROR);
    expect(detail).toBe(upstream);
  });

  it('still tells a visitor what they can act on', () => {
    expect(friendlyAuthError('Invalid login credentials').message).toMatch(/invalid email or password/i);
    expect(friendlyAuthError('Email not confirmed').message).toMatch(/confirmed/i);
    expect(friendlyAuthError('For security purposes, you can only request this after 47 seconds').message)
      .toMatch(/too many attempts/i);
    expect(friendlyAuthError('User already registered').message).toMatch(/already exists/i);
  });

  it('does not log a detail for a recognised failure', () => {
    expect(friendlyAuthError('Invalid login credentials').detail).toBeNull();
  });

  it('never reveals whether an account exists', () => {
    // Both must produce the same sentence, or the form becomes an enumerator.
    expect(friendlyAuthError('Invalid login credentials').message).toBe(
      friendlyAuthError('User not found').message,
    );
  });

  it('handles an Error object and an empty value', () => {
    expect(friendlyAuthError(new Error('Invalid login credentials')).message).toMatch(/invalid email/i);
    expect(friendlyAuthError(null).message).toBe(GENERIC_AUTH_ERROR);
    expect(friendlyAuthError(undefined).detail).toBe('unknown auth error');
  });
});
