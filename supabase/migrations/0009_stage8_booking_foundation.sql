-- ============================================================
-- POLAR V1 — Stage 8: Booking & Calendar (database foundation)
-- ============================================================
-- Scope: barber-defined weekly availability, one-off + weekly
-- recurring client bookings, reschedule/cancel, and the two Stage 8
-- privacy requirements flagged since Stage 3 (anonymous "BOOKED" to
-- other clients, confirmed-booking-only work-address access). Cash
-- only — no payment/price/deposit columns anywhere in this file.
--
-- Design approved across multiple review rounds; see conversation
-- history for the two correctness fixes folded in here:
--   1. Reschedule re-validates against the EXISTING booking's own
--      barber_profile_id, never a caller-supplied one.
--   2. Clients have no direct UPDATE privilege on bookings at all —
--      reschedule and cancel are separate SECURITY DEFINER functions,
--      so a cancelled booking can never be reactivated by a raw write.
-- ============================================================

-- ------------------------------------------------------------
-- 1. barber_availability — the barber's recurring weekly bookable
--    template (day_of_week + time range). Carries no client PII, so
--    it's readable by any authenticated client (not just linked
--    ones) — Stage 8 explicitly does not require a pre-existing
--    barber_client_links row to view availability or book.
-- ------------------------------------------------------------
create extension if not exists btree_gist;

create table public.barber_availability (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sunday..6=Saturday
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.barber_availability enable row level security;

-- Database-safe overlap prevention (not UI-only): two ACTIVE slots
-- for the same barber/weekday can never have overlapping time ranges.
-- The anchor date is arbitrary — only used to compare `time` values
-- as a range, since Postgres has no native "time range" type.
alter table public.barber_availability
  add constraint barber_availability_no_overlap
  exclude using gist (
    barber_profile_id with =,
    day_of_week with =,
    tsrange(
      ('2000-01-01'::date + start_time)::timestamp,
      ('2000-01-01'::date + end_time)::timestamp
    ) with &&
  )
  where (is_active);

create policy "barber_availability: barber manages own"
  on public.barber_availability
  for all
  using (public.has_role('barber') and barber_profile_id = auth.uid())
  with check (public.has_role('barber') and barber_profile_id = auth.uid());

create policy "barber_availability: any client reads active"
  on public.barber_availability
  for select
  using (is_active and public.has_role('client'));

create policy "barber_availability: owner_admin read"
  on public.barber_availability
  for select
  using (public.has_role('owner_admin'));

-- ------------------------------------------------------------
-- 2. bookings — one row per one-off booking OR weekly recurring
--    series (not materialized per-occurrence). Reschedule updates the
--    row's date/time; cancel is a one-way status flip. Deliberately
--    NO insert/update/delete policy for any role — every write goes
--    exclusively through create_or_reschedule_booking() and
--    cancel_booking() below (same pattern as barber_client_links).
-- ------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_profile_id uuid not null references public.profiles(id) on delete cascade,
  recurrence text not null check (recurrence in ('one_off', 'weekly')),
  start_date date not null,
  end_date date,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (recurrence <> 'one_off' or end_date is null),
  check (recurrence <> 'weekly' or end_date is null or end_date >= start_date)
);

alter table public.bookings enable row level security;

create policy "bookings: client reads own"
  on public.bookings
  for select
  using (auth.uid() = client_profile_id);

create policy "bookings: barber reads own"
  on public.bookings
  for select
  using (auth.uid() = barber_profile_id and public.has_role('barber'));

create policy "bookings: owner_admin read"
  on public.bookings
  for select
  using (public.has_role('owner_admin'));

