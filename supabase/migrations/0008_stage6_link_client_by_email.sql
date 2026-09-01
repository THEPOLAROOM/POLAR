-- ============================================================
-- POLAR V1 — Stage 6 Part 2: link_client_by_email()
-- ============================================================
-- Purpose: the smallest safe way for a barber to establish a
-- barber_client_links relationship without manual SQL, replacing the
-- temporary "you run an insert yourself" step documented in
-- 0004_stage3_addresses.sql and the README.
--
-- Deliberately does NOT add any INSERT policy to barber_client_links —
-- that table's "no insert/update/delete policy for any role" invariant
-- (see 0004) stays exactly as documented. Instead, this function is
-- the sole write path, in the same SECURITY DEFINER pattern already
-- used by handle_new_user()/handle_new_user_profile() to write
-- RLS-protected tables that have no client-facing insert policy.
--
-- Security notes:
--   - Uses auth.uid() for the barber id, never a caller-supplied one —
--     same rule has_role() follows, so this cannot be used to act on
--     another barber's behalf.
--   - Checks has_role('barber') internally — this function is the
--     actual enforcement point, not just the calling server action's
--     requireRole("barber").
--   - Resolving client_email -> user id requires reading auth.users,
--     and checking that user's role requires reading user_roles for a
--     user other than the caller — both are impossible under normal
--     RLS (user_roles only allows reading your own rows), which is
--     exactly why this needs SECURITY DEFINER rather than a plain
--     policy-based check.
--   - Returns a bare boolean only, in every case (wrong/unknown email,
--     email belongs to a non-client, caller isn't a barber). A barber
--     can never distinguish these outcomes from the return value, so
--     this cannot be used to enumerate or probe accounts.
--   - Duplicate links are a harmless no-op (on conflict do nothing)
--     against the existing (barber_profile_id, client_profile_id)
--     primary key.
-- ============================================================

create or replace function public.link_client_by_email(client_email text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_barber_id uuid := auth.uid();
  v_client_id uuid;
begin
  if not public.has_role('barber') then
    return false;
  end if;

  select id into v_client_id from auth.users where email = client_email;

  if v_client_id is null then
    return false;
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = v_client_id and role = 'client'
  ) then
    return false;
  end if;

  insert into public.barber_client_links (barber_profile_id, client_profile_id)
  values (v_barber_id, v_client_id)
  on conflict do nothing;

  return true;
end;
$$;

revoke all on function public.link_client_by_email(text) from public;
grant execute on function public.link_client_by_email(text) to authenticated;
-- This project grants EXECUTE on new public-schema functions to anon
-- by default (a direct grant, not inherited through PUBLIC — observed
-- directly on the live project when this migration was applied, e.g.
-- handle_new_user()/handle_new_user_profile() are also anon-executable
-- despite predating this function), so "revoke ... from public" alone
-- does not remove anon's access. Revoked explicitly here so this
-- function matches has_role()'s actual (not just intended) access:
-- authenticated only. Harmless either way, since the has_role('barber')
-- check inside returns false for auth.uid() = null (anon) before
-- anything else runs — this is defense in depth, not a fix for an
-- exploitable gap.
revoke execute on function public.link_client_by_email(text) from anon;
