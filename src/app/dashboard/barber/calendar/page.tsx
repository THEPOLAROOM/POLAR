import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday, formatTime12h } from "@/lib/dates";
import { CancelBookingButton } from "../schedule/cancel-booking-button";
import { ShiftView } from "../shift/shift-view";
import { WalkInForm } from "./walk-in-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ServiceRow = { id: string; name: string; duration_minutes: number };

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. This is now the one primary Calendar area — it
// consolidates what used to be three separate top-level pages
// (Schedule, Availability, Active Shift) by reusing their existing,
// unchanged code rather than rebuilding it:
//   - the day's appointment list + reschedule/cancel controls are the
//     same query and the same CancelBookingButton/reschedule route
//     the old Schedule page used;
//   - the "current/next appointment" workflow reuses ShiftView as-is,
//     shown only when the selected date is today (that concept only
//     makes sense live);
//   - Availability (the weekly working-hours template) stays its own
//     page/route — reachable via the link below — since merging its
//     distinct form/list into this page would mean rebuilding rather
//     than reusing it.
// Walk-In depends on the proposed services/create_walk_in migration
// (not yet applied) — see walk-in-form.tsx / walk-ins.ts.
export default async function BarberCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, user } = await requireRole("barber");
  const { date: rawDate } = await searchParams;

  const today = getShopToday();
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;

  const [bookings, { data: activeServices }] = await Promise.all([
    getBarberBookingsForDate(supabase, user.id, date),
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("barber_profile_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const services = (activeServices ?? []) as ServiceRow[];

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-polar-text">Calendar</h1>
        <Link
          href="/dashboard/barber/availability"
          className="text-sm text-polar-text underline"
        >
          Edit availability
        </Link>
      </div>

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

      <section className="mt-6">
        <WalkInForm date={date} services={services} />
      </section>

      {date === today && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-polar-text">
            Active Shift
          </h2>
          <ShiftView bookings={bookings} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          {date === today ? "Today's appointments" : "Appointments"}
        </h2>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-polar-muted">
            No appointments on this day.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <div className="text-sm text-polar-text">
                  {formatTime12h(booking.startTime)}–
                  {formatTime12h(booking.endTime)} — {booking.clientName}
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
      </section>
    </main>
  );
}
