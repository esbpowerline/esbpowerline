import {
  EDITOR_EMAIL,
  MASTER_ADMIN_EMAIL,
  RASEL_EMAIL,
} from '@/lib/staff-accounts';

/** Demo member account — local/staging only. */
export const MEMBER_DEMO_EMAIL = 'member@esbpowerline.com';

const DEV_PASSWORD_BY_EMAIL: Readonly<Record<string, string>> = {
  [MASTER_ADMIN_EMAIL.toLowerCase()]: 'admin007',
  [EDITOR_EMAIL.toLowerCase()]: 'editor007',
  [RASEL_EMAIL.toLowerCase()]: 'editor007',
  [MEMBER_DEMO_EMAIL.toLowerCase()]: 'member007',
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Whether the accounts being seeded would land in a real Supabase project.
 *
 * The guard used to key on NODE_ENV alone. `npm run supabase:seed-staff` is
 * plain `tsx`, which sets no NODE_ENV, while `.env.local` on the one machine
 * that runs it points at the production project — so the hardcoded dev
 * passwords were one command away from the live admin account (audit finding,
 * 2026-08-08). The danger is which project the env targets, not how the code
 * was built, so hosted Supabase counts as production whatever NODE_ENV says.
 */
export function isProductionSeedTarget(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'production') return true;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? env.SUPABASE_URL?.trim() ?? '';
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return !(host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'));
  } catch {
    return true;
  }
}

/**
 * Resolve bootstrap password for a known account email.
 * Production (or any hosted Supabase target): requires explicit env vars, no
 * hardcoded defaults. Local development: per-account defaults
 * (admin007 / editor007 / member007) unless overridden.
 */
export function seedPasswordForEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (isProductionSeedTarget()) {
    if (normalized === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return process.env.MASTER_ADMIN_PASSWORD?.trim() || null;
    }
    if (normalized === EDITOR_EMAIL.toLowerCase() || normalized === RASEL_EMAIL.toLowerCase()) {
      return process.env.EDITOR_PASSWORD?.trim() || process.env.MASTER_ADMIN_PASSWORD?.trim() || null;
    }
    if (normalized === MEMBER_DEMO_EMAIL.toLowerCase()) {
      return process.env.MEMBER_DEMO_PASSWORD?.trim() || null;
    }
    return null;
  }

  const globalOverride = process.env.SEED_DEMO_PASSWORD?.trim();
  if (globalOverride) return globalOverride;

  if (normalized === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return process.env.MASTER_ADMIN_PASSWORD?.trim() || DEV_PASSWORD_BY_EMAIL[normalized];
  }
  if (normalized === EDITOR_EMAIL.toLowerCase() || normalized === RASEL_EMAIL.toLowerCase()) {
    return process.env.EDITOR_PASSWORD?.trim() || DEV_PASSWORD_BY_EMAIL[normalized];
  }
  if (normalized === MEMBER_DEMO_EMAIL.toLowerCase()) {
    return process.env.MEMBER_DEMO_PASSWORD?.trim() || DEV_PASSWORD_BY_EMAIL[normalized];
  }

  return DEV_PASSWORD_BY_EMAIL[normalized] ?? null;
}

/** Dev-only staff login hint (master admin quick-fill). */
export function devStaffLoginPasswordHint(): string | null {
  if (isProductionSeedTarget()) return null;
  return seedPasswordForEmail(MASTER_ADMIN_EMAIL);
}