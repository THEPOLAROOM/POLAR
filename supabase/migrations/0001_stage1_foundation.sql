-- ============================================================
-- POLAR V1 — Stage 1: Project Foundation
-- ============================================================
-- Purpose: establish the default-deny RLS baseline described in
-- POLAR HQ 2, Section 16 ("secure by default", "minimum access").
--
-- RULE FOR EVERY FUTURE MIGRATION IN THIS PROJECT:
--   1. Any new table MUST have
--          ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
--      in the SAME migration that creates it.
--   2. A table with RLS enabled and NO policies is unreadable and
--      unwritable by anyone except a service-role key. That is the
--      correct starting state for every new table — access is then
--      opened up deliberately, policy by policy, in later stages.
--   3. Never disable RLS on a table that holds real user data.
-- ============================================================

-- A minimal table that exists only to prove, end to end, that:
--   (a) the app can reach the database, and
--   (b) RLS default-deny is actually working (no anonymous or
--       authenticated read/write is possible without an explicit
--       policy granting it).
create table if not exists public._health_check (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public._health_check enable row level security;

-- Deliberately NO policies are created here.
-- Expected result when tested from the app or Supabase API:
--   - SELECT / INSERT / UPDATE / DELETE all fail for the anon key.
--   - This is the correct, secure Stage 1 result — not a bug.

insert into public._health_check default values;
