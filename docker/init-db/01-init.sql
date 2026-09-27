-- ==============================================================================
-- 01-init.sql: Local PostgreSQL Initialization for MySQL Exam Studio
-- Compatible with Prisma, Supabase Profiles & Exam Attempt Stores
-- ==============================================================================

-- 1. Enable Useful Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Mock Supabase Auth Schema for Local Development
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock auth.uid() function for RLS checks
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Mock auth.role() function
CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'authenticated')::TEXT;
$$ LANGUAGE SQL STABLE;

-- 3. Public Profiles Table (Role-based access)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  github_username TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_github ON public.profiles(github_username);

-- 4. Application Exam Tables (Postgres port of schema)
CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL DEFAULT '',
  cohort TEXT NOT NULL DEFAULT '',
  started_at BIGINT NOT NULL,
  deadline BIGINT NOT NULL,
  submitted_at BIGINT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','submitted')),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_exam_attempt_owner ON exam_attempts(owner, started_at DESC);

CREATE TABLE IF NOT EXISTS exam_answers (
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id INT NOT NULL CHECK(question_id BETWEEN 1 AND 65),
  value TEXT NOT NULL DEFAULT '',
  correction TEXT NOT NULL DEFAULT '',
  flagged INT NOT NULL DEFAULT 0,
  review_mark INT,
  reflection TEXT NOT NULL DEFAULT '',
  updated_at BIGINT NOT NULL,
  PRIMARY KEY(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_start_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL
);

-- Seed a default demo admin profile for testing
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '{"full_name": "Demo Admin", "user_name": "demoadmin"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, github_username, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Admin', 'admin@example.com', 'demoadmin', 'admin')
ON CONFLICT (id) DO NOTHING;
