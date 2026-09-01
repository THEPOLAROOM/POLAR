-- ============================================================
-- POLAR V1 — Stage 4: Schema Baseline (documentation only)
-- ============================================================
-- Purpose: client_profile_details, custom_field_definitions and
-- custom_field_values (plus the custom_field_type enum and every RLS
-- policy below) were already live in the Stage 4 Supabase project
-- before this file was written — created directly, outside of this
-- repo's migration history. This migration brings the repo's record
-- of the schema in line with what has actually been live and in use
-- throughout Stage 4. It changes nothing live and introduces no new
-- behaviour; it is a retroactive record of the original create
-- statements, reconstructed from the live schema.
--
-- This file is NOT applied to the live project by writing it — these
-- objects already exist there. If it is ever run against that
-- project it will fail with "already exists" errors, which is
-- expected and harmless (not data-destructive).
--
-- ORDERING: this file is numbered 0006 (before
-- 0007_stage4_hair_density.sql, which ALTERs client_profile_details
-- and depends on it existing) so that 0001-0007 replay cleanly in
-- order against a genuinely empty database. It was originally written
-- and numbered 0007, applied against the live project after
-- 0005/0006 — but since all three tables it documents were already
-- live and unaffected by 0005 or the original 0006, renumbering it to
-- run first here has no effect on the already-live database (see
-- above); it only corrects replay order for a fresh one.
-- ============================================================

-- ------------------------------------------------------------
-- 1. client_profile_details — standard Client Details fields shown
--    on the barber Client Profile Card (Stage 4). Same
--    barber-must-be-linked-via-barber_client_links pattern already
--    used by client_addresses (Stage 3 addendum).
-- ------------------------------------------------------------
create table public.client_profile_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  hair_type text,
  hair_colour text,
  scalp_condition text,
  skin_sensitivity text,
  allergies text,
  emergency_contact text,
  updated_at timestamptz not null default now(),
  hair_density text
);

alter table public.client_profile_details enable row level security;

create policy "client_profile_details: client reads own"
  on public.client_profile_details
  for select
  using (auth.uid() = profile_id);

create policy "client_profile_details: client creates own"
  on public.client_profile_details
  for insert
  with check (auth.uid() = profile_id);

create policy "client_profile_details: client updates own"
  on public.client_profile_details
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "client_profile_details: linked barber reads"
  on public.client_profile_details
  for select
  using (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_profile_details.profile_id
    )
  );

create policy "client_profile_details: linked barber creates"
  on public.client_profile_details
  for insert
  with check (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_profile_details.profile_id
    )
  );

create policy "client_profile_details: linked barber updates"
  on public.client_profile_details
  for update
  using (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_profile_details.profile_id
    )
  )
  with check (
    public.has_role('barber')
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_profile_details.profile_id
    )
  );

create policy "client_profile_details: owner_admin read"
  on public.client_profile_details
  for select
  using (public.has_role('owner_admin'));

-- ------------------------------------------------------------
-- 2. custom_field_definitions / custom_field_values — per-barber
--    custom intake fields (Stage 4), and this client's value for
--    each. A field definition belongs to exactly one barber; a value
--    is readable/writable by a barber only for a field they own AND
--    a client they are linked to via barber_client_links (both
--    conditions checked together in every policy below).
-- ------------------------------------------------------------
create type public.custom_field_type as enum (
  'text',
  'number',
  'boolean',
  'single_select',
  'multi_select',
  'date'
);

create table public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  field_type public.custom_field_type not null,
  options jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.custom_field_definitions enable row level security;

create policy "custom_field_definitions: barber reads own"
  on public.custom_field_definitions
  for select
  using (public.has_role('barber') and barber_profile_id = auth.uid());

create policy "custom_field_definitions: barber creates own"
  on public.custom_field_definitions
  for insert
  with check (public.has_role('barber') and barber_profile_id = auth.uid());

create policy "custom_field_definitions: barber updates own"
  on public.custom_field_definitions
  for update
  using (public.has_role('barber') and barber_profile_id = auth.uid())
  with check (public.has_role('barber') and barber_profile_id = auth.uid());

create policy "custom_field_definitions: owner_admin read"
  on public.custom_field_definitions
  for select
  using (public.has_role('owner_admin'));

create table public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.custom_field_definitions(id) on delete cascade,
  client_profile_id uuid not null references public.profiles(id) on delete cascade,
  value jsonb,
  updated_at timestamptz not null default now(),
  unique (field_id, client_profile_id)
);

alter table public.custom_field_values enable row level security;

create policy "custom_field_values: owning barber reads"
  on public.custom_field_values
  for select
  using (
    public.has_role('barber')
    and exists (
      select 1
      from public.custom_field_definitions d
      join public.barber_client_links l on l.client_profile_id = custom_field_values.client_profile_id
      where d.id = custom_field_values.field_id
        and d.barber_profile_id = auth.uid()
        and l.barber_profile_id = auth.uid()
    )
  );

create policy "custom_field_values: owning barber writes"
  on public.custom_field_values
  for insert
  with check (
    public.has_role('barber')
    and exists (
      select 1
      from public.custom_field_definitions d
      join public.barber_client_links l on l.client_profile_id = custom_field_values.client_profile_id
      where d.id = custom_field_values.field_id
        and d.barber_profile_id = auth.uid()
        and l.barber_profile_id = auth.uid()
    )
  );

create policy "custom_field_values: owning barber updates"
  on public.custom_field_values
  for update
  using (
    public.has_role('barber')
    and exists (
      select 1
      from public.custom_field_definitions d
      join public.barber_client_links l on l.client_profile_id = custom_field_values.client_profile_id
      where d.id = custom_field_values.field_id
        and d.barber_profile_id = auth.uid()
        and l.barber_profile_id = auth.uid()
    )
  )
  with check (
    public.has_role('barber')
    and exists (
      select 1
      from public.custom_field_definitions d
      join public.barber_client_links l on l.client_profile_id = custom_field_values.client_profile_id
      where d.id = custom_field_values.field_id
        and d.barber_profile_id = auth.uid()
        and l.barber_profile_id = auth.uid()
    )
  );

create policy "custom_field_values: owner_admin read"
  on public.custom_field_values
  for select
  using (public.has_role('owner_admin'));
