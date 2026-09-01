-- ============================================================
-- POLAR V1 — Secure barber-side booking management
-- ============================================================
-- Purpose: let the authenticated barber cancel or reschedule a
-- CONFIRMED booking they own (barber_profile_id = auth.uid()), via
-- two new, independent SECURITY DEFINER functions — not by adding
-- UPDATE/DELETE RLS policies to bookings, and not by modifying
-- create_or_reschedule_booking()/cancel_booking() in any way. Those
-- two existing client-facing functions are completely untouched by
-- this migration; their behavior for a client caller is unchanged.
--
-- NOT applied to the live project — prepared for review only.
--
-- Design notes:
--   - Both functions use auth.uid() for the barber id, never a
--     caller-supplied one — same rule has_role()/the client functions
--     already follow.
--   - reschedule_booking_as_barber() does not accept recurrence,
--     end_date, or client_profile_id as parameters at all, and never
--     writes to those columns — so a barber physically cannot change
--     a booking's recurrence type or hand it to a different client
--     through this function. Only start_date/start_time/end_time
--     change.
--   - The four-case conflict check and the per-barber advisory
--     transaction lock are reproduced here exactly as they exist in
--     create_or_reschedule_booking() (same logic, same lock key) —
--     duplicated rather than shared, so as not to touch or refactor
--     the existing, already-approved client function. The conflict
--     rules themselves are not weakened in any way.
--   - Both functions operate on the whole bookings row — a weekly
--     booking is cancelled/rescheduled as its entire series, since
--     there are no per-occurrence rows to act on individually.
-- ============================================================

create or replace function public.cancel_booking_as_barber(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not public.has_role('barber') then
    raise exception 'Not authorized';
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id
    and barber_profile_id = auth.uid()
    and status = 'confirmed'
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.cancel_booking_as_barber(uuid) from public;
grant execute on function public.cancel_booking_as_barber(uuid) to authenticated;
revoke execute on function public.cancel_booking_as_barber(uuid) from anon;

create or replace function public.reschedule_booking_as_barber(
  p_booking_id uuid,
  p_start_date date,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_barber_id uuid := auth.uid();
  v_existing_client_id uuid;
  v_existing_recurrence text;
  v_existing_end_date date;
  v_id uuid;
begin
  if not public.has_role('barber') then
    raise exception 'Not authorized';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'end_time must be after start_time';
  end if;

  -- The existing booking must belong to THIS barber and still be
  -- confirmed. recurrence/end_date are read here and never accepted
  -- as parameters or written below, so they cannot change; the same
  -- for client_profile_id, which this function never touches at all.
  select client_profile_id, recurrence, end_date
    into v_existing_client_id, v_existing_recurrence, v_existing_end_date
  from public.bookings
  where id = p_booking_id
    and barber_profile_id = v_barber_id
    and status = 'confirmed';

  if v_existing_client_id is null then
    raise exception 'Booking not found, not yours, or not active';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_barber_id::text)::bigint);

  if not exists (
    select 1 from public.barber_availability a
    where a.barber_profile_id = v_barber_id
      and a.is_active
      and a.day_of_week = extract(dow from p_start_date)::smallint
      and a.start_time = p_start_time
      and a.end_time = p_end_time
  ) then
    raise exception 'Not a valid availability slot';
  end if;

  -- Same four-case conflict check as create_or_reschedule_booking(),
  -- using this booking's own (unchangeable) recurrence/end_date.
  if exists (
    select 1 from public.bookings b
    where b.barber_profile_id = v_barber_id
      and b.status = 'confirmed'
      and b.id <> p_booking_id
      and b.start_time < p_end_time
      and b.end_time   > p_start_time
      and (
        (b.recurrence = 'one_off' and v_existing_recurrence = 'one_off'
          and b.start_date = p_start_date)
        or (b.recurrence = 'one_off' and v_existing_recurrence = 'weekly'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and b.start_date >= p_start_date
          and (v_existing_end_date is null or b.start_date <= v_existing_end_date))
        or (b.recurrence = 'weekly' and v_existing_recurrence = 'one_off'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and p_start_date >= b.start_date
          and (b.end_date is null or p_start_date <= b.end_date))
        or (b.recurrence = 'weekly' and v_existing_recurrence = 'weekly'
          and extract(dow from b.start_date) = extract(dow from p_start_date)
          and b.start_date <= coalesce(v_existing_end_date, 'infinity'::date)
          and coalesce(b.end_date, 'infinity'::date) >= p_start_date)
      )
  ) then
    raise exception 'Slot already booked';
  end if;

  update public.bookings
  set start_date = p_start_date,
      start_time = p_start_time,
      end_time = p_end_time,
      updated_at = now()
  where id = p_booking_id
    and barber_profile_id = v_barber_id
    and status = 'confirmed'
  returning id into v_id;

  if v_id is null then
    raise exception 'Booking not found, not yours, or not active';
  end if;

  return v_id;
end;
$$;

revoke all on function public.reschedule_booking_as_barber(uuid, date, time, time) from public;
grant execute on function public.reschedule_booking_as_barber(uuid, date, time, time) to authenticated;
revoke execute on function public.reschedule_booking_as_barber(uuid, date, time, time) from anon;
