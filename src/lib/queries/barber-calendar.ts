import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CalendarBooking = {
  id: string;
  clientProfileId: string | null;
  clientName: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  startTime: string;
  endTime: string;
  isBarter: boolean;
  isBlocked: boolean;
  isBreak: boolean;
  isWalkIn: boolean;
  label: string | null;
  barterNotes: string | null;
};

export type AvailabilityWindow = { startTime: string; endTime: string };

type BookingRow = {
  id: string;
  barber_profile_id: string;
  client_profile_id: string | null;
  service_id: string | null;
  recurrence: "one_off" | "weekly";
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  recurrence_interval_weeks: number;
  is_barter: boolean;
  is_blocked: boolean;
  is_break: boolean;
  walk_in_label: string | null;
  barter_notes: string | null;
};

// Same recurrence-expansion rule as getBarberBookingsForDate
// (src/lib/queries/barber-schedule.ts) — duplicated rather than
// imported since that file is shared with pages outside this task's
// scope (Dashboard, Workflow Mode) and isn't touched here.
function occursOnDate(
  booking: Pick<BookingRow, "recurrence" | "start_date" | "end_date" | "recurrence_interval_weeks">,
  date: string,
  dayOfWeek: number
): boolean {
  if (booking.recurrence === "one_off") {
    return booking.start_date === date;
  }
  const bookingDayOfWeek = new Date(`${booking.start_date}T00:00:00Z`).getUTCDay();
  if (bookingDayOfWeek !== dayOfWeek) return false;
  if (date < booking.start_date) return false;
  if (booking.end_date && date > booking.end_date) return false;
  const intervalDays = (booking.recurrence_interval_weeks || 1) * 7;
  const startMs = Date.parse(`${booking.start_date}T00:00:00Z`);
  const dateMs = Date.parse(`${date}T00:00:00Z`);
  const diffDays = Math.round((dateMs - startMs) / 86400000);
  return diffDays % intervalDays === 0;
}

function dayOfWeekOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

async function fetchAllConfirmedBookings(
  supabase: SupabaseClient,
  barberProfileId: string
): Promise<BookingRow[]> {
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, barber_profile_id, client_profile_id, service_id, recurrence, start_date, end_date, start_time, end_time, recurrence_interval_weeks, is_barter, is_blocked, is_break, walk_in_label, barter_notes"
    )
    .eq("barber_profile_id", barberProfileId)
    .eq("status", "confirmed");

  return (data ?? []) as BookingRow[];
}

