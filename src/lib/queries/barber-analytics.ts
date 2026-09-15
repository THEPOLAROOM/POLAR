import type { createClient } from "@/lib/supabase/server";
import { getShopToday, getShopTimeNow } from "@/lib/dates";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type Period = "day" | "week" | "month" | "year";

type BookingRow = {
  id: string;
  client_profile_id: string | null;
  service_id: string | null;
  recurrence: "one_off" | "weekly";
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  recurrence_interval_weeks: number;
  status: "confirmed" | "cancelled";
  is_barter: boolean;
  is_blocked: boolean;
  is_break: boolean;
  no_show: boolean;
  price_charged: number | null;
};

type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function dayOfWeekOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Same recurrence-expansion rule used across the Calendar's own query
// layer (src/lib/queries/barber-calendar.ts, barber-schedule.ts) —
// duplicated rather than imported since those files are shared with
// pages outside this task's scope and aren't touched here.
function occursOnDate(booking: Pick<BookingRow, "recurrence" | "start_date" | "end_date" | "recurrence_interval_weeks">, date: string, dayOfWeek: number): boolean {
  if (booking.recurrence === "one_off") return booking.start_date === date;
  const bookingDow = new Date(`${booking.start_date}T00:00:00Z`).getUTCDay();
  if (bookingDow !== dayOfWeek) return false;
  if (date < booking.start_date) return false;
  if (booking.end_date && date > booking.end_date) return false;
  const intervalDays = (booking.recurrence_interval_weeks || 1) * 7;
  const diffDays = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${booking.start_date}T00:00:00Z`)) / 86400000);
  return diffDays % intervalDays === 0;
}

function startOfWeekMonday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const mondayIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d.toISOString().slice(0, 10);
}

/** Inclusive [start, end] date range covering the selected period. */
export function periodRange(period: Period, date: string): { start: string; end: string } {
  const [y, m] = date.split("-").map(Number);
  if (period === "day") return { start: date, end: date };
  if (period === "week") {
    const start = startOfWeekMonday(date);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { start: `${date.slice(0, 7)}-01`, end: `${date.slice(0, 7)}-${String(daysInMonth).padStart(2, "0")}` };
  }
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

type Occurrence = {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  serviceId: string | null;
  clientProfileId: string | null;
  isBarter: boolean;
  isWalkIn: boolean;
  noShow: boolean;
  priceCharged: number | null;
};

type PeriodData = {
  occurrences: Occurrence[]; // real, non-blocked bookings (appointment/walk-in/barter) occurring in the period
  effectiveMinutes: number; // scheduled open time minus break/blocked time
  cancelledCount: number; // cancelled booking ROWS anchored (by start_date) in the period — see note below
};

/**
 * Walks every real calendar date in [start, end], expanding recurring
 * bookings via occursOnDate exactly as the Calendar does, and:
 *  - sums Effective Working Time (barber_availability windows minus
 *    any is_blocked booking that day — covers both Break and Blocked,
 *    since is_break is only ever true alongside is_blocked),
 *  - collects one Occurrence per real, non-blocked booking (normal
 *    appointment / walk-in / barter) that actually falls on that day.
 *
 * Cancelled bookings are counted once per ROW (anchored to their own
 * start_date), not expanded per-occurrence: a cancelled booking's
 * status applies to the whole series, there is no per-occurrence
 * cancellation date recorded, and the Calendar itself already treats
 * a cancelled recurring booking as gone entirely (past and future)
 * rather than tracking which individual weeks it actually ran for —
 * this mirrors that same, already-established precedent.
 */
function computePeriodData(bookings: BookingRow[], availability: AvailabilityRow[], start: string, end: string): PeriodData {
  const availByDow = new Map<number, AvailabilityRow[]>();
  for (const a of availability) {
    if (!availByDow.has(a.day_of_week)) availByDow.set(a.day_of_week, []);
    availByDow.get(a.day_of_week)!.push(a);
  }

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const occurrences: Occurrence[] = [];
  let effectiveMinutes = 0;

  let cursor = start;
  while (cursor <= end) {
    const dow = dayOfWeekOf(cursor);
    const windows = availByDow.get(dow) ?? [];
    const availableMinutes = windows.reduce((sum, w) => sum + Math.max(0, timeToMinutes(w.end_time) - timeToMinutes(w.start_time)), 0);

    const todays = confirmed.filter((b) => occursOnDate(b, cursor, dow));
    let blockedMinutes = 0;
    for (const b of todays) {
      const duration = Math.max(0, timeToMinutes(b.end_time) - timeToMinutes(b.start_time));
      if (b.is_blocked) {
        blockedMinutes += duration;
        continue;
      }
      occurrences.push({
        bookingId: b.id,
        date: cursor,
        startTime: b.start_time,
        endTime: b.end_time,
        durationMinutes: duration,
        serviceId: b.service_id,
        clientProfileId: b.client_profile_id,
        isBarter: b.is_barter,
        isWalkIn: !b.client_profile_id && !b.is_barter,
        noShow: b.no_show,
        priceCharged: b.price_charged,
      });
    }
    effectiveMinutes += Math.max(0, availableMinutes - blockedMinutes);
    cursor = addDays(cursor, 1);
  }

  const cancelledCount = bookings.filter((b) => b.status === "cancelled" && b.start_date >= start && b.start_date <= end).length;

  return { occurrences, effectiveMinutes, cancelledCount };
}

export type ServiceInfo = { id: string; name: string; durationMinutes: number };

export type AnalyticsData = {
  period: Period;
  cashRevenue: { total: number; buckets: { label: string; value: number }[] };
  // No per-bucket breakdown: Effective Working Time is a property of
  // the whole period's availability minus blocked time, not something
  // individual bookings attribute cleanly to a single hour/day bucket
  // — showing a real headline figure only avoids drawing a fabricated
  // breakdown.
  workingHours: { totalMinutes: number };
  perWorkingHour: number | null; // null when effective working time is zero — not calculable
  utilisation: number | null; // null when effective working time is zero
  appointments: { completed: number; noShow: number; cancelled: number; upcoming: number };
  topServices: { serviceId: string; name: string; count: number; revenue: number }[];
  clientActivity: { totalClients: number; newClients: number; returningClients: number; averageSpend: number | null };
  busiestTimes: { label: string; value: number }[];
  quickStats: { servicesCompleted: number; totalClients: number; averageServiceMinutes: number | null; totalCashCollected: number };
};

/** Buckets a period into labeled time slots for the small bar charts — hour-of-day for Day, day-of-week for Week, day-of-month for Month, month for Year. */
function bucketDefs(period: Period, start: string, end: string): { label: string; matches: (occ: Occurrence) => boolean }[] {
  if (period === "day") {
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    return hours.map((h) => ({
      label: h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`,
      matches: (occ: Occurrence) => Math.floor(timeToMinutes(occ.startTime) / 60) === h,
    }));
  }
  if (period === "week") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, i) => ({ label, matches: (occ: Occurrence) => occ.date === addDays(start, i) }));
  }
  if (period === "month") {
    const daysInMonth = new Date(`${end}T00:00:00Z`).getUTCDate();
    const defs: { label: string; matches: (occ: Occurrence) => boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${start.slice(0, 8)}${String(d).padStart(2, "0")}`;
      defs.push({ label: String(d), matches: (occ) => occ.date === date });
    }
    return defs;
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthLabels.map((label, i) => ({
    label,
    matches: (occ: Occurrence) => Number(occ.date.slice(5, 7)) === i + 1,
  }));
}

export async function getBarberAnalytics(
  supabase: SupabaseClient,
  barberProfileId: string,
  period: Period,
  date: string
): Promise<AnalyticsData> {
  const { start, end } = periodRange(period, date);

  const [bookingsRes, availabilityRes, servicesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, client_profile_id, service_id, recurrence, start_date, end_date, start_time, end_time, recurrence_interval_weeks, status, is_barter, is_blocked, is_break, no_show, price_charged"
      )
      .eq("barber_profile_id", barberProfileId),
    supabase
      .from("barber_availability")
      .select("day_of_week, start_time, end_time")
      .eq("barber_profile_id", barberProfileId)
      .eq("is_active", true),
    supabase.from("services").select("id, name, duration_minutes").eq("barber_profile_id", barberProfileId),
  ]);

  const bookings = (bookingsRes.data ?? []) as BookingRow[];
  const availability = (availabilityRes.data ?? []) as AvailabilityRow[];
  const serviceById = new Map<string, ServiceInfo>(
    ((servicesRes.data ?? []) as { id: string; name: string; duration_minutes: number }[]).map((s) => [
      s.id,
      { id: s.id, name: s.name, durationMinutes: s.duration_minutes },
    ])
  );

  const { occurrences, effectiveMinutes, cancelledCount } = computePeriodData(bookings, availability, start, end);

  const today = getShopToday();
  const nowTime = getShopTimeNow();
  const isPast = (occ: Occurrence) => occ.date < today || (occ.date === today && occ.endTime <= nowTime);

  // Cash revenue: real historical price only. Barter and Walk-In are
  // both excluded — barter by design (is_barter always contributes £0
  // regardless of its snapshotted value), Walk-In because
  // price_charged is never populated for it (no reliable real price
  // source — see project notes). A no-show also contributes no
  // revenue: no service was actually performed.
  const revenueOccurrences = occurrences.filter((o) => !o.isBarter && !o.noShow && o.priceCharged != null);
  const cashRevenueTotal = revenueOccurrences.reduce((sum, o) => sum + (o.priceCharged ?? 0), 0);

  const buckets = bucketDefs(period, start, end);
  const cashRevenueBuckets = buckets.map((b) => ({
    label: b.label,
    value: revenueOccurrences.filter(b.matches).reduce((sum, o) => sum + (o.priceCharged ?? 0), 0),
  }));
  const busiestTimes = buckets.map((b) => ({ label: b.label, value: occurrences.filter(b.matches).length }));

  // Utilisation: booked/barbering time (every real, non-blocked
  // booking — a no-show still occupied the slot, so it still counts
  // as "booked" for schedule-fullness purposes even though it earned
  // no revenue) over Effective Working Time.
  const bookedMinutes = occurrences.reduce((sum, o) => sum + o.durationMinutes, 0);
  const utilisation = effectiveMinutes > 0 ? Math.round((bookedMinutes / effectiveMinutes) * 100) : null;
  const perWorkingHour = effectiveMinutes > 0 ? cashRevenueTotal / (effectiveMinutes / 60) : null;

  const completed = occurrences.filter((o) => !o.noShow && isPast(o)).length;
  const noShow = occurrences.filter((o) => o.noShow).length;
  const upcoming = occurrences.filter((o) => !o.noShow && !isPast(o)).length;

  const topServicesMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const o of occurrences) {
    if (!o.serviceId) continue;
    const name = serviceById.get(o.serviceId)?.name ?? "Unknown service";
    const entry = topServicesMap.get(o.serviceId) ?? { name, count: 0, revenue: 0 };
    entry.count += 1;
    if (!o.isBarter && !o.noShow && o.priceCharged != null) entry.revenue += o.priceCharged;
    topServicesMap.set(o.serviceId, entry);
  }
  const topServices = [...topServicesMap.entries()]
    .map(([serviceId, v]) => ({ serviceId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const clientIds = [...new Set(occurrences.map((o) => o.clientProfileId).filter((id): id is string => Boolean(id)))];
  let newClients = 0;
  let returningClients = 0;
  if (clientIds.length > 0) {
    const firstBookingByClient = new Map<string, string>();
    for (const b of bookings) {
      if (b.status !== "confirmed" || !b.client_profile_id) continue;
      const existing = firstBookingByClient.get(b.client_profile_id);
      if (!existing || b.start_date < existing) firstBookingByClient.set(b.client_profile_id, b.start_date);
    }
    for (const id of clientIds) {
      const first = firstBookingByClient.get(id);
      if (first && first >= start && first <= end) newClients += 1;
      else returningClients += 1;
    }
  }
  const payingClientIds = new Set(revenueOccurrences.map((o) => o.clientProfileId).filter((id): id is string => Boolean(id)));
  const averageSpend = payingClientIds.size > 0 ? cashRevenueTotal / payingClientIds.size : null;

  const averageServiceMinutes = occurrences.length > 0 ? bookedMinutes / occurrences.length : null;

  return {
    period,
    cashRevenue: { total: cashRevenueTotal, buckets: cashRevenueBuckets },
    workingHours: { totalMinutes: effectiveMinutes },
    perWorkingHour,
    utilisation,
    appointments: { completed, noShow, cancelled: cancelledCount, upcoming },
    topServices,
    clientActivity: { totalClients: clientIds.length, newClients, returningClients, averageSpend },
    busiestTimes,
    quickStats: {
      servicesCompleted: completed,
      totalClients: clientIds.length,
      averageServiceMinutes,
      totalCashCollected: cashRevenueTotal,
    },
  };
}
