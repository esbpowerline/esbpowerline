'use client';

import { useCallback } from 'react';
import { useSession } from '@/utils/supabase/auth-context';
import { can } from '@/lib/constants';
import { resolveWorkspaceUrl } from '@/lib/auth-routing';

/**
 * Client-side detection of a signed-in editorial staff member on the public site.
 * Backed by the shared Supabase auth context, so it never opts the cached public
 * pages out of static rendering — the affordance is injected after hydration only
 * for staff who can reach the CMS.
 */
export function useEditorPresence() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const canQuickEdit = status === 'authenticated' && can(role, 'article.create');

  /**
   * Resolve the cross-surface CMS editor URL for an article. Computed at call time
   * (on click) so it reads the live window location — matching how the navbar's
   * "Open workspace" link resolves the CMS origin (localhost:3001 in split dev,
   * same-origin `/cms/...` in production).
   */
  const resolveEditHref = useCallback((articleId: string) => {
    const path = `/cms/articles/${articleId}/edit`;
    if (typeof window === 'undefined') return path;
    return resolveWorkspaceUrl(path, {
      hostname: window.location.hostname,
      host: window.location.host,
      protocol: window.location.protocol,
    });
  }, []);

  return { canQuickEdit, resolveEditHref };
}
