-- ==============================================================================
-- Supabase Schema for MySQL Exam Studio: GitHub OAuth & Role-Based Authorization
-- ==============================================================================
--
-- This script sets up:
-- 1. The `profiles` table linked directly to `auth.users`
-- 2. Role constraints: 'admin', 'staff', 'customer' (default: 'customer')
-- 3. Row Level Security (RLS) policies for owner access and admin management
-- 4. An automated trigger that provisions a profile whenever a new GitHub OAuth user signs in
-- 5. Helper functions for role authorization checks

-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  email text not null default '',
  avatar_url text not null default '',
  github_username text not null default '',
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Ensure github_username column exists if table was created previously
alter table public.profiles add column if not exists github_username text not null default '';

-- Index for fast role & email lookups
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_github on public.profiles(github_username);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Security Definer Helper Functions (avoids recursive RLS loops)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- 4. Supabase Row Level Security Policies
-- Drop existing policies if re-running
drop policy if exists "Profiles are viewable by owner or admins" on public.profiles;
drop policy if exists "Users can update their own profile and admins can update any" on public.profiles;
drop policy if exists "Allow profile insertion by owner or admin" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

-- Policy 1: SELECT - Users can read only their own profile; admins can read all
create policy "Profiles are viewable by owner or admins"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

-- Policy 2: UPDATE - Users can update their own profile (name, avatar); admins can update all including roles
create policy "Users can update their own profile and admins can update any"
  on public.profiles for update
  using (
    auth.uid() = id
    or public.is_admin()
  )
  with check (
    -- Admins can update any field including role
    public.is_admin()
    -- Non-admins cannot alter their role
    or (
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

-- Policy 3: INSERT - Users can insert their own profile on login; admins can insert any
create policy "Allow profile insertion by owner or admin"
  on public.profiles for insert
  with check (
    auth.uid() = id
    or public.is_admin()
  );

-- Policy 4: DELETE - Only admins can remove profiles
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    public.is_admin()
  );

-- 5. Trigger Function: Automatically create profile upon GitHub sign-in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_full_name text;
  user_avatar text;
  github_user text;
begin
  -- Extract GitHub user metadata
  github_user := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    ''
  );

  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    github_user,
    split_part(new.email, '@', 1)
  );

  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    ''
  );

  insert into public.profiles (id, full_name, email, avatar_url, github_username, role)
  values (
    new.id,
    user_full_name,
    coalesce(new.email, ''),
    user_avatar,
    github_user,
    'customer' -- default role is always 'customer'
  )
  on conflict (id) do update set
    full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end,
    email = case when excluded.email <> '' then excluded.email else profiles.email end,
    avatar_url = case when excluded.avatar_url <> '' then excluded.avatar_url else profiles.avatar_url end,
    github_username = case when excluded.github_username <> '' then excluded.github_username else profiles.github_username end,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

-- 6. Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- BOOTSTRAPPING AN ADMIN:
-- To elevate your first user to 'admin', run the following in the Supabase SQL editor:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-github-email@example.com';
-- ==============================================================================
