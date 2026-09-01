import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ScheduledBooking = {
  id: string;
  clientProfileId: string;
  clientName: string;
  recurrence: "one_off" | "weekly";
  startTime: string;
  endTime: string;
};

type BookingRow = {
  id: string;
  client_profile_id: string;
  recurrence: "one_off" | "weekly";
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
};

function occursOnDate(
  booking: Pick<BookingRow, "recurrence" | "start_date" | "end_date">,
  date: string,
  dayOfWeek: number
): boolean {
  if (booking.recurrence === "one_off") {
    return booking.start_date === date;
  }
  const bookingDayOfWeek = new Date(
    `${booking.start_date}T00:00:00Z`
  ).getUTCDay();
  if (bookingDayOfWeek !== dayOfWeek) return false;
  if (date < booking.start_date) return false;
  if (booking.end_date && date > booking.end_date) return false;
  return true;
}

/**
 * The calling barber's own confirmed bookings that occur on `date`,
 * with the client's name resolved. Bookings are stored as one row per
 * one-off booking or weekly series (not one row per occurrence), so
 * "occurs on this date" is computed here for display — this is a
 * read-side convenience, not a security boundary (RLS already scopes
 * the underlying rows to the barber's own via "bookings: barber reads
 * own"; conflict/availability enforcement stays exclusively in
 * create_or_reschedule_booking(), untouched by this).
 */
export async function getBarberBookingsForDate(
  supabase: SupabaseClient,
  barberProfileId: string,
  date: string
): Promise<ScheduledBooking[]> {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const { data: allBookings } = await supabase
    .from("bookings")
    .select(
      "id, client_profile_id, recurrence, start_date, end_date, start_time, end_time"
    )
    .eq("barber_profile_id", barberProfileId)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true });

  const todays = ((allBookings ?? []) as BookingRow[]).filter((booking) =>
    occursOnDate(booking, date, dayOfWeek)
  );

  const clientIds = [...new Set(todays.map((b) => b.client_profile_id))];

  const { data: clientProfiles } =
    clientIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds)
      : { data: [] as { id: string; full_name: string }[] };

  const nameById = new Map(
    ((clientProfiles ?? []) as { id: string; full_name: string }[]).map(
      (p) => [p.id, p.full_name]
    )
  );

  return todays.map((b) => ({
    id: b.id,
    clientProfileId: b.client_profile_id,
    clientName: nameById.get(b.client_profile_id) ?? "Unknown client",
    recurrence: b.recurrence,
    startTime: b.start_time,
    endTime: b.end_time,
  }));
}
