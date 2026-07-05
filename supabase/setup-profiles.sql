-- Run once in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/sxgokpmrbgdndstygapc/sql/new

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'SUBSCRIBER',
  status text not null default 'ACTIVE',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists status text not null default 'ACTIVE';

alter table public.profiles enable row level security;

drop policy if exists "Profiles readable by authenticated users" on public.profiles;
drop policy if exists "Profiles readable by owner" on public.profiles;
drop policy if exists "Profiles readable by staff" on public.profiles;
create policy "Profiles readable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);
create policy "Profiles readable by staff"
  on public.profiles for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in (
      'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COPY_EDITOR', 'PHOTO_EDITOR', 'REPORTER'
    )
  );

-- Users may update own display fields only — NOT role or status (prevents self-escalation).
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users update own profile display fields" on public.profiles;
create policy "Users update own profile display fields"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_app_meta_data->>'role', 'SUBSCRIBER'),
    coalesce(new.raw_app_meta_data->>'status', 'ACTIVE')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        status = excluded.status,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing auth users (admin + editor)
insert into public.profiles (id, full_name, role, status)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  coalesce(u.raw_app_meta_data->>'role', 'SUBSCRIBER'),
  coalesce(u.raw_app_meta_data->>'status', 'ACTIVE')
from auth.users u
on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      status = excluded.status,
      updated_at = now();