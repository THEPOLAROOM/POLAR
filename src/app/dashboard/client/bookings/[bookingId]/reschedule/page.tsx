import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
import { RescheduleSlotForm } from "./reschedule-slot-form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. The booking lookup below is additionally scoped by
// both the query (client_profile_id = user.id, status = confirmed)
// and the existing RLS policy (bookings: client reads own) — a
// booking that isn't the caller's own, or isn't confirmed, is treated
// as not found, same as the Client Profile Card pattern.
export default async function RescheduleBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, user } = await requireRole("client");
  const { bookingId } = await params;
  const { date: rawDate } = await searchParams;

  if (!UUID_RE.test(bookingId)) {
    notFound();
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, recurrence")
    .eq("id", bookingId)
    .eq("client_profile_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!booking) {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [{ data: slotRows }, { data: bookedRows }] = await Promise.all([
    supabase
      .from("barber_availability")
      .select("start_time, end_time")
      .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time", { ascending: true }),
    supabase.rpc("get_barber_booked_slots", {
      target_barber_id: POLAR_BARBER_PROFILE_ID,
      from_date: date,
      to_date: date,
    }),
  ]);

  const slots = slotRows ?? [];
  const bookedStartTimes = new Set(
    ((bookedRows ?? []) as { start_time: string }[]).map(
      (row) => row.start_time
    )
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Reschedule appointment
      </h1>
      <p className="mt-1 text-sm text-polar-muted">
        {booking.recurrence === "weekly"
          ? "Weekly booking — the whole series moves to the new day/time."
          : "One-off booking"}
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
            const isBooked = bookedStartTimes.has(slot.start_time);
            return (
              <li
                key={slot.start_time}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <span className="text-sm text-polar-text">
                  {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                </span>
                {isBooked ? (
                  <span className="text-xs font-medium text-polar-muted">
                    BOOKED
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
