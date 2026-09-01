import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { CancelBookingButton } from "./cancel-booking-button";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. The list is scoped to the caller's own bookings by
// both the query (.eq("client_profile_id", user.id)) and the existing
// RLS policy (bookings: client reads own).
export default async function MyBookingsPage() {
  const { supabase, user } = await requireRole("client");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, recurrence, start_date, end_date, start_time, end_time, status")
    .eq("client_profile_id", user.id)
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true });

  const myBookings = bookings ?? [];

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">My Bookings</h1>

      {myBookings.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {myBookings.map((booking) => {
            const dayLabel =
              DAY_LABELS[new Date(`${booking.start_date}T00:00:00Z`).getUTCDay()];
            return (
              <li
                key={booking.id}
                className="rounded border border-polar-border px-3 py-2"
              >
                <div className="text-sm text-polar-text">
                  {booking.recurrence === "weekly" ? (
                    <>
                      Weekly, {dayLabel}s from {booking.start_date}
                      {booking.end_date ? ` until ${booking.end_date}` : ""}
                    </>
                  ) : (
                    <>{booking.start_date}</>
                  )}{" "}
                  {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
                </div>
                <div className="mt-1 text-xs text-polar-muted">
                  {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
                </div>
                {booking.status === "confirmed" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      href={`/dashboard/client/bookings/${booking.id}/reschedule`}
                      className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                    >
                      Reschedule
                    </Link>
                    <CancelBookingButton bookingId={booking.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-polar-muted">No bookings yet.</p>
      )}
    </main>
  );
}
