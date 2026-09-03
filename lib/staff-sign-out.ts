'use client';

import { signOutSessionAction } from '@/lib/actions/sign-out';
import { getPublicSiteUrl } from '@/lib/auth-routing';

async function clearSession() {
  try {
    await signOutSessionAction();
    return;
  } catch {
    // Fall back to client-side sign-out if the server action is unavailable.
  }

  try {
    // Loaded here, not at the top: this module reaches the public navbar
    // through the member menu, and a static import carried all of supabase-js
    // (a 223 KB chunk) to every anonymous reader for a fallback that runs
    // only when a sign-out's server action fails (SEO_FIX_LOG stage 4).
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Still redirect — user can retry if the cookie persists.
  }
}

/** Sign out and land on the public front page. */
export async function signOutToPublicSite() {
  await clearSession();
  window.location.assign(getPublicSiteUrl());
}

/** @deprecated Use signOutToPublicSite */
export const signOutStaffToPublicSite = signOutToPublicSite;