async function resolveClientNames(
  supabase: SupabaseClient,
  clientIds: string[]
): Promise<Map<string, string>> {
  if (clientIds.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", clientIds);
  return new Map(((data ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name]));
}

async function resolveServices(
  supabase: SupabaseClient,
  serviceIds: string[]
): Promise<Map<string, { name: string; price: number }>> {
  if (serviceIds.length === 0) return new Map();
  const { data } = await supabase.from("services").select("id, name, price").in("id", serviceIds);
  return new Map(
    ((data ?? []) as { id: string; name: string; price: number }[]).map((s) => [s.id, { name: s.name, price: Number(s.price) }])
  );
}

function toCalendarBooking(
  b: BookingRow,
  nameById: Map<string, string>,
  serviceById: Map<string, { name: string; price: number }>
): CalendarBooking {
  const isWalkIn = !b.client_profile_id && !b.is_barter && !b.is_blocked;
  const service = b.service_id ? serviceById.get(b.service_id) : undefined;
  return {
    id: b.id,
    clientProfileId: b.client_profile_id,
    clientName: b.client_profile_id ? nameById.get(b.client_profile_id) ?? "Unknown client" : null,
    serviceName: service?.name ?? null,
    servicePrice: service?.price ?? null,
    startTime: b.start_time,
    endTime: b.end_time,
    isBarter: b.is_barter,
    isBlocked: b.is_blocked,
    isBreak: b.is_break,
    isWalkIn,
    label: b.walk_in_label,
    barterNotes: b.barter_notes,
  };
}

/**
 * Every real booking (client appointment, walk-in, barter or blocked
 * time) that occurs on `date`, in start-time order — the full detail
 * the Day view's timeline needs. Cancelled bookings are excluded by
 * the `status = 'confirmed'` filter already applied server-side.
 */
export async function getDayBookings(
  supabase: SupabaseClient,
  barberProfileId: string,
  date: string
): Promise<CalendarBooking[]> {
  const dow = dayOfWeekOf(date);
  const all = await fetchAllConfirmedBookings(supabase, barberProfileId);
  const todays = all.filter((b) => occursOnDate(b, date, dow)).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const clientIds = [...new Set(todays.map((b) => b.client_profile_id).filter((id): id is string => Boolean(id)))];
  const serviceIds = [...new Set(todays.map((b) => b.service_id).filter((id): id is string => Boolean(id)))];
  const [nameById, serviceById] = await Promise.all([
    resolveClientNames(supabase, clientIds),
    resolveServices(supabase, serviceIds),
  ]);

  return todays.map((b) => toCalendarBooking(b, nameById, serviceById));
}

/** This barber's active weekly availability windows for `date`'s weekday. */
export async function getAvailabilityForDate(
  supabase: SupabaseClient,
  barberProfileId: string,
  date: string
): Promise<AvailabilityWindow[]> {
  const dow = dayOfWeekOf(date);
  const { data } = await supabase
    .from("barber_availability")
    .select("start_time, end_time")
    .eq("barber_profile_id", barberProfileId)
    .eq("day_of_week", dow)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  return ((data ?? []) as { start_time: string; end_time: string }[]).map((r) => ({
    startTime: r.start_time,
    endTime: r.end_time,
  }));
}

export type DaySummary = { count: number; isFullyBooked: boolean; hasAvailability: boolean };

/**
 * Per-date summary for every real day in [startDate, endDateInclusive]
 * (both "YYYY-MM-DD"), used by Month/Week/Year views. "Fully booked"
 * is a genuine, real-data-only reading — total booked minutes that
 * day (every kind counts: client/walk-in/barter/blocked all occupy
 * real time) versus total available minutes from this barber's own
 * weekly availability template for that weekday. It does not attempt
 * full gap-fitting (e.g. a 10-minute gap too short for any service
 * still counts as "not fully booked") — a deliberately conservative
 * approximation using only real records, never invented data.
 */
export async function getDaySummaries(
  supabase: SupabaseClient,
  barberProfileId: string,
  startDate: string,
  endDateInclusive: string
): Promise<Map<string, DaySummary>> {
  const [allBookings, { data: availabilityRows }] = await Promise.all([
    fetchAllConfirmedBookings(supabase, barberProfileId),
    supabase
      .from("barber_availability")
      .select("day_of_week, start_time, end_time")
      .eq("barber_profile_id", barberProfileId)
      .eq("is_active", true),
  ]);

  const availableMinutesByDow = new Map<number, number>();
  for (const row of (availabilityRows ?? []) as { day_of_week: number; start_time: string; end_time: string }[]) {
    const minutes = timeToMinutes(row.end_time) - timeToMinutes(row.start_time);
    availableMinutesByDow.set(row.day_of_week, (availableMinutesByDow.get(row.day_of_week) ?? 0) + minutes);
  }

  const summaries = new Map<string, DaySummary>();
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDateInclusive}T00:00:00Z`);

  while (cursor.getTime() <= end.getTime()) {
    const date = cursor.toISOString().slice(0, 10);
    const dow = cursor.getUTCDay();
    const dayBookings = allBookings.filter((b) => occursOnDate(b, date, dow));
    const bookedMinutes = dayBookings.reduce(
      (sum, b) => sum + Math.max(0, timeToMinutes(b.end_time) - timeToMinutes(b.start_time)),
      0
    );
    const availableMinutes = availableMinutesByDow.get(dow) ?? 0;
    summaries.set(date, {
      count: dayBookings.length,
      isFullyBooked: availableMinutes > 0 && bookedMinutes >= availableMinutes,
      hasAvailability: availableMinutes > 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return summaries;
}
