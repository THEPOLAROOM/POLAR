-- ============================================================
-- POLAR V1 — Stage 4: Client Profile Card (profiles read policy)
-- ============================================================
-- Purpose: a linked barber currently has no way to read a client's
-- profiles row (full_name, phone) — 0003_stage3_accounts.sql only
-- granted "read own" / "update own" on public.profiles. The Client
-- Profile Card needs the client's name and phone alongside the
-- address that 0004_stage3_addresses.sql already exposes.
--
-- This mirrors the existing "client_addresses: authorised barber
-- read" policy exactly: readable only if the requesting account
-- currently holds the barber role AND an explicit row exists in
-- barber_client_links for this specific client. Losing the role or
-- the link immediately removes access, same as the address policy.
-- No other access is changed — client/owner_admin policies on
-- profiles are untouched, and no INSERT/UPDATE/DELETE policy is
-- added here.
-- ============================================================

create policy "profiles: linked barber reads"
  on public.profiles
  for select
  using (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = profiles.id
    )
  );
