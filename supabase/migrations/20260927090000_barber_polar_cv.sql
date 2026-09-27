-- POLAR CV (Professional Profile / POLAR CV page). Additive only: the
-- existing barber_professional_details row, its four values and the
-- get_barber_display_info() client pathway are unchanged.
--
-- All CV data is barber-only in V1: each barber can read/insert/update/
-- delete only their own rows. There is no client or anon access.

-- Additional Information: one optional free-text field on the barber's
-- existing professional row (inherits that table's own-row RLS).
alter table public.barber_professional_details
  add column if not exists additional_info text;

-- Work Experience (repeatable). to_year null = Present.
create table if not exists public.barber_work_experience (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  workplace text not null,
  position text,
  from_year smallint check (from_year between 1950 and 2100),
  to_year smallint check (to_year between 1950 and 2100),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (to_year is null or from_year is null or to_year >= from_year)
);

-- Qualifications & Certifications (repeatable). No uploads in V1.
create table if not exists public.barber_qualifications (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  provider text,
  year smallint check (year between 1950 and 2100),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Achievements & Competitions (repeatable).
create table if not exists public.barber_achievements (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  result text,
  year smallint check (year between 1950 and 2100),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['barber_work_experience', 'barber_qualifications', 'barber_achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create index if not exists %I on public.%I (barber_profile_id, display_order)', t || '_barber_idx', t);
    execute format($p$create policy "%s: barber reads own" on public.%I for select
      using (public.has_role('barber'::polar_role) and barber_profile_id = auth.uid())$p$, t, t);
    execute format($p$create policy "%s: barber creates own" on public.%I for insert
      with check (public.has_role('barber'::polar_role) and barber_profile_id = auth.uid())$p$, t, t);
    execute format($p$create policy "%s: barber updates own" on public.%I for update
      using (public.has_role('barber'::polar_role) and barber_profile_id = auth.uid())
      with check (public.has_role('barber'::polar_role) and barber_profile_id = auth.uid())$p$, t, t);
    execute format($p$create policy "%s: barber deletes own" on public.%I for delete
      using (public.has_role('barber'::polar_role) and barber_profile_id = auth.uid())$p$, t, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