-- ------------------------------------------------------------
-- 3. create_or_reschedule_booking — the sole create/reschedule write
--    path. SECURITY DEFINER so it can bypass RLS to perform its own
--    checks; auth.uid() is always the caller, never accepted as a
--    parameter, matching has_role()/link_client_by_email(). Per-barber
--    advisory transaction lock serializes concurrent attempts so the
--    conflict check below cannot be raced — this is the actual
--    database-safe guarantee, not just an application-layer check.
-- ------------------------------------------------------------
create or replace function public.create_or_reschedule_booking(
  p_booking_id uuid,            -- null = new booking; else the booking being rescheduled
  p_barber_profile_id uuid,
  p_recurrence text,            -- 'one_off' | 'weekly'
  p_start_date date,
  p_end_date date,              -- weekly only, nullable (open-ended)
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_id uuid := auth.uid();
  v_existing_barber_id uuid;
  v_id uuid;
begin
  if not public.has_role('client') then
    raise exception 'Not authorized';
  end if;

  -- Basic input validity (belt-and-braces alongside the table CHECK
  -- constraints above, which enforce the same rules independently of
  -- this function).
  if p_recurrence not in ('one_off', 'weekly') then
    raise exception 'recurrence must be one_off or weekly';
  end if;
  if p_recurrence = 'one_off' and p_end_date is not null then
    raise exception 'one_off bookings must not have an end_date';
  end if;
  if p_recurrence = 'weekly' and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'end_date cannot precede start_date';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'end_time must be after start_time';
  end if;

  -- Fix 1: on reschedule, the EXISTING booking's own barber_profile_id
  -- is authoritative — never the caller-supplied p_barber_profile_id.
  -- Also excludes an already-cancelled booking up front.
  if p_booking_id is not null then
    select barber_profile_id into v_existing_barber_id
    from public.bookings
    where id = p_booking_id
      and client_profile_id = v_client_id
      and status = 'confirmed';

    if v_existing_barber_id is null then
      raise exception 'Booking not found, not yours, or not active';
    end if;

    if v_existing_barber_id <> p_barber_profile_id then
      raise exception 'Cannot reschedule to a different barber';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_barber_profile_id::text)::bigint);

  if not exists (
    select 1 from public.barber_availability a
    where a.barber_profile_id = p_barber_profile_id
      and a.is_active
      and a.day_of_week = extract(dow from p_start_date)::smallint
      and a.start_time = p_start_time
      and a.end_time = p_end_time
  ) then
    raise exception 'Not a valid availability slot';
  end if;

  -- Four-case conflict check, proper time overlap (not start_time
  -- equality), date-equality (not weekday-equality) for one_off vs
  -- one_off.
  if exists (
    select 1 from public.bookings b
    where b.barber_profile_id = p_barber_profile_id
      and b.status = 'confirmed'
      and (p_booking_id is null or b.id <> p_booking_id)
      and b.start_time < p_end_time
      and b.end_time   > p_start_time
      and (
        (b.recurrence = 'one_off' and p_recurrence = 'one_off'
          and b.start_date = p_start_date)
        or (b.recurrence = 'one_off' and p_recurrence = 'weekly'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and b.start_date >= p_start_date
          and (p_end_date is null or b.start_date <= p_end_date))
        or (b.recurrence = 'weekly' and p_recurrence = 'one_off'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and p_start_date >= b.start_date
          and (b.end_date is null or p_start_date <= b.end_date))
        or (b.recurrence = 'weekly' and p_recurrence = 'weekly'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and b.start_date <= coalesce(p_end_date, 'infinity'::date)
          and coalesce(b.end_date, 'infinity'::date) >= p_start_date)
      )
  ) then
    raise exception 'Slot already booked';
  end if;

  if p_booking_id is null then
    insert into public.bookings (
      barber_profile_id, client_profile_id, recurrence,
      start_date, end_date, start_time, end_time, status
    )
    values (
      p_barber_profile_id, v_client_id, p_recurrence,
      p_start_date, p_end_date, p_start_time, p_end_time, 'confirmed'
    )
    returning id into v_id;
  else
    update public.bookings
    set recurrence = p_recurrence,
        start_date = p_start_date,
        end_date = p_end_date,
        start_time = p_start_time,
        end_time = p_end_time,
        updated_at = now()
    where id = p_booking_id
      and client_profile_id = v_client_id
      and status = 'confirmed'   -- final guard: catches a concurrent cancel_booking() mid-flight
    returning id into v_id;

    if v_id is null then
      raise exception 'Booking not found, not yours, or not active';
    end if;
  end if;

  -- First successful confirmed booking establishes the relationship —
  -- no pre-existing barber_client_links row is required beforehand.
  insert into public.barber_client_links (barber_profile_id, client_profile_id)
  values (p_barber_profile_id, v_client_id)
  on conflict do nothing;

  return v_id;
