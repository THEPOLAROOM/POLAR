-- Workflow Mode Phase 1 — client records for the barber's working view.
-- Additive only: no existing table, column, policy or data is altered or
-- removed.
--
-- 1. client_profile_details.hair_texture
--    Hair texture lives with the other hair fields (hair_type,
--    hair_density, ...). Same row, same existing RLS: the client can read
--    their own, a linked barber can read/write.
--
-- 2. barber_client_records — the barber's PRIVATE record about a client
--    (Key Notes + the barber-uploaded client photo path). Keyed by
--    (barber, client): one barber's notes/photo are never another
--    barber's. Readable/writable only by that barber, and only while
--    they are linked to the client. There is deliberately NO client
--    policy: clients can never read this table.
--
-- 3. Storage bucket client-photos — PRIVATE (public = false). Objects are
--    stored at {barber_id}/{client_id}/{file}; only the owning barber,
--    while linked to that client, can read/write/delete. Images are
--    served to the barber via short-lived signed URLs, never public URLs.
--
-- Barber Insights reuse the existing custom_field_definitions /
-- custom_field_values tables (field_type 'single_select', options in
-- the existing options jsonb column), which are already barber-owned
-- and barber-only under their existing RLS — no schema change needed.

-- 1 -------------------------------------------------------------------
alter table public.client_profile_details
  add column if not exists hair_texture text;

-- 2 -------------------------------------------------------------------
create table if not exists public.barber_client_records (
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_profile_id uuid not null references public.profiles(id) on delete cascade,
  key_notes text,
  photo_path text,
  updated_at timestamptz not null default now(),
  primary key (barber_profile_id, client_profile_id)
);

alter table public.barber_client_records enable row level security;

create policy "barber_client_records: barber reads own linked"
  on public.barber_client_records for select
  using (
    public.has_role('barber'::polar_role)
    and barber_profile_id = auth.uid()
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = barber_client_records.client_profile_id
    )
  );

create policy "barber_client_records: barber creates own linked"
  on public.barber_client_records for insert
  with check (
    public.has_role('barber'::polar_role)
    and barber_profile_id = auth.uid()
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = barber_client_records.client_profile_id
    )
  );

create policy "barber_client_records: barber updates own linked"
  on public.barber_client_records for update
  using (
    public.has_role('barber'::polar_role)
    and barber_profile_id = auth.uid()
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = barber_client_records.client_profile_id
    )
  )
  with check (
    public.has_role('barber'::polar_role)
    and barber_profile_id = auth.uid()
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = barber_client_records.client_profile_id
    )
  );

revoke all on public.barber_client_records from anon;

-- 3 -------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-photos', 'client-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "client_photos storage: barber reads own linked"
  on storage.objects for select
  using (
    bucket_id = 'client-photos'
    and public.has_role('barber'::polar_role)
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id::text = (storage.foldername(name))[2]
    )
  );

create policy "client_photos storage: barber uploads own linked"
  on storage.objects for insert
  with check (
    bucket_id = 'client-photos'
    and public.has_role('barber'::polar_role)
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id::text = (storage.foldername(name))[2]
    )
  );

create policy "client_photos storage: barber deletes own"
  on storage.objects for delete
  using (
    bucket_id = 'client-photos'
    and public.has_role('barber'::polar_role)
    and (storage.foldername(name))[1] = auth.uid()::text
  );
