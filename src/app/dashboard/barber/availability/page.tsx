import { requireRole } from "@/lib/auth/require-role";
import { setAvailabilityActive } from "@/lib/actions/barber-availability";
import { AddSlotForm } from "./add-slot-form";

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
// barber page. The list is scoped to this barber's own slots by both
// the query (.eq("barber_profile_id", user.id)) and the existing
// RLS policy (barber_availability: barber manages own).
export default async function BarberAvailabilityPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: slots } = await supabase
    .from("barber_availability")
    .select("id, day_of_week, start_time, end_time, is_active")
    .eq("barber_profile_id", user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const availability = slots ?? [];

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Availability</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Add a slot</h2>
        <AddSlotForm />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Your weekly slots
        </h2>
        {availability.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {availability.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <div className="text-sm text-polar-text">
                  {DAY_LABELS[slot.day_of_week]}{" "}
                  {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                  <span className="ml-2 text-xs text-polar-muted">
                    {slot.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <form action={setAvailabilityActive}>
                  <input type="hidden" name="slot_id" value={slot.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={slot.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                  >
                    {slot.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">
            No availability set yet.
          </p>
        )}
      </section>
    </main>
  );
}