end;
$$;

revoke all on function public.create_or_reschedule_booking(uuid, uuid, text, date, date, time, time) from public;
grant execute on function public.create_or_reschedule_booking(uuid, uuid, text, date, date, time, time) to authenticated;
revoke execute on function public.create_or_reschedule_booking(uuid, uuid, text, date, date, time, time) from anon;

-- ------------------------------------------------------------
-- 4. cancel_booking — the sole cancellation path. One-way
--    confirmed -> cancelled transition only; cannot restore a
--    cancelled booking (which is exactly what a direct client UPDATE
--    grant would have allowed, bypassing the conflict lock above).
-- ------------------------------------------------------------
create or replace function public.cancel_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id
    and client_profile_id = auth.uid()
    and status = 'confirmed'
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;
revoke execute on function public.cancel_booking(uuid) from anon;

-- ------------------------------------------------------------
-- 5. get_barber_booked_slots — satisfies "other clients see only
--    BOOKED": returns occupied date/time ranges only, never
--    client_profile_id or status detail. No link required to call.
--    Expands weekly rows via generate_series (stepping 7 days from
--    start_date); one_off rows are returned directly.
-- ------------------------------------------------------------
create or replace function public.get_barber_booked_slots(
  target_barber_id uuid,
  from_date date,
  to_date date
)
returns table (booked_date date, start_time time, end_time time)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.start_date as booked_date, b.start_time, b.end_time
  from public.bookings b
  where b.barber_profile_id = target_barber_id
    and b.status = 'confirmed'
    and b.recurrence = 'one_off'
    and b.start_date between from_date and to_date
    and (public.has_role('client') or target_barber_id = auth.uid() or public.has_role('owner_admin'))

  union all

  select gs::date as booked_date, b.start_time, b.end_time
  from public.bookings b,
       lateral generate_series(
         b.start_date::timestamp,
         least(coalesce(b.end_date, to_date), to_date)::timestamp,
         interval '7 days'
       ) as gs
  where b.barber_profile_id = target_barber_id
    and b.status = 'confirmed'
    and b.recurrence = 'weekly'
    and gs::date between from_date and to_date
    and (public.has_role('client') or target_barber_id = auth.uid() or public.has_role('owner_admin'))
$$;

revoke all on function public.get_barber_booked_slots(uuid, date, date) from public;
grant execute on function public.get_barber_booked_slots(uuid, date, date) to authenticated;
revoke execute on function public.get_barber_booked_slots(uuid, date, date) from anon;

-- ------------------------------------------------------------
-- 6. get_barber_work_address — satisfies the Stage 8 TODO left in
--    0004_stage3_addresses.sql: a client with a CONFIRMED booking may
--    read only the barber's work_* columns, never home_*.
--
--    IMPORTANT: per the published Privacy Policy text ("A barber's
--    Personal/Home Address is always private and is never shown to
--    clients, even if it is also used as the barber's Work/Commercial
--    Address"), this returns NOTHING when work_same_as_home is true —
--    it does not fall back to exposing the home_* columns in that
--    case. It only ever returns the dedicated work_* columns, and
--    only when they are genuinely separate from the home address.
-- ------------------------------------------------------------
create or replace function public.get_barber_work_address(target_barber_id uuid)
returns table (
  work_address_line_1 text,
  work_address_line_2 text,
  work_town_city text,
  work_county_region text,
  work_postcode text,
  work_country text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    a.work_address_line_1,
    a.work_address_line_2,
    a.work_town_city,
    a.work_county_region,
    a.work_postcode,
    a.work_country
  from public.barber_addresses a
  where a.profile_id = target_barber_id
    and a.work_same_as_home = false
    and exists (
      select 1 from public.bookings b
      where b.barber_profile_id = target_barber_id
        and b.client_profile_id = auth.uid()
        and b.status = 'confirmed'
    )
$$;

revoke all on function public.get_barber_work_address(uuid) from public;
grant execute on function public.get_barber_work_address(uuid) to authenticated;
revoke execute on function public.get_barber_work_address(uuid) from anon;
