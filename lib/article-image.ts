/** Normalize article/media image URLs — never fall back to demo placeholder files. */
export function normalizeArticleImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  // If it's already an absolute URL, return as is.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // A legacy `/uploads/` path resolves to the Supabase object it was migrated
  // to. This used to build a `/storage/v1/render/image/public/...` URL with
  // `?width=1200&format=webp&quality=80`; Image Transformations are disabled on
  // the project and that endpoint answers 403 FeatureNotEnabled, so every such
  // URL was a broken image. No published article currently stores a `/uploads/`
  // imageUrl — which is the only reason this was not visible on the public site
  // — but 42 `Media` rows do, and they render in the CMS through here.
  //
  // The object URL is served as stored: uploads are already normalised to WebP
  // q100 at a 2560px longest edge by media-storage.ts, so the transform was
  // buying very little even when it worked.
  if (trimmed.startsWith('/uploads/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseUrl && !supabaseUrl.includes('your-project') && !supabaseUrl.includes('dummy')) {
      const filename = trimmed.substring('/uploads/'.length);
      const isCategory = filename.startsWith('categories/');
      const folder = isCategory ? '' : 'library/';
      const cleanFilename = isCategory ? filename.substring('categories/'.length) : filename;
      return `${supabaseUrl}/storage/v1/object/public/media/${folder}${cleanFilename}`;
    }
  }

  return trimmed;
}

export function hasArticleImage(url?: string | null): url is string {
  return normalizeArticleImageUrl(url) !== null;
}