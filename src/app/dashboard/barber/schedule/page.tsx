import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { CancelBookingButton } from "./cancel-booking-button";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Unlike the client-facing booking views, the barber can
// see full client identity here — that's the whole point of a
// schedule — via the existing "bookings: barber reads own" RLS
// policy, no new access.
//
// Cancel/reschedule use the dedicated barber-only RPCs
// (cancel_booking_as_barber / reschedule_booking_as_barber) — the
// client-facing cancel_booking()/create_or_reschedule_booking() are
// untouched and remain client-only, exactly as before.
export default async function BarberSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, user } = await requireRole("barber");
  const { date: rawDate } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;

  const bookings = await getBarberBookingsForDate(supabase, user.id, date);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Schedule</h1>

      <form method="get" className="mt-4 flex items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            Date
          </span>
          <input
            name="date"
            type="date"
            defaultValue={date}
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

      {bookings.length === 0 ? (
        <p className="mt-6 text-sm text-polar-muted">
          No appointments on this day.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
            >
              <div className="text-sm text-polar-text">
                {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}{" "}
                — {booking.clientName}
                <span className="ml-2 text-xs text-polar-muted">
                  {booking.recurrence === "weekly" ? "Weekly" : "One-off"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/barber/clients/${booking.clientProfileId}`}
                  className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                >
                  View client
                </Link>
                <Link
                  href={`/dashboard/barber/schedule/${booking.id}/reschedule`}
                  className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                >
                  Reschedule
                </Link>
                <CancelBookingButton bookingId={booking.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
