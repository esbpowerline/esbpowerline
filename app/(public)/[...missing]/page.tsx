import { notFound } from 'next/navigation';

/**
 * Catch-all so an unknown public path renders the branded `not-found.tsx` of
 * this segment — inside the public layout, with navigation — instead of the
 * bare root 404. It matches only what no other route claimed. Static routes
 * and the dynamic segments (`/articles/[slug]`, `/categories/[slug]`, …) take
 * precedence, so nothing that exists is affected (SEO_FIX_LOG stage 5).
 */
export default function MissingPage() {
  notFound();
}
