import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday, formatTime12h } from "@/lib/dates";
import { RescheduleSlotForm } from "./reschedule-slot-form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. The booking lookup is scoped to barber_profile_id =
// user.id and status = confirmed — a booking that isn't the caller's
// own, or isn't confirmed, is treated as not found. Occupied slots
// show the actual client name (the barber already sees full identity
// on the schedule itself) rather than an anonymous "BOOKED" — that
// anonymization is specifically for the client-facing booking views.
export default async function BarberRescheduleBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, user } = await requireRole("barber");
  const { bookingId } = await params;
  const { date: rawDate } = await searchParams;

  if (!UUID_RE.test(bookingId)) {
    notFound();
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_profile_id, recurrence")
    .eq("id", bookingId)
    .eq("barber_profile_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!booking) {
    notFound();
  }

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", booking.client_profile_id)
    .maybeSingle();

  const today = getShopToday();
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [{ data: slotRows }, dayBookings] = await Promise.all([
    supabase
      .from("barber_availability")
      .select("start_time, end_time")
      .eq("barber_profile_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time", { ascending: true }),
    getBarberBookingsForDate(supabase, user.id, date),
  ]);

  const slots = slotRows ?? [];
  // Excludes the booking being rescheduled from the occupied set, so
  // its own current slot (if it falls on the viewed day) isn't shown
  // as unavailable to itself.
  const occupiedByStartTime = new Map(
    dayBookings
      .filter((b) => b.id !== bookingId)
      .map((b) => [b.startTime, b.clientName])
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Reschedule appointment
      </h1>
      <p className="mt-1 text-sm text-polar-muted">
        {clientProfile?.full_name ?? "Client"} —{" "}
        {booking.recurrence === "weekly"
          ? "weekly booking, whole series moves"
          : "one-off booking"}
      </p>

      <form method="get" className="mt-4 flex items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            Date
          </span>
          <input
            name="date"
            type="date"
            defaultValue={date}
            min={today}
            className="rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          />
        </label>
        <button
          type="submit"
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          View
        </button>
      </form>

      {slots.length === 0 ? (
        <p className="mt-6 text-sm text-polar-muted">
          No availability on this day.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {slots.map((slot) => {
            const occupiedBy = occupiedByStartTime.get(slot.start_time);
            return (
              <li
                key={slot.start_time}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <span className="text-sm text-polar-text">
                  {formatTime12h(slot.start_time)}–{formatTime12h(slot.end_time)}
                </span>
                {occupiedBy ? (
                  <span className="text-xs font-medium text-polar-muted">
                    Booked: {occupiedBy}
                  </span>
                ) : (
                  <RescheduleSlotForm
                    bookingId={bookingId}
                    date={date}
                    startTime={slot.start_time}
                    endTime={slot.end_time}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
