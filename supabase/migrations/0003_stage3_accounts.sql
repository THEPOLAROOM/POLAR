-- ============================================================
-- POLAR V1 — Stage 3: Account & Authentication Foundation
-- ============================================================
-- Scope: Client/Barber sign-up data, email-verification-safe
-- Terms/Privacy/Age-declaration audit trail, and integration with
-- Stage 2's role system. Does NOT grant any role — Stage 2's
-- handle_new_user() trigger is untouched and remains the only writer
-- of public.user_roles.
--
-- Continues the secure-by-default rule: RLS enabled in the same
-- migration that creates each table, no access unless a policy
-- deliberately grants it.
-- ============================================================

-- ------------------------------------------------------------
-- 1. legal_documents — canonical "what version is currently in
--    force" registry (Section 14 #2, #17). Publicly readable
--    (Section 14 requires users can read Terms before agreeing),
--    never writable by the app — only by a future migration.
-- ------------------------------------------------------------
create table public.legal_documents (
  document_type text primary key
    check (document_type in ('terms', 'privacy', 'age_declaration')),
  current_version text not null,
  published_at timestamptz not null default now()
);

alter table public.legal_documents enable row level security;

create policy "legal_documents: public read"
  on public.legal_documents
  for select
  using (true);
-- Deliberately no insert/update/delete policy. A new version is
-- published only by a future migration run with elevated access.

-- Seed the V1 Private Trial Draft versions. Keep this string in sync
-- with src/lib/legal/versions.ts and the /legal/terms, /legal/privacy
-- pages — see STAGE3_TESTING.md for why and how to check this.
insert into public.legal_documents (document_type, current_version) values
  ('terms', 'v1-trial-draft-2026-08-26'),
  ('privacy', 'v1-trial-draft-2026-08-26'),
  ('age_declaration', 'v1-2026-08-26');

-- ------------------------------------------------------------
-- 2. profiles — Section 02 / 03 shared Personal Details only
--    (Full Name, Phone). Email lives on auth.users already; password
--    is never stored by POLAR at all (Section 16.1 — Supabase Auth
--    handles hashing).
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
-- No insert policy — rows are created only by the trigger below.

-- ------------------------------------------------------------
-- 3. barber_professional_details — exactly the four Section 02
--    Professional Details fields. Existing here implies nothing
--    about role/privilege — it's submitted intake data only.
-- ------------------------------------------------------------
create table public.barber_professional_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  barber_name text,
  business_name text,
  years_experience int,
  work_location text
);

alter table public.barber_professional_details enable row level security;

create policy "barber_details: read own"
  on public.barber_professional_details
  for select
  using (auth.uid() = profile_id);

create policy "barber_details: update own"
  on public.barber_professional_details
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
-- No insert policy — rows are created only by the trigger below.

-- ------------------------------------------------------------
-- 4. terms_acceptances — immutable audit log (Section 14 #2, #17).
--    Extended to also record the 16+ age declaration using the same
--    tamper-proof mechanism, rather than inventing a separate table.
--    No insert/update/delete policy at all: the security-definer
--    trigger below is the ONLY writer. There is no client-facing
--    write path to this table whatsoever.
-- ------------------------------------------------------------
create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null
    check (document_type in ('terms', 'privacy', 'age_declaration')),
  version text not null,
  accepted_at timestamptz not null default now()
);

alter table public.terms_acceptances enable row level security;

create policy "terms_acceptances: read own"
  on public.terms_acceptances
  for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. handle_new_user_profile() — a SEPARATE trigger from Stage 2's
