-- ============================================================
-- POLAR V1 — Client Balance / Tab (barber-only)
-- ============================================================
-- Purpose: a simple running balance the barber can set/adjust for a
-- client. GBP only, no payment processing, no transaction ledger.
-- £0.00 = settled, positive = client owes the barber, negative =
-- client has credit.
--
-- Deliberately a SEPARATE table from client_profile_details rather
-- than new columns on it: client_profile_details already has
-- client-facing read/create/update policies (auth.uid() = profile_id)
-- for the client's own row, and Postgres column privileges are
-- role-wide, not policy-scoped — adding balance columns there would
-- let the client see/edit their own balance through the exact same
-- self-service policies a barber relies on for full access to that
-- table. A separate table with no client-facing policy at all avoids
-- that entirely, satisfying "barber-only" cleanly.
--
-- NOT applied to the live project — prepared for review only.
-- ============================================================

create table public.client_balances (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null default 0,
  note text,
  updated_at timestamptz not null default now()
);

alter table public.client_balances enable row level security;

create policy "client_balances: linked barber reads"
  on public.client_balances
  for select
  using (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_balances.profile_id
    )
  );

create policy "client_balances: linked barber creates"
  on public.client_balances
  for insert
  with check (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_balances.profile_id
    )
  );

create policy "client_balances: linked barber updates"
  on public.client_balances
  for update
  using (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_balances.profile_id
    )
  )
  with check (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_balances.profile_id
    )
  );

create policy "client_balances: owner_admin read"
  on public.client_balances
  for select
  using (public.has_role('owner_admin'));

-- Deliberately no client-facing policy of any kind — "barber-only"
-- per the V1 requirement. No policy exists that would let a client
-- read or write this table under any circumstance.
