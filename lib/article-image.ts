/** Normalize article/media image URLs — never fall back to demo placeholder files. */
export function normalizeArticleImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  // If it's already an absolute URL, return as is.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a relative uploads path, resolve dynamically to Supabase Storage in production
  if (trimmed.startsWith('/uploads/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseUrl && !supabaseUrl.includes('your-project') && !supabaseUrl.includes('dummy')) {
      const filename = trimmed.substring('/uploads/'.length);
      const isCategory = filename.startsWith('categories/');
      const folder = isCategory ? '' : 'library/';
      const cleanFilename = isCategory ? filename.substring('categories/'.length) : filename;
      return `${supabaseUrl}/storage/v1/render/image/public/media/${folder}${cleanFilename}?width=1200&format=webp&quality=80`;
    }
  }

  return trimmed;
}

export function hasArticleImage(url?: string | null): url is string {
  return normalizeArticleImageUrl(url) !== null;
}