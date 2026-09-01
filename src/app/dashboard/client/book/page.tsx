import { requireRole } from "@/lib/auth/require-role";
import { BookSlotForm } from "./book-slot-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Solo-barber V1: the barber to book with is resolved
// from any active barber_availability row, since a client is already
// permitted to read those under the existing "any client reads
// active" RLS policy — no barber directory/search, and no new
// schema/RLS/function was needed for this.
export default async function ClientBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase } = await requireRole("client");
  const { date: rawDate } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const { data: barberRow } = await supabase
    .from("barber_availability")
    .select("barber_profile_id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const barberId = barberRow?.barber_profile_id as string | undefined;

  let slots: { start_time: string; end_time: string }[] = [];
  let bookedStartTimes = new Set<string>();

  if (barberId) {
    const [{ data: slotRows }, { data: bookedRows }] = await Promise.all([
      supabase
        .from("barber_availability")
        .select("start_time, end_time")
        .eq("barber_profile_id", barberId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time", { ascending: true }),
      supabase.rpc("get_barber_booked_slots", {
        target_barber_id: barberId,
        from_date: date,
        to_date: date,
      }),
    ]);

    slots = slotRows ?? [];
    bookedStartTimes = new Set(
      ((bookedRows ?? []) as { start_time: string }[]).map(
        (row) => row.start_time
      )
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Book an appointment
      </h1>

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

      {!barberId ? (
        <p className="mt-6 text-sm text-polar-muted">
          No availability has been set up yet.
        </p>
      ) : slots.length === 0 ? (
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
                  <BookSlotForm
                    barberId={barberId}
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
