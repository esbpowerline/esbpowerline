-- Run once in Supabase Dashboard → SQL Editor
-- Creates the public media bucket used by /api/upload and category icon uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for published assets
drop policy if exists "Public read media bucket" on storage.objects;
create policy "Public read media bucket"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

-- Staff only may upload (service role bypasses RLS for server uploads)
drop policy if exists "Authenticated upload media bucket" on storage.objects;
drop policy if exists "Staff upload media bucket" on storage.objects;
create policy "Staff upload media bucket"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COPY_EDITOR', 'PHOTO_EDITOR', 'REPORTER'
    )
  );

drop policy if exists "Authenticated update own media" on storage.objects;
create policy "Authenticated update own media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and auth.uid() = owner);

drop policy if exists "Authenticated delete own media" on storage.objects;
create policy "Authenticated delete own media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and auth.uid() = owner);