-- ============================================================
-- POLAR V1 — Stage 3 addendum: Structured Addresses
-- ============================================================
-- Adds structured, manually-entered addresses (no autocomplete
-- provider, per approved decision) for:
--   - Client address (private)
--   - Barber Personal/Home address (private)
--   - Barber Work/Commercial address (private for now — becomes
--     client-facing only once a booking relationship exists, which
--     is Stage 8. See the barber_addresses policy comment below.)
--
-- Builds on 0003_stage3_accounts.sql: extends the SAME trigger
-- (handle_new_user_profile) via CREATE OR REPLACE rather than adding
-- a third trigger, so address creation stays part of the same atomic,
-- all-or-nothing signup transaction. Stage 2's handle_new_user() is
-- still untouched.
-- ============================================================

-- ------------------------------------------------------------
-- 1. barber_client_links — the authorization primitive for
--    "this specific barber may access this specific client's
--    private information." Deliberately NOT "any barber role has
--    access to any client" — that would be an unrestricted grant
--    that becomes a genuine privacy hole the moment a second barber
--    exists (Barber 2 reading Barber 1's clients). Each row is a
--    specific, auditable grant.
--
--    LONG-TERM RULE THIS TABLE ENFORCES:
--      A barber can see the address of their own clients.
--      A barber cannot see the address of clients who do not
--      belong to them — including once multiple barbers exist.
--
--    TEMPORARY V1 SETUP BEHAVIOUR ONLY: this table has no INSERT
--    policy yet, so for now a link is created manually by you via
--    elevated SQL access, e.g. once Rahim's real barber account and
--    a client account both exist:
--      insert into public.barber_client_links (barber_profile_id, client_profile_id)
--      values ('<Rahim profile id>', '<client profile id>')
--      on conflict do nothing;
--    This manual step is a placeholder standing in for "a client
--    became this barber's client" — a real relationship event that
--    doesn't exist in the database until a later stage. It is NOT
--    intended as normal, ongoing operating practice.
--
--    FUTURE STAGE TODO: once a client/booking-relationship event
--    exists (e.g. Client Directory in Stage 6, or a client's first
--    booking with a barber in Stage 8), that stage should add an
--    INSERT policy or a trigger that creates the link automatically
--    at the moment the relationship is genuinely established —
--    replacing the manual step above, not layering on top of it.
--    The table/policy structure below does not need to change for
--    that — only how rows get created does.
-- ------------------------------------------------------------
create table public.barber_client_links (
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (barber_profile_id, client_profile_id)
);

alter table public.barber_client_links enable row level security;

create policy "barber_client_links: barber reads own links"
  on public.barber_client_links
  for select
  using (auth.uid() = barber_profile_id);

create policy "barber_client_links: owner_admin read"
  on public.barber_client_links
  for select
  using (public.has_role('owner_admin'));
-- No insert/update/delete policy for any role — links are created
-- only via elevated access (you), never by the app. This is what
-- keeps this from ever becoming self-service barber-to-client access.

-- ------------------------------------------------------------
-- 2. client_addresses — private to the client, to a barber
--    explicitly linked to that client via barber_client_links, and
--    to owner_admin. Designer/Developer gets nothing here — no
--    policy references that role, so it has no path to this data.
-- ------------------------------------------------------------
create table public.client_addresses (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  town_city text not null,
  county_region text,
  postcode text not null,
  country text not null
);

alter table public.client_addresses enable row level security;

create policy "client_addresses: read own"
  on public.client_addresses
  for select
  using (auth.uid() = profile_id);

create policy "client_addresses: update own"
  on public.client_addresses
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "client_addresses: owner_admin read"
  on public.client_addresses
  for select
  using (public.has_role('owner_admin'));

create policy "client_addresses: authorised barber read"
  on public.client_addresses
  for select
  using (
    public.has_role('barber')
    and exists (
      select 1
      from public.barber_client_links l
      where l.barber_profile_id = auth.uid()
        and l.client_profile_id = client_addresses.profile_id
    )
  );
-- Deliberately checks BOTH: the account must currently hold the
-- barber role AND have an explicit link to this specific client.
-- Losing the barber role (or the link being removed) immediately
-- removes access — there is no residual grant either way.
-- No insert policy — created only by the trigger below.
-- No client-to-client visibility exists or is possible: there is no
-- policy of any kind granting one client read access to another's row.

-- ------------------------------------------------------------
-- 2. barber_addresses — Personal/Home (always private) and
--    Work/Commercial (private for V1, becomes client-facing in
--    Stage 8) held as two logical addresses on one row per barber.
-- ------------------------------------------------------------
create table public.barber_addresses (
  profile_id uuid primary key references public.profiles(id) on delete cascade,

  home_address_line_1 text not null,
  home_address_line_2 text,
  home_town_city text not null,
  home_county_region text,
  home_postcode text not null,
  home_country text not null,

  work_same_as_home boolean not null default false,
  work_address_line_1 text,
  work_address_line_2 text,
  work_town_city text,
  work_county_region text,
  work_postcode text,
  work_country text,

  constraint work_address_required_unless_same_as_home check (
    work_same_as_home = true
    or (
      work_address_line_1 is not null
      and work_town_city is not null
      and work_postcode is not null
      and work_country is not null
    )
  )
);

alter table public.barber_addresses enable row level security;

create policy "barber_addresses: read own"
  on public.barber_addresses
  for select
  using (auth.uid() = profile_id);

create policy "barber_addresses: update own"
  on public.barber_addresses
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "barber_addresses: owner_admin read"
  on public.barber_addresses
  for select
  using (public.has_role('owner_admin'));

-- Deliberately NO client-facing read policy yet.
--
-- The approved rule is: "Work/Commercial Address... can therefore be
-- provided to appropriate clients for their appointments" — but
-- "appropriate" means a client with a confirmed booking with this
-- barber, and no booking relationship exists in the database until
-- Stage 8. Until then this table is fully private to the barber and
-- owner_admin only, which is the safe, correct default — not a gap.
--
-- STAGE 8 TODO: add a policy here scoped to a confirmed booking
-- relationship, exposing ONLY the work_* columns (never home_*) to
-- the specific client who holds a live booking with this barber.
-- No insert policy — created only by the trigger below.

-- ------------------------------------------------------------
-- 3. Extend the Stage 3 signup trigger to also require and record
--    the appropriate address for each account type. CREATE OR
--    REPLACE on the SAME function — no new trigger, no change to
--    the trigger attachment itself.
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
  v_role_intent text := meta ->> 'role_intent';

  v_terms_claim text := meta ->> 'terms_version';
  v_privacy_claim text := meta ->> 'privacy_version';
  v_age_claim text := meta ->> 'age_declaration_version';
  v_terms_affirmed text := meta ->> 'terms_accepted';
  v_privacy_affirmed text := meta ->> 'privacy_accepted';
  v_age_affirmed text := meta ->> 'age_16_confirmed';
  v_terms_current text;
  v_privacy_current text;
  v_age_current text;

  v_barber_name text := meta ->> 'barber_name';
  v_business_name text := meta ->> 'business_name';
  v_years_experience_raw text := meta ->> 'years_experience';
  v_work_location text := meta ->> 'work_location';

  -- Client address claims
  v_client_line1 text := meta ->> 'client_address_line_1';
  v_client_line2 text := meta ->> 'client_address_line_2';
  v_client_town text := meta ->> 'client_town_city';
  v_client_county text := meta ->> 'client_county_region';
  v_client_postcode text := meta ->> 'client_postcode';
  v_client_country text := meta ->> 'client_country';

  -- Barber home/work address claims
  v_home_line1 text := meta ->> 'barber_home_address_line_1';
  v_home_line2 text := meta ->> 'barber_home_address_line_2';
  v_home_town text := meta ->> 'barber_home_town_city';
  v_home_county text := meta ->> 'barber_home_county_region';
  v_home_postcode text := meta ->> 'barber_home_postcode';
  v_home_country text := meta ->> 'barber_home_country';
  v_work_same_as_home text := meta ->> 'barber_work_same_as_home';
  v_work_line1 text := meta ->> 'barber_work_address_line_1';
  v_work_line2 text := meta ->> 'barber_work_address_line_2';
  v_work_town text := meta ->> 'barber_work_town_city';
  v_work_county text := meta ->> 'barber_work_county_region';
  v_work_postcode text := meta ->> 'barber_work_postcode';
  v_work_country text := meta ->> 'barber_work_country';
  v_is_barber_signup boolean;
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

  v_is_barber_signup := (v_role_intent = 'barber');

  if v_is_barber_signup then
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

    -- Barber Personal/Home Address — required.
    if v_home_line1 is null or btrim(v_home_line1) = ''
       or v_home_town is null or btrim(v_home_town) = ''
       or v_home_postcode is null or btrim(v_home_postcode) = ''
       or v_home_country is null or btrim(v_home_country) = '' then
      raise exception 'POLAR signup rejected: Barber Personal/Home Address is required';
    end if;

    -- Work Address — required in full UNLESS explicitly marked same
    -- as home.
    if v_work_same_as_home is distinct from 'true' then
      if v_work_line1 is null or btrim(v_work_line1) = ''
         or v_work_town is null or btrim(v_work_town) = ''
         or v_work_postcode is null or btrim(v_work_postcode) = ''
         or v_work_country is null or btrim(v_work_country) = '' then
        raise exception 'POLAR signup rejected: Work/Commercial Address is required unless it is the same as the Home Address';
      end if;
    end if;

    insert into public.barber_addresses (
      profile_id,
      home_address_line_1, home_address_line_2, home_town_city,
      home_county_region, home_postcode, home_country,
      work_same_as_home,
      work_address_line_1, work_address_line_2, work_town_city,
      work_county_region, work_postcode, work_country
    )
    values (
      new.id,
      btrim(v_home_line1), nullif(btrim(v_home_line2), ''), btrim(v_home_town),
      nullif(btrim(v_home_county), ''), btrim(v_home_postcode), btrim(v_home_country),
      (v_work_same_as_home = 'true'),
      case when v_work_same_as_home = 'true' then null else btrim(v_work_line1) end,
      case when v_work_same_as_home = 'true' then null else nullif(btrim(v_work_line2), '') end,
      case when v_work_same_as_home = 'true' then null else btrim(v_work_town) end,
      case when v_work_same_as_home = 'true' then null else nullif(btrim(v_work_county), '') end,
      case when v_work_same_as_home = 'true' then null else btrim(v_work_postcode) end,
      case when v_work_same_as_home = 'true' then null else btrim(v_work_country) end
    );
  else
    -- Client Address — required.
    if v_client_line1 is null or btrim(v_client_line1) = ''
       or v_client_town is null or btrim(v_client_town) = ''
       or v_client_postcode is null or btrim(v_client_postcode) = ''
       or v_client_country is null or btrim(v_client_country) = '' then
      raise exception 'POLAR signup rejected: address is required';
    end if;

    insert into public.client_addresses (
      profile_id, address_line_1, address_line_2, town_city,
      county_region, postcode, country
    )
    values (
      new.id,
      btrim(v_client_line1), nullif(btrim(v_client_line2), ''), btrim(v_client_town),
      nullif(btrim(v_client_county), ''), btrim(v_client_postcode), btrim(v_client_country)
    );
  end if;

  insert into public.terms_acceptances (user_id, document_type, version)
  values
    (new.id, 'terms', v_terms_current),
    (new.id, 'privacy', v_privacy_current),
    (new.id, 'age_declaration', v_age_current);

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 4. Regression note (manual, not executable SQL): re-confirm
--    _health_check (Stage 1) and user_roles' zero write-policies
--    (Stage 2) are unaffected — this migration only extends the
--    Stage 3 trigger body and adds three new, self-contained tables
--    (barber_client_links, client_addresses, barber_addresses).
--    Also confirm Client A still cannot read Client B's address
--    under any circumstance, and that an unlinked barber account
--    cannot read any client's address despite holding the role.
-- ------------------------------------------------------------
