import 'server-only';

import { revalidateTag } from 'next/cache';
import { CONTENT_TAGS } from '@/lib/public-paths';

/**
 * Immediately expire a content cache tag so the next read recomputes (read-your-writes).
 *
 * Next 16's `revalidateTag(tag, profile)` requires a profile; `{ expire: 0 }` forces
 * immediate expiration (a bare `revalidateTag(tag)` is deprecated and warns). We use
 * `revalidateTag` rather than `updateTag` because `updateTag` throws outside a Server
 * Action — these helpers also run from the scheduled-publish cron (a Route Handler).
 */
function expireTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

/** Article publish/update/delete/placement changed → flush article + category-count caches. */
export function revalidateArticleContent() {
  expireTag(CONTENT_TAGS.articles);
  expireTag(CONTENT_TAGS.categories);
}

/** Category structure changed → flush category caches and article lists that render category data. */
export function revalidateCategoryContent() {
  expireTag(CONTENT_TAGS.categories);
  expireTag(CONTENT_TAGS.articles);
}

/** Magazine issue changed → flush the magazine cache. */
export function revalidateMagazineContent() {
  expireTag(CONTENT_TAGS.magazine);
}

/** Nuclear "refresh the whole public site" — flush every content cache. */
export function revalidateAllContent() {
  expireTag(CONTENT_TAGS.articles);
  expireTag(CONTENT_TAGS.categories);
  expireTag(CONTENT_TAGS.magazine);
}
