-- ============================================================
-- POLAR V1 — Stage 2: Roles & Account Foundation
-- ============================================================
-- Scope: role/permission substrate only. No profile, sign-up, or
-- professional-detail fields — those belong to Stage 3 (Section 02/03)
-- and are deliberately NOT created here.
--
-- Continues the Stage 1 rule: RLS is enabled in the SAME migration
-- that creates each new table, and no access exists until a policy
-- deliberately grants it.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Role enum — sourced from Section 01 (Client, Barber/Stylist,
--    Owner/Admin) and Section 01.1 (Designer/Developer).
-- ------------------------------------------------------------
create type public.polar_role as enum (
  'client',
  'barber',
  'owner_admin',
  'designer_developer'
);

-- ------------------------------------------------------------
-- 2. user_roles — a join table so one account can hold multiple
--    roles at once (e.g. Rahim: barber + owner_admin +
--    designer_developer as three separate rows), per Decision A.
-- ------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.polar_role not null,
  granted_at timestamptz not null default now(),
  -- Hardening requirement 3: deleting the granting account must not
  -- destroy the historical grant record. granted_at alone remains
  -- sufficient audit history if granted_by becomes null.
  granted_by uuid references auth.users(id) on delete set null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- SELECT: an account may see only its own role rows. No policy exists
-- for INSERT, UPDATE or DELETE — there is no path, for any signed-in
-- request regardless of role, to create, change or remove a role row.
-- Role changes only ever happen via direct elevated database access
-- (Supabase SQL Editor) as agreed for V1.
create policy "user_roles: read own roles only"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. has_role() — reusable permission-check helper for later stages'
--    RLS policies (Stage 4+). SECURITY DEFINER is required so a
--    caller without a select policy on user_roles can still have
--    their own membership checked; it deliberately checks only
--    auth.uid() and never accepts a caller-supplied user id, so it
--    cannot be used to probe another account's roles.
-- ------------------------------------------------------------
create or replace function public.has_role(check_role public.polar_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = check_role
  );
$$;

-- Hardening requirement 1: least-privilege on the function itself.
revoke all on function public.has_role(public.polar_role) from public;
grant execute on function public.has_role(public.polar_role) to authenticated;

-- ------------------------------------------------------------
-- 4. Signup trigger — the ONLY automatic role grant. Always and only
--    'client', regardless of anything in the new user's metadata.
--    Hardening requirement 2: this function reads nothing from
--    new.raw_user_meta_data or any other user-suppliable field when
--    deciding the role, specifically so a crafted sign-up request
--    cannot self-promote.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_roles (user_id, role, granted_by)
  values (new.id, 'client', null); -- granted_by null = automatic system grant
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 5. MFA requirement — documented per Decision B, NOT enforced.
--    Do not add any check, constraint or policy here that blocks a
--    privileged role without MFA. That enforcement is added only
--    once an MFA enrollment/authentication flow exists in the app.
-- ------------------------------------------------------------
comment on type public.polar_role is
  'POLAR V1 roles (Section 01 / 01.1). Per Section 16, barber/owner_admin/'
  'designer_developer roles are REQUIRED to eventually use MFA. Enforcement '
  'is deliberately deferred until an MFA enrollment flow exists — do not '
  'block these roles at the database level until that flow ships.';

-- ------------------------------------------------------------
-- 6. Stage 1 regression check (manual, not executable SQL):
--    After running this migration, re-confirm from the app or SQL
--    Editor that public._health_check is still unreadable to the
--    anon/authenticated roles. This migration does not touch that
--    table and should not change its behaviour.
-- ------------------------------------------------------------
