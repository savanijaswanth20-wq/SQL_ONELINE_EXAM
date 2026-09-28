-- ==============================================================================
-- Supabase Schema for MySQL Exam Studio: GitHub OAuth, Profiles & Exam Storage
-- ==============================================================================

-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  github_id text default '',
  github_username text not null default '',
  full_name text not null default '',
  email text not null default '',
  avatar_url text not null default '',
  role text not null default 'student' check (role in ('admin', 'staff', 'student', 'customer')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Ensure columns exist if table was created previously
alter table public.profiles add column if not exists github_id text default '';
alter table public.profiles add column if not exists github_username text not null default '';
alter table public.profiles alter column role set default 'student';

-- Indexes for profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_github_id on public.profiles(github_id);
create index if not exists idx_profiles_github_username on public.profiles(github_username);

-- 2. Create exam_attempts table
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default '',
  student_id text not null default '',
  cohort text not null default '',
  started_at bigint not null,
  deadline bigint not null,
  submitted_at bigint,
  status text not null default 'active' check (status in ('active', 'submitted')),
  score_automatic numeric default 0,
  score_written numeric default 0,
  score_pending numeric default 0,
  score_total numeric,
  percentage numeric,
  grade text default '',
  passed boolean,
  report_card jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_exam_attempts_user_id on public.exam_attempts(user_id);
create index if not exists idx_exam_attempts_status on public.exam_attempts(status);

-- 3. Create exam_answers table
create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.exam_attempts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id integer not null,
  value text not null default '',
  correction text not null default '',
  flagged boolean not null default false,
  review_mark integer,
  reflection text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(attempt_id, question_id)
);

create index if not exists idx_exam_answers_attempt_id on public.exam_answers(attempt_id);
create index if not exists idx_exam_answers_user_id on public.exam_answers(user_id);

-- 4. Enable Row Level Security (RLS) on all exposed public tables
alter table public.profiles enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;

-- 5. Helper Functions for Role Authorization (Security Definer)
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

-- 6. Row Level Security Policies

-- Profiles Policies
drop policy if exists "Profiles are viewable by owner or admins" on public.profiles;
drop policy if exists "Users can update their own profile and admins can update any" on public.profiles;
drop policy if exists "Allow profile insertion by owner or admin" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Profiles are viewable by owner or admins"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or public.is_admin()
  );

create policy "Users can update their own profile and admins can update any"
  on public.profiles for update
  to authenticated
  using (
    (select auth.uid()) = id
    or public.is_admin()
  )
  with check (
    public.is_admin()
    or (
      (select auth.uid()) = id
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    )
  );

create policy "Allow profile insertion by owner or admin"
  on public.profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    or public.is_admin()
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (
    public.is_admin()
  );

-- Exam Attempts Policies
drop policy if exists "Users can view their own attempts or admins can view all" on public.exam_attempts;
drop policy if exists "Users can insert their own attempts or admins can insert any" on public.exam_attempts;
drop policy if exists "Users can update their own attempts or admins can update any" on public.exam_attempts;
drop policy if exists "Admins can delete exam attempts" on public.exam_attempts;

create policy "Users can view their own attempts or admins can view all"
  on public.exam_attempts for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Users can insert their own attempts or admins can insert any"
  on public.exam_attempts for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Users can update their own attempts or admins can update any"
  on public.exam_attempts for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_admin()
  )
  with check (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Admins can delete exam attempts"
  on public.exam_attempts for delete
  to authenticated
  using (
    public.is_admin()
  );

-- Exam Answers Policies
drop policy if exists "Users can view their own answers or admins can view all" on public.exam_answers;
drop policy if exists "Users can insert their own answers or admins can insert any" on public.exam_answers;
drop policy if exists "Users can update their own answers or admins can update any" on public.exam_answers;
drop policy if exists "Admins can delete exam answers" on public.exam_answers;

create policy "Users can view their own answers or admins can view all"
  on public.exam_answers for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Users can insert their own answers or admins can insert any"
  on public.exam_answers for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Users can update their own answers or admins can update any"
  on public.exam_answers for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_admin()
  )
  with check (
    (select auth.uid()) = user_id
    or public.is_admin()
  );

create policy "Admins can delete exam answers"
  on public.exam_answers for delete
  to authenticated
  using (
    public.is_admin()
  );

-- 7. Automated Trigger Function: Handle new or returning GitHub OAuth sign-in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  github_id_val text;
  github_user text;
  user_full_name text;
  user_avatar text;
begin
  -- Extract metadata from raw_user_meta_data
  github_id_val := coalesce(
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'sub',
    new.raw_user_meta_data->>'github_id',
    ''
  );

  github_user := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    ''
  );

  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    github_user,
    split_part(coalesce(new.email, ''), '@', 1),
    'Student'
  );

  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    ''
  );

  insert into public.profiles (id, github_id, github_username, full_name, email, avatar_url, role)
  values (
    new.id,
    github_id_val,
    github_user,
    user_full_name,
    coalesce(new.email, ''),
    user_avatar,
    'student' -- default role is 'student'
  )
  on conflict (id) do update set
    github_id = case when excluded.github_id <> '' then excluded.github_id else profiles.github_id end,
    github_username = case when excluded.github_username <> '' then excluded.github_username else profiles.github_username end,
    full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end,
    email = case when excluded.email <> '' then excluded.email else profiles.email end,
    avatar_url = case when excluded.avatar_url <> '' then excluded.avatar_url else profiles.avatar_url end,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

-- 8. Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