--    handle_new_user(). Stage 2 is closed and untouched: it still
--    independently grants role='client' and nothing else. This
--    trigger only ever writes profiles / barber_professional_details
--    / terms_acceptances — it has NO write access to user_roles and
--    physically cannot grant a role.
--
--    Fires at auth.users insert time, so it runs regardless of
--    whether email confirmation is enabled — no session is needed.
--
--    Client-supplied claims — terms_version/privacy_version/
--    age_declaration_version AND the separate explicit affirmative
--    claims terms_accepted/privacy_accepted/age_16_confirmed — are
--    NEVER trusted as fact. Each version claim is compared against
--    legal_documents.current_version, and each affirmative claim must
--    literally be the text 'true' (i.e. the corresponding checkbox
--    was actually ticked client-side before signUp() was called).
--    On any mismatch or missing value in either check, the whole
--    transaction is aborted (including the auth.users row itself),
--    so no account is ever created without both current-version
--    acceptance AND explicit affirmative confirmation.
--    The version actually recorded is always read from
--    legal_documents, never from the client-supplied value.
--    accepted_at is always the database server clock (now()), never
--    client-supplied.
-- ------------------------------------------------------------
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  v_full_name text := meta ->> 'full_name';
  v_phone text := meta ->> 'phone';
  v_terms_claim text := meta ->> 'terms_version';
  v_privacy_claim text := meta ->> 'privacy_version';
  v_age_claim text := meta ->> 'age_declaration_version';
  -- Compared as text, not cast to boolean, so an unexpected/garbled
  -- value fails our own explicit check below with a clear message
  -- instead of raising an opaque Postgres cast error.
  v_terms_affirmed text := meta ->> 'terms_accepted';
  v_privacy_affirmed text := meta ->> 'privacy_accepted';
  v_age_affirmed text := meta ->> 'age_16_confirmed';
  v_barber_name text := meta ->> 'barber_name';
  v_business_name text := meta ->> 'business_name';
  v_years_experience_raw text := meta ->> 'years_experience';
  v_work_location text := meta ->> 'work_location';
  v_terms_current text;
  v_privacy_current text;
  v_age_current text;
begin
  if v_full_name is null or btrim(v_full_name) = '' then
    raise exception 'POLAR signup rejected: full_name is required';
  end if;

  if v_phone is null or btrim(v_phone) = '' then
    raise exception 'POLAR signup rejected: phone is required';
  end if;

  select current_version into v_terms_current
    from public.legal_documents where document_type = 'terms';
  select current_version into v_privacy_current
    from public.legal_documents where document_type = 'privacy';
  select current_version into v_age_current
    from public.legal_documents where document_type = 'age_declaration';

  if v_terms_affirmed is distinct from 'true' then
    raise exception 'POLAR signup rejected: explicit Terms acceptance not confirmed';
  end if;
  if v_terms_claim is null or v_terms_claim <> v_terms_current then
    raise exception 'POLAR signup rejected: Terms acceptance missing or out of date';
  end if;

  if v_privacy_affirmed is distinct from 'true' then
    raise exception 'POLAR signup rejected: explicit Privacy acceptance not confirmed';
  end if;
  if v_privacy_claim is null or v_privacy_claim <> v_privacy_current then
    raise exception 'POLAR signup rejected: Privacy acceptance missing or out of date';
  end if;

  if v_age_affirmed is distinct from 'true' then
    raise exception 'POLAR signup rejected: explicit 16+ age declaration not confirmed';
  end if;
  if v_age_claim is null or v_age_claim <> v_age_current then
    raise exception 'POLAR signup rejected: age 16+ declaration missing or out of date';
  end if;

  insert into public.profiles (id, full_name, phone)
  values (new.id, btrim(v_full_name), btrim(v_phone));

  if v_barber_name is not null
     or v_business_name is not null
     or v_work_location is not null
     or v_years_experience_raw is not null then
    insert into public.barber_professional_details (
      profile_id, barber_name, business_name, years_experience, work_location
    )
    values (
      new.id,
      nullif(btrim(v_barber_name), ''),
      nullif(btrim(v_business_name), ''),
      nullif(v_years_experience_raw, '')::int,
      nullif(btrim(v_work_location), '')
    );
  end if;

  -- Always the canonical, server-verified version — never the
  -- client-supplied claim, even though it has just been confirmed
  -- equal above.
  insert into public.terms_acceptances (user_id, document_type, version)
  values
    (new.id, 'terms', v_terms_current),
    (new.id, 'privacy', v_privacy_current),
    (new.id, 'age_declaration', v_age_current);

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- ------------------------------------------------------------
-- 6. Stage 1 / Stage 2 regression note (manual, not executable SQL):
--    After running this migration, re-confirm:
--      - public._health_check is still unreadable (Stage 1)
--      - public.user_roles still has zero insert/update/delete
--        policies, and new signups still get exactly role='client'
--        via Stage 2's UNCHANGED handle_new_user() trigger (Stage 2)
--    This migration does not modify either of those objects.
-- ------------------------------------------------------------
