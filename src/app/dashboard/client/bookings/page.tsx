import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
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

type WorkAddressRow = {
  work_address_line_1: string | null;
  work_address_line_2: string | null;
  work_town_city: string | null;
  work_county_region: string | null;
  work_postcode: string | null;
  work_country: string | null;
};

function formatWorkAddress(row: WorkAddressRow | null): string | null {
  if (!row) return null;
  const parts = [
    row.work_address_line_1,
    row.work_address_line_2,
    row.work_town_city,
    row.work_county_region,
    row.work_postcode,
    row.work_country,
  ].filter((part): part is string => Boolean(part && part.trim() !== ""));
  return parts.length > 0 ? parts.join(", ") : null;
}

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. The list is scoped to the caller's own bookings by
// both the query (.eq("client_profile_id", user.id)) and the existing
// RLS policy (bookings: client reads own).
//
// The work address comes exclusively from the existing
// get_barber_work_address() RPC — it already returns nothing unless
// the caller has a CONFIRMED booking with this barber, and never
// returns home-address fields (nor falls back to them when
// work_same_as_home is true) even then. No new address access path is
// added here; this just displays what that function already decided
// is safe to show.
export default async function MyBookingsPage() {
  const { supabase, user } = await requireRole("client");

  const [{ data: bookings }, { data: workAddressRows }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, recurrence, start_date, end_date, start_time, end_time, status"
      )
      .eq("client_profile_id", user.id)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.rpc("get_barber_work_address", {
      target_barber_id: POLAR_BARBER_PROFILE_ID,
    }),
  ]);

  const myBookings = bookings ?? [];
  const workAddress = formatWorkAddress(
    ((workAddressRows as WorkAddressRow[] | null) ?? [])[0] ?? null
  );

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
                {booking.status === "confirmed" && workAddress && (
                  <div className="mt-1 text-xs text-polar-muted">
                    Address: {workAddress}
                  </div>
                )}
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
