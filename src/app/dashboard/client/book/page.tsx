import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
import { getShopToday, formatTime12h } from "@/lib/dates";
import { BookSlotForm } from "./book-slot-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ServiceRow = { id: string; name: string; duration_minutes: number };

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Solo-barber V1: the barber to book with is the
// fixed POLAR_BARBER_PROFILE_ID — no barber directory/search, and no
// implicit resolution from readable data.
//
// The client chooses a service and a start time only — the finish
// time is always calculated by create_or_reschedule_booking() from
// that service's duration; there is no end-time input anywhere here.
export default async function ClientBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; service_id?: string }>;
}) {
  const { supabase } = await requireRole("client");
  const { date: rawDate, service_id: rawServiceId } = await searchParams;

  const today = getShopToday();
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [{ data: slotRows }, { data: bookedRows }, { data: activeServices }] =
    await Promise.all([
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
      supabase
        .from("services")
        .select("id, name, duration_minutes")
        .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  const slots = slotRows ?? [];
  const bookedStartTimes = new Set(
    ((bookedRows ?? []) as { start_time: string }[]).map(
      (row) => row.start_time
    )
  );
  const services = (activeServices ?? []) as ServiceRow[];
  const serviceId =
    rawServiceId && services.some((s) => s.id === rawServiceId)
      ? rawServiceId
      : null;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Book an appointment
      </h1>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            Service
          </span>
          <select
            name="service_id"
            defaultValue={serviceId ?? ""}
            className="rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          >
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration_minutes} min)
              </option>
            ))}
          </select>
        </label>
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

      {services.length === 0 ? (
        <p className="mt-6 text-sm text-polar-muted">
          This barber hasn&apos;t added any services yet.
        </p>
      ) : !serviceId ? (
        <p className="mt-6 text-sm text-polar-muted">
          Choose a service above to see available times.
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
                  {formatTime12h(slot.start_time)}
                </span>
                {isBooked ? (
                  <span className="text-xs font-medium text-polar-muted">
                    BOOKED
                  </span>
                ) : (
                  <BookSlotForm
                    date={date}
                    serviceId={serviceId}
                    startTime={slot.start_time}
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